# Generated manually for dynamic reclassification rules with conditions

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("budget", "0005_transaction_audit_fields"),
    ]

    operations = [
        # Add conditions JSONField
        migrations.AddField(
            model_name="reclassificationrule",
            name="conditions",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Additional conditions for matching transactions (description, amount range, dates, etc.)",
            ),
        ),
        # Add rule_name CharField
        migrations.AddField(
            model_name="reclassificationrule",
            name="rule_name",
            field=models.CharField(
                blank=True,
                help_text="Optional name to identify this rule",
                max_length=200,
                null=True,
            ),
        ),
        # Make from_category nullable
        migrations.AlterField(
            model_name="reclassificationrule",
            name="from_category",
            field=models.ForeignKey(
                blank=True,
                help_text="Category to reclassify from",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="reclassification_from_rules",
                to="budget.category",
            ),
        ),
        # Remove the unique_together constraint (if it exists)
        migrations.AlterUniqueTogether(
            name="reclassificationrule",
            unique_together=set(),
        ),
    ]
