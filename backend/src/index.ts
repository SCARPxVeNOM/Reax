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
import { resolve, join } from 'path';

// Load .env from project root (not from backend directory)
// When running from workspace, process.cwd() is the workspace dir, so go up one level
const rootPath = join(process.cwd(), '..');
dotenv.config({ path: join(rootPath, '.env') });

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
const lineraClient = new LineraClient(process.env.LINERA_RPC_URL || 'http://localhost:8080');
const dbClient = new DatabaseClient({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lineratrade',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password',
});
const redisClient = new RedisClient(process.env.REDIS_URL || 'redis://localhost:6379');
const aiParser = createAIParser(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests from this IP, please try again later.',
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
