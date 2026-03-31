import { Client } from 'whatsapp-web.js';

/**
 * Shared in-memory state for the WhatsApp client.
 * This singleton is imported everywhere that needs WA status.
 */
export interface WhatsAppState {
  client: Client | null;
  isReady: boolean;
  latestQr: string | null;         // raw QR string for qrcode lib
  latestQrDataUrl: string | null;  // base64 data URL for HTML display
  phone: string | null;
  reconnectAttempts: number;
  lastError: string | null;
}

const state: WhatsAppState = {
  client: null,
  isReady: false,
  latestQr: null,
  latestQrDataUrl: null,
  phone: null,
  reconnectAttempts: 0,
  lastError: null,
};

export default state;
