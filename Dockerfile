FROM rust:1.86-slim

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

# Install Node.js and pnpm
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# Set working directory
WORKDIR /build

# Copy project files
COPY . .

# Make scripts executable
RUN chmod +x /build/run.bash /build/start-all.sh /build/docker-entrypoint-testnet.sh

# Install JS dependencies (so container can run without bind-mounting host node_modules)
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Expose ports
EXPOSE 3000 3001 8080 8081

# Run the platform (Testnet Conway flow, like start-all.sh)
ENTRYPOINT ["bash", "/build/docker-entrypoint-testnet.sh"]
