"""Model-level tests for Investment, Heritage, and RetirementAccount."""

from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase

from budget.models import Heritage, Investment, RetirementAccount


class InvestmentModelTest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.investment = Investment.objects.create(
            user=self.user,
            symbol="AAPL",
            name="Apple Inc.",
            investment_type=Investment.STOCK,
            quantity=Decimal("10.00000000"),
            purchase_price=Decimal("150.0000"),
            purchase_date=date(2025, 1, 15),
        )

    def test_investment_creation(self) -> None:
        """Investment can be created with required fields."""
        self.assertIsNotNone(self.investment.id)
        self.assertEqual(self.investment.symbol, "AAPL")
        self.assertEqual(self.investment.name, "Apple Inc.")
        self.assertEqual(self.investment.investment_type, Investment.STOCK)

    def test_investment_str(self) -> None:
        """__str__ returns '<symbol> - <name>'."""
        self.assertEqual(str(self.investment), "AAPL - Apple Inc.")

    def test_total_invested_stock(self) -> None:
        """total_invested = quantity * purchase_price for equity types."""
        self.assertAlmostEqual(float(self.investment.total_invested), 1500.0, places=2)

    def test_current_value_with_current_price(self) -> None:
        """current_value = quantity * current_price when current_price is set."""
        self.investment.current_price = Decimal("160.0000")
        self.investment.save()
        self.assertAlmostEqual(float(self.investment.current_value), 1600.0, places=2)

    def test_current_value_no_current_price_equals_total_invested(self) -> None:
        """current_value falls back to total_invested when current_price is None."""
        self.assertIsNone(self.investment.current_price)
        self.assertAlmostEqual(
            float(self.investment.current_value),
            float(self.investment.total_invested),
            places=8,
        )

    def test_gain_loss_positive(self) -> None:
        """gain_loss is positive when current_price > purchase_price."""
        self.investment.current_price = Decimal("160.0000")
        self.investment.save()
        # 1600 - 1500 = 100
        self.assertAlmostEqual(float(self.investment.gain_loss), 100.0, places=2)

    def test_gain_loss_negative(self) -> None:
        """gain_loss is negative when current_price < purchase_price."""
        self.investment.current_price = Decimal("140.0000")
        self.investment.save()
        # 1400 - 1500 = -100
        self.assertAlmostEqual(float(self.investment.gain_loss), -100.0, places=2)

    def test_gain_loss_percentage(self) -> None:
        """gain_loss_percentage = (gain_loss / total_invested) * 100."""
        self.investment.current_price = Decimal("165.0000")
        self.investment.save()
        # gain = 1650 - 1500 = 150; pct = (150/1500)*100 = 10.0
        self.assertAlmostEqual(
            float(self.investment.gain_loss_percentage), 10.0, places=4
        )

    def test_gain_loss_percentage_zero_division_guard(self) -> None:
        """gain_loss_percentage returns 0 when total_invested is 0."""
        free = Investment.objects.create(
            user=self.user,
            symbol="FREE",
            name="Free Stock",
            investment_type=Investment.STOCK,
            quantity=Decimal("10.00000000"),
            purchase_price=Decimal("0.0000"),
            purchase_date=date(2025, 1, 15),
        )
        self.assertEqual(free.gain_loss_percentage, 0)

    def test_total_invested_fixed_income_uses_principal_amount(self) -> None:
        """total_invested uses principal_amount for FIXED_INCOME type."""
        bond = Investment.objects.create(
            user=self.user,
            symbol="BOND1",
            name="Test Bond",
            investment_type=Investment.FIXED_INCOME,
            quantity=Decimal("1.00000000"),
            purchase_price=Decimal("0.0000"),
            purchase_date=date(2025, 1, 15),
            principal_amount=Decimal("1000.00"),
            interest_rate=Decimal("10.00"),
            compounding_frequency="annual",
            term_years=Decimal("2.00"),
        )
        self.assertAlmostEqual(float(bond.total_invested), 1000.0, places=2)

    def test_current_value_fixed_income_applies_compound_interest(self) -> None:
        """current_value uses compound interest formula for FIXED_INCOME."""
        # A = 1000 * (1 + 0.10/1)^(1*2) = 1210.00
        bond = Investment.objects.create(
            user=self.user,
            symbol="BOND1",
            name="Test Bond",
            investment_type=Investment.FIXED_INCOME,
            quantity=Decimal("1.00000000"),
            purchase_price=Decimal("0.0000"),
            purchase_date=date(2025, 1, 15),
            principal_amount=Decimal("1000.00"),
            interest_rate=Decimal("10.00"),
            compounding_frequency="annual",
            term_years=Decimal("2.00"),
        )
        self.assertAlmostEqual(float(bond.current_value), 1210.0, places=2)

    def test_current_value_fixed_income_missing_fields_returns_principal(self) -> None:
        """current_value returns principal when interest_rate or term is absent."""
        bond = Investment.objects.create(
            user=self.user,
            symbol="BOND2",
            name="Incomplete Bond",
            investment_type=Investment.FIXED_INCOME,
            quantity=Decimal("1.00000000"),
            purchase_price=Decimal("0.0000"),
            purchase_date=date(2025, 1, 15),
            principal_amount=Decimal("5000.00"),
            # interest_rate and term_years intentionally omitted
        )
        self.assertAlmostEqual(float(bond.current_value), 5000.0, places=2)


class HeritageModelTest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.heritage = Heritage.objects.create(
            user=self.user,
            name="My House",
            heritage_type=Heritage.HOUSE,
            address="123 Main St",
            purchase_price=Decimal("200000.00"),
            purchase_date=date(2020, 6, 1),
        )

    def test_heritage_creation(self) -> None:
        """Heritage can be created with required fields."""
        self.assertIsNotNone(self.heritage.id)
        self.assertEqual(self.heritage.name, "My House")
        self.assertEqual(self.heritage.heritage_type, Heritage.HOUSE)

    def test_heritage_str(self) -> None:
        """__str__ returns '<name> - <type_display>'."""
        self.assertEqual(str(self.heritage), "My House - House")

    def test_gain_loss_with_current_value(self) -> None:
        """gain_loss = current_value - purchase_price when current_value is set."""
        self.heritage.current_value = Decimal("250000.00")
        self.heritage.save()
        self.assertAlmostEqual(float(self.heritage.gain_loss), 50000.0, places=2)

    def test_gain_loss_without_current_value_returns_zero(self) -> None:
        """gain_loss returns 0 when current_value is None."""
        self.assertIsNone(self.heritage.current_value)
        self.assertEqual(self.heritage.gain_loss, 0)

    def test_gain_loss_percentage(self) -> None:
        """gain_loss_percentage = (gain_loss / purchase_price) * 100."""
        self.heritage.current_value = Decimal("250000.00")
        self.heritage.save()
        # (50000 / 200000) * 100 = 25.0
        self.assertAlmostEqual(
            float(self.heritage.gain_loss_percentage), 25.0, places=4
        )

    def test_gain_loss_percentage_zero_purchase_price_guard(self) -> None:
        """gain_loss_percentage returns 0 when purchase_price is 0."""
        free_land = Heritage.objects.create(
            user=self.user,
            name="Free Land",
            heritage_type=Heritage.LAND,
            address="Somewhere",
            purchase_price=Decimal("0.00"),
            purchase_date=date(2020, 6, 1),
        )
        self.assertEqual(free_land.gain_loss_percentage, 0)

    def test_annual_rental_income(self) -> None:
        """annual_rental_income = monthly_rental_income * 12."""
        self.heritage.monthly_rental_income = Decimal("1500.00")
        self.heritage.save()
        self.assertAlmostEqual(
            float(self.heritage.annual_rental_income), 18000.0, places=2
        )

    def test_annual_rental_income_defaults_to_zero(self) -> None:
        """annual_rental_income is 0 when monthly_rental_income is default (0)."""
        self.assertAlmostEqual(float(self.heritage.annual_rental_income), 0.0, places=2)

    def test_rental_yield_percentage(self) -> None:
        """rental_yield_percentage = (annual_rental_income / current_value) * 100."""
        self.heritage.current_value = Decimal("200000.00")
        self.heritage.monthly_rental_income = Decimal("1000.00")
        self.heritage.save()
        # annual = 12000; yield = (12000 / 200000) * 100 = 6.0
        self.assertAlmostEqual(
            float(self.heritage.rental_yield_percentage), 6.0, places=4
        )

    def test_rental_yield_percentage_zero_when_no_current_value(self) -> None:
        """rental_yield_percentage returns 0 when current_value is None."""
        self.assertIsNone(self.heritage.current_value)
        self.assertEqual(self.heritage.rental_yield_percentage, 0)

    def test_rental_yield_percentage_zero_when_current_value_is_zero(self) -> None:
        """rental_yield_percentage returns 0 when current_value is 0."""
        self.heritage.current_value = Decimal("0.00")
        self.heritage.monthly_rental_income = Decimal("1000.00")
        self.heritage.save()
        self.assertEqual(self.heritage.rental_yield_percentage, 0)


class RetirementAccountModelTest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.account = RetirementAccount.objects.create(
            user=self.user,
            name="My 401k",
            account_type=RetirementAccount.TRADITIONAL_401K,
            provider="Fidelity",
            current_balance=Decimal("50000.00"),
            monthly_contribution=Decimal("500.00"),
            employer_match_percentage=Decimal("0.50"),
            employer_match_limit=Decimal("3000.00"),
        )

    def test_retirement_account_creation(self) -> None:
        """RetirementAccount can be created with required fields."""
        self.assertIsNotNone(self.account.id)
        self.assertEqual(self.account.name, "My 401k")
        self.assertEqual(self.account.provider, "Fidelity")
        self.assertEqual(self.account.account_type, RetirementAccount.TRADITIONAL_401K)

    def test_retirement_account_str(self) -> None:
        """__str__ returns '<name> (<type_display>) - <provider>'."""
        self.assertEqual(str(self.account), "My 401k (Traditional 401(k)) - Fidelity")

    def test_annual_contribution(self) -> None:
        """annual_contribution = monthly_contribution * 12."""
        # 500 * 12 = 6000
        self.assertAlmostEqual(
            float(self.account.annual_contribution), 6000.0, places=2
        )

    def test_employer_match_amount_within_limit(self) -> None:
        """employer_match_amount respects the employer_match_limit cap."""
        # annual=6000, match=6000*0.50=3000, limit=3000 → min=3000
        self.assertAlmostEqual(
            float(self.account.employer_match_amount), 3000.0, places=2
        )

    def test_employer_match_amount_capped_by_limit(self) -> None:
        """employer_match_amount is capped by employer_match_limit."""
        self.account.monthly_contribution = Decimal("1000.00")
        self.account.save()
        # annual=12000, match=12000*0.50=6000, limit=3000 → min=3000
        self.assertAlmostEqual(
            float(self.account.employer_match_amount), 3000.0, places=2
        )

    def test_total_annual_contribution(self) -> None:
        """total_annual_contribution = annual_contribution + employer_match_amount."""
        # 6000 + 3000 = 9000
        self.assertAlmostEqual(
            float(self.account.total_annual_contribution), 9000.0, places=2
        )

    def test_total_annual_contribution_no_employer_match(self) -> None:
        """total_annual_contribution equals annual_contribution when no match."""
        no_match = RetirementAccount.objects.create(
            user=self.user,
            name="Solo IRA",
            account_type=RetirementAccount.ROTH_IRA,
            provider="Schwab",
            monthly_contribution=Decimal("200.00"),
            employer_match_percentage=Decimal("0.00"),
            employer_match_limit=Decimal("0.00"),
        )
        # annual=2400, match=0 → total=2400
        self.assertAlmostEqual(
            float(no_match.total_annual_contribution), 2400.0, places=2
        )
