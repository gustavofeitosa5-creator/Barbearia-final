import { useEffect, useState } from 'react';
import { Bell, BellOff, Check, Calendar, AlertCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/supabaseData';
import { formatRelativeTime } from '../lib/utils';
import type { Notificacao } from '../types/database.types';


interface NotificacoesPageProps {
  onNavigate: (page: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  confirmacao: <Check size={14} className="text-emerald-400" />,
  lembrete: <Calendar size={14} className="text-blue-400" />,
  cancelamento: <AlertCircle size={14} className="text-red-400" />,
  mensagem: <MessageCircle size={14} className="text-[#D4A853]" />,
};

export function NotificacoesPage({ onNavigate: _onNavigate }: NotificacoesPageProps) {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setNotificacoes([]);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const notifications = await fetchNotifications(user.id);
        if (mounted) setNotificacoes(notifications);
      } catch (err) {
        if (mounted) setNotificacoes([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  const marcarTodasLidas = async () => {
    if (!user) return;
    try {
      await markAllNotificationsRead(user.id);
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    } catch {
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    }
  };

  const marcarLida = async (id: string) => {
    try {
      await markNotificationRead(id);
      const next = notificacoes.map(n => n.id === id ? { ...n, lida: true } : n);
      setNotificacoes(next);
    } catch {
      const next = notificacoes.map(n => n.id === id ? { ...n, lida: true } : n);
      setNotificacoes(next);
    }
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F9FAFB]">Notificações</h1>
            {naoLidas > 0 && (
              <p className="text-sm text-[#9CA3AF] mt-1">{naoLidas} não lidas</p>
            )}
          </div>
          {naoLidas > 0 && (
            <button
              onClick={marcarTodasLidas}
              className="text-xs text-[#D4A853] hover:text-[#E8C27A] transition-colors"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {notificacoes.length === 0 ? (
          <div className="text-center py-16">
            <BellOff size={40} className="text-[#374151] mx-auto mb-4" />
            <p className="text-[#9CA3AF]">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notificacoes.map(n => (
              <div
                key={n.id}
                onClick={() => marcarLida(n.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  n.lida
                    ? 'bg-[#1C1C1E] border-white/5 opacity-60'
                    : 'bg-[#1C1C1E] border-[#D4A853]/20 hover:border-[#D4A853]/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    n.lida ? 'bg-white/5' : 'bg-[#D4A853]/10'
                  }`}>
                    {ICON_MAP[n.tipo] || <Bell size={14} className="text-[#9CA3AF]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${n.lida ? 'text-[#9CA3AF]' : 'text-[#F9FAFB]'}`}>
                      {n.mensagem}
                    </p>
                    <p className="text-xs text-[#4B5563] mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                  {!n.lida && (
                    <div className="w-2 h-2 bg-[#D4A853] rounded-full mt-1.5 shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
