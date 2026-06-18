import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, Scissors, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatPhoneMask, isPhoneValid } from '../lib/utils';
import toast from 'react-hot-toast';

interface AuthPageProps {
  onNavigate?: (page: string) => void;
  initialTab?: 'login' | 'register';
  onAuthSuccess?: () => void;
}

export function AuthPage({ initialTab = 'login', onAuthSuccess }: AuthPageProps) {
  const [tab, setTab] = useState<'login' | 'register' | 'recover'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register, loading } = useAuth();

  const emptyForm = {
    nome: '',
    email: '',
    telefone: '',
    password: '',
    confirmPassword: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const switchTab = (newTab: 'login' | 'register' | 'recover') => {
    setTab(newTab);
    setErrors({});
    setShowPassword(false);
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = key === 'telefone' ? formatPhoneMask(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [key]: value }));
    setErrors(err => ({ ...err, [key]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = 'E-mail obrigatório';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'E-mail inválido';

    if (tab !== 'recover') {
      if (!form.password) errs.password = 'Senha obrigatória';
      else if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres';
    }

    if (tab === 'register') {
      if (!form.nome.trim()) errs.nome = 'Nome obrigatório';
      if (!form.telefone) errs.telefone = 'Telefone obrigatório';
      else if (!isPhoneValid(form.telefone)) errs.telefone = 'Telefone inválido';
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Senhas não conferem';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        toast.success('Bem-vindo de volta!');
        onAuthSuccess?.();
      } else if (tab === 'register') {
        await register(form.nome, form.email, form.telefone, form.password);
        toast.success('Conta criada com sucesso!');
        onAuthSuccess?.();
      } else {
        await new Promise(r => setTimeout(r, 800));
        toast.success('E-mail de recuperação enviado!');
        switchTab('login');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Ocorreu um erro. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-8 page-enter">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#D4A853] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Scissors size={22} className="text-[#0F0F0F] rotate-[-45deg]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#F9FAFB]">
            {tab === 'login' ? 'Bem-vindo' : tab === 'register' ? 'Criar conta' : 'Recuperar senha'}
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1">
            {tab === 'login' ? 'Entre na sua conta' : tab === 'register' ? 'Preencha seus dados' : 'Enviaremos um e-mail'}
          </p>
        </div>

        {/* Tabs */}
        {tab !== 'recover' && (
          <div className="flex bg-[var(--color-surface)] rounded-xl p-1 mb-6 border border-[var(--color-border)]">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-[var(--color-primary)] text-[var(--color-surface)] shadow-sm shadow-[var(--color-primary)/30]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-[var(--color-primary)] text-[var(--color-surface)] shadow-sm shadow-[var(--color-primary)/30]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]'
              }`}
            >
              Cadastrar
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <Input
              label="Nome completo"
              type="text"
              placeholder="Seu nome"
              value={form.nome}
              onChange={set('nome')}
              error={errors.nome}
              leftIcon={<User size={16} />}
            />
          )}

          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            leftIcon={<Mail size={16} />}
          />

          {tab === 'register' && (
            <Input
              label="Telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={form.telefone}
              onChange={set('telefone')}
              error={errors.telefone}
              leftIcon={<Phone size={16} />}
            />
          )}

          {tab !== 'recover' && (
            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          )}

          {tab === 'register' && (
            <Input
              label="Confirmar senha"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Digite a senha novamente"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              error={errors.confirmPassword}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowConfirmPassword(s => !s)}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          )}

          {tab === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => switchTab('recover')}
                className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-soft)] transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          <Button type="submit" fullWidth loading={loading} size="lg">
            {tab === 'login' ? 'Entrar' : tab === 'register' ? 'Criar conta' : 'Enviar e-mail'}
          </Button>

          {tab === 'recover' && (
            <button
              type="button"
              onClick={() => switchTab('login')}
              className="w-full flex items-center justify-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors mt-2"
            >
              <ArrowLeft size={14} />
              Voltar ao login
            </button>
          )}
        </form>

        {/* Google OAuth */}
        {tab !== 'recover' && (
          <div className="mt-5">
            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-[#4B5563]">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <button
              onClick={() => toast('Google OAuth requer configuração do Supabase', { icon: '🔑' })}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#1C1C1E] border border-white/10 rounded-xl text-sm text-[#F9FAFB] hover:bg-[#222224] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
