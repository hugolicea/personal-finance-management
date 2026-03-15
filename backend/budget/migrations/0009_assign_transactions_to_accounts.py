from django.db import migrations


def assign_transactions_to_accounts(apps, schema_editor):
    """
    For each user, auto-create:
      - "My Credit Card"  (account_type=credit_card)
      - "My Checking Account" (account_type=checking)
    Then assign existing transactions based on their transaction_type.
    """
    User = apps.get_model("auth", "User")
    BankAccount = apps.get_model("budget", "BankAccount")
    Transaction = apps.get_model("budget", "Transaction")

    for user in User.objects.all():
        cc_account, _ = BankAccount.objects.get_or_create(
            user=user,
            account_type="credit_card",
            defaults={"name": "My Credit Card", "currency": "USD"},
        )
        checking_account, _ = BankAccount.objects.get_or_create(
            user=user,
            account_type="checking",
            defaults={"name": "My Checking Account", "currency": "USD"},
        )

        Transaction.objects.filter(
            user=user, transaction_type="credit_card", account__isnull=True
        ).update(account=cc_account)

        Transaction.objects.filter(
            user=user, transaction_type="account", account__isnull=True
        ).update(account=checking_account)

        # Assign any remaining un-assigned transactions to checking
        Transaction.objects.filter(user=user, account__isnull=True).update(
            account=checking_account
        )


def reverse_assign(apps, schema_editor):
    """Reverse: clear all account FKs."""
    Transaction = apps.get_model("budget", "Transaction")
    Transaction.objects.all().update(account=None)


class Migration(migrations.Migration):
    dependencies = [
        ("budget", "0008_add_tracking_and_bankaccount"),
    ]

    operations = [
        migrations.RunPython(
            assign_transactions_to_accounts,
            reverse_code=reverse_assign,
        ),
    ]
