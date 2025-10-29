# Configuration Check & Verification

## ✅ Current Configuration Status

Based on your `.env` file at the root directory, here's what's configured:

### Linera Configuration ✅
- **LINERA_RPC_URL**: `http://localhost:8080` (GraphQL endpoint)
- **LINERA_APP_ID**: `76a60e819936e7e475293b97d8ae9fd2f5b45b37332fb968fe5d1a3abd832a29` ✅

### AI Configuration ✅
- **GEMINI_API_KEY**: Configured ✅
- Using Gemini Pro model for sentiment analysis ✅

### Database Configuration ✅
- **DB_HOST**: `localhost`
- **DB_PORT**: `5432`
- **DB_NAME**: `lineratrade`
- **DB_USER**: `admin`
- **DB_PASSWORD**: `password`

### Redis Configuration ✅
- **REDIS_URL**: `redis://localhost:6379`

### API Configuration ✅
- **API_PORT**: `3001`
- **FRONTEND_URL**: `http://localhost:3000`

## ⚠️ Important Notes

### 1. Linera RPC URL

Your backend is currently configured to use:
- `LINERA_RPC_URL=http://localhost:8080`

**Important**: Make sure `linera net up --with-faucet --faucet-port 8080` is running!

The port `8080` is correct for the GraphQL endpoint when using the local network.

### 2. Application ID Usage

The Linera Application ID is used in:
- ✅ **Backend** (`linera-client.ts`): Reads from `process.env.LINERA_APP_ID`
- ✅ **Frontend** (`linera-client.ts`): Reads from `process.env.NEXT_PUBLIC_LINERA_APP_ID`

**Action Required**: Make sure your frontend `.env.local` has:
```
NEXT_PUBLIC_LINERA_APP_ID=76a60e819936e7e475293b97d8ae9fd2f5b45b37332fb968fe5d1a3abd832a29
```

### 3. Gemini API Key

✅ Already configured and will be used automatically. The code prioritizes:
1. `GEMINI_API_KEY` (first choice)
2. `OPENAI_API_KEY` (fallback)

Your setup is correct!

## 🔍 Verification Steps

### 1. Check Environment Variable Loading

The root `.env` file should be automatically loaded because:
- `backend/src/index.ts` uses `dotenv.config()` (loads root `.env`)
- `parser/src/ai-parser.ts` uses `dotenv.config()` (loads root `.env`)

### 2. Test Backend Connection

```bash
cd backend
npm install  # If not done
npm start
```

Check console for:
- ✅ "Database and Redis connected"
- ✅ "Backend API running on port 3001"
- ✅ No errors about missing `GEMINI_API_KEY`

### 3. Test Linera Connection

Make sure your Linera network is running:
```bash
# In WSL Terminal 1
linera net up --with-faucet --faucet-port 8080
```

Then test from backend or directly:
```bash
curl http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

### 4. Test Frontend Configuration

The frontend needs its own `.env.local` file:
```bash
cd frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_LINERA_APP_ID=76a60e819936e7e475293b97d8ae9fd2f5b45b37332fb968fe5d1a3abd832a29
NEXT_PUBLIC_LINERA_NETWORK=local
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
```

## 📋 Complete Configuration Checklist

- [x] Root `.env` file created with all variables
- [x] `LINERA_APP_ID` configured
- [x] `GEMINI_API_KEY` configured
- [x] Database credentials configured
- [x] Redis URL configured
- [ ] Frontend `.env.local` created (needs to be created)
- [ ] Linera network running (`linera net up`)
- [ ] Database running (PostgreSQL)
- [ ] Redis running

## 🚀 Quick Start Commands

### Terminal 1: Linera Network
```bash
cd /mnt/c/Users/aryan/Desktop/MCP
linera net up --with-faucet --faucet-port 8080
```

### Terminal 2: Backend
```bash
cd backend
npm install
npm start
```

### Terminal 3: Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Potential Issues & Fixes

### Issue: "Gemini API key is required"
**Fix**: Make sure `GEMINI_API_KEY` is in your root `.env` file

### Issue: "Cannot connect to Linera"
**Fix**: Ensure `linera net up` is running and accessible at `http://localhost:8080`

### Issue: "LINERA_APP_ID not found"
**Fix**: The backend reads from `process.env.LINERA_APP_ID`. Make sure it's in your root `.env`

### Issue: Frontend can't find application
**Fix**: Create `frontend/.env.local` with `NEXT_PUBLIC_LINERA_APP_ID`

## ✅ Your Configuration Looks Good!

Everything appears correctly configured. The main thing to verify is:
1. Frontend `.env.local` file exists with the Application ID
2. All services are running (Linera network, PostgreSQL, Redis)
3. No environment variable typos

You're ready to test!

