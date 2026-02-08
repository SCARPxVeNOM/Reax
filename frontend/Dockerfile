# ================================================
# ReaX Frontend Dockerfile
# ================================================
# Next.js application
# ================================================

FROM node:20-alpine

# Install comprehensive build dependencies for native Node.js modules
# - python3: Required by node-gyp for compiling native addons
# - make, g++: Build tools for native compilation
# - linux-headers: Kernel headers for system-level packages
# - eudev-dev, libusb-dev: USB device support (for @solana/wallet-adapter)
# - libc6-compat: Compatibility layer for glibc-based packages
# - git: Required by some npm packages that fetch from git
# - openssl-dev: For crypto-related packages
# - pkgconfig: For detecting library configurations
RUN apk add --no-cache \
    curl \
    python3 \
    make \
    g++ \
    linux-headers \
    eudev-dev \
    libusb-dev \
    libc6-compat \
    git \
    openssl-dev \
    pkgconfig

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build Next.js app (for production)
# RUN npm run build

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Expose port
EXPOSE 3000

# Run the frontend in dev mode
CMD ["npm", "run", "dev"]
