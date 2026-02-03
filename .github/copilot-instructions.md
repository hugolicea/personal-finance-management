# Personal Finance Management - Copilot Instructions

## Project Overview

Full-stack personal finance management application with Django REST API backend
and React TypeScript frontend.

**Tech Stack:**

- **Backend**: Django 5.1, DRF, PostgreSQL 15, Gunicorn
- **Frontend**: React 18, TypeScript, Redux Toolkit, Vite, Tailwind CSS
- **DevOps**: Docker, Docker Compose, Nginx, GitHub Actions
- **Code Quality**: Ruff (replaces Black/Flake8/isort), Pre-commit hooks,
  ESLint, Prettier
- **Monitoring**: Sentry (optional), Django logging

## Code Standards

### Python

- Use **Ruff** for linting and formatting (configured in `ruff.toml`)
- Line length: 88 characters (Black-compatible)
- Type hints required for new functions
- Django models: Follow order (Meta → fields → properties → methods → **str**)
- Use `select_related()` and `prefetch_related()` to prevent N+1 queries
- API views: Add `@extend_schema` decorators for OpenAPI documentation

### TypeScript/React

- Functional components with hooks (no class components except ErrorBoundary)
- Redux Toolkit for state management
- Use typed hooks: `useAppDispatch`, `useAppSelector`
- Components: PascalCase, files: PascalCase.tsx
- Props interfaces: `ComponentNameProps`
- Tailwind CSS for styling (no inline styles)

### Git Workflow

- Pre-commit hooks run automatically (Ruff, Prettier, ESLint)
- Commit messages: Conventional Commits format
- Branch names: `feature/`, `fix/`, `refactor/`
- CI/CD runs on push to main/develop

## Project Structure

```
backend/
├── budget/              # Main Django app
│   ├── models.py       # Category, Transaction, Investment, Heritage, RetirementAccount
│   ├── views.py        # ViewSets with select_related optimization
│   ├── serializers.py  # DRF serializers with DecimalField typing
│   ├── urls.py         # API routes
│   └── tests/          # Unit tests
├── personal_finance_management/
│   ├── settings.py     # Django config + Sentry integration
│   └── urls.py
└── requirements.txt    # Production deps + sentry-sdk

frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page-level components
│   ├── store/          # Redux slices (categories, transactions, loading, etc.)
│   ├── hooks/          # Custom hooks
│   ├── types/          # TypeScript interfaces
│   └── utils/          # Helper functions
└── package.json        # Dependencies + @sentry/react

docker/
├── docker-compose.yml      # Development
├── docker-compose.prod.yml # Production with static_volume
└── nginx-backend.conf      # Nginx config for static files
```

## Development Commands

### Local Development

```powershell
# Start services
cd docker
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Run migrations
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# Create superuser (or use default: admin/changeme123)
docker compose exec backend python manage.py createsuperuser

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# Run tests
docker compose exec backend pytest
cd ../frontend && npm test
```

### Production

```powershell
cd docker
docker compose -f docker-compose.prod.yml up -d --build

# Collect static files to shared volume
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput --clear
```

### Code Quality

```powershell
# Install pre-commit hooks (one-time)
pip install pre-commit
pre-commit install

# Run all checks manually
pre-commit run --all-files

# Run specific hook
pre-commit run ruff --all-files

# Update hook versions
pre-commit autoupdate
```

## Key Features

### Backend APIs

- `/api/v1/categories/` - Category CRUD with budget tracking
- `/api/v1/transactions/` - Transaction management with filtering
- `/api/v1/investments/` - Investment portfolio tracking
- `/api/v1/heritages/` - Real estate/property management
- `/api/v1/retirement-accounts/` - 401k/IRA tracking
- `/api/v1/balance/{period}/` - Balance calculations by period
- `/api/v1/category-spending/{period}/` - Category spending analysis
- `/api/v1/upload-statement/` - CSV bank statement upload
- `/api/schema/swagger-ui/` - API documentation
- `/admin/` - Django admin with Jazzmin UI

### Frontend Pages

- Dashboard - Overview with charts and analytics
- Transactions - Dual-panel (Spends/Incomes) with filters
- Categories - Budget management
- Investments - Portfolio tracking with gain/loss
- Heritage - Property management
- Retirement - 401k/IRA tracking

## Important Notes

### Database

- **Default admin**: username=`admin`, password=`changeme123` (auto-created in
  migrations)
- All models have `user` ForeignKey for multi-user support
- Indexes on user-scoped queries for performance
- Use `select_related('user')` in all ViewSets

### Static Files (Production)

- Backend writes to `/app/staticfiles/` in `static_volume`
- Nginx serves from same volume at `/static/` endpoint
- Must run `collectstatic` after backend changes
- Jazzmin admin UI requires static files to work

### Error Handling

- ErrorBoundary wraps React app
- Global loading state via Redux
- Sentry integration (optional, needs DSN in .env)
- Django logging to files: `backend/logs/django.log`, `backend/logs/error.log`

### N+1 Query Prevention

- All ViewSets use `select_related('user')`
- TransactionViewSet uses `select_related('category')`
- `category_spending_by_period` uses single aggregated query
- Use Django Debug Toolbar in development to catch N+1s

## Common Tasks

### Adding a New API Endpoint

1. Add function to `backend/budget/views.py`
2. Add `@extend_schema` decorator for documentation
3. Add route to `backend/budget/urls.py`
4. Create Redux slice if needed
5. Add tests in `backend/budget/tests/`

### Adding a New Frontend Page

1. Create component in `frontend/src/pages/`
2. Add route to `frontend/src/routes/AppRoutes.tsx`
3. Create Redux slice in `frontend/src/store/slices/`
4. Add navigation link to `frontend/src/components/Navigation.tsx`

### Database Schema Changes

1. Modify models in `backend/budget/models.py`
2. Run: `docker compose exec backend python manage.py makemigrations`
3. Review migration file
4. Run: `docker compose exec backend python manage.py migrate`
5. Update serializers if needed

## Environment Variables

**Backend** (`docker/.env`):

```bash
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=personal_finance_management
DB_USER=user
DB_PASSWORD=password
DB_HOST=postgres
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Optional
SENTRY_DSN=https://...
ENVIRONMENT=production
RELEASE_VERSION=1.0.0
```

**Frontend** (`.env`):

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SENTRY_DSN=https://...  # Optional
```

## Troubleshooting

### Jazzmin Admin Shows Plain HTML

- Run:
  `docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput --clear`
- Restart nginx: `docker compose -f docker-compose.prod.yml restart nginx`
- Check static files:
  `docker compose -f docker-compose.prod.yml exec nginx ls /app/staticfiles/jazzmin/`

### Pre-commit Hooks Failing

- Ruff auto-fixes most issues: `ruff check --fix backend/`
- Format code: `ruff format backend/`
- Check specific file: `pre-commit run ruff --files backend/budget/views.py`

### Database Connection Errors

- Check postgres is healthy: `docker compose ps postgres`
- Check connection: `docker compose exec backend python manage.py dbshell`
- Reset database: `docker compose down -v && docker compose up -d`

### CI/CD Failures

- GitHub Actions timeout: Check if tests are hanging (max 10 min for backend, 8
  min for frontend)
- Linting failures: Run `pre-commit run --all-files` locally first
- Missing dependencies: Update `requirements.txt` or `package.json`

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [DRF Documentation](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [Jazzmin Documentation](https://django-jazzmin.readthedocs.io/)

## Copilot Best Practices

- When adding features, check existing patterns in codebase first
- Use `select_related()` and `prefetch_related()` for all database queries
- Add type hints to all new Python functions
- Add `@extend_schema` to all new API views
- Follow existing Redux patterns for state management
- Write tests for new features
- Update this file when adding new major features or changing architecture
