import { useEffect, useState } from 'react';
import { fetchHealth, fetchAuthStatus, HealthResponse, AuthStatusResponse } from '../utils/api';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';

export default function DashboardPage() {
  const [health, setHealth]   = useState<HealthResponse | null>(null);
  const [status, setStatus]   = useState<AuthStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    try {
      const [h, s] = await Promise.all([fetchHealth(), fetchAuthStatus()]);
      setHealth(h.data);
      setStatus(s.data);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time system overview</p>
          </div>
          <button onClick={load} className="btn-ghost text-sm">↻ Refresh</button>
        </div>

        {error && (
          <div className="card p-4 border-red-500/30 bg-red-500/10">
            <p className="text-red-400 text-sm">⚠️  {error}</p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="🟢"
            label="Server"
            value={health?.status === 'ok' ? 'Online' : 'Error'}
            sub={`Uptime ${Math.floor((health?.uptime ?? 0) / 60)}m`}
            colorClass={health?.status === 'ok' ? 'text-green-400' : 'text-red-400'}
          />
          <StatCard
            icon="🍃"
            label="MongoDB"
            value={health?.services.mongodb === 'connected' ? 'Connected' : 'Down'}
            colorClass={health?.services.mongodb === 'connected' ? 'text-green-400' : 'text-red-400'}
          />
          <StatCard
            icon="📱"
            label="WhatsApp"
            value={status?.ready ? 'Ready' : 'Not Ready'}
            sub={status?.phone ?? undefined}
            colorClass={status?.ready ? 'text-brand' : 'text-yellow-400'}
          />
          <StatCard
            icon="🔐"
            label="Auth Status"
            value={status?.ready ? 'Authenticated' : status?.hasQr ? 'Scan QR' : 'Connecting…'}
            colorClass={status?.ready ? 'text-green-400' : 'text-yellow-400'}
          />
        </div>

        {/* Details cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Server info */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">🌐 Server Info</h2>
            <dl className="space-y-3 text-sm">
              {[
                ['Timestamp', health?.timestamp ? new Date(health.timestamp).toLocaleString() : '—'],
                ['Uptime',    `${Math.floor((health?.uptime ?? 0) / 60)} min ${(health?.uptime ?? 0) % 60} sec`],
                ['MongoDB',   health?.services.mongodb ?? '—'],
                ['WhatsApp',  health?.services.whatsapp ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="text-gray-200 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* WhatsApp info */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">📱 WhatsApp</h2>
            <dl className="space-y-3 text-sm">
              {[
                ['Status',    status?.ready ? '✅ Ready' : '⏳ Not ready'],
                ['Phone',     status?.phone ?? '—'],
                ['QR Pending', status?.hasQr ? 'Yes — go to QR Auth' : 'No'],
                ['Last Error', status?.lastError ?? 'None'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-gray-500 flex-shrink-0">{k}</dt>
                  <dd className="text-gray-200 font-medium text-right truncate">{v}</dd>
                </div>
              ))}
            </dl>
            {!status?.ready && (
              <a href="/auth" className="btn-primary w-full text-center block text-sm mt-2">
                📱 Go to QR Auth
              </a>
            )}
          </div>
        </div>

        {/* Quick MCP reference */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">🔧 MCP Endpoints</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { method: 'GET',  path: '/health',             desc: 'Health check'     },
              { method: 'GET',  path: '/auth/qr',            desc: 'QR login page'    },
              { method: 'GET',  path: '/tools/status',       desc: 'WA status'        },
              { method: 'GET',  path: '/tools/chats',        desc: 'Recent chats'     },
              { method: 'POST', path: '/tools/send-message', desc: 'Send message'     },
              { method: 'GET',  path: '/tools/messages',     desc: 'Chat messages'    },
              { method: 'GET',  path: '/mcp/manifest',       desc: 'MCP manifest'     },
              { method: 'GET',  path: '/auth/status',        desc: 'Auth status JSON' },
            ].map(({ method, path, desc }) => (
              <div key={path} className="bg-gray-800/60 rounded-xl p-3">
                <span className={`badge-${method === 'GET' ? 'blue' : 'green'} text-xs mb-1`}>{method}</span>
                <p className="font-mono text-xs text-gray-300 mt-1.5">{path}</p>
                <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
