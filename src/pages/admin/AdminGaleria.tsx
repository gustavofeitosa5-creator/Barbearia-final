import { ChangeEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { generateId } from '../../lib/utils';
import { fetchBarbeiros, uploadToBucket, createGaleria as createGaleriaDb, fetchGaleria as fetchGaleriaDb, deleteGaleria as deleteGaleriaDb } from '../../lib/supabaseData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import type { Barbeiro, Galeria } from '../../types/database.types';

export function AdminGaleria() {
  const [galeria, setGaleria] = useState<Galeria[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [descricao, setDescricao] = useState('');
  const [barbeiroId, setBarbeiroId] = useState<string>('');
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [g, b] = await Promise.all([fetchGaleriaDb(), fetchBarbeiros()]);
        if (!mounted) return;
        setGaleria(g || []);
        setBarbeiros(b || []);
      } catch {
        if (!mounted) return;
        setGaleria([]);
        setBarbeiros([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!barbeiroId && barbeiros.length > 0) {
      setBarbeiroId(barbeiros[0].id);
    }
  }, [barbeiros, barbeiroId]);

  useEffect(() => {
    if (!imagemFile) {
      setPreviewUrl('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(imagemFile);

    return () => {
      setPreviewUrl('');
    };
  }, [imagemFile]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImagemFile(file);
  };

  const handleAdicionar = async () => {
    if (!imagemFile) return;
    try {
      const id = generateId();
      const path = `gallery/${id}/${imagemFile.name}`;
      const publicUrl = await uploadToBucket('gallery', path, imagemFile);
      const record: any = {
        id,
        id_barbeiro: barbeiroId,
        descricao: descricao.trim() || null,
        imagem_url: publicUrl || previewUrl,
        created_at: new Date().toISOString(),
      };
      const created = await createGaleriaDb(record);
      setGaleria(prev => [created, ...prev]);
      setDescricao('');
      setImagemFile(null);
      setPreviewUrl('');
    } catch (err) {
      toast.error('Não foi possível salvar a imagem.');
    }
  };

  const handleRemover = async (id: string) => {
    try {
      await deleteGaleriaDb(id);
      setGaleria(prev => prev.filter(item => item.id !== id));
    } catch {
      toast.error('Não foi possível remover a imagem.');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">Galeria Admin</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Adicione e gerencie imagens de cortes para a vitrine do cliente.</p>
        </div>

        <Card className="mb-8">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Selecione o barbeiro</label>
              <div className="relative">
                <select
                  value={barbeiroId}
                  onChange={event => setBarbeiroId(event.target.value)}
                  className="appearance-none w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 pr-12 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                >
                  {barbeiros.map(b => (
                    <option key={b.id} value={b.id} className="bg-[var(--color-surface)] text-[var(--color-text)]">
                      {b.nome}
                    </option>
                  ))}
                </select>
                {/* custom arrow with spacing from right */}
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--color-muted)]">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Descrição</label>
              <input
                type="text"
                value={descricao}
                onChange={event => setDescricao(event.target.value)}
                placeholder="Ex: Corte degradê moderno"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Imagem</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-[var(--color-text)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-bg)]"
              />
            </div>

            {previewUrl && (
              <div className="rounded-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
                <img src={previewUrl} alt="Preview da galeria" className="h-64 w-full object-cover" />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleAdicionar} className="w-full sm:w-auto flex items-center justify-center gap-2">
                <Plus size={16} /> Adicionar imagem
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          {galeria.length === 0 ? (
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
              Nenhuma imagem salva ainda. Adicione cortes para a galeria do cliente.
            </div>
          ) : (
            galeria.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                  <div>
                    <img src={item.imagem_url} alt={item.descricao || 'Imagem da galeria'} className="h-64 w-full object-cover" />
                  </div>
                  <div className="p-5 flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#9CA3AF]">{item.descricao || 'Sem descrição'}</p>
                      <p className="text-base font-semibold text-[#F9FAFB] mt-2">{item.barbeiro?.nome ?? 'Barbeiro não vinculado'}</p>
                      <p className="text-xs text-[#6B7280] mt-1">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <Button variant="danger" onClick={() => handleRemover(item.id)} className="w-full sm:w-auto">
                      <Trash2 size={16} /> Remover
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
