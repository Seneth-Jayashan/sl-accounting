import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Core Middleware ---

// 1. FIX HELMET: Allow images to be loaded by your React App (Cross-Origin)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// CORS Configuration
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
});
app.use(limiter);

// 2. FIX STATIC PATH: Remove '..' so it looks inside 'apps/api/uploads'
// Current: .../apps/api/App.js
// Target:  .../apps/api/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Router Mounting ---
app.use('/api/v1', (await import('./Router.js')).default);

// --- Base System Routes ---
app.get('/system', (req, res) => {
  res.json({ message: 'SL Accounting API - Running', env: process.env.NODE_ENV });
});

app.get('/health', (req, res) => {
  res.json({ up: true });
});

app.get('/api/version', (req, res) => {
  res.json({ name: 'sl-accounting-api', version: process.env.LMS_API_VERSION || '1.0.0' });
});

// --- Error Handling Middleware ---
// 404 Not Found Handler
app.use((req, res, next) => {
  next(createError(404, 'Not Found'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
    message: err.message,
    // Only send stack trace in development
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
});

export default app;