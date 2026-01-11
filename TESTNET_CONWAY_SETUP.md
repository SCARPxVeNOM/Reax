# 🌐 Testnet Conway Configuration Guide

**Network**: Testnet Conway  
**SDK Version**: 0.15.7  
**Status**: ✅ Configured  
**Date**: December 16, 2024

---

## ✅ Configuration Complete

Your LineraTrade AI platform is now configured to use **Testnet Conway**!

---

## 🌐 Testnet Conway Details

### Network Information

- **Network Name**: Testnet Conway
- **Faucet URL**: `https://faucet.testnet-conway.linera.net/`
- **Required SDK**: Linera 0.15.7
- **Status**: Active

### What is Testnet Conway?

Testnet Conway is the latest Linera testnet environment that provides:
- Latest Linera protocol features
- Stable testing environment
- Free test tokens via faucet
- GraphQL API access
- Full microchain functionality

---

## 📦 Updated Files

### Environment Files

1. **`.env.example`**
   ```env
   LINERA_NETWORK=testnet-conway
   LINERA_FAUCET_URL=https://faucet.testnet-conway.linera.net/
   ```

2. **`backend/.env.local`**
   ```env
   LINERA_NETWORK=testnet-conway
   LINERA_FAUCET_URL=https://faucet.testnet-conway.linera.net/
   LINERA_SERVICE_URL=http://localhost:8081
   ```

3. **`backend/.env.example`**
   ```env
   LINERA_NETWORK=testnet-conway
   LINERA_FAUCET_URL=https://faucet.testnet-conway.linera.net/
   ```

4. **`frontend/.env.local`**
   ```env
   NEXT_PUBLIC_LINERA_NETWORK=testnet-conway
   NEXT_PUBLIC_LINERA_FAUCET_URL=https://faucet.testnet-conway.linera.net/
   ```

### Startup Scripts

5. **`run.bash`** (Linux/macOS)
   - Added Testnet Conway configuration
   - Network banner updated
   - Environment variables configured

6. **`start-platform.ps1`** (Windows)
   - Added Testnet Conway configuration
   - Network banner updated
   - Environment variables configured

---

## 🚀 How to Use

### Option 1: Docker (Recommended)

```bash
# Pull latest changes
git pull origin main

# Rebuild with Testnet Conway configuration
docker compose down -v
docker compose build --no-cache
docker compose up -d

# Watch logs
docker compose logs -f lineratrade
```

### Option 2: Manual Setup (Linux/macOS)

```bash
# Pull latest changes
git pull origin main

# Ensure Linera 0.15.7 is installed
linera --version  # Should show 0.15.7

# Start platform
chmod +x run.bash
./run.bash
```

### Option 3: Windows PowerShell

```powershell
# Pull latest changes
git pull origin main

# Ensure Linera 0.15.7 is installed
linera --version  # Should show 0.15.7

# Start platform
.\start-platform.ps1
```

---

## 🧪 Testing Testnet Conway Connection

### 1. Verify SDK Version

```bash
linera --version
# Expected output: linera 0.15.7
```

### 2. Test Faucet Connection

```bash
# Initialize wallet with Testnet Conway faucet
linera wallet init --faucet https://faucet.testnet-conway.linera.net/

# Request a chain
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net/

# Check balance
linera query-balance
```

### 3. Deploy to Testnet

```bash
# Navigate to Linera app
cd linera-app

# Build for WASM
cargo build --release --target wasm32-unknown-unknown

# Deploy to Testnet Conway
linera --wait-for-outgoing-messages project publish-and-create . trade-ai

# Note the Application ID
```

### 4. Update Frontend Configuration

After deploying to testnet, update `frontend/.env.local`:

```env
NEXT_PUBLIC_LINERA_APP_ID=<your-testnet-app-id>
NEXT_PUBLIC_LINERA_CHAIN_ID=<your-testnet-chain-id>
NEXT_PUBLIC_LINERA_SERVICE_URL=http://localhost:8081
NEXT_PUBLIC_LINERA_NETWORK=testnet-conway
NEXT_PUBLIC_LINERA_FAUCET_URL=https://faucet.testnet-conway.linera.net/
```

---

## 🔄 Local vs Testnet

### Local Development (Default)

The startup scripts (`run.bash`, `start-platform.ps1`) start a **local Linera network** for development:
- Fast iteration
- No external dependencies
- Full control
- Instant deployment

**Configuration:**
```env
LINERA_NETWORK=testnet-conway  # Network identifier
LINERA_FAUCET_URL=https://faucet.testnet-conway.linera.net/  # For reference
# But uses local faucet: http://localhost:8080
```

### Testnet Conway Deployment

To deploy to the actual Testnet Conway:

```bash
# Initialize wallet with testnet faucet
linera wallet init --faucet https://faucet.testnet-conway.linera.net/

# Request chain from testnet
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net/

# Deploy application
cd linera-app
linera --wait-for-outgoing-messages project publish-and-create . trade-ai
```

---

## 📊 Environment Variables Reference

### Backend Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `LINERA_NETWORK` | `testnet-conway` | Network identifier |
| `LINERA_FAUCET_URL` | `https://faucet.testnet-conway.linera.net/` | Testnet faucet |
| `LINERA_SERVICE_URL` | `http://localhost:8081` | Local GraphQL service |
| `LINERA_APP_ID` | `<your-app-id>` | Deployed application ID |
| `LINERA_CHAIN_ID` | `<your-chain-id>` | Your chain ID |

### Frontend Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_LINERA_NETWORK` | `testnet-conway` | Network identifier |
| `NEXT_PUBLIC_LINERA_FAUCET_URL` | `https://faucet.testnet-conway.linera.net/` | Testnet faucet |
| `NEXT_PUBLIC_LINERA_SERVICE_URL` | `http://localhost:8081` | GraphQL endpoint |
| `NEXT_PUBLIC_LINERA_APP_ID` | `<your-app-id>` | Application ID |
| `NEXT_PUBLIC_LINERA_CHAIN_ID` | `<your-chain-id>` | Chain ID |

---

## 🎯 Development Workflow

### 1. Local Development

```bash
# Start local network
./run.bash

# Develop and test locally
# Fast iteration, no external dependencies
```

### 2. Testnet Deployment

```bash
# Deploy to Testnet Conway
linera wallet init --faucet https://faucet.testnet-conway.linera.net/
cd linera-app
linera --wait-for-outgoing-messages project publish-and-create . trade-ai

# Update frontend/.env.local with testnet IDs
# Test on testnet
```

### 3. Production

```bash
# Deploy to mainnet (when available)
# Update configuration for mainnet
```

---

## 🔍 Verification Checklist

After configuration, verify:

- [ ] Linera SDK version is 0.15.7
- [ ] Environment files updated with Testnet Conway URLs
- [ ] Startup scripts show "Network: Testnet Conway"
- [ ] Can connect to testnet faucet
- [ ] Can deploy to testnet
- [ ] Frontend shows correct network
- [ ] All services start successfully

---

## 🐛 Troubleshooting

### Issue: Cannot connect to testnet faucet

**Solution:**
```bash
# Check internet connection
curl https://faucet.testnet-conway.linera.net/

# Verify SDK version
linera --version  # Must be 0.15.7

# Try with explicit faucet URL
linera wallet init --faucet https://faucet.testnet-conway.linera.net/
```

### Issue: Wrong SDK version

**Solution:**
```bash
# Uninstall old version
cargo uninstall linera-service linera-storage-service

# Install 0.15.7
cargo install --locked linera-service@0.15.7
cargo install --locked linera-storage-service@0.15.7

# Verify
linera --version
```

### Issue: Deployment fails

**Solution:**
```bash
# Ensure you have tokens
linera query-balance

# Request more tokens if needed
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net/

# Rebuild application
cd linera-app
cargo clean
cargo build --release --target wasm32-unknown-unknown

# Try deployment again
linera --wait-for-outgoing-messages project publish-and-create . trade-ai
```

---

## 📚 Additional Resources

### Linera Documentation
- **Main Docs**: https://linera.dev
- **Testnet Guide**: https://linera.dev/testnet
- **SDK Docs**: https://docs.rs/linera-sdk/0.15.7

### Testnet Conway
- **Faucet**: https://faucet.testnet-conway.linera.net/
- **Status**: Check Linera Discord for testnet status
- **Support**: https://discord.gg/linera

---

## ✅ Summary

Your platform is now configured for **Testnet Conway**:

- ✅ SDK Version: 0.15.7
- ✅ Network: Testnet Conway
- ✅ Faucet: https://faucet.testnet-conway.linera.net/
- ✅ Environment files updated
- ✅ Startup scripts updated
- ✅ Ready for local development
- ✅ Ready for testnet deployment

---

## 🚀 Next Steps

1. **Start Local Development**
   ```bash
   ./run.bash
   # or
   docker compose up -d --build
   ```

2. **Test Locally**
   - Visit http://localhost:3000
   - Create and deploy strategies
   - Test all features

3. **Deploy to Testnet**
   ```bash
   linera wallet init --faucet https://faucet.testnet-conway.linera.net/
   cd linera-app
   linera --wait-for-outgoing-messages project publish-and-create . trade-ai
   ```

4. **Update Frontend**
   - Update `frontend/.env.local` with testnet IDs
   - Restart frontend
   - Test on testnet

---

**Status**: ✅ Testnet Conway Configuration Complete  
**Network**: Testnet Conway  
**SDK**: 0.15.7  
**Date**: December 16, 2024

**🎉 Ready for Testnet Conway! 🚀**
