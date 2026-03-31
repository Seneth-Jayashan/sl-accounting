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

// --- JOBS ---
import startSessionGenerator from "./jobs/SessionGenerator.js";
import startEnrollmentCron from './jobs/EnrollmentCron.js';

dotenv.config();
import apiRouter from './Router.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 0. INITIALIZE BACKGROUND JOBS
// ==========================================
try {
    startSessionGenerator();
    startEnrollmentCron();    
} catch (err) {
    console.error("❌ Background Job Error:", err);
}

// ==========================================
// 1. SECURITY & PROXY CONFIG
// ==========================================
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const parseOrigins = (raw) =>
  (raw || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const CLIENT_ORIGINS = parseOrigins(process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN) || ["http://localhost:5173"];

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (CLIENT_ORIGINS.includes(origin)) return callback(null, true);
  return callback(new Error(`CORS blocked for origin: ${origin}`));
};

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: { message: "Too many requests from this IP, please try again later." }
});
app.use('/api', limiter); 

// ==========================================
// 2. PARSERS & LOGGING
// ==========================================

app.use(express.json({ limit: '15mb' })); 
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Development Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ==========================================
// 3. STATIC FILES
// ==========================================

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 4. ROUTING
// ==========================================

app.get('/health', (req, res) => res.status(200).json({ status: 'UP', timestamp: new Date() }));
app.get('/api/version', (req, res) => res.json({ name: 'LMS-API', version: process.env.LMS_API_VERSION || '1.0.0' }));

app.use('/api/v1', apiRouter);

// ==========================================
// 5. ERROR HANDLING
// ==========================================

app.use((req, res, next) => {
  next(createError(404, `Route not found: ${req.originalUrl}`));
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  
  if (status === 500) console.error("🔥 Server Error:", err);

  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

export default app;