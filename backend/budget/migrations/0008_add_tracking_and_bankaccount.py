import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        (
            "budget",
            "0007_rename_budget_tran_user_id_e7fa3b_idx_budget_tran_user_id_c946cc_idx_and_more",
        ),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── Tracking fields on Category ────────────────────────────────────
        migrations.AddField(
            model_name="category",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                null=True,
                blank=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="category",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True, blank=True),
        ),
        # ── Tracking fields on Investment ──────────────────────────────────
        migrations.AddField(
            model_name="investment",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                null=True,
                blank=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="investment",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True, blank=True),
        ),
        # ── Tracking fields on Heritage ────────────────────────────────────
        migrations.AddField(
            model_name="heritage",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                null=True,
                blank=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="heritage",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True, blank=True),
        ),
        # ── Tracking fields on RetirementAccount ──────────────────────────
        migrations.AddField(
            model_name="retirementaccount",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                null=True,
                blank=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="retirementaccount",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True, blank=True),
        ),
        # ── updated_at on ReclassificationRule ────────────────────────────
        migrations.AddField(
            model_name="reclassificationrule",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True, blank=True),
        ),
        # ── updated_at on CategoryDeletionRule ────────────────────────────
        migrations.AddField(
            model_name="categorydeletionrule",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True, blank=True),
        ),
        # ── Create BankAccount table ───────────────────────────────────────
        migrations.CreateModel(
            name="BankAccount",
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
                ("name", models.CharField(max_length=100)),
                (
                    "account_type",
                    models.CharField(
                        choices=[
                            ("checking", "Checking"),
                            ("savings", "Savings"),
                            ("credit_card", "Credit Card"),
                            ("cash", "Cash"),
                            ("investment", "Investment"),
                            ("other", "Other"),
                        ],
                        default="checking",
                        help_text="Type of bank account",
                        max_length=20,
                    ),
                ),
                (
                    "institution",
                    models.CharField(
                        blank=True,
                        help_text="Bank or financial institution name",
                        max_length=100,
                    ),
                ),
                ("currency", models.CharField(default="USD", max_length=3)),
                ("notes", models.TextField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="bank_accounts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="bankaccount",
            index=models.Index(
                fields=["user", "account_type"], name="budget_bank_user_id_acctype_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="bankaccount",
            index=models.Index(
                fields=["user", "is_active"], name="budget_bank_user_id_active_idx"
            ),
        ),
        migrations.AlterUniqueTogether(
            name="bankaccount",
            unique_together={("user", "name")},
        ),
        # ── Add nullable account FK to Transaction ─────────────────────────
        migrations.AddField(
            model_name="transaction",
            name="account",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="transactions",
                to="budget.bankaccount",
                help_text="Bank account this transaction belongs to",
            ),
        ),
    ]
