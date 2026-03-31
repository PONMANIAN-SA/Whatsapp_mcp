import mongoose from 'mongoose';
import config from '../config';
import logger from '../utils/logger';

let isConnected = false;

export async function connectMongo(): Promise<void> {
  if (isConnected) return;

  mongoose.set('strictQuery', false);

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info('✅  MongoDB connected successfully');

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('⚠️   MongoDB disconnected — attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('✅  MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌  MongoDB error:', err);
      isConnected = false;
    });
  } catch (err) {
    logger.error('❌  MongoDB connection failed:', err);
    throw err;
  }
}

export function getMongoose(): typeof mongoose {
  return mongoose;
}

export function isMongoConnected(): boolean {
  return isConnected;
}
