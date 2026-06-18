import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, X } from 'lucide-react';
import { fetchBarbeiros } from '../../lib/supabaseData';
import { formatDateTime, formatCurrency } from '../../lib/utils';
import { StatusBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

import type { Agendamento, Barbeiro } from '../../types/database.types';
import toast from 'react-hot-toast';

interface AdminAgendamentosProps {
  agendamentos: Agendamento[];
  onConfirmar: (id: string) => void;
  onCancelar: (id: string) => void;
}

export function AdminAgendamentos({ agendamentos, onConfirmar, onCancelar }: AdminAgendamentosProps) {
  const [search, setSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [barbeiroFiltro, setBarbeiroFiltro] = useState('todos');
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);

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

  const all = agendamentos;

  const filtered = all.filter(ag => {
    const matchSearch =
      ag.barbeiro?.nome.toLowerCase().includes(search.toLowerCase()) ||
      ag.servicos?.some(s => s.nome.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFiltro === 'todos' || ag.status === statusFiltro;
    const matchBarbeiro = barbeiroFiltro === 'todos' || ag.id_barbeiro === barbeiroFiltro;
    return matchSearch && matchStatus && matchBarbeiro;
  });

  const handleConfirmar = (id: string) => {
    onConfirmar(id);
    toast.success('Presença confirmada!');
  };

  const handleCancelar = (id: string) => {
    onCancelar(id);
    toast.success('Agendamento cancelado');
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-[#F9FAFB]">Agendamentos</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">{filtered.length} no total</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40"
            />
          </div>

          <div className="relative">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <select
              value={statusFiltro}
              onChange={e => setStatusFiltro(e.target.value)}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40 appearance-none"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <select
            value={barbeiroFiltro}
            onChange={e => setBarbeiroFiltro(e.target.value)}
            className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40 appearance-none"
          >
            <option value="todos">Todos os barbeiros</option>
            {barbeiros.map(b => (
              <option key={b.id} value={b.id}>{b.nome}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide px-5 py-3">Barbeiro</th>
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Serviços</th>
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide px-5 py-3">Data/Hora</th>
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide px-5 py-3 hidden md:table-cell">Total</th>
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(ag => (
                  <tr key={ag.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {ag.barbeiro?.foto_url && (
                          <img src={ag.barbeiro.foto_url} alt="" className="w-7 h-7 rounded-full object-cover hidden sm:block" />
                        )}
                        <span className="text-sm text-[#F9FAFB]">{ag.barbeiro?.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-sm text-[#9CA3AF]">
                        {ag.servicos?.map(s => s.nome).join(', ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-[#F9FAFB]">{formatDateTime(ag.data_hora)}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-[#D4A853] font-medium">
                        {ag.preco_total ? formatCurrency(ag.preco_total) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={ag.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {ag.status === 'pendente' && (
                          <button
                            onClick={() => handleConfirmar(ag.id)}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                            title="Confirmar"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {ag.status !== 'cancelado' && ag.status !== 'concluido' && (
                          <button
                            onClick={() => handleCancelar(ag.id)}
                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Cancelar"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[#6B7280] text-sm">
                Nenhum agendamento encontrado
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
