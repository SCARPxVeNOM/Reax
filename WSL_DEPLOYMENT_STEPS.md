# Step-by-Step WSL Deployment Guide

## Step 1: Open WSL Terminal

Open a new WSL terminal (Ubuntu) and verify:

```bash
wsl
pwd
```

## Step 2: Install Rust and Tools

```bash
# Install Rust (press 1 when prompted)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Install required tools
sudo apt-get update
sudo apt-get install -y build-essential libclang-dev libssl-dev pkg-config protobuf-compiler

# Add WASM target
rustup target add wasm32-unknown-unknown
```

## Step 3: Install Linera CLI

```bash
# Install storage service
cargo install --locked linera-storage-service@0.12.1

# Install Linera service (this will take 10-15 minutes)
cargo install --locked linera-service@0.12.1

# Verify installation
linera --version
```

## Step 4: Navigate to Your Project in WSL

```bash
# Navigate to your Windows filesystem from WSL
cd /mnt/c/Users/aryan/Desktop/MCP/linera-app

# Verify you can see the files
ls -la
```

## Step 5: Build in WSL

```bash
# Clean previous build if any
cargo clean

# Build for WASM
cargo build --release --target wasm32-unknown-unknown

# Verify WASM file exists
ls -lh target/wasm32-unknown-unknown/release/*.wasm
```

## Step 6: Initialize Wallet

Open a NEW terminal for this step:

```bash
# Open new WSL terminal (keep the previous one open)
wsl

# Initialize wallet
cd /mnt/c/Users/aryan/Desktop/MCP/linera-app
linera wallet init

# Note the chain ID and key files created
# Store these securely!
```

## Step 7: Start Linera Services

You need 2 terminals for this:

**Terminal 1 - Storage Server:**
```bash
wsl
cd /mnt/c/Users/aryan/Desktop/MCP
linera-storage-server
# Leave this running
```

**Terminal 2 - Linera Node:**
```bash
wsl
cd /mnt/c/Users/aryan/Desktop/MCP
linera node start
# Leave this running
```

Wait 10-15 seconds for both to start.

## Step 8: Deploy Your Application

Open a 3rd terminal:

```bash
wsl
cd /mnt/c/Users/aryan/Desktop/MCP/linera-app

# Deploy (using the single WASM for both contract and service)
linera publish-and-create \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    --json-argument "{}"
```

**IMPORTANT: Copy the Application ID from the output!** It looks like:
```
Application ID: e476187f6b24adad8d9280126...
```

## Step 9: Save the Application ID

Create a `.env` file in the project root:

```bash
# In WSL terminal
cd /mnt/c/Users/aryan/Desktop/MCP

# Create .env file
cat > .env << EOF
LINERA_APP_ID=your-application-id-here
LINERA_NETWORK=local
EOF

# Add application ID to backend
echo 'LINERA_APP_ID=your-application-id-here' >> backend/.env

# Add to frontend
echo 'NEXT_PUBLIC_LINERA_APP_ID=your-application-id-here' >> frontend/.env.local
```

Replace `your-application-id-here` with the actual ID from Step 8.

## Step 10: Test Your Deployment

```bash
# Query your application
linera query application $LINERA_APP_ID

# Check system health
linera query systemHealth
```

## Step 11: Access Your Application

Your Linera GraphQL service will be at:
```
http://localhost:8080/graphql
```

Test it:
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

## Summary

You now have:
1. ✅ Linera CLI installed in WSL
2. ✅ WASM built and deployed
3. ✅ Application ID captured
4. ✅ Storage server running (Terminal 1)
5. ✅ Linera node running (Terminal 2)
6. ✅ Environment variables configured

## Next Steps

1. **Start Backend** (from PowerShell or WSL):
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Start Frontend** (from PowerShell or WSL):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access your app**: http://localhost:3000

## Stopping Services

When done testing, stop the services:

```bash
# In Terminal 1 (storage)
Ctrl+C

# In Terminal 2 (node)
Ctrl+C

# Or kill all
pkill -f linera
```

## Troubleshooting

**"linera: command not found"**
```bash
export PATH="$HOME/.cargo/bin:$PATH"
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
```

**Build errors?**
```bash
# Clean and rebuild
cd /mnt/c/Users/aryan/Desktop/MCP/linera-app
cargo clean
cargo build --release --target wasm32-unknown-unknown
```

**Port already in use?**
```bash
# Find and kill process
netstat -tulpn | grep 8080
kill <pid>
```

**Permission issues with Windows files?**
```bash
# Build in WSL native filesystem
cp -r /mnt/c/Users/aryan/Desktop/MCP ~/MCP
cd ~/MCP/linera-app
cargo build --release --target wasm32-unknown-unknown
# Then deploy from there
```

Ready to start? Run Step 1 in a fresh WSL terminal!
