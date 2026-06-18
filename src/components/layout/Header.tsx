import { Bell, LogOut, Settings, Scissors, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchNotifications } from '../../lib/supabaseData';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function Header({ onNavigate, currentPage, theme, onToggleTheme }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setUnread(0);
      return;
    }

    (async () => {
      try {
        const notifications = await fetchNotifications(user.id);
        if (mounted) {
          setUnread(notifications.filter(n => !n.lida).length);
        }
      } catch (err) {
        if (mounted) setUnread(0);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, currentPage]);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#0F0F0F]/90 backdrop-blur-md border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 bg-[#D4A853] rounded-lg flex items-center justify-center">
            <Scissors size={16} className="text-[#0F0F0F] rotate-[-45deg]" />
          </div>
          <span className="font-display text-lg font-semibold text-[#F9FAFB] hidden sm:block">
            Barber<span className="text-[#D4A853]">Pro</span>
          </span>
        </button>

        {/* Nav Links (desktop) */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {user.tipo_usuario === 'cliente' ? (
              <>
                <NavLink label="Início" page="home" current={currentPage} onNavigate={onNavigate} />
                <NavLink label="Agendar" page="agendar" current={currentPage} onNavigate={onNavigate} />
                <NavLink label="Meus Agendamentos" page="historico" current={currentPage} onNavigate={onNavigate} />
                <NavLink label="Serviços" page="servicos" current={currentPage} onNavigate={onNavigate} />
                <NavLink label="Barbeiros" page="barbeiros" current={currentPage} onNavigate={onNavigate} />
              </>
            ) : (
              <>
                <NavLink label="Dashboard" page="admin" current={currentPage} onNavigate={onNavigate} />
                <NavLink label="Agendamentos" page="admin-agendamentos" current={currentPage} onNavigate={onNavigate} />
                <NavLink label="Galeria" page="admin-galeria" current={currentPage} onNavigate={onNavigate} />
                <NavLink label="Barbeiros" page="admin-barbeiros" current={currentPage} onNavigate={onNavigate} />
                <NavLink label="Serviços" page="admin-servicos" current={currentPage} onNavigate={onNavigate} />
                <NavLink label="Promoções" page="admin-promocoes" current={currentPage} onNavigate={onNavigate} />
              </>
            )}
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notifications */}
              <button
                onClick={() => onNavigate('notificacoes')}
                className="relative p-2 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
              >
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#D4A853] rounded-full" />
                )}
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {user.foto_url ? (
                    <img src={user.foto_url} alt={user.nome} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#D4A853]/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-[#D4A853]">
                        {user.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:block text-sm text-[#F9FAFB] max-w-[120px] truncate">{user.nome.split(' ')[0]}</span>
                </button>

                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-2xl z-20 py-1 overflow-hidden">
                      <div className="px-3 py-2 border-b border-white/8">
                        <p className="text-sm font-medium text-[#F9FAFB] truncate">{user.nome}</p>
                        <p className="text-xs text-[#6B7280] truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { onNavigate('perfil'); setShowDropdown(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
                      >
                        <Settings size={14} />
                        Meu Perfil
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={14} />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 bg-[#D4A853] text-[#0F0F0F] text-sm font-medium rounded-xl hover:bg-[#E8C27A] transition-colors"
            >
              Entrar
            </button>
          )}
          <button
            onClick={onToggleTheme}
            aria-label="Alternar tema"
            className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function NavLink({ label, page, current, onNavigate }: {
  label: string;
  page: string;
  current: string;
  onNavigate: (page: string) => void;
}) {
  const active = current === page;
  return (
    <button
      onClick={() => onNavigate(page)}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? 'text-[#D4A853] bg-[#D4A853]/10'
          : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  );
}
