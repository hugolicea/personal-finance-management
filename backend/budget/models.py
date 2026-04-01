from django.conf import settings
from django.db import models


class Category(models.Model):
    SPEND = "spend"
    INCOME = "income"
    CLASSIFICATION_CHOICES = [
        (SPEND, "Spend"),
        (INCOME, "Income"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="categories"
    )
    name = models.CharField(max_length=100)
    classification = models.CharField(
        max_length=10,
        choices=CLASSIFICATION_CHOICES,
        default=SPEND,
        help_text="Whether this category is for spending or income",
    )
    monthly_budget = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Monthly budget amount for this category",
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Categories"
        unique_together = [["user", "name"]]
        indexes = [
            models.Index(fields=["user", "classification"]),
        ]

    def __str__(self):
        return self.name


class BankAccount(models.Model):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    CASH = "cash"
    INVESTMENT = "investment"
    OTHER = "other"
    ACCOUNT_TYPE_CHOICES = [
        (CHECKING, "Checking"),
        (SAVINGS, "Savings"),
        (CREDIT_CARD, "Credit Card"),
        (CASH, "Cash"),
        (INVESTMENT, "Investment"),
        (OTHER, "Other"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bank_accounts",
    )
    name = models.CharField(max_length=100)
    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPE_CHOICES,
        default=CHECKING,
        help_text="Type of bank account",
    )
    institution = models.CharField(
        max_length=100,
        blank=True,
        help_text="Bank or financial institution name",
    )
    account_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Last 4 digits of account number (for reference only)",
    )
    currency = models.CharField(max_length=3, default="USD")
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["user", "name"]]
        indexes = [
            models.Index(fields=["user", "account_type"]),
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_account_type_display()})"


class Transaction(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions"
    )
    account = models.ForeignKey(
        BankAccount,
        on_delete=models.PROTECT,
        related_name="transactions",
        help_text="Bank account this transaction belongs to",
    )
    date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    # Bank statement import fields
    import_source = models.CharField(
        max_length=100, blank=True, null=True
    )  # e.g., 'bank_statement', 'manual'
    import_date = models.DateTimeField(auto_now_add=True)
    reference_id = models.CharField(
        max_length=255, blank=True, null=True, unique=True, db_index=True
    )  # For duplicate detection - indexed for faster lookups

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "date"]),
            models.Index(fields=["user", "category"]),
            models.Index(fields=["user", "-date"]),  # For recent transactions
            models.Index(
                fields=["user", "date", "category"]
            ),  # Composite for filtering
            models.Index(fields=["reference_id"]),  # For duplicate detection
        ]
        ordering = ["-date"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__isnull=False),
                name="transaction_amount_not_null",
            ),
        ]

    def __str__(self):
        return f"{self.description} - {self.amount:.2f} ({self.date})"


class ReclassificationRule(models.Model):
    """Store persistent reclassification rules for Clean and Reclassify feature

    Supports advanced conditions:
    {
        "description_contains": "Attack FC",
        "description_not_contains": "exclude_this",
        "amount_min": 10.00,
        "amount_max": 100.00,
        "date_from": "2024-01-01",
        "date_to": "2024-12-31",
        "account_type": "credit_card"
    }
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reclassification_rules",
    )
    from_category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="reclassification_from_rules",
        help_text="Category to reclassify from",
        null=True,
        blank=True,
    )
    to_category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="reclassification_to_rules",
        help_text="Category to reclassify to",
    )
    conditions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional conditions for matching transactions (description, amount range, dates, etc.)",
    )
    rule_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Optional name to identify this rule",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    is_active = models.BooleanField(
        default=True, help_text="Whether this rule is active"
    )

    class Meta:
        indexes = [
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self):
        if self.rule_name:
            return f"{self.rule_name}: → {self.to_category.name}"
        if self.from_category:
            return f"{self.from_category.name} → {self.to_category.name}"
        return f"Rule → {self.to_category.name}"

    def matches_transaction(self, transaction):
        """Check if a transaction matches this rule's conditions"""
        # Check from_category if specified
        if self.from_category and transaction.category_id != self.from_category_id:
            return False

        # Check additional conditions
        if not self.conditions:
            return True

        # Description contains (ANY of these keywords)
        if "description_contains" in self.conditions:
            keywords = self.conditions["description_contains"]
            if isinstance(keywords, list) and keywords:
                description_lower = transaction.description.lower()
                if not any(
                    keyword.lower() in description_lower for keyword in keywords
                ):
                    return False
            elif isinstance(keywords, str) and keywords:
                if keywords.lower() not in transaction.description.lower():
                    return False

        # Description not contains (NONE of these keywords)
        if "description_not_contains" in self.conditions:
            keywords = self.conditions["description_not_contains"]
            if isinstance(keywords, list) and keywords:
                description_lower = transaction.description.lower()
                if any(keyword.lower() in description_lower for keyword in keywords):
                    return False
            elif isinstance(keywords, str) and keywords:
                if keywords.lower() in transaction.description.lower():
                    return False

        # Amount range
        if "amount_min" in self.conditions:
            if float(transaction.amount) < float(self.conditions["amount_min"]):
                return False

        if "amount_max" in self.conditions:
            if float(transaction.amount) > float(self.conditions["amount_max"]):
                return False

        # Date range
        if "date_from" in self.conditions:
            from datetime import datetime

            date_from = datetime.strptime(
                self.conditions["date_from"], "%Y-%m-%d"
            ).date()
            if transaction.date < date_from:
                return False

        if "date_to" in self.conditions:
            from datetime import datetime

            date_to = datetime.strptime(self.conditions["date_to"], "%Y-%m-%d").date()
            if transaction.date > date_to:
                return False

        # Account type condition
        if "account_type" in self.conditions:
            tx_account_type = (
                transaction.account.account_type if transaction.account_id else None
            )
            if tx_account_type != self.conditions["account_type"]:
                return False

        return True


class CategoryDeletionRule(models.Model):
    """Store persistent category deletion rules for Clean and Reclassify feature"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="category_deletion_rules",
    )
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="deletion_rules"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    is_active = models.BooleanField(
        default=True, help_text="Whether this rule is active"
    )

    class Meta:
        unique_together = [["user", "category"]]
        indexes = [
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self):
        return f"Delete: {self.category.name}"
