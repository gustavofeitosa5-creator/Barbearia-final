import { useEffect, useRef, useState } from 'react';
import { Send, Scissors } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchMessages, createMessage } from '../lib/supabaseData';
import { generateId } from '../lib/utils';
import type { Mensagem } from '../types/database.types';

interface ChatPageProps {
  onNavigate: (page: string) => void;
}

const INITIAL_MESSAGES: Mensagem[] = [
  {
    id: '1',
    id_usuario: 'admin1',
    conteudo: 'Olá! Seja bem-vindo à BarberPro. Como posso te ajudar?',
    de_admin: true,
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
];

const AUTO_RESPONSES = [
  'Claro! Vou verificar a disponibilidade para você.',
  'Pode deixar, vamos te atender da melhor forma!',
  'Nossos horários são de segunda a sábado, das 9h às 19h.',
  'Qualquer dúvida, estamos aqui para ajudar!',
  'Obrigado pelo contato. Em breve um de nossos profissionais entrará em contato.',
];

export function ChatPage({ onNavigate: _onNavigate }: ChatPageProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    if (!user) return;

    (async () => {
      try {
        const stored = await fetchMessages(user.id);
        if (!mounted) return;

        if (stored.length > 0) {
          setMessages(stored);
        } else {
          setMessages(INITIAL_MESSAGES);
          await createMessage({
            id: generateId(),
            id_usuario: user.id,
            conteudo: INITIAL_MESSAGES[0].conteudo,
            de_admin: true,
            created_at: INITIAL_MESSAGES[0].created_at,
          });
        }
      } catch (err) {
        if (mounted) setMessages(INITIAL_MESSAGES);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const msg: Mensagem = {
      id: generateId(),
      id_usuario: user.id,
      conteudo: input.trim(),
      de_admin: false,
      created_at: new Date().toISOString(),
    };
    const next = [...messages, msg];
    setMessages(next);
    await createMessage(msg);
    setInput('');

    setTimeout(async () => {
      const response: Mensagem = {
        id: generateId(),
        id_usuario: 'admin1',
        conteudo: AUTO_RESPONSES[Math.floor(Math.random() * AUTO_RESPONSES.length)],
        de_admin: true,
        created_at: new Date().toISOString(),
      };
      const updated = [...next, response];
      setMessages(updated);
      await createMessage(response);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-screen pt-16 pb-16 md:pb-0">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-[#1C1C1E] border-b border-white/8 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#D4A853] rounded-xl flex items-center justify-center">
          <Scissors size={18} className="text-[#0F0F0F] rotate-[-45deg]" />
        </div>
        <div>
          <p className="font-semibold text-[#F9FAFB] text-sm">BarberPro</p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span className="text-xs text-[#9CA3AF]">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.de_admin ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs sm:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.de_admin
                  ? 'bg-[#1C1C1E] text-[#F9FAFB] rounded-tl-sm border border-white/8'
                  : 'bg-[#D4A853] text-[#0F0F0F] rounded-tr-sm font-medium'
              }`}
            >
              {msg.conteudo}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/8 bg-[#0F0F0F]">
        <div className="flex items-center gap-3 bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-transparent text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-8 h-8 bg-[#D4A853] rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E8C27A] transition-colors"
          >
            <Send size={14} className="text-[#0F0F0F]" />
          </button>
        </div>
      </div>
    </div>
  );
}
