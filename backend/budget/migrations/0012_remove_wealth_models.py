from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("budget", "0011_bankaccount_account_number"),
        ("wealth", "0001_initial"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name="Investment"),
                migrations.DeleteModel(name="Heritage"),
                migrations.DeleteModel(name="RetirementAccount"),
            ],
            database_operations=[],
        )
    ]
