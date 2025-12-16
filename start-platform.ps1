# LineraTrade AI - Windows PowerShell Startup Script
# Run this script to start the complete platform

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  LineraTrade AI Platform Startup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FAUCET_PORT = 8080
$LINERA_SERVICE_PORT = 8081
$BACKEND_PORT = 3001
$FRONTEND_PORT = 3000

# Check if Linera is installed
Write-Host "🔍 Checking Linera installation..." -ForegroundColor Yellow
$lineraInstalled = Get-Command linera -ErrorAction SilentlyContinue
if (-not $lineraInstalled) {
    Write-Host "❌ Linera is not installed. Please install Linera first." -ForegroundColor Red
    Write-Host "   Visit: https://linera.dev/getting_started/installation.html" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Linera is installed" -ForegroundColor Green
Write-Host ""

# Start Linera Network
Write-Host "🚀 Starting Linera network..." -ForegroundColor Yellow
$env:LINERA_TMP_DIR = "$env:TEMP\linera-$(Get-Random)"
New-Item -ItemType Directory -Force -Path $env:LINERA_TMP_DIR | Out-Null

Start-Process -FilePath "linera" -ArgumentList "net up --initial-amount 1000000000000 --with-faucet --faucet-port $FAUCET_PORT --faucet-amount 1000000000" -NoNewWindow
Start-Sleep -Seconds 10

Write-Host "✅ Linera network started" -ForegroundColor Green
Write-Host ""

# Initialize Wallet
Write-Host "💼 Initializing wallet..." -ForegroundColor Yellow
$env:LINERA_WALLET = "$env:LINERA_TMP_DIR\wallet.json"
$env:LINERA_KEYSTORE = "$env:LINERA_TMP_DIR\keystore.json"
$env:LINERA_STORAGE = "rocksdb:$env:LINERA_TMP_DIR\client.db"

linera wallet init --faucet "http://localhost:$FAUCET_PORT"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Wallet initialization failed" -ForegroundColor Red
    exit 1
}

# Open Default Chain
Write-Host "⛓️  Opening default chain..." -ForegroundColor Yellow
$chainOutput = linera wallet request-chain --faucet "http://localhost:$FAUCET_PORT"
$DEFAULT_CHAIN_ID = ($chainOutput -split "`n")[0]

Write-Host "✅ Default chain created: $DEFAULT_CHAIN_ID" -ForegroundColor Green
Write-Host ""

# Build Linera Application
Write-Host "📦 Building Trade AI application..." -ForegroundColor Yellow
Set-Location linera-app
cargo build --release --target wasm32-unknown-unknown
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

# Deploy Application
Write-Host "🚀 Deploying Trade AI application..." -ForegroundColor Yellow
$appOutput = linera --wait-for-outgoing-messages project publish-and-create . trade-ai
$TRADE_AI_APP_ID = ($appOutput -split "`n")[0]

Write-Host "✅ Trade AI application deployed: $TRADE_AI_APP_ID" -ForegroundColor Green
Write-Host ""

Set-Location ..

# Start Linera Service
Write-Host "🌐 Starting Linera GraphQL service..." -ForegroundColor Yellow
Start-Process -FilePath "linera" -ArgumentList "service --port $LINERA_SERVICE_PORT" -NoNewWindow
Start-Sleep -Seconds 5
Write-Host "✅ Linera service started on port $LINERA_SERVICE_PORT" -ForegroundColor Green
Write-Host ""

# Configure Backend
Write-Host "⚙️  Configuring backend..." -ForegroundColor Yellow
@"
LINERA_SERVICE_URL=http://localhost:$LINERA_SERVICE_PORT
LINERA_APP_ID=$TRADE_AI_APP_ID
LINERA_CHAIN_ID=$DEFAULT_CHAIN_ID
API_PORT=$BACKEND_PORT
FRONTEND_URL=http://localhost:$FRONTEND_PORT
"@ | Out-File -FilePath "backend\.env.local" -Encoding UTF8

Write-Host "✅ Backend configured" -ForegroundColor Green
Write-Host ""

# Configure Frontend
Write-Host "⚙️  Configuring frontend..." -ForegroundColor Yellow
@"
NEXT_PUBLIC_LINERA_APP_ID=$TRADE_AI_APP_ID
NEXT_PUBLIC_LINERA_CHAIN_ID=$DEFAULT_CHAIN_ID
NEXT_PUBLIC_LINERA_SERVICE_URL=http://localhost:$LINERA_SERVICE_PORT
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT
NEXT_PUBLIC_WS_URL=http://localhost:$BACKEND_PORT
"@ | Out-File -FilePath "frontend\.env.local" -Encoding UTF8

Write-Host "✅ Frontend configured" -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "🚀 Starting backend server..." -ForegroundColor Yellow
Set-Location backend
Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow
Start-Sleep -Seconds 5
Set-Location ..
Write-Host "✅ Backend server started on port $BACKEND_PORT" -ForegroundColor Green
Write-Host ""

# Start Frontend
Write-Host "🚀 Starting frontend server..." -ForegroundColor Yellow
Set-Location frontend
Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow
Start-Sleep -Seconds 10
Set-Location ..
Write-Host "✅ Frontend server started on port $FRONTEND_PORT" -ForegroundColor Green
Write-Host ""

# Platform Ready
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  ✅ LineraTrade AI Platform READY!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Access Points:" -ForegroundColor Yellow
Write-Host "   Frontend:  http://localhost:$FRONTEND_PORT" -ForegroundColor White
Write-Host "   Backend:   http://localhost:$BACKEND_PORT" -ForegroundColor White
Write-Host "   Linera:    http://localhost:$LINERA_SERVICE_PORT" -ForegroundColor White
Write-Host "   Faucet:    http://localhost:$FAUCET_PORT" -ForegroundColor White
Write-Host ""
Write-Host "📊 Configuration:" -ForegroundColor Yellow
Write-Host "   Chain ID:  $DEFAULT_CHAIN_ID" -ForegroundColor White
Write-Host "   App ID:    $TRADE_AI_APP_ID" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Available Pages:" -ForegroundColor Yellow
Write-Host "   Home:       http://localhost:$FRONTEND_PORT" -ForegroundColor White
Write-Host "   Trading:    http://localhost:$FRONTEND_PORT/trading" -ForegroundColor White
Write-Host "   Strategies: http://localhost:$FRONTEND_PORT/strategies" -ForegroundColor White
Write-Host "   Social:     http://localhost:$FRONTEND_PORT/social" -ForegroundColor White
Write-Host "   Microchains: http://localhost:$FRONTEND_PORT/microchains" -ForegroundColor White
Write-Host "   Analytics:  http://localhost:$FRONTEND_PORT/analytics" -ForegroundColor White
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

# Keep script running
while ($true) {
    Start-Sleep -Seconds 1
}
