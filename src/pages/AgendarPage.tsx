import { useState, useEffect } from 'react';
import { ChevronRight, Check, Clock, User, Calendar, Scissors, AlertCircle, ChevronLeft } from 'lucide-react';
import { fetchBarbeiros, fetchServicos, fetchIndisponibilidades, createAgendamento } from '../lib/supabaseData';
import { formatCurrency, formatDuration, formatDate, formatDateMask, formatDateToSql, getHorariosDisponiveis } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StarRating } from '../components/ui/StarRating';
import { Textarea } from '../components/ui/Input';
import type { AgendamentoStep, Barbeiro, Servico, Agendamento, BarbeiroIndisponibilidade } from '../types/database.types';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface AgendarPageProps {
  onNavigate: (page: string) => void;
  onAgendamentoCriado: (ag: Agendamento) => void;
}

const STEPS = ['Barbeiro', 'Serviço', 'Data', 'Horário', 'Confirmar'];

export function AgendarPage({ onNavigate, onAgendamentoCriado }: AgendarPageProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<AgendamentoStep>({ servicos: [] });
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [indisponibilidades, setIndisponibilidades] = useState<BarbeiroIndisponibilidade[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [barbeirosData, servicosData, indisponibilidadesData] = await Promise.all([
          fetchBarbeiros(),
          fetchServicos(),
          fetchIndisponibilidades(),
        ]);
        if (!mounted) return;
        setBarbeiros(barbeirosData);
        setServicos(servicosData);
        setIndisponibilidades(indisponibilidadesData);
      } catch (err) {
        if (!mounted) return;
        setBarbeiros([]);
        setServicos([]);
        setIndisponibilidades([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const totalDuracao = state.servicos.reduce((acc, s) => acc + s.duracao_minutos, 0);
  const totalPreco = state.servicos.reduce((acc, s) => acc + s.preco, 0);

  const dateSql = state.data ? formatDateToSql(state.data) : null;
  const horarios = dateSql
    ? getHorariosDisponiveis(
        dateSql,
        totalDuracao || 30,
        indisponibilidades.filter(item => item.id_barbeiro === state.barbeiro?.id),
      )
    : [];

  const minDate = new Date();
  minDate.setDate(minDate.getDate());

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);

  const canNext = () => {
    if (step === 0) return !!state.barbeiro;
    if (step === 1) return state.servicos.length > 0;
    if (step === 2) return !!state.data && !!formatDateToSql(state.data);
    if (step === 3) return !!state.hora;
    return true;
  };

  const handleConfirm = async () => {
    if (!user || !state.barbeiro || !state.data || !state.hora) return;
    const dateSql = formatDateToSql(state.data);
    if (!dateSql) {
      toast.error('Data inválida. Use DD/MM/AAAA.');
      return;
    }
    setLoading(true);

    await new Promise(r => setTimeout(r, 1000));

    if (!user) {
      toast.error('Usuário não autenticado.');
      setLoading(false);
      return;
    }

    try {
      const agendamento = await createAgendamento({
        id_usuario: user.id,
        id_barbeiro: state.barbeiro.id,
        data_hora: `${dateSql}T${state.hora}:00`,
        status: 'pendente',
        observacao: state.observacao,
        preco_total: totalPreco,
        servicos: state.servicos,
        barbeiro: state.barbeiro,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      onAgendamentoCriado(agendamento);
      toast.success('Agendamento criado com sucesso!');
      setLoading(false);
      onNavigate('historico');
    } catch (error: any) {
      console.error('createAgendamento error', error);
      toast.error(error?.message || 'Não foi possível criar o agendamento.');
      setLoading(false);
    }
  };

  const toggleServico = (s: Servico) => {
    setState(prev => ({
      ...prev,
      servicos: prev.servicos.find(x => x.id === s.id)
        ? prev.servicos.filter(x => x.id !== s.id)
        : [...prev.servicos, s],
      hora: undefined,
    }));
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl font-bold text-[#F9FAFB]">Novo Agendamento</h1>
            <span className="text-sm text-[#9CA3AF]">{step + 1} / {STEPS.length}</span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((_s, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-[#D4A853]' : i === step ? 'bg-[#D4A853]/60' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <div className="flex mt-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1">
                <p className={`text-[10px] text-center transition-colors ${i <= step ? 'text-[#D4A853]' : 'text-[#4B5563]'}`}>
                  {s}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[350px]">
          {/* Step 0: Choose Barber */}
          {step === 0 && (
            <div className="space-y-3 page-enter">
              <h2 className="text-lg font-semibold text-[#F9FAFB] flex items-center gap-2">
                <User size={18} className="text-[#D4A853]" />
                Escolha o barbeiro
              </h2>
              {barbeiros.map(b => (
                <BarbeiroCard
                  key={b.id}
                  barbeiro={b}
                  selected={state.barbeiro?.id === b.id}
                  onClick={() => setState(p => ({ ...p, barbeiro: b, hora: undefined }))}
                />
              ))}
            </div>
          )}

          {/* Step 1: Choose Services */}
          {step === 1 && (
            <div className="space-y-3 page-enter">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#F9FAFB] flex items-center gap-2">
                  <Scissors size={18} className="text-[#D4A853]" />
                  Escolha os serviços
                </h2>
                <span className="text-xs text-[#9CA3AF]">Múltiplos permitidos</span>
              </div>
              {servicos.filter(s => s.ativo).map(s => (
                <ServicoCard
                  key={s.id}
                  servico={s}
                  selected={state.servicos.some(x => x.id === s.id)}
                  onClick={() => toggleServico(s)}
                />
              ))}
              {state.servicos.length > 0 && (
                <div className="mt-4 p-4 bg-[#D4A853]/5 border border-[#D4A853]/20 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">Total estimado</span>
                    <span className="text-[#D4A853] font-bold">{formatCurrency(totalPreco)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-[#9CA3AF]">Duração total</span>
                    <span className="text-[#F9FAFB]">{formatDuration(totalDuracao)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Choose Date */}
          {step === 2 && (
            <div className="page-enter">
              <h2 className="text-lg font-semibold text-[#F9FAFB] flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-[#D4A853]" />
                Escolha a data
              </h2>
              <div className="bg-[#1C1C1E] border border-white/10 rounded-xl p-5">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="DD/MM/AAAA"
                  value={state.data || ''}
                  onChange={e => setState(p => ({ ...p, data: formatDateMask(e.target.value), hora: undefined }))}
                  className="w-full bg-transparent text-[#F9FAFB] text-lg focus:outline-none"
                />
              </div>
              {state.data && dateSql && (
                <p className="mt-3 text-sm text-[#9CA3AF] flex items-center gap-2">
                  <AlertCircle size={14} className="text-[#D4A853]" />
                  {formatDate(dateSql)} — horários disponíveis: {horarios.length}
                </p>
              )}
              {state.data && !dateSql && (
                <p className="mt-3 text-sm text-[#F59E0B] flex items-center gap-2">
                  <AlertCircle size={14} className="text-[#F59E0B]" />
                  Data inválida. Use DD/MM/AAAA.
                </p>
              )}
            </div>
          )}

          {/* Step 3: Choose Time */}
          {step === 3 && (
            <div className="page-enter">
              <h2 className="text-lg font-semibold text-[#F9FAFB] flex items-center gap-2 mb-4">
                <Clock size={18} className="text-[#D4A853]" />
                Escolha o horário
              </h2>
              {horarios.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle size={36} className="text-[#6B7280] mx-auto mb-3" />
                  <p className="text-[#9CA3AF]">Sem horários disponíveis para esta data</p>
                  <Button variant="ghost" className="mt-4" onClick={() => setStep(2)}>
                    Escolher outra data
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {horarios.map(h => (
                    <button
                      key={h}
                      onClick={() => setState(p => ({ ...p, hora: h }))}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        state.hora === h
                          ? 'bg-[#D4A853] text-[#0F0F0F]'
                          : 'bg-[#1C1C1E] text-[#F9FAFB] hover:bg-[#D4A853]/20 border border-white/8'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="page-enter space-y-4">
              <h2 className="text-lg font-semibold text-[#F9FAFB]">Confirmar agendamento</h2>

              <Card>
                <div className="p-4 space-y-3">
                  <InfoRow icon={<User size={15} />} label="Barbeiro" value={state.barbeiro?.nome || ''} />
                  <InfoRow
                    icon={<Scissors size={15} />}
                    label="Serviços"
                    value={state.servicos.map(s => s.nome).join(', ')}
                  />
                  <InfoRow
                    icon={<Calendar size={15} />}
                    label="Data"
                    value={state.data ? formatDate(state.data) : ''}
                  />
                  <InfoRow icon={<Clock size={15} />} label="Horário" value={state.hora || ''} />
                  <div className="pt-3 border-t border-white/8 flex justify-between">
                    <span className="text-sm text-[#9CA3AF]">Total</span>
                    <span className="text-[#D4A853] font-bold">{formatCurrency(totalPreco)}</span>
                  </div>
                </div>
              </Card>

              <Textarea
                label="Observação (opcional)"
                placeholder="Alguma preferência ou informação adicional..."
                rows={3}
                value={state.observacao || ''}
                onChange={e => setState(p => ({ ...p, observacao: e.target.value }))}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1 sm:flex-none">
              <ChevronLeft size={16} />
              Voltar
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex-1"
            >
              Próximo
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              loading={loading}
              className="flex-1"
            >
              <Check size={16} />
              Confirmar Agendamento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function BarbeiroCard({ barbeiro, selected, onClick }: { barbeiro: Barbeiro; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
        selected
          ? 'border-[#D4A853]/50 bg-[#D4A853]/5'
          : 'border-white/8 bg-[#1C1C1E] hover:border-white/15'
      }`}
    >
      {barbeiro.foto_url ? (
        <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-12 h-12 rounded-full object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-sm text-[#D4A853]">
          {barbeiro.nome.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <p className="font-medium text-[#F9FAFB]">{barbeiro.nome}</p>
        <p className="text-xs text-[#9CA3AF]">{barbeiro.especialidade}</p>
        <div className="flex items-center gap-1 mt-1">
          <StarRating rating={Math.round(barbeiro.avaliacao_media || 0)} size={11} />
          <span className="text-xs text-[#6B7280]">({barbeiro.total_avaliacoes})</span>
        </div>
      </div>
      {selected && <Check size={18} className="text-[#D4A853] shrink-0" />}
    </button>
  );
}

function ServicoCard({ servico, selected, onClick }: { servico: Servico; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
        selected
          ? 'border-[#D4A853]/50 bg-[#D4A853]/5'
          : 'border-white/8 bg-[#1C1C1E] hover:border-white/15'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? 'bg-[#D4A853]/20' : 'bg-white/5'}`}>
        <Scissors size={16} className={selected ? 'text-[#D4A853]' : 'text-[#6B7280]'} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-[#F9FAFB] text-sm">{servico.nome}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
            <Clock size={10} />
            {formatDuration(servico.duracao_minutos)}
          </span>
          <span className="text-xs text-[#9CA3AF]">{servico.tipo}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[#D4A853] font-bold text-sm">{formatCurrency(servico.preco)}</p>
        {selected && <Check size={14} className="text-[#D4A853] ml-auto mt-1" />}
      </div>
    </button>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[#D4A853] mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 flex justify-between gap-4">
        <span className="text-sm text-[#9CA3AF]">{label}</span>
        <span className="text-sm text-[#F9FAFB] font-medium text-right">{value}</span>
      </div>
    </div>
  );
}
