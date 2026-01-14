/**
 * Main Backend Server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import dotenv from 'dotenv';

import dexRoutes from './routes/dex';
import strategyRoutes from './routes/strategies';
import pineScriptRoutes from './routes/pinescript';
import visualStrategyRoutes from './routes/visual-strategy';
import strategyMicrochainRoutes from './routes/strategy-microchain';

import { WebSocketServer } from './services/websocket-server';

// Load env in the same order our scripts generate them
// - backend/.env.local (created by start-all.sh / run.bash / start-platform.ps1)
// - backend/.env (optional manual)
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/dex', dexRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/pinescript', pineScriptRoutes);
app.use('/api/visual-strategy', visualStrategyRoutes);
app.use('/api/strategy-microchain', strategyMicrochainRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize WebSocket server
const wsServer = new WebSocketServer(httpServer);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 WebSocket server ready`);
  console.log(`🔗 API: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    wsServer.close();
    process.exit(0);
  });
});
