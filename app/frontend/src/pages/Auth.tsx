import { useEffect, useState, useCallback } from 'react';
import { fetchAuthStatus, AuthStatusResponse } from '../utils/api';
import Spinner from '../components/Spinner';

// We embed the backend QR page in an iframe, AND show status inline
const BACKEND = import.meta.env.VITE_API_BASE_URL || '';

export default function AuthPage() {
  const [status, setStatus] = useState<AuthStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const poll = useCallback(async () => {
    try {
      const { data } = await fetchAuthStatus();
      setStatus(data);
    } catch (_) {
      // ignore poll errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 4_000);
    return () => clearInterval(t);
  }, [poll]);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">QR Authentication</h1>
          <p className="text-sm text-gray-500 mt-1">Scan the QR code with your WhatsApp mobile app</p>
        </div>

        {/* Status banner */}
        {loading ? (
          <div className="card p-4 flex items-center gap-3">
            <Spinner size="sm" />
            <span className="text-gray-400 text-sm">Fetching status…</span>
          </div>
        ) : status?.ready ? (
          <div className="card p-4 border-green-500/30 bg-green-500/10 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-400">WhatsApp Connected!</p>
              <p className="text-sm text-gray-400">Phone: {status.phone}</p>
            </div>
          </div>
        ) : status?.hasQr ? (
          <div className="card p-4 border-yellow-500/30 bg-yellow-500/10 flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <p className="font-semibold text-yellow-400">Scan required</p>
              <p className="text-sm text-gray-400">Open WhatsApp → Linked Devices → Link a Device</p>
            </div>
          </div>
        ) : (
          <div className="card p-4 border-blue-500/30 bg-blue-500/10 flex items-center gap-3">
            <Spinner size="sm" />
            <div>
              <p className="font-semibold text-blue-400">Initialising WhatsApp…</p>
              <p className="text-sm text-gray-400">QR code will appear shortly</p>
            </div>
          </div>
        )}

        {/* Embedded QR page from backend */}
        {!status?.ready && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Live QR Code</span>
              <a
                href={`${BACKEND}/auth/qr`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand hover:underline"
              >
                Open in new tab ↗
              </a>
            </div>
            <iframe
              src={`${BACKEND}/auth/qr`}
              title="WhatsApp QR"
              className="w-full"
              style={{ height: '520px', border: 'none', background: '#0f1923' }}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">How to connect</h2>
          <ol className="space-y-3">
            {[
              'Open WhatsApp on your phone',
              'Tap the three-dot menu (⋮) → "Linked Devices"',
              'Tap "Link a Device"',
              'Point your camera at the QR code above',
              'Wait for confirmation — this page updates automatically',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/20 text-brand text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
