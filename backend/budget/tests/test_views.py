from datetime import date, timedelta

from django.contrib.auth.models import User
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from budget.models import BankAccount, Category, Transaction


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
        self.account = BankAccount.objects.create(
            user=self.user,
            name="My Checking Account",
            account_type="checking",
        )

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
            "account": self.account.id,
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
            account=self.account,
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
        self.account = BankAccount.objects.create(
            user=self.user,
            name="My Checking Account",
            account_type="checking",
        )
        Transaction.objects.create(
            amount=-50.00,
            description="Lunch",
            date=date.today(),
            category=self.category,
            account=self.account,
            user=self.user,
        )
        Transaction.objects.create(
            amount=-20.00,
            description="Dinner",
            date=date.today(),
            category=self.category,
            account=self.account,
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


class SpendingSummaryAPITest(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)
        self.spend_category = Category.objects.create(
            name="Food",
            user=self.user,
            classification=Category.SPEND,
            monthly_budget=300.00,
        )
        self.account = BankAccount.objects.create(
            user=self.user,
            name="My Checking Account",
            account_type="checking",
        )
        self.url = reverse("spending_summary")

    def test_returns_200_authenticated(self):
        """Test GET /api/v1/spending-summary/ returns 200 with correct response shape"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("month", data)
        self.assertIn("categories", data)
        self.assertIsInstance(data["categories"], list)
        today = date.today()
        self.assertEqual(data["month"], f"{today.year:04d}-{today.month:02d}")

    def test_unauthenticated_returns_401(self):
        """Test unauthenticated request returns 401"""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_current_month_totals(self):
        """Test that transactions this month are summed and total_spent is correct"""
        Transaction.objects.create(
            amount=-100.00,
            description="Groceries",
            date=date.today(),
            category=self.spend_category,
            account=self.account,
            user=self.user,
        )
        Transaction.objects.create(
            amount=-50.00,
            description="Restaurant",
            date=date.today(),
            category=self.spend_category,
            account=self.account,
            user=self.user,
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["categories"]), 1)
        food = data["categories"][0]
        self.assertEqual(food["name"], "Food")
        self.assertAlmostEqual(food["total_spent"], 150.0)

    def test_past_month_excluded(self):
        """Test that a transaction from 35 days ago is NOT counted in current month"""
        past_date = date.today() - timedelta(days=35)
        Transaction.objects.create(
            amount=-200.00,
            description="Old Expense",
            date=past_date,
            category=self.spend_category,
            account=self.account,
            user=self.user,
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["categories"]), 1)
        self.assertAlmostEqual(data["categories"][0]["total_spent"], 0.0)

    def test_category_with_no_budget(self):
        """Test that when budget_limit=0, percentage_used is None (not a division error)"""
        no_budget_category = Category.objects.create(
            name="Misc",
            user=self.user,
            classification=Category.SPEND,
            monthly_budget=0,
        )
        Transaction.objects.create(
            amount=-50.00,
            description="Something",
            date=date.today(),
            category=no_budget_category,
            account=self.account,
            user=self.user,
        )
        response = self.client.get(self.url)
        data = response.json()
        misc = next(c for c in data["categories"] if c["name"] == "Misc")
        self.assertIsNone(misc["percentage_used"])

    def test_over_budget_percentage(self):
        """Test that spending exceeding budget returns percentage_used > 100"""
        Transaction.objects.create(
            amount=-362.00,
            description="Overspend",
            date=date.today(),
            category=self.spend_category,
            account=self.account,
            user=self.user,
        )
        response = self.client.get(self.url)
        data = response.json()
        food = next(c for c in data["categories"] if c["name"] == "Food")
        # 362 / 300 * 100 = 120.666...
        self.assertGreater(food["percentage_used"], 100.0)
        self.assertAlmostEqual(food["percentage_used"], 120.666, places=1)

    def test_category_with_no_transactions(self):
        """Test that a spend category with no transactions shows total_spent=0 and 0% used"""
        response = self.client.get(self.url)
        data = response.json()
        self.assertEqual(len(data["categories"]), 1)
        food = data["categories"][0]
        self.assertAlmostEqual(food["total_spent"], 0.0)
        self.assertAlmostEqual(food["budget_limit"], 300.0)
        # 0 spent of 300 budget = 0.0%, not None (None only when budget_limit=0)
        self.assertAlmostEqual(food["percentage_used"], 0.0)

    def test_income_categories_excluded(self):
        """Test that income-classified categories don't appear in the response"""
        Category.objects.create(
            name="Salary",
            user=self.user,
            classification=Category.INCOME,
        )
        response = self.client.get(self.url)
        data = response.json()
        names = [c["name"] for c in data["categories"]]
        self.assertNotIn("Salary", names)
        self.assertIn("Food", names)

    def test_user_isolation(self):
        """Test that a second user's categories and transactions are not visible"""
        other_user = User.objects.create_user(
            username="otheruser", password="otherpass123"
        )
        other_category = Category.objects.create(
            name="Other Food",
            user=other_user,
            classification=Category.SPEND,
            monthly_budget=500.00,
        )
        other_account = BankAccount.objects.create(
            user=other_user,
            name="Other Account",
            account_type="checking",
        )
        Transaction.objects.create(
            amount=-999.00,
            description="Other Expense",
            date=date.today(),
            category=other_category,
            account=other_account,
            user=other_user,
        )
        response = self.client.get(self.url)
        data = response.json()
        names = [c["name"] for c in data["categories"]]
        self.assertNotIn("Other Food", names)
        self.assertEqual(len(data["categories"]), 1)

    def test_spending_amounts_are_always_positive(self):
        """Regression: _get_spending_by_category must return abs values.
        A negative-amount transaction must produce a positive total_spent."""
        Transaction.objects.create(
            amount=-100.00,
            description="Negative Expense",
            date=date.today(),
            category=self.spend_category,
            account=self.account,
            user=self.user,
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        food = next(c for c in data["categories"] if c["name"] == "Food")
        self.assertGreater(food["total_spent"], 0, "total_spent must be positive")
        self.assertAlmostEqual(food["total_spent"], 100.0)


class CategorySpendingByPeriodAPITest(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)
        self.spend_category = Category.objects.create(
            name="Food",
            user=self.user,
            classification=Category.SPEND,
            monthly_budget=300.00,
        )
        self.income_category = Category.objects.create(
            name="Salary",
            user=self.user,
            classification=Category.INCOME,
            monthly_budget=0.00,
        )
        self.account = BankAccount.objects.create(
            user=self.user,
            name="My Checking Account",
            account_type="checking",
        )
        today = date.today()
        self.year_month = f"{today.year:04d}-{today.month:02d}"

    def test_returns_200_for_week_period(self):
        """Test GET /api/v1/category-spending/week/ returns 200 with expected keys"""
        url = reverse("category_spending_by_period", kwargs={"period": "week"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("period", data)
        self.assertIn("start_date", data)
        self.assertIn("end_date", data)
        self.assertIn("categories", data)
        self.assertEqual(data["period"], "week")

    def test_returns_200_for_month_period(self):
        """Test GET /api/v1/category-spending/month/ returns 200"""
        url = reverse("category_spending_by_period", kwargs={"period": "month"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["period"], "month")
        self.assertIsInstance(data["categories"], list)

    def test_returns_200_for_year_month_format(self):
        """Test that YYYY-MM period format is accepted and returns correct period echo"""
        url = reverse("category_spending_by_period", kwargs={"period": self.year_month})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["period"], self.year_month)
        self.assertIn("start_date", data)
        self.assertIn("end_date", data)

    def test_invalid_period_returns_400(self):
        """Test that an unrecognised period string returns 400"""
        url = reverse("category_spending_by_period", kwargs={"period": "invalid"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("error", data)

    def test_invalid_year_month_format_returns_400(self):
        """Test that a malformed YYYY-MM value (e.g. month=99) returns 400"""
        url = reverse("category_spending_by_period", kwargs={"period": "9999-99"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("error", data)

    def test_unauthenticated_returns_401(self):
        """Test that an unauthenticated request is rejected"""
        self.client.force_authenticate(user=None)
        url = reverse("category_spending_by_period", kwargs={"period": "week"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_spending_included_in_period(self):
        """Test that a transaction within the period is reflected in spending"""
        Transaction.objects.create(
            amount=-100.00,
            description="Groceries",
            date=date.today(),
            category=self.spend_category,
            account=self.account,
            user=self.user,
        )
        url = reverse("category_spending_by_period", kwargs={"period": "week"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        food = next(c for c in data["categories"] if c["name"] == "Food")
        self.assertAlmostEqual(food["spending"], 100.0)

    def test_transaction_outside_period_excluded(self):
        """Test that a transaction from 2 years ago is not counted in the week period"""
        old_date = date.today() - timedelta(days=730)
        Transaction.objects.create(
            amount=-200.00,
            description="Old Expense",
            date=old_date,
            category=self.spend_category,
            account=self.account,
            user=self.user,
        )
        url = reverse("category_spending_by_period", kwargs={"period": "week"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        food = next(c for c in data["categories"] if c["name"] == "Food")
        self.assertAlmostEqual(food["spending"], 0.0)

    def test_user_isolation(self):
        """Test that a second user's categories and transactions are not visible"""
        other_user = User.objects.create_user(
            username="otheruser", password="otherpass123"
        )
        other_category = Category.objects.create(
            name="Other Food",
            user=other_user,
            classification=Category.SPEND,
            monthly_budget=500.00,
        )
        other_account = BankAccount.objects.create(
            user=other_user,
            name="Other Account",
            account_type="checking",
        )
        Transaction.objects.create(
            amount=-999.00,
            description="Other Expense",
            date=date.today(),
            category=other_category,
            account=other_account,
            user=other_user,
        )
        url = reverse("category_spending_by_period", kwargs={"period": "week"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        names = [c["name"] for c in data["categories"]]
        self.assertNotIn("Other Food", names)

    def test_no_budget_percentage_used_is_zero(self):
        """Test that percentage_used is 0 (not null) when monthly_budget=0"""
        no_budget_category = Category.objects.create(
            name="Misc",
            user=self.user,
            classification=Category.SPEND,
            monthly_budget=0,
        )
        Transaction.objects.create(
            amount=-50.00,
            description="Something",
            date=date.today(),
            category=no_budget_category,
            account=self.account,
            user=self.user,
        )
        url = reverse("category_spending_by_period", kwargs={"period": "week"})
        response = self.client.get(url)
        data = response.json()
        misc = next(c for c in data["categories"] if c["name"] == "Misc")
        self.assertEqual(misc["percentage_used"], 0)
        self.assertIsNotNone(misc["percentage_used"])

    def test_response_contains_balance_field(self):
        """Test that each category entry includes a balance equal to budget - spending"""
        Transaction.objects.create(
            amount=-100.00,
            description="Groceries",
            date=date.today(),
            category=self.spend_category,
            account=self.account,
            user=self.user,
        )
        url = reverse("category_spending_by_period", kwargs={"period": "week"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        food = next(c for c in data["categories"] if c["name"] == "Food")
        self.assertIn("balance", food)
        # balance must equal budget - spending
        self.assertAlmostEqual(food["balance"], food["budget"] - food["spending"])

    def test_only_spend_categories_included(self):
        """Test that only SPEND categories appear in the response"""
        url = reverse("category_spending_by_period", kwargs={"period": "week"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        names = [c["name"] for c in data["categories"]]
        self.assertIn("Food", names)
        self.assertNotIn("Salary", names)

    def test_income_categories_excluded(self):
        """Regression: income-classified categories must not appear in category-spending results.
        The view should filter to classification=SPEND only."""
        Transaction.objects.create(
            amount=3000.00,
            description="Monthly Salary",
            date=date.today(),
            category=self.income_category,
            account=self.account,
            user=self.user,
        )
        url = reverse("category_spending_by_period", kwargs={"period": self.year_month})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [c["name"] for c in response.json()["categories"]]
        self.assertNotIn("Salary", names)
        self.assertIn("Food", names)

    def test_period_too_old_returns_400(self):
        """Regression: year < 2000 in YYYY-MM format must be rejected with 400."""
        url = reverse("category_spending_by_period", kwargs={"period": "1990-01"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())

    def test_period_too_far_future_returns_400(self):
        """Regression: year > current_year + 1 in YYYY-MM format must be rejected with 400."""
        url = reverse("category_spending_by_period", kwargs={"period": "9999-01"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())

    def test_period_valid_boundary_returns_200(self):
        """A YYYY-MM period at the current month boundary must be accepted and return 200."""
        url = reverse("category_spending_by_period", kwargs={"period": self.year_month})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["period"], self.year_month)

    def test_category_spending_amounts_are_always_positive(self):
        """Regression: _get_spending_by_category must return abs values.
        A negative-amount transaction must produce a positive spending value."""
        Transaction.objects.create(
            amount=-100.00,
            description="Negative Expense",
            date=date.today(),
            category=self.spend_category,
            account=self.account,
            user=self.user,
        )
        url = reverse("category_spending_by_period", kwargs={"period": self.year_month})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        food = next(c for c in response.json()["categories"] if c["name"] == "Food")
        self.assertGreater(food["spending"], 0, "spending must be positive")
        self.assertAlmostEqual(food["spending"], 100.0)
