// ESM serverless function for Vercel (@vercel/node)
import mongoose from 'mongoose';

let cached = global._mongooseConn;

async function connect() {
  if (cached && cached.readyState === 1) return cached;
  const uri = process.env.MONGODB_URI;
  if (!uri) return null; // allow health without DB
  if (!cached) {
    cached = await mongoose.connect(uri, { autoIndex: true });
    global._mongooseConn = cached;
  }
  return cached;
}

export default async function handler(req, res) {
  try {
    await connect();
    res.status(200).json({ ok: true, db: !!cached, time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'health-failed' });
  }
}
