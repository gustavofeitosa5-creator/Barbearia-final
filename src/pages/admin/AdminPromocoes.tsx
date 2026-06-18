import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Award, ToggleLeft, ToggleRight } from 'lucide-react';
import { fetchPromocoes, createPromocao, updatePromocao, deletePromocao } from '../../lib/supabaseData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import type { Promocao } from '../../types/database.types';
import { formatPercentInput, parsePercentInput, isDateOnOrAfterToday, isDateMaskValid, parseDateMask, formatDateMask, formatDateToMask, formatDateToSql } from '../../lib/utils';
import toast from 'react-hot-toast';

export function AdminPromocoes() {
  const { user } = useAuth();
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Promocao | null>(null);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    desconto_percentual: '',
    data_inicio: '',
    data_fim: '',
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchPromocoes();
        if (mounted) setPromocoes(data);
      } catch {
        if (mounted) setPromocoes([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ titulo: '', descricao: '', desconto_percentual: '', data_inicio: '', data_fim: '' });
    setModal(true);
  };

  const openEdit = (p: Promocao) => {
    const formatDateForForm = (value: string) => {
      if (!value) return '';
      if (value.includes('/')) return value;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : formatDateToMask(date);
    };

    setEditTarget(p);
    setForm({
      titulo: p.titulo,
      descricao: p.descricao || '',
      desconto_percentual: String(p.desconto_percentual || ''),
      data_inicio: formatDateForForm(p.data_inicio),
      data_fim: formatDateForForm(p.data_fim),
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Você precisa estar autenticado.');
      return;
    }

    if (user.tipo_usuario !== 'admin') {
      toast.error('Apenas administradores podem gerenciar promoções.');
      return;
    }

    if (!form.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    const inicio = form.data_inicio;
    const fim = form.data_fim;

    if (!inicio || !fim) {
      toast.error('Datas de início e fim são obrigatórias');
      return;
    }

    if (!isDateMaskValid(inicio) || !isDateMaskValid(fim)) {
      toast.error('Formato de data inválido. Use DD/MM/AAAA');
      return;
    }

    const inicioSql = formatDateToSql(inicio);
    const fimSql = formatDateToSql(fim);
    if (!inicioSql || !fimSql) {
      toast.error('Formato de data inválido. Use DD/MM/AAAA');
      return;
    }

    const inicioDate = parseDateMask(inicio);
    const fimDate = parseDateMask(fim);
    if (inicioDate && fimDate && fimDate < inicioDate) {
      toast.error('A data de fim deve ser igual ou posterior à data de início');
      return;
    }

    if (!isDateOnOrAfterToday(inicio) || !isDateOnOrAfterToday(fim)) {
      toast.error('Datas não podem ser anteriores a hoje');
      return;
    }

    const data = {
      titulo: form.titulo,
      descricao: form.descricao,
      desconto_percentual: form.desconto_percentual ? parsePercentInput(form.desconto_percentual) : undefined,
      data_inicio: inicioSql,
      data_fim: fimSql,
    };
    if (editTarget) {
      try {
        const updated = await updatePromocao(editTarget.id, { ...data, updated_at: new Date().toISOString() });
        const next = promocoes.map(p => p.id === updated.id ? updated : p);
        setPromocoes(next);
        toast.success('Promoção atualizada!');
      } catch (err: any) {
        const errorMsg = err?.message || err?.error_description || 'Não foi possível atualizar a promoção.';
        console.error('AdminPromocoes update error', err);
        toast.error(errorMsg);
      }
    } else {
      try {
        const nova = await createPromocao({
          ...data,
          ativa: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        const next = [...promocoes, nova];
        setPromocoes(next);
        toast.success('Promoção cadastrada!');
      } catch (err: any) {
        const errorMsg = err?.message || err?.error_description || 'Não foi possível cadastrar a promoção.';
        console.error('AdminPromocoes create error', err);
        toast.error(errorMsg);
      }
    }
    setModal(false);
  };

  const toggleAtiva = async (id: string) => {
    try {
      const promo = promocoes.find(p => p.id === id);
      if (!promo) return;
      const updated = await updatePromocao(id, { ...promo, ativa: !promo.ativa, updated_at: new Date().toISOString() });
      setPromocoes(prev => prev.map(p => p.id === id ? updated : p));
    } catch {
      setPromocoes(prev => prev.map(p => p.id === id ? { ...p, ativa: !p.ativa } : p));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePromocao(id);
      setPromocoes(prev => prev.filter(p => p.id !== id));
      toast.success('Promoção removida');
    } catch {
      toast.error('Não foi possível remover promoção');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F9FAFB]">Promoções</h1>
            <p className="text-sm text-[#9CA3AF] mt-1">{promocoes.filter(p => p.ativa).length} ativas</p>
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} />
            Nova Promoção
          </Button>
        </div>

        <div className="space-y-4">
          {promocoes.map(p => (
            <Card key={p.id}>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#D4A853]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Award size={18} className="text-[#D4A853]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[#F9FAFB]">{p.titulo}</h3>
                      <Badge variant={p.ativa ? 'success' : 'default'}>
                        {p.ativa ? 'Ativa' : 'Inativa'}
                      </Badge>
                      {p.desconto_percentual && (
                        <Badge variant="gold">{p.desconto_percentual}% OFF</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#9CA3AF] mt-1">{p.descricao}</p>
                    <p className="text-xs text-[#6B7280] mt-2">
                      {p.data_inicio} → {p.data_fim}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleAtiva(p.id)}
                      className={`p-1.5 rounded-lg transition-colors ${p.ativa ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-[#6B7280] hover:bg-white/5'}`}
                    >
                      {p.ativa ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Editar Promoção' : 'Nova Promoção'}>
        <div className="space-y-4">
          <Input
            label="Título *"
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            placeholder="Ex: Combo especial de dezembro"
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#F9FAFB]">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              rows={2}
              placeholder="Detalhe a promoção..."
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40 resize-none"
            />
          </div>
          <Input
            label="Desconto (%)"
            type="text"
            value={form.desconto_percentual}
            onChange={e => setForm(f => ({ ...f, desconto_percentual: formatPercentInput(e.target.value) }))}
            placeholder="Ex: 20%"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data início"
              type="text"
              value={form.data_inicio}
              onChange={e => setForm(f => ({ ...f, data_inicio: formatDateMask(e.target.value) }))}
              placeholder="DD/MM/AAAA"
            />
            <Input
              label="Data fim"
              type="text"
              value={form.data_fim}
              onChange={e => setForm(f => ({ ...f, data_fim: formatDateMask(e.target.value) }))}
              placeholder="DD/MM/AAAA"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setModal(false)}>Cancelar</Button>
            <Button fullWidth onClick={handleSave}>
              {editTarget ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
