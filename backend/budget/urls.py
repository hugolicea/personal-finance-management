from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    BankAccountViewSet,
    CategoryDeletionRuleViewSet,
    CategoryViewSet,
    HeritageViewSet,
    InvestmentViewSet,
    ReclassificationRuleViewSet,
    RetirementAccountViewSet,
    TransactionViewSet,
    backup_database,
    balance_by_period,
    bulk_delete_transactions_by_category,
    bulk_execute_reclassification_rules,
    bulk_reclassify_transactions,
    category_spending_by_period,
    preview_reclassification_rule,
    restore_database,
    upload_bank_statement,
)

router = DefaultRouter()
router.register(r"bank-accounts", BankAccountViewSet)
router.register(r"categories", CategoryViewSet)
router.register(r"heritages", HeritageViewSet)
router.register(r"investments", InvestmentViewSet)
router.register(r"retirement-accounts", RetirementAccountViewSet)
router.register(r"transactions", TransactionViewSet)
router.register(r"reclassification-rules", ReclassificationRuleViewSet)
router.register(r"category-deletion-rules", CategoryDeletionRuleViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("balance/<str:period>/", balance_by_period, name="balance_by_period"),
    path(
        "category-spending/<str:period>/",
        category_spending_by_period,
        name="category_spending_by_period",
    ),
    path(
        "upload-bank-statement/",
        upload_bank_statement,
        name="upload_bank_statement",
    ),
    path(
        "bulk-reclassify-transactions/",
        bulk_reclassify_transactions,
        name="bulk_reclassify_transactions",
    ),
    path(
        "bulk-execute-reclassification-rules/",
        bulk_execute_reclassification_rules,
        name="bulk_execute_reclassification_rules",
    ),
    path(
        "preview-reclassification-rule/",
        preview_reclassification_rule,
        name="preview_reclassification_rule",
    ),
    path(
        "bulk-delete-transactions/",
        bulk_delete_transactions_by_category,
        name="bulk_delete_transactions_by_category",
    ),
    path("backup/", backup_database, name="backup_database"),
    path("restore/", restore_database, name="restore_database"),
]
