# 📲 WhatsApp MCP Server

> Production-ready WhatsApp API server with web-based QR login, MongoDB session persistence, React dashboard, and full MCP (Model Context Protocol) integration for Claude / Cursor.

---

## 📁 Project Structure

```
my project/
│
├── app/
│   ├── backend/                  ← Express API server (Node.js + TypeScript)
│   │   ├── src/
│   │   │   ├── remote.ts         ← Entry point
│   │   │   ├── app.ts            ← Express factory
│   │   │   ├── config/
│   │   │   │   └── index.ts      ← Env var validation
│   │   │   ├── services/
│   │   │   │   ├── mongo.service.ts      ← MongoDB connection
│   │   │   │   ├── whatsapp.service.ts   ← WhatsApp client lifecycle
│   │   │   │   └── whatsapp.state.ts     ← Shared in-memory state
│   │   │   ├── routes/
│   │   │   │   ├── health.route.ts
│   │   │   │   ├── auth.route.ts         ← QR page + status
│   │   │   │   ├── tools.route.ts        ← MCP API endpoints
│   │   │   │   └── mcp.route.ts          ← Tool manifest
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts    ← API key guard
│   │   │   │   └── error.middleware.ts
│   │   │   └── utils/
│   │   │       └── logger.ts             ← Winston logger
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   └── frontend/                 ← React + Vite + Tailwind dashboard
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── index.css
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Auth.tsx       ← QR scanner UI
│       │   │   ├── Chats.tsx      ← Chat browser + message viewer
│       │   │   ├── Send.tsx       ← Send message form
│       │   │   └── Tools.tsx      ← MCP tool reference
│       │   ├── components/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── StatCard.tsx
│       │   │   └── Spinner.tsx
│       │   └── utils/
│       │       └── api.ts         ← Axios wrapper + types
│       └── .env.example
│
├── whatsapp-mcp/                 ← stdio MCP server for Claude Desktop
│   └── src/
│       └── index.ts              ← JSON-RPC 2.0 MCP protocol server
│
├── render.yaml                   ← Render deployment blueprint
├── setup.bat                     ← Windows one-click setup
├── setup.sh                      ← Mac/Linux one-click setup
└── claude_desktop_config.example.json
```

---

## ⚡ Quick Start (Local)

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)
- A WhatsApp account on your phone

### 1 — Clone & setup

**Windows:**
```bat
cd "H:\project\my project"
setup.bat
```

**Mac / Linux:**
```bash
cd "/path/to/my project"
chmod +x setup.sh && ./setup.sh
```

### 2 — Configure environment variables

Edit `app/backend/.env`:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/whatsapp_mcp
API_KEY=my_strong_random_key_32chars
PORT=3000
```

Edit `app/frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_KEY=my_strong_random_key_32chars
```

### 3 — Start backend
```bash
cd app/backend
node dist/remote.js
```

### 4 — Open QR login page
```
http://localhost:3000/auth/qr
```
Scan with WhatsApp on your phone (Linked Devices → Link a Device).

### 5 — Start frontend dashboard (optional)
```bash
cd app/frontend
npm run dev
# → http://localhost:5173
```

---

## 🌐 API Endpoints

### Public (no API key needed)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server + service health |
| GET | `/auth/qr` | Web QR login page |
| GET | `/auth/status` | Auth status JSON |
| GET | `/mcp/manifest` | MCP tool manifest |

### Protected (require `x-api-key` header)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tools/status` | WhatsApp connection status |
| GET | `/tools/chats?limit=10` | Recent chats list |
| POST | `/tools/send-message` | Send a message |
| GET | `/tools/messages?chatId=xxx&limit=20` | Chat messages |

---

## 📋 curl Examples

```bash
# Health check (no auth)
curl https://your-app.onrender.com/health

# Auth status
curl https://your-app.onrender.com/auth/status

# WhatsApp status
curl https://your-app.onrender.com/tools/status \
  -H "x-api-key: YOUR_API_KEY"

# Get top 5 chats
curl "https://your-app.onrender.com/tools/chats?limit=5" \
  -H "x-api-key: YOUR_API_KEY"

# Send a message
curl -X POST https://your-app.onrender.com/tools/send-message \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"to":"919876543210","message":"Hello from MCP!"}'

# Get messages from a chat
curl "https://your-app.onrender.com/tools/messages?chatId=919876543210@c.us&limit=20" \
  -H "x-api-key: YOUR_API_KEY"

# MCP manifest
curl https://your-app.onrender.com/mcp/manifest
```

---

## 🚀 Deploy to Render

### Option A — render.yaml (recommended)

1. Push your repo to GitHub
2. Go to https://render.com → **New** → **Blueprint**
3. Connect your repo — Render auto-reads `render.yaml`
4. In the dashboard, set secret env vars:
   - `MONGODB_URI` — your Atlas connection string
   - `API_KEY` — your secret key
5. Click **Apply** → wait for deploy

### Option B — Manual

1. Go to https://render.com → **New Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root directory:** `app/backend`
   - **Build command:** `npm install && npm run build`
   - **Start command:** `node dist/remote.js`
   - **Health check path:** `/health`
4. Add environment variables (same as above)
5. Deploy

> **Important for Render:** Add a Disk mount at `/tmp` (1 GB) so Puppeteer's Chromium has scratch space.

### Render Environment Variables to Set
```
NODE_ENV          = production
PORT              = 3000
MONGODB_URI       = mongodb+srv://...   ← keep secret
API_KEY           = ...                 ← keep secret
WA_SESSION_NAME   = whatsapp-mcp-session
```

---

## 🤖 Claude Desktop Integration

1. Build the MCP server:
```bash
cd whatsapp-mcp
npm install && npm run build
```

2. Edit your Claude Desktop config:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "whatsapp": {
      "command": "node",
      "args": ["H:\\project\\my project\\whatsapp-mcp\\dist\\index.js"],
      "env": {
        "BACKEND_URL": "https://your-backend.onrender.com",
        "API_KEY": "your_api_key_here"
      }
    }
  }
}
```

3. Restart Claude Desktop
4. You'll see WhatsApp tools available in Claude:
   - `get_status` — check connection
   - `get_chats` — list chats
   - `send_whatsapp_message` — send messages
   - `get_messages` — read messages
   - `get_health` — server health

---

## 🔒 Security Notes

- API key is validated on all `/tools/*` routes via `x-api-key` header
- Rate limiting: 100 requests per 15 minutes per IP (configurable)
- Helmet.js security headers enabled
- CORS configured (tighten `origin` for production)
- Never commit `.env` files — use Render's secret env vars

---

## 🔄 Auto-reconnect

The WhatsApp client automatically reconnects on:
- `disconnected` event
- `auth_failure` event

Max 5 attempts with exponential back-off (5s, 10s, 15s, 20s, 25s).

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| HTTP Server | Express 4 |
| WhatsApp | whatsapp-web.js |
| Session Store | wwebjs-mongo + MongoDB |
| Frontend | React 18 + Vite + Tailwind CSS |
| MCP Protocol | JSON-RPC 2.0 over stdio |
| Logging | Winston |
| Security | Helmet + express-rate-limit |
| Deploy | Render |
