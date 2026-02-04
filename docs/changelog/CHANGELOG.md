# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- User authentication with JWT tokens
- Multi-user support with data isolation
- Database indexes for improved performance
- API pagination for large datasets
- API versioning (v1)
- Error boundaries in React app
- TypeScript strict mode
- Environment variable configuration
- Pre-commit hooks for code quality
- Logging configuration
- Production Docker configurations
- CI/CD pipeline with GitHub Actions
- API filtering and search capabilities
- Security headers and CORS configuration

### Changed
- Improved security settings (SECRET_KEY, DEBUG, ALLOWED_HOSTS)
- Updated all models to include user foreign keys
- Enhanced admin panel with better filtering and search
- Moved API endpoints to /api/v1/
- Improved error handling across the application

### Fixed
- PEP8 compliance issues
- Unused imports in settings.py
- Line length violations

### Security
- Removed hardcoded secrets
- Added proper authentication and authorization
- Implemented rate limiting considerations
- Added security headers

## [0.1.0] - Initial Release

### Added
- Basic transaction management
- Category management with budgets
- Investment tracking
- Heritage property management
- Retirement account tracking
- Bank statement import
- Dashboard with analytics
- Docker containerization
