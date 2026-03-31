import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    logger.error(`❌  Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return val;
}

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: requireEnv('MONGODB_URI'),
  apiKey: requireEnv('API_KEY'),
  sessionName: process.env.WA_SESSION_NAME || 'whatsapp-mcp-session',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

export default config;
