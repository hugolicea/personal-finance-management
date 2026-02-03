#!/bin/sh
# entrypoint.sh - Wait for database and run Django setup

set -e

echo "Starting Personal Finance Management Backend..."
echo "Database: $DB_ENGINE on $DB_HOST:$DB_PORT"
echo ""

# Wait for database using Django's connection check
echo "Waiting for database to be ready..."
python << END
import sys
import time
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'personal_finance_management.settings')

import django
django.setup()

from django.db import connections
from django.db.utils import OperationalError

max_attempts = 60
for attempt in range(1, max_attempts + 1):
    try:
        connections['default'].cursor()
        print(f"✓ Database is ready!")
        sys.exit(0)
    except OperationalError as e:
        if attempt < max_attempts:
            print(f"Attempt {attempt}/{max_attempts}: Waiting for database...")
            time.sleep(2)
        else:
            print(f"ERROR: Database did not become ready in time!")
            print(f"Last error: {e}")
            sys.exit(1)
END

echo ""
echo "Running database migrations..."
python manage.py migrate --noinput

echo ""
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo ""
echo "✓ Setup complete! Starting Django server..."
echo ""

# Execute the main command
exec "$@"
