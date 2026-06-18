import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Button } from './components/ui/Button';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { AgendarPage } from './pages/AgendarPage';
import { HistoricoPage } from './pages/HistoricoPage';
import { ServicosPage } from './pages/ServicosPage';
import { BarbeirosPage } from './pages/BarbeirosPage';
import { GaleriaPage } from './pages/GaleriaPage';
import { PerfilPage } from './pages/PerfilPage';
import { ChatPage } from './pages/ChatPage';
import { NotificacoesPage } from './pages/NotificacoesPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAgendamentos } from './pages/admin/AdminAgendamentos';
import { AdminBarbeiros } from './pages/admin/AdminBarbeiros';
import { AdminServicos } from './pages/admin/AdminServicos';
import { AdminPromocoes } from './pages/admin/AdminPromocoes';
import { AdminGaleria } from './pages/admin/AdminGaleria';
import { fetchAgendamentos, createNotification, updateAgendamento } from './lib/supabaseData';
import { formatDateTime } from './lib/utils';
import type { Agendamento } from './types/database.types';

function AppContent({ theme, onToggleTheme }: { theme: 'dark' | 'light'; onToggleTheme: () => void }) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [nextPageAfterAuth, setNextPageAfterAuth] = useState<string | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  useEffect(() => {
    const unprotectedPages = ['home', 'login', 'register', 'servicos', 'barbeiros', 'galeria'];
    if (!user && !unprotectedPages.includes(currentPage)) {
      setCurrentPage('home');
    }
  }, [user, currentPage]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user) {
          setAgendamentos([]);
          return;
        }
        const data = await fetchAgendamentos(user.id, user.tipo_usuario === 'admin');
        if (mounted) {
          setAgendamentos(data);
        }
      } catch (err) {
        if (mounted) {
          setAgendamentos([]);
        }
      } finally {
        if (mounted) setLoadingAppointments(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  const navigate = (page: string) => {
    const protectedPages = [
      'agendar',
      'historico',
      'perfil',
      'chat',
      'notificacoes',
      'admin',
      'admin-agendamentos',
      'admin-barbeiros',
      'admin-servicos',
      'admin-promocoes',
      'admin-galeria',
    ];

    if (!user && protectedPages.includes(page)) {
      setNextPageAfterAuth(page);
      setCurrentPage('login');
      return;
    }

    if (page.startsWith('admin') && user?.tipo_usuario !== 'admin') {
      setCurrentPage('home');
      return;
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  if (loadingAppointments) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#F9FAFB] bg-[var(--color-bg)]">
        Carregando agendamentos...
      </div>
    );
  }
  const handleAgendamentoCriado = async (ag: Agendamento) => {
    setAgendamentos(prev => [ag, ...prev]);

    if (!user) return;
    try {
      await createNotification({
        id: crypto.randomUUID(),
        id_usuario: user.id,
        tipo: 'confirmacao',
        mensagem: `Agendamento criado para ${ag.barbeiro?.nome ?? 'o barbeiro selecionado'} em ${formatDateTime(ag.data_hora)}.`,
        lida: false,
      });
    } catch (err) {
      console.warn('Falha ao criar notificação:', err);
    }
  };

  const handleCancelarAgendamento = async (id: string) => {
    try {
      await updateAgendamento(id, { status: 'cancelado' });
      setAgendamentos(prev => prev.map(ag => ag.id === id ? { ...ag, status: 'cancelado' } : ag));
    } catch {
      setAgendamentos(prev => prev.map(ag => ag.id === id ? { ...ag, status: 'cancelado' } : ag));
    }
  };

  const handleConfirmarAgendamento = async (id: string) => {
    try {
      await updateAgendamento(id, { status: 'confirmado' });
      setAgendamentos(prev => prev.map(ag => ag.id === id ? { ...ag, status: 'confirmado' } : ag));
    } catch {
      setAgendamentos(prev => prev.map(ag => ag.id === id ? { ...ag, status: 'confirmado' } : ag));
    }
  };

  const handleAuthSuccess = () => {
    if (nextPageAfterAuth) {
      setCurrentPage(nextPageAfterAuth);
      setNextPageAfterAuth(null);
    } else {
      setCurrentPage('home');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return user ? (
          user.tipo_usuario === 'admin' ? (
            <AdminDashboard agendamentos={agendamentos} onNavigate={navigate} />
          ) : (
            <AuthenticatedHome user={user} onNavigate={navigate} />
          )
        ) : (
          <LandingPage onNavigate={navigate} />
        );

      case 'login':
      case 'register':
        return (
          <AuthPage
            onNavigate={navigate}
            initialTab={currentPage === 'register' ? 'register' : 'login'}
            onAuthSuccess={handleAuthSuccess}
          />
        );

      case 'agendar':
        return (
          <AgendarPage
            onNavigate={navigate}
            onAgendamentoCriado={handleAgendamentoCriado}
          />
        );

      case 'historico':
        return (
          <HistoricoPage
            agendamentos={agendamentos}
            onNavigate={navigate}
            onCancelar={handleCancelarAgendamento}
          />
        );

      case 'servicos':
        return <ServicosPage onNavigate={navigate} />;

      case 'barbeiros':
        return <BarbeirosPage onNavigate={navigate} />;

      case 'galeria':
        return <GaleriaPage onNavigate={navigate} />;

      case 'perfil':
        return <PerfilPage onNavigate={navigate} />;

      case 'chat':
        return <ChatPage onNavigate={navigate} />;

      case 'notificacoes':
        return <NotificacoesPage onNavigate={navigate} />;

      // Admin pages
      case 'admin':
        return (
          <AdminDashboard
            agendamentos={agendamentos}
            onNavigate={navigate}
          />
        );

      case 'admin-agendamentos':
        return (
          <AdminAgendamentos
            agendamentos={agendamentos}
            onConfirmar={handleConfirmarAgendamento}
            onCancelar={handleCancelarAgendamento}
          />
        );

      case 'admin-barbeiros':
        return <AdminBarbeiros />;

      case 'admin-servicos':
        return <AdminServicos />;

      case 'admin-promocoes':
        return <AdminPromocoes />;

      case 'admin-galeria':
        return <AdminGaleria />;

      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  // Chat page has its own full layout
  if (currentPage === 'chat') {
    return (
      <>
        <Header onNavigate={navigate} currentPage={currentPage} theme={theme} onToggleTheme={onToggleTheme} />
        <ChatPage onNavigate={navigate} />
        <BottomNav currentPage={currentPage} onNavigate={navigate} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header onNavigate={navigate} currentPage={currentPage} theme={theme} onToggleTheme={onToggleTheme} />
      <main>{renderPage()}</main>
      <BottomNav currentPage={currentPage} onNavigate={navigate} />
    </div>
  );
}

function AuthenticatedHome({ user, onNavigate }: { user: any; onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen page-enter pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#D4A853]/10 border border-[#D4A853]/20 rounded-full text-xs text-[#D4A853] font-medium mb-6">
          Acesso autenticado
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#F9FAFB] leading-tight mb-4">
          Olá, {user.nome.split(' ')[0]}.
        </h1>
        <p className="text-lg text-[#9CA3AF] max-w-2xl mx-auto mb-8 leading-relaxed">
          Bem-vindo de volta! Acesse seus agendamentos, serviços e perfil sempre que precisar.
        </p>
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <Button onClick={() => onNavigate('agendar')} size="lg">
            Agendar
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('historico')} size="lg">
            Histórico
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('perfil')} size="lg">
            Meu Perfil
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-6 rounded-3xl bg-[#1C1C1E] border border-white/10 text-left">
            <h2 className="text-xl font-semibold text-[#F9FAFB] mb-2">Agendamento rápido</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Escolha um serviço, selecione uma data e confirme seu horário com poucos passos.</p>
          </div>
          <div className="p-6 rounded-3xl bg-[#1C1C1E] border border-white/10 text-left">
            <h2 className="text-xl font-semibold text-[#F9FAFB] mb-2">Suporte disponível</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Visualize os detalhes do seu perfil, notificações e acompanhe suas reservas em um só lugar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(current => (current === 'dark' ? 'light' : 'dark'));

  return (
    <AuthProvider>
      <AppContent theme={theme} onToggleTheme={toggleTheme} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1C1C1E',
            color: '#F9FAFB',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#D4A853', secondary: '#0F0F0F' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#F9FAFB' },
          },
        }}
      />
    </AuthProvider>
  );
}
