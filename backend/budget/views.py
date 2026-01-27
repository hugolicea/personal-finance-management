import csv
import hashlib
import io
from datetime import datetime, timedelta

from django.db.models import Sum
from django.http import JsonResponse
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Category, Heritage, Investment, RetirementAccount, Transaction
from .serializers import (CategorySerializer, HeritageSerializer, InvestmentSerializer,
                          RetirementAccountSerializer, TransactionSerializer)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class InvestmentViewSet(viewsets.ModelViewSet):
    queryset = Investment.objects.all()
    serializer_class = InvestmentSerializer


class HeritageViewSet(viewsets.ModelViewSet):
    queryset = Heritage.objects.all()
    serializer_class = HeritageSerializer


class RetirementAccountViewSet(viewsets.ModelViewSet):
    queryset = RetirementAccount.objects.all()
    serializer_class = RetirementAccountSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer


def balance_by_period(request, period):
    now = datetime.now().date()
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

    total = (
        Transaction.objects.filter(date__gte=start).aggregate(total=Sum("amount"))[
            "total"
        ]
        or 0
    )
    return JsonResponse({f"balance_{period}": total})


@api_view(["GET"])
def category_spending_by_period(request, period):
    """
    Get spending by category for a specific period.
    Supports both predefined periods ('week', 'month', 'quarter', 'year')
    and specific year-month format ('YYYY-MM').
    Returns category budgets vs actual spending.
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

    # Get all categories with their budgets
    categories = Category.objects.all()

    result = []
    for category in categories:
        # Calculate actual spending for this category in the period
        spending = (
            Transaction.objects.filter(
                category=category, date__gte=start, date__lte=end
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )

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
                "percentage_used": (spending_float / budget * 100) if budget > 0 else 0,
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


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def upload_bank_statement(request):
    """
    Upload and process a bank statement CSV file.
    Supports multiple CSV formats with flexible column names and date formats.
    Handles both credit card and account transaction formats.
    """
    if "file" not in request.FILES:
        return Response(
            {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    file = request.FILES["file"]
    if not file.name.endswith(".csv"):
        return Response(
            {"error": "File must be a CSV"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Read and parse CSV
        file_data = file.read().decode("utf-8")
        csv_reader = csv.DictReader(io.StringIO(file_data))

        # Detect CSV type based on headers
        headers = csv_reader.fieldnames or []
        is_account_csv = "Details" in headers and "Type" in headers

        transactions_created = []
        transactions_skipped = []
        errors = []

        for row_num, row in enumerate(
            csv_reader, start=2
        ):  # Start at 2 because row 1 is headers
            try:
                if is_account_csv:
                    # Account CSV format: Details, Posting Date, Description, Amount, Type
                    date_str = get_column_value(
                        row, ["Posting Date", "Post Date", "date", "Date"]
                    )
                    description = get_column_value(
                        row, ["Description", "description", "desc"]
                    )
                    amount_str = get_column_value(
                        row, ["Amount", "amount", "amt"])
                    category_name = get_column_value(
                        row, ["Type", "type"])  # Use Type as category
                else:
                    # Credit card CSV format: flexible columns
                    date_str = get_column_value(
                        row, ["Transaction Date", "Post Date", "date", "Date"]
                    )
                    description = get_column_value(
                        row, ["Description", "description", "desc"]
                    )
                    amount_str = get_column_value(
                        row, ["Amount", "amount", "amt"])
                    category_name = get_column_value(
                        row, ["Category", "category", "cat"])

                # Validate required fields
                if not date_str or not description or not amount_str:
                    errors.append(
                        f"Row {row_num}: Missing required fields (date, description, amount)"
                    )
                    continue

                # Parse date - try multiple formats
                date = None
                for date_format in ["%m/%d/%Y", "%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"]:
                    try:
                        date = datetime.strptime(date_str, date_format).date()
                        break
                    except ValueError:
                        continue

                if not date:
                    errors.append(
                        f"Row {row_num}: Invalid date format. Supported formats: MM/DD/YYYY, YYYY-MM-DD, DD/MM/YYYY"
                    )
                    continue

                # Parse amount - handle various formats
                try:
                    # Remove currency symbols, commas, and extra spaces
                    clean_amount = (
                        amount_str.replace("$", "").replace(
                            ",", "").replace(" ", "")
                    )
                    amount = float(clean_amount)
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid amount format")
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
                    classification = Category.INCOME if amount > 0 else Category.SPEND
                    category, created = Category.objects.get_or_create(
                        name=category_name,
                        defaults={'classification': classification}
                    )
                    # If category already exists but has wrong classification, update it
                    if not created and category.classification != classification:
                        category.classification = classification
                        category.save()
                else:
                    # Try to auto-categorize based on description keywords
                    category = auto_categorize_transaction(description)

                if not category:
                    # Use a default category if auto-categorization fails
                    category, created = Category.objects.get_or_create(
                        name="Uncategorized"
                    )

                # Create transaction
                transaction = Transaction.objects.create(
                    date=date,
                    amount=amount,
                    description=description,
                    category=category,
                    transaction_type=Transaction.ACCOUNT if is_account_csv else Transaction.CREDIT_CARD,
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

            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                continue

        return Response(
            {
                "message": f"Processed {len(transactions_created)} transactions successfully",
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

    except Exception as e:
        return Response(
            {"error": f"Failed to process file: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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


def auto_categorize_transaction(description):
    """
    Simple auto-categorization based on keywords in description.
    This is a basic implementation - could be enhanced with ML or more sophisticated rules.
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
        "Groceries": ["fiesta mart", "foodland", "wm supercenter", "paypal *walmart"],
        "Gas": ["chevron", "exxon", "murphy", "love's", "super fuels", "7-eleven"],
        "Health & Wellness": [
            "bswhealth",
            "texas digestive",
            "cvs/pharmacy",
            "pharmacy",
        ],
        "Travel": ["ntta", "aeroenlaces", "vivaaerob", "parking", "gaston garage"],
        "Bills & Utilities": ["metrob", "t-mobile", "eqt*swhp", "paypal *netflix"],
        "Shopping": ["dd's discount", "adobe", "home depot"],
        "Home": ["home depot"],
        "Income": ["salary", "payroll", "deposit", "transfer in", "income"],
    }

    for category_name, keywords in category_mappings.items():
        if any(keyword in description_lower for keyword in keywords):
            try:
                return Category.objects.get(name=category_name)
            except Category.DoesNotExist:
                # Set classification based on category type
                classification = Category.INCOME if category_name == "Income" else Category.SPEND
                return Category.objects.create(
                    name=category_name,
                    classification=classification
                )

    return None
