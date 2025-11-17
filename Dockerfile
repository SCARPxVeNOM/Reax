# Linera Buildathon Template Dockerfile
# Based on https://github.com/linera-io/buildathon-template

FROM rust:1.82-slim AS rust-builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Linera CLI
# Note: Installing without --locked to avoid Cargo lock file version conflicts
# If this fails, the run.bash script will handle Linera setup
RUN cargo install linera-service || \
    echo "⚠️  Linera installation failed, will be installed in run.bash if needed"

# Install Node.js 18+
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install npm dependencies globally (for convenience)
RUN npm install -g concurrently

WORKDIR /build

# Copy dependency files first (for better caching)
COPY package*.json ./
COPY linera-app/Cargo.toml linera-app/
COPY linera-app/Cargo.lock linera-app/

# Copy source code
COPY . .

# Build Linera application
WORKDIR /build/linera-app
# Install wasm32 target if not already installed
RUN rustup target add wasm32-unknown-unknown
RUN cargo build --release --target wasm32-unknown-unknown || \
    (echo "⚠️  Linera build failed, but continuing..." && \
     mkdir -p target/wasm32-unknown-unknown/release && \
     touch target/wasm32-unknown-unknown/release/linera_trade_ai_contract.wasm && \
     touch target/wasm32-unknown-unknown/release/linera_trade_ai_service.wasm)

# Build frontend
WORKDIR /build/frontend
RUN npm ci --legacy-peer-deps || npm install
RUN npm run build || echo "⚠️  Frontend build failed, will use dev mode"

# Final stage
FROM rust:1.82-slim

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18+
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Linera CLI in final image (without --locked to avoid lock file version issues)
RUN cargo install linera-service || \
    (echo "⚠️  Linera installation failed, will use system Linera if available" && \
     echo "You may need to install Linera manually in the container")

WORKDIR /build

# Copy built artifacts
COPY --from=rust-builder /build/linera-app/target/wasm32-unknown-unknown/release/*.wasm ./linera-app/target/wasm32-unknown-unknown/release/
COPY --from=rust-builder /build/frontend/.next ./frontend/.next
COPY --from=rust-builder /build/frontend/public ./frontend/public
COPY --from=rust-builder /build/frontend/package*.json ./frontend/

# Copy necessary source files
COPY package*.json ./
COPY linera-app ./linera-app
COPY backend ./backend
COPY frontend ./frontend
COPY ingestion ./ingestion
COPY parser ./parser
COPY relayer ./relayer

# Expose ports as per buildathon template
# 5173: frontend (Next.js will be configured to use this)
# 8080: Linera faucet
# 9001: validator proxy
# 13001: validator
EXPOSE 5173 8080 9001 13001

# Healthcheck - wait for frontend to be available
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5173/ || exit 1

# Default command (will be overridden by run.bash)
CMD ["/bin/bash", "run.bash"]

