from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User

from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from wealth.models import Heritage, Investment, RetirementAccount


class InvestmentViewSetTest(APITestCase):
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
            purchase_date=date(2025, 1, 1),
        )

    def test_get_list(self) -> None:
        response = self.client.get("/api/v1/investments/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_post_create(self) -> None:
        payload = {
            "symbol": "TSLA",
            "name": "Tesla",
            "investment_type": "stock",
            "quantity": "2.00000000",
            "purchase_price": "100.0000",
            "purchase_date": "2025-01-02",
        }
        response = self.client.post("/api/v1/investments/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_get_retrieve(self) -> None:
        response = self.client.get(f"/api/v1/investments/{self.investment.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_authentication_required(self) -> None:
        anon = APIClient()
        response = anon.get("/api/v1/investments/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class HeritageViewSetTest(APITestCase):
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
            purchase_date=date(2020, 1, 1),
        )

    def test_get_list(self) -> None:
        response = self.client.get("/api/v1/heritages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_post_create(self) -> None:
        payload = {
            "name": "Beach House",
            "heritage_type": "house",
            "address": "456 Ocean Ave",
            "purchase_price": "300000.00",
            "purchase_date": "2022-04-15",
        }
        response = self.client.post("/api/v1/heritages/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_get_retrieve(self) -> None:
        response = self.client.get(f"/api/v1/heritages/{self.heritage.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_authentication_required(self) -> None:
        anon = APIClient()
        response = anon.get("/api/v1/heritages/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RetirementAccountViewSetTest(APITestCase):
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
        )

    def test_get_list(self) -> None:
        response = self.client.get("/api/v1/retirement-accounts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_post_create(self) -> None:
        payload = {
            "name": "My Roth IRA",
            "account_type": "roth_ira",
            "provider": "Vanguard",
            "current_balance": "25000.00",
            "monthly_contribution": "300.00",
            "employer_match_percentage": "0.00",
            "employer_match_limit": "0.00",
        }
        response = self.client.post(
            "/api/v1/retirement-accounts/", payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_get_retrieve(self) -> None:
        response = self.client.get(f"/api/v1/retirement-accounts/{self.account.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_authentication_required(self) -> None:
        anon = APIClient()
        response = anon.get("/api/v1/retirement-accounts/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
