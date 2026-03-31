from django.db import migrations


def update_content_types(apps, schema_editor):
    """Remap ContentType entries from budget -> wealth for the three moved models."""
    ContentType = apps.get_model("contenttypes", "ContentType")
    db_alias = schema_editor.connection.alias
    for model_name in ("investment", "heritage", "retirementaccount"):
        ContentType.objects.using(db_alias).filter(
            app_label="budget", model=model_name
        ).update(app_label="wealth")


def reverse_content_types(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    db_alias = schema_editor.connection.alias
    for model_name in ("investment", "heritage", "retirementaccount"):
        ContentType.objects.using(db_alias).filter(
            app_label="wealth", model=model_name
        ).update(app_label="budget")


class Migration(migrations.Migration):
    dependencies = [
        ("wealth", "0001_initial"),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [
        migrations.RunPython(update_content_types, reverse_content_types),
    ]
