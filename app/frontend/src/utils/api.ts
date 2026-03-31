import axios from 'axios';

// In development Vite proxies /api → localhost:3000
// In production set VITE_API_BASE_URL to your Render backend URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : '/api';

const API_KEY = import.meta.env.VITE_API_KEY || '';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

// ── Types ──────────────────────────────────────────────────────────────────────
export interface HealthResponse {
  success: boolean;
  status: string;
  timestamp: string;
  uptime: number;
  services: { mongodb: string; whatsapp: string };
}

export interface AuthStatusResponse {
  success: boolean;
  ready: boolean;
  phone: string | null;
  hasQr: boolean;
  lastError: string | null;
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  timestamp: string | null;
  lastMessage: string | null;
}

export interface ChatsResponse {
  success: boolean;
  tool: string;
  count: number;
  data: Chat[];
}

export interface SendMessageResponse {
  success: boolean;
  tool: string;
  data: { messageId: string; to: string; timestamp: string };
}

export interface Message {
  id: string;
  body: string;
  from: string;
  to: string;
  fromMe: boolean;
  timestamp: string;
  type: string;
}

export interface MessagesResponse {
  success: boolean;
  tool: string;
  count: number;
  data: Message[];
}

// ── API calls ──────────────────────────────────────────────────────────────────
export const fetchHealth      = ()                             => api.get<HealthResponse>('/health');
export const fetchAuthStatus  = ()                             => api.get<AuthStatusResponse>('/auth/status');
export const fetchChats       = (limit = 10)                   => api.get<ChatsResponse>(`/tools/chats?limit=${limit}`);
export const sendMessage      = (to: string, message: string) => api.post<SendMessageResponse>('/tools/send-message', { to, message });
export const fetchMessages    = (chatId: string, limit = 20)  => api.get<MessagesResponse>(`/tools/messages?chatId=${encodeURIComponent(chatId)}&limit=${limit}`);
