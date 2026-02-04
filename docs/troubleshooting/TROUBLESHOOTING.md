# Troubleshooting Guide

## Viewing Logs

### Production Logs (docker-compose.prod.yml)

```powershell
# View backend logs (includes Django errors, SQL queries, Sentry events)
docker compose -f docker\docker-compose.prod.yml --profile mysql logs -f backend

# View frontend logs
docker compose -f docker\docker-compose.prod.yml --profile mysql logs -f frontend

# View nginx logs
docker compose -f docker\docker-compose.prod.yml --profile mysql logs -f nginx

# View database logs
docker compose -f docker\docker-compose.prod.yml --profile mysql logs -f mysql

# View all logs
docker compose -f docker\docker-compose.prod.yml --profile mysql logs -f
```

### Development Logs (Better Error Visibility)

Development mode (`docker-compose.yml`) provides more detailed error messages:

```powershell
# Start in development mode
docker compose -f docker\docker-compose.yml --profile mysql up

# This will show real-time logs with detailed stack traces
```

### Sentry Logs

If Sentry is configured (requires `SENTRY_DSN` in `.env`):

1. **In Backend Logs**: Sentry events are logged before being sent

    ```powershell
    docker compose -f docker\docker-compose.prod.yml --profile mysql logs backend | Select-String "sentry"
    ```

2. **In Sentry Dashboard**:
    - Go to <https://sentry.io>
    - View real-time errors in your project dashboard
    - See full stack traces, user context, and breadcrumbs

3. **Local Testing**: Test Sentry integration

    ```powershell
    docker compose -f docker\docker-compose.prod.yml --profile mysql exec backend python manage.py shell
    # In the shell:
    >>> from sentry_sdk import capture_message
    >>> capture_message("Test message from Django")
    ```

## Common Issues

### 1. Category Creation Fails (400 Error)

**Symptom**: "Failed to save category: Request failed with status code 400"

**Cause**: CategorySerializer required `user` field in POST requests

**Solution**: ✅ Fixed by adding `read_only_fields = ["user"]` to
CategorySerializer

### 2. No Data Persistence in Clean and Reclassify

**Symptom**: Rules disappear after page reload

**Cause**: Using local component state instead of database

**Solution**: ✅ Fixed by:

- Creating `ReclassificationRule` and `CategoryDeletionRule` models
- Adding Redux slice for persistence
- Updating CleanAndReclassify page to use Redux

**Migration**: Run `python manage.py migrate` to create tables

### 3. Static Files Not Loading in Production

**Symptom**: Jazzmin admin shows plain HTML

**Solution**:

```powershell
# Collect static files
docker compose -f docker\docker-compose.prod.yml --profile mysql exec backend python manage.py collectstatic --noinput --clear

# Restart nginx
docker compose -f docker\docker-compose.prod.yml --profile mysql restart nginx
```

### 4. Database Connection Errors

**Check database is running**:

```powershell
docker compose -f docker\docker-compose.prod.yml --profile mysql ps mysql
```

**Test connection**:

```powershell
docker compose -f docker\docker-compose.prod.yml --profile mysql exec backend python manage.py dbshell
```

**Reset database** (⚠️ destroys all data):

```powershell
docker compose -f docker\docker-compose.prod.yml --profile mysql down -v
docker compose -f docker\docker-compose.prod.yml --profile mysql up -d
```

### 5. Build Errors

**Clear Docker cache**:

```powershell
docker compose -f docker\docker-compose.prod.yml --profile mysql build --no-cache
docker compose -f docker\docker-compose.prod.yml --profile mysql up -d
```

**Check disk space**:

```powershell
docker system df
docker system prune -a  # Removes all unused images
```

## Django Error Logs Location

- **Container logs**: `docker compose logs backend`
- **File logs** (if configured):
  - `backend/logs/django.log` - General logs
  - `backend/logs/error.log` - Error-only logs

## Accessing Container Shell

```powershell
# Backend shell
docker compose -f docker\docker-compose.prod.yml --profile mysql exec backend bash

# Django shell
docker compose -f docker\docker-compose.prod.yml --profile mysql exec backend python manage.py shell

# Database shell
docker compose -f docker\docker-compose.prod.yml --profile mysql exec backend python manage.py dbshell
```

## API Debugging

### Check API Endpoints

```powershell
# View all registered routes
docker compose -f docker\docker-compose.prod.yml --profile mysql exec backend python manage.py show_urls

# Test API endpoint
docker compose -f docker\docker-compose.prod.yml --profile mysql exec backend python manage.py shell
>>> from budget import views
>>> # Test your views here
```

### API Documentation

Access Swagger UI: <http://localhost:8000/api/schema/swagger-ui/>

## Performance Debugging

### Check for N+1 Queries

Install Django Debug Toolbar (development only):

```python
# settings.py
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
INTERNAL_IPS = ['127.0.0.1']
```

### Monitor Database Queries

```powershell
# Enable query logging
docker compose -f docker\docker-compose.prod.yml --profile mysql logs mysql | Select-String "SELECT"
```

## Frontend Debugging

### Check Build Output

```powershell
# Rebuild frontend
docker compose -f docker\docker-compose.prod.yml --profile mysql build frontend

# Check built files
docker compose -f docker\docker-compose.prod.yml --profile mysql exec frontend ls -la /usr/share/nginx/html
```

### Browser Console

Open browser DevTools (F12) and check:

- **Console**: JavaScript errors
- **Network**: API request/response status
- **Redux DevTools**: State changes (if extension installed)

## Health Checks

```powershell
# Check all services
docker compose -f docker\docker-compose.prod.yml --profile mysql ps

# Check backend health
curl http://localhost:8000/api/v1/categories/

# Check frontend
curl http://localhost:3000
```

## Getting More Help

1. **Enable DEBUG mode** (development only):

    ```bash
    # .env
    DEBUG=True
    ```

2. **Increase log verbosity**:

    ```python
    # settings.py
    LOGGING = {
        'version': 1,
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': 'DEBUG',
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    }
    ```

3. **Check GitHub Issues**: See if similar issues reported
4. **Review CHANGELOG.md**: Recent changes might explain behavior
