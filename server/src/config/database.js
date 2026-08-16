import mongoose from 'mongoose'

export async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI is not configured; UTAP is running with demo-memory persistence.')
    return false
  }
  mongoose.set('strictQuery', true)
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
  console.log('MongoDB connected')
  return true
}
