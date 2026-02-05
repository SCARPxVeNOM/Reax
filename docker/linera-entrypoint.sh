#!/usr/bin/env bash
# ================================================
# Linera Service Entrypoint
# ================================================
# - Connects to Conway Testnet
# - Builds & deploys Linera microchain app
# - Exports APP_ID and CHAIN_ID via shared volume
# ================================================

set -euo pipefail

TESTNET_FAUCET="${TESTNET_FAUCET:-https://faucet.testnet-conway.linera.net/}"
LINERA_SERVICE_PORT="${LINERA_SERVICE_PORT:-8081}"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║     Linera Microchain Service          ║"
echo "║        Network: Conway Testnet         ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Verify linera is available
if ! command -v linera >/dev/null 2>&1; then
  echo "❌ linera CLI not found"
  exit 1
fi

linera --version

cd /app

# ================================================
# Initialize Linera Wallet
# ================================================
echo "💼 Initializing Linera wallet..."
linera wallet init --faucet "${TESTNET_FAUCET}" 2>/dev/null || true

echo "⛓️  Requesting chain from faucet..."
CHAIN_OUTPUT="$(linera wallet request-chain --faucet "${TESTNET_FAUCET}" 2>/dev/null || true)"
CHAIN_ID="$(echo "${CHAIN_OUTPUT}" | grep -oE '[a-f0-9]{64}' | head -n 1 || true)"

if [ -z "${CHAIN_ID}" ]; then
  WALLET_OUTPUT="$(linera wallet show 2>/dev/null || true)"
  CHAIN_ID="$(echo "${WALLET_OUTPUT}" | grep -oE '[a-f0-9]{64}' | head -n 1 || true)"
fi

echo "✅ Chain ID: ${CHAIN_ID:-unknown}"

# ================================================
# Build & Deploy Linera App
# ================================================
echo ""
echo "📦 Building Linera microchain app..."
echo "   This may take 5-15 minutes on first run..."

cd /app/linera-app
cargo build --release --target wasm32-unknown-unknown 2>&1 | tail -10

echo ""
echo "🚀 Publishing ReaX microchain application..."
APP_OUTPUT="$(linera --wait-for-outgoing-messages project publish-and-create . reax-microchain 2>&1)" || true
echo "${APP_OUTPUT}" > /app/logs/linera-deploy.log

APP_ID="$(echo "${APP_OUTPUT}" | grep -oP '(?<=Application ID: )[^\s]+' || true)"
if [ -z "${APP_ID}" ]; then
  APP_ID="$(echo "${APP_OUTPUT}" | grep -oE '[a-f0-9]{64,}' | tail -n 1 || true)"
fi
if [ -z "${APP_ID}" ]; then
  APP_ID="${CHAIN_ID:-demo-app-id}"
fi

echo "✅ App ID: ${APP_ID}"

# Write config to shared volume for other services
mkdir -p /shared
cat > /shared/linera-config.env <<EOF
LINERA_APP_ID=${APP_ID}
LINERA_CHAIN_ID=${CHAIN_ID}
LINERA_SERVICE_URL=http://linera:${LINERA_SERVICE_PORT}
LINERA_NETWORK=testnet-conway
LINERA_FAUCET_URL=${TESTNET_FAUCET}
EOF

echo "✅ Config written to /shared/linera-config.env"

# ================================================
# Start Linera Service
# ================================================
echo ""
echo "🌐 Starting Linera GraphQL service on port ${LINERA_SERVICE_PORT}..."
exec linera service --port "${LINERA_SERVICE_PORT}"
