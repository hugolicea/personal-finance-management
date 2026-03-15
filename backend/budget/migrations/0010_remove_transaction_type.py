import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Remove transaction_type field and make account non-nullable.
    All transactions should already have an account assigned by migration 0009.
    """

    dependencies = [
        ("budget", "0009_assign_transactions_to_accounts"),
    ]

    operations = [
        # Remove the old transaction_type field
        migrations.RemoveField(
            model_name="transaction",
            name="transaction_type",
        ),
        # Make account non-nullable now that all transactions are assigned
        migrations.AlterField(
            model_name="transaction",
            name="account",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="transactions",
                to="budget.bankaccount",
                help_text="Bank account this transaction belongs to",
            ),
        ),
    ]
