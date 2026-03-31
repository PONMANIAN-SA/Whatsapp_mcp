# 📱 WhatsApp MCP — Remote HTTP/SSE Server

> **Model Context Protocol (MCP) server for WhatsApp**, built with [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js) and TypeScript.  
> Supports both **local stdio** (Claude Desktop) and **remote HTTP/SSE** (Claude.ai Remote MCP) modes.

---

## ⚠️ WhatsApp Terms of Service — IMPORTANT

> **Read this before using this project.**

WhatsApp's [Terms of Service](https://www.whatsapp.com/legal/terms-of-service) and [Acceptable Use Policy](https://www.whatsapp.com/legal/acceptable-use-policy) **prohibit** the use of unofficial automation tools on personal or business accounts.

### 🚫 Actions that will get your number BANNED:

| Violation | Risk Level |
|-----------|-----------|
| Sending bulk/spam messages | 🔴 Instant Ban |
| Automating messages to unknown numbers | 🔴 Instant Ban |
| Using unofficial WhatsApp clients (like `whatsapp-web.js`) | 🟠 High Risk |
| Scraping contacts or group data at scale | 🟠 High Risk |
| Sending messages without user consent | 🔴 Instant Ban |
| Running the bot 24/7 on a personal number | 🟡 Medium Risk |
| Sending media/files in bulk | 🟠 High Risk |

### ✅ Safer Practices:

- Use a **dedicated/test phone number**, not your personal number
- Only message **contacts who have opted in**
- Keep message frequency low and human-like
- Do **not** expose your `/sse` or REST endpoints publicly without `API_KEY` protection
- Do **not** use this for marketing, sales blasting, or any commercial messaging at scale
- Use [WhatsApp Business API (Official)](https://business.whatsapp.com/products/business-platform) for production/commercial use

> 🔒 **This project is intended for personal automation and development/testing only.**  
> The author is not responsible for any account bans or legal consequences resulting from misuse.

---

## 🗂️ Project Structure

```
whatsapp-mcp/
├── src/
│   ├── index.ts          # stdio MCP server (Claude Desktop)
│   ├── remote.ts         # HTTP/SSE MCP server (Remote MCP + REST API)
│   └── send_message.ts   # CLI script to send a single message
├── dist/                 # Compiled JavaScript (auto-generated, do not edit)
├── .wwebjs_auth/         # WhatsApp session data (⚠️ keep this gitignored!)
├── .wwebjs_cache/        # Puppeteer browser cache (gitignored)
├── package.json
├── tsconfig.json
├── render.yaml           # Render.com deployment config
├── start-remote.bat      # Windows quick-start script
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and **npm**
- A WhatsApp account (use a test number!)
- Google Chrome or Chromium installed (used by Puppeteer internally)

---

### 1. Install Dependencies

```bash
npm install
```

---

### 2. Build TypeScript

```bash
npm run build
```

---

### 3. Start the Server

**Remote HTTP/SSE mode** (Claude.ai Remote MCP):
```bash
npm run start:remote
```

**Dev mode** (no build needed, uses `ts-node`):
```bash
npm run dev:remote
```

**stdio mode** (Claude Desktop):
```bash
npm start
```

---

### 4. Scan the QR Code

Open your browser and go to:
```
http://localhost:3000/qr
```

Scan the QR code with WhatsApp → **Linked Devices → Link a Device**.

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` or `/health` | Health check + WhatsApp status |
| `GET` | `/qr` | QR code HTML page (scan to authenticate) |
| `GET` | `/qr?format=json` | Raw QR data in JSON |
| `GET` | `/tools` | List all available MCP tools |
| `GET` | `/tools/status` | WhatsApp connection status |
| `POST` | `/tools/send-message` | Send a WhatsApp message |
| `GET` | `/tools/chats` | List recent chats |
| `GET` | `/tools/contacts` | List contacts |
| `GET` | `/tools/messages/:chatId` | Fetch messages from a chat |
| `POST` | `/tools/invoke` | Generic MCP tool invocation |
| `GET` | `/sse` | **MCP SSE endpoint** (Claude Remote MCP) |
| `POST` | `/messages` | MCP POST endpoint (paired with `/sse`) |

---

## 🛠️ Available MCP Tools

| Tool | Description |
|------|-------------|
| `whatsapp_status` | Check connection status |
| `whatsapp_send_message` | Send a text message |
| `whatsapp_send_media` | Send image / video / document |
| `whatsapp_get_contacts` | List all contacts |
| `whatsapp_get_groups` | List all groups |
| `whatsapp_get_group_info` | Get group details and members |
| `whatsapp_create_group` | Create a new group |
| `whatsapp_get_chats` | Get recent chats |
| `whatsapp_get_messages` | Get messages from a specific chat |

---

## 🔐 Optional: Bearer Token Auth

Protect your REST endpoints by setting an `API_KEY` environment variable:

```bash
API_KEY=mysecretkey npm run start:remote
```

Include the token in all requests:
```bash
curl -H "Authorization: Bearer mysecretkey" http://localhost:3000/tools/status
```

---

## 🌐 Testing with ngrok (Public HTTPS)

1. [Install ngrok](https://ngrok.com/download)
2. Start your server: `npm run start:remote`
3. In a new terminal: `ngrok http 3000`
4. Copy the generated URL (e.g., `https://xxxx.ngrok-free.app`)

**In Claude.ai → Settings → Integrations → Remote MCP**, paste:
```
https://xxxx.ngrok-free.app/sse
```

---

## ☁️ Deploy to Render

1. Push this repo to GitHub (see Git steps below)
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:remote`
   - **Environment:** `NODE_ENV=production`
   - **Optional:** `API_KEY=yoursecretkey`
5. Deploy and copy your `https://your-app.onrender.com` URL

Paste into Claude Remote MCP:
```
https://your-app.onrender.com/sse
```

> ⚠️ **Note:** WhatsApp session data (`.wwebjs_auth`) does **not** persist across Render deploys. Use a [Render Disk](https://render.com/docs/disks) or re-scan the QR code after each deploy.

---

## 📦 npm Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Start stdio MCP server |
| `npm run start:remote` | Start HTTP/SSE remote server |
| `npm run dev` | Dev stdio server (ts-node, no build) |
| `npm run dev:remote` | Dev remote server (ts-node, no build) |
| `npm run send` | CLI: send a single message |
| `npm run qr` | Show QR code in terminal |

---

## 📄 .gitignore Recommendations

Make sure your `.gitignore` includes:

```
node_modules/
dist/
.wwebjs_auth/
.wwebjs_cache/
.env
*.bat
```

> 🔒 **Never commit `.wwebjs_auth/`** — it contains your WhatsApp session credentials.

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `HOST` | `0.0.0.0` | Server bind address |
| `API_KEY` | *(empty)* | Optional Bearer token for REST auth |
| `NODE_ENV` | `development` | Set to `production` on Render |

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📜 License

MIT — use responsibly and in accordance with WhatsApp's Terms of Service.

---


> 💡 **Tip:** Install the [GitLens extension](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) in VS Code for a much richer Git experience — commit history, blame, comparisons and more.
