from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    TransactionViewSet,
    balance_by_period,
    category_spending_by_period,
    upload_bank_statement,
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet)
router.register(r"transactions", TransactionViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("balance/<str:period>/", balance_by_period, name="balance_by_period"),
    path(
        "category-spending/<str:period>/",
        category_spending_by_period,
        name="category_spending_by_period",
    ),
    path("upload-bank-statement/", upload_bank_statement, name="upload_bank_statement"),
]
