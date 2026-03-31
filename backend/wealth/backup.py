from datetime import datetime
from typing import Any


def _backup_wealth_domain(
    user: Any,
    *,
    include: set[str] | None = None,
    multi_user_mode: bool = False,
    user_filter: dict[str, Any] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    from .models import Heritage, Investment, RetirementAccount

    include = include or {"investments", "heritages", "retirement_accounts"}
    user_filter = user_filter or {"user": user}

    def _values(*fields: str) -> tuple[str, ...]:
        return (*fields, "user_id") if multi_user_mode else fields

    domain_data: dict[str, list[dict[str, Any]]] = {}

    if "investments" in include:
        domain_data["investments"] = list(
            Investment.objects.filter(**user_filter).values(
                *_values(
                    "id",
                    "name",
                    "symbol",
                    "investment_type",
                    "quantity",
                    "purchase_price",
                    "current_price",
                    "purchase_date",
                    "principal_amount",
                    "interest_rate",
                    "compounding_frequency",
                    "term_years",
                    "notes",
                )
            )
        )

    if "heritages" in include:
        domain_data["heritages"] = list(
            Heritage.objects.filter(**user_filter).values(
                *_values(
                    "id",
                    "name",
                    "heritage_type",
                    "address",
                    "area",
                    "area_unit",
                    "purchase_price",
                    "current_value",
                    "purchase_date",
                    "monthly_rental_income",
                    "notes",
                )
            )
        )

    if "retirement_accounts" in include:
        domain_data["retirement_accounts"] = list(
            RetirementAccount.objects.filter(**user_filter).values(
                *_values(
                    "id",
                    "name",
                    "account_type",
                    "provider",
                    "account_number",
                    "current_balance",
                    "monthly_contribution",
                    "employer_match_percentage",
                    "employer_match_limit",
                    "risk_level",
                    "target_retirement_age",
                    "notes",
                )
            )
        )

    return domain_data


def _restore_wealth_domain(
    requester: Any,
    data: dict[str, Any],
    *,
    clear_existing: bool = False,
) -> dict[str, int]:
    from django.contrib.auth import get_user_model

    from .models import Heritage, Investment, RetirementAccount

    user_model = get_user_model()
    multi_user_mode = "users" in data

    old_id_to_user: dict[int, Any] = {}
    if multi_user_mode:
        for u in data.get("users", []):
            try:
                obj = user_model.objects.get(username=u["username"])
            except user_model.DoesNotExist:
                continue
            old_id_to_user[u["id"]] = obj

    def resolve_user(entity: dict[str, Any]) -> Any | None:
        uid = entity.get("user_id")
        if uid is not None:
            return old_id_to_user.get(uid)
        return requester

    if clear_existing:
        targets = list(old_id_to_user.values()) if old_id_to_user else [requester]
        for target in targets:
            Investment.objects.filter(user=target).delete()
            Heritage.objects.filter(user=target).delete()
            RetirementAccount.objects.filter(user=target).delete()

    investments_created = 0
    for inv in data.get("investments", []):
        target = resolve_user(inv)
        if target is None:
            continue
        try:
            purchase_date = (
                datetime.fromisoformat(inv["purchase_date"]).date()
                if inv.get("purchase_date")
                else None
            )
        except ValueError:
            purchase_date = None
        Investment.objects.create(
            name=inv.get("name", ""),
            symbol=inv.get("symbol", ""),
            investment_type=inv.get("investment_type", Investment.STOCK),
            quantity=inv.get("quantity", 0),
            purchase_price=inv.get("purchase_price", 0),
            current_price=inv.get("current_price") or None,
            purchase_date=purchase_date,
            principal_amount=inv.get("principal_amount") or None,
            interest_rate=inv.get("interest_rate") or None,
            compounding_frequency=inv.get("compounding_frequency") or None,
            term_years=inv.get("term_years") or None,
            notes=inv.get("notes", ""),
            user=target,
        )
        investments_created += 1

    heritages_created = 0
    for h in data.get("heritages", []):
        target = resolve_user(h)
        if target is None:
            continue
        try:
            purchase_date = (
                datetime.fromisoformat(h["purchase_date"]).date()
                if h.get("purchase_date")
                else None
            )
        except ValueError:
            purchase_date = None
        Heritage.objects.create(
            name=h.get("name", ""),
            heritage_type=h.get("heritage_type", Heritage.HOUSE),
            address=h.get("address", ""),
            area=h.get("area") or None,
            area_unit=h.get("area_unit", "sq_m"),
            purchase_price=h.get("purchase_price", 0),
            current_value=h.get("current_value") or None,
            purchase_date=purchase_date,
            monthly_rental_income=h.get("monthly_rental_income", 0),
            notes=h.get("notes", ""),
            user=target,
        )
        heritages_created += 1

    retirement_created = 0
    for r in data.get("retirement_accounts", []):
        target = resolve_user(r)
        if target is None:
            continue
        RetirementAccount.objects.create(
            name=r.get("name", ""),
            account_type=r.get("account_type", RetirementAccount.TRADITIONAL_401K),
            provider=r.get("provider", ""),
            account_number=r.get("account_number") or None,
            current_balance=r.get("current_balance", 0),
            monthly_contribution=r.get("monthly_contribution", 0),
            employer_match_percentage=r.get("employer_match_percentage", 0),
            employer_match_limit=r.get("employer_match_limit", 0),
            risk_level=r.get("risk_level", RetirementAccount.MODERATE),
            target_retirement_age=r.get("target_retirement_age", 65),
            notes=r.get("notes", ""),
            user=target,
        )
        retirement_created += 1

    return {
        "investments": investments_created,
        "heritages": heritages_created,
        "retirement_accounts": retirement_created,
    }
