import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import 'express-async-errors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import authRoutes from './routes/auth.routes';
import rideRoutes from './routes/ride.routes';
import driverRoutes from './routes/driver.routes';
import geocodeRoutes from './routes/geocode.routes';
import { initializeSocketHandlers } from './sockets';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// CORS configuration - MUST be before other middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
  allowedHeaders: 'Content-Type, Authorization, Cookie, Accept',
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly BEFORE other middleware
app.options('*', cors(corsOptions));

// Security middleware (after CORS to avoid interference)
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/geocode', geocodeRoutes);

// API Documentation
app.get('/api-docs', (req, res) => {
  res.json({
    message: 'API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/request-otp': 'Request OTP for login',
        'POST /api/auth/verify-otp': 'Verify OTP and get JWT',
        'POST /api/auth/logout': 'Logout user',
      },
      rides: {
        'GET /api/rides/available': 'Search available rides',
        'POST /api/rides': 'Create new ride',
        'GET /api/rides/:id': 'Get ride details',
        'POST /api/rides/:id/join': 'Join a shared ride',
        'POST /api/rides/:id/confirm-payment': 'Confirm payment',
        'GET /api/rides/user/:userId': 'Get user rides',
      },
      driver: {
        'POST /api/driver/register': 'Register as driver',
        'POST /api/driver/location': 'Update driver location',
        'GET /api/driver/profile': 'Get driver profile',
        'PATCH /api/driver/availability': 'Update availability',
      },
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize WebSocket handlers
initializeSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
  logger.info(`📚 API docs: http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
