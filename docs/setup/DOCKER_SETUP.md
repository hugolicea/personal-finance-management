# 🚀 Docker Setup & Deployment Guide

## 📁 File Structure

```
docker/
├── .env                      # ✅ Created - Environment variables
├── docker-compose.yml        # Development setup
└── docker-compose.prod.yml   # Production setup

backend/
├── .env                      # Backend environment (optional)
├── Dockerfile                # ✅ Fixed - Development image
└── Dockerfile.prod           # ✅ Exists - Production image

frontend/
├── .env                      # Frontend environment
├── Dockerfile                # Development image
├── Dockerfile.prod           # ✅ Exists - Production image
└── nginx.conf                # ✅ Exists - Nginx configuration
```

## ✅ **FIXED ISSUES**

### 1. Development Build Failure

**Issue**: `pip install -r requirements.dev.txt` was failing **Fix**:

- Added system dependencies (gcc, postgresql-client) to Dockerfile
- Made dev requirements optional with `|| true`

### 2. Environment Variables Not Found

**Issue**: Production compose couldn't find .env variables **Fix**:

- Created `docker/.env` file with all required variables
- Added `env_file: - .env` to services
- Added default values to all environment variables

## 🔧 **Quick Start Commands**

### Using Helper Script (Recommended)

```powershell
# View all available commands
.\compose.ps1 help

# Development with MySQL
.\compose.ps1 dev-up-mysql        # Start dev environment
.\compose.ps1 dev-logs            # View logs
.\compose.ps1 migrate             # Run migrations
.\compose.ps1 createsuperuser     # Create admin user
.\compose.ps1 dev-down            # Stop services

# Development with PostgreSQL
.\compose.ps1 dev-up-pg           # Start dev environment

# Production with MySQL
.\compose.ps1 prod-up-mysql       # Start prod environment
.\compose.ps1 prod-logs           # View logs
.\compose.ps1 migrate-prod        # Run migrations
.\compose.ps1 prod-down           # Stop services

# Other useful commands
.\compose.ps1 shell               # Django shell
.\compose.ps1 test                # Run tests
.\compose.ps1 ps                  # Show container status
.\compose.ps1 adminer             # Show Adminer connection info
```

### Using Docker Compose Directly

#### Development Mode

```powershell
# Start all services (choose database profile)
# Note: Automatically uses docker-compose.override.yml for dev settings
docker compose --profile mysql up -d
# or
docker compose --profile postgres up -d

# Check logs
docker compose --profile mysql logs -f backend

# Run migrations
docker compose --profile mysql exec backend python manage.py migrate

# Create superuser
docker compose --profile mysql exec backend python manage.py createsuperuser

# Stop services
docker compose --profile mysql down
```

> **Note:** Development automatically loads `docker-compose.override.yml` which
> provides:
>
> - Hot reload (volume mounts)
> - Adminer database tool on port 8080
> - DEBUG=True
> - Exposed database ports

#### Production Mode

```powershell
# IMPORTANT: Update .env file first!
# Edit .env and set:
#   - SECRET_KEY (generate a secure one)
#   - DB_PASSWORD (change from default)
#   - ALLOWED_HOSTS (your domain)

# Start production services (explicit override file required)
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile mysql up -d --build

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile mysql exec backend python manage.py migrate

# Create superuser
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Check status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

> **Note:** Production uses `docker-compose.prod.yml` which provides:
>
> - Dockerfile.prod (optimized builds)
> - Nginx reverse proxy
> - No volume mounts (no hot reload)
> - No Adminer
> - DEBUG=False
> - Healthchecks and resource limits

## 🔐 **Environment Configuration**

### Edit `docker/.env` before deploying

```env
# ⚠️ MUST CHANGE FOR PRODUCTION
SECRET_KEY=generate-new-secret-key-here
DB_PASSWORD=use-strong-password-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (can keep defaults for dev)
DB_NAME=personal_finance_management
DB_USER=user
DB_HOST=postgres
DB_PORT=5432

# CORS (update for production domain)
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Optional: Email settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Generate Secure SECRET_KEY

```powershell
# Python method
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Or use online generator
# Visit: https://djecrety.ir/
```

## 🐛 **Troubleshooting**

### Build Errors

```powershell
# Clean rebuild
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Database Issues

```powershell
# Reset database
docker compose down -v
docker volume rm docker_postgres_data
docker compose up -d
docker compose exec backend python manage.py migrate
```

### View Container Logs

```powershell
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Enter Container Shell

```powershell
# Backend
docker compose exec backend bash

# Frontend
docker compose exec frontend sh

# Database
docker compose exec postgres psql -U user -d personal_finance_management
```

## 📊 **Service URLs**

### Development

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- API Docs: <http://localhost:8000/api/schema/swagger-ui/>
- Admin Panel: <http://localhost:8000/admin>

**Default Admin Credentials:**

- Username: `admin`
- Email: `admin@example.com`
- Password: `changeme123`

**Note:** A default admin user is automatically created during migrations.
Change the password after first login!

### Production

- Frontend: <http://localhost> (port 80)
- Backend API: <http://localhost:8000>
- API Docs: <http://localhost:8000/api/schema/swagger-ui/>
- Admin Panel: <http://localhost:8000/admin>

## 🔒 **Production Deployment Checklist**

- [ ] Update `SECRET_KEY` in docker/.env
- [ ] Change `DB_PASSWORD` in docker/.env
- [ ] Set `ALLOWED_HOSTS` to your domain
- [ ] Update `CORS_ALLOWED_ORIGINS` to your domain
- [ ] Create SSL certificates (for HTTPS)
- [ ] Configure domain DNS
- [ ] Set up firewall rules
- [ ] Enable automatic backups
- [ ] Set up monitoring/logging
- [ ] Test all functionality

## 🔄 **Update/Restart Services**

```powershell
# Restart a single service
docker compose restart backend

# Rebuild and restart after code changes
docker compose up -d --build backend

# Full restart
docker compose down
docker compose up -d --build
```

## 💾 **Backup & Restore**

### Backup Database

```powershell
docker compose exec postgres pg_dump -U user personal_finance_management > backup.sql
```

### Restore Database

```powershell
cat backup.sql | docker compose exec -T postgres psql -U user personal_finance_management
```

## 📈 **Monitoring**

### Check Container Health

```powershell
docker compose ps
docker stats
```

### Check Disk Usage

```powershell
docker system df
```

### Clean Up

```powershell
# Remove unused containers/images
docker system prune -a

# Remove unused volumes
docker volume prune
```

## ✅ **Verification Steps**

After deployment, verify everything works:

1. **Backend Health**: `curl http://localhost:8000/api/schema/`
2. **Database**: Check postgres logs for successful connection
3. **Frontend**: Visit <http://localhost:3000> and check for errors
4. **Authentication**: Try registering/logging in
5. **API**: Test creating categories/transactions

---

**Need Help?** Check the logs first:

```powershell
docker compose logs -f
```
