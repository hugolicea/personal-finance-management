from datetime import date

from budget.models import Category, Transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class CategoryAPITest(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(name="Food")

    def test_get_categories(self):
        """Test GET /api/categories/"""
        url = reverse("category-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Food")

    def test_create_category(self):
        """Test POST /api/categories/"""
        url = reverse("category-list")
        data = {"name": "Transport"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Transport")
        self.assertEqual(Category.objects.count(), 2)

    def test_get_single_category(self):
        """Test GET /api/categories/{id}/"""
        url = reverse("category-detail", kwargs={"pk": self.category.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Food")


class TransactionAPITest(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(name="Food")

    def test_get_transactions(self):
        """Test GET /api/transactions/"""
        url = reverse("transaction-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # No transactions yet

    def test_create_transaction(self):
        """Test POST /api/transactions/"""
        url = reverse("transaction-list")
        data = {
            "amount": -25.50,
            "description": "Coffee",
            "date": "2026-01-24",
            "category": self.category.id,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["amount"], "-25.50")
        self.assertEqual(response.data["description"], "Coffee")
        self.assertEqual(Transaction.objects.count(), 1)

    def test_get_single_transaction(self):
        """Test GET /api/transactions/{id}/"""
        transaction = Transaction.objects.create(
            amount=-10.00,
            description="Snack",
            date=date.today(),
            category=self.category,
        )
        url = reverse("transaction-detail", kwargs={"pk": transaction.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["description"], "Snack")


class BalanceAPITest(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(name="Food")
        Transaction.objects.create(
            amount=-50.00,
            description="Lunch",
            date=date.today(),
            category=self.category,
        )
        Transaction.objects.create(
            amount=-20.00,
            description="Dinner",
            date=date.today(),
            category=self.category,
        )

    def test_balance_week(self):
        """Test GET /api/balance/week/"""
        url = reverse("balance_by_period", kwargs={"period": "week"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("balance_week", data)
        self.assertEqual(data["balance_week"], "-70.00")

    def test_balance_month(self):
        """Test GET /api/balance/month/"""
        url = reverse("balance_by_period", kwargs={"period": "month"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("balance_month", data)
        self.assertEqual(data["balance_month"], "-70.00")

    def test_balance_quarter(self):
        """Test GET /api/balance/quarter/"""
        url = reverse("balance_by_period", kwargs={"period": "quarter"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("balance_quarter", data)

    def test_balance_year(self):
        """Test GET /api/balance/year/"""
        url = reverse("balance_by_period", kwargs={"period": "year"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("balance_year", data)
