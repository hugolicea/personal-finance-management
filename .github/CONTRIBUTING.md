# Contributing to Personal Finance Management

Thank you for your interest in contributing to Personal Finance Managment! This document provides guidelines and information for contributors.

## Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/hugolicea/personal-finance-management.git
   cd personal-finance-management
   ```

2. **Backend Setup**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.dev.txt
   python manage.py migrate
   python manage.py runserver
   ```

3. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Docker Setup (Alternative)**

   ```bash
   docker-compose up --build
   ```

## Project Structure

- `backend/` - Django REST API
- `frontend/` - React TypeScript application
- `docker/` - Docker configuration files

## Code Style

- **Backend**: Follow PEP 8 guidelines
- **Frontend**: Use ESLint and Prettier configurations
- **Commits**: Use conventional commit format

## Testing

- Run backend tests: `cd backend && python -m pytest`
- Run frontend tests: `cd frontend && npm test`

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Issues

- Use GitHub issues to report bugs or request features
- Provide detailed descriptions and steps to reproduce
- Include screenshots for UI-related issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
