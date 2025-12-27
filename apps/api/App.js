import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
// Import Router synchronously to avoid top-level await issues in some environments
import apiRouter from './Router.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 1. SECURITY & PROXY CONFIG
// ==========================================

// Trust the first proxy (NGINX/Heroku/Vercel)
app.set('trust proxy', 1);

// Helmet: Secure HTTP Headers
// Cross-Origin Resource Policy: "cross-origin" allows frontend to load images/videos from this API
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS: Allow configured frontend origins (supports comma-separated list)
const parseOrigins = (raw) =>
  (raw || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const CLIENT_ORIGINS = parseOrigins(process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN) || ["http://localhost:5173"];

const corsOrigin = (origin, callback) => {
  // Allow same-origin / tools with no Origin header (e.g., curl, health checks)
  if (!origin) return callback(null, true);
  if (CLIENT_ORIGINS.includes(origin)) return callback(null, true);
  return callback(new Error(`CORS blocked for origin: ${origin}`));
};

app.use(cors({
  origin: corsOrigin,
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate Limiting: Prevent Brute Force / DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: { message: "Too many requests from this IP, please try again later." }
});
app.use('/api', limiter); // Apply only to API routes, not static files

// ==========================================
// 2. PARSERS & LOGGING
// ==========================================

app.use(express.json({ limit: '10mb' })); // Increased limit for base64/files if needed
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Development Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ==========================================
// 3. STATIC FILES
// ==========================================

// Serve uploaded files publicly (e.g., Profile Pictures)
// Security Note: Ensure no sensitive docs (NICs/Slips) are stored here.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 4. ROUTING
// ==========================================

// System Health Checks (No Rate Limit)
app.get('/health', (req, res) => res.status(200).json({ status: 'UP', timestamp: new Date() }));
app.get('/api/version', (req, res) => res.json({ name: 'LMS-API', version: process.env.LMS_API_VERSION || '1.0.0' }));

// Main API Router
app.use('/api/v1', apiRouter);

// ==========================================
// 5. ERROR HANDLING
// ==========================================

// 404 Handler
app.use((req, res, next) => {
  next(createError(404, `Route not found: ${req.originalUrl}`));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  
  // Log critical server errors
  if (status === 500) console.error("🔥 Server Error:", err);

  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

export default app;