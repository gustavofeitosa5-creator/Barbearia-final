import { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { fetchBarbeiros } from '../../lib/supabaseData';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { StatusBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import type { Agendamento, Barbeiro } from '../../types/database.types';

interface AdminDashboardProps {
  agendamentos: Agendamento[];
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ agendamentos, onNavigate }: AdminDashboardProps) {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const all = agendamentos;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchBarbeiros();
        if (mounted) setBarbeiros(data);
      } catch (err) {
        if (mounted) setBarbeiros([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const faturamento = all
    .filter(a => a.status === 'confirmado' || a.status === 'concluido')
    .reduce((acc, a) => acc + (a.preco_total || 0), 0);

  const confirmados = all.filter(a => a.status === 'confirmado').length;
  const pendentes = all.filter(a => a.status === 'pendente').length;
  const cancelados = all.filter(a => a.status === 'cancelado').length;

  const hoje = all.filter(a => {
    const d = new Date(a.data_hora);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const stats = [
    { label: 'Faturamento', value: formatCurrency(faturamento), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Total Agend.', value: String(all.length), icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Barbeiros', value: String(barbeiros.length), icon: Users, color: 'text-[#D4A853]', bg: 'bg-[#D4A853]/10' },
    { label: 'Hoje', value: String(hoje.length), icon: Clock, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-[#F9FAFB]">Dashboard</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Visão geral do negócio</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <Card key={s.label}>
              <div className="p-4">
                <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <p className="text-xl font-bold text-[#F9FAFB]">{s.value}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Confirmados', value: confirmados, icon: CheckCircle, color: 'text-emerald-400' },
            { label: 'Pendentes', value: pendentes, icon: AlertCircle, color: 'text-amber-400' },
            { label: 'Cancelados', value: cancelados, icon: XCircle, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1C1C1E] border border-white/8 rounded-xl p-4 flex items-center gap-3">
              <s.icon size={22} className={s.color} />
              <div>
                <p className="text-lg font-bold text-[#F9FAFB]">{s.value}</p>
                <p className="text-xs text-[#9CA3AF]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Agendamentos', page: 'admin-agendamentos' },
            { label: 'Galeria', page: 'admin-galeria' },
            { label: 'Barbeiros', page: 'admin-barbeiros' },
            { label: 'Serviços', page: 'admin-servicos' },
            { label: 'Promoções', page: 'admin-promocoes' },
          ].map(a => (
            <button
              key={a.page}
              onClick={() => onNavigate(a.page)}
              className="bg-[#1C1C1E] border border-white/8 rounded-xl p-4 text-sm font-medium text-[#F9FAFB] hover:border-[#D4A853]/30 hover:bg-[#D4A853]/5 transition-all duration-200"
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Faturamento por Barbeiro */}
        <Card className="mb-6">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-[#D4A853]" />
              <h2 className="font-semibold text-[#F9FAFB]">Faturamento por Barbeiro</h2>
            </div>
            <div className="space-y-3">
              {barbeiros.map(b => {
                const total = all
                  .filter(a => a.id_barbeiro === b.id && (a.status === 'confirmado' || a.status === 'concluido'))
                  .reduce((acc, a) => acc + (a.preco_total || 0), 0);
                const pct = faturamento > 0 ? (total / faturamento) * 100 : 0;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <img src={b.foto_url} alt={b.nome} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-[#F9FAFB]">{b.nome}</span>
                      </div>
                      <span className="text-[#D4A853] font-medium">{formatCurrency(total)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D4A853] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Recent Appointments */}
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#F9FAFB]">Agendamentos Recentes</h2>
              <button
                onClick={() => onNavigate('admin-agendamentos')}
                className="text-xs text-[#D4A853] hover:text-[#E8C27A]"
              >
                Ver todos
              </button>
            </div>
            <div className="space-y-3">
              {all.slice(0, 5).map(ag => (
                <div key={ag.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    {ag.barbeiro?.foto_url && (
                      <img src={ag.barbeiro.foto_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#F9FAFB]">{ag.barbeiro?.nome}</p>
                      <p className="text-xs text-[#9CA3AF]">{formatDateTime(ag.data_hora)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#D4A853] font-medium hidden sm:block">
                      {ag.preco_total ? formatCurrency(ag.preco_total) : '—'}
                    </span>
                    <StatusBadge status={ag.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
