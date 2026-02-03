# ================================================
# ReaX Dockerfile
# ================================================
# Multi-stage build for production-ready container
# Includes: Linera CLI, Node.js, Frontend, Backend
# ================================================

FROM rust:1.86-slim AS builder

SHELL ["bash", "-c"]

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    jq \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Linera tools
RUN cargo install --locked linera-service@0.15.7 linera-storage-service@0.15.7

# ================================================
# Runtime Stage
# ================================================
FROM debian:bookworm-slim

SHELL ["bash", "-c"]

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Install Rust (needed for wasm compilation)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Add wasm32 target
RUN rustup target add wasm32-unknown-unknown

# Copy Linera binaries from builder
COPY --from=builder /usr/local/cargo/bin/linera /usr/local/bin/linera
COPY --from=builder /usr/local/cargo/bin/linera-service /usr/local/bin/linera-service
COPY --from=builder /usr/local/cargo/bin/linera-storage-service /usr/local/bin/linera-storage-service

# Set working directory
WORKDIR /build

# Copy package files first (better caching)
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install 2>/dev/null || true
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy project files
COPY . .

# Create logs directory
RUN mkdir -p /build/logs

# Make scripts executable
RUN chmod +x /build/docker-entrypoint-testnet.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
    CMD curl -f http://localhost:3000 || exit 1

# Expose ports
EXPOSE 3000 3001 8081

# Labels
LABEL org.opencontainers.image.title="ReaX"
LABEL org.opencontainers.image.description="Microchain Social Trading Platform"
LABEL org.opencontainers.image.vendor="ReaX"

# Run the platform
ENTRYPOINT ["bash", "/build/docker-entrypoint-testnet.sh"]
