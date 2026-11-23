"""HTTP routes for budgets. Each one only translates between HTTP and commands or queries.

The budgets module's REST adapter. The composition root mounts `router` under /api/v1, behind the session and X-CSRF
checks; the routes read the bus and the clock from the request (web/dependencies). The web app's Budgets page and the
Dashboard's budget card call them. Every route acts for the signed-in person: the owner of every message is their id,
never something the request says (D190). A route's docstring would become its OpenAPI text, so notes are `#`
comments. No try/except: errors become problem details in web/problems.py.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request
from fastapi.exceptions import RequestValidationError

from app.core.clock import clock_today
from app.core.months import YearMonth
from app.modules.budgets.commands.remove_budget import RemoveBudget
from app.modules.budgets.commands.set_budget import BudgetChange, SetBudget
from app.modules.budgets.queries.get_budget_status import BudgetStatus, GetBudgetStatus
from app.web.auth import CurrentUserDep
from app.web.dependencies import BusDep, ClockDep, IdPath

router = APIRouter(tags=["budgets"])


def _only_query(*allowed: str) -> Any:
    """Route dependency refusing any query parameter not in `allowed` with a 422 validation problem."""
    allowed_set = frozenset(allowed)

    def check(request: Request) -> None:
        unexpected = [name for name in request.query_params if name not in allowed_set]
        if unexpected:
            raise RequestValidationError(
                [
                    {"type": "extra_forbidden", "loc": ("query", name), "msg": "Extra inputs are not permitted"}
                    for name in unexpected
                ]
            )

    return Depends(check)


# GET /api/v1/budgets?month=2026-11: the month's spending (in INR) against the signed-in person's budgets: the overall
# line and one line per category. Without `month`, the current month in the user's time zone.
@router.get("/budgets", dependencies=[_only_query("month")])
def get_budget_status(
    principal: CurrentUserDep,
    bus: BusDep,
    clock: ClockDep,
    month: Annotated[str | None, Query(pattern=YearMonth.PATTERN, examples=["2026-11"])] = None,
) -> BudgetStatus:
    today = clock_today(clock, principal.timezone)
    which = YearMonth.of(today) if month is None else YearMonth.parse(month)
    return bus.ask(GetBudgetStatus(owner_id=principal.user_id, month=which, today=today))


# PUT /api/v1/budgets/overall: set the monthly limit for all spending together; the body is {"limit": "40000"}. 204.
# A limit of 0 or less, or with more than 2 decimals, is a 422.
@router.put("/budgets/overall", status_code=204)
def set_overall_budget(body: BudgetChange, principal: CurrentUserDep, bus: BusDep) -> None:
    bus.execute(SetBudget(owner_id=principal.user_id, limit=body.limit))


# DELETE /api/v1/budgets/overall: remove the overall limit. 204; 404 if there was none.
@router.delete("/budgets/overall", status_code=204)
def remove_overall_budget(principal: CurrentUserDep, bus: BusDep) -> None:
    bus.execute(RemoveBudget(owner_id=principal.user_id))


# PUT /api/v1/budgets/categories/{category_id}: set the monthly limit for one category. 204; a 422 "business-rule"
# problem if the category doesn't exist.
@router.put("/budgets/categories/{category_id}", status_code=204)
def set_category_budget(category_id: IdPath, body: BudgetChange, principal: CurrentUserDep, bus: BusDep) -> None:
    bus.execute(SetBudget(owner_id=principal.user_id, category_id=category_id, limit=body.limit))


# DELETE /api/v1/budgets/categories/{category_id}: remove a category's limit. 204; 404 if there was none.
@router.delete("/budgets/categories/{category_id}", status_code=204)
def remove_category_budget(category_id: IdPath, principal: CurrentUserDep, bus: BusDep) -> None:
    bus.execute(RemoveBudget(owner_id=principal.user_id, category_id=category_id))
