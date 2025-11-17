#!/bin/bash
# Start Linera locally (without Docker)
# Run this in a separate terminal if you want Linera running locally

echo "🔗 Starting Linera Network Locally..."
echo ""

# Check if Linera is installed
if ! command -v linera &> /dev/null; then
    echo "❌ Linera CLI not found"
    echo "   Install with: cargo install linera-service"
    exit 1
fi

echo "✅ Linera CLI found"
echo ""

# Trap Ctrl+C to clean up
cleanup() {
    echo ""
    echo "🛑 Stopping Linera..."
    kill $NETWORK_PID 2>/dev/null
    kill $SERVICE_PID 2>/dev/null
    wait $NETWORK_PID 2>/dev/null
    wait $SERVICE_PID 2>/dev/null
    echo "✅ Linera stopped"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start Linera network in background
echo "📡 Starting Linera network..."
linera net up --testing-prng-seed 37 &
NETWORK_PID=$!

# Wait for network to be ready (check for wallet files)
echo "⏳ Waiting for network to initialize..."
for i in {1..30}; do
    if find /tmp -name "wallet_0.json" -path "*/.tmp*/wallet_0.json" 2>/dev/null | head -1 | grep -q .; then
        WALLET_PATH=$(find /tmp -name "wallet_0.json" -path "*/.tmp*/wallet_0.json" 2>/dev/null | head -1)
        TEMP_DIR=$(dirname "$WALLET_PATH")
        echo "✅ Network initialized!"
        echo ""
        echo "📋 Environment variables:"
        echo "   export LINERA_WALLET=\"$TEMP_DIR/wallet_0.json\""
        echo "   export LINERA_KEYSTORE=\"$TEMP_DIR/keystore_0.json\""
        echo "   export LINERA_STORAGE=\"rocksdb:$TEMP_DIR/client_0.db\""
        echo ""
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Network taking longer than expected, continuing anyway..."
    else
        sleep 1
    fi
done

# Wait for validator to be fully ready (check if port 13001 is listening)
echo "⏳ Waiting for validator to be fully ready..."
for i in {1..20}; do
    if nc -z localhost 13001 2>/dev/null || timeout 1 bash -c "echo > /dev/tcp/localhost/13001" 2>/dev/null; then
        echo "✅ Validator is ready!"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "⚠️  Validator port check failed, but continuing anyway..."
    else
        sleep 1
    fi
done

# Additional wait for network to fully initialize
echo "⏳ Waiting for network to fully initialize..."
sleep 3

# Start Linera service with environment variables set
echo "🔗 Starting Linera service on port 8080..."
echo "   GraphiQL IDE will be available at: http://localhost:8080"
echo ""
echo "⚠️  Keep this terminal open!"
echo "   Press Ctrl+C to stop both network and service"
echo ""

# Export environment variables for the service
export LINERA_WALLET="$TEMP_DIR/wallet_0.json"
export LINERA_KEYSTORE="$TEMP_DIR/keystore_0.json"
export LINERA_STORAGE="rocksdb:$TEMP_DIR/client_0.db"

linera service --port 8080 &
SERVICE_PID=$!

# Wait a moment and check if service started
sleep 2
if ! kill -0 $SERVICE_PID 2>/dev/null; then
    echo "❌ Service failed to start"
    exit 1
fi

echo "✅ Linera service started (PID: $SERVICE_PID)"
echo ""
echo "📊 Service Status:"
echo "   Network: Running"
echo "   Service: Running on port 8080"
echo "   GraphiQL: http://localhost:8080"
echo ""
echo "💡 Note: Initial errors about 'Blobs not found' are normal"
echo "   The service will retry and connect once the network is fully ready"
echo ""

# Wait for both processes
wait $NETWORK_PID $SERVICE_PID

