# 💰 Personal Finance Management

A comprehensive personal budget management application built with Django REST API backend and React TypeScript frontend. Track expenses, manage categories, analyze spending patterns, and maintain financial control with ease.

## ✨ Features

### 📊 **Dashboard & Analytics**

- Real-time balance overview with income, expenses, and net calculations
- Interactive spending charts and visualizations
- Period-based filtering (monthly/yearly views)
- Category-wise spending analysis

### 🏷️ **Category Management**

- Create and manage spending/income categories
- Set monthly budgets for expense categories
- Automatic categorization of bank transactions
- Visual separation of spend vs income categories

### 💳 **Transaction Management**

- Manual transaction entry with full CRUD operations
- Bank statement upload and automatic processing
- Advanced filtering by date, category, and amount
- Dual-panel display: Spends vs Incomes
- Search functionality across transaction descriptions

### 📈 **Financial Insights**

- Monthly budget tracking with remaining balance calculations
- Spending pattern analysis by category
- Transaction count and average calculations
- Year-over-year and month-over-month comparisons

### 🔧 **Technical Features**

- RESTful API with Django REST Framework
- TypeScript for type-safe frontend development
- Redux Toolkit for state management
- Tailwind CSS for responsive UI
- Docker containerization for easy deployment
- PostgreSQL database with proper migrations

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

2. **Start the services**

   ```bash
   cd docker
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: <http://localhost:3000>
   - Backend API: <http://localhost:8000>
   - API Documentation: <http://localhost:8000/api/docs/>

### Production Deployment

1. **Update environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your production settings
   ```

2. **Deploy with Docker Compose**

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
