// Server.js (ESM)
// Loads env, connects DB, starts server

import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './App.js';
import connectDB from './config/DB.js';
import mongoose from 'mongoose';
import { initSocket } from "./config/socket.js";


const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Initialize Socket.io handlers
try {
  initSocket(server);
  console.log('✅ Socket.io initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Socket.io:', error);
}

async function start() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (env: ${process.env.NODE_ENV})`);
      console.log(`📡 Socket.io ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.log('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});
