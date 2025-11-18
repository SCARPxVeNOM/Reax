# Simple Startup Script for Windows PowerShell
# Just run: .\start.ps1

Write-Host "🚀 Starting LineraTrade AI..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker
Write-Host "📦 Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Start Docker services
Write-Host "🐳 Starting database services..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml down 2>$null
# Remove network if it exists and recreate it
docker network rm lineratrade-network 2>$null
Start-Sleep -Seconds 2
docker-compose -f docker-compose.yml up -d postgres redis 2>$null

# Step 2.5: Start Linera (required for blockchain features)
Write-Host "🔗 Starting Linera network..." -ForegroundColor Yellow
Write-Host "   Pulling Linera image (this may take a few minutes on first run)..." -ForegroundColor Gray
docker-compose -f docker-compose.yml pull linera-node 2>$null | Out-Null

try {
    docker-compose -f docker-compose.yml up -d linera-node
    Write-Host "⏳ Waiting for Linera to initialize (this may take 30-60 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check if Linera is responding
    $lineraReady = $false
    for ($i = 1; $i -le 15; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Linera network is ready!" -ForegroundColor Green
                $lineraReady = $true
                break
            }
        } catch {
            if ($i -eq 15) {
                Write-Host "⚠️  Linera is taking longer than expected to start" -ForegroundColor Yellow
                Write-Host "   Checking container status..." -ForegroundColor Gray
                docker ps --filter "name=linera" --format "{{.Status}}" 2>$null
                Write-Host "   View logs with: docker logs lineratrade-linera" -ForegroundColor Gray
                Write-Host "   Linera will continue starting in the background" -ForegroundColor Gray
            } else {
                Write-Host "   Waiting for Linera... ($i/15)" -ForegroundColor Gray
                Start-Sleep -Seconds 5
            }
        }
    }
    
    if (-not $lineraReady) {
        Write-Host ""
        Write-Host "🔍 Troubleshooting Linera startup..." -ForegroundColor Yellow
        Write-Host "   Container status:" -ForegroundColor Gray
        docker ps -a --filter "name=linera" --format "table {{.Names}}\t{{.Status}}" 2>$null
        Write-Host ""
        Write-Host "   Recent logs:" -ForegroundColor Gray
        docker logs lineratrade-linera --tail 10 2>$null | Select-Object -First 5
        Write-Host ""
        Write-Host "   Try manually: docker-compose -f docker-compose.yml restart linera-node" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to start Linera container" -ForegroundColor Red
    Write-Host "   This is usually due to Docker image registry access issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 SOLUTION: Run Linera locally instead" -ForegroundColor Cyan
    Write-Host "   1. Install Linera CLI: cargo install linera-service" -ForegroundColor Gray
    Write-Host "   2. In a separate terminal, run: .\start-linera-local.ps1" -ForegroundColor Gray
    Write-Host "   3. Or use the buildathon setup: docker compose up --force-recreate" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   The system will continue without Docker Linera" -ForegroundColor Yellow
    Write-Host "   (Linera features will be disabled until you start it locally)" -ForegroundColor Gray
}

Start-Sleep -Seconds 3
Write-Host "✅ Database services ready" -ForegroundColor Green
Write-Host ""

# Step 3: Install if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Installing dependencies (first time only)..." -ForegroundColor Yellow
    npm install --silent
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Step 4: Check .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found" -ForegroundColor Yellow
    Write-Host "   Create .env file with GEMINI_API_KEY and TWITTER_BEARER_TOKEN" -ForegroundColor Yellow
    Write-Host ""
}

# Step 5: Start services
Write-Host "🎯 Starting services..." -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run dev
