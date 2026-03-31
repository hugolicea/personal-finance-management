from django.contrib import admin

from .models import Heritage, Investment, RetirementAccount


@admin.register(Investment)
class InvestmentAdmin(admin.ModelAdmin):
    list_display = [
        "symbol",
        "name",
        "user",
        "investment_type",
        "quantity",
        "purchase_price",
    ]
    list_filter = ["investment_type", "user"]
    search_fields = ["symbol", "name", "user__email"]
    readonly_fields = ["user"]

    def get_queryset(self, request):
        """Optimize query with select_related to prevent N+1 queries."""
        qs = super().get_queryset(request)
        return qs.select_related("user")


@admin.register(Heritage)
class HeritageAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "heritage_type", "address", "purchase_price"]
    list_filter = ["heritage_type", "user"]
    search_fields = ["name", "address", "user__email"]
    readonly_fields = ["user"]

    def get_queryset(self, request):
        """Optimize query with select_related to prevent N+1 queries."""
        qs = super().get_queryset(request)
        return qs.select_related("user")


@admin.register(RetirementAccount)
class RetirementAccountAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "account_type", "provider", "current_balance"]
    list_filter = ["account_type", "user"]
    search_fields = ["name", "provider", "user__email"]
