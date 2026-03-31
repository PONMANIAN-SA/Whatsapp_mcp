import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Spinner from '../components/Spinner';

export default function ToolsPage() {
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/mcp/manifest')
      .then(({ data }) => setManifest(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const BACKEND = import.meta.env.VITE_API_BASE_URL || window.location.origin;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">MCP Tools</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-compatible tool definitions for Claude, Cursor, and other MCP clients
          </p>
        </div>

        {/* Integration snippet */}
        <div className="card p-6 border-brand/20 bg-brand/5">
          <h2 className="font-semibold text-brand mb-3">🤖 Claude / Cursor Integration</h2>
          <p className="text-sm text-gray-400 mb-3">
            Add this URL to your MCP client to auto-discover all tools:
          </p>
          <div className="bg-gray-950 rounded-xl px-4 py-3 font-mono text-sm text-green-400 flex items-center justify-between gap-3">
            <span>{BACKEND}/mcp/manifest</span>
            <button
              onClick={() => navigator.clipboard.writeText(`${BACKEND}/mcp/manifest`)}
              className="text-xs text-gray-600 hover:text-gray-400 flex-shrink-0"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Tool cards */}
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : manifest ? (
          <div className="space-y-4">
            {manifest.tools.map((tool: any) => (
              <div key={tool.name} className="card p-6 space-y-4">
                {/* Tool header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`badge-${tool.method === 'GET' ? 'blue' : 'green'}`}>
                        {tool.method}
                      </span>
                      <h3 className="font-semibold text-white">{tool.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
                  </div>
                  <span className="font-mono text-xs text-gray-500 text-right flex-shrink-0">{tool.endpoint.replace(/^https?:\/\/[^/]+/, '')}</span>
                </div>

                {/* Parameters */}
                {tool.parameters && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Query Params</p>
                    <div className="space-y-1">
                      {tool.parameters.map((p: any) => (
                        <div key={p.name} className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-blue-400">{p.name}</span>
                          <span className="text-gray-700">·</span>
                          <span className="badge-yellow">{p.type}</span>
                          {p.required && <span className="badge-red">required</span>}
                          <span className="text-gray-500">{p.description}</span>
                          {p.default !== undefined && <span className="text-gray-700">default: {p.default}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body schema */}
                {tool.body_schema && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Request Body</p>
                    <pre className="bg-gray-950 rounded-xl p-3 text-xs text-gray-300 overflow-x-auto">
                      {JSON.stringify(tool.body_schema, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Could not load manifest</p>
        )}

        {/* Full curl examples */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">📋 All curl Examples</h2>
          <div className="space-y-4">
            {[
              {
                title: '1. Health Check',
                code: `curl ${BACKEND}/health`,
              },
              {
                title: '2. Auth Status',
                code: `curl ${BACKEND}/auth/status`,
              },
              {
                title: '3. WhatsApp Status',
                code: `curl ${BACKEND}/tools/status \\\n  -H "x-api-key: YOUR_API_KEY"`,
              },
              {
                title: '4. Get Chats (top 5)',
                code: `curl "${BACKEND}/tools/chats?limit=5" \\\n  -H "x-api-key: YOUR_API_KEY"`,
              },
              {
                title: '5. Send Message',
                code: `curl -X POST ${BACKEND}/tools/send-message \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -d '{"to":"919876543210","message":"Hello!"}'`,
              },
              {
                title: '6. Get Messages from Chat',
                code: `curl "${BACKEND}/tools/messages?chatId=919876543210@c.us&limit=20" \\\n  -H "x-api-key: YOUR_API_KEY"`,
              },
            ].map(({ title, code }) => (
              <div key={title}>
                <p className="text-xs font-medium text-gray-400 mb-1.5">{title}</p>
                <pre className="bg-gray-950 rounded-xl p-4 text-xs text-green-400 overflow-x-auto">{code}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
