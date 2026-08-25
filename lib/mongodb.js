import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set in environment variables");
}

// Cache the connection across hot reloads / serverless invocations.
// Vercel functions are stateless per-instance, so this avoids opening
// a new connection on every request within the same warm instance.
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const start = Date.now();
    console.log("[mongodb] opening new connection...");
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000, // fail fast instead of hanging 30s+ per attempt
      })
      .then((m) => {
        console.log(`[mongodb] connected in ${Date.now() - start}ms`);
        return m;
      })
      .catch((err) => {
        console.error(`[mongodb] connection failed after ${Date.now() - start}ms:`, err.message);
        // Don't leave a rejected promise cached, or every future call fails
        // instantly without ever retrying.
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
