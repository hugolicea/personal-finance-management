from django.contrib import admin

from .models import (
    Category,
    CategoryDeletionRule,
    Heritage,
    Investment,
    ReclassificationRule,
    RetirementAccount,
    Transaction,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "classification", "monthly_budget"]
    list_filter = ["classification", "user"]
    search_fields = ["name", "user__email"]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        "description",
        "user",
        "amount",
        "date",
        "category",
        "transaction_type",
    ]
    list_filter = ["transaction_type", "date", "category", "user"]
    search_fields = ["description", "user__email"]
    date_hierarchy = "date"


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


@admin.register(Heritage)
class HeritageAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "heritage_type", "address", "purchase_price"]
    list_filter = ["heritage_type", "user"]
    search_fields = ["name", "address", "user__email"]


@admin.register(RetirementAccount)
class RetirementAccountAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "account_type", "provider", "current_balance"]
    list_filter = ["account_type", "user"]
    search_fields = ["name", "provider", "user__email"]


@admin.register(ReclassificationRule)
class ReclassificationRuleAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "from_category",
        "to_category",
        "is_active",
        "created_at",
    ]
    list_filter = ["is_active", "user", "created_at"]
    search_fields = ["user__email", "from_category__name", "to_category__name"]
    date_hierarchy = "created_at"


@admin.register(CategoryDeletionRule)
class CategoryDeletionRuleAdmin(admin.ModelAdmin):
    list_display = ["user", "category", "is_active", "created_at"]
    list_filter = ["is_active", "user", "created_at"]
    search_fields = ["user__email", "category__name"]
    date_hierarchy = "created_at"
