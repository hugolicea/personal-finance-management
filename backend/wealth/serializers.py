from rest_framework import serializers

from .models import Heritage, Investment, RetirementAccount


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
