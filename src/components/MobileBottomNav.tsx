import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Calendar, Users, Settings, Plus, User as UserIcon, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type TabItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  matches: (path: string) => boolean;
};

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isGestor, isFreelancer } = useAuth();

  const tabs: TabItem[] = [
    {
      label: 'Painel',
      icon: LayoutGrid,
      to: '/dashboard',
      matches: (p) => p === '/dashboard' || p === '/',
    },
    {
      label: 'Eventos',
      icon: Calendar,
      to: '/events',
      matches: (p) => p.startsWith('/events'),
    },
    isGestor
      ? {
          label: 'Equipe',
          icon: Users,
          to: '/team-scheduling',
          matches: (p) =>
            p.startsWith('/team-scheduling') ||
            p.startsWith('/team-management') ||
            p.startsWith('/team-escalation') ||
            p.startsWith('/pending-allocations'),
        }
      : isFreelancer
        ? {
            label: 'Perfil',
            icon: UserIcon,
            to: '/profile',
            matches: (p) => p.startsWith('/profile'),
          }
        : {
            label: 'Equipe',
            icon: Users,
            to: '/team-escalation',
            matches: (p) => p.startsWith('/team-escalation'),
          },
    {
      label: 'Alertas',
      icon: Bell,
      to: '/notifications',
      matches: (p) => p.startsWith('/notifications'),
    },
    {
      label: 'Ajustes',
      icon: Settings,
      to: '/settings',
      matches: (p) => p.startsWith('/settings'),
    },
  ];

  const showFab = isGestor;

  return (
    <>
      {showFab && (
        <button
          type="button"
          aria-label="Criar novo evento"
          onClick={() => navigate('/events/new')}
          className="lg:hidden fixed right-5 bottom-24 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_8px_24px_rgba(17,207,129,0.35)] active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      )}
      <nav
        aria-label="Navegação principal"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-[68px] bg-sidebar-background/95 backdrop-blur-md border-t border-sidebar-border px-2 pb-[env(safe-area-inset-bottom)] flex items-stretch justify-around"
      >
        {tabs.map((tab) => {
          const active = tab.matches(location.pathname);
          const Icon = tab.icon;
          return (
            <button
              key={tab.to}
              type="button"
              onClick={() => navigate(tab.to)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 min-w-0 transition-colors',
                active ? 'text-primary' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(17,207,129,0.6)]')} />
              <span className={cn('text-[10px] font-medium leading-none', active && 'font-bold')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default MobileBottomNav;
