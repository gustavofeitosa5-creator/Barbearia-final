import { useState, useEffect } from 'react';
import { Search, Clock, Scissors } from 'lucide-react';
import { fetchServicos } from '../lib/supabaseData';
import { formatCurrency, formatDuration } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { Servico } from '../types/database.types';

interface ServicosPageProps {
  onNavigate: (page: string) => void;
}

const TIPOS = ['Todos', 'Corte', 'Barba', 'Combo', 'Sobrancelha', 'Tratamento', 'Coloração'];

export function ServicosPage({ onNavigate }: ServicosPageProps) {
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [servicos, setServicos] = useState<Servico[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchServicos();
        if (mounted) setServicos(data);
      } catch (err) {
        if (mounted) setServicos([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = servicos.filter(s => {
    const matchSearch = s.nome.toLowerCase().includes(search.toLowerCase()) ||
      (s.descricao || '').toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoFiltro === 'Todos' || s.tipo === tipoFiltro;
    return matchSearch && matchTipo && s.ativo;
  });

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[#F9FAFB] mb-2">Nossos Serviços</h1>
          <p className="text-[#9CA3AF]">Escolha o serviço ideal para você</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Buscar serviços..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          {TIPOS.map(tipo => (
            <button
              key={tipo}
              onClick={() => setTipoFiltro(tipo)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                tipoFiltro === tipo
                  ? 'bg-[#D4A853] text-[#0F0F0F]'
                  : 'bg-[#1C1C1E] text-[#9CA3AF] border border-white/10 hover:border-white/20'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Scissors size={36} className="text-[#374151] mx-auto mb-3" />
            <p className="text-[#9CA3AF]">Nenhum serviço encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(servico => (
              <Card key={servico.id} hover>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-[#D4A853]/10 rounded-xl flex items-center justify-center">
                      <Scissors size={18} className="text-[#D4A853] rotate-[-45deg]" />
                    </div>
                    <Badge variant="default">{servico.tipo}</Badge>
                  </div>
                  <h3 className="font-semibold text-[#F9FAFB] mb-1">{servico.nome}</h3>
                  <p className="text-sm text-[#9CA3AF] leading-relaxed mb-4">{servico.descricao}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-[#D4A853]">{formatCurrency(servico.preco)}</p>
                      <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        {formatDuration(servico.duracao_minutos)}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => onNavigate('agendar')}>
                      Agendar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
