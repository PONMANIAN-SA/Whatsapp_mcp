/**
 * remote.ts — Production entry point
 *
 * Boot order:
 *  1. Load & validate environment variables
 *  2. Connect to MongoDB
 *  3. Start Express server
 *  4. Initialise WhatsApp client (async — non-blocking for HTTP)
 */

import config from './config';           // validates env vars first
import logger from './utils/logger';
import { connectMongo } from './services/mongo.service';
import { initWhatsApp } from './services/whatsapp.service';
import { createApp } from './app';

async function bootstrap(): Promise<void> {
  logger.info('═══════════════════════════════════════════');
  logger.info('   WhatsApp MCP Server — Starting Up       ');
  logger.info('═══════════════════════════════════════════');
  logger.info(`   Environment : ${config.nodeEnv}`);
  logger.info(`   Port        : ${config.port}`);
  logger.info('───────────────────────────────────────────');

  // 1️⃣  MongoDB
  try {
    await connectMongo();
  } catch (err) {
    logger.error('Fatal: Cannot connect to MongoDB. Exiting.', err);
    process.exit(1);
  }

  // 2️⃣  Express
  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`🌐  HTTP server listening on port ${config.port}`);
    logger.info(`🔑  QR Login page : http://localhost:${config.port}/auth/qr`);
    logger.info(`🔍  MCP Manifest  : http://localhost:${config.port}/mcp/manifest`);
    logger.info(`❤️   Health check  : http://localhost:${config.port}/health`);
  });

  // 3️⃣  WhatsApp (non-blocking — Puppeteer takes a few seconds)
  setImmediate(async () => {
    try {
      await initWhatsApp();
    } catch (err) {
      logger.error('WhatsApp initialisation error:', err);
      // Service keeps running; WhatsApp will auto-reconnect
    }
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    logger.info(`\n⚡  ${signal} received — shutting down gracefully…`);
    server.close(async () => {
      logger.info('✅  HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10 s
    setTimeout(() => {
      logger.error('⏱  Forced exit after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });
}

bootstrap();
