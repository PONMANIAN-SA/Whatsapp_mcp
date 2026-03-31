import { useState } from 'react';
import { sendMessage } from '../utils/api';
import Spinner from '../components/Spinner';

interface Log {
  ts: string;
  to: string;
  message: string;
  status: 'ok' | 'error';
  info: string;
}

export default function SendPage() {
  const [to, setTo]           = useState('');
  const [msg, setMsg]         = useState('');
  const [sending, setSending] = useState(false);
  const [log, setLog]         = useState<Log[]>([]);

  const handleSend = async () => {
    if (!to.trim() || !msg.trim()) return;
    setSending(true);
    try {
      const { data } = await sendMessage(to.trim(), msg.trim());
      setLog((prev) => [
        {
          ts: new Date().toLocaleTimeString(),
          to: data.data.to,
          message: msg,
          status: 'ok',
          info: `msgId: ${data.data.messageId}`,
        },
        ...prev,
      ]);
      setMsg('');
    } catch (e: any) {
      const errMsg = e?.response?.data?.error || e.message;
      setLog((prev) => [
        { ts: new Date().toLocaleTimeString(), to, message: msg, status: 'error', info: errMsg },
        ...prev,
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Send Message</h1>
          <p className="text-sm text-gray-500 mt-1">Send a WhatsApp message via the MCP API</p>
        </div>

        {/* Form card */}
        <div className="card p-6 space-y-5">
          {/* To field */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              To (phone number)
            </label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="919876543210  (country code + number, no +)"
              className="input"
            />
            <p className="text-xs text-gray-600">
              Include country code without + symbol. E.g. 919876543210 for India.
              For groups use the group chat ID (e.g. 120363xxx@g.us).
            </p>
          </div>

          {/* Message field */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Message</label>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={5}
              placeholder="Type your message here…"
              className="input resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend();
              }}
            />
            <p className="text-xs text-gray-600">Ctrl+Enter to send</p>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !to.trim() || !msg.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {sending ? <><Spinner size="sm" /> Sending…</> : '✉️  Send Message'}
          </button>
        </div>

        {/* Send log */}
        {log.length > 0 && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Send Log</h2>
              <button onClick={() => setLog([])} className="text-xs text-gray-600 hover:text-gray-400">
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {log.map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                    entry.status === 'ok'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{entry.status === 'ok' ? '✅' : '❌'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-500">{entry.ts}</span>
                      <span className="font-medium text-gray-200">→ {entry.to}</span>
                    </div>
                    <p className="text-gray-300 mt-0.5 truncate">"{entry.message}"</p>
                    <p className={`text-xs mt-0.5 ${entry.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.info}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* curl reference */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-3">curl Reference</h2>
          <pre className="bg-gray-950 rounded-xl p-4 text-xs text-green-400 overflow-x-auto leading-relaxed">
{`curl -X POST https://your-app.onrender.com/tools/send-message \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "to": "919876543210",
    "message": "Hello from MCP!"
  }'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
