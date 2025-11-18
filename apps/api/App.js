// App.js (ESM)
// Creates and configures the Express app

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

// __dirname replacement for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------- Middleware --------
app.use(helmet());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

// Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use(limiter);

// Static folder (optional)
app.use('/public', express.static(path.join(__dirname, 'public')));

// -------- Sample Routes --------
app.get('/', (req, res) => {
  res.json({ message: 'SL Accounting API - Running', env: process.env.NODE_ENV });
});

app.get('/health', (req, res) => {
  res.json({ up: true });
});

// Example placeholder route
app.get('/api/version', (req, res) => {
  res.json({ name: 'sl-accounting-api', version: '1.0.0' });
});

// -------- 404 handler --------
app.use((req, res, next) => {
  next(createError(404, 'Not Found'));
});

// -------- Global Error Handler --------
app.use((err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
});

export default app;
