FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (PostgreSQL and MySQL clients)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    default-mysql-client \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY requirements.dev.txt .
RUN pip install --no-cache-dir -r requirements.dev.txt || true

COPY . .

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chmod 777 /app/logs

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
