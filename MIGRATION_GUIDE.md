# 🚨 IMPORTANT: Migration & Setup Instructions

## ⚠️ BEFORE RUNNING THE APPLICATION

The project has been significantly updated with security improvements and multi-user support. **You MUST run migrations and restart containers.**

## 📋 Step-by-Step Setup

### 1. Stop Current Containers

```powershell
cd docker
docker compose down
```

### 2. Update Backend Requirements

The following new packages were added:

- `djangorestframework-simplejwt` - JWT authentication
- `dj-rest-auth` - REST authentication
- `django-allauth` - User registration/management
- `django-filter` - API filtering
- `gunicorn` - Production WSGI server
- `requests` - HTTP library (dependency)

```powershell
docker compose up -d --build
```

### 3. Install New Dependencies in Container

```powershell
docker compose exec backend pip install -r requirements.txt
```

### 4. Run Migrations

```powershell
# Create migrations (already done, but run if needed)
docker compose exec backend python manage.py makemigrations

# Apply migrations
docker compose exec backend python manage.py migrate
```

### 5. Create Superuser

```powershell
docker compose exec backend python manage.py createsuperuser
```

Follow the prompts to create an admin user.

### 6. Restart Containers

```powershell
docker compose restart
```

## 🔐 Authentication Changes

### **BREAKING CHANGE**: All API endpoints now require authentication

#### Frontend Updates Needed

The frontend needs to be updated to handle authentication:

1. **Login/Registration UI** (not yet implemented)
2. **Token Storage** - Store JWT tokens
3. **API Interceptors** - Add Bearer token to requests
4. **Protected Routes** - Redirect to login if not authenticated

#### API Endpoints

```
POST /api/v1/auth/registration/
{
  "email": "user@example.com",
  "password1": "secure_password",
  "password2": "secure_password"
}

POST /api/v1/auth/login/
{
  "email": "user@example.com",
  "password": "secure_password"
}

Response:
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token",
  "user": {...}
}
```

#### Using Authenticated Requests

```javascript
// Add to axios requests
axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
```

## 🗄️ Database Changes

All models now include a `user` foreign key:

- `Category.user`
- `Transaction.user`
- `Investment.user`
- `Heritage.user`
- `RetirementAccount.user`

**Existing data**: The migration will prompt for a default user ID for existing records.

## ⚙️ Environment Variables

### Backend (.env)

```env
SECRET_KEY=<generate-new-secure-key>
DEBUG=True  # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=personal_finance_management
DB_USER=user
DB_PASSWORD=password
DB_HOST=postgres
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🧪 Testing the Setup

### 1. Test Backend Health

```powershell
curl http://localhost:8000/api/schema/
```

### 2. Test Registration

```powershell
curl -X POST http://localhost:8000/api/v1/auth/registration/ `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "password1": "testpass123",
    "password2": "testpass123"
  }'
```

### 3. Test Login

```powershell
curl -X POST http://localhost:8000/api/v1/auth/login/ `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

### 4. Test Authenticated Request

```powershell
$token = "your_access_token_here"
curl http://localhost:8000/api/v1/categories/ `
  -H "Authorization: Bearer $token"
```

## 🐛 Troubleshooting

### Issue: "ModuleNotFoundError"

**Solution**: Install missing packages

```powershell
docker compose exec backend pip install <package-name>
```

### Issue: "No migrations to apply"

**Solution**: Migrations already applied, you're good!

### Issue: "Authentication credentials were not provided"

**Solution**: Add `Authorization: Bearer <token>` header to requests

### Issue: "User matching query does not exist"

**Solution**: Create a superuser or register a new user

## 📝 Development Workflow

### Pre-commit Hooks

```powershell
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

### Code Formatting

```powershell
# Format Python code
docker compose exec backend black .

# Check linting
docker compose exec backend flake8 .

# Format Frontend
cd frontend
npm run lint
```

## 🚀 Production Deployment

For production, use the production Docker Compose file:

```powershell
cd docker
docker-compose -f docker-compose.prod.yml up -d --build
```

**Remember to**:

- Set `DEBUG=False`
- Use a strong `SECRET_KEY`
- Configure proper `ALLOWED_HOSTS`
- Set up HTTPS/SSL
- Use environment-specific secrets

## 📚 Additional Resources

- [Django REST Framework Authentication](https://www.django-rest-framework.org/api-guide/authentication/)
- [dj-rest-auth Documentation](https://dj-rest-auth.readthedocs.io/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

**Need Help?** Check the logs:

```powershell
docker compose logs backend
docker compose logs frontend
```
