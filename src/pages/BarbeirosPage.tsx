import { useState, useEffect } from 'react';
import { Search, Scissors, MessageCircle } from 'lucide-react';
import { fetchBarbeiros, fetchAvaliacoes } from '../lib/supabaseData';
import { StarRating } from '../components/ui/StarRating';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { Barbeiro, Avaliacao } from '../types/database.types';

interface BarbeirosPageProps {
  onNavigate: (page: string) => void;
}

export function BarbeirosPage({ onNavigate }: BarbeirosPageProps) {
  const [search, setSearch] = useState('');
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [data, avaliacoesData] = await Promise.all([fetchBarbeiros(), fetchAvaliacoes(2)]);
        if (mounted) {
          setBarbeiros(data);
          setAvaliacoes(avaliacoesData);
        }
      } catch (err) {
        if (mounted) {
          setBarbeiros([]);
          setAvaliacoes([]);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = barbeiros.filter(b =>
    b.nome.toLowerCase().includes(search.toLowerCase()) ||
    (b.especialidade || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[#F9FAFB] mb-2">Nossa Equipe</h1>
          <p className="text-[#9CA3AF]">Conheça nossos profissionais especializados</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Buscar por nome ou especialidade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40"
          />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5">
          {filtered.map(barbeiro => (
            <Card key={barbeiro.id}>
              <div className="p-5">
                <div className="flex items-start gap-5">
                  <div className="relative shrink-0">
                    <img
                      src={barbeiro.foto_url}
                      alt={barbeiro.nome}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#D4A853] rounded-xl flex items-center justify-center">
                      <Scissors size={12} className="text-[#0F0F0F] rotate-[-45deg]" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-[#F9FAFB] text-lg">{barbeiro.nome}</h3>
                        <p className="text-sm text-[#9CA3AF]">{barbeiro.especialidade}</p>
                      </div>
                      <Badge variant="gold">Profissional</Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <StarRating rating={Math.round(barbeiro.avaliacao_media || 0)} size={14} />
                      <span className="text-sm font-medium text-[#D4A853]">{barbeiro.avaliacao_media}</span>
                      <span className="text-sm text-[#6B7280]">({barbeiro.total_avaliacoes} avaliações)</span>
                    </div>

                    {barbeiro.bio && (
                      <p className="text-sm text-[#9CA3AF] mt-2 leading-relaxed">{barbeiro.bio}</p>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => onNavigate('agendar')}>
                        <Scissors size={13} />
                        Agendar
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => onNavigate('chat')}>
                        <MessageCircle size={13} />
                        Mensagem
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Reviews Preview */}
                <div className="mt-5 pt-4 border-t border-white/8">
                  <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-3">Avaliações recentes</p>
                  <div className="space-y-2">
                    {avaliacoes.slice(0, 2).map((av, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#D4A853]/20 flex items-center justify-center shrink-0">
                          <MessageCircle size={10} className="text-[#D4A853]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <StarRating rating={av.nota} size={10} />
                          </div>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">"{av.comentario}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
