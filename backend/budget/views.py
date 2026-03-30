import csv
import hashlib
import io
import json
import logging
from datetime import datetime, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce
from django.http import JsonResponse
from django.utils import timezone

import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import (
    api_view,
    parser_classes,
    permission_classes,
    throttle_classes,
)
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    BankAccount,
    Category,
    CategoryDeletionRule,
    Heritage,
    Investment,
    ReclassificationRule,
    RetirementAccount,
    Transaction,
)
from .serializers import (
    BankAccountSerializer,
    CategoryDeletionRuleSerializer,
    CategorySerializer,
    HeritageSerializer,
    InvestmentSerializer,
    ReclassificationRuleSerializer,
    RetirementAccountSerializer,
    TransactionSerializer,
)
from .throttles import BulkOperationThrottle, UploadRateThrottle

# Resolved once at import time — avoids N806 and repeated calls
User = get_user_model()

logger = logging.getLogger(__name__)


@extend_schema(tags=["Categories"])
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    ordering = ["name"]

    def get_queryset(self):
        return (
            Category.objects.filter(user=self.request.user)
            .select_related("user")
            .order_by("name")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema(tags=["Investments"])
class InvestmentViewSet(viewsets.ModelViewSet):
    queryset = Investment.objects.all()
    serializer_class = InvestmentSerializer
    ordering = ["-purchase_date"]

    def get_queryset(self):
        return (
            Investment.objects.filter(user=self.request.user)
            .select_related("user")
            .order_by("-purchase_date")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema(tags=["Heritage"])
class HeritageViewSet(viewsets.ModelViewSet):
    queryset = Heritage.objects.all()
    serializer_class = HeritageSerializer
    ordering = ["-purchase_date"]

    def get_queryset(self):
        return (
            Heritage.objects.filter(user=self.request.user)
            .select_related("user")
            .order_by("-purchase_date")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RetirementAccountViewSet(viewsets.ModelViewSet):
    queryset = RetirementAccount.objects.all()
    serializer_class = RetirementAccountSerializer
    ordering = ["name"]

    def get_queryset(self):
        return (
            RetirementAccount.objects.filter(user=self.request.user)
            .select_related("user")
            .order_by("name")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    ordering = ["name"]

    def get_queryset(self):
        now = timezone.now()
        month_filter = Q(
            transactions__date__year=now.year,
            transactions__date__month=now.month,
        )
        return (
            BankAccount.objects.filter(user=self.request.user)
            .select_related("user")
            .annotate(
                transaction_count=Count("transactions"),
                total_balance=Coalesce(Sum("transactions__amount"), Decimal("0.00")),
                current_month_count=Count("transactions", filter=month_filter),
                current_month_balance=Coalesce(
                    Sum("transactions__amount", filter=month_filter), Decimal("0.00")
                ),
            )
            .order_by("name")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionFilter(django_filters.FilterSet):
    """Custom filter for Transaction to support date range queries"""

    date__gte = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date__lte = django_filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = Transaction
        fields = ["category", "account", "date__gte", "date__lte"]


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TransactionFilter
    search_fields = ["description"]
    ordering_fields = ["date", "amount"]

    def get_queryset(self):
        return (
            Transaction.objects.filter(user=self.request.user)
            .select_related("category", "account")
            .order_by("-date")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema(tags=["Reclassification Rules"])
class ReclassificationRuleViewSet(viewsets.ModelViewSet):
    queryset = ReclassificationRule.objects.all()
    serializer_class = ReclassificationRuleSerializer
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            ReclassificationRule.objects.filter(user=self.request.user, is_active=True)
            .select_related("user", "from_category", "to_category")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema(tags=["Category Deletion Rules"])
class CategoryDeletionRuleViewSet(viewsets.ModelViewSet):
    queryset = CategoryDeletionRule.objects.all()
    serializer_class = CategoryDeletionRuleSerializer
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            CategoryDeletionRule.objects.filter(user=self.request.user, is_active=True)
            .select_related("user", "category")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema(
    parameters=[
        OpenApiParameter(
            name="period",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
            description="Time period (week, month, quarter, year)",
            enum=["week", "month", "quarter", "year"],
        )
    ],
    responses={
        200: {"type": "object", "properties": {"balance_week": {"type": "number"}}},
        400: {"type": "object", "properties": {"error": {"type": "string"}}},
    },
)
@api_view(["GET"])
def balance_by_period(request, period):
    """Calculate balance for a specific time period."""
    # Validate period parameter
    valid_periods = ["week", "month", "quarter", "year"]
    if period not in valid_periods:
        return JsonResponse(
            {"error": f"Invalid period. Must be one of: {', '.join(valid_periods)}"},
            status=400,
        )

    now = datetime.now().date()
    if period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "quarter":
        start = now - timedelta(days=90)
    elif period == "year":
        start = now - timedelta(days=365)

    total = (
        Transaction.objects.filter(user=request.user, date__gte=start).aggregate(
            total=Sum("amount")
        )["total"]
        or 0
    )
    return JsonResponse({f"balance_{period}": total})


@extend_schema(
    parameters=[
        OpenApiParameter(
            name="period",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
            description="Time period (week, month, quarter, year) or YYYY-MM format",
        )
    ],
    responses={
        200: {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "name": {"type": "string"},
                    "budget": {"type": "number"},
                    "spending": {"type": "number"},
                    "percentage_used": {"type": "number"},
                },
            },
        },
        400: {"type": "object", "properties": {"error": {"type": "string"}}},
    },
)
@api_view(["GET"])
def category_spending_by_period(request, period):
    """
    Get spending by category for a specific period.
    Supports both predefined periods ('week', 'month', 'quarter', 'year')
    and specific year-month format ('YYYY-MM').
    Returns category budgets vs actual spending.
    Optimized to prevent N+1 queries.
    """
    now = datetime.now().date()

    # Check if period is in YYYY-MM format
    if len(period) == 7 and period[4] == "-":
        try:
            year = int(period[:4])
            month = int(period[5:])
            start = datetime(year, month, 1).date()
            # Calculate end of month
            if month == 12:
                end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
            else:
                end = datetime(year, month + 1, 1).date() - timedelta(days=1)
        except ValueError:
            return JsonResponse({"error": "Invalid year-month format"}, status=400)
    else:
        # Handle predefined periods
        if period == "week":
            start = now - timedelta(days=7)
        elif period == "month":
            start = now - timedelta(days=30)
        elif period == "quarter":
            start = now - timedelta(days=90)
        elif period == "year":
            start = now - timedelta(days=365)
        else:
            return JsonResponse({"error": "Invalid period"}, status=400)
        end = now

    # Optimized: Get all spending in one query grouped by category
    spending_by_category = dict(
        Transaction.objects.filter(user=request.user, date__gte=start, date__lte=end)
        .values("category")
        .annotate(total=Sum("amount"))
        .values_list("category", "total")
    )

    # Get all categories with their budgets
    categories = Category.objects.filter(user=request.user)

    result = []
    for category in categories:
        # Get pre-calculated spending from dict (no additional query)
        spending = spending_by_category.get(category.id, 0)

        # Calculate budget vs spending
        budget = float(category.monthly_budget)
        spending_float = float(spending)
        balance = budget - spending_float

        result.append(
            {
                "id": category.id,
                "name": category.name,
                "budget": budget,
                "spending": spending_float,
                "balance": balance,
                "percentage_used": (
                    (spending_float / budget * 100) if budget > 0 else 0
                ),
            }
        )

    return JsonResponse(
        {
            "period": period,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "categories": result,
        }
    )


@extend_schema(
    tags=["Transactions"],
    responses={
        200: {
            "type": "object",
            "properties": {
                "imported": {"type": "integer"},
                "skipped": {"type": "integer"},
                "message": {"type": "string"},
            },
        },
        400: {
            "type": "object",
            "properties": {
                "error_type": {
                    "type": "string",
                    "enum": ["format", "mapping", "validation"],
                },
                "message": {"type": "string"},
                "details": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "row": {"type": "integer"},
                            "field": {"type": "string"},
                            "error": {"type": "string"},
                        },
                    },
                },
            },
        },
    },
)
@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
@throttle_classes([UploadRateThrottle])
def upload_bank_statement(request):
    """
    Upload and process a bank statement CSV file.
    Supports multiple CSV formats with flexible column names and date formats.
    Handles both credit card and account transaction formats.

    Security: Validates file size (max 10MB) and content type.
    """

    def error_response(error_type, message, details):
        return Response(
            {
                "error_type": error_type,
                "message": message,
                "details": details,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file presence
    if "file" not in request.FILES:
        return error_response(
            "format",
            "Invalid CSV format. Please check your file.",
            [{"error": "No file provided"}],
        )

    file = request.FILES["file"]

    # Validate file extension
    if not file.name.endswith(".csv"):
        return error_response(
            "format",
            "Invalid CSV format. Please check your file.",
            [{"error": "File must be a CSV"}],
        )

    # Validate file size (5MB limit)
    max_size = 5 * 1024 * 1024  # 5MB
    if file.size > max_size:
        return error_response(
            "format",
            "Invalid CSV format. Please check your file.",
            [
                {
                    "error": (
                        f"File size exceeds maximum allowed size of "
                        f"{max_size / (1024 * 1024):.0f}MB"
                    )
                }
            ],
        )

    # Validate content type
    allowed_content_types = ["text/csv", "application/csv", "application/vnd.ms-excel"]
    if file.content_type and file.content_type not in allowed_content_types:
        return error_response(
            "format",
            "Invalid CSV format. Please check your file.",
            [{"error": "Invalid file content type. Must be CSV."}],
        )

    try:
        # Read and parse CSV with encoding detection
        try:
            file_data = file.read().decode("utf-8")
        except UnicodeDecodeError:
            # Try latin-1 encoding as fallback
            try:
                file.seek(0)
                file_data = file.read().decode("latin-1")
            except UnicodeDecodeError:
                return error_response(
                    "format",
                    "Invalid CSV format. Please check your file.",
                    [{"error": "File encoding is not supported."}],
                )

        csv_reader = csv.DictReader(io.StringIO(file_data))

        # Detect CSV type based on headers
        headers = csv_reader.fieldnames or []
        if not headers:
            return error_response(
                "format",
                "Invalid CSV format. Please check your file.",
                [{"error": "CSV headers could not be read."}],
            )

        header_set = {header.strip().lower() for header in headers if header}
        is_account_csv = "Details" in headers and "Type" in headers

        required_column_candidates = {
            "date": ["Posting Date", "Post Date", "date", "Date"]
            if is_account_csv
            else ["Transaction Date", "Post Date", "date", "Date"],
            "description": ["Description", "description", "desc"],
            "amount": ["Amount", "amount", "amt"],
        }

        mapping_errors = []
        for field, candidates in required_column_candidates.items():
            if not any(candidate.lower() in header_set for candidate in candidates):
                mapping_errors.append(
                    {
                        "field": field,
                        "error": f"Column '{candidates[0]}' not found",
                    }
                )

        if mapping_errors:
            return error_response(
                "mapping",
                "Required columns not found in CSV.",
                mapping_errors,
            )

        transactions_created = []
        transactions_skipped = []
        errors = []
        validation_errors = []

        try:
            for row_num, row in enumerate(
                csv_reader, start=2
            ):  # Start at 2 because row 1 is headers
                try:
                    if is_account_csv:
                        # Account CSV format:
                        # Details, Posting Date, Description, Amount, Type
                        date_str = get_column_value(
                            row, ["Posting Date", "Post Date", "date", "Date"]
                        )
                        description = get_column_value(
                            row, ["Description", "description", "desc"]
                        )
                        amount_str = get_column_value(row, ["Amount", "amount", "amt"])
                        category_name = get_column_value(
                            row, ["Type", "type"]
                        )  # Use Type as category
                    else:
                        # Credit card CSV format: flexible columns
                        date_str = get_column_value(
                            row, ["Transaction Date", "Post Date", "date", "Date"]
                        )
                        description = get_column_value(
                            row, ["Description", "description", "desc"]
                        )
                        amount_str = get_column_value(row, ["Amount", "amount", "amt"])
                        category_name = get_column_value(
                            row, ["Category", "category", "cat"]
                        )

                    # Validate required fields
                    if not date_str or not description or not amount_str:
                        errors.append(
                            f"Row {row_num}: Missing required fields "
                            f"(date, description, amount)"
                        )
                        validation_errors.append(
                            {
                                "row": row_num,
                                "field": "required_fields",
                                "error": (
                                    "Missing required fields "
                                    "(date, description, amount)"
                                ),
                            }
                        )
                        continue

                    # Parse date - try multiple formats
                    date = None
                    date_formats = [
                        "%m/%d/%Y",
                        "%Y-%m-%d",
                        "%d/%m/%Y",
                        "%Y/%m/%d",
                    ]
                    for date_format in date_formats:
                        try:
                            date = datetime.strptime(date_str, date_format).date()
                            break
                        except ValueError:
                            continue

                    if not date:
                        errors.append(
                            f"Row {row_num}: Invalid date format. "
                            f"Supported formats: MM/DD/YYYY, YYYY-MM-DD, "
                            f"DD/MM/YYYY"
                        )
                        validation_errors.append(
                            {
                                "row": row_num,
                                "field": "date",
                                "error": "Invalid date format",
                            }
                        )
                        continue

                    # Parse amount - handle various formats
                    try:
                        # Remove currency symbols, commas, and extra spaces
                        clean_amount = (
                            amount_str.replace("$", "")
                            .replace(",", "")
                            .replace(" ", "")
                        )
                        amount = float(clean_amount)
                    except ValueError:
                        errors.append(f"Row {row_num}: Invalid amount format")
                        validation_errors.append(
                            {
                                "row": row_num,
                                "field": "amount",
                                "error": "Invalid amount format",
                            }
                        )
                        continue

                    # Create reference ID for duplicate detection
                    reference_data = f"{date_str}-{description}-{amount_str}"
                    reference_id = hashlib.md5(reference_data.encode()).hexdigest()

                    # Check for duplicates
                    if Transaction.objects.filter(reference_id=reference_id).exists():
                        transactions_skipped.append(
                            {
                                "row": row_num,
                                "description": description,
                                "reason": "Duplicate transaction",
                            }
                        )
                        continue

                    # Get or create category
                    category = None
                    if category_name:
                        # Determine classification based on amount
                        classification = (
                            Category.INCOME if amount > 0 else Category.SPEND
                        )
                        category, created = Category.objects.get_or_create(
                            name=category_name,
                            user=request.user,
                            defaults={"classification": classification},
                        )
                        # If category already exists but has wrong
                        # classification, update it
                        if not created and category.classification != classification:
                            category.classification = classification
                            category.save()
                    else:
                        # Try to auto-categorize based on description keywords
                        category = auto_categorize_transaction(
                            description, request.user
                        )

                    if not category:
                        # Use a default category if auto-categorization fails
                        category, created = Category.objects.get_or_create(
                            name="Uncategorized",
                            user=request.user,
                            defaults={"classification": Category.SPEND},
                        )

                    # Resolve the target bank account
                    account_id = request.data.get("account_id")
                    account = None
                    if account_id:
                        try:
                            account = BankAccount.objects.get(
                                id=int(account_id), user=request.user
                            )
                        except (BankAccount.DoesNotExist, ValueError):
                            pass

                    if account is None:
                        # Fall back to auto-selecting by CSV type
                        account_type = (
                            BankAccount.CHECKING
                            if is_account_csv
                            else BankAccount.CREDIT_CARD
                        )
                        account, _ = BankAccount.objects.get_or_create(
                            user=request.user,
                            account_type=account_type,
                            defaults={
                                "name": (
                                    "My Checking Account"
                                    if is_account_csv
                                    else "My Credit Card"
                                ),
                                "currency": "USD",
                            },
                        )

                    # Create transaction
                    transaction = Transaction.objects.create(
                        date=date,
                        amount=amount,
                        description=description,
                        category=category,
                        user=request.user,
                        account=account,
                        import_source="bank_statement",
                        reference_id=reference_id,
                    )

                    transactions_created.append(
                        {
                            "id": transaction.id,
                            "date": date_str,
                            "description": description,
                            "amount": amount,
                            "category": category.name,
                        }
                    )

                except Exception:
                    logger.exception("Error processing CSV row %d", row_num)
                    errors.append(f"Row {row_num}: Failed to process row")
                    validation_errors.append(
                        {
                            "row": row_num,
                            "field": "row",
                            "error": "Failed to process row",
                        }
                    )
                    continue
        except csv.Error:
            logger.exception("CSV parse error in upload_bank_statement")
            return error_response(
                "format",
                "Invalid CSV format. Please check your file.",
                [{"error": "The file could not be parsed as CSV"}],
            )

        if validation_errors:
            return error_response(
                "validation",
                "Some rows could not be imported.",
                validation_errors,
            )

        return Response(
            {
                "imported": len(transactions_created),
                "skipped": len(transactions_skipped),
                "message": (
                    f"Successfully imported {len(transactions_created)} transactions"
                ),
                "transactions_created": transactions_created,
                "transactions_skipped": transactions_skipped,
                "errors": errors,
                "summary": {
                    "created": len(transactions_created),
                    "skipped": len(transactions_skipped),
                    "errors": len(errors),
                },
            }
        )

    except Exception:
        # Log error securely without exposing details
        logger.exception("Error processing bank statement upload")

        return error_response(
            "format",
            "Invalid CSV format. Please check your file.",
            [{"error": "An unexpected error occurred while processing the file"}],
        )


def get_column_value(row, possible_names):
    """
    Get value from row using multiple possible column names.
    Returns the first non-empty value found, or None if none found.
    """
    for name in possible_names:
        value = row.get(name, "").strip()
        if value:  # Return first non-empty value
            return value
    return None


def auto_categorize_transaction(description, user):
    """
    Simple auto-categorization based on keywords in description.
    This is a basic implementation - could be enhanced with ML or
    more sophisticated rules.
    """
    description_lower = description.lower()

    # Define keyword mappings - expanded to handle more categories
    category_mappings = {
        "Food & Drink": [
            "restaurant",
            "food",
            "grocery",
            "supermarket",
            "cafe",
            "coffee",
            "pizza",
            "burger",
            "mcdonald",
            "chick-fil-a",
            "donut",
            "sq *",
            "golden corral",
        ],
        "Groceries": [
            "fiesta mart",
            "foodland",
            "wm supercenter",
            "paypal *walmart",
        ],
        "Gas": [
            "chevron",
            "exxon",
            "murphy",
            "love's",
            "super fuels",
            "7-eleven",
        ],
        "Health & Wellness": [
            "bswhealth",
            "texas digestive",
            "cvs/pharmacy",
            "pharmacy",
        ],
        "Travel": [
            "ntta",
            "aeroenlaces",
            "vivaaerob",
            "parking",
            "gaston garage",
        ],
        "Bills & Utilities": [
            "metrob",
            "t-mobile",
            "eqt*swhp",
            "paypal *netflix",
        ],
        "Shopping": ["dd's discount", "adobe", "home depot"],
        "Home": ["home depot"],
        "Income": ["salary", "payroll", "deposit", "transfer in", "income"],
    }

    for category_name, keywords in category_mappings.items():
        if any(keyword in description_lower for keyword in keywords):
            try:
                return Category.objects.get(name=category_name, user=user)
            except Category.DoesNotExist:
                # Set classification based on category type
                classification = (
                    Category.INCOME if category_name == "Income" else Category.SPEND
                )
                return Category.objects.create(
                    name=category_name, user=user, classification=classification
                )

    return None


@extend_schema(
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "from_category_id": {"type": "integer"},
                "to_category_id": {"type": "integer"},
            },
            "required": ["from_category_id", "to_category_id"],
        }
    },
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "transactions_updated": {"type": "integer"},
            },
        },
        400: {"type": "object", "properties": {"error": {"type": "string"}}},
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([BulkOperationThrottle])
def bulk_reclassify_transactions(request):
    """
    Reclassify all transactions from one category to another.
    Prevents circular reclassification by checking if the source and target
    categories are the same.
    """
    from_category_id = request.data.get("from_category_id")
    to_category_id = request.data.get("to_category_id")

    # Validate required fields
    if not from_category_id or not to_category_id:
        return Response(
            {"error": "Both from_category_id and to_category_id are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate IDs are integers
    try:
        from_category_id = int(from_category_id)
        to_category_id = int(to_category_id)
    except (ValueError, TypeError):
        return Response(
            {"error": "Category IDs must be valid integers"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Prevent circular reclassification (same category)
    if from_category_id == to_category_id:
        return Response(
            {"error": "Cannot reclassify to the same category"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Verify both categories exist and belong to the user
        from_category = Category.objects.get(id=from_category_id, user=request.user)
        to_category = Category.objects.get(id=to_category_id, user=request.user)

        # Update all transactions from source category to target category
        transactions_updated = Transaction.objects.filter(
            user=request.user, category=from_category
        ).update(category=to_category)

        return Response(
            {
                "message": (
                    f"Successfully reclassified {transactions_updated} "
                    f"transactions from '{from_category.name}' to "
                    f"'{to_category.name}'"
                ),
                "transactions_updated": transactions_updated,
                "from_category": from_category.name,
                "to_category": to_category.name,
            }
        )

    except Category.DoesNotExist:
        return Response(
            {"error": "Category not found or does not belong to user"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except ValueError:
        return Response(
            {"error": "Invalid input data"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception:
        # Log the actual error but don't expose details to client
        logger.exception("Error in bulk_reclassify_transactions")
        return Response(
            {"error": "An unexpected error occurred"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "rule_ids": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "description": "Array of reclassification rule IDs to execute",
                },
            },
            "required": ["rule_ids"],
        }
    },
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "total_transactions_updated": {"type": "integer"},
                "rules_applied": {"type": "integer"},
                "rule_results": {"type": "array"},
            },
        },
        400: {"type": "object", "properties": {"error": {"type": "string"}}},
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([BulkOperationThrottle])
def bulk_execute_reclassification_rules(request):
    """
    Efficiently execute multiple reclassification rules.
    Loads transactions ONCE and applies all rules sequentially.
    Much more efficient than calling apply_reclassification_rule multiple times.
    """
    rule_ids = request.data.get("rule_ids", [])

    # Validate required field
    if not rule_ids:
        return Response(
            {"error": "rule_ids is required and must not be empty"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate all IDs are integers
    try:
        rule_ids = [int(rid) for rid in rule_ids]
    except (ValueError, TypeError):
        return Response(
            {"error": "All rule_ids must be valid integers"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Fetch all rules at once
        rules = list(
            ReclassificationRule.objects.filter(
                id__in=rule_ids, user=request.user, is_active=True
            )
            .select_related("from_category", "to_category")
            .order_by("id")
        )

        if len(rules) != len(rule_ids):
            return Response(
                {
                    "error": "One or more rules not found, inactive, or do not belong to user"
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Load ALL user transactions ONCE
        all_transactions = list(
            Transaction.objects.filter(user=request.user).select_related("category")
        )

        # Track which transactions have been reclassified
        # Key: transaction.id, Value: new category_id
        reclassification_map = {}
        rule_results = []

        # Apply each rule sequentially
        for rule in rules:
            matching_count = 0

            # Check each transaction against this rule
            for txn in all_transactions:
                # Check if transaction matches the rule
                if rule.matches_transaction(txn):
                    # Mark this transaction for reclassification
                    reclassification_map[txn.id] = rule.to_category_id
                    matching_count += 1

                    # Update the in-memory transaction object so subsequent rules see the change
                    txn.category_id = rule.to_category_id
                    txn.category = rule.to_category

            rule_results.append(
                {
                    "rule_id": rule.id,
                    "rule_name": rule.rule_name or str(rule),
                    "transactions_matched": matching_count,
                }
            )

        # Perform ALL updates in a single database operation
        total_updated = 0
        if reclassification_map:
            # Batch update by grouping transactions by target category
            from collections import defaultdict

            category_transaction_map = defaultdict(list)
            for txn_id, category_id in reclassification_map.items():
                category_transaction_map[category_id].append(txn_id)

            # Execute batch updates
            for category_id, txn_ids in category_transaction_map.items():
                updated = Transaction.objects.filter(id__in=txn_ids).update(
                    category_id=category_id
                )
                total_updated += updated

        return Response(
            {
                "message": f"Successfully executed {len(rules)} rule(s) and reclassified {total_updated} transaction(s)",
                "total_transactions_updated": total_updated,
                "rules_applied": len(rules),
                "rule_results": rule_results,
            }
        )

    except Exception:
        # Log the actual error but don't expose details to client
        logger.exception("Error in bulk_execute_reclassification_rules")
        return Response(
            {"error": "An unexpected error occurred"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "rule_id": {
                    "type": "integer",
                    "description": "ID of the reclassification rule to preview",
                },
            },
            "required": ["rule_id"],
        }
    },
    responses={
        200: {
            "type": "object",
            "properties": {
                "matching_count": {"type": "integer"},
                "transactions": {"type": "array"},
                "rule_name": {"type": "string"},
            },
        },
        404: {"type": "object", "properties": {"error": {"type": "string"}}},
        400: {"type": "object", "properties": {"error": {"type": "string"}}},
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def preview_reclassification_rule(request):
    """
    Preview which transactions will be matched by a reclassification rule
    without actually updating them.
    """
    rule_id = request.data.get("rule_id")

    # Validate required field
    if not rule_id:
        return Response(
            {"error": "rule_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate ID is integer
    try:
        rule_id = int(rule_id)
    except (ValueError, TypeError):
        return Response(
            {"error": "rule_id must be a valid integer"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Fetch the rule
        rule = ReclassificationRule.objects.select_related(
            "from_category", "to_category"
        ).get(id=rule_id, user=request.user, is_active=True)

        # Get all user transactions
        transactions = Transaction.objects.filter(user=request.user).select_related(
            "category"
        )

        # Filter transactions that match the rule
        matching_transactions = [
            txn for txn in transactions if rule.matches_transaction(txn)
        ]

        # Serialize matching transactions
        from .serializers import TransactionSerializer

        serialized_transactions = TransactionSerializer(
            matching_transactions[:50], many=True
        ).data

        return Response(
            {
                "matching_count": len(matching_transactions),
                "transactions": serialized_transactions,
                "rule_name": rule.rule_name or str(rule),
                "from_category_name": rule.from_category.name
                if rule.from_category
                else "All Categories",
                "to_category_name": rule.to_category.name,
            }
        )

    except ReclassificationRule.DoesNotExist:
        return Response(
            {"error": "Rule not found, inactive, or does not belong to user"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception:
        # Log the actual error but don't expose details to client
        logger.exception("Error in preview_reclassification_rule")
        return Response(
            {"error": "An unexpected error occurred"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "category_ids": {
                    "type": "array",
                    "items": {"type": "integer"},
                },
            },
            "required": ["category_ids"],
        }
    },
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "transactions_deleted": {"type": "integer"},
                "categories_processed": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
        },
        400: {"type": "object", "properties": {"error": {"type": "string"}}},
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([BulkOperationThrottle])
def bulk_delete_transactions_by_category(request):
    """
    Delete all transactions belonging to specified categories.
    Accepts an array of category IDs to delete transactions from multiple
    categories at once.
    """
    category_ids = request.data.get("category_ids", [])

    if not category_ids or not isinstance(category_ids, list):
        return Response(
            {"error": "category_ids must be a non-empty array"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Verify all categories exist and belong to the user
        categories = Category.objects.filter(id__in=category_ids, user=request.user)

        if categories.count() != len(category_ids):
            return Response(
                {
                    "error": (
                        "One or more categories not found or do not belong to user"
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get category names for response
        category_names = list(categories.values_list("name", flat=True))

        # Delete all transactions in these categories
        transactions_deleted, _ = Transaction.objects.filter(
            user=request.user, category__in=categories
        ).delete()

        return Response(
            {
                "message": (
                    f"Successfully deleted {transactions_deleted} "
                    f"transactions from {len(category_names)} categories"
                ),
                "transactions_deleted": transactions_deleted,
                "categories_processed": category_names,
            }
        )

    except Exception:
        # Log the actual error but don't expose details to client
        logger.exception("Error in bulk_delete_transactions_by_category")
        return Response(
            {"error": "An unexpected error occurred"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


BACKUP_VERSION = "1.0"

# All exportable entity keys.
# 'users' must come first — all other entities depend on it.
BACKUP_ENTITIES = (
    "users",
    "categories",
    "bank_accounts",
    "transactions",
    "investments",
    "heritages",
    "retirement_accounts",
    "reclassification_rules",
    "category_deletion_rules",
)


@extend_schema(
    parameters=[
        {
            "name": "models",
            "in": "query",
            "description": (
                "Comma-separated list of entity types to include, or 'all'. "
                "Valid values: users (staff only), categories, bank_accounts, "
                "transactions, investments, heritages, retirement_accounts, "
                "reclassification_rules, category_deletion_rules"
            ),
            "required": False,
            "schema": {"type": "string"},
        }
    ],
    responses={
        200: {
            "type": "object",
            "description": "JSON backup file download containing selected user data",
        }
    },
    description=(
        "Export selected user data as a JSON backup file. "
        "Including 'users' requires staff privileges and exports all "
        "non-staff/non-superuser accounts together with their data."
    ),
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def backup_database(request):
    """
    Export data as a JSON backup file.

    Single-user mode (default): exports the authenticated user's own data.
    Multi-user mode (when 'users' is in the models param, staff only):
      exports all non-staff/non-superuser accounts and their associated data,
      with a 'user_id' field on every entity record for restore remapping.
    """
    from django.core.serializers.json import DjangoJSONEncoder
    from django.http import HttpResponse

    user = request.user

    # Determine which entities to include
    models_param = request.query_params.get("models", "all").strip().lower()
    if models_param == "all":
        include = set(BACKUP_ENTITIES)
    else:
        requested = {m.strip() for m in models_param.split(",") if m.strip()}
        include = requested & set(BACKUP_ENTITIES)
        if not include:
            return Response(
                {"error": "No valid entity types specified in 'models' parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Multi-user mode requires staff privilege
    multi_user_mode = "users" in include
    if multi_user_mode and not user.is_staff:
        return Response(
            {"error": "Only staff users can export user accounts"},
            status=status.HTTP_403_FORBIDDEN,
        )

    backup_data: dict = {
        "version": BACKUP_VERSION,
        "exported_at": datetime.now().isoformat(),
        "username": user.username,
        "multi_user": multi_user_mode,
    }

    # In multi-user mode query all regular users; otherwise scope to requester
    if multi_user_mode:
        target_users_qs = User.objects.filter(is_staff=False, is_superuser=False)
        user_filter: dict = {"user__in": target_users_qs}
        backup_data["users"] = list(
            target_users_qs.values(
                "id",
                "username",
                "email",
                "first_name",
                "last_name",
                "is_active",
                "date_joined",
            )
        )
    else:
        user_filter = {"user": user}

    # Helper: optionally append user_id to a values() query
    def _values(*fields: str) -> tuple:
        return (*fields, "user_id") if multi_user_mode else fields

    if "categories" in include:
        backup_data["categories"] = list(
            Category.objects.filter(**user_filter).values(
                *_values("id", "name", "classification", "monthly_budget")
            )
        )

    if "bank_accounts" in include:
        backup_data["bank_accounts"] = list(
            BankAccount.objects.filter(**user_filter).values(
                *_values(
                    "id",
                    "name",
                    "account_type",
                    "institution",
                    "account_number",
                    "currency",
                    "notes",
                    "is_active",
                )
            )
        )

    if "transactions" in include:
        backup_data["transactions"] = list(
            Transaction.objects.filter(**user_filter).values(
                *_values(
                    "id",
                    "date",
                    "amount",
                    "description",
                    "account_id",
                    "import_source",
                    "reference_id",
                    "category_id",
                )
            )
        )

    if "investments" in include:
        backup_data["investments"] = list(
            Investment.objects.filter(**user_filter).values(
                *_values(
                    "id",
                    "name",
                    "symbol",
                    "investment_type",
                    "quantity",
                    "purchase_price",
                    "current_price",
                    "purchase_date",
                    "principal_amount",
                    "interest_rate",
                    "compounding_frequency",
                    "term_years",
                    "notes",
                )
            )
        )

    if "heritages" in include:
        backup_data["heritages"] = list(
            Heritage.objects.filter(**user_filter).values(
                *_values(
                    "id",
                    "name",
                    "heritage_type",
                    "address",
                    "area",
                    "area_unit",
                    "purchase_price",
                    "current_value",
                    "purchase_date",
                    "monthly_rental_income",
                    "notes",
                )
            )
        )

    if "retirement_accounts" in include:
        backup_data["retirement_accounts"] = list(
            RetirementAccount.objects.filter(**user_filter).values(
                *_values(
                    "id",
                    "name",
                    "account_type",
                    "provider",
                    "account_number",
                    "current_balance",
                    "monthly_contribution",
                    "employer_match_percentage",
                    "employer_match_limit",
                    "risk_level",
                    "target_retirement_age",
                    "notes",
                )
            )
        )

    if "reclassification_rules" in include:
        backup_data["reclassification_rules"] = list(
            ReclassificationRule.objects.filter(**user_filter).values(
                *_values(
                    "id",
                    "rule_name",
                    "from_category_id",
                    "to_category_id",
                    "conditions",
                    "is_active",
                    "created_at",
                )
            )
        )

    if "category_deletion_rules" in include:
        backup_data["category_deletion_rules"] = list(
            CategoryDeletionRule.objects.filter(**user_filter).values(
                *_values("id", "category_id", "is_active", "created_at")
            )
        )

    filename = f"backup_{user.username}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    response = HttpResponse(
        json.dumps(backup_data, indent=2, cls=DjangoJSONEncoder),
        content_type="application/json",
    )
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


@extend_schema(
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {
                "file": {"type": "string", "format": "binary"},
                "replace_existing": {
                    "type": "boolean",
                    "description": "If true, deletes all existing user data before restoring",
                },
            },
            "required": ["file"],
        }
    },
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "summary": {"type": "object"},
            },
        },
        400: {"type": "object", "properties": {"error": {"type": "string"}}},
    },
    description="Restore user data from a previously exported JSON backup file.",
)
@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
@throttle_classes([BulkOperationThrottle])
def restore_database(request):
    """
    Restore user data from a JSON backup file.

    Single-user mode (backup has no 'users' key): all entities are restored
    under the authenticated user (same as before).

    Multi-user mode (backup includes 'users' key, staff only): creates any
    missing regular users from the backup, then restores every entity under
    the correct owner using the user_id field embedded in the backup.

    Optionally replaces all existing user data when replace_existing=true.
    """
    if "file" not in request.FILES:
        return Response(
            {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    uploaded_file = request.FILES["file"]

    if not uploaded_file.name.endswith(".json"):
        return Response(
            {"error": "File must be a .json backup file"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    max_size = 50 * 1024 * 1024  # 50 MB
    if uploaded_file.size > max_size:
        return Response(
            {"error": "File too large (max 50 MB)"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        raw = uploaded_file.read().decode("utf-8")
        data = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError):
        return Response(
            {"error": "Invalid JSON file"}, status=status.HTTP_400_BAD_REQUEST
        )

    if "version" not in data or not any(k in data for k in BACKUP_ENTITIES):
        return Response(
            {"error": "Invalid backup format: missing required fields"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    replace_existing = str(request.data.get("replace_existing", "false")).lower() in (
        "true",
        "1",
        "yes",
    )
    requester = request.user
    multi_user_mode = "users" in data

    if multi_user_mode and not requester.is_staff:
        return Response(
            {
                "error": "Only staff users can restore backups that contain user accounts"
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        from django.db import transaction as db_transaction

        with db_transaction.atomic():
            # ----------------------------------------------------------------
            # Step 1 — build old_backup_user_id → live User object map
            # ----------------------------------------------------------------
            old_id_to_user: dict[int, object] = {}
            users_created = 0

            if multi_user_mode:
                for u in data.get("users", []):
                    obj, created = User.objects.get_or_create(
                        username=u["username"],
                        defaults={
                            "email": u.get("email", ""),
                            "first_name": u.get("first_name", ""),
                            "last_name": u.get("last_name", ""),
                            "is_active": u.get("is_active", True),
                        },
                    )
                    if created:
                        # Restored users cannot log in until they reset their
                        # password — avoids shipping credential hashes.
                        obj.set_unusable_password()
                        obj.save(update_fields=["password"])
                        users_created += 1
                    old_id_to_user[u["id"]] = obj

            def resolve_user(entity: dict):
                """Return the live User for an entity, or None to skip it."""
                uid = entity.get("user_id")
                if uid is not None:
                    return old_id_to_user.get(uid)  # None → user not in map
                return requester  # old single-user backup format

            # ----------------------------------------------------------------
            # Step 2 — optionally delete existing data
            # ----------------------------------------------------------------
            if replace_existing:
                targets = (
                    list(old_id_to_user.values()) if old_id_to_user else [requester]
                )
                for target in targets:
                    CategoryDeletionRule.objects.filter(user=target).delete()
                    ReclassificationRule.objects.filter(user=target).delete()
                    Transaction.objects.filter(user=target).delete()
                    BankAccount.objects.filter(user=target).delete()
                    Investment.objects.filter(user=target).delete()
                    Heritage.objects.filter(user=target).delete()
                    RetirementAccount.objects.filter(user=target).delete()
                    Category.objects.filter(user=target).delete()

            # ----------------------------------------------------------------
            # Step 3 — restore entities
            # Category map keyed by (target_user_id, old_backup_cat_id) to
            # handle collisions across users in multi-user mode.
            # ----------------------------------------------------------------
            old_id_to_category: dict[tuple, object] = {}
            categories_created = 0

            for cat in data.get("categories", []):
                target = resolve_user(cat)
                if target is None:
                    continue
                obj, created = Category.objects.get_or_create(
                    name=cat["name"],
                    user=target,
                    defaults={
                        "classification": cat.get("classification", Category.SPEND),
                        "monthly_budget": cat.get("monthly_budget", 0),
                    },
                )
                old_id_to_category[(target.id, cat["id"])] = obj
                if created:
                    categories_created += 1

            # --- Bank Accounts ---
            old_id_to_bank_account: dict[tuple, object] = {}
            bank_accounts_created = 0

            for ba in data.get("bank_accounts", []):
                target = resolve_user(ba)
                if target is None:
                    continue
                obj, created = BankAccount.objects.get_or_create(
                    user=target,
                    name=ba["name"],
                    defaults={
                        "account_type": ba.get("account_type", BankAccount.CHECKING),
                        "institution": ba.get("institution", ""),
                        "account_number": ba.get("account_number") or None,
                        "currency": ba.get("currency", "USD"),
                        "notes": ba.get("notes") or None,
                        "is_active": ba.get("is_active", True),
                    },
                )
                old_id_to_bank_account[(target.id, ba["id"])] = obj
                if created:
                    bank_accounts_created += 1

            # --- Transactions ---
            transactions_created = 0
            for t in data.get("transactions", []):
                target = resolve_user(t)
                if target is None:
                    continue

                old_cat_id = t.get("category_id")
                category = old_id_to_category.get((target.id, old_cat_id))
                if not category:
                    continue

                ref_id = t.get("reference_id") or ""
                if (
                    ref_id
                    and Transaction.objects.filter(
                        reference_id=ref_id, user=target
                    ).exists()
                ):
                    continue

                try:
                    date = (
                        datetime.fromisoformat(t["date"]).date()
                        if t.get("date")
                        else None
                    )
                except ValueError:
                    continue

                account_id = t.get("account_id") or t.get("account")
                account = None
                if account_id:
                    # First try restored bank accounts map, then fall back to DB lookup
                    account = old_id_to_bank_account.get((target.id, account_id))
                    if account is None:
                        try:
                            account = BankAccount.objects.get(
                                id=int(account_id), user=target
                            )
                        except (BankAccount.DoesNotExist, ValueError):
                            pass
                if account is None:
                    account, _ = BankAccount.objects.get_or_create(
                        user=target,
                        account_type=BankAccount.CHECKING,
                        defaults={
                            "name": "My Checking Account",
                            "currency": "USD",
                        },
                    )

                Transaction.objects.create(
                    date=date,
                    amount=t.get("amount", 0),
                    description=t.get("description", ""),
                    account=account,
                    import_source=t.get("import_source", "backup"),
                    reference_id=ref_id or None,
                    category=category,
                    user=target,
                )
                transactions_created += 1

            # --- Investments ---
            investments_created = 0
            for inv in data.get("investments", []):
                target = resolve_user(inv)
                if target is None:
                    continue
                try:
                    purchase_date = (
                        datetime.fromisoformat(inv["purchase_date"]).date()
                        if inv.get("purchase_date")
                        else None
                    )
                except ValueError:
                    purchase_date = None
                Investment.objects.create(
                    name=inv.get("name", ""),
                    symbol=inv.get("symbol", ""),
                    investment_type=inv.get("investment_type", Investment.STOCK),
                    quantity=inv.get("quantity", 0),
                    purchase_price=inv.get("purchase_price", 0),
                    current_price=inv.get("current_price") or None,
                    purchase_date=purchase_date,
                    principal_amount=inv.get("principal_amount") or None,
                    interest_rate=inv.get("interest_rate") or None,
                    compounding_frequency=inv.get("compounding_frequency") or None,
                    term_years=inv.get("term_years") or None,
                    notes=inv.get("notes", ""),
                    user=target,
                )
                investments_created += 1

            # --- Heritages ---
            heritages_created = 0
            for h in data.get("heritages", []):
                target = resolve_user(h)
                if target is None:
                    continue
                try:
                    purchase_date = (
                        datetime.fromisoformat(h["purchase_date"]).date()
                        if h.get("purchase_date")
                        else None
                    )
                except ValueError:
                    purchase_date = None
                Heritage.objects.create(
                    name=h.get("name", ""),
                    heritage_type=h.get("heritage_type", Heritage.HOUSE),
                    address=h.get("address", ""),
                    area=h.get("area") or None,
                    area_unit=h.get("area_unit", "sq_m"),
                    purchase_price=h.get("purchase_price", 0),
                    current_value=h.get("current_value") or None,
                    purchase_date=purchase_date,
                    monthly_rental_income=h.get("monthly_rental_income", 0),
                    notes=h.get("notes", ""),
                    user=target,
                )
                heritages_created += 1

            # --- Retirement Accounts ---
            retirement_created = 0
            for r in data.get("retirement_accounts", []):
                target = resolve_user(r)
                if target is None:
                    continue
                RetirementAccount.objects.create(
                    name=r.get("name", ""),
                    account_type=r.get(
                        "account_type", RetirementAccount.TRADITIONAL_401K
                    ),
                    provider=r.get("provider", ""),
                    account_number=r.get("account_number") or None,
                    current_balance=r.get("current_balance", 0),
                    monthly_contribution=r.get("monthly_contribution", 0),
                    employer_match_percentage=r.get("employer_match_percentage", 0),
                    employer_match_limit=r.get("employer_match_limit", 0),
                    risk_level=r.get("risk_level", RetirementAccount.MODERATE),
                    target_retirement_age=r.get("target_retirement_age", 65),
                    notes=r.get("notes", ""),
                    user=target,
                )
                retirement_created += 1

            def resolve_category(target, old_cat_id):
                """Look up a category by old backup ID, falling back to the live DB."""
                if old_cat_id is None:
                    return None
                cat = old_id_to_category.get((target.id, old_cat_id))
                if cat is None:
                    try:
                        cat = Category.objects.get(id=old_cat_id, user=target)
                    except Category.DoesNotExist:
                        pass
                return cat

            # --- Reclassification Rules ---
            rules_created = 0
            for rule in data.get("reclassification_rules", []):
                target = resolve_user(rule)
                if target is None:
                    continue
                old_from_id = rule.get("from_category_id")
                from_cat = resolve_category(target, old_from_id)
                if old_from_id and not from_cat:
                    continue
                to_cat = resolve_category(target, rule.get("to_category_id"))
                if not to_cat:
                    continue
                ReclassificationRule.objects.create(
                    rule_name=rule.get("rule_name", ""),
                    from_category=from_cat,
                    to_category=to_cat,
                    conditions=rule.get("conditions") or {},
                    is_active=rule.get("is_active", True),
                    user=target,
                )
                rules_created += 1

            # --- Category Deletion Rules ---
            deletion_rules_created = 0
            for rule in data.get("category_deletion_rules", []):
                target = resolve_user(rule)
                if target is None:
                    continue
                cat = resolve_category(target, rule.get("category_id"))
                if not cat:
                    continue
                CategoryDeletionRule.objects.get_or_create(
                    category=cat,
                    user=target,
                    defaults={"is_active": rule.get("is_active", True)},
                )
                deletion_rules_created += 1

        summary: dict = {
            "categories": categories_created,
            "bank_accounts": bank_accounts_created,
            "transactions": transactions_created,
            "investments": investments_created,
            "heritages": heritages_created,
            "retirement_accounts": retirement_created,
            "reclassification_rules": rules_created,
            "category_deletion_rules": deletion_rules_created,
        }
        if multi_user_mode:
            summary["users"] = users_created

        return Response({"message": "Backup restored successfully", "summary": summary})

    except Exception:
        logger.exception("Error restoring backup")
        return Response(
            {"error": "An unexpected error occurred while restoring the backup"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
