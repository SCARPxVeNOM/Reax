# ================================================
# ReaX Linera Dockerfile
# ================================================
# Rust-based Linera microchain service
# ================================================

FROM rust:1.86-slim AS builder

SHELL ["/bin/bash", "-c"]

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    jq \
    curl \
    git \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Linera tools
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    cargo install --locked linera-service@0.15.7

# ================================================
# Runtime Stage
# ================================================
FROM debian:bookworm-slim

SHELL ["/bin/bash", "-c"]

# Install runtime dependencies + Rust for wasm compilation
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (needed for wasm builds)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Add wasm32 target
RUN rustup target add wasm32-unknown-unknown

# Copy Linera binary from builder
COPY --from=builder /usr/local/cargo/bin/linera /usr/local/bin/linera

WORKDIR /app

# Copy linera-app source
COPY linera-app/ ./linera-app/

# Copy entrypoint
COPY docker/linera-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create data directories
RUN mkdir -p /app/logs /root/.linera

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=5 \
    CMD curl -f http://localhost:8081 || exit 1

# Expose Linera GraphQL port
EXPOSE 8081

ENTRYPOINT ["/entrypoint.sh"]
