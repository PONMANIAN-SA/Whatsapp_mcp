#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "============================================================"
echo "  WhatsApp MCP — Setup Script"
echo "============================================================"
echo ""

# ── Backend ──────────────────────────────────────────────────────────────────
echo "[1/4] Installing backend dependencies..."
cd "$ROOT/app/backend"
npm install

echo "[2/4] Building backend (TypeScript)..."
npm run build

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "       ✅  .env created — edit app/backend/.env before starting"
fi

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "[3/4] Installing frontend dependencies..."
cd "$ROOT/app/frontend"
npm install

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "       ✅  .env created — edit app/frontend/.env before starting"
fi

# ── MCP server ────────────────────────────────────────────────────────────────
echo "[4/4] Installing whatsapp-mcp dependencies..."
cd "$ROOT/whatsapp-mcp"
npm install
npm run build

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "       ✅  .env created — edit whatsapp-mcp/.env before starting"
fi

echo ""
echo "============================================================"
echo "  ✅  Setup complete!"
echo "============================================================"
echo ""
echo "  NEXT STEPS:"
echo "  1. Edit app/backend/.env      — set MONGODB_URI and API_KEY"
echo "  2. Edit app/frontend/.env     — set VITE_API_BASE_URL and VITE_API_KEY"
echo "  3. Edit whatsapp-mcp/.env     — set BACKEND_URL and API_KEY"
echo ""
echo "  START BACKEND:"
echo "    cd app/backend && node dist/remote.js"
echo ""
echo "  START FRONTEND (dev):"
echo "    cd app/frontend && npm run dev"
echo ""
echo "  OPEN QR PAGE:"
echo "    http://localhost:3000/auth/qr"
echo "============================================================"
echo ""
