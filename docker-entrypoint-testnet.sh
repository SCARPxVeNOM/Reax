#!/usr/bin/env bash
# Docker Entrypoint - Start platform like start-all.sh, but inside Docker
# - Uses Testnet Conway faucet
# - Builds & deploys Linera app
# - Writes backend/frontend .env.local
# - Starts Linera service + backend + frontend and keeps container alive

set -euo pipefail

TESTNET_FAUCET="${TESTNET_FAUCET:-https://faucet.testnet-conway.linera.net/}"
LINERA_SERVICE_PORT="${LINERA_SERVICE_PORT:-8081}"
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# DB/Redis service names from compose.yaml
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-lineratrade}"
DB_USER="${DB_USER:-admin}"
DB_PASSWORD="${DB_PASSWORD:-password}"
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"

echo "========================================="
echo "  LineraTrade AI (Docker) Startup"
echo "  Network: Testnet Conway"
echo "========================================="
echo ""

if ! command -v linera >/dev/null 2>&1; then
  echo "❌ linera CLI not found in container"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "❌ node not found in container"
  exit 1
fi

cd /build

echo "⏳ Waiting for Postgres and Redis..."
for i in {1..60}; do
  (echo > /dev/tcp/${DB_HOST}/${DB_PORT}) >/dev/null 2>&1 && break || true
  sleep 1
done
for i in {1..60}; do
  (echo > /dev/tcp/${REDIS_HOST}/${REDIS_PORT}) >/dev/null 2>&1 && break || true
  sleep 1
done
echo "✅ Infra reachable"
echo ""

echo "💼 Initializing Linera wallet (Testnet Conway faucet)..."
linera wallet init --faucet "${TESTNET_FAUCET}" || true

echo "⛓️  Ensuring we have a chain..."
CHAIN_OUTPUT="$(linera wallet request-chain --faucet "${TESTNET_FAUCET}" 2>/dev/null || true)"
CHAIN_ID="$(echo "${CHAIN_OUTPUT}" | grep -oE '[a-f0-9]{64}' | head -n 1 || true)"
if [ -z "${CHAIN_ID}" ]; then
  # Try reading from wallet show
  WALLET_OUTPUT="$(linera wallet show 2>/dev/null || true)"
  CHAIN_ID="$(echo "${WALLET_OUTPUT}" | grep -oE '[a-f0-9]{64}' | head -n 1 || true)"
fi
echo "✅ Chain ID: ${CHAIN_ID:-unknown}"
echo ""

echo "📦 Building Linera app (wasm32)..."
cd linera-app
cargo build --release --target wasm32-unknown-unknown

echo "🚀 Publishing & creating Trade AI application (this can take 5–15 minutes on first run)..."
APP_OUTPUT="$(linera --wait-for-outgoing-messages project publish-and-create . trade-ai)"
APP_ID="$(echo "${APP_OUTPUT}" | grep -oE '[a-f0-9]{64}' | head -n 1 || true)"
cd /build

if [ -z "${APP_ID}" ]; then
  echo "❌ Failed to determine LINERA_APP_ID from deployment output"
  echo "${APP_OUTPUT}"
  exit 1
fi

echo "✅ LINERA_APP_ID: ${APP_ID}"
echo ""

echo "⚙️  Writing backend/.env.local and frontend/.env.local ..."
cat > backend/.env.local <<EOF
PORT=${BACKEND_PORT}
FRONTEND_URL=http://localhost:${FRONTEND_PORT}

DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}

SOLANA_RPC_URL=${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}

JUPITER_API_URL=https://quote-api.jup.ag/v6
JUPITER_API_KEY=${JUPITER_API_KEY:-bcdb9c6b-a590-4fad-b4d4-06990836d9f0}

RAYDIUM_API_URL=https://transaction-v1.raydium.io
RAYDIUM_PRIORITY_FEE_URL=https://api-v3.raydium.io/main/auto-fee

LINERA_NETWORK=testnet-conway
LINERA_FAUCET_URL=${TESTNET_FAUCET}
LINERA_SERVICE_URL=http://localhost:${LINERA_SERVICE_PORT}
LINERA_RPC_URL=http://localhost:${LINERA_SERVICE_PORT}
LINERA_APP_ID=${APP_ID}
LINERA_CHAIN_ID=${CHAIN_ID}
EOF

cat > frontend/.env.local <<EOF
NEXT_PUBLIC_LINERA_APP_ID=${APP_ID}
NEXT_PUBLIC_LINERA_CHAIN_ID=${CHAIN_ID}
NEXT_PUBLIC_LINERA_SERVICE_URL=http://localhost:${LINERA_SERVICE_PORT}
NEXT_PUBLIC_LINERA_NETWORK=testnet-conway
NEXT_PUBLIC_LINERA_FAUCET_URL=${TESTNET_FAUCET}
NEXT_PUBLIC_API_URL=http://localhost:${BACKEND_PORT}
NEXT_PUBLIC_WS_URL=http://localhost:${BACKEND_PORT}
EOF

echo "✅ Env files written"
echo ""

echo "🌐 Starting Linera service on :${LINERA_SERVICE_PORT} ..."
linera service --port "${LINERA_SERVICE_PORT}" > /build/linera-service.log 2>&1 &
LINERA_PID=$!
sleep 2

echo "🚀 Starting backend on :${BACKEND_PORT} ..."
cd /build/backend
npm run dev > /build/backend.log 2>&1 &
BACKEND_PID=$!
cd /build
sleep 2

echo "🚀 Starting frontend on :${FRONTEND_PORT} ..."
cd /build/frontend
# next dev defaults to 3000; keep explicit for clarity
PORT="${FRONTEND_PORT}" npm run dev > /build/frontend.log 2>&1 &
FRONTEND_PID=$!
cd /build

echo ""
echo "✅ Platform running (Docker)"
echo "   Frontend: http://localhost:${FRONTEND_PORT}"
echo "   Backend:  http://localhost:${BACKEND_PORT}/health"
echo "   Linera:   http://localhost:${LINERA_SERVICE_PORT}"
echo ""

# Keep container alive while any service is alive
wait -n "${LINERA_PID}" "${BACKEND_PID}" "${FRONTEND_PID}"



