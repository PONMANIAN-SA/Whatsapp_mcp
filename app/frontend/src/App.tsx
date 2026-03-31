import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/Dashboard';
import AuthPage      from './pages/Auth';
import ChatsPage     from './pages/Chats';
import SendPage      from './pages/Send';
import ToolsPage     from './pages/Tools';
import { fetchAuthStatus } from './utils/api';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [phone, setPhone]         = useState<string | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await fetchAuthStatus();
        setConnected(data.ready);
        setPhone(data.phone);
      } catch (_) {}
    };
    poll();
    const t = setInterval(poll, 8_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar connected={connected} phone={phone} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/"      element={<DashboardPage />} />
          <Route path="/auth"  element={<AuthPage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/send"  element={<SendPage />} />
          <Route path="/tools" element={<ToolsPage />} />
        </Routes>
      </main>
    </div>
  );
}
