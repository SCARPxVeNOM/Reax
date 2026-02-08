# ================================================
# ReaX Frontend Dockerfile
# ================================================
# Next.js application
# ================================================

FROM node:20-alpine

# Install dependencies (including build tools for native modules)
RUN apk add --no-cache curl python3 make g++ linux-headers eudev-dev

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
