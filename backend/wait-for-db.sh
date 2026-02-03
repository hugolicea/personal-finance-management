#!/bin/sh
# wait-for-db.sh - Wait for database to be ready

set -e

host="$1"
port="$2"
db_engine="$3"

echo "Waiting for database at $host:$port..."

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  attempt=$((attempt + 1))

  if [ "$db_engine" = "mysql" ]; then
    if nc -z "$host" "$port" 2>/dev/null; then
      echo "MySQL is up - waiting for it to be ready..."
      sleep 2

      # Try to connect to MySQL
      if mysqladmin ping -h"$host" -u"$DB_USER" -p"$DB_PASSWORD" --silent 2>/dev/null; then
        echo "MySQL is ready!"
        exit 0
      fi
    fi
  else
    # PostgreSQL
    if nc -z "$host" "$port" 2>/dev/null; then
      echo "PostgreSQL is up - waiting for it to be ready..."
      sleep 2

      # Try to connect to PostgreSQL
      if pg_isready -h "$host" -U "$DB_USER" 2>/dev/null; then
        echo "PostgreSQL is ready!"
        exit 0
      fi
    fi
  fi

  echo "Attempt $attempt/$max_attempts: Database is not ready yet, waiting..."
  sleep 2
done

echo "ERROR: Database did not become ready in time!"
exit 1
