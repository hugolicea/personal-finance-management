# 💰 Personal Finance Management

A comprehensive, secure personal budget management application built with Django
REST API backend and React TypeScript frontend. Track expenses, manage
investments, analyze spending patterns, and maintain complete financial control
with enterprise-grade features.

## ✨ Features

### 🔐 **Security & Authentication**

- JWT-based authentication for secure API access
- Multi-user support with complete data isolation
- Role-based access control
- Secure password hashing and validation

### 📊 **Dashboard & Analytics**

- Real-time balance overview with income, expenses, and net calculations
- Interactive spending charts and visualizations
- Period-based filtering (monthly/yearly views)
- Category-wise spending analysis with budget tracking

### 🏷️ **Category Management**

- Create and manage spending/income categories
- Set monthly budgets for expense categories
- Automatic categorization of bank transactions
- Visual separation of spend vs income categories

### 💳 **Transaction Management**

- Manual transaction entry with full CRUD operations
- Bank statement upload and automatic processing (CSV support)
- Advanced filtering, search, and pagination
- Dual-panel display: Spends vs Incomes
- Duplicate transaction detection

### 🧹 **Clean and Reclassify**

- Bulk reclassification of transactions by category
- Batch deletion of transactions by category
- Persistent reclassification and deletion rules
- User-specific rule management
- Real-time rule execution with progress tracking
- Confirmation modals for safe operation execution

### 📈 **Investment Tracking**

- Track stocks, bonds, ETFs, crypto, and fixed income investments
- Automatic gain/loss calculations
- Portfolio performance monitoring
- Compound interest calculations for fixed income

### 🏠 **Heritage & Real Estate**

- Property management and valuation tracking
- Rental income tracking and yield calculations
- Multiple property type support

### 💼 **Retirement Planning**

- 401(k), IRA, and other retirement account tracking
- Employer match calculations
- Risk profile management

### 🔧 **Technical Features**

- RESTful API with versioning (v1)
- TypeScript for type-safe frontend development
- Redux Toolkit for state management
- Tailwind CSS for responsive UI
- Docker containerization for easy deployment
- PostgreSQL database with optimized indexes
- **Error boundaries** for graceful error handling
- **Global loading states** with Redux integration
- **Sentry integration** for error monitoring and tracking
- **Pre-commit hooks** for code quality and security
- **Optimized database queries** (N+1 problem fixes)
- Comprehensive logging and error handling
- CI/CD pipeline with GitHub Actions
- Production-ready configurations

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Interactive Setup (Recommended)

The easiest way to get started is using our interactive setup script that
supports both PostgreSQL and MySQL:

```powershell
# Windows PowerShell
.\setup.ps1
```

The setup script will:

- ✅ Verify Docker installation
- 🗄️ Let you choose between PostgreSQL or MySQL
- 📝 Create environment files automatically
- 🚀 Start services with your selected database
- 🔄 Run database migrations
- 🎉 Set up everything for you!

**Default admin credentials:**

- Username: `admin`
- Password: `changeme123` (change after first login)

> 📖 **For detailed database configuration options**, see
> [Database Selection Guide](./docs/setup/DATABASE_SELECTION_GUIDE.md)

### Manual Setup

If you prefer manual configuration:

### Development Setup

1. **Clone the repository**

    ```bash
    git clone https://github.com/hugolicea/personal-finance-management.git
    cd personal-finance-management
    ```

2. **Choose your database and configure**

    **Option A: PostgreSQL (Recommended)**

    ```powershell
    # Using helper script (easiest)
    Copy-Item .env.postgresql .env
    .\compose.ps1 dev-up-pg

    # Or using docker compose directly
    Copy-Item .env.postgresql .env
    docker compose --profile postgres up -d
    ```

    **Option B: MySQL**

    ```powershell
    # Using helper script (easiest)
    Copy-Item .env.mysql .env
    .\compose.ps1 dev-up-mysql

    # Or using docker compose directly
    Copy-Item .env.mysql .env
    docker compose --profile mysql up -d
    ```

    > **Note:** `docker compose up` automatically uses
    > `docker-compose.override.yml` for development settings (hot reload,
    > Adminer, DEBUG=True)

3. **Run migrations**

    ```bash
    # Using helper script
    .\compose.ps1 migrate

    # Or using docker compose directly
    # For PostgreSQL
    docker compose --profile postgres exec backend python manage.py migrate

    # For MySQL
    docker compose --profile mysql exec backend python manage.py migrate
    ```

4. **Access the application**
    - Frontend: <http://localhost:3000>
    - Backend API: <http://localhost:8000/api/v1/>
    - Admin Panel: <http://localhost:8000/admin>
    - API Documentation: <http://localhost:8000/api/schema/swagger-ui/>
    - Adminer (Database): <http://localhost:8080> (dev only)

5. **View logs and useful commands**

    ```powershell
    # View all available commands
    .\compose.ps1 help

    # View logs
    .\compose.ps1 dev-logs

    # Create superuser
    .\compose.ps1 createsuperuser

    # Django shell
    .\compose.ps1 shell

    # Stop containers
    .\compose.ps1 dev-down
    ```

### Developer Setup (Code Quality Tools)

For development work with automated code quality checks:

1. **Install pre-commit hooks**

    ```bash
    # Install pre-commit (if not already installed)
    pip install pre-commit

    # Install git hooks
    pre-commit install

    # (Optional) Run on all files to test
    pre-commit run --all-files
    ```

2. **Pre-commit hooks will automatically**:
    - Format Python code with Black
    - Lint Python code with Flake8
    - Sort Python imports with isort
    - Scan for security issues with Bandit
    - Format JavaScript/TypeScript with Prettier
    - Lint JavaScript/TypeScript with ESLint
    - Check for trailing whitespace
    - Validate YAML files
    - Prevent committing large files or secrets

3. **Sentry Integration (Optional)**

    For error monitoring in development:

    ```bash
    # Backend: Add to backend/.env
    SENTRY_DSN=your-sentry-dsn-here

    # Frontend: Add to frontend/.env
    VITE_SENTRY_DSN=your-sentry-dsn-here
    ```

### Production Deployment

1. **Configure environment variables**

    ```bash
    # Backend environment variables
    SECRET_KEY=<your-secret-key>
    DEBUG=False
    ALLOWED_HOSTS=your-domain.com

    # Optional: Sentry for error monitoring
    SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
    ENVIRONMENT=production

    # Frontend environment variables
    VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
    ```

2. **Deploy with production Docker Compose**

    ```bash
    # Using helper script (easiest)
    .\compose.ps1 prod-up-mysql
    # or for PostgreSQL:
    .\compose.ps1 prod-up-pg

    # Or using docker compose directly
    docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile mysql up -d --build
    # or for PostgreSQL:
    docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile postgres up -d --build
    ```

    > **Note:** Production uses explicit override file
    > (`docker-compose.prod.yml`) with Dockerfile.prod, nginx, resource limits,
    > and no Adminer

3. **Run migrations in production**

    ```bash
    # Using helper script
    .\compose.ps1 migrate-prod

    # Or using docker compose directly
    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py migrate
    ```

## 🏗️ Project Structure

```plaintext
personal-finance-management/
├── backend/                    # Django REST API
│   ├── budget/                # Main app
│   │   ├── models.py         # Database models
│   │   ├── views.py          # API endpoints
│   │   ├── serializers.py    # Data serialization
│   │   └── tests/            # Unit tests
│   ├── personal_finance_management/         # Django project settings
│   └── requirements.txt      # Python dependencies
├── frontend/                  # React TypeScript app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux state management
│   │   └── hooks/           # Custom React hooks
│   ├── public/              # Static assets
│   └── package.json         # Node dependencies
├── docker/                   # Docker configuration
│   └── docker-compose.yml   # Service orchestration
└── README.md
```

## 🛠️ Technology Stack

### Backend

- **Django 5.1** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Database
- **DRF Spectacular** - API documentation
- **Django Jazzmin** - Admin interface

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Axios** - HTTP client

### DevOps

- **Docker** - Containerization
- **Docker Compose** - Multi-service orchestration
- **Sentry** - Error tracking and monitoring
- **Pre-commit** - Git hooks for code quality
- **Flake8** - Python linting
- **Black** - Python formatting
- **isort** - Python import sorting
- **Bandit** - Python security scanning
- **Prettier** - JavaScript/TypeScript formatting
- **ESLint** - JavaScript/TypeScript linting

## 📡 API Endpoints

### Categories

- `GET /api/categories/` - List all categories
- `POST /api/categories/` - Create new category
- `GET /api/categories/{id}/` - Get category details
- `PUT /api/categories/{id}/` - Update category
- `DELETE /api/categories/{id}/` - Delete category

### Transactions

- `GET /api/transactions/` - List all transactions
- `POST /api/transactions/` - Create new transaction
- `GET /api/transactions/{id}/` - Get transaction details
- `PUT /api/transactions/{id}/` - Update transaction
- `DELETE /api/transactions/{id}/` - Delete transaction

### Bulk Operations

- `POST /api/bulk-reclassify-transactions/` - Reclassify transactions by
  category
- `POST /api/bulk-delete-transactions/` - Delete transactions by categories
- `GET /api/reclassification-rules/` - List reclassification rules
- `POST /api/reclassification-rules/` - Create reclassification rule
- `DELETE /api/reclassification-rules/{id}/` - Delete reclassification rule
- `GET /api/category-deletion-rules/` - List category deletion rules
- `POST /api/category-deletion-rules/` - Create category deletion rule
- `DELETE /api/category-deletion-rules/{id}/` - Delete category deletion rule

### Analytics

- `GET /api/category-spending/{period}/` - Category spending analysis

## 📚 Documentation

Comprehensive documentation is available in the [docs](./docs/) folder:

- **[Setup & Installation](./docs/setup/)** - Docker setup and database
  configuration
- **[User Guides](./docs/guides/)** - Feature tutorials and how-tos
- **[Architecture](./docs/architecture/)** - Technical documentation and design
  decisions
- **[Troubleshooting](./docs/troubleshooting/)** - Common issues and solutions
- **[Changelog](./docs/changelog/)** - Version history and release notes

For a complete overview, see the [Documentation Index](./docs/README.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by personal finance management needs
- Community contributions welcome!
