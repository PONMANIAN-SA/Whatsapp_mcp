import { Router, Request, Response } from 'express';
import state from '../services/whatsapp.state';

const router = Router();

// ─── GET /auth/status ──────────────────────────────────────────────────────────
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    ready: state.isReady,
    phone: state.phone,
    hasQr: !!state.latestQrDataUrl,
    lastError: state.lastError,
  });
});

// ─── GET /auth/qr — Web-based QR scanner page ─────────────────────────────────
router.get('/qr', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // Already connected
  if (state.isReady) {
    res.send(connectedPage(state.phone ?? 'Unknown'));
    return;
  }

  // QR not yet generated
  if (!state.latestQrDataUrl) {
    res.send(waitingPage());
    return;
  }

  // Show QR
  res.send(qrPage(state.latestQrDataUrl));
});

// ─── HTML Templates ────────────────────────────────────────────────────────────

function baseHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f1923 0%, #1a2a1a 100%);
      color: #e5e7eb;
    }

    .card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 20px;
      padding: 40px 48px;
      text-align: center;
      max-width: 420px;
      width: 90%;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }

    .logo { font-size: 48px; margin-bottom: 12px; }

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 6px;
      color: #f9fafb;
    }

    p {
      font-size: 0.92rem;
      color: #9ca3af;
      line-height: 1.6;
    }

    .qr-wrap {
      background: #fff;
      border-radius: 16px;
      padding: 16px;
      margin: 24px 0;
      display: inline-block;
    }

    .qr-wrap img { display: block; width: 260px; height: 260px; }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-top: 20px;
    }

    .badge-green  { background: rgba(34,197,94,0.15);  color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    .badge-yellow { background: rgba(234,179,8,0.15);  color: #facc15; border: 1px solid rgba(234,179,8,0.3); }
    .badge-blue   { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }

    .steps {
      text-align: left;
      margin: 20px 0 0;
      padding: 0;
      list-style: none;
    }

    .steps li {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      font-size: 0.85rem;
      color: #d1d5db;
      margin-bottom: 8px;
    }

    .steps li span:first-child {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(37,211,102,0.2);
      color: #25d366;
      font-weight: 700;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;
    }

    .phone-label {
      font-size: 1.1rem;
      font-weight: 700;
      color: #4ade80;
      margin-top: 8px;
    }

    .refresh-note { font-size: 0.78rem; color: #6b7280; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="card">
    ${body}
  </div>
</body>
</html>`;
}

function qrPage(dataUrl: string): string {
  const body = `
    <div class="logo">📱</div>
    <h1>Scan to Connect</h1>
    <p>Open WhatsApp → Linked Devices → Link a Device</p>

    <div class="qr-wrap">
      <img src="${dataUrl}" alt="WhatsApp QR Code" />
    </div>

    <ul class="steps">
      <li><span>1</span><span>Open WhatsApp on your phone</span></li>
      <li><span>2</span><span>Tap ⋮ Menu → Linked Devices</span></li>
      <li><span>3</span><span>Tap <strong>Link a Device</strong></span></li>
      <li><span>4</span><span>Point your camera at this QR code</span></li>
    </ul>

    <div class="badge badge-yellow">⏳ Waiting for scan…</div>
    <p class="refresh-note">Page refreshes automatically every 5 seconds</p>

    <script>
      // Poll /auth/status — redirect to this page when ready or QR changes
      const check = async () => {
        try {
          const r = await fetch('/auth/status');
          const d = await r.json();
          if (d.ready || d.hasQr) location.reload();
        } catch {}
      };
      setInterval(check, 5000);
    </script>
  `;
  return baseHtml('WhatsApp QR Login', body);
}

function waitingPage(): string {
  const body = `
    <div class="logo">⏳</div>
    <h1>Initialising…</h1>
    <p>WhatsApp client is starting up. The QR code will appear shortly.</p>
    <div class="badge badge-blue" style="margin-top:24px">🔄 Please wait</div>
    <p class="refresh-note">Page refreshes every 5 seconds</p>
    <script>setInterval(() => location.reload(), 5000);</script>
  `;
  return baseHtml('WhatsApp — Starting', body);
}

function connectedPage(phone: string): string {
  const body = `
    <div class="logo">✅</div>
    <h1>WhatsApp Connected</h1>
    <p>Your MCP server is live and ready to send messages.</p>
    <div class="phone-label">📞 ${phone}</div>
    <div class="badge badge-green" style="margin-top:20px">🟢 Ready</div>
    <p class="refresh-note">This page refreshes every 10 seconds</p>
    <script>setInterval(() => location.reload(), 10000);</script>
  `;
  return baseHtml('WhatsApp Connected', body);
}

export default router;
