# Corrected WSL Deployment Steps - Using Linera 0.15.3

Based on the official Linera documentation, here are the correct installation steps.

## Why LLVM/Clang is needed

The Linera CLI tools (especially `linera-service`) compile RocksDB bindings which require:
- LLVM/Clang for C++ compilation
- Protocol Buffers compiler (protoc)
- Standard C++ development tools

This is why it failed on Windows but will work in WSL.

## Step 1: Open WSL and Install Prerequisites

```bash
wsl
cd /mnt/c/Users/aryan/Desktop/MCP

# Install ALL required packages at once
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    clang \
    libclang-dev \
    libssl-dev \
    pkg-config \
    g++ \
    curl \
    unzip
```

## Step 2: Install Protoc (Protocol Buffers)

```bash
# Download protoc
curl -LO https://github.com/protocolbuffers/protobuf/releases/download/v21.11/protoc-21.11-linux-x86_64.zip

# Extract to home directory
unzip protoc-21.11-linux-x86_64.zip -d $HOME/.local

# Add to PATH (add to ~/.bashrc for persistence)
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

# Verify
protoc --version
# Should show: libprotoc 21.11
```

## Step 3: Install Rust

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow prompts (press 1 for default installation)

# Source cargo
source "$HOME/.cargo/env"

# Install Rust 1.86.0 toolchain
rustup toolchain install 1.86.0
rustup default 1.86.0

# Install required components
rustup component add clippy rustfmt rust-src

# Add WASM target
rustup target add wasm32-unknown-unknown
```

## Step 4: Install Linera CLI (Version 0.15.3 - Testnet)

```bash
# Install storage service
cargo install --locked linera-storage-service@0.15.3

# Install Linera service (THIS IS THE ONE THAT NEEDS LLVM/Clang)
# This will take 10-20 minutes to compile
cargo install --locked linera-service@0.15.3

# Verify installation
linera --version
# Should show: linera 0.15.3
```

## Step 5: Update Your Project SDK Version

```bash
cd /mnt/c/Users/aryan/Desktop/MCP/linera-app

# Update Cargo.toml to use 0.15.3 (already done)
cat Cargo.toml

# Now update dependencies and build
cargo update
cargo clean
cargo build --release --target wasm32-unknown-unknown
```

**Note:** You may need to update your Rust code to match SDK 0.15.3. The API might have changed from 0.12.1.

## Step 6: Start Local Network

**Terminal 1 - Storage Service:**
```bash
wsl
cd /mnt/c/Users/aryan/Desktop/MCP
linera-storage-server &
# Note the PID
```

**Terminal 2 - Linera Node:**
```bash
wsl
cd /mnt/c/Users/aryan/Desktop/MCP
linera node start &
# Note the PID
```

Wait 15-20 seconds for services to initialize.

## Step 7: Initialize Wallet

**Terminal 3 - Operations:**
```bash
wsl
cd /mnt/c/Users/aryan/Desktop/MCP/linera-app

# Initialize wallet
linera wallet init

# You'll see something like:
# Wallet initialized successfully!
# Chain ID: xx...
# Environment variables set in: ~/.bashrc
```

## Step 8: Deploy Your Application

```bash
# Still in Terminal 3
cd /mnt/c/Users/aryan/Desktop/MCP/linera-app

# Deploy application
linera publish-and-create \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    target/wasm32-unknown-unknown/release/linera_trade_ai.wasm \
    --json-argument "{}"

# Save the Application ID that gets printed!
```

## Summary of What Each Component Does

### libclang-dev (LLVM Clang Development Libraries)
- **Purpose:** C/C++ compilation for native bindings
- **Needed by:** RocksDB bindings in linera-service
- **Why:** Linera uses RocksDB for storage, which has C++ dependencies

### protoc (Protocol Buffers Compiler)
- **Purpose:** Compile .proto files to code
- **Needed by:** gRPC communication
- **Why:** Linera uses gRPC-Web for validator communication

### build-essential, g++
- **Purpose:** C++ compilation tools
- **Needed by:** Building native Rust dependencies

### rustc, cargo
- **Purpose:** Rust compiler and package manager
- **Needed by:** Building everything

## Alternative: If Installation Takes Too Long

If `cargo install` is taking too long or failing, you can build from source:

```bash
# Clone Linera repository
git clone https://github.com/linera-io/linera-protocol.git
cd linera-protocol
git checkout -t origin/testnet_conway

# Build in debug mode (faster)
cargo build

# Add debug binaries to PATH
export PATH="$PWD/target/debug:$PATH"
echo 'export PATH="$PWD/target/debug:$PATH"' >> ~/.bashrc

# Verify
linera --version
```

## Quick Check: Do You Have Everything?

Run these commands to verify:

```bash
# Check Rust
rustc --version
# Should be: rustc 1.86.0

# Check Cargo
cargo --version

# Check Protoc
protoc --version
# Should be: libprotoc 21.11

# Check Clang
clang --version
# Should show a version number

# Check LLVM
llvm-config --version
# Should show a version

# Check Linera
linera --version
# Should be: linera 0.15.3
```

## Troubleshooting libclang Issues

If you get errors about missing libclang:

```bash
# Install specific LLVM version
sudo apt-get install -y llvm-15 llvm-15-dev

# Set environment variable
export LLVM_SYS_150_PREFIX=/usr/lib/llvm-15
echo 'export LLVM_SYS_150_PREFIX=/usr/lib/llvm-15' >> ~/.bashrc

# Or try without version restriction
export LIBCLANG_PATH=/usr/lib/llvm-15/lib
```

## What's Different from SDK 0.12.1 to 0.15.3?

- **Deprecated:** Some APIs may have changed
- **New:** Testnet support added
- **Updated:** GraphQL service API
- **Changed:** Some view types

If your code was written for 0.12.1, you may need to update it. The macros and trait implementations should mostly be compatible.

## Ready to Deploy?

Once all dependencies are installed:

1. ✅ LLVM/Clang (via libclang-dev)
2. ✅ Protoc
3. ✅ Rust 1.86.0
4. ✅ Linera CLI 0.15.3
5. ✅ WASM build complete
6. ⏳ Start network
7. ⏳ Deploy app
8. ⏳ Save application ID
9. ⏳ Configure environment
10. ⏳ Test!

Start with Step 1 and let me know if you encounter any issues!


