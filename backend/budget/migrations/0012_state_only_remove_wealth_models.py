# State-only migration: remove Investment, Heritage, RetirementAccount from
# budget app state. These models are now owned by the wealth app. The actual
# database tables (budget_investment, budget_heritage, budget_retirementaccount)
# are preserved — only Django's migration state is updated here.
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("budget", "0011_bankaccount_account_number"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name="Investment"),
                migrations.DeleteModel(name="Heritage"),
                migrations.DeleteModel(name="RetirementAccount"),
            ],
            database_operations=[],
        ),
    ]
