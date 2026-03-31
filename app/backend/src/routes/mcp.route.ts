import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /mcp/manifest
 * Returns the MCP tool manifest so Claude, Cursor, or any MCP-compatible
 * client can auto-discover available tools without API key.
 */
router.get('/manifest', (_req: Request, res: Response) => {
  const base = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;

  res.json({
    schema_version: '1.0',
    name: 'whatsapp-mcp',
    description: 'MCP server for sending and reading WhatsApp messages via whatsapp-web.js',
    tools: [
      {
        name: 'get_status',
        description: 'Returns the current WhatsApp connection status and phone number.',
        method: 'GET',
        endpoint: `${base}/tools/status`,
        auth: { type: 'api_key', header: 'x-api-key' },
        output_schema: {
          type: 'object',
          properties: {
            ready: { type: 'boolean' },
            phone: { type: 'string' },
          },
        },
      },
      {
        name: 'get_chats',
        description: 'Returns recent WhatsApp chats. Use limit param to control count (max 50).',
        method: 'GET',
        endpoint: `${base}/tools/chats`,
        auth: { type: 'api_key', header: 'x-api-key' },
        parameters: [
          { name: 'limit', in: 'query', type: 'integer', default: 10, description: 'Number of chats to return' },
        ],
      },
      {
        name: 'send_whatsapp_message',
        description: 'Sends a WhatsApp text message to a phone number or group.',
        method: 'POST',
        endpoint: `${base}/tools/send-message`,
        auth: { type: 'api_key', header: 'x-api-key' },
        body_schema: {
          type: 'object',
          required: ['to', 'message'],
          properties: {
            to: { type: 'string', description: 'Phone number with country code (e.g. 919876543210) or chat ID' },
            message: { type: 'string', description: 'Text message to send' },
          },
        },
      },
      {
        name: 'get_messages',
        description: 'Returns recent messages from a specific chat by chatId.',
        method: 'GET',
        endpoint: `${base}/tools/messages`,
        auth: { type: 'api_key', header: 'x-api-key' },
        parameters: [
          { name: 'chatId', in: 'query', type: 'string', required: true, description: 'Chat ID (e.g. 919876543210@c.us)' },
          { name: 'limit', in: 'query', type: 'integer', default: 20, description: 'Number of messages to return' },
        ],
      },
    ],
  });
});

export default router;
