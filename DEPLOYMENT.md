# LineraTrade AI - Deployment Guide

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- Rust 1.86+ installed
- Docker and Docker Compose installed
- PostgreSQL 15
- Redis 7
- Linera CLI installed
- Twitter Developer Account
- OpenAI API Key
- Solana Wallet (devnet)

## Step-by-Step Deployment

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/yourusername/linera-trade-ai.git
cd linera-trade-ai

# Copy environment template
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Linera Configuration
LINERA_RPC_URL=http://localhost:8080
LINERA_APP_ID=<your_app_id_after_deployment>

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lineratrade
DB_USER=admin
DB_PASSWORD=<strong_password>

# Redis
REDIS_URL=redis://localhost:6379

# Twitter API
TWITTER_BEARER_TOKEN=<your_twitter_bearer_token>
INFLUENCERS=elonmusk,VitalikButerin

# OpenAI
OPENAI_API_KEY=<your_openai_api_key>

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_PRIVATE_KEY=<your_base58_private_key>
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

### 3. Start Infrastructure Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps
```

### 4. Deploy Linera Application

```bash
# Navigate to Linera app
cd linera-app

# Build the application
cargo build --release

# Start local Linera network (for development)
linera net up --testing-prng-seed 37

# Publish and create application
linera project publish-and-create

# Note the Application ID and update .env
# LINERA_APP_ID=<application_id_from_output>
```

### 5. Initialize Database

The database schema will be automatically created when the backend starts for the first time.

### 6. Start Backend Services

Open separate terminals for each service:

**Terminal 1 - Backend API:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Relayer:**
```bash
cd relayer
npm run dev
```

**Terminal 3 - Tweet Ingestion:**
```bash
cd ingestion
npm run dev
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm run dev
```

### 7. Verify Deployment

1. **Check Backend Health:**
```bash
curl http://localhost:3001/health
```

2. **Check Frontend:**
Open browser to `http://localhost:3000`

3. **Check Linera Node:**
```bash
curl http://localhost:8080/
```

## Production Deployment

### Using Docker Compose (Full Stack)

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Kubernetes Deployment

1. **Build and push Docker images:**
```bash
docker build -t your-registry/lineratrade-backend:latest ./backend
docker build -t your-registry/lineratrade-relayer:latest ./relayer
docker build -t your-registry/lineratrade-ingestion:latest ./ingestion
docker build -t your-registry/lineratrade-frontend:latest ./frontend

docker push your-registry/lineratrade-backend:latest
docker push your-registry/lineratrade-relayer:latest
docker push your-registry/lineratrade-ingestion:latest
docker push your-registry/lineratrade-frontend:latest
```

2. **Apply Kubernetes manifests:**
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/relayer.yaml
kubectl apply -f k8s/ingestion.yaml
kubectl apply -f k8s/frontend.yaml
```

## Monitoring

### Logs

```bash
# Backend logs
docker-compose logs -f backend

# Relayer logs
docker-compose logs -f relayer

# All services
docker-compose logs -f
```

### Metrics

Access Prometheus metrics at:
- Backend: `http://localhost:3001/metrics`
- Relayer: `http://localhost:3002/metrics`

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Database connection
docker-compose exec postgres pg_isready

# Redis connection
docker-compose exec redis redis-cli ping
```

## Troubleshooting

### Linera Node Not Starting

```bash
# Check Linera logs
linera service --port 8080

# Reset local network
linera net down
linera net up --testing-prng-seed 37
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection
docker-compose exec postgres psql -U admin -d lineratrade -c "SELECT 1;"

# Reset database
docker-compose down postgres
docker volume rm lineratrade_postgres_data
docker-compose up -d postgres
```

### Twitter API Rate Limits

- Reduce `POLL_INTERVAL` in `.env` (increase time between polls)
- Use Twitter API v2 with elevated access
- Implement exponential backoff (already included)

### Solana Transaction Failures

```bash
# Check wallet balance
solana balance --url devnet

# Request airdrop
solana airdrop 2 --url devnet

# Check RPC health
curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

## Security Checklist

- [ ] Change default database passwords
- [ ] Use environment-specific API keys
- [ ] Enable HTTPS/TLS for production
- [ ] Implement rate limiting
- [ ] Use HSM for private key storage
- [ ] Enable CORS only for trusted origins
- [ ] Regular security audits
- [ ] Monitor for suspicious activity

## Backup and Recovery

### Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U admin lineratrade > backup.sql

# Restore
docker-compose exec -T postgres psql -U admin lineratrade < backup.sql
```

### Linera State Backup

```bash
# Export Linera state
linera wallet show

# Backup wallet
cp ~/.config/linera/wallet.json wallet-backup.json
```

## Scaling

### Horizontal Scaling

- **Backend**: Deploy multiple instances behind load balancer
- **Relayer**: Run multiple relayers for high availability
- **Database**: Use PostgreSQL read replicas
- **Redis**: Use Redis Cluster for caching

### Vertical Scaling

- Increase container resources in `docker-compose.yml`
- Adjust PostgreSQL `max_connections`
- Increase Node.js heap size: `NODE_OPTIONS=--max-old-space-size=4096`

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/linera-trade-ai/issues
- Discord: [Your Discord Server]
- Email: support@lineratrade.ai

---

**Last Updated:** 2025-01-XX
