import { Router, Request, Response, NextFunction } from 'express';
import { requireApiKey } from '../middleware/auth.middleware';
import state from '../services/whatsapp.state';
import logger from '../utils/logger';

const router = Router();

// All /tools/* routes require an API key
router.use(requireApiKey);

// ─── Helper ────────────────────────────────────────────────────────────────────
function requireReady(res: Response): boolean {
  if (!state.isReady || !state.client) {
    res.status(503).json({
      success: false,
      error: 'WhatsApp client is not ready. Scan the QR at /auth/qr first.',
    });
    return false;
  }
  return true;
}

// ─── GET /tools/status ────────────────────────────────────────────────────────
/**
 * @tool get_status
 * Returns WhatsApp connection status including phone number.
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    tool: 'get_status',
    data: {
      ready: state.isReady,
      phone: state.phone,
      reconnectAttempts: state.reconnectAttempts,
      lastError: state.lastError,
    },
  });
});

// ─── GET /tools/chats?limit=5 ─────────────────────────────────────────────────
/**
 * @tool get_chats
 * Returns recent chats (id, name, lastMessage, unreadCount, timestamp).
 * Query param: limit (default 10, max 50)
 */
router.get('/chats', async (req: Request, res: Response, next: NextFunction) => {
  if (!requireReady(res)) return;

  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '10', 10), 50);

    const rawChats = await state.client!.getChats();
    const chats = rawChats.slice(0, limit).map((chat) => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount,
      timestamp: chat.timestamp ? new Date(chat.timestamp * 1000).toISOString() : null,
      lastMessage: (chat as any).lastMessage?.body ?? null,
    }));

    logger.info(`📋  /tools/chats — returned ${chats.length} chats`);

    res.json({
      success: true,
      tool: 'get_chats',
      count: chats.length,
      data: chats,
    });
  } catch (err) {
    logger.error('get_chats error:', err);
    next(err);
  }
});

// ─── POST /tools/send-message ─────────────────────────────────────────────────
/**
 * @tool send_whatsapp_message
 * Sends a WhatsApp message.
 * Body: { "to": "919876543210", "message": "Hello!" }
 * The "to" field can be:
 *   • Plain number (country code + number, no +)     → 919876543210
 *   • With @c.us suffix                              → 919876543210@c.us
 *   • Group ID                                       → 120363xxxxxxx@g.us
 */
router.post(
  '/send-message',
  async (req: Request, res: Response, next: NextFunction) => {
    if (!requireReady(res)) return;

    const { to, message } = req.body as { to?: string; message?: string };

    if (!to || typeof to !== 'string' || to.trim() === '') {
      res.status(400).json({ success: false, error: '"to" field is required' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ success: false, error: '"message" field is required' });
      return;
    }

    // Normalise the chat ID
    const chatId = to.includes('@') ? to : `${to.replace(/\D/g, '')}@c.us`;

    try {
      const result = await state.client!.sendMessage(chatId, message.trim());

      logger.info(`✉️   Message sent to ${chatId} — msgId: ${result.id.id}`);

      res.json({
        success: true,
        tool: 'send_whatsapp_message',
        data: {
          messageId: result.id.id,
          to: chatId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      logger.error(`send-message error (to: ${chatId}):`, err);
      next(err);
    }
  }
);

// ─── GET /tools/messages?chatId=xxx&limit=20 ──────────────────────────────────
/**
 * @tool get_messages
 * Returns recent messages from a specific chat.
 */
router.get('/messages', async (req: Request, res: Response, next: NextFunction) => {
  if (!requireReady(res)) return;

  const { chatId, limit } = req.query as { chatId?: string; limit?: string };

  if (!chatId) {
    res.status(400).json({ success: false, error: '"chatId" query param is required' });
    return;
  }

  try {
    const msgLimit = Math.min(parseInt(limit || '20', 10), 100);
    const chat = await state.client!.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit: msgLimit });

    const data = messages.map((m) => ({
      id: m.id.id,
      body: m.body,
      from: m.from,
      to: m.to,
      fromMe: m.fromMe,
      timestamp: new Date(m.timestamp * 1000).toISOString(),
      type: m.type,
    }));

    res.json({ success: true, tool: 'get_messages', count: data.length, data });
  } catch (err) {
    logger.error('get_messages error:', err);
    next(err);
  }
});

export default router;
