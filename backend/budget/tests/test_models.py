from budget.models import Category, Transaction
from django.test import TestCase


class CategoryModelTest(TestCase):
    def test_category_creation(self):
        """Test that a category can be created"""
        category = Category.objects.create(name="Test Category")
        self.assertEqual(category.name, "Test Category")
        self.assertIsNotNone(category.id)

    def test_category_str(self):
        """Test the string representation of Category"""
        category = Category.objects.create(name="Food")
        self.assertEqual(str(category), "Food")


class TransactionModelTest(TestCase):
    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(name="Food")

    def test_transaction_creation(self):
        """Test that a transaction can be created"""
        from datetime import date

        transaction = Transaction.objects.create(
            amount=-50.00,
            description="Test transaction",
            date=date.today(),
            category=self.category,
        )
        self.assertEqual(transaction.amount, -50.00)
        self.assertEqual(transaction.description, "Test transaction")
        self.assertEqual(transaction.category, self.category)

    def test_transaction_str(self):
        """Test the string representation of Transaction"""
        from datetime import date

        transaction = Transaction.objects.create(
            amount=100.00,
            description="Income",
            date=date.today(),
            category=self.category,
        )
        expected_str = f"Income - 100.00 ({date.today()})"
        self.assertEqual(str(transaction), expected_str)

    def test_transaction_amount_positive(self):
        """Test transaction with positive amount (income)"""
        from datetime import date

        transaction = Transaction.objects.create(
            amount=200.00,
            description="Salary",
            date=date.today(),
            category=self.category,
        )
        self.assertEqual(transaction.amount, 200.00)
