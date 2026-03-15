from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("budget", "0010_remove_transaction_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="bankaccount",
            name="account_number",
            field=models.CharField(
                blank=True,
                null=True,
                max_length=50,
                help_text="Last 4 digits of account number (for reference only)",
            ),
        ),
    ]
