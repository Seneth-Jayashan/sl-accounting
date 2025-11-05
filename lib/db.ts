import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("❌ Please define the MONGODB_URI environment variable in .env.local");
}

// Store cached connection across hot reloads (Next.js dev mode reloads frequently)
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB (with connection caching)
 * This prevents multiple connections during hot reloads.
 */
export async function connectDB() {
  if (cached.conn) {
    // ✅ Already connected
    return cached.conn;
  }

  if (!cached.promise) {
    // 🧠 Create new connection promise
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "nextjs_app", // Optional: change DB name here
        bufferCommands: false,
      })
      .then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ MongoDB connection failed:", e);
    throw e;
  }

  console.log("✅ Connected to MongoDB");
  return cached.conn;
}
