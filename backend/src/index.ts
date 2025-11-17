import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

import { setupRoutes } from './routes';
import { LineraClient } from './linera-client';
import { DatabaseClient } from './database';
import { RedisClient } from './redis-client';
import { createAIParser } from '../../parser/src/ai-parser';
import { AutoOrderService } from './auto-order-service';
import { resolve, join } from 'path';
import { existsSync } from 'fs';

// Load .env from project root
// Try multiple paths: current dir, parent dir (if running from backend/), or workspace root
const possiblePaths = [
  join(process.cwd(), '.env'),           // If running from root
  join(process.cwd(), '..', '.env'),     // If running from backend/
  join(__dirname, '..', '..', '.env'),   // Relative to this file
];
let envLoaded = false;
for (const envPath of possiblePaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ [BACKEND] Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}
// Fallback: try default location
if (!envLoaded) {
  dotenv.config();
  console.log(`⚠️  [BACKEND] Using default .env location`);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.API_PORT || 3001;

// Initialize clients
const lineraRpcUrl = process.env.LINERA_RPC_URL || 'http://localhost:8080';
console.log(`[BACKEND] Linera RPC URL: ${lineraRpcUrl}`);
console.log(`[BACKEND] LINERA_APP_ID: ${process.env.LINERA_APP_ID ? 'Set' : 'Not set'}`);
const lineraClient = new LineraClient(lineraRpcUrl);
const dbClient = new DatabaseClient({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lineratrade',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password',
});
const redisClient = new RedisClient(process.env.REDIS_URL || 'redis://localhost:6379');
const aiParser = createAIParser(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);

// Initialize auto-order service for automatic order creation on buy signals
const autoOrderService = new AutoOrderService(lineraClient, {
  enabled: process.env.AUTO_ORDER_ENABLED === 'true',
  minConfidence: parseFloat(process.env.AUTO_ORDER_MIN_CONFIDENCE || '0.7'),
  maxTradeSize: parseFloat(process.env.AUTO_ORDER_MAX_SIZE || '100'),
  maxSlippage: parseFloat(process.env.AUTO_ORDER_MAX_SLIPPAGE || '3.0'),
  paperTradeOnly: process.env.AUTO_ORDER_PAPER_ONLY === 'true',
});

if (autoOrderService.getConfig().enabled) {
  console.log('🤖 Auto-order service ENABLED');
  console.log(`   Min confidence: ${autoOrderService.getConfig().minConfidence}`);
  console.log(`   Max trade size: $${autoOrderService.getConfig().maxTradeSize}`);
  console.log(`   Max slippage: ${autoOrderService.getConfig().maxSlippage}%`);
  console.log(`   Paper trade only: ${autoOrderService.getConfig().paperTradeOnly}`);
} else {
  console.log('⚠️  Auto-order service DISABLED (set AUTO_ORDER_ENABLED=true to enable)');
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting - more lenient to avoid 429 errors
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute per IP (increased from 100)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

app.use('/api/', apiLimiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Setup routes
setupRoutes(app, {
  lineraClient,
  dbClient,
  redisClient,
  aiParser,
  io,
  autoOrderService,
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('subscribe:signals', () => {
    socket.join('signals');
    console.log('Client subscribed to signals:', socket.id);
  });

  socket.on('subscribe:orders', () => {
    socket.join('orders');
    console.log('Client subscribed to orders:', socket.id);
  });

  socket.on('subscribe:strategies', () => {
    socket.join('strategies');
    console.log('Client subscribed to strategies:', socket.id);
  });
});

// Initialize database and start server
async function start() {
  // Try to connect to database and Redis, but don't fail if Docker isn't running
  try {
    await dbClient.connect();
    console.log('✅ Database connected');
  } catch (error: any) {
    console.warn('⚠️  Database not available (PostgreSQL may not be running):', error.message);
    console.warn('   Backend will work without database - data will not persist');
  }

  try {
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (error: any) {
    console.warn('⚠️  Redis not available (Redis may not be running):', error.message);
    console.warn('   Backend will work without Redis - caching disabled');
  }

  // Start server regardless of database status
  httpServer.listen(PORT, () => {
    console.log(`✅ Backend API running on port ${PORT}`);
    console.log(`✅ WebSocket server ready`);
  });
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await dbClient.disconnect();
  await redisClient.disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io };
