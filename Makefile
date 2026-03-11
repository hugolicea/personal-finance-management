# Makefile for Personal Finance Management
# Simplifies Docker Compose commands for different environments

.PHONY: help dev-up dev-down dev-logs dev-build prod-up prod-down prod-logs prod-build clean test

# Default target
help:
	@echo "Personal Finance Management - Docker Commands"
	@echo ""
	@echo "Development (PostgreSQL):"
	@echo "  make dev-up-pg          - Start dev environment with PostgreSQL"
	@echo "  make dev-down           - Stop dev environment"
	@echo "  make dev-logs           - View dev logs"
	@echo "  make dev-build          - Rebuild dev images"
	@echo ""
	@echo "Development (MySQL):"
	@echo "  make dev-up-mysql       - Start dev environment with MySQL"
	@echo ""
	@echo "Production (PostgreSQL):"
	@echo "  make prod-up-pg         - Start prod environment with PostgreSQL"
	@echo "  make prod-down          - Stop prod environment"
	@echo "  make prod-logs          - View prod logs"
	@echo "  make prod-build         - Rebuild prod images"
	@echo ""
	@echo "Production (MySQL):"
	@echo "  make prod-up-mysql      - Start prod environment with MySQL"
	@echo ""
	@echo "Database:"
	@echo "  make migrate            - Run Django migrations (dev)"
	@echo "  make migrate-prod       - Run Django migrations (prod)"
	@echo "  make createsuperuser    - Create Django superuser (dev)"
	@echo "  make shell              - Open Django shell (dev)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean              - Stop all and remove volumes (⚠️  deletes data!)"
	@echo "  make prune              - Remove unused Docker resources"

# Development commands (PostgreSQL)
dev-up-pg:
	docker compose --profile postgres up -d

dev-up-mysql:
	docker compose --profile mysql up -d

dev-down:
	docker compose down

dev-logs:
	docker compose logs -f

dev-logs-backend:
	docker compose logs -f backend

dev-logs-frontend:
	docker compose logs -f frontend

dev-build:
	docker compose build

dev-restart:
	docker compose restart

# Production commands (PostgreSQL)
prod-up-pg:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile postgres up -d

prod-up-mysql:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile mysql up -d

prod-down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down

prod-logs:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

prod-logs-backend:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

prod-build:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-restart:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Database commands
migrate:
	docker compose exec backend python manage.py migrate

migrate-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py migrate

makemigrations:
	docker compose exec backend python manage.py makemigrations

createsuperuser:
	docker compose exec backend python manage.py createsuperuser

shell:
	docker compose exec backend python manage.py shell

dbshell:
	docker compose exec backend python manage.py dbshell

collectstatic:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Testing
test:
	docker compose exec backend pytest

test-coverage:
	docker compose exec backend pytest --cov=budget --cov-report=html

# Utility commands
ps:
	docker compose ps

ps-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Cleanup commands
clean:
	@echo "⚠️  WARNING: This will delete all data volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v; \
	fi

prune:
	docker system prune -f
	docker volume prune -f

# Adminer
adminer-url:
	@echo "Adminer: http://localhost:8080"
	@echo "Server: mysql (or postgres)"
	@echo "Username: user"
	@echo "Password: password"
	@echo "Database: personal_finance_management"
