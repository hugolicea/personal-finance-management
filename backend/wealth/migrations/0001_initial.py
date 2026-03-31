import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("budget", "0011_bankaccount_account_number"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name="Investment",
                    fields=[
                        (
                            "id",
                            models.BigAutoField(
                                auto_created=True,
                                primary_key=True,
                                serialize=False,
                                verbose_name="ID",
                            ),
                        ),
                        (
                            "symbol",
                            models.CharField(
                                help_text="Ticker symbol or identifier", max_length=20
                            ),
                        ),
                        (
                            "name",
                            models.CharField(
                                help_text="Full name of the investment",
                                max_length=200,
                            ),
                        ),
                        (
                            "investment_type",
                            models.CharField(
                                choices=[
                                    ("stock", "Stock"),
                                    ("bond", "Bond"),
                                    ("etf", "ETF"),
                                    ("crypto", "Cryptocurrency"),
                                    ("mutual_fund", "Mutual Fund"),
                                    ("fixed_income", "Fixed Income"),
                                ],
                                default="stock",
                                help_text="Type of investment",
                                max_length=20,
                            ),
                        ),
                        (
                            "quantity",
                            models.DecimalField(
                                decimal_places=8,
                                help_text="Number of shares/units owned",
                                max_digits=15,
                            ),
                        ),
                        (
                            "purchase_price",
                            models.DecimalField(
                                decimal_places=4,
                                help_text="Average purchase price per share/unit",
                                max_digits=15,
                            ),
                        ),
                        (
                            "current_price",
                            models.DecimalField(
                                blank=True,
                                decimal_places=4,
                                help_text=(
                                    "Current market price per share/unit "
                                    "(optional, can be updated manually)"
                                ),
                                max_digits=15,
                                null=True,
                            ),
                        ),
                        (
                            "purchase_date",
                            models.DateField(help_text="Date of initial purchase"),
                        ),
                        (
                            "principal_amount",
                            models.DecimalField(
                                blank=True,
                                decimal_places=2,
                                help_text=(
                                    "Principal amount for fixed income investments"
                                ),
                                max_digits=15,
                                null=True,
                            ),
                        ),
                        (
                            "interest_rate",
                            models.DecimalField(
                                blank=True,
                                decimal_places=2,
                                help_text="Annual interest rate (e.g., 8.00 for 8%)",
                                max_digits=5,
                                null=True,
                            ),
                        ),
                        (
                            "compounding_frequency",
                            models.CharField(
                                blank=True,
                                choices=[
                                    ("annual", "Annual"),
                                    ("semi_annual", "Semi-Annual"),
                                    ("quarterly", "Quarterly"),
                                    ("monthly", "Monthly"),
                                ],
                                help_text="How often interest is compounded",
                                max_length=20,
                                null=True,
                            ),
                        ),
                        (
                            "term_years",
                            models.DecimalField(
                                blank=True,
                                decimal_places=2,
                                help_text="Investment term in years",
                                max_digits=5,
                                null=True,
                            ),
                        ),
                        (
                            "notes",
                            models.TextField(
                                blank=True,
                                help_text="Additional notes about the investment",
                                null=True,
                            ),
                        ),
                        (
                            "created_at",
                            models.DateTimeField(
                                auto_now_add=True, blank=True, null=True
                            ),
                        ),
                        (
                            "updated_at",
                            models.DateTimeField(auto_now=True, blank=True, null=True),
                        ),
                        (
                            "user",
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name="investments",
                                to=settings.AUTH_USER_MODEL,
                            ),
                        ),
                    ],
                    options={
                        "db_table": "budget_investment",
                        "unique_together": {("user", "symbol")},
                        "indexes": [
                            models.Index(
                                fields=["user", "investment_type"],
                                name="wealth_invest_user_invest_type_idx",
                            ),
                            models.Index(
                                fields=["user", "purchase_date"],
                                name="wealth_invest_user_purchase_date_idx",
                            ),
                        ],
                    },
                ),
                migrations.CreateModel(
                    name="Heritage",
                    fields=[
                        (
                            "id",
                            models.BigAutoField(
                                auto_created=True,
                                primary_key=True,
                                serialize=False,
                                verbose_name="ID",
                            ),
                        ),
                        (
                            "name",
                            models.CharField(
                                help_text="Name or description of the property",
                                max_length=200,
                            ),
                        ),
                        (
                            "heritage_type",
                            models.CharField(
                                choices=[
                                    ("land", "Land"),
                                    ("house", "House"),
                                    ("apartment", "Apartment"),
                                    ("commercial", "Commercial Property"),
                                    ("office", "Office"),
                                    ("warehouse", "Warehouse"),
                                    ("other", "Other"),
                                ],
                                default="house",
                                help_text="Type of heritage/property",
                                max_length=20,
                            ),
                        ),
                        (
                            "address",
                            models.TextField(help_text="Full address of the property"),
                        ),
                        (
                            "area",
                            models.DecimalField(
                                blank=True,
                                decimal_places=2,
                                help_text="Area in square meters or appropriate unit",
                                max_digits=10,
                                null=True,
                            ),
                        ),
                        (
                            "area_unit",
                            models.CharField(
                                default="sq_m",
                                help_text="Unit for area measurement (sq_m, acres, hectares, etc.)",
                                max_length=20,
                            ),
                        ),
                        (
                            "purchase_price",
                            models.DecimalField(
                                decimal_places=2,
                                default=0,
                                help_text="Purchase price of the property",
                                max_digits=15,
                            ),
                        ),
                        (
                            "current_value",
                            models.DecimalField(
                                blank=True,
                                decimal_places=2,
                                help_text="Current market value (optional, can be updated manually)",
                                max_digits=15,
                                null=True,
                            ),
                        ),
                        (
                            "purchase_date",
                            models.DateField(help_text="Date of purchase"),
                        ),
                        (
                            "monthly_rental_income",
                            models.DecimalField(
                                decimal_places=2,
                                default=0,
                                help_text="Monthly rental income if applicable",
                                max_digits=10,
                            ),
                        ),
                        (
                            "notes",
                            models.TextField(
                                blank=True,
                                help_text="Additional notes about the property",
                                null=True,
                            ),
                        ),
                        (
                            "created_at",
                            models.DateTimeField(
                                auto_now_add=True, blank=True, null=True
                            ),
                        ),
                        (
                            "updated_at",
                            models.DateTimeField(auto_now=True, blank=True, null=True),
                        ),
                        (
                            "user",
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name="heritages",
                                to=settings.AUTH_USER_MODEL,
                            ),
                        ),
                    ],
                    options={
                        "db_table": "budget_heritage",
                        "indexes": [
                            models.Index(
                                fields=["user", "heritage_type"],
                                name="wealth_heritage_user_heritage_type_idx",
                            ),
                        ],
                    },
                ),
                migrations.CreateModel(
                    name="RetirementAccount",
                    fields=[
                        (
                            "id",
                            models.BigAutoField(
                                auto_created=True,
                                primary_key=True,
                                serialize=False,
                                verbose_name="ID",
                            ),
                        ),
                        (
                            "name",
                            models.CharField(
                                help_text="Name or nickname for this retirement account",
                                max_length=200,
                            ),
                        ),
                        (
                            "account_type",
                            models.CharField(
                                choices=[
                                    ("traditional_401k", "Traditional 401(k)"),
                                    ("roth_401k", "Roth 401(k)"),
                                    ("traditional_ira", "Traditional IRA"),
                                    ("roth_ira", "Roth IRA"),
                                    ("sep_ira", "SEP IRA"),
                                    ("simple_ira", "SIMPLE IRA"),
                                    ("pension", "Pension"),
                                    ("annuity", "Annuity"),
                                    ("other", "Other"),
                                ],
                                default="traditional_401k",
                                help_text="Type of retirement account",
                                max_length=20,
                            ),
                        ),
                        (
                            "provider",
                            models.CharField(
                                help_text="Financial institution or provider (e.g., Fidelity, Vanguard)",
                                max_length=100,
                            ),
                        ),
                        (
                            "account_number",
                            models.CharField(
                                blank=True,
                                help_text="Account number (last 4 digits for security)",
                                max_length=50,
                                null=True,
                            ),
                        ),
                        (
                            "current_balance",
                            models.DecimalField(
                                decimal_places=2,
                                default=0,
                                help_text="Current account balance",
                                max_digits=15,
                            ),
                        ),
                        (
                            "monthly_contribution",
                            models.DecimalField(
                                decimal_places=2,
                                default=0,
                                help_text="Monthly contribution amount",
                                max_digits=10,
                            ),
                        ),
                        (
                            "employer_match_percentage",
                            models.DecimalField(
                                decimal_places=2,
                                default=0,
                                help_text="Employer match percentage (e.g., 0.50 for 50%)",
                                max_digits=5,
                            ),
                        ),
                        (
                            "employer_match_limit",
                            models.DecimalField(
                                decimal_places=2,
                                default=0,
                                help_text="Maximum employer match amount per year",
                                max_digits=10,
                            ),
                        ),
                        (
                            "risk_level",
                            models.CharField(
                                choices=[
                                    ("conservative", "Conservative"),
                                    ("moderate", "Moderate"),
                                    ("aggressive", "Aggressive"),
                                    ("very_aggressive", "Very Aggressive"),
                                ],
                                default="moderate",
                                help_text="Risk level of the investment portfolio",
                                max_length=20,
                            ),
                        ),
                        (
                            "target_retirement_age",
                            models.PositiveIntegerField(
                                default=65,
                                help_text="Target retirement age",
                            ),
                        ),
                        (
                            "notes",
                            models.TextField(
                                blank=True,
                                help_text="Additional notes about the account",
                                null=True,
                            ),
                        ),
                        (
                            "created_at",
                            models.DateTimeField(
                                auto_now_add=True, blank=True, null=True
                            ),
                        ),
                        (
                            "updated_at",
                            models.DateTimeField(auto_now=True, blank=True, null=True),
                        ),
                        (
                            "user",
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name="retirement_accounts",
                                to=settings.AUTH_USER_MODEL,
                            ),
                        ),
                    ],
                    options={
                        "db_table": "budget_retirementaccount",
                        "indexes": [
                            models.Index(
                                fields=["user", "account_type"],
                                name="wealth_retire_user_account_type_idx",
                            ),
                        ],
                    },
                ),
            ],
            database_operations=[],
        )
    ]
