from django.db.models import Sum

from rest_framework import serializers

from .models import (
    BankAccount,
    Category,
    CategoryDeletionRule,
    Heritage,
    Investment,
    ReclassificationRule,
    RetirementAccount,
    Transaction,
)


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


class InvestmentSerializer(serializers.ModelSerializer):
    total_invested = serializers.ReadOnlyField()
    current_value = serializers.ReadOnlyField()
    gain_loss = serializers.ReadOnlyField()
    gain_loss_percentage = serializers.ReadOnlyField()
    due_date = serializers.ReadOnlyField()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Convert decimal fields to floats for frontend compatibility
        decimal_fields = [
            "quantity",
            "purchase_price",
            "current_price",
            "total_invested",
            "current_value",
            "gain_loss",
            "gain_loss_percentage",
            "principal_amount",
            "interest_rate",
            "term_years",
        ]
        for field in decimal_fields:
            if data.get(field) is not None:
                data[field] = float(data[field])
        return data

    class Meta:
        model = Investment
        fields = [
            "id",
            "user",
            "symbol",
            "name",
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
            "created_at",
            "updated_at",
            "total_invested",
            "current_value",
            "gain_loss",
            "gain_loss_percentage",
            "due_date",
        ]
        read_only_fields = ["user"]


class HeritageSerializer(serializers.ModelSerializer):
    gain_loss = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    gain_loss_percentage = serializers.DecimalField(
        max_digits=7, decimal_places=2, read_only=True
    )
    annual_rental_income = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    rental_yield_percentage = serializers.DecimalField(
        max_digits=7, decimal_places=2, read_only=True
    )

    class Meta:
        model = Heritage
        fields = [
            "id",
            "user",
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
            "created_at",
            "updated_at",
            "gain_loss",
            "gain_loss_percentage",
            "annual_rental_income",
            "rental_yield_percentage",
        ]
        read_only_fields = ["user"]


class RetirementAccountSerializer(serializers.ModelSerializer):
    annual_contribution = serializers.ReadOnlyField()
    employer_match_amount = serializers.ReadOnlyField()
    total_annual_contribution = serializers.ReadOnlyField()

    class Meta:
        model = RetirementAccount
        fields = "__all__"
        read_only_fields = ["user"]


class BankAccountSerializer(serializers.ModelSerializer):
    transaction_count = serializers.SerializerMethodField()
    total_balance = serializers.SerializerMethodField()

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
