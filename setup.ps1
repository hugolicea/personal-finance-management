# Enhanced Setup Script for Personal Finance Management with Database Selection

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Personal Finance Management - Interactive Setup            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
if (-not (Get-Command docker compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker and Docker Compose are installed" -ForegroundColor Green
Write-Host ""

# Database Selection
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║                    Database Selection                        ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""
Write-Host "Select your preferred database system:" -ForegroundColor White
Write-Host "  [1] PostgreSQL 15 (Recommended)" -ForegroundColor Cyan
Write-Host "      - Best for complex queries and JSON data" -ForegroundColor Gray
Write-Host "      - Better performance for analytics" -ForegroundColor Gray
Write-Host "      - Default port: 5432" -ForegroundColor Gray
Write-Host ""
Write-Host "  [2] MySQL 8.0" -ForegroundColor Cyan
Write-Host "      - Good for traditional applications" -ForegroundColor Gray
Write-Host "      - Wide hosting support" -ForegroundColor Gray
Write-Host "      - Default port: 3306" -ForegroundColor Gray
Write-Host ""

do {
    $dbChoice = Read-Host "Enter your choice (1 or 2)"
} while ($dbChoice -notin @("1", "2"))

if ($dbChoice -eq "1") {
    $dbEngine = "postgresql"
    $dbHost = "postgres"
    $dbPort = "5432"
    $profile = "postgres"
    Write-Host "✅ PostgreSQL selected" -ForegroundColor Green
} else {
    $dbEngine = "mysql"
    $dbHost = "mysql"
    $dbPort = "3306"
    $profile = "mysql"
    Write-Host "✅ MySQL selected" -ForegroundColor Green
}

Write-Host ""

# Environment Configuration
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║              Environment Configuration                       ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

$envPath = "docker\.env"
if (Test-Path $envPath) {
    Write-Host "⚠️  .env file already exists in docker directory" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "ℹ️  Using existing .env file. Make sure it's configured correctly." -ForegroundColor Yellow
        Write-Host "   Required: DB_ENGINE=$dbEngine, DB_HOST=$dbHost, DB_PORT=$dbPort" -ForegroundColor Gray
    } else {
        # Create .env file
        Write-Host "📝 Creating .env file with $dbEngine configuration..." -ForegroundColor Cyan

        $secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 50 | ForEach-Object {[char]$_})

        $envContent = @"
# Database Configuration
DB_ENGINE=$dbEngine
DB_NAME=personal_finance_management
DB_USER=user
DB_PASSWORD=password
DB_HOST=$dbHost
DB_PORT=$dbPort

# Django Configuration
SECRET_KEY=$secretKey
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Optional: Uncomment and configure for production
# SENTRY_DSN=
# ENVIRONMENT=development
# RELEASE_VERSION=1.0.0
"@
        $envContent | Out-File -FilePath $envPath -Encoding UTF8
        Write-Host "✅ .env file created successfully" -ForegroundColor Green
    }
} else {
    Write-Host "📝 Creating .env file with $dbEngine configuration..." -ForegroundColor Cyan

    $secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 50 | ForEach-Object {[char]$_})

    $envContent = @"
# Database Configuration
DB_ENGINE=$dbEngine
DB_NAME=personal_finance_management
DB_USER=user
DB_PASSWORD=password
DB_HOST=$dbHost
DB_PORT=$dbPort

# Django Configuration
SECRET_KEY=$secretKey
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Optional: Uncomment and configure for production
# SENTRY_DSN=
# ENVIRONMENT=development
# RELEASE_VERSION=1.0.0
"@
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "✅ .env file created successfully" -ForegroundColor Green
}

# Frontend .env
if (-not (Test-Path "frontend\.env")) {
    Write-Host "📝 Creating frontend .env file..." -ForegroundColor Cyan
    "VITE_API_BASE_URL=http://localhost:8000/api/v1" | Out-File -FilePath "frontend\.env" -Encoding UTF8
    Write-Host "✅ Frontend .env created" -ForegroundColor Green
}

Write-Host ""

# Starting Services
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║                Starting Docker Services                      ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

Write-Host "🐳 Starting Docker containers with $dbEngine profile..." -ForegroundColor Green
Set-Location docker

# Stop any existing containers
docker compose --profile postgres --profile mysql down 2>$null

# Start with selected profile
docker compose --profile $profile up -d

Write-Host ""
Write-Host "⏳ Waiting for $dbEngine database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check database health
Write-Host "🔍 Checking database connectivity..." -ForegroundColor Cyan
$maxRetries = 5
$retryCount = 0
$dbReady = $false

while (-not $dbReady -and $retryCount -lt $maxRetries) {
    $retryCount++
    if ($dbEngine -eq "postgresql") {
        $result = docker compose exec postgres pg_isready -U user 2>&1
        if ($result -like "*accepting connections*") {
            $dbReady = $true
        }
    } else {
        $result = docker compose exec mysql mysqladmin ping -h localhost -u user -ppassword 2>&1
        if ($result -like "*alive*") {
            $dbReady = $true
        }
    }

    if (-not $dbReady) {
        Write-Host "   Attempt $retryCount/$maxRetries - Waiting..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
}

if ($dbReady) {
    Write-Host "✅ Database is ready!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database might not be fully ready. Proceeding anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Database Migrations
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║                  Database Setup                              ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔄 Running database migrations..." -ForegroundColor Green
docker compose --profile $profile exec backend python manage.py makemigrations
docker compose --profile $profile exec backend python manage.py migrate

Write-Host ""
Write-Host "📊 Collecting static files..." -ForegroundColor Green
docker compose --profile $profile exec backend python manage.py collectstatic --noinput

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  Setup Complete! 🎉                          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Your Personal Finance Management application is ready!" -ForegroundColor White
Write-Host ""
Write-Host "📌 Access Points:" -ForegroundColor Cyan
Write-Host "   • Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "   • Backend API: http://localhost:8000/api/v1" -ForegroundColor White
Write-Host "   • Admin Panel: http://localhost:8000/admin" -ForegroundColor White
Write-Host "   • API Docs:    http://localhost:8000/api/schema/swagger-ui/" -ForegroundColor White
Write-Host ""
Write-Host "👤 Default Admin Credentials:" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: changeme123" -ForegroundColor White
Write-Host ""
Write-Host "💾 Database: $dbEngine on port $dbPort" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Yellow
Write-Host "   View logs:     docker compose --profile $profile logs -f" -ForegroundColor Gray
Write-Host "   Stop services: docker compose --profile $profile down" -ForegroundColor Gray
Write-Host "   Restart:       docker compose --profile $profile restart" -ForegroundColor Gray
Write-Host ""

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📍 Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "   Admin Panel: http://localhost:8000/admin" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/api/schema/swagger-ui/" -ForegroundColor White

Write-Host "`n⚠️  Next steps:" -ForegroundColor Yellow
Write-Host "   1. Update backend\.env with your SECRET_KEY" -ForegroundColor White
Write-Host "   2. Create a superuser: docker compose exec backend python manage.py createsuperuser" -ForegroundColor White
Write-Host "   3. Access the application at http://localhost:3000" -ForegroundColor White

Set-Location ..
