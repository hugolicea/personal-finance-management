from rest_framework import serializers

from .models import (
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
        fields = "__all__"
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
        fields = "__all__"
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
        fields = "__all__"
        read_only_fields = ["user"]


class RetirementAccountSerializer(serializers.ModelSerializer):
    annual_contribution = serializers.ReadOnlyField()
    employer_match_amount = serializers.ReadOnlyField()
    total_annual_contribution = serializers.ReadOnlyField()

    class Meta:
        model = RetirementAccount
        fields = "__all__"
        read_only_fields = ["user"]


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"


class ReclassificationRuleSerializer(serializers.ModelSerializer):
    from_category_name = serializers.CharField(
        source="from_category.name", read_only=True
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
            "created_at",
            "is_active",
        ]
        read_only_fields = ["user", "created_at"]

    def validate(self, data):
        """Prevent circular reclassification"""
        if data.get("from_category") == data.get("to_category"):
            raise serializers.ValidationError("Cannot reclassify to the same category")
        return data


class CategoryDeletionRuleSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = CategoryDeletionRule
        fields = ["id", "category", "category_name", "created_at", "is_active"]
        read_only_fields = ["user", "created_at"]
