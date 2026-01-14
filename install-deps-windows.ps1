# Install dependencies in Windows PowerShell
# This script ensures React and other dependencies are installed correctly for Windows

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Installing Dependencies (Windows)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "node_modules") {
    Write-Host "   Removing existing node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
}
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend dependency installation failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Set-Location ..

Write-Host ""

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
if (Test-Path "node_modules") {
    Write-Host "   Removing existing node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
}
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Verify React version
Write-Host "   Verifying React installation..." -ForegroundColor Gray
$reactVersion = npm list react --depth=0 2>$null | Select-String "react@" | ForEach-Object { $_ -replace ".*react@", "" -replace " .*", "" }
if ($reactVersion) {
    Write-Host "   React version: $reactVersion" -ForegroundColor Green
    if ([version]$reactVersion -lt [version]"18.2.0") {
        Write-Host "⚠️  Warning: React version is below 18.2.0" -ForegroundColor Yellow
        Write-Host "   Updating React..." -ForegroundColor Yellow
        npm install react@^18.3.1 react-dom@^18.3.1 --legacy-peer-deps
    }
} else {
    Write-Host "   Installing React..." -ForegroundColor Yellow
    npm install react@^18.3.1 react-dom@^18.3.1 --legacy-peer-deps
}

Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  ✅ Dependencies Installed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1) Run backend:  cd backend  && npm run dev" -ForegroundColor White
Write-Host "  2) Run frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""

