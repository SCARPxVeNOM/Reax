# Linera Deployment Instructions

## Current Status
✅ WASM build successful: `linera_trade_ai.wasm` (331 KB)  
❌ Linera CLI installation failed on Windows (requires LLVM/Clang)

## Deployment Options

### Option 1: Use WSL (Recommended for Windows)

Since the Linera CLI requires native compilation with LLVM, the easiest path is to use Windows Subsystem for Linux (WSL):

```bash
# Install WSL if not already installed
wsl --install

# In WSL, install Linera CLI
curl https://sh.rustup.rs -sSf | sh
source "$HOME/.cargo/env"

# Install LLVM/Clang
sudo apt-get update
sudo apt-get install -y libclang-dev

# Install Linera CLI
cargo install --locked linera-storage-service@0.12.1
cargo install --locked linera-service@0.12.1

# Copy your WASM files to WSL
# From PowerShell: Copy-Item to WSL location

# Deploy in WSL
# Start local node (if not running)
linera --version  # Verify installation

# Deploy the application
cd linera-app
linera publish-and-create \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm
```

### Option 2: Use Docker

Use Docker to run Linera in a containerized environment:

```bash
# Pull Linera base image
docker pull linera-protocol/linera-base:latest

# Build your app in Docker
docker run --rm -v ${PWD}:/workspace -w /workspace \
    linera-protocol/linera-base:latest \
    cargo build --release --target wasm32-unknown-unknown

# Deploy from Docker
docker run --rm -it -v ${PWD}:/workspace -w /workspace \
    linera-protocol/linera-base:latest \
    linera publish-and-create \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm
```

### Option 3: Install LLVM on Windows

Install LLVM/Clang tools on Windows:

1. Install LLVM from: https://github.com/llvm/llvm-project/releases
2. Add LLVM to PATH: `C:\Program Files\LLVM\bin`
3. Set environment variable:
   ```powershell
   $env:LIBCLANG_PATH = "C:\Program Files\LLVM\bin"
   ```
4. Try installing again:
   ```bash
   cargo install --locked linera-service@0.12.1
   ```

## Deployment Steps (Once CLI is Available)

### 1. Start Local Linera Network

```bash
# Start storage service
linera-storage-server &

# Start Linera node (in another terminal)
linera node start &
```

### 2. Publish Your Application

```bash
cd linera-app

# Publish the WASM contract
linera publish-and-create \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    --instructions ""
```

This will output an application ID like:
```
Application ID: e476187f6b24adad8d9280126...
```

### 3. Set Application ID in Environment

```bash
export LINERA_APP_ID="your-application-id-here"
```

Or add to your `.env` file:
```
LINERA_APP_ID=your-application-id-here
```

### 4. Update Frontend Configuration

Update `frontend/src/lib/linera-client.ts` to use the deployed application ID.

## Testing Your Deployment

### Verify Application is Running

```bash
linera query systemHealth
```

### Test GraphQL Endpoint

The service will be available at:
```
http://localhost:8080/graphql
```

### Test from Frontend

Start your frontend:
```bash
cd frontend
npm run dev
```

The frontend should automatically connect to your local Linera network.

## Network Configuration

### Local Development

- Storage: `linera-storage-server` on port 8080
- Node: `linera node start` with default config
- GraphQL: Available at `http://localhost:8080/graphql`

### Testnet/Mainnet

For testnet deployment, you'll need to:
1. Get testnet credentials from Linera
2. Configure network endpoints
3. Use testnet validator addresses

## Troubleshooting

### "Module not found" errors
- Ensure LLVM/Clang is installed and in PATH
- On Windows, use WSL or Docker

### "linera not found"
- Install with: `cargo install --locked linera-service@0.12.1`
- Add `~/.cargo/bin` to PATH

### WASM build issues
- Ensure Rust toolchain 1.86.0 is installed
- Add wasm32 target: `rustup target add wasm32-unknown-unknown`

### Application not responding
- Check if storage server is running
- Verify node is synced
- Check GraphQL endpoint is accessible

## Next Steps

Once deployed:
1. Capture the application ID
2. Update backend configuration with the app ID
3. Update frontend Linera client configuration
4. Test signal submission and strategy creation
5. Set up relayer to process events from Linera

## Current Build Artifacts

```
Location: linera-app/target/wasm32-unknown-unknown/release/
File: linera_trade_ai.wasm (331 KB)
Status: Ready for deployment
```

The WASM file is ready - you just need the Linera CLI to deploy it. I recommend using WSL or Docker for the easiest deployment experience on Windows.

