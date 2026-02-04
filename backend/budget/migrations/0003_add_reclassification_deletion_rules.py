# Generated migration for ReclassificationRule and CategoryDeletionRule models
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("budget", "0002_assign_default_user"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReclassificationRule",
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
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "is_active",
                    models.BooleanField(
                        default=True, help_text="Whether this rule is active"
                    ),
                ),
                (
                    "from_category",
                    models.ForeignKey(
                        help_text="Category to reclassify from",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reclassification_from_rules",
                        to="budget.category",
                    ),
                ),
                (
                    "to_category",
                    models.ForeignKey(
                        help_text="Category to reclassify to",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reclassification_to_rules",
                        to="budget.category",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reclassification_rules",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="CategoryDeletionRule",
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
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "is_active",
                    models.BooleanField(
                        default=True, help_text="Whether this rule is active"
                    ),
                ),
                (
                    "category",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="deletion_rules",
                        to="budget.category",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="category_deletion_rules",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="reclassificationrule",
            index=models.Index(
                fields=["user", "is_active"], name="budget_recl_user_id_e9b8c5_idx"
            ),
        ),
        migrations.AlterUniqueTogether(
            name="reclassificationrule",
            unique_together={("user", "from_category")},
        ),
        migrations.AddIndex(
            model_name="categorydeletionrule",
            index=models.Index(
                fields=["user", "is_active"], name="budget_cate_user_id_8f4a5c_idx"
            ),
        ),
        migrations.AlterUniqueTogether(
            name="categorydeletionrule",
            unique_together={("user", "category")},
        ),
    ]
