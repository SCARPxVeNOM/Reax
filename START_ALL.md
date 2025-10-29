# 🚀 One Command to Start Everything

## Quick Start

### Windows (PowerShell)

```powershell
npm start
```

Or directly:
```powershell
.\start.ps1
```

### Linux/WSL

```bash
chmod +x start.sh
npm start
```

Or directly:
```bash
./start.sh
```

## What This Script Does

1. ✅ **Checks Docker** - Verifies Docker Desktop is running
2. ✅ **Starts PostgreSQL** - Database service
3. ✅ **Starts Redis** - Caching service  
4. ✅ **Verifies .env** - Checks configuration exists
5. ✅ **Checks Linera** - Verifies Linera network (or warns if not running)
6. ✅ **Installs Dependencies** - Runs `npm install` if needed
7. ✅ **Starts Backend** - Express API on port 3001
8. ✅ **Starts Frontend** - Next.js on port 3000
9. ✅ **Starts Relayer** - Trade execution service

## Prerequisites

Before running, make sure:

- [x] Docker Desktop is installed and running
- [x] `.env` file exists in root directory
- [x] Node.js 18+ is installed
- [x] (Optional) Linera network is running in WSL

## Starting Linera Network Separately

Since Linera runs in WSL, you need to start it separately:

**In WSL Terminal:**
```bash
cd /mnt/c/Users/aryan/Desktop/MCP
linera net up --with-faucet --faucet-port 8080
```

**OR** run this once, then the startup script will handle everything else.

## What Gets Started

| Service | Port | URL |
|---------|------|-----|
| **Frontend** | 3000 | http://localhost:3000 |
| **Backend API** | 3001 | http://localhost:3001 |
| **Linera GraphQL** | 8080 | http://localhost:8080 |
| **PostgreSQL** | 5432 | localhost:5432 |
| **Redis** | 6379 | localhost:6379 |

## Stopping All Services

Press `Ctrl+C` in the terminal where you ran `npm start`.

Then stop Docker services:
```bash
npm run docker:down
```

Or stop Linera network (in WSL):
```bash
# Find and kill the process
pkill -f "linera net up"
```

## Troubleshooting

### "Docker is not running"
- Start Docker Desktop
- Wait for it to fully start
- Try again

### "Linera network not accessible"
The script will warn you but continue. Start Linera manually:
```bash
# In WSL
cd /mnt/c/Users/aryan/Desktop/MCP
linera net up --with-faucet --faucet-port 8080
```

### "Port already in use"
Stop the conflicting service or change ports in:
- `backend/src/index.ts` - API_PORT
- `frontend/package.json` - dev script
- `.env` file

### Services won't connect
1. Wait 10-15 seconds after starting
2. Check Docker containers: `docker ps`
3. Check logs: `npm run docker:logs`

## Alternative: Manual Startup

If the script doesn't work, start manually:

**Terminal 1 - Docker:**
```bash
docker-compose up -d postgres redis
```

**Terminal 2 - WSL - Linera:**
```bash
cd /mnt/c/Users/aryan/Desktop/MCP
linera net up --with-faucet --faucet-port 8080
```

**Terminal 3 - Node Services:**
```bash
npm run dev
```

## Success Indicators

When everything is running, you should see:

✅ Docker containers running  
✅ "Backend API running on port 3001"  
✅ "Ready - started server on 0.0.0.0:3000"  
✅ "Relayer service started"  
✅ Access http://localhost:3000 in browser

## 🎉 You're All Set!

Once started, you can:
- Open http://localhost:3000 for the frontend
- Use http://localhost:3001/api/health to check backend
- Access http://localhost:8080 for Linera GraphQL IDE

Happy trading! 🚀

