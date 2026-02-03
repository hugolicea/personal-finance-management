# Setup Script for Personal Finance Management

Write-Host "🚀 Setting up Personal Finance Management Application..." -ForegroundColor Green

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

# Create .env file if it doesn't exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" -Destination "backend\.env"
    Write-Host "⚠️  Please update backend\.env with your configuration" -ForegroundColor Yellow
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "📝 Creating frontend .env file..." -ForegroundColor Yellow
    "VITE_API_BASE_URL=http://localhost:8000" | Out-File -FilePath "frontend\.env" -Encoding UTF8
}

Write-Host "`n🐳 Starting Docker containers..." -ForegroundColor Green
Set-Location docker
docker compose up -d

Write-Host "`n⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n📦 Installing backend dependencies..." -ForegroundColor Green
docker compose exec backend pip install -r requirements.txt -r requirements.dev.txt

Write-Host "`n🔄 Running database migrations..." -ForegroundColor Green
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

Write-Host "`n👤 Creating superuser (skip if already exists)..." -ForegroundColor Green
docker compose exec backend python manage.py createsuperuser --noinput --email admin@example.com 2>$null

Write-Host "`n📊 Collecting static files..." -ForegroundColor Green
docker compose exec backend python manage.py collectstatic --noinput

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
