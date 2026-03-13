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

# Fix line endings (Windows CRLF -> Unix LF) and make scripts executable
RUN sed -i 's/\r$//' /app/entrypoint.sh /app/wait-for-db.sh 2>/dev/null || true && \
    chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
