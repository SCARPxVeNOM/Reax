# ================================================
# ReaX Backend Dockerfile
# ================================================
# Node.js service with TypeScript
# ================================================

FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build 2>/dev/null || echo "Using source directly"

# Create logs directory
RUN mkdir -p /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Expose port
EXPOSE 3003

# Run the backend
CMD ["npm", "run", "dev"]
