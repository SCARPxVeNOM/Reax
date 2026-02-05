# syntax=docker/dockerfile:1.4
# ================================================
# ReaX Dockerfile
# ================================================
# Multi-stage build for production-ready container
# Includes: Linera CLI, Node.js, Frontend, Backend
# Uses BuildKit cache mounts for faster rebuilds
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

# Install Linera tools with cached dependencies (BuildKit)
# Cache mounts preserve compiled crates between builds
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/root/.cargo/registry \
    cargo install --locked linera-service@0.15.7

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

# Copy Linera binary from builder (linera CLI includes the 'service' subcommand)
COPY --from=builder /usr/local/cargo/bin/linera /usr/local/bin/linera

# Set working directory
WORKDIR /build

# Copy package files first (better caching)
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies (including devDependencies for tailwind/postcss)
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy project files
COPY . .

# Ensure CSS tools are available and rebuild styles
RUN cd frontend && npm run build || echo "Build warning - will use dev mode"

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
