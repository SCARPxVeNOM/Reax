# Setting Up Local Wallet for Deployment

## Step 1: Start Local Linera Services

You need to run the storage server and Linera node first. Open **2 separate WSL terminals**:

**Terminal 1 - Storage Server:**
```bash
cd /mnt/c/Users/aryan/Desktop/MCP
linera-storage-server
# Keep this running - don't close it
```

**Terminal 2 - Linera Node:**
```bash
cd /mnt/c/Users/aryan/Desktop/MCP
linera node start
# Keep this running - don't close it
```

Wait 10-15 seconds for both services to fully initialize.

## Step 2: Initialize Wallet for Local Network

Open **Terminal 3** (a new WSL terminal):

```bash
cd /mnt/c/Users/aryan/Desktop/MCP

# Initialize wallet for LOCAL network using genesis
linera wallet init --genesis
```

This will:
- Create your local wallet
- Set environment variables (`LINERA_WALLET`, `LINERA_STORAGE`, `LINERA_KEYSTORE`)
- Save them to `~/.bashrc`

## Step 3: Verify Wallet Setup

```bash
# Sync with the local network
linera sync

# Check your chain balance (should show some tokens)
linera query-balance
```

You should see a number like `10` or similar.

## Step 4: Deploy Your Application

Now you can deploy your WASM application:

```bash
cd /mnt/c/Users/aryan/Desktop/MCP/linera-app

# Deploy using both contract and service WASM files
# Note: You have a single WASM file, so use it for both
linera publish-and-create \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    --json-argument "{}"
```

**IMPORTANT:** Save the Application ID that gets printed!

## Alternative: Testnet Setup

If you want to use the Testnet instead of local network:

```bash
# Initialize wallet for Testnet
linera wallet init --faucet https://faucet.testnet-conway.linera.net

# Request a new chain from the faucet
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net

# Then deploy
linera publish-and-create \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    --json-argument "{}"
```

## Troubleshooting

**Error: "Storage not found"**
- Make sure `linera-storage-server` is running (Terminal 1)

**Error: "Node not responding"**
- Make sure `linera node start` is running (Terminal 2)
- Wait a bit longer for services to initialize

**Error: "Cannot connect to storage"**
- Check that storage server is listening on the expected port
- Verify environment variables: `echo $LINERA_STORAGE`

## Quick Check Commands

```bash
# Check if storage is running
ps aux | grep linera-storage-server

# Check if node is running
ps aux | grep "linera node"

# Check environment variables
echo $LINERA_WALLET
echo $LINERA_STORAGE
echo $LINERA_KEYSTORE

# Check network status
linera sync
linera query-balance
```

## Summary

For **LOCAL development**:
1. Start storage server (Terminal 1)
2. Start Linera node (Terminal 2)
3. Initialize wallet with: `linera wallet init --genesis`
4. Deploy app with `publish-and-create`

For **TESTNET**:
1. Initialize wallet: `linera wallet init --faucet https://faucet.testnet-conway.linera.net`
2. Request chain: `linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net`
3. Deploy app

