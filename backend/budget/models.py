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


class Investment(models.Model):
    STOCK = "stock"
    BOND = "bond"
    ETF = "etf"
    CRYPTO = "crypto"
    MUTUAL_FUND = "mutual_fund"
    FIXED_INCOME = "fixed_income"
    INVESTMENT_TYPE_CHOICES = [
        (STOCK, "Stock"),
        (BOND, "Bond"),
        (ETF, "ETF"),
        (CRYPTO, "Cryptocurrency"),
        (MUTUAL_FUND, "Mutual Fund"),
        (FIXED_INCOME, "Fixed Income"),
    ]

    symbol = models.CharField(
        max_length=20, unique=True, help_text="Ticker symbol or identifier")
    name = models.CharField(
        max_length=200, help_text="Full name of the investment")
    investment_type = models.CharField(
        max_length=20,
        choices=INVESTMENT_TYPE_CHOICES,
        default=STOCK,
        help_text="Type of investment",
    )
    quantity = models.DecimalField(
        max_digits=15,
        decimal_places=8,
        help_text="Number of shares/units owned",
    )
    purchase_price = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        help_text="Average purchase price per share/unit",
    )
    current_price = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Current market price per share/unit (optional, can be updated manually)",
    )
    purchase_date = models.DateField(help_text="Date of initial purchase")
    # Fixed Income specific fields
    principal_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Principal amount for fixed income investments",
    )
    interest_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Annual interest rate (e.g., 8.00 for 8%)",
    )
    compounding_frequency = models.CharField(
        max_length=20,
        choices=[
            ("annual", "Annual"),
            ("semi_annual", "Semi-Annual"),
            ("quarterly", "Quarterly"),
            ("monthly", "Monthly"),
        ],
        null=True,
        blank=True,
        help_text="How often interest is compounded",
    )
    term_years = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Investment term in years",
    )
    notes = models.TextField(blank=True, null=True,
                             help_text="Additional notes about the investment")

    @property
    def total_invested(self):
        """Total amount invested"""
        from decimal import Decimal

        if self.investment_type == self.FIXED_INCOME:
            return self.principal_amount or Decimal('0')
        return self.quantity * self.purchase_price

    @property
    def current_value(self):
        """Current total value"""
        if self.investment_type == self.FIXED_INCOME:
            return self._calculate_compound_value()
        if self.current_price:
            return self.quantity * self.current_price
        return self.total_invested  # If no current price, assume no change

    def _calculate_compound_value(self):
        """Calculate current value for fixed income investments using compound interest"""
        from decimal import Decimal

        if not self.principal_amount or not self.interest_rate or not self.term_years:
            return self.principal_amount or Decimal('0')

        principal = Decimal(str(self.principal_amount))
        rate = Decimal(str(self.interest_rate)) / \
            100  # Convert percentage to decimal
        years = Decimal(str(self.term_years))

        # Determine compounding frequency
        if self.compounding_frequency == "annual":
            n = Decimal('1')
        elif self.compounding_frequency == "semi_annual":
            n = Decimal('2')
        elif self.compounding_frequency == "quarterly":
            n = Decimal('4')
        elif self.compounding_frequency == "monthly":
            n = Decimal('12')
        else:
            n = Decimal('1')  # Default to annual

        # Compound interest formula: A = P(1 + r/n)^(nt)
        current_value = principal * (1 + rate / n) ** (n * years)
        return current_value

    @property
    def gain_loss(self):
        """Total gain/loss (current_value - total_invested)"""
        return self.current_value - self.total_invested

    @property
    def gain_loss_percentage(self):
        """Gain/loss as percentage"""
        if self.total_invested == 0:
            return 0
        return (self.gain_loss / self.total_invested) * 100

    @property
    def due_date(self):
        """Due date for fixed income investments (maturity date)"""
        if self.investment_type == self.FIXED_INCOME and self.purchase_date and self.term_years:
            from dateutil.relativedelta import relativedelta
            return self.purchase_date + relativedelta(years=int(self.term_years))
        return None

    def __str__(self):
        return f"{self.symbol} - {self.name}"


class Heritage(models.Model):
    LAND = "land"
    HOUSE = "house"
    APARTMENT = "apartment"
    COMMERCIAL = "commercial"
    OFFICE = "office"
    WAREHOUSE = "warehouse"
    OTHER = "other"

    HERITAGE_TYPE_CHOICES = [
        (LAND, "Land"),
        (HOUSE, "House"),
        (APARTMENT, "Apartment"),
        (COMMERCIAL, "Commercial Property"),
        (OFFICE, "Office"),
        (WAREHOUSE, "Warehouse"),
        (OTHER, "Other"),
    ]

    name = models.CharField(
        max_length=200, help_text="Name or description of the property")
    heritage_type = models.CharField(
        max_length=20,
        choices=HERITAGE_TYPE_CHOICES,
        default=HOUSE,
        help_text="Type of heritage/property",
    )
    address = models.TextField(help_text="Full address of the property")
    area = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Area in square meters or appropriate unit",
    )
    area_unit = models.CharField(
        max_length=20,
        default="sq_m",
        help_text="Unit for area measurement (sq_m, acres, hectares, etc.)",
    )
    purchase_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text="Purchase price of the property",
    )
    current_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Current market value (optional, can be updated manually)",
    )
    purchase_date = models.DateField(help_text="Date of purchase")
    monthly_rental_income = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Monthly rental income if applicable",
    )
    notes = models.TextField(blank=True, null=True,
                             help_text="Additional notes about the property")

    @property
    def gain_loss(self):
        """Total gain/loss (current_value - purchase_price)"""
        if self.current_value:
            return self.current_value - self.purchase_price
        return 0

    @property
    def gain_loss_percentage(self):
        """Gain/loss as percentage"""
        if self.purchase_price == 0:
            return 0
        return (self.gain_loss / self.purchase_price) * 100

    @property
    def annual_rental_income(self):
        """Annual rental income"""
        return self.monthly_rental_income * 12

    @property
    def rental_yield_percentage(self):
        """Rental yield as percentage (annual rent / current value)"""
        if self.current_value and self.current_value > 0:
            return (self.annual_rental_income / self.current_value) * 100
        return 0

    def __str__(self):
        return f"{self.name} - {self.get_heritage_type_display()}"


class RetirementAccount(models.Model):
    # Account Types
    TRADITIONAL_401K = "traditional_401k"
    ROTH_401K = "roth_401k"
    TRADITIONAL_IRA = "traditional_ira"
    ROTH_IRA = "roth_ira"
    SEP_IRA = "sep_ira"
    SIMPLE_IRA = "simple_ira"
    PENSION = "pension"
    ANNUITY = "annuity"
    OTHER = "other"

    ACCOUNT_TYPE_CHOICES = [
        (TRADITIONAL_401K, "Traditional 401(k)"),
        (ROTH_401K, "Roth 401(k)"),
        (TRADITIONAL_IRA, "Traditional IRA"),
        (ROTH_IRA, "Roth IRA"),
        (SEP_IRA, "SEP IRA"),
        (SIMPLE_IRA, "SIMPLE IRA"),
        (PENSION, "Pension"),
        (ANNUITY, "Annuity"),
        (OTHER, "Other"),
    ]

    # Risk Levels
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    VERY_AGGRESSIVE = "very_aggressive"

    RISK_LEVEL_CHOICES = [
        (CONSERVATIVE, "Conservative"),
        (MODERATE, "Moderate"),
        (AGGRESSIVE, "Aggressive"),
        (VERY_AGGRESSIVE, "Very Aggressive"),
    ]

    name = models.CharField(
        max_length=200, help_text="Name or nickname for this retirement account")
    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPE_CHOICES,
        default=TRADITIONAL_401K,
        help_text="Type of retirement account",
    )
    provider = models.CharField(
        max_length=100, help_text="Financial institution or provider (e.g., Fidelity, Vanguard)")
    account_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Account number (last 4 digits for security)"
    )
    current_balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text="Current account balance"
    )
    monthly_contribution = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Monthly contribution amount"
    )
    employer_match_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Employer match percentage (e.g., 0.50 for 50%)"
    )
    employer_match_limit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Maximum employer match amount per year"
    )
    risk_level = models.CharField(
        max_length=20,
        choices=RISK_LEVEL_CHOICES,
        default=MODERATE,
        help_text="Risk level of the investment portfolio"
    )
    target_retirement_age = models.PositiveIntegerField(
        default=65,
        help_text="Target retirement age"
    )
    notes = models.TextField(blank=True, null=True,
                             help_text="Additional notes about the account")

    @property
    def annual_contribution(self):
        """Annual contribution amount"""
        return self.monthly_contribution * 12

    @property
    def employer_match_amount(self):
        """Maximum annual employer match"""
        return min(
            self.annual_contribution * self.employer_match_percentage,
            self.employer_match_limit
        )

    @property
    def total_annual_contribution(self):
        """Total annual contribution including employer match"""
        return self.annual_contribution + self.employer_match_amount

    def __str__(self):
        provider_display = f" - {self.provider}" if self.provider else ""
        return f"{self.name} ({self.get_account_type_display()}){provider_display}"


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
