# PowerShell Helper Script for Docker Compose
# Usage: .\compose.ps1 <command>
# Example: .\compose.ps1 dev-up-mysql

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "Personal Finance Management - Docker Commands" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Development (auto-loads docker-compose.override.yml):" -ForegroundColor Yellow
    Write-Host "  .\compose.ps1 dev-up-pg          - Start dev with PostgreSQL + Adminer"
    Write-Host "  .\compose.ps1 dev-up-mysql       - Start dev with MySQL + Adminer"
    Write-Host "  .\compose.ps1 dev-down-pg        - Stop dev environment (PostgreSQL)"
    Write-Host "  .\compose.ps1 dev-down-mysql     - Stop dev environment (MySQL)"
    Write-Host "  .\compose.ps1 dev-logs-mysql     - View all dev logs (MySQL profile)"
    Write-Host "  .\compose.ps1 dev-logs-backend   - View backend logs only"
    Write-Host "  .\compose.ps1 dev-build-pg       - Rebuild dev images (PostgreSQL)"
    Write-Host "  .\compose.ps1 dev-build-mysql    - Rebuild dev images (MySQL)"
    Write-Host "  .\compose.ps1 dev-restart-pg     - Restart dev containers (PostgreSQL)"
    Write-Host "  .\compose.ps1 dev-restart-mysql  - Restart dev containers (MySQL)"
    Write-Host ""
    Write-Host "Production:" -ForegroundColor Yellow
    Write-Host "  .\compose.ps1 prod-up-pg         - Start prod with PostgreSQL"
    Write-Host "  .\compose.ps1 prod-up-mysql      - Start prod with MySQL"
    Write-Host "  .\compose.ps1 prod-down-pg       - Stop prod environment (PostgreSQL)"
    Write-Host "  .\compose.ps1 prod-down-mysql    - Stop prod environment (MySQL)"
    Write-Host "  .\compose.ps1 prod-down          - Stop ALL prod containers"
    Write-Host "  .\compose.ps1 prod-logs-pg       - View prod logs (PostgreSQL)"
    Write-Host "  .\compose.ps1 prod-logs-mysql    - View prod logs (MySQL)"
    Write-Host "  .\compose.ps1 prod-build-pg      - Rebuild prod images (PostgreSQL)"
    Write-Host "  .\compose.ps1 prod-build-mysql   - Rebuild prod images (MySQL)"
    Write-Host "  .\compose.ps1 prod-restart-pg    - Restart prod containers (PostgreSQL)"
    Write-Host "  .\compose.ps1 prod-restart-mysql - Restart prod containers (MySQL)"
    Write-Host ""
    Write-Host "Database:" -ForegroundColor Yellow
    Write-Host "  .\compose.ps1 migrate            - Run migrations (dev)"
    Write-Host "  .\compose.ps1 migrate-prod       - Run migrations (prod)"
    Write-Host "  .\compose.ps1 makemigrations     - Create new migrations"
    Write-Host "  .\compose.ps1 createsuperuser    - Create admin user"
    Write-Host "  .\compose.ps1 shell              - Django shell"
    Write-Host "  .\compose.ps1 dbshell            - Database shell"
    Write-Host ""
    Write-Host "Testing:" -ForegroundColor Yellow
    Write-Host "  .\compose.ps1 test               - Run tests"
    Write-Host "  .\compose.ps1 test-coverage      - Run tests with coverage"
    Write-Host ""
    Write-Host "Utility:" -ForegroundColor Yellow
    Write-Host "  .\compose.ps1 ps                 - Show dev container status"
    Write-Host "  .\compose.ps1 ps-prod            - Show prod container status"
    Write-Host "  .\compose.ps1 adminer            - Show Adminer connection info"
    Write-Host "  .\compose.ps1 clean              - Remove all containers and volumes"
}

switch ($Command) {
    "dev-up-pg" {
        docker compose --profile postgres up -d
    }
    "dev-up-mysql" {
        docker compose --profile mysql up -d
    }
    "dev-down-pg" {
        docker compose --profile postgres down
    }
    "dev-down-mysql" {
        docker compose --profile mysql down
    }
    "dev-logs-mysql" {
        docker compose --profile mysql logs -f
    }
    "dev-logs-backend" {
        docker compose --profile mysql logs -f backend
    }
    "dev-logs-frontend" {
        docker compose --profile mysql logs -f frontend
    }
    "dev-build-pg" {
        docker compose --profile postgres build
    }
    "dev-build-mysql" {
        docker compose --profile mysql build
    }
    "dev-restart-mysql" {
        docker compose --profile mysql restart
    }
    "dev-restart-pg" {
        docker compose --profile postgres restart
    }
    "prod-up-pg" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile postgres up -d
    }
    "prod-up-mysql" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile mysql up -d
    }
    "prod-down-pg" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile postgres down
    }
    "prod-down-mysql" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile mysql down
    }
    "prod-down" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml down
    }
    "prod-logs-pg" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile postgres logs -f
    }
    "prod-logs-mysql" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile mysql logs -f
    }
    "prod-logs-backend" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
    }
    "prod-build-pg" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile postgres build
    }
    "prod-build-mysql" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile mysql build
    }
    "prod-restart-pg" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile postgres restart
    }
    "prod-restart-mysql" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile mysql restart
    }
    "migrate" {
        docker compose exec backend python manage.py migrate
    }
    "migrate-prod" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py migrate
    }
    "makemigrations" {
        docker compose exec backend python manage.py makemigrations
    }
    "createsuperuser" {
        docker compose exec backend python manage.py createsuperuser
    }
    "shell" {
        docker compose exec backend python manage.py shell
    }
    "dbshell" {
        docker compose exec backend python manage.py dbshell
    }
    "collectstatic" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
    }
    "test" {
        docker compose exec backend python -m pytest
    }
    "test-coverage" {
        docker compose exec backend python -m pytest --cov=budget --cov=core --cov=wealth --cov-report=html
    }
    "ps" {
        docker compose ps
    }
    "ps-prod" {
        docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
    }
    "adminer" {
        Write-Host "`nAdminer Database Management:" -ForegroundColor Cyan
        Write-Host "URL:      http://localhost:8080" -ForegroundColor Green
        Write-Host "System:   MySQL or PostgreSQL"
        Write-Host "Server:   mysql (or postgres)"
        Write-Host "Username: user"
        Write-Host "Password: password"
        Write-Host "Database: personal_finance_management"
    }
    "clean" {
        Write-Host "WARNING: This will delete all data volumes!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq "yes") {
            docker compose down -v
            docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
            Write-Host "All containers and volumes removed" -ForegroundColor Green
        } else {
            Write-Host "Operation cancelled" -ForegroundColor Yellow
        }
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
    }
}
