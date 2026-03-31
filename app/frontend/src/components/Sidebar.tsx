import { NavLink } from 'react-router-dom';

interface Props {
  connected: boolean;
  phone: string | null;
}

const NAV = [
  { to: '/',          label: 'Dashboard',    icon: '🏠' },
  { to: '/auth',      label: 'QR Auth',      icon: '📱' },
  { to: '/chats',     label: 'Chats',        icon: '💬' },
  { to: '/send',      label: 'Send Message', icon: '✉️'  },
  { to: '/tools',     label: 'MCP Tools',    icon: '🔧' },
];

export default function Sidebar({ connected, phone }: Props) {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📲</span>
          <div>
            <p className="font-bold text-white leading-tight">WhatsApp MCP</p>
            <p className="text-xs text-gray-500 leading-tight">MCP Server Dashboard</p>
          </div>
        </div>
      </div>

      {/* Status pill */}
      <div className="px-6 py-3 border-b border-gray-800">
        {connected ? (
          <div className="badge-green w-full justify-center py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Connected {phone ? `· ${phone}` : ''}
          </div>
        ) : (
          <div className="badge-red w-full justify-center py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Disconnected
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-brand/15 text-brand border border-brand/25'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-800 text-xs text-gray-600">
        v1.0.0 · whatsapp-web.js
      </div>
    </aside>
  );
}
