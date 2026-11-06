import express from 'express';
import { databaseJsonReplacer } from './utils/json';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config';
import { isProductionRuntime } from './config/runtime';
import { errorHandler } from './middleware/errorHandler';
import prisma from './config/database';

import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import bookingRoutes from './routes/booking.routes';
import settlementRoutes from './routes/settlement.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';
import aiRoutes from './routes/ai.routes';
import handoverRoutes from './routes/handover.routes';
import userRoutes from './routes/user.routes';

const app = express();
app.set('json replacer', databaseJsonReplacer);

const isSecureRuntime = isProductionRuntime() && (process.env.FORCE_HTTPS === 'true' || process.env.USE_HTTPS === 'true');

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  contentSecurityPolicy: isSecureRuntime
    ? {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", 'https:', 'wss:'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
        },
      }
    : false,
  hsts: isSecureRuntime,
  noSniff: true,
  xFrameOptions: { action: 'sameorigin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
const allowedOrigins = config.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || (allowedOrigins.includes('*') && !isProductionRuntime()) || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
// Attachments are served exclusively through authenticated event routes.

// Healthcheck
app.get('/api/health', async (_req, res) => {
  const isPostgres = /^postgres(?:ql)?:\/\//i.test(process.env.DATABASE_URL || '');
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      name: 'EventFlow API Server - ĐH Kinh tế ĐHĐN',
      database: isPostgres ? 'PostgreSQL' : 'SQLite',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'error',
      name: 'EventFlow API Server - ĐH Kinh tế ĐHĐN',
      database: isPostgres ? 'PostgreSQL' : 'SQLite',
      error: 'Database connection unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/facilities', bookingRoutes);
app.use('/api/equipment', bookingRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/users', userRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
