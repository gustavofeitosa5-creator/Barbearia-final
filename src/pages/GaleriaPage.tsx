import { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { fetchBarbeiros, fetchGaleria } from '../lib/supabaseData';
import type { Barbeiro, Galeria } from '../types/database.types';

interface GaleriaPageProps {
  onNavigate: (page: string) => void;
}

export function GaleriaPage({ onNavigate: _onNavigate }: GaleriaPageProps) {
  const [selectedImg, setSelectedImg] = useState<Galeria | null>(null);
  const [filterBarbeiro, setFilterBarbeiro] = useState<string>('todos');
  const [galeria, setGaleria] = useState<Galeria[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [galeriaData, barbeirosData] = await Promise.all([
          fetchGaleria(),
          fetchBarbeiros(),
        ]);
        if (mounted) {
          setGaleria(galeriaData);
          setBarbeiros(barbeirosData);
        }
      } catch (err) {
        if (mounted) {
          setGaleria([]);
          setBarbeiros([]);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const galleryItems = galeria.map(item => ({
    ...item,
    barbeiro: item.id_barbeiro ? barbeiros.find(b => b.id === item.id_barbeiro) : item.barbeiro,
  }));

  const filtered = galleryItems.filter(g =>
    filterBarbeiro === 'todos' || g.id_barbeiro === filterBarbeiro
  );

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[#F9FAFB] mb-2">Galeria de Cortes</h1>
          <p className="text-[#9CA3AF]">Inspire-se com nossos trabalhos realizados</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <button
            onClick={() => setFilterBarbeiro('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterBarbeiro === 'todos'
                ? 'bg-[#D4A853] text-[#0F0F0F]'
                : 'bg-[#1C1C1E] text-[#9CA3AF] border border-white/10'
            }`}
          >
            Todos
          </button>
          {barbeiros.map(b => (
            <button
              key={b.id}
              onClick={() => setFilterBarbeiro(b.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filterBarbeiro === b.id
                  ? 'bg-[#D4A853] text-[#0F0F0F]'
                  : 'bg-[#1C1C1E] text-[#9CA3AF] border border-white/10'
              }`}
            >
              <img src={b.foto_url} alt={b.nome} className="w-4 h-4 rounded-full object-cover" />
              {b.nome.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Masonry Grid */}
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {filtered.map(img => (
            <div
              key={img.id}
              className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl"
              onClick={() => setSelectedImg(img)}
            >
              <img
                src={img.imagem_url}
                alt={img.descricao || 'Corte'}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {img.barbeiro && (
                    <div className="flex items-center gap-2">
                      <img src={img.barbeiro.foto_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <p className="text-xs text-[#F9FAFB] font-medium">{img.barbeiro.nome.split(' ')[0]}</p>
                    </div>
                  )}
                  {img.descricao && (
                    <p className="text-xs text-[#9CA3AF] mt-1">{img.descricao}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImg(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            onClick={() => setSelectedImg(null)}
          >
            <X size={20} />
          </button>
          <div onClick={e => e.stopPropagation()} className="max-w-2xl w-full">
            <img
              src={selectedImg.imagem_url}
              alt={selectedImg.descricao}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
            {selectedImg.barbeiro && (
              <div className="flex items-center gap-3 mt-4">
                <img src={selectedImg.barbeiro.foto_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-medium text-[#F9FAFB]">{selectedImg.barbeiro.nome}</p>
                  {selectedImg.descricao && (
                    <p className="text-xs text-[#9CA3AF]">{selectedImg.descricao}</p>
                  )}
                </div>
              </div>
            )}
            {!selectedImg.barbeiro && selectedImg.descricao && (
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <User size={16} className="text-[#9CA3AF]" />
                </div>
                <p className="text-sm text-[#9CA3AF]">{selectedImg.descricao}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
