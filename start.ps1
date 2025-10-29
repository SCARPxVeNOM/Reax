# LineraTrade AI - Unified Startup Script
# This script starts all services with one command

Write-Host "🚀 Starting LineraTrade AI..." -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`n📦 Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start Docker services (PostgreSQL, Redis)
Write-Host "`n🐳 Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if services are up
$postgresHealthy = docker ps --filter "name=lineratrade-postgres" --format "{{.Status}}" | Select-String -Pattern "healthy|Up"
$redisHealthy = docker ps --filter "name=lineratrade-redis" --format "{{.Status}}" | Select-String -Pattern "healthy|Up"

if ($postgresHealthy -and $redisHealthy) {
    Write-Host "✅ Database services are ready" -ForegroundColor Green
} else {
    Write-Host "⚠️  Services may still be starting..." -ForegroundColor Yellow
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "`n❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with your configuration." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green

# Check if Linera network is running (optional check via HTTP)
Write-Host "`n🔗 Checking Linera network..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Linera network is accessible" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Linera network not accessible at http://localhost:8080" -ForegroundColor Yellow
    Write-Host "   Please start it manually in WSL: linera net up --with-faucet --faucet-port 8080" -ForegroundColor Yellow
}

# Install dependencies if node_modules don't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📥 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start all Node.js services using concurrently
Write-Host "`n🎯 Starting Node.js services..." -ForegroundColor Yellow
Write-Host "   Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Use the existing npm script which uses concurrently
npm run dev

