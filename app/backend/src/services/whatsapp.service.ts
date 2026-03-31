import { Client, LocalAuth } from 'whatsapp-web.js';
import { MongoStore } from 'wwebjs-mongo';
import QRCode from 'qrcode';
import { getMongoose } from './mongo.service';
import state from './whatsapp.state';
import config from '../config';
import logger from '../utils/logger';

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 5000;

function buildClient(): Client {
  const store = new MongoStore({ mongoose: getMongoose() });

  return new Client({
    authStrategy: new LocalAuth({
      clientId: config.sessionName,
      dataPath: `/tmp/.wwebjs_auth`,
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--single-process',
      ],
    },
  });
}

// ─── Re-exported so remote.ts can call it ─────────────────────────────────────
export async function initWhatsApp(): Promise<void> {
  logger.info('🚀  Initialising WhatsApp client…');

  try {
    const client = buildClient();
    state.client = client;

    // ── QR ─────────────────────────────────────────────────────────────────
    client.on('qr', async (qr) => {
      logger.info('📱  QR code generated — open /auth/qr to scan');
      state.latestQr = qr;
      state.isReady = false;
      try {
        state.latestQrDataUrl = await QRCode.toDataURL(qr, { width: 300 });
      } catch (err) {
        logger.error('Failed to convert QR to data URL:', err);
      }
    });

    // ── Authenticated ───────────────────────────────────────────────────────
    client.on('authenticated', () => {
      logger.info('🔐  WhatsApp authenticated (session saved to MongoDB)');
      state.latestQr = null;
      state.latestQrDataUrl = null;
      state.lastError = null;
    });

    // ── Ready ───────────────────────────────────────────────────────────────
    client.on('ready', () => {
      const info = client.info;
      state.isReady = true;
      state.reconnectAttempts = 0;
      state.latestQr = null;
      state.latestQrDataUrl = null;
      state.phone = info?.wid?.user ?? null;
      logger.info(`✅  WhatsApp ready — phone: ${state.phone}`);
    });

    // ── Auth failure ────────────────────────────────────────────────────────
    client.on('auth_failure', (msg) => {
      logger.error(`❌  WhatsApp auth failure: ${msg}`);
      state.isReady = false;
      state.lastError = msg;
      scheduleReconnect();
    });

    // ── Disconnected ────────────────────────────────────────────────────────
    client.on('disconnected', (reason) => {
      logger.warn(`⚠️   WhatsApp disconnected: ${reason}`);
      state.isReady = false;
      state.phone = null;
      state.lastError = reason;
      scheduleReconnect();
    });

    await client.initialize();
  } catch (err) {
    logger.error('❌  WhatsApp init failed:', err);
    state.lastError = String(err);
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error(
      `❌  Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Manual restart required.`
    );
    return;
  }

  state.reconnectAttempts += 1;
  const delay = RECONNECT_DELAY_MS * state.reconnectAttempts;

  logger.info(
    `🔄  Reconnecting in ${delay / 1000}s… (attempt ${state.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
  );

  setTimeout(async () => {
    try {
      if (state.client) {
        await state.client.destroy().catch(() => undefined);
        state.client = null;
      }
      await initWhatsApp();
    } catch (err) {
      logger.error('Reconnect attempt failed:', err);
    }
  }, delay);
}
