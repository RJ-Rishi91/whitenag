import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from './logger.js';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      autoIndex: true
    });
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection error');
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
