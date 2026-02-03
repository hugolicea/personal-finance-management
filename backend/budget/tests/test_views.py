from datetime import date

from django.contrib.auth.models import User
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from budget.models import Category, Transaction


class CategoryAPITest(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(name="Food", user=self.user)

    def test_get_categories(self):
        """Test GET /api/v1/categories/"""
        url = reverse("category-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Response is paginated: {'count': N, 'results': [...]}
        self.assertIn("results", response.data)
        results = response.data["results"]
        # ViewSet filters by user, so should only see this user's categories
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Food")

    def test_create_category(self):
        """Test POST /api/v1/categories/"""
        url = reverse("category-list")
        data = {"name": "Transport", "classification": "spend", "user": self.user.id}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Transport")
        # Count only this user's categories
        user_category_count = Category.objects.filter(user=self.user).count()
        self.assertEqual(user_category_count, 2)  # Food + Transport

    def test_get_single_category(self):
        """Test GET /api/v1/categories/{id}/"""
        url = reverse("category-detail", kwargs={"pk": self.category.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Food")


class TransactionAPITest(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(name="Food", user=self.user)

    def test_get_transactions(self):
        """Test GET /api/v1/transactions/"""
        url = reverse("transaction-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Response is paginated: {'count': N, 'results': [...]}
        self.assertIn("results", response.data)
        results = response.data["results"]
        # ViewSet filters by user, so no transactions for this user yet
        self.assertEqual(len(results), 0)

    def test_create_transaction(self):
        """Test POST /api/v1/transactions/"""
        url = reverse("transaction-list")
        data = {
            "amount": -25.50,
            "description": "Coffee",
            "date": "2026-01-24",
            "category": self.category.id,
            "transaction_type": "account",
            "user": self.user.id,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["amount"], "-25.50")
        self.assertEqual(response.data["description"], "Coffee")
        # Count only this user's transactions
        user_transaction_count = Transaction.objects.filter(user=self.user).count()
        self.assertEqual(user_transaction_count, 1)

    def test_get_single_transaction(self):
        """Test GET /api/v1/transactions/{id}/"""
        transaction = Transaction.objects.create(
            amount=-10.00,
            description="Snack",
            date=date.today(),
            category=self.category,
            user=self.user,
        )
        url = reverse("transaction-detail", kwargs={"pk": transaction.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["description"], "Snack")


class BalanceAPITest(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(name="Food", user=self.user)
        Transaction.objects.create(
            amount=-50.00,
            description="Lunch",
            date=date.today(),
            category=self.category,
            user=self.user,
        )
        Transaction.objects.create(
            amount=-20.00,
            description="Dinner",
            date=date.today(),
            category=self.category,
            user=self.user,
        )

    def test_balance_week(self):
        """Test GET /api/v1/balance/week/"""
        url = reverse("balance_by_period", kwargs={"period": "week"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("balance_week", data)
        self.assertEqual(data["balance_week"], "-70.00")

    def test_balance_month(self):
        """Test GET /api/v1/balance/month/"""
        url = reverse("balance_by_period", kwargs={"period": "month"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("balance_month", data)
        self.assertEqual(data["balance_month"], "-70.00")

    def test_balance_quarter(self):
        """Test GET /api/v1/balance/quarter/"""
        url = reverse("balance_by_period", kwargs={"period": "quarter"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("balance_quarter", data)

    def test_balance_year(self):
        """Test GET /api/v1/balance/year/"""
        url = reverse("balance_by_period", kwargs={"period": "year"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("balance_year", data)
