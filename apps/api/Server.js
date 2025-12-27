// Server.js (ESM)
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import mongoose from 'mongoose';
import app from './App.js';
import connectDB from './config/DB.js';
import { initSocket } from "./config/socket.js";

const PORT = process.env.PORT || 4000;

// Create HTTP server to attach both Express and Socket.io
const server = http.createServer(app);

// 1. Initialize Socket.io
try {
  initSocket(server);
  console.log('✅ Socket.io initialized');
} catch (error) {
  console.error('❌ Socket.io initialization failed:', error.message);
}

// 2. Start Database & Server
async function startServer() {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('❌ Critical Startup Error:', error);
    process.exit(1);
  }
}

startServer();

// 3. Graceful Shutdown (Sigterm/Sigint)
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Closing resources...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });

  // Force shutdown if cleanup takes too long
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle unexpected crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  // Optional: process.exit(1) depending on crash policy
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Always exit on uncaught exceptions to restart clean state
});