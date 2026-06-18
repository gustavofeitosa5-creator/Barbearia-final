import { Home, Calendar, Clock, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const { user } = useAuth();
  if (!user) return null;

  const clientItems = [
    { icon: Home, label: 'Início', page: 'home' },
    { icon: Calendar, label: 'Agendar', page: 'agendar' },
    { icon: Clock, label: 'Histórico', page: 'historico' },
    { icon: User, label: 'Perfil', page: 'perfil' },
  ];

  const adminItems = [
    { icon: LayoutDashboard, label: 'Dashboard', page: 'admin' },
    { icon: Calendar, label: 'Agenda', page: 'admin-agendamentos' },
    { icon: Clock, label: 'Galeria', page: 'admin-galeria' },
    { icon: User, label: 'Perfil', page: 'perfil' },
  ];

  const items = user.tipo_usuario === 'admin' ? adminItems : clientItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0F0F0F]/95 backdrop-blur-md border-t border-white/8">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ icon: Icon, label, page }) => {
          const active = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200',
                active ? 'text-[#D4A853]' : 'text-[#6B7280]'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
