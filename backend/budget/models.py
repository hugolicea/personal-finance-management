from django.db import models


class Category(models.Model):
    SPEND = "spend"
    INCOME = "income"
    CLASSIFICATION_CHOICES = [
        (SPEND, "Spend"),
        (INCOME, "Income"),
    ]

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

    def __str__(self):
        return self.name


class Transaction(models.Model):
    CREDIT_CARD = "credit_card"
    ACCOUNT = "account"
    TRANSACTION_TYPE_CHOICES = [
        (CREDIT_CARD, "Credit Card"),
        (ACCOUNT, "Account"),
    ]

    date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPE_CHOICES,
        default=ACCOUNT,
        help_text="Type of transaction: credit card or account",
    )
    # Bank statement import fields
    import_source = models.CharField(
        max_length=100, blank=True, null=True
    )  # e.g., 'bank_statement', 'manual'
    import_date = models.DateTimeField(auto_now_add=True)
    reference_id = models.CharField(
        max_length=255, blank=True, null=True, unique=True
    )  # For duplicate detection

    def __str__(self):
        return f"{self.description} - {self.amount:.2f} ({self.date})"
