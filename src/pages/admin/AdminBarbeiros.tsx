import { ChangeEvent, useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { fetchBarbeiros, createBarbeiro, updateBarbeiro, deleteBarbeiro, uploadToBucket, PROFILE_BUCKET, fetchIndisponibilidades, createIndisponibilidade, deleteIndisponibilidade } from '../../lib/supabaseData';
import { StarRating } from '../../components/ui/StarRating';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import type { Barbeiro, BarbeiroIndisponibilidade } from '../../types/database.types';
import toast from 'react-hot-toast';
import { generateId } from '../../lib/utils';

export function AdminBarbeiros() {
  const { user } = useAuth();
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Barbeiro | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState<{ nome: string; especialidade: string; bio: string; foto_url: string | ArrayBuffer | null }>({ nome: '', especialidade: '', bio: '', foto_url: '' });
  const [selectedPhotoName, setSelectedPhotoName] = useState('');
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [indisponibilidades, setIndisponibilidades] = useState<BarbeiroIndisponibilidade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [barbeirosData, indisponibilidadesData] = await Promise.all([
          fetchBarbeiros(),
          fetchIndisponibilidades(),
        ]);
        if (!mounted) return;
        setBarbeiros(barbeirosData);
        setIndisponibilidades(indisponibilidadesData);
      } catch (err) {
        if (!mounted) return;
        setBarbeiros([]);
        setIndisponibilidades([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);
  const [indisponibilidadeModal, setIndisponibilidadeModal] = useState(false);
  const [indisponibilidadeTarget, setIndisponibilidadeTarget] = useState<Barbeiro | null>(null);
  const [indisponibilidadeForm, setIndisponibilidadeForm] = useState({ data: '', hora_inicio: '09:00', hora_fim: '10:00', motivo: '' });

  const openCreate = () => {
    setEditTarget(null);
    setForm({ nome: '', especialidade: '', bio: '', foto_url: '' });
    setSelectedPhotoName('');
    setModal(true);
  };

  const openEdit = (b: Barbeiro) => {
    setEditTarget(b);
    setForm({ nome: b.nome, especialidade: b.especialidade || '', bio: b.bio || '', foto_url: b.foto_url || '' });
    setSelectedPhotoName('');
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    if (!user) {
      toast.error('Você precisa estar autenticado.');
      return;
    }
    
    if (user.tipo_usuario !== 'admin') {
      toast.error('Apenas administradores podem gerenciar barbeiros.');
      return;
    }
    
    setLoading(true);
    try {
      if (editTarget) {
        const updates: any = { ...form, updated_at: new Date().toISOString() };
        // if a new photo file selected, upload
        if (selectedPhotoFile) {
          const path = `barbers/${editTarget.id}/${selectedPhotoFile.name}`;
          const publicUrl = await uploadToBucket(PROFILE_BUCKET, path, selectedPhotoFile);
          if (publicUrl) updates.foto_url = publicUrl;
        }
        const updated = await updateBarbeiro(editTarget.id, updates);
        const next = barbeiros.map(b => b.id === updated.id ? updated : b);
        setBarbeiros(next);
        toast.success('Barbeiro atualizado!');
      } else {
        let foto_url = form.foto_url || undefined;
        if (selectedPhotoFile) {
          const path = `barbers/${Date.now()}-${selectedPhotoFile.name}`;
          const publicUrl = await uploadToBucket(PROFILE_BUCKET, path, selectedPhotoFile);
          if (publicUrl) foto_url = publicUrl;
        }
        const novo: any = {
          nome: form.nome,
          especialidade: form.especialidade,
          bio: form.bio,
          foto_url,
          ativo: true,
          avaliacao_media: 0,
          total_avaliacoes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const created = await createBarbeiro(novo);
        const next = [created, ...barbeiros];
        setBarbeiros(next);
        toast.success('Barbeiro cadastrado!');
      }
    } catch (err: any) {
      console.error('AdminBarbeiros handleSave error:', err);
      const errorMsg = err?.message || err?.error_description || 'Não foi possível salvar o barbeiro.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setModal(false);
      setSelectedPhotoFile(null);
      setSelectedPhotoName('');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBarbeiro(id);
      const next = barbeiros.filter(b => b.id !== id);
      setBarbeiros(next);
      setDeleteTarget(null);
      toast.success('Barbeiro removido');
    } catch (err) {
      toast.error('Não foi possível remover o barbeiro.');
    }
  };

  const openIndisponibilidade = (barbeiro: Barbeiro) => {
    setIndisponibilidadeTarget(barbeiro);
    setIndisponibilidadeForm({ data: '', hora_inicio: '09:00', hora_fim: '10:00', motivo: '' });
    setIndisponibilidadeModal(true);
  };

  const handleSaveIndisponibilidade = async () => {
    if (!indisponibilidadeForm.data || !indisponibilidadeForm.hora_inicio || !indisponibilidadeForm.hora_fim) {
      toast.error('Data e horário obrigatórios');
      return;
    }
    if (!indisponibilidadeTarget) return;

    try {
      const novo = await createIndisponibilidade({
        id: generateId(),
        id_barbeiro: indisponibilidadeTarget.id,
        data: indisponibilidadeForm.data,
        hora_inicio: indisponibilidadeForm.hora_inicio,
        hora_fim: indisponibilidadeForm.hora_fim,
        motivo: indisponibilidadeForm.motivo,
        created_at: new Date().toISOString(),
      });
      setIndisponibilidades(prev => [novo, ...prev]);
      toast.success('Indisponibilidade salva!');
      setIndisponibilidadeModal(false);
    } catch (err) {
      console.error('AdminBarbeiros handleSaveIndisponibilidade error', err);
      toast.error('Não foi possível salvar a indisponibilidade.');
    }
  };

  const handleDeleteIndisponibilidade = async (id: string) => {
    try {
      await deleteIndisponibilidade(id);
      setIndisponibilidades(prev => prev.filter(item => item.id !== id));
      toast.success('Indisponibilidade removida');
    } catch {
      toast.error('Não foi possível remover a indisponibilidade.');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F9FAFB]">Barbeiros</h1>
            <p className="text-sm text-[#9CA3AF] mt-1">{barbeiros.length} profissionais</p>
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} />
            Novo Barbeiro
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {barbeiros.map(b => (
            <Card key={b.id}>
              <div className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  {b.foto_url ? (
                    <img src={b.foto_url} alt={b.nome} className="w-20 h-20 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-[#D4A853]/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#D4A853]">{b.nome.charAt(0)}</span>
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1C1C1E] ${b.ativo ? 'bg-emerald-400' : 'bg-[#6B7280]'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#F9FAFB] truncate">{b.nome}</p>
                  <p className="text-sm text-[#9CA3AF] truncate">{b.especialidade}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#6B7280]">
                    <span className="inline-flex items-center gap-1">
                      <StarRating rating={Math.round(b.avaliacao_media || 0)} size={12} />
                      {b.avaliacao_media || 0}
                    </span>
                    <span>({b.total_avaliacoes || 0})</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end sm:justify-start">
                  <button
                    onClick={() => openEdit(b)}
                    className="p-2 text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => openIndisponibilidade(b)}
                    className="p-2 text-[#D4A853] hover:bg-[#D4A853]/10 rounded-lg transition-colors"
                  >
                    I
                  </button>
                  <button
                    onClick={() => setDeleteTarget(b.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {b.bio && (
                <div className="px-5 pb-4 -mt-1">
                  <p className="text-xs text-[#6B7280]">{b.bio}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editTarget ? 'Editar Barbeiro' : 'Novo Barbeiro'}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="Nome completo"
          />
          <Input
            label="Especialidade"
            value={form.especialidade}
            onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))}
            placeholder="Ex: Degradê & Barba"
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-text)]">Foto</label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="secondary" onClick={() => document.getElementById('barber-photo-input')?.click()}>
                Selecionar foto
              </Button>
              <p className="text-sm text-[var(--color-muted)] break-words max-w-full">
                {selectedPhotoName
                  ? selectedPhotoName
                  : form.foto_url
                    ? 'Foto atual carregada'
                    : 'Nenhuma foto selecionada'}
              </p>
            </div>
            <input
              id="barber-photo-input"
              type="file"
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    setForm(f => ({ ...f, foto_url: reader.result }));
                    setSelectedPhotoName(file.name);
                    setSelectedPhotoFile(file);
                  }
                };
                reader.readAsDataURL(file);
              }}
              className="hidden"
            />
          </div>
          {form.foto_url && typeof form.foto_url === 'string' && (
            <div className="rounded-2xl overflow-hidden border border-[var(--color-border)]">
              <img src={form.foto_url} alt="Prévia da foto" className="w-full h-40 object-cover" />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-text)]">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Breve descrição do profissional..."
              rows={3}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setModal(false)}>Cancelar</Button>
            <Button fullWidth loading={loading} onClick={handleSave}>
              {editTarget ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remover barbeiro" size="sm">
        <p className="text-sm text-[#9CA3AF] mb-5">Tem certeza? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" fullWidth onClick={() => deleteTarget && handleDelete(deleteTarget)}>
            <Trash2 size={14} />
            Remover
          </Button>
        </div>
      </Modal>

      <Modal open={indisponibilidadeModal} onClose={() => setIndisponibilidadeModal(false)} title="Registrar indisponibilidade">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#F9FAFB]">Data</label>
            <input
              type="date"
              value={indisponibilidadeForm.data}
              onChange={e => setIndisponibilidadeForm(f => ({ ...f, data: e.target.value }))}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#F9FAFB]">Início</label>
              <input
                type="time"
                value={indisponibilidadeForm.hora_inicio}
                onChange={e => setIndisponibilidadeForm(f => ({ ...f, hora_inicio: e.target.value }))}
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#F9FAFB]">Fim</label>
              <input
                type="time"
                value={indisponibilidadeForm.hora_fim}
                onChange={e => setIndisponibilidadeForm(f => ({ ...f, hora_fim: e.target.value }))}
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40"
              />
            </div>
          </div>
          <Input
            label="Motivo"
            value={indisponibilidadeForm.motivo}
            onChange={e => setIndisponibilidadeForm(f => ({ ...f, motivo: e.target.value }))}
            placeholder="Ex: horário fechado para almoço"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIndisponibilidadeModal(false)}>Cancelar</Button>
            <Button fullWidth onClick={handleSaveIndisponibilidade}>Salvar</Button>
          </div>
        </div>
      </Modal>

      {indisponibilidades.length > 0 && (
        <div className="mt-8 max-w-4xl mx-auto">
          <h2 className="font-semibold text-[#F9FAFB] mb-3">Indisponibilidades</h2>
          <div className="space-y-3">
            {indisponibilidades.map(item => (
              <Card key={item.id}>
                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#F9FAFB]">{barbeiros.find(b => b.id === item.id_barbeiro)?.nome || 'Barbeiro removido'}</p>
                    <p className="text-xs text-[#9CA3AF]">{item.data} • {item.hora_inicio} - {item.hora_fim}</p>
                    {item.motivo && <p className="text-xs text-[#6B7280] mt-1">{item.motivo}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteIndisponibilidade(item.id)}
                    className="text-red-400 hover:bg-red-400/10 rounded-lg p-2 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
