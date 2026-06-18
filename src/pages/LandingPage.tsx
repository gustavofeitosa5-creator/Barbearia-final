import { useState, useEffect } from 'react';
import { Calendar, ChevronRight, Award, Clock, Scissors, ChevronLeft } from 'lucide-react';
import { fetchBarbeiros, fetchServicos, fetchPromocoes, fetchAvaliacoes } from '../lib/supabaseData';
import { formatCurrency, formatDuration } from '../lib/utils';
import { StarRating } from '../components/ui/StarRating';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import type { Barbeiro, Servico, Promocao, Avaliacao } from '../types/database.types';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { user } = useAuth();
  const [promoIndex, setPromoIndex] = useState(0);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [barbeirosData, servicosData, promocoesData, avaliacoesData] = await Promise.all([
          fetchBarbeiros(),
          fetchServicos(),
          fetchPromocoes(),
          fetchAvaliacoes(3),
        ]);
        if (mounted) {
          setBarbeiros(barbeirosData);
          setServicos(servicosData);
          setPromocoes(promocoesData);
          setAvaliacoes(avaliacoesData);
        }
      } catch (err) {
        // ignore and keep empty state until data loads
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const activePromos = promocoes.filter((p: any) => p.ativa);

  useEffect(() => {
    if (activePromos.length <= 1) return;
    const interval = setInterval(() => {
      setPromoIndex(i => (i + 1) % activePromos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activePromos.length]);

  const promo = activePromos[promoIndex];

  return (
    <div className="min-h-screen page-enter">
      {/* Hero */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#D4A853]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#D4A853]/3 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#D4A853]/10 border border-[#D4A853]/20 rounded-full text-xs text-[#D4A853] font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-[#D4A853] rounded-full animate-pulse" />
            Agendamento rápido e fácil
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-[#F9FAFB] leading-tight mb-4">
            Seu estilo,<br />
            <span className="text-[#D4A853]">sua identidade</span>
          </h1>

          <p className="text-lg text-[#9CA3AF] max-w-xl mx-auto mb-8 leading-relaxed">
            Agende com os melhores profissionais. Cortes precisos, barba impecável — tudo com um clique.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => onNavigate(user ? 'agendar' : 'login')}
            >
              <Calendar size={18} />
              Agendar Agora
            </Button>
            <Button variant="secondary" size="lg" onClick={() => onNavigate('servicos')}>
              Ver Serviços
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            {[
              { title: 'Profissionais experientes', description: 'Barbeiros qualificados para um corte personalizado.' },
              { title: 'Atendimento confiável', description: 'Agendamento seguro e acompanhamento de reservas.' },
              { title: 'Estilo moderno', description: 'Serviços atualizados para todas as tendências.' },
            ].map(stat => (
              <div key={stat.title} className="rounded-3xl p-5 bg-[#141414]/80 border border-white/10">
                <p className="text-base font-semibold text-[#F9FAFB] mb-2">{stat.title}</p>
                <p className="text-sm text-[#9CA3AF]">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotions Banner */}
      {activePromos.length > 0 && promo && (
        <section className="px-4 mb-12">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-r from-[#1C1C1E] to-[#222224] border border-[#D4A853]/20 rounded-2xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A853]/5 rounded-full blur-2xl" />

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={14} className="text-[#D4A853]" />
                    <span className="text-xs text-[#D4A853] font-medium uppercase tracking-wide">Promoção</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#F9FAFB] font-display mb-1">{promo.titulo}</h3>
                  <p className="text-sm text-[#9CA3AF]">{promo.descricao}</p>
                  {promo.desconto_percentual && (
                    <div className="mt-3 inline-flex items-center gap-1 bg-[#D4A853] text-[#0F0F0F] text-sm font-bold px-3 py-1 rounded-full">
                      {promo.desconto_percentual}% OFF
                    </div>
                  )}
                </div>

                {activePromos.length > 1 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <button
                      onClick={() => setPromoIndex(i => (i - 1 + activePromos.length) % activePromos.length)}
                      className="p-1 rounded-lg text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex gap-1">
                      {activePromos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPromoIndex(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === promoIndex ? 'bg-[#D4A853]' : 'bg-white/20'}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setPromoIndex(i => (i + 1) % activePromos.length)}
                      className="p-1 rounded-lg text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-[#F9FAFB]">Serviços</h2>
            <button
              onClick={() => onNavigate('servicos')}
              className="text-sm text-[#D4A853] hover:text-[#E8C27A] flex items-center gap-1 transition-colors"
            >
              Ver todos <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {servicos.slice(0, 6).map((servico: any) => (
              <Card key={servico.id} hover onClick={() => onNavigate(user ? 'agendar' : 'login')}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-[#F9FAFB] text-sm">{servico.nome}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">{servico.descricao}</p>
                    </div>
                    <div className="ml-3 flex items-center gap-1 text-[#6B7280] shrink-0">
                      <Clock size={12} />
                      <span className="text-xs">{formatDuration(servico.duracao_minutos)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[#D4A853] font-bold">{formatCurrency(servico.preco)}</span>
                    <span className="text-xs text-[#6B7280] bg-white/5 px-2 py-0.5 rounded-full">{servico.tipo}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Barbers */}
      <section className="px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-[#F9FAFB]">Nossa Equipe</h2>
            <button
              onClick={() => onNavigate('barbeiros')}
              className="text-sm text-[#D4A853] hover:text-[#E8C27A] flex items-center gap-1 transition-colors"
            >
              Ver todos <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {barbeiros.map((barbeiro: any) => (
              <Card key={barbeiro.id} hover onClick={() => onNavigate('barbeiros')}>
                <div className="p-5 text-center">
                  <div className="relative mx-auto mb-3 w-20 h-20">
                    {barbeiro.foto_url ? (
                      <img
                        src={barbeiro.foto_url}
                        alt={barbeiro.nome}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl text-[#D4A853]">
                        {barbeiro.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#D4A853] rounded-full flex items-center justify-center">
                      <Scissors size={10} className="text-[#0F0F0F] rotate-[-45deg]" />
                    </div>
                  </div>
                  <p className="font-semibold text-[#F9FAFB] text-sm">{barbeiro.nome}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{barbeiro.especialidade}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <StarRating rating={Math.round(barbeiro.avaliacao_media || 0)} size={12} />
                    <span className="text-xs text-[#9CA3AF]">{barbeiro.avaliacao_media}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-[#F9FAFB] mb-6">O que dizem</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {avaliacoes.map((av, i) => (
              <Card key={i}>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#D4A853]/20 flex items-center justify-center">
                      <span className="text-sm text-[#D4A853]">★</span>
                    </div>
                    <StarRating rating={av.nota} size={13} />
                  </div>
                  <p className="text-sm text-[#9CA3AF] italic leading-relaxed">"{av.comentario}"</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 md:pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#D4A853]/10 to-[#D4A853]/5 border border-[#D4A853]/20 rounded-2xl p-8 text-center">
            <Scissors size={32} className="text-[#D4A853] mx-auto mb-4 rotate-[-45deg]" />
            <h2 className="font-display text-2xl font-bold text-[#F9FAFB] mb-2">Pronto para seu novo visual?</h2>
            <p className="text-[#9CA3AF] mb-6">Agende agora em menos de 2 minutos</p>
            <Button size="lg" onClick={() => onNavigate(user ? 'agendar' : 'login')}>
              <Calendar size={18} />
              Agendar Horário
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
