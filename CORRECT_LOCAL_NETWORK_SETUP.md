# Correct Local Network Setup (SDK 0.15.3)

Based on the official Linera documentation, here's the correct way to set up a local network:

## Step 1: Start Local Network (Single Command!)

Open **ONE WSL terminal**:

```bash
cd /mnt/c/Users/aryan/Desktop/MCP

# Start local network with faucet (this starts everything automatically)
linera net up --with-faucet --faucet-port 8080
```

This single command will:
- Start the storage service
- Start the validator
- Start the faucet service on port 8080
- Set up everything needed for local development

**Keep this terminal running!**

## Step 2: Initialize Wallet (in NEW terminal)

Open **a NEW WSL terminal**:

```bash
cd /mnt/c/Users/aryan/Desktop/MCP

# Initialize wallet using the local faucet
linera wallet init --faucet http://localhost:8080

# Request a new chain from the local faucet
linera wallet request-chain --faucet http://localhost:8080
```

This will:
- Create your developer wallet
- Request a new microchain with tokens
- Set environment variables automatically

## Step 3: Verify Setup

```bash
# Sync with the network
linera sync

# Check your balance (should show tokens, e.g., 10)
linera query-balance
```

You should see a balance number.

## Step 4: Deploy Your Application

Still in Terminal 2 (or a new terminal):

```bash
cd /mnt/c/Users/aryan/Desktop/MCP/linera-app

# Deploy your application
# Since InstantiationArgument is (), use null instead of {}
linera publish-and-create \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    --json-argument "null"
```

**IMPORTANT:** Save the Application ID that gets printed!

## What You Need

- **Terminal 1:** `linera net up --with-faucet --faucet-port 8080` (keep running)
- **Terminal 2:** Your wallet and deployment commands

## Accessing GraphQL IDE

Once the network is up, you can access the GraphiQL IDE at:
```
http://localhost:8080/
```

## Notes

- A local network wallet is valid only for the lifetime of that network
- When you restart `linera net up`, you'll need to recreate the wallet
- The network runs everything you need in one command
- No need to manually start `linera-storage-server` or `linera node` separately

## Troubleshooting

**"Port already in use"**
```bash
# Find what's using port 8080
netstat -tulpn | grep 8080

# Kill the process if needed
kill <pid>
```

**"Faucet not responding"**
- Make sure `linera net up` is still running in Terminal 1
- Wait a bit longer for services to fully initialize (30-60 seconds)

**"Wallet already exists"**
If you need to reset your wallet:
```bash
# Remove wallet files (they're network-specific)
rm ~/.local/share/linera/wallet.json
rm ~/.local/share/linera/keystore.json

# Or set custom directory
export LINERA_WALLET="$HOME/my_wallet.json"
export LINERA_KEYSTORE="$HOME/my_keystore.json"
export LINERA_STORAGE="rocksdb:$HOME/my_wallet.db"
```

## Stopping the Network

When you're done:
```bash
# In Terminal 1, press Ctrl+C to stop the network
```

## Summary - Quick Start

```bash
# Terminal 1
linera net up --with-faucet --faucet-port 8080

# Terminal 2 (wait for Terminal 1 to finish starting)
linera wallet init --faucet http://localhost:8080
linera wallet request-chain --faucet http://localhost:8080
linera sync
linera query-balance

# Then deploy
cd /mnt/c/Users/aryan/Desktop/MCP/linera-app
linera publish-and-create \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    --json-argument "{}"
```

That's it! Much simpler than the old method.

