import { useState } from 'react';
import { Calendar, Clock, Scissors, Star, RotateCcw, X, CheckCircle } from 'lucide-react';
import { formatDateTime, formatCurrency, formatRelativeTime } from '../lib/utils';
import { StatusBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StarRating } from '../components/ui/StarRating';
import type { Agendamento } from '../types/database.types';
import toast from 'react-hot-toast';

interface HistoricoPageProps {
  agendamentos: Agendamento[];
  onNavigate: (page: string) => void;
  onCancelar: (id: string) => void;
}

type Tab = 'proximos' | 'passados' | 'cancelados';

export function HistoricoPage({ agendamentos, onNavigate, onCancelar }: HistoricoPageProps) {
  const [tab, setTab] = useState<Tab>('proximos');
  const [avaliacaoModal, setAvaliacaoModal] = useState<Agendamento | null>(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [cancelModal, setCancelModal] = useState<string | null>(null);

  const now = new Date();

  const proximos = agendamentos.filter(
    a => new Date(a.data_hora) > now && a.status !== 'cancelado'
  );
  const passados = agendamentos.filter(
    a => new Date(a.data_hora) <= now && a.status !== 'cancelado'
  );
  const cancelados = agendamentos.filter(a => a.status === 'cancelado');

  const getList = () => {
    if (tab === 'proximos') return proximos;
    if (tab === 'passados') return passados;
    return cancelados;
  };

  const handleCancelar = (id: string) => {
    onCancelar(id);
    setCancelModal(null);
    toast.success('Agendamento cancelado');
  };

  const handleAvaliar = () => {
    toast.success('Avaliação enviada! Obrigado pelo feedback.');
    setAvaliacaoModal(null);
    setNota(5);
    setComentario('');
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'proximos', label: 'Próximos', count: proximos.length },
    { key: 'passados', label: 'Histórico', count: passados.length },
    { key: 'cancelados', label: 'Cancelados', count: cancelados.length },
  ];

  const list = getList();

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-[#F9FAFB]">Meus Agendamentos</h1>
          <Button size="sm" onClick={() => onNavigate('agendar')}>
            <Calendar size={14} />
            Novo
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#1C1C1E] rounded-xl p-1 mb-6 border border-white/8 gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                tab === t.key
                  ? 'bg-[#D4A853] text-[#0F0F0F]'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-[#0F0F0F]/20' : 'bg-white/10'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {list.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={40} className="text-[#374151] mx-auto mb-4" />
            <p className="text-[#9CA3AF] font-medium">Nenhum agendamento aqui</p>
            {tab === 'proximos' && (
              <Button variant="outline" className="mt-4" onClick={() => onNavigate('agendar')}>
                Fazer agendamento
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(ag => (
              <AgendamentoCard
                key={ag.id}
                agendamento={ag}
                tab={tab}
                onReagendar={() => onNavigate('agendar')}
                onCancelar={() => setCancelModal(ag.id)}
                onAvaliar={() => setAvaliacaoModal(ag)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <Modal
        open={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Cancelar agendamento"
        size="sm"
      >
        <p className="text-[#9CA3AF] text-sm mb-5">
          Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setCancelModal(null)}>
            Voltar
          </Button>
          <Button variant="danger" fullWidth onClick={() => cancelModal && handleCancelar(cancelModal)}>
            <X size={14} />
            Cancelar agendamento
          </Button>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        open={!!avaliacaoModal}
        onClose={() => setAvaliacaoModal(null)}
        title="Avaliar atendimento"
        size="sm"
      >
        {avaliacaoModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white/3 rounded-xl">
              <img
                src={avaliacaoModal.barbeiro?.foto_url}
                alt={avaliacaoModal.barbeiro?.nome}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-[#F9FAFB]">{avaliacaoModal.barbeiro?.nome}</p>
                <p className="text-xs text-[#9CA3AF]">{formatDateTime(avaliacaoModal.data_hora)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-[#F9FAFB] mb-3">Sua nota</p>
              <div className="flex items-center gap-2">
                <StarRating
                  rating={nota}
                  size={28}
                  interactive
                  onChange={setNota}
                />
                <span className="text-lg font-bold text-[#D4A853]">{nota}/5</span>
              </div>
            </div>

            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Conte como foi seu atendimento (opcional)..."
              rows={3}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40 resize-none"
            />

            <Button fullWidth onClick={handleAvaliar}>
              <Star size={14} />
              Enviar avaliação
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AgendamentoCard({
  agendamento,
  tab,
  onReagendar,
  onCancelar,
  onAvaliar,
}: {
  agendamento: Agendamento;
  tab: Tab;
  onReagendar: () => void;
  onCancelar: () => void;
  onAvaliar: () => void;
}) {
  return (
    <Card>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {agendamento.barbeiro?.foto_url && (
              <img
                src={agendamento.barbeiro.foto_url}
                alt={agendamento.barbeiro.nome}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-medium text-[#F9FAFB] text-sm">{agendamento.barbeiro?.nome}</p>
              <p className="text-xs text-[#9CA3AF]">
                {agendamento.servicos?.map(s => s.nome).join(', ')}
              </p>
            </div>
          </div>
          <StatusBadge status={agendamento.status} />
        </div>

        {/* Info */}
        <div className="flex items-center gap-4 text-xs text-[#9CA3AF] mb-3">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDateTime(agendamento.data_hora).split(' às ')[0]}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDateTime(agendamento.data_hora).split(' às ')[1]}
          </span>
          <span className="ml-auto text-[#D4A853] font-medium">
            {agendamento.preco_total ? formatCurrency(agendamento.preco_total) : '—'}
          </span>
        </div>

        <p className="text-xs text-[#4B5563]">{formatRelativeTime(agendamento.created_at)}</p>

        {/* Actions */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
          {tab === 'proximos' && (
            <>
              <Button variant="ghost" size="sm" onClick={onReagendar}>
                <RotateCcw size={13} />
                Reagendar
              </Button>
              <Button variant="danger" size="sm" onClick={onCancelar}>
                <X size={13} />
                Cancelar
              </Button>
            </>
          )}
          {tab === 'passados' && agendamento.status === 'concluido' && (
            <Button variant="outline" size="sm" onClick={onAvaliar}>
              <Star size={13} />
              Avaliar
            </Button>
          )}
          {tab === 'passados' && agendamento.status === 'confirmado' && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle size={12} />
              Atendimento confirmado
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto text-xs text-[#6B7280]">
            <Scissors size={11} />
            {agendamento.servicos?.length} serviço(s)
          </div>
        </div>
      </div>
    </Card>
  );
}
