"""API/ViewSet tests for InvestmentViewSet, HeritageViewSet, and RetirementAccountViewSet."""

from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from budget.models import Heritage, Investment, RetirementAccount


class InvestmentAPITest(APITestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)
        self.investment = Investment.objects.create(
            user=self.user,
            symbol="AAPL",
            name="Apple Inc.",
            investment_type=Investment.STOCK,
            quantity=Decimal("10.00000000"),
            purchase_price=Decimal("150.0000"),
            purchase_date=date(2025, 1, 15),
        )
        self.list_url = reverse("investment-list")
        self.detail_url = reverse(
            "investment-detail", kwargs={"pk": self.investment.id}
        )

    def test_list_investments_returns_200_authenticated(self) -> None:
        """GET /api/v1/investments/ returns 200 when authenticated."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_investments_returns_401_unauthenticated(self) -> None:
        """GET /api/v1/investments/ returns 401 without credentials."""
        anon = APIClient()
        response = anon.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_investment(self) -> None:
        """POST /api/v1/investments/ creates a new investment."""
        data = {
            "symbol": "TSLA",
            "name": "Tesla Inc.",
            "investment_type": "stock",
            "quantity": "5.00000000",
            "purchase_price": "200.0000",
            "purchase_date": "2025-03-01",
        }
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["symbol"], "TSLA")
        self.assertEqual(Investment.objects.filter(user=self.user).count(), 2)

    def test_retrieve_investment(self) -> None:
        """GET /api/v1/investments/{id}/ returns the correct record."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["symbol"], "AAPL")
        self.assertEqual(response.data["name"], "Apple Inc.")

    def test_update_investment(self) -> None:
        """PUT /api/v1/investments/{id}/ updates the record."""
        data = {
            "symbol": "AAPL",
            "name": "Apple Inc. Updated",
            "investment_type": "stock",
            "quantity": "10.00000000",
            "purchase_price": "150.0000",
            "purchase_date": "2025-01-15",
        }
        response = self.client.put(self.detail_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.investment.refresh_from_db()
        self.assertEqual(self.investment.name, "Apple Inc. Updated")

    def test_delete_investment(self) -> None:
        """DELETE /api/v1/investments/{id}/ removes the record."""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Investment.objects.filter(id=self.investment.id).exists())

    def test_user_isolation(self) -> None:
        """Authenticated user cannot see another user's investments."""
        other_user = User.objects.create_user(
            username="otheruser", password="testpass123"
        )
        Investment.objects.create(
            user=other_user,
            symbol="GOOG",
            name="Alphabet Inc.",
            investment_type=Investment.STOCK,
            quantity=Decimal("5.00000000"),
            purchase_price=Decimal("100.0000"),
            purchase_date=date(2025, 1, 15),
        )
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        symbols = [item["symbol"] for item in response.data["results"]]
        self.assertIn("AAPL", symbols)
        self.assertNotIn("GOOG", symbols)


class HeritageAPITest(APITestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)
        self.heritage = Heritage.objects.create(
            user=self.user,
            name="My House",
            heritage_type=Heritage.HOUSE,
            address="123 Main St",
            purchase_price=Decimal("200000.00"),
            purchase_date=date(2020, 6, 1),
        )
        self.list_url = reverse("heritage-list")
        self.detail_url = reverse("heritage-detail", kwargs={"pk": self.heritage.id})

    def test_list_heritages_returns_200_authenticated(self) -> None:
        """GET /api/v1/heritages/ returns 200 when authenticated."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_heritages_returns_401_unauthenticated(self) -> None:
        """GET /api/v1/heritages/ returns 401 without credentials."""
        anon = APIClient()
        response = anon.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_heritage(self) -> None:
        """POST /api/v1/heritages/ creates a new heritage record."""
        data = {
            "name": "Beach House",
            "heritage_type": "house",
            "address": "456 Ocean Ave",
            "purchase_price": "300000.00",
            "purchase_date": "2022-04-15",
        }
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Beach House")
        self.assertEqual(Heritage.objects.filter(user=self.user).count(), 2)

    def test_retrieve_heritage(self) -> None:
        """GET /api/v1/heritages/{id}/ returns the correct record."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "My House")

    def test_update_heritage(self) -> None:
        """PUT /api/v1/heritages/{id}/ updates the record."""
        data = {
            "name": "My House Updated",
            "heritage_type": "house",
            "address": "123 Main St",
            "purchase_price": "200000.00",
            "purchase_date": "2020-06-01",
        }
        response = self.client.put(self.detail_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.heritage.refresh_from_db()
        self.assertEqual(self.heritage.name, "My House Updated")

    def test_delete_heritage(self) -> None:
        """DELETE /api/v1/heritages/{id}/ removes the record."""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Heritage.objects.filter(id=self.heritage.id).exists())

    def test_user_isolation(self) -> None:
        """Authenticated user cannot see another user's heritage records."""
        other_user = User.objects.create_user(
            username="otheruser", password="testpass123"
        )
        Heritage.objects.create(
            user=other_user,
            name="Other House",
            heritage_type=Heritage.HOUSE,
            address="789 Elm St",
            purchase_price=Decimal("150000.00"),
            purchase_date=date(2021, 3, 10),
        )
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item["name"] for item in response.data["results"]]
        self.assertIn("My House", names)
        self.assertNotIn("Other House", names)


class RetirementAccountAPITest(APITestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)
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
        self.list_url = reverse("retirementaccount-list")
        self.detail_url = reverse(
            "retirementaccount-detail", kwargs={"pk": self.account.id}
        )

    def test_list_retirement_accounts_returns_200_authenticated(self) -> None:
        """GET /api/v1/retirement-accounts/ returns 200 when authenticated."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_retirement_accounts_returns_401_unauthenticated(self) -> None:
        """GET /api/v1/retirement-accounts/ returns 401 without credentials."""
        anon = APIClient()
        response = anon.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_retirement_account(self) -> None:
        """POST /api/v1/retirement-accounts/ creates a new account."""
        data = {
            "name": "My Roth IRA",
            "account_type": "roth_ira",
            "provider": "Vanguard",
            "current_balance": "25000.00",
            "monthly_contribution": "300.00",
            "employer_match_percentage": "0.00",
            "employer_match_limit": "0.00",
        }
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "My Roth IRA")
        self.assertEqual(RetirementAccount.objects.filter(user=self.user).count(), 2)

    def test_retrieve_retirement_account(self) -> None:
        """GET /api/v1/retirement-accounts/{id}/ returns the correct record."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "My 401k")
        self.assertEqual(response.data["provider"], "Fidelity")

    def test_update_retirement_account(self) -> None:
        """PUT /api/v1/retirement-accounts/{id}/ updates the record."""
        data = {
            "name": "My 401k Updated",
            "account_type": "traditional_401k",
            "provider": "Fidelity",
            "current_balance": "60000.00",
            "monthly_contribution": "500.00",
            "employer_match_percentage": "0.50",
            "employer_match_limit": "3000.00",
            "target_retirement_age": 65,
        }
        response = self.client.put(self.detail_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.account.refresh_from_db()
        self.assertEqual(self.account.name, "My 401k Updated")
        self.assertAlmostEqual(float(self.account.current_balance), 60000.0, places=2)

    def test_delete_retirement_account(self) -> None:
        """DELETE /api/v1/retirement-accounts/{id}/ removes the record."""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(RetirementAccount.objects.filter(id=self.account.id).exists())

    def test_user_isolation(self) -> None:
        """Authenticated user cannot see another user's retirement accounts."""
        other_user = User.objects.create_user(
            username="otheruser", password="testpass123"
        )
        RetirementAccount.objects.create(
            user=other_user,
            name="Other 401k",
            account_type=RetirementAccount.ROTH_401K,
            provider="Schwab",
        )
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item["name"] for item in response.data["results"]]
        self.assertIn("My 401k", names)
        self.assertNotIn("Other 401k", names)
