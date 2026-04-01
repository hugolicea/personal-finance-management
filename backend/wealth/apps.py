from django.apps import AppConfig


class WealthConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "wealth"

    def ready(self) -> None:
        from core.backup import register_backup_provider

        from .backup import _backup_wealth_domain, _restore_wealth_domain

        register_backup_provider(
            "wealth", _backup_wealth_domain, _restore_wealth_domain
        )
