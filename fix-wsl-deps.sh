#!/bin/bash
# Fix esbuild platform mismatch for WSL
# Run this script in WSL terminal

echo "🔧 Fixing esbuild platform mismatch..."
echo ""

# Navigate to project directory
cd /mnt/c/users/aryan/desktop/MCP

# Remove node_modules (Windows binaries)
echo "📦 Removing Windows node_modules..."
rm -rf node_modules

# Remove package-lock.json to force fresh install
echo "🗑️  Removing package-lock.json..."
rm -f package-lock.json

# Remove workspace node_modules
echo "🧹 Cleaning workspace node_modules..."
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf ingestion/node_modules
rm -rf relayer/node_modules
rm -rf parser/node_modules

# Fix Docker network issue
echo "🐳 Fixing Docker network..."
docker network rm lineratrade-network 2>/dev/null || true

# Reinstall dependencies for Linux
echo "📥 Installing dependencies for Linux (WSL)..."
echo "   This may take a few minutes..."
npm install

echo ""
echo "✅ Done! Dependencies reinstalled for Linux."
echo ""
echo "Now you can run: ./start.sh"

