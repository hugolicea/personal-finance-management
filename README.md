# 💰 Personal Finance Management

A comprehensive, secure personal budget management application built with Django REST API backend and React TypeScript frontend. Track expenses, manage investments, analyze spending patterns, and maintain complete financial control with enterprise-grade features.

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
- Comprehensive logging and error handling
- CI/CD pipeline with GitHub Actions
- Production-ready configurations

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/hugolicea/personal-finance-management.git
   cd personal-finance-management
   ```

2. **Run setup script (Windows)**

   ```powershell
   .\setup.ps1
   ```

   Or manually:

   ```bash
   # Create environment files
   cp backend/.env.example backend/.env

   # Start services
   cd docker
   docker-compose up --build

   # Run migrations (automatically creates default admin user)
   docker-compose exec backend python manage.py migrate

   # Default admin credentials (change after first login):
   # Username: admin
   # Password: changeme123
   ```

3. **Access the application**
   - Frontend: <http://localhost:3000>
   - Backend API: <http://localhost:8000/api/v1/>
   - Admin Panel: <http://localhost:8000/admin>
   - API Documentation: <http://localhost:8000/api/schema/swagger-ui/>

### Production Deployment

1. **Configure environment variables**

   ```bash
   # Update backend/.env with production values
   SECRET_KEY=<your-secret-key>
   DEBUG=False
   ALLOWED_HOSTS=your-domain.com
   ```

2. **Deploy with production Docker Compose**

   ```bash
   cd docker
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. **Deploy with Docker Compose**

   ```bash
   docker-compose -f docker/docker-compose.yml up -d --build
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
- **Flake8** - Python linting
- **Black** - Python formatting
- **Prettier** - JavaScript/TypeScript formatting

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

### Analytics

- `GET /api/category-spending/{period}/` - Category spending analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by personal finance management needs
- Community contributions welcome!
