# 🚀 How to Start Your LineraTrade AI Project

## Quick Start (Windows PowerShell)

### Method 1: Automated Script (Easiest)

```powershell
# In PowerShell, from project root:
.\start.ps1
```

This script will:
- ✅ Check Docker is running
- ✅ Start PostgreSQL and Redis
- ✅ Check/install dependencies
- ✅ Start all services

---

## Method 2: Manual Step-by-Step

### Step 1: Install Dependencies

```powershell
# Install root dependencies
npm install
```

### Step 2: Setup Environment Variables

Create a `.env` file in the project root:

```powershell
# Create .env file
New-Item -Path ".env" -ItemType File -Force
```

Add these minimum required variables:

```env
# AI Configuration (REQUIRED for tweet parsing)
GEMINI_API_KEY=your_gemini_api_key_here
# OR use OpenAI:
# OPENAI_API_KEY=your_openai_key_here

# Database (Docker handles these, but set for backend)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lineratrade
DB_USER=admin
DB_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379

# Linera Configuration
LINERA_RPC_URL=http://localhost:8080
LINERA_APP_ID=placeholder
NEXT_PUBLIC_LINERA_APP_ID=placeholder
NEXT_PUBLIC_LINERA_SERVICE_URL=http://localhost:8080

# Backend API
API_PORT=3001
FRONTEND_URL=http://localhost:3000

# Twitter (OPTIONAL - can skip for demo)
TWITTER_BEARER_TOKEN=
INFLUENCERS=elonmusk,VitalikButerin

# Solana (OPTIONAL - can skip for demo)
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_PRIVATE_KEY=

# Ingestion Service
POLL_INTERVAL=30000
BACKEND_URL=http://localhost:3001
```

**Minimum to get started**: Just set `GEMINI_API_KEY` and you can demo the UI!

### Step 3: Start Docker Services

```powershell
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify they're running
docker-compose ps
```

**Note**: You need Docker Desktop installed and running.

### Step 4: (Optional) Setup Linera Network

If you want full Linera integration:

```powershell
# In WSL or Linux terminal
cd linera-app
linera net up --with-faucet --faucet-port 8080

# In another terminal, build and deploy
cargo build --release
linera project publish-and-create

# Copy the application ID printed, update in .env
```

**For demo purposes**: You can skip this and the UI will still work!

### Step 5: Start All Services

**Option A: All at Once (Recommended)**

```powershell
npm run dev
```

This starts:
- Backend (http://localhost:3001)
- Frontend (http://localhost:3000)
- Relayer (optional)

**Option B: Individual Services**

Open separate PowerShell windows:

```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev

# Terminal 3: Relayer (optional)
cd relayer
npm run dev

# Terminal 4: Ingestion (optional, needs Twitter API)
cd ingestion
npm run dev
```

### Step 6: Open the Dashboard

Open your browser:
```
http://localhost:3000
```

---

## 🎯 Quick Demo Setup (Fastest)

If you just want to see the UI working:

```powershell
# 1. Install dependencies
npm install

# 2. Create minimal .env
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. Start frontend only
cd frontend
npm run dev
```

Open http://localhost:3000 and you'll see:
- ✅ Dashboard UI
- ✅ Strategy Builder
- ✅ All frontend components

---

## 🔍 Verify Everything is Running

### Check Services

```powershell
# Docker services
docker ps | findstr lineratrade

# Should show:
# lineratrade-postgres
# lineratrade-redis
```

### Check Ports

```powershell
# Check if ports are in use
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"
netstat -ano | findstr ":8080"
```

### Health Checks

```powershell
# Backend health
curl http://localhost:3001/health

# Frontend (open in browser)
Start-Process "http://localhost:3000"
```

---

## 🐛 Troubleshooting

### "Docker is not running"
- Start Docker Desktop
- Wait for it to fully start
- Run `docker ps` to verify

### "Port 3000 already in use"
```powershell
# Find process using port 3000
netstat -ano | findstr ":3000"
# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### "Cannot find module"
```powershell
# Install dependencies in all workspaces
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../relayer && npm install
cd ../parser && npm install
cd ../ingestion && npm install
```

### "Database connection failed"
```powershell
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### ".env file not found"
- Make sure `.env` is in the project root (same level as `package.json`)
- Check file is not `.env.txt` (should be just `.env`)

### "Linera network not accessible"
- For demo purposes, this is optional
- Frontend and backend will work without it
- To enable: run `linera net up` in WSL/Linux

---

## 📊 What Runs Where

| Service | Port | URL | Required |
|---------|------|-----|----------|
| Frontend | 3000 | http://localhost:3000 | ✅ Yes |
| Backend | 3001 | http://localhost:3001 | Optional |
| PostgreSQL | 5432 | localhost:5432 | Optional |
| Redis | 6379 | localhost:6379 | Optional |
| Linera | 8080 | http://localhost:8080 | Optional |

---

## ✅ Success Indicators

You'll know it's working when:

1. **Frontend**: 
   - Opens at http://localhost:3000
   - Shows dashboard UI
   - No console errors

2. **Backend**:
   - Shows "Backend API running on port 3001"
   - Health check returns: `{"status":"ok"}`

3. **Docker**:
   - `docker ps` shows postgres and redis containers
   - Status shows "healthy" or "Up"

---

## 🎬 Next Steps

Once running:

1. **Explore the UI**: Navigate through dashboard, strategy builder
2. **Test AI Parser**: Try parsing a tweet manually
3. **Create a Strategy**: Use form builder or code editor
4. **Check Backend Logs**: See API requests in terminal

---

## 📝 Notes

- **Minimum Setup**: Just frontend works for UI demo
- **Full Setup**: Requires Docker + API keys for full functionality
- **Linera**: Optional unless you want on-chain features
- **Twitter**: Optional - just for live tweet ingestion
- **Solana**: Optional - just for trade execution

You can demonstrate the project even with minimal setup! 🚀


