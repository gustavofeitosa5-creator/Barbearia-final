import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, Lock, Mail, Phone, User, Save, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { uploadProfileImage, getProfilePublicUrl } from '../lib/supabase';
import { isPhoneValid } from '../lib/utils';
import toast from 'react-hot-toast';

interface PerfilPageProps {
  onNavigate: (page: string) => void;
}

export function PerfilPage({ onNavigate }: PerfilPageProps) {
  const { user, updateUser, logout, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    nome: user?.nome || '',
    telefone: user?.telefone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (form.telefone && !isPhoneValid(form.telefone)) {
      toast.error('Telefone inválido');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    updateUser({ nome: form.nome, telefone: form.telefone });
    toast.success('Perfil atualizado!');
    setLoading(false);
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    const authKey = user.auth_id || user.id;
    const safeFilename = file.name.replace(/\s+/g, '_');
    const filePath = `${authKey}/${safeFilename}`;
    const { error } = await uploadProfileImage(file, filePath);

    if (error) {
      toast.error('Falha no upload da imagem');
      setLoading(false);
      return;
    }

    const publicUrl = getProfilePublicUrl(filePath);
    const updatedUser = { foto_url: publicUrl };

    try {
      await updateUser(updatedUser);
      toast.success('Foto atualizada!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  const handlePasswordChange = async () => {
    setPasswordError('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Senha atual obrigatória');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('A nova senha precisa ter ao menos 8 caracteres');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('As novas senhas não conferem');
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Senha alterada com sucesso!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setPasswordError(error?.message || 'Erro ao alterar a senha.');
      toast.error(error?.message || 'Erro ao alterar a senha.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 page-enter">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-[#F9FAFB] mb-8">Meu Perfil</h1>

        {/* Avatar */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {user.foto_url ? (
              <img
                src={user.foto_url}
                alt={user.nome}
                className="w-24 h-24 rounded-full object-cover border-2 border-[#D4A853]/40"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#D4A853]/20 flex items-center justify-center border-2 border-[#D4A853]/40">
                <span className="text-3xl font-bold text-[#D4A853]">
                  {user.nome.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handlePhotoUpload}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#D4A853] rounded-full flex items-center justify-center hover:bg-[#E8C27A] transition-colors shadow-lg"
            >
              <Camera size={14} className="text-[#0F0F0F]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Info */}
        <Card className="mb-4">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium text-[#F9FAFB]">Informações pessoais</h2>
              {user.tipo_usuario === 'admin' && (
                <div className="flex items-center gap-1 text-xs text-[#D4A853] bg-[#D4A853]/10 px-2 py-0.5 rounded-full">
                  <Shield size={11} />
                  Admin
                </div>
              )}
            </div>

            <Input
              label="Nome completo"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              leftIcon={<User size={15} />}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#F9FAFB]">E-mail</label>
              <div className="flex items-center gap-3 bg-[#1C1C1E] border border-white/8 rounded-xl px-4 py-2.5">
                <Mail size={15} className="text-[#6B7280]" />
                <span className="text-sm text-[#9CA3AF]">{user.email}</span>
                <span className="ml-auto text-xs text-[#4B5563]">Não editável</span>
              </div>
            </div>

            <Input
              label="Telefone"
              type="tel"
              value={form.telefone}
              onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
              leftIcon={<Phone size={15} />}
            />

            <Button fullWidth loading={loading} onClick={handleSave}>
              <Save size={15} />
              Salvar alterações
            </Button>
          </div>
        </Card>

        {/* Security */}
        <Card className="mb-4">
          <div className="p-5 space-y-4">
            <div>
              <h2 className="font-medium text-[#F9FAFB] mb-2">Segurança</h2>
              <p className="text-sm text-[#9CA3AF]">Altere sua senha diretamente no app sem precisar de e-mail.</p>
            </div>
            <Input
              label="Senha atual"
              type="password"
              value={passwordForm.currentPassword}
              onChange={e => {
                setPasswordForm(f => ({ ...f, currentPassword: e.target.value }));
                setPasswordError('');
              }}
              leftIcon={<Lock size={15} />}
            />
            <Input
              label="Nova senha"
              type="password"
              value={passwordForm.newPassword}
              onChange={e => {
                setPasswordForm(f => ({ ...f, newPassword: e.target.value }));
                setPasswordError('');
              }}
              leftIcon={<Lock size={15} />}
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={e => {
                setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }));
                setPasswordError('');
              }}
              leftIcon={<Lock size={15} />}
            />
            {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
            <Button variant="secondary" fullWidth loading={passwordLoading} onClick={handlePasswordChange}>
              Alterar senha
            </Button>
          </div>
        </Card>

        {/* Quick Access */}
        {user.tipo_usuario === 'cliente' && (
          <Card className="mb-4">
            <div className="p-5">
              <h2 className="font-medium text-[#F9FAFB] mb-4">Acesso rápido</h2>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => onNavigate('historico')}>
                  Meus agendamentos
                </Button>
                <Button variant="secondary" onClick={() => onNavigate('galeria')}>
                  Galeria
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-red-400 hover:text-red-300 text-sm transition-colors"
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
