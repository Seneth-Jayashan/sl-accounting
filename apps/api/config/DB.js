// config/DB.js (ESM)
import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  // Fallback to 'test' if not in env
  const dbName = process.env.MONGO_DB_NAME || 'test'; 

  if (!uri) {
    console.error('❌ FATAL: MONGO_URI is missing in environment variables.');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  try {
    // FIX: Pass dbName in the options object
    const conn = await mongoose.connect(uri, {
      dbName: dbName,
    });
    
    console.log(`📦 MongoDB Connected: ${conn.connection.host} [${conn.connection.name}]`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB Runtime Error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB Disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB Reconnected');
});

export default connectDB;