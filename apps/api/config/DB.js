// config/db.js (ESM)
// MongoDB Connection

import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('❌ MONGO_URI missing in .env');
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📦 MongoDB Connected: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Error:', error);
    throw error;
  }
};

export default connectDB;
