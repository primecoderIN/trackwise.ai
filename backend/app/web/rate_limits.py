"""Rate limits on expensive and unauthenticated routes (web layer, D194).

- Model-backed routes (`POST /agent`, `/chat`, `/parse`): per-person minute and day allowances (`model_quota`).
  `/agent` consumes quota via `consume_model_quota` only after input validation and only when a run will call a model
  (Approve/Cancel clicks never burn quota or get blocked by 429).
- Expensive non-model routes (`GET /reports/monthly/*` spawns a child Python process; `POST /receipts` writes files):
  per-person allowances (`reports_quota`, `receipts_quota`).
- Unauthenticated sign-in routes (`GET /auth/login`, `POST /auth/backchannel-logout`): per-client-IP allowance
  (`auth_quota`) so anonymous floods cannot evict in-flight login attempts or starve JWKS refreshes.

The limiters (core/rate_limit.py) are built by the composition root and attached to `app.state` by main.py. A refusal
is a 429 problem with Retry-After, in the request's language.
"""

from fastapi import Depends, Request

from app.core.errors import TooManyRequestsError
from app.core.i18n import translatable
from app.core.identity import Principal
from app.core.rate_limit import RateLimiter, Window
from app.web.auth import CurrentUserDep
from app.web.i18n import WebText


def consume_model_quota(request: Request, principal: Principal) -> None:
    """Count one model-backed request for `principal`. Raises TooManyRequestsError (429) when spent."""
    limiter: RateLimiter = request.app.state.model_quota
    refusal = limiter.take(principal.user_id)
    if refusal is None:
        return
    reason = WebText.DAILY_LIMIT if refusal.window is Window.DAY else WebText.TOO_FAST
    raise TooManyRequestsError(translatable(reason), refusal.retry_after_seconds)


def require_model_quota(request: Request, principal: CurrentUserDep) -> None:
    """Route dependency for `/parse` and `/chat`: counts one model request for the signed-in person."""
    consume_model_quota(request, principal)


def _enforce_user_limit(limiter: RateLimiter | None, user_id: int) -> None:
    """Count one request for `user_id` against `limiter`, raising 429 with Retry-After if exceeded."""
    if limiter is None:
        return
    refusal = limiter.take(user_id)
    if refusal is not None:
        raise TooManyRequestsError(translatable(WebText.RATE_LIMITED), refusal.retry_after_seconds)


def require_report_quota(request: Request, principal: CurrentUserDep) -> None:
    """Per-person rate limit on monthly report generation (which spawns a Python child process)."""
    _enforce_user_limit(getattr(request.app.state, "report_quota", None), principal.user_id)


def require_receipt_quota(request: Request, principal: CurrentUserDep) -> None:
    """Per-person rate limit on receipt file uploads."""
    _enforce_user_limit(getattr(request.app.state, "receipt_quota", None), principal.user_id)


def require_auth_quota(request: Request) -> None:
    """Per-client-IP rate limit on unauthenticated auth endpoints (/auth/login, /auth/backchannel-logout)."""
    limiter: RateLimiter | None = getattr(request.app.state, "auth_quota", None)
    if limiter is None:
        return
    client_key = request.client.host if request.client and request.client.host else "unknown"
    refusal = limiter.take(client_key)
    if refusal is not None:
        raise TooManyRequestsError(translatable(WebText.RATE_LIMITED), refusal.retry_after_seconds)


# Route dependencies: `dependencies=[MODEL_QUOTA]` / `REPORTS_QUOTA` / `RECEIPTS_QUOTA` / `AUTH_QUOTA`.
MODEL_QUOTA = Depends(require_model_quota)
REPORTS_QUOTA = Depends(require_report_quota)
RECEIPTS_QUOTA = Depends(require_receipt_quota)
AUTH_QUOTA = Depends(require_auth_quota)
