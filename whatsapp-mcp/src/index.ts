/**
 * whatsapp-mcp/src/index.ts
 *
 * A stdio-based MCP server that wraps the WhatsApp HTTP backend.
 * Claude Desktop / Cursor reads tool definitions from here and
 * calls them; this server proxies the calls to the HTTP backend.
 *
 * Protocol: JSON-RPC 2.0 over stdin/stdout
 * Spec: https://spec.modelcontextprotocol.io/
 */

import * as readline from 'readline';
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ── Config ─────────────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const API_KEY     = process.env.API_KEY     || '';

if (!API_KEY) {
  process.stderr.write('[whatsapp-mcp] WARNING: API_KEY is not set\n');
}

// ── Axios client ──────────────────────────────────────────────────────────────
const http: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

// ── Tool definitions ───────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'get_status',
    description: 'Returns the current WhatsApp connection status. Call this first to verify the server is ready before calling other tools.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_chats',
    description: 'Returns a list of recent WhatsApp chats including chat ID, name, unread count, and last message preview.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of chats to return (1–50). Default: 10.',
        },
      },
      required: [],
    },
  },
  {
    name: 'send_whatsapp_message',
    description: 'Sends a WhatsApp text message to a phone number or group. The "to" field must be a full phone number with country code (e.g. 919876543210 for India) or a group chat ID ending in @g.us.',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Phone number with country code, no + sign (e.g. 919876543210). Or a group ID like 120363xxx@g.us.',
        },
        message: {
          type: 'string',
          description: 'Text message to send.',
        },
      },
      required: ['to', 'message'],
    },
  },
  {
    name: 'get_messages',
    description: 'Returns recent messages from a specific WhatsApp chat. Requires a chatId (e.g. 919876543210@c.us).',
    inputSchema: {
      type: 'object',
      properties: {
        chatId: {
          type: 'string',
          description: 'The chat ID to fetch messages from (e.g. 919876543210@c.us or group@g.us).',
        },
        limit: {
          type: 'number',
          description: 'Number of messages to return (1–100). Default: 20.',
        },
      },
      required: ['chatId'],
    },
  },
  {
    name: 'get_health',
    description: 'Returns server health including MongoDB and WhatsApp connection status.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// ── Tool handlers ──────────────────────────────────────────────────────────────
async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_status': {
      const { data } = await http.get('/tools/status');
      return data;
    }

    case 'get_chats': {
      const limit = (args.limit as number | undefined) ?? 10;
      const { data } = await http.get(`/tools/chats?limit=${limit}`);
      return data;
    }

    case 'send_whatsapp_message': {
      const { to, message } = args as { to: string; message: string };
      if (!to || !message) throw new Error('Both "to" and "message" are required');
      const { data } = await http.post('/tools/send-message', { to, message });
      return data;
    }

    case 'get_messages': {
      const { chatId, limit } = args as { chatId: string; limit?: number };
      if (!chatId) throw new Error('"chatId" is required');
      const { data } = await http.get(`/tools/messages?chatId=${encodeURIComponent(chatId)}&limit=${limit ?? 20}`);
      return data;
    }

    case 'get_health': {
      const { data } = await http.get('/health');
      return data;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── JSON-RPC helpers ───────────────────────────────────────────────────────────
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function send(obj: unknown): void {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function ok(id: string | number | null, result: unknown): void {
  send({ jsonrpc: '2.0', id, result });
}

function err(id: string | number | null, code: number, message: string, data?: unknown): void {
  send({ jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } });
}

// ── Request dispatcher ────────────────────────────────────────────────────────
async function handleRequest(req: JsonRpcRequest): Promise<void> {
  const { id, method, params = {} } = req;

  try {
    switch (method) {
      // ── MCP lifecycle ──────────────────────────────────────────────────────
      case 'initialize':
        ok(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'whatsapp-mcp', version: '1.0.0' },
        });
        break;

      case 'notifications/initialized':
        // no response needed for notifications
        break;

      // ── Tool discovery ─────────────────────────────────────────────────────
      case 'tools/list':
        ok(id, { tools: TOOLS });
        break;

      // ── Tool execution ─────────────────────────────────────────────────────
      case 'tools/call': {
        const toolName = params.name as string | undefined;
        const toolArgs = (params.arguments ?? {}) as Record<string, unknown>;

        if (!toolName) {
          err(id, -32602, 'Missing tool name');
          break;
        }

        const result = await callTool(toolName, toolArgs);

        ok(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        });
        break;
      }

      // ── Ping ───────────────────────────────────────────────────────────────
      case 'ping':
        ok(id, {});
        break;

      default:
        err(id, -32601, `Method not found: ${method}`);
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const isAxios  = (e as any)?.isAxiosError;

    if (isAxios) {
      const status = (e as any)?.response?.status;
      const body   = (e as any)?.response?.data;
      err(id, -32000, `HTTP ${status}: ${body?.error ?? message}`, body);
    } else {
      err(id, -32000, message);
    }
  }
}

// ── stdin reader ───────────────────────────────────────────────────────────────
const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
  terminal: false,
});

process.stderr.write(`[whatsapp-mcp] Starting — backend: ${BACKEND_URL}\n`);

rl.on('line', async (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let req: JsonRpcRequest;
  try {
    req = JSON.parse(trimmed);
  } catch {
    err(null, -32700, 'Parse error', { raw: trimmed });
    return;
  }

  await handleRequest(req);
});

rl.on('close', () => {
  process.stderr.write('[whatsapp-mcp] stdin closed — exiting\n');
  process.exit(0);
});

process.on('uncaughtException', (e) => {
  process.stderr.write(`[whatsapp-mcp] Uncaught: ${e.message}\n`);
});
