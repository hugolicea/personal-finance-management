# Generated manually on 2026-02-21
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        (
            "budget",
            "0004_rename_budget_cate_user_id_8f4a5c_idx_budget_cate_user_id_24bf21_idx_and_more",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="transaction",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                null=True,
                blank=True,
            ),
        ),
        migrations.AddField(
            model_name="transaction",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
                null=True,
                blank=True,
            ),
        ),
        migrations.AddIndex(
            model_name="transaction",
            index=models.Index(
                fields=["user", "date", "category"],
                name="budget_tran_user_id_e7fa3b_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="transaction",
            index=models.Index(
                fields=["reference_id"], name="budget_tran_referen_8e6f9a_idx"
            ),
        ),
        migrations.AddConstraint(
            model_name="transaction",
            constraint=models.CheckConstraint(
                check=models.Q(amount__isnull=False),
                name="transaction_amount_not_null",
            ),
        ),
    ]
