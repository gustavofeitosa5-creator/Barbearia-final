import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Scissors } from 'lucide-react';
import { fetchServicos, createServico, updateServico, deleteServico } from '../../lib/supabaseData';
import { formatCurrency, formatDuration, formatMoneyInput, parseMoneyInput, formatMoneyString, generateId } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import type { Servico } from '../../types/database.types';
import toast from 'react-hot-toast';

export function AdminServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Servico | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    tipo: 'Corte',
    descricao: '',
    preco: '',
    duracao_minutos: '',
  });

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

  const openCreate = () => {
    setEditTarget(null);
    setForm({ nome: '', tipo: 'Corte', descricao: '', preco: '', duracao_minutos: '' });
    setModal(true);
  };

  const openEdit = (s: Servico) => {
    setEditTarget(s);
    setForm({
      nome: s.nome,
      tipo: s.tipo,
      descricao: s.descricao || '',
      preco: formatMoneyString(s.preco),
      duracao_minutos: String(s.duracao_minutos),
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.preco || !form.duracao_minutos) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const data = {
      nome: form.nome,
      tipo: form.tipo,
      descricao: form.descricao,
      preco: parseMoneyInput(form.preco),
      duracao_minutos: parseInt(form.duracao_minutos, 10),
    };

    try {
      if (editTarget) {
        const updated = await updateServico(editTarget.id, {
          ...data,
          updated_at: new Date().toISOString(),
        });
        const next = servicos.map(s => s.id === updated.id ? updated : s);
        setServicos(next);
        toast.success('Serviço atualizado!');
      } else {
        const novo = await createServico({
          id: generateId(),
          ...data,
          duracao_min: data.duracao_minutos,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        const next = [novo, ...servicos];
        setServicos(next);
        toast.success('Serviço cadastrado!');
      }
    } catch (err) {
      // log para debugging e mostrar mensagem mais específica se disponível
      // eslint-disable-next-line no-console
      console.error('Erro ao salvar serviço', err);
      // mostra a mensagem retornada pela API quando possível
      // @ts-ignore
      toast.error(err?.message || 'Não foi possível salvar o serviço.');
      return;
    } finally {
      setModal(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteServico(id);
      const next = servicos.filter(s => s.id !== id);
      setServicos(next);
      setDeleteTarget(null);
      toast.success('Serviço removido');
    } catch (err) {
      toast.error('Não foi possível remover o serviço.');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F9FAFB]">Serviços</h1>
            <p className="text-sm text-[#9CA3AF] mt-1">{servicos.length} serviços cadastrados</p>
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} />
            Novo Serviço
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {servicos.map(s => (
            <Card key={s.id}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 bg-[#D4A853]/10 rounded-xl flex items-center justify-center">
                    <Scissors size={16} className="text-[#D4A853] rotate-[-45deg]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(s.id)}
                      className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-[#F9FAFB] mb-1">{s.nome}</h3>
                <p className="text-xs text-[#9CA3AF] mb-3 line-clamp-2">{s.descricao}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-[#D4A853]">{formatCurrency(s.preco)}</p>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {formatDuration(s.duracao_minutos)}
                    </p>
                  </div>
                  <Badge variant="default">{s.tipo}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Editar Serviço' : 'Novo Serviço'}>
        <div className="space-y-4">
          <Input
            label="Nome do serviço *"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="Ex: Corte Masculino"
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#F9FAFB]">Tipo</label>
            <select
              value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40"
            >
              {['Corte', 'Barba', 'Combo', 'Sobrancelha', 'Tratamento', 'Coloração'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#F9FAFB]">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Descreva o serviço..."
              rows={2}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/40 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preço (R$) *"
              type="text"
              value={form.preco}
              onChange={e => setForm(f => ({ ...f, preco: formatMoneyInput(e.target.value, 7) }))}
              placeholder="45,00"
            />
            <Input
              label="Duração (min) *"
              type="number"
              min="5"
              step="5"
              value={form.duracao_minutos}
              onChange={e => setForm(f => ({ ...f, duracao_minutos: e.target.value }))}
              placeholder="30"
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

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remover serviço" size="sm">
        <p className="text-sm text-[#9CA3AF] mb-5">Tem certeza? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" fullWidth onClick={() => deleteTarget && handleDelete(deleteTarget)}>
            <Trash2 size={14} />
            Remover
          </Button>
        </div>
      </Modal>
    </div>
  );
}
