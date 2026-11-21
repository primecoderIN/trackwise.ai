"""The RemoteAgents port over A2A: A2AAgents, SpendWise as a client agent of its agents (infrastructure, adapter).

The only code in the backend that uses the A2A SDK. For each message it fetches the agent's Agent Card from the
configured address, checks it (the skill asked for, offered over JSON-RPC at that same address: otherwise the key
and the data would go wherever a card said), sends one non-streaming SendMessage with the agent's key and no history
asked back, and turns the finished task into the port's AgentTask (D201). The composition root builds it from the
agents it hosts: one AgentEndpoint and one in-process transport per agent (D207: the agents run inside the backend,
reached through httpx's ASGI transport, with no port of their own); a check can pass transports of its own.

The SDK is async, but its callers run in plain worker threads (FastAPI runs sync routes and streams there), so every
call runs on one long-lived background loop (loop.py), where the in-process agents' state belongs.
"""

import logging
import time
from collections.abc import Callable, Coroutine, Mapping, Sequence
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlsplit
from uuid import uuid4

import httpx
from a2a.client import A2ACardResolver, ClientConfig, create_client
from a2a.helpers import get_data_parts, get_text_parts, new_data_part, new_raw_part, new_text_part
from a2a.types import (
    AgentCard,
    AgentInterface,
    Message,
    Part,
    Role,
    SendMessageConfiguration,
    SendMessageRequest,
    Task,
    TaskState,
)
from a2a.utils.constants import TransportProtocol
from pydantic import SecretStr

from app.core.agents import (
    AgentTask,
    AgentUnavailableError,
    DataPart,
    FilePart,
    SkillCard,
    TaskOutcome,
    TaskRef,
    TextPart,
)
from app.core.agents import Part as PortPart
from app.infrastructure.a2a.loop import BackgroundLoop

logger = logging.getLogger(__name__)

# How long to wait for one task, card included. The receipt agent's one Gemini call may be tried twice for up to
# 60 s each by its adapter: wait a little longer than that.
TIMEOUT_SECONDS = 150
# How long to wait for a card alone (reading what an agent offers, at startup): an agent that's down shouldn't hold
# the backend up.
CARD_TIMEOUT_SECONDS = 5
# Cache verified Agent Cards briefly so writes (currency conversion) don't re-fetch /.well-known on every call.
CARD_CACHE_TTL_SECONDS = 60.0
JSON_MEDIA_TYPE = "application/json"
_DEFAULT_PORTS = {"http": 80, "https": 443}
_OUTCOMES = {
    TaskState.TASK_STATE_COMPLETED: TaskOutcome.COMPLETED,
    TaskState.TASK_STATE_FAILED: TaskOutcome.FAILED,
    TaskState.TASK_STATE_REJECTED: TaskOutcome.REJECTED,
    TaskState.TASK_STATE_INPUT_REQUIRED: TaskOutcome.INPUT_REQUIRED,
}
# Why an agent couldn't be asked, for the log (never shown to a person: D180).
UNKNOWN_AGENT = "no agent named {agent} is configured"
NO_KEY = "{agent}: its key isn't set"
WRONG_CARD = "the card at {url} doesn't offer {skill} over JSON-RPC at that address"
NOT_SERVED_HERE = "the card at {url} doesn't name JSON-RPC at that address"
NO_TASK = "the agent answered without a task"

AsyncCleanup = Callable[[], Coroutine[Any, Any, None]]


@dataclass(frozen=True)
class AgentEndpoint:
    """Where one agent listens (its base URL; the card is under it) and the key it requires (None: not set)."""

    url: str
    key: SecretStr | None


class _NonClosingTransport(httpx.AsyncBaseTransport):
    """Wraps an externally owned transport so closing a per-request AsyncClient never closes the shared transport."""

    def __init__(self, inner: httpx.AsyncBaseTransport) -> None:
        self._inner = inner

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        return await self._inner.handle_async_request(request)

    async def aclose(self) -> None:
        return None


class A2AAgents:
    """RemoteAgents over A2A, to the agents in `endpoints` (by name). `transports` replace the network per agent."""

    def __init__(
        self,
        endpoints: Mapping[str, AgentEndpoint],
        transports: Mapping[str, httpx.AsyncBaseTransport] | None = None,
        cleanups: Sequence[AsyncCleanup] = (),
    ) -> None:
        """Remember where each agent is; nothing is fetched until the first message."""
        self._endpoints = dict(endpoints)
        self._transports = dict(transports or {})
        self._cleanups = tuple(cleanups)
        self._cards: dict[str, tuple[float, AgentCard]] = {}
        self._loop = BackgroundLoop()

    def close(self) -> None:
        """Run any hosted agent cleanups on the background loop and stop the loop thread."""
        if self._cleanups:
            try:
                self._loop.run(self._run_cleanups(), CARD_TIMEOUT_SECONDS)
            except Exception as exc:
                logger.warning("error closing hosted A2A agents: %r", exc)
        self._cards.clear()
        self._loop.close()

    async def _run_cleanups(self) -> None:
        """Invoke all registered async cleanup callbacks (e.g. hosted DefaultRequestHandler.aclose)."""
        for cleanup in self._cleanups:
            await cleanup()

    def skills(self, agent: str) -> list[SkillCard]:
        """The skills `agent`'s card offers, if the card names JSON-RPC at the agent's configured address. Raises
        AgentUnavailableError if it can't be read (unknown agent, unreachable, a timeout, another address)."""
        endpoint = self._endpoint(agent)
        try:
            card = self._loop.run(self._card(agent, endpoint), CARD_TIMEOUT_SECONDS)
        except Exception as exc:  # unreachable, a timeout, a malformed card...
            logger.warning("agent %s's card at %s unreadable: %r", agent, endpoint.url, exc)
            raise AgentUnavailableError(f"{agent}'s card unreadable") from exc
        if _pinned_interface(card, endpoint.url) is None:
            logger.warning("agent %s: %s", agent, NOT_SERVED_HERE.format(url=endpoint.url))
            raise AgentUnavailableError(f"{agent}'s card names another address")
        return [
            SkillCard(agent=agent, skill_id=s.id, name=s.name, description=s.description, examples=tuple(s.examples))
            for s in card.skills
        ]

    def send(
        self, agent: str, skill: str, parts: Sequence[PortPart], artifact: str, resume: TaskRef | None = None
    ) -> AgentTask:
        """Send `parts` to `agent` for `skill` (resuming `resume`'s task if given) and return the task once it ends or
        stops to ask. Raises AgentUnavailableError if it can't be asked (unknown, no key, unreachable, 401, a wrong
        card, a protocol error, an unknown task or a timeout)."""
        endpoint = self._endpoint(agent)
        if endpoint.key is None:
            logger.warning("agent not asked: %s", NO_KEY.format(agent=agent))
            raise AgentUnavailableError(NO_KEY.format(agent=agent))
        sending = self._send(agent, endpoint, skill, [_to_a2a(part) for part in parts], resume)
        try:
            task = self._loop.run(sending, TIMEOUT_SECONDS)
        except Exception as exc:  # unreachable, 401, a bad card, a timeout, a protocol error...
            self._cards.pop(agent, None)
            logger.warning("agent %s at %s unavailable: %r", agent, endpoint.url, exc)
            raise AgentUnavailableError(f"{agent} unavailable") from exc
        return _task_of(task, artifact)

    def _endpoint(self, agent: str) -> AgentEndpoint:
        """The agent's endpoint. Raises AgentUnavailableError for an agent that isn't configured."""
        endpoint = self._endpoints.get(agent)
        if endpoint is None:
            logger.warning("agent not asked: %s", UNKNOWN_AGENT.format(agent=agent))
            raise AgentUnavailableError(UNKNOWN_AGENT.format(agent=agent))
        return endpoint

    def _client_transport(self, agent: str) -> httpx.AsyncBaseTransport | None:
        """Wrap an injected transport so closing an httpx.AsyncClient never closes the caller's transport."""
        transport = self._transports.get(agent)
        return _NonClosingTransport(transport) if transport is not None else None

    async def _card(self, agent: str, endpoint: AgentEndpoint) -> AgentCard:
        """The agent's card, fetched without any bearer key (cards are open) and with CARD_TIMEOUT_SECONDS."""
        transport = self._client_transport(agent)
        async with httpx.AsyncClient(transport=transport, timeout=CARD_TIMEOUT_SECONDS) as http:
            return await A2ACardResolver(httpx_client=http, base_url=endpoint.url.rstrip("/")).get_agent_card()

    async def _verified_card(self, agent: str, endpoint: AgentEndpoint, skill: str) -> AgentCard:
        """Return a card pinned strictly to `endpoint.url` offering `skill`, fetching unauthenticated if uncached."""
        cached = self._cards.get(agent)
        now = time.monotonic()
        if cached is not None and now - cached[0] < CARD_CACHE_TTL_SECONDS:
            card = cached[1]
        else:
            card = await self._card(agent, endpoint)
            self._cards[agent] = (now, card)
        return _pin_card(card, endpoint.url, skill)

    async def _send(
        self, agent: str, endpoint: AgentEndpoint, skill: str, parts: list[Part], resume: TaskRef | None
    ) -> Task:
        """Verify the card unauthenticated, pin it to `endpoint.url`, then send one message with the agent's key."""
        pinned = await self._verified_card(agent, endpoint, skill)
        key = endpoint.key.get_secret_value() if endpoint.key else ""
        headers = {"Authorization": f"Bearer {key}"}
        transport = self._client_transport(agent)
        async with httpx.AsyncClient(transport=transport, headers=headers, timeout=TIMEOUT_SECONDS) as http:
            client = await create_client(pinned, ClientConfig(streaming=False, httpx_client=http))
            message = Message(role=Role.ROLE_USER, message_id=uuid4().hex, parts=parts)
            if resume is not None:
                # Naming the task (and its context) continues it: the agent picks up where it stopped (D206).
                message.task_id, message.context_id = resume.task_id, resume.context_id
            # history_length=0: the answer needn't echo our message (and any file in it) back.
            configuration = SendMessageConfiguration(history_length=0, accepted_output_modes=[JSON_MEDIA_TYPE])
            task = None
            async for response in client.send_message(SendMessageRequest(message=message, configuration=configuration)):
                if response.HasField("task"):
                    task = response.task
        if task is None:
            raise RuntimeError(NO_TASK)
        return task


def _canonical_url(url: str) -> tuple[str, str, int | None, str]:
    """Normalize scheme, hostname, default port and trailing slash so URL pinning can't be tricked by formatting."""
    parts = urlsplit(url.strip())
    scheme = parts.scheme.lower()
    host = (parts.hostname or "").lower()
    port = parts.port or _DEFAULT_PORTS.get(scheme)
    path = parts.path.rstrip("/")
    return (scheme, host, port, path)


def _pinned_interface(card: AgentCard, url: str) -> AgentInterface | None:
    """The JSON-RPC interface on `card` matching `url` canonically, or None."""
    target = _canonical_url(url)
    for interface in card.supported_interfaces:
        if interface.protocol_binding == TransportProtocol.JSONRPC and _canonical_url(interface.url) == target:
            return interface
    return None


def _pin_card(card: AgentCard, url: str, skill: str) -> AgentCard:
    """Verify `card` offers `skill` over JSON-RPC at `url` and return a copy exposing ONLY that verified interface.

    Preventing multi-interface bypasses: if a card advertised an attacker URL first and `url` second, ClientFactory
    would route the bearer key and payload to the first interface unless the card is pinned to the verified one.
    """
    interface = _pinned_interface(card, url)
    if interface is None or not any(offered.id == skill for offered in card.skills):
        raise ValueError(WRONG_CARD.format(url=url, skill=skill))
    pinned = AgentCard()
    pinned.CopyFrom(card)
    del pinned.supported_interfaces[:]
    pinned.supported_interfaces.add().CopyFrom(interface)
    return pinned


def _to_a2a(part: PortPart) -> Part:
    """One of the port's parts as an A2A part."""
    match part:
        case FilePart(data=data, media_type=media_type):
            return new_raw_part(data, media_type)
        case DataPart(data=data):
            return new_data_part(data, JSON_MEDIA_TYPE)
        case TextPart(text=text):
            return new_text_part(text)


def _task_of(task: Task, artifact: str) -> AgentTask:
    """The port's view of a finished task: its ids, outcome, the data of the artifacts named `artifact`, and the
    status message's text."""
    outcome = _OUTCOMES.get(task.status.state, TaskOutcome.OTHER)
    parts = [part for found in task.artifacts if found.name == artifact for part in found.parts]
    message = " ".join(get_text_parts(task.status.message.parts)) if task.status.HasField("message") else ""
    logger.info("agent task %s ended %s", task.id, outcome)
    return AgentTask(
        task_id=task.id,
        context_id=task.context_id,
        outcome=outcome,
        data=get_data_parts(parts),
        message=message or None,
    )
