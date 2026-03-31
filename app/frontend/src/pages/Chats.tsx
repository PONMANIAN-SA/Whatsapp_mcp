import { useEffect, useState } from 'react';
import { fetchChats, fetchMessages, Chat, Message } from '../utils/api';
import Spinner from '../components/Spinner';

export default function ChatsPage() {
  const [chats, setChats]           = useState<Chat[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [limit, setLimit]           = useState(10);
  const [selected, setSelected]     = useState<Chat | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  const loadChats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchChats(limit);
      setChats(data.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadChats(); }, [limit]);

  const openChat = async (chat: Chat) => {
    setSelected(chat);
    setMessages([]);
    setMsgLoading(true);
    try {
      const { data } = await fetchMessages(chat.id, 30);
      setMessages(data.data);
    } catch (e: any) {
      console.error('msgs error', e);
    } finally {
      setMsgLoading(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Chat list */}
      <div className="w-80 flex-shrink-0 border-r border-gray-800 flex flex-col">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h1 className="font-semibold text-white">Chats</h1>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none"
            >
              {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={loadChats} className="btn-ghost text-xs px-2 py-1">↻</button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : error ? (
            <div className="p-4 text-red-400 text-sm">{error}</div>
          ) : chats.length === 0 ? (
            <p className="p-4 text-gray-500 text-sm">No chats found</p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => openChat(chat)}
                className={`w-full text-left px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                  selected?.id === chat.id ? 'bg-brand/10 border-l-2 border-l-brand' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-200 truncate flex-1">{chat.name || chat.id}</p>
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 bg-brand text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {chat.lastMessage || (chat.isGroup ? '👥 Group' : 'No messages')}
                </p>
                {chat.timestamp && (
                  <p className="text-xs text-gray-700 mt-0.5">
                    {new Date(chat.timestamp).toLocaleString()}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message view */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
              <span className="text-2xl">{selected.isGroup ? '👥' : '👤'}</span>
              <div>
                <p className="font-semibold text-white">{selected.name || selected.id}</p>
                <p className="text-xs text-gray-500 font-mono">{selected.id}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {msgLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : messages.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-10">No messages loaded</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl text-sm ${
                      m.fromMe
                        ? 'bg-brand text-black rounded-br-sm'
                        : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                    }`}>
                      <p>{m.body || <em className="opacity-50">({m.type})</em>}</p>
                      <p className={`text-xs mt-1 ${m.fromMe ? 'text-black/50' : 'text-gray-500'}`}>
                        {new Date(m.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-gray-500 text-sm">Select a chat to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
