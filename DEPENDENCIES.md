# 📦 LineraTrade AI - Dependencies Documentation

**Version**: 2.2.0  
**Last Updated**: December 16, 2024  
**Linera Network**: Testnet Conway

---

## 🔗 Linera SDK Dependencies

### Core Linera SDK

- **Package**: `linera-sdk`
- **Version**: `0.15.7` (matches Testnet Conway)
- **Purpose**: Core SDK for building Linera applications
- **Installation**:
  ```bash
  cargo install --locked linera-service@0.15.7
  cargo install --locked linera-storage-service@0.15.7
  ```
- **Features**: Contract development, state management, GraphQL services

### Linera Views

- **Package**: `linera-views`
- **Version**: `0.15.7`
- **Purpose**: State management and data structures for Linera applications
- **Usage**: Used in trade-ai package for state persistence

---

## 📊 GraphQL Dependencies

### Async GraphQL

- **Package**: `async-graphql`
- **Version**: `=7.0.17` (exact version required)
- **Purpose**: GraphQL server implementation for Linera services
- **Note**: Exact version (`=`) is required to avoid compatibility issues

### Related GraphQL Packages

- **Package**: `async-graphql-derive`
- **Version**: `=7.0.17`
- **Purpose**: Derive macros for GraphQL types

- **Package**: `async-graphql-value`
- **Version**: `=7.0.17`
- **Purpose**: GraphQL value types

- **Package**: `async-graphql-parser`
- **Version**: `=7.0.17`
- **Purpose**: GraphQL query parsing

---

## 🔄 Serialization Dependencies

### Serde

- **Package**: `serde`
- **Version**: `1.0`
- **Features**: `["derive"]`
- **Purpose**: Serialization/deserialization framework
- **Usage**: JSON and binary serialization across the platform

### Serde JSON

- **Package**: `serde_json`
- **Version**: `1.0`
- **Purpose**: JSON serialization/deserialization
- **Usage**: API responses, configuration files

### BCS (Binary Canonical Serialization)

- **Package**: `bcs`
- **Version**: `0.1`
- **Purpose**: Binary serialization for blockchain data
- **Usage**: Linera state serialization

---

## ⚡ Async Runtime Dependencies

### Tokio

- **Package**: `tokio`
- **Version**: `1.40`
- **Features**: `["rt", "sync"]` (workspace), `["full"]` (non-WASM targets)
- **Purpose**: Async runtime for Rust
- **Usage**: Backend services, async operations

### Async Trait

- **Package**: `async-trait`
- **Version**: `0.1`
- **Purpose**: Async trait support
- **Usage**: Async interfaces and traits

---

## 🛠️ Utility Dependencies

### Thiserror

- **Package**: `thiserror`
- **Version**: `1.0`
- **Purpose**: Error handling derive macros
- **Usage**: Custom error types across the platform

---

## 🧪 Testing Dependencies

### QuickCheck

- **Package**: `quickcheck`
- **Version**: `1.0`
- **Purpose**: Property-based testing
- **Usage**: ABI package tests

### QuickCheck Macros

- **Package**: `quickcheck_macros`
- **Version**: `1.0`
- **Purpose**: Derive macros for QuickCheck
- **Usage**: Test generation

---

## 🌐 Testnet Configuration

### Network Details

- **Network**: Testnet Conway
- **Faucet URL**: `https://faucet.testnet-conway.linera.net/`
- **GraphQL Endpoint Pattern**: `http://localhost:{PORT}/chains/{chainId}/applications/{appId}`

### Environment Variables

```env
# Linera Configuration
LINERA_SERVICE_URL=http://localhost:8081
LINERA_APP_ID=<your-app-id>
LINERA_CHAIN_ID=<your-chain-id>
LINERA_NETWORK=testnet-conway
LINERA_FAUCET_URL=https://faucet.testnet-conway.linera.net/
```

---

## 🎯 Frontend Dependencies

### Core Framework

- **Package**: `next`
- **Version**: `14.x`
- **Purpose**: React framework with App Router
- **Features**: Server components, routing, optimization

### React

- **Package**: `react`
- **Version**: `18.x`
- **Purpose**: UI library
- **Features**: Hooks, components, state management

### TypeScript

- **Package**: `typescript`
- **Version**: `5.x`
- **Purpose**: Type-safe JavaScript
- **Features**: Static typing, IntelliSense

### UI Libraries

- **Package**: `tailwindcss`
- **Version**: `3.x`
- **Purpose**: Utility-first CSS framework

- **Package**: `@monaco-editor/react`
- **Version**: Latest
- **Purpose**: Code editor (VS Code editor)
- **Usage**: PineScript editor

- **Package**: `reactflow`
- **Version**: Latest
- **Purpose**: Node-based UI
- **Usage**: Visual strategy builder

- **Package**: `recharts`
- **Version**: Latest
- **Purpose**: Charting library
- **Usage**: Analytics dashboard

### Real-Time Communication

- **Package**: `socket.io-client`
- **Version**: Latest
- **Purpose**: WebSocket client
- **Usage**: Real-time updates

---

## 🔧 Backend Dependencies

### Core Framework

- **Package**: `express`
- **Version**: `4.x`
- **Purpose**: Web framework
- **Features**: Routing, middleware, HTTP server

### TypeScript

- **Package**: `typescript`
- **Version**: `5.x`
- **Purpose**: Type-safe JavaScript

### Real-Time Communication

- **Package**: `socket.io`
- **Version**: Latest
- **Purpose**: WebSocket server
- **Usage**: Real-time notifications

### Database

- **Package**: `pg`
- **Version**: Latest
- **Purpose**: PostgreSQL client
- **Usage**: Database operations

### HTTP Client

- **Package**: `axios`
- **Version**: Latest
- **Purpose**: HTTP client
- **Usage**: DEX API calls

---

## 🐳 Docker Dependencies

### Base Image

- **Image**: `rust:1.86-slim`
- **Purpose**: Rust development environment
- **Includes**: Rust 1.86, Cargo

### System Dependencies

```dockerfile
pkg-config
protobuf-compiler
clang
make
jq
curl
git
nodejs (LTS)
pnpm
```

---

## 🔨 Build Tools

### Rust Toolchain

- **Version**: `1.86.0`
- **Profile**: `minimal`
- **Targets**: `["wasm32-unknown-unknown"]`
- **Components**: `["clippy", "rustfmt", "rust-src"]`

### Node.js

- **Version**: LTS (20.x)
- **Package Manager**: npm/pnpm
- **Purpose**: Frontend and backend builds

---

## 📋 Dependency Installation

### Rust Dependencies

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install Linera tools
cargo install --locked linera-service@0.15.7
cargo install --locked linera-storage-service@0.15.7
```

### Node.js Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install --legacy-peer-deps
```

### Docker Installation

```bash
# Build and start
docker compose up -d --build
```

---

## 🔄 Version Compatibility Matrix

| Component | Version | Compatible With |
|-----------|---------|-----------------|
| Linera SDK | 0.15.7 | Testnet Conway |
| Rust | 1.86.0 | Linera SDK 0.15.7 |
| async-graphql | 7.0.17 | Linera SDK 0.15.7 |
| tokio | 1.40 | Linera SDK 0.15.7 |
| Node.js | 20.x LTS | Next.js 14 |
| Next.js | 14.x | React 18 |
| React | 18.x | Next.js 14 |

---

## ⚠️ Important Notes

### Exact Version Requirements

Some dependencies require exact versions (`=` prefix):
- `async-graphql` and related packages must be exactly `7.0.17`
- Mismatched versions will cause compilation errors

### WASM Target

The Linera application compiles to WASM:
- Target: `wasm32-unknown-unknown`
- Optimization: `opt-level = 'z'` (size optimization)
- LTO: Enabled for smaller binaries

### Testnet Conway

The platform is configured for Testnet Conway:
- SDK version must match testnet version (0.15.7)
- Faucet URL is specific to Conway testnet
- GraphQL endpoints follow Conway testnet patterns

---

## 🔍 Dependency Verification

### Check Rust Dependencies

```bash
cd linera-app
cargo tree
```

### Check Node.js Dependencies

```bash
# Backend
cd backend
npm list

# Frontend
cd frontend
npm list
```

### Check Installed Linera Version

```bash
linera --version
# Should output: linera 0.15.7
```

---

## 📚 Additional Resources

### Linera Documentation
- **Main Docs**: https://linera.dev
- **SDK Docs**: https://docs.rs/linera-sdk/0.15.7
- **Testnet Info**: https://linera.dev/testnet

### Dependency Documentation
- **async-graphql**: https://async-graphql.github.io/async-graphql/
- **tokio**: https://tokio.rs/
- **serde**: https://serde.rs/
- **Next.js**: https://nextjs.org/docs
- **Express**: https://expressjs.com/

---

## 🔄 Updating Dependencies

### Update Linera SDK

```bash
# Update to new version
cargo install --locked linera-service@<new-version>
cargo install --locked linera-storage-service@<new-version>

# Update Cargo.toml
# Change version in linera-app/Cargo.toml
```

### Update Node.js Dependencies

```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### Update Docker Base Image

```dockerfile
# Update in Dockerfile
FROM rust:1.86-slim
```

---

## ✅ Dependency Checklist

Before deploying, verify:

- [ ] Linera SDK 0.15.7 installed
- [ ] Rust 1.86.0 with WASM target
- [ ] async-graphql exactly 7.0.17
- [ ] Node.js LTS installed
- [ ] All npm packages installed
- [ ] Docker and Docker Compose installed
- [ ] Environment variables configured
- [ ] Testnet Conway faucet accessible

---

**Status**: ✅ All dependencies documented and verified  
**Version**: 2.2.0  
**Linera SDK**: 0.15.7 (Testnet Conway)  
**Last Updated**: December 16, 2024
