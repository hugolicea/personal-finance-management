from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.utils import timezone

from rest_framework import serializers

from .models import (
    BankAccount,
    Category,
    CategoryDeletionRule,
    ReclassificationRule,
    Transaction,
)


class UserDetailsSerializer(serializers.ModelSerializer):
    """Extends the default dj_rest_auth user serializer to expose is_staff."""

    class Meta:
        model = get_user_model()
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff"]
        read_only_fields = ["is_staff"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "user",
            "name",
            "classification",
            "monthly_budget",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user"]


class BankAccountSerializer(serializers.ModelSerializer):
    transaction_count = serializers.SerializerMethodField()
    total_balance = serializers.SerializerMethodField()
    current_month_count = serializers.SerializerMethodField()
    current_month_balance = serializers.SerializerMethodField()

    def get_transaction_count(self, instance: BankAccount) -> int:
        # Use queryset annotation when available to avoid N+1 on list endpoints
        if hasattr(instance, "transaction_count"):
            return instance.transaction_count  # type: ignore[return-value]
        return instance.transactions.count()

    def get_total_balance(self, instance: BankAccount) -> float:
        # Use queryset annotation when available to avoid N+1 on list endpoints
        if hasattr(instance, "total_balance"):
            val = instance.total_balance  # type: ignore[attr-defined]
            return float(val) if val is not None else 0.0
        total = instance.transactions.aggregate(total=Sum("amount"))["total"]
        return float(total) if total is not None else 0.0

    def get_current_month_count(self, instance: BankAccount) -> int:
        if hasattr(instance, "current_month_count"):
            return instance.current_month_count  # type: ignore[return-value]
        now = timezone.now()
        return instance.transactions.filter(
            date__year=now.year, date__month=now.month
        ).count()

    def get_current_month_balance(self, instance: BankAccount) -> float:
        if hasattr(instance, "current_month_balance"):
            val = instance.current_month_balance  # type: ignore[attr-defined]
            return float(val) if val is not None else 0.0
        now = timezone.now()
        total = instance.transactions.filter(
            date__year=now.year, date__month=now.month
        ).aggregate(total=Sum("amount"))["total"]
        return float(total) if total is not None else 0.0

    class Meta:
        model = BankAccount
        fields = [
            "id",
            "name",
            "account_type",
            "institution",
            "account_number",
            "currency",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
            "transaction_count",
            "total_balance",
            "current_month_count",
            "current_month_balance",
        ]
        read_only_fields = ["created_at", "updated_at"]


class TransactionSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(
        source="account.name", read_only=True, allow_null=True
    )
    account_type = serializers.CharField(
        source="account.account_type", read_only=True, allow_null=True
    )
    category_name = serializers.CharField(
        source="category.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "date",
            "amount",
            "description",
            "category",
            "category_name",
            "account",
            "import_source",
            "import_date",
            "reference_id",
            "created_at",
            "updated_at",
            "account_name",
            "account_type",
        ]
        read_only_fields = [
            "import_date",
            "reference_id",
            "created_at",
            "updated_at",
        ]


class ReclassificationRuleSerializer(serializers.ModelSerializer):
    from_category_name = serializers.CharField(
        source="from_category.name", read_only=True, allow_null=True
    )
    to_category_name = serializers.CharField(source="to_category.name", read_only=True)

    class Meta:
        model = ReclassificationRule
        fields = [
            "id",
            "from_category",
            "to_category",
            "from_category_name",
            "to_category_name",
            "conditions",
            "rule_name",
            "created_at",
            "is_active",
        ]
        read_only_fields = ["user", "created_at"]

    def validate(self, data):
        """Validate reclassification rule"""
        from_category = data.get("from_category")
        to_category = data.get("to_category")

        # Prevent circular reclassification if both are specified
        if from_category and to_category and from_category == to_category:
            raise serializers.ValidationError("Cannot reclassify to the same category")

        # Ensure to_category is always specified
        if not to_category:
            raise serializers.ValidationError("to_category is required")

        return data


class CategoryDeletionRuleSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = CategoryDeletionRule
        fields = ["id", "category", "category_name", "created_at", "is_active"]
        read_only_fields = ["user", "created_at"]
