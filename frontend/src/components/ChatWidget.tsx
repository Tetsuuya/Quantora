// src/components/ChatWidget.tsx
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { api } from '../api/client';

const SESSION_KEY = 'quantora_chat_session';
function getSession() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { id = `sess_${Date.now()}`; localStorage.setItem(SESSION_KEY, id); }
  return id;
}

interface Msg { role: 'user' | 'ai'; text: string; }

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: '👋 Hi! I\'m Quantora AI — your inventory assistant. Ask me anything about your stock levels, reorder suggestions, or supplier recommendations!' }
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = getSession();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setThinking(true);
    try {
      const res = await api.sendMessage(text, sessionId);
      setMessages(prev => [...prev, { role: 'ai', text: res.reply || res.message || '...' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Sorry, I had trouble connecting. Please try again.' }]);
    } finally {
      setThinking(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-avatar">🤖</div>
            <div>
              <div className="chat-header-name">Quantora AI Assistant</div>
              <div className="chat-header-status">● Powered by Groq · Always available</div>
            </div>
            <button style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpen(false)}>
              <X size={14} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
                {msg.role === 'ai' && <div className="chat-msg-avatar"><Bot size={14} color="var(--primary)" /></div>}
                <div className="chat-bubble" style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
              </div>
            ))}
            {thinking && (
              <div className="chat-msg ai">
                <div className="chat-msg-avatar"><Bot size={14} color="var(--primary)" /></div>
                <div className="chat-bubble">
                  <div className="chat-typing">
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 var(--sp-4) var(--sp-2)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['What\'s low on stock?', 'Which products are out?', 'Recommend a reorder'].map(q => (
                <button key={q} style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  onClick={() => { setInput(q); setTimeout(send, 50); }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-area">
            <textarea ref={inputRef} className="chat-input" rows={1} placeholder="Ask about inventory, stock levels..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
            <button className="chat-send-btn" onClick={send} disabled={!input.trim() || thinking}>
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button className="chat-toggle" onClick={() => setOpen(o => !o)} aria-label="Open AI Chat">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
