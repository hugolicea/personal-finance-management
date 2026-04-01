from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase

from wealth.models import Heritage, Investment, RetirementAccount


class InvestmentModelTest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )

    def test_creation_with_required_fields(self) -> None:
        investment = Investment.objects.create(
            user=self.user,
            symbol="AAPL",
            name="Apple Inc.",
            investment_type=Investment.STOCK,
            quantity=Decimal("10.00000000"),
            purchase_price=Decimal("150.0000"),
            purchase_date=date(2025, 1, 1),
        )
        self.assertIsNotNone(investment.id)

    def test_str_representation(self) -> None:
        investment = Investment.objects.create(
            user=self.user,
            symbol="AAPL",
            name="Apple Inc.",
            investment_type=Investment.STOCK,
            quantity=Decimal("10.00000000"),
            purchase_price=Decimal("150.0000"),
            purchase_date=date(2025, 1, 1),
        )
        self.assertEqual(str(investment), "AAPL - Apple Inc.")

    def test_total_invested_and_gain_loss_properties(self) -> None:
        investment = Investment.objects.create(
            user=self.user,
            symbol="AAPL",
            name="Apple Inc.",
            investment_type=Investment.STOCK,
            quantity=Decimal("10.00000000"),
            purchase_price=Decimal("150.0000"),
            current_price=Decimal("160.0000"),
            purchase_date=date(2025, 1, 1),
        )
        self.assertEqual(investment.total_invested, Decimal("1500.0000000000"))
        self.assertEqual(investment.gain_loss, Decimal("100.0000000000"))


class HeritageModelTest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )

    def test_creation_with_required_fields(self) -> None:
        heritage = Heritage.objects.create(
            user=self.user,
            name="My House",
            heritage_type=Heritage.HOUSE,
            address="123 Main St",
            purchase_price=Decimal("200000.00"),
            purchase_date=date(2020, 1, 1),
        )
        self.assertIsNotNone(heritage.id)

    def test_str_representation(self) -> None:
        heritage = Heritage.objects.create(
            user=self.user,
            name="My House",
            heritage_type=Heritage.HOUSE,
            address="123 Main St",
            purchase_price=Decimal("200000.00"),
            purchase_date=date(2020, 1, 1),
        )
        self.assertEqual(str(heritage), "My House - House")

    def test_gain_loss_property(self) -> None:
        heritage = Heritage.objects.create(
            user=self.user,
            name="My House",
            heritage_type=Heritage.HOUSE,
            address="123 Main St",
            purchase_price=Decimal("200000.00"),
            current_value=Decimal("250000.00"),
            purchase_date=date(2020, 1, 1),
        )
        self.assertEqual(heritage.gain_loss, Decimal("50000.00"))


class RetirementAccountModelTest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )

    def test_creation_with_required_fields(self) -> None:
        account = RetirementAccount.objects.create(
            user=self.user,
            name="My 401k",
            account_type=RetirementAccount.TRADITIONAL_401K,
            provider="Fidelity",
        )
        self.assertIsNotNone(account.id)

    def test_str_representation(self) -> None:
        account = RetirementAccount.objects.create(
            user=self.user,
            name="My 401k",
            account_type=RetirementAccount.TRADITIONAL_401K,
            provider="Fidelity",
        )
        self.assertEqual(str(account), "My 401k (Traditional 401(k)) - Fidelity")

    def test_annual_contribution_property(self) -> None:
        account = RetirementAccount.objects.create(
            user=self.user,
            name="My 401k",
            account_type=RetirementAccount.TRADITIONAL_401K,
            provider="Fidelity",
            monthly_contribution=Decimal("500.00"),
        )
        self.assertEqual(account.annual_contribution, Decimal("6000.00"))
