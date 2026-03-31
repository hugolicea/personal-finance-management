from collections.abc import Callable
from typing import Any

from django.db import transaction

BackupProvider = Callable[..., dict[str, list[dict[str, Any]]]]
RestoreProvider = Callable[..., dict[str, int]]

_backup_providers: list[tuple[str, BackupProvider]] = []
_restore_providers: list[tuple[str, RestoreProvider]] = []


def register_backup_provider(
    domain_key: str,
    backup_fn: BackupProvider,
    restore_fn: RestoreProvider,
) -> None:
    """Register backup/restore providers for a domain.

    Re-registering a domain replaces its previous providers to avoid duplicate
    execution during Django autoreload.
    """
    _backup_providers[:] = [
        (key, fn) for key, fn in _backup_providers if key != domain_key
    ]
    _restore_providers[:] = [
        (key, fn) for key, fn in _restore_providers if key != domain_key
    ]
    _backup_providers.append((domain_key, backup_fn))
    _restore_providers.append((domain_key, restore_fn))


def backup_all(user: Any, **kwargs: Any) -> dict[str, list[dict[str, Any]]]:
    """Collect backup data from all registered domain providers."""
    merged: dict[str, list[dict[str, Any]]] = {}
    for _, backup_fn in _backup_providers:
        domain_data = backup_fn(user, **kwargs)
        for key, value in domain_data.items():
            merged[key] = value
    return merged


@transaction.atomic
def restore_all(
    user: Any, data: dict[str, Any], clear_existing: bool = False
) -> dict[str, int]:
    """Restore data for all registered domain providers atomically."""
    summary: dict[str, int] = {}
    for _, restore_fn in _restore_providers:
        domain_summary = restore_fn(user, data, clear_existing=clear_existing)
        summary.update(domain_summary)
    return summary
