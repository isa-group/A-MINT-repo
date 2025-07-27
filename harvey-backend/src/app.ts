import express = require('express');
import cors = require('cors');
import helmet from 'helmet';
import compression = require('compression');
import rateLimit = require('express-rate-limit');
import { config } from './config';
import chatRoutes from './routes/chatRoutes';
import { errorHandler, AppError } from './utils/errorHandler';

const app = express();

app.use(helmet());

app.use(cors({
  origin: '*'
}));

app.use(compression());

// Rate limiting
const limiter = rateLimit.default({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'HARVEY Backend API',
    description: 'Holistic Analysis and Regulation Virtual Expert for You',
    version: '1.0.0',
    endpoints: {
      chat: '/api/chat',
      session: '/api/chat/session',
      health: '/health'
    },
    documentation: 'https://github.com/'
  });
});

app.use('/api/chat', chatRoutes);

app.all(/(.*)/, (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
});

// Global error handling middleware
app.use(errorHandler);

// Uncaught error handling
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export = app;
