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
  process.exit(1); // Exit if socket fails critical init
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
  
  // A. Close HTTP Server (Stop accepting new requests)
  server.close((err) => {
    if (err) {
      console.error('Error closing HTTP server:', err);
      process.exit(1);
    }
    console.log('HTTP server closed.');

    // B. Close Database Connection
    mongoose.connection.close(false).then(() => {
      console.log('MongoDb connection closed.');
      process.exit(0);
    }).catch((err) => {
      console.error('Error closing MongoDb:', err);
      process.exit(1);
    });
  });

  // Force shutdown if cleanup takes too long (10s)
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
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); 
});