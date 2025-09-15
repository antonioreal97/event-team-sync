
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Calendar, Users, Bell, Settings, LogOut, User, DollarSign, Award, CheckCircle } from 'lucide-react';

interface SidebarMenuItemProps {
  children: React.ReactNode;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({ children }) => (
  <li className="mb-2">{children}</li>
);

interface SidebarMenuButtonProps {
  children: React.ReactNode;
  asChild?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

const SidebarMenuButton: React.FC<SidebarMenuButtonProps> = ({ children, asChild, onClick, isActive }) => {
  if (asChild) {
    return <>{children}</>;
  }
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-primary text-primary-foreground shadow-neon-lg border-glow' 
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white hover:shadow-neon'
      }`}
    >
      {children}
    </button>
  );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isGestor, isFreelancer, isLiderFreelancer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActiveRoute = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Se não há usuário, mostrar loading
             if (!user) {
             return (
               <div className="min-h-screen flex items-center justify-center bg-background">
                 <div className="text-center">
                   <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                     <img 
                       src="/logo-s4u.png" 
                       alt="Equipe S4U Logo" 
                       className="h-14 w-14 object-contain animate-pulse"
                     />
                   </div>
                   <p className="text-foreground">Carregando...</p>
                 </div>
               </div>
             );
           }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background shadow-2xl border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border bg-gradient-to-r from-sidebar-background to-sidebar-accent">
                             <div className="flex items-center space-x-3">
                     <div className="w-8 h-8 flex items-center justify-center">
                       <img 
                         src="/logo-s4u.png" 
                         alt="Equipe S4U Logo" 
                         className="h-6 w-6 object-contain"
                       />
                     </div>
                     <h1 className="text-xl font-bold text-sidebar-foreground font-heading">
                       Equipe S4U
                     </h1>
                   </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-6">
          <ul className="space-y-3">
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/dashboard')}
                isActive={isActiveRoute('/dashboard')}
              >
                <div className="flex items-center">
                  <Home className="w-5 h-5 mr-3" />
                  <span className="font-medium">Dashboard</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/events')}
                isActive={isActiveRoute('/events')}
              >
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-3" />
                  <span className="font-medium">Eventos</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/notifications')}
                isActive={isActiveRoute('/notifications')}
              >
                <div className="flex items-center">
                  <Bell className="w-5 h-5 mr-3" />
                  <span className="font-medium">Notificações</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Menu específico para Gestor */}
            {isGestor && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate('/team-management')}
                    isActive={isActiveRoute('/team-management')}
                  >
                    <div className="flex items-center">
                      <Award className="w-5 h-5 mr-3" />
                      <span className="font-medium">Gestão de Equipes</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate('/team-scheduling')}
                    isActive={isActiveRoute('/team-scheduling')}
                  >
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-3" />
                      <span className="font-medium">Gestão de Escala</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate('/payment-management')}
                    isActive={isActiveRoute('/payment-management')}
                  >
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-3" />
                      <span className="font-medium">Gestão de Pagamentos</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate('/event-interest-management')}
                    isActive={isActiveRoute('/event-interest-management')}
                  >
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-3" />
                      <span className="font-medium">Interesse em Eventos</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate('/team-escalation')}
                    isActive={isActiveRoute('/team-escalation')}
                  >
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-3" />
                      <span className="font-medium">Escalação de Equipes</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}

            {/* Menu específico para Líder Freelancer */}
            {isLiderFreelancer && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate('/team-escalation')}
                    isActive={isActiveRoute('/team-escalation')}
                  >
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-3" />
                      <span className="font-medium">Escalação de Equipes</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate('/profile')}
                    isActive={isActiveRoute('/profile')}
                  >
                    <div className="flex items-center">
                      <User className="w-5 h-5 mr-3" />
                      <span className="font-medium">Meu Perfil</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}

            {/* Menu específico para Freelancer */}
            {isFreelancer && (
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/profile')}
                  isActive={isActiveRoute('/profile')}
                >
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-3" />
                    <span className="font-medium">Meu Perfil</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/settings')}
                isActive={isActiveRoute('/settings')}
              >
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-3" />
                  <span className="font-medium">Configurações</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </ul>
        </nav>

        {/* Sidebar Footer - User Profile & Logout */}
        <div className="mt-auto">
          {/* User Profile Section */}
          <div className="p-6 border-t border-sidebar-border bg-gradient-to-r from-sidebar-accent to-sidebar-background">
            <div className="flex items-center space-x-3">
              <Avatar className="border-2 border-primary neon-glow">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/70 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
          
          {/* Logout Section */}
          <div className="p-4 border-t border-sidebar-border bg-gradient-to-r from-sidebar-background to-sidebar-accent">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-white hover:shadow-neon transition-all duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="bg-card shadow-lg border-b border-border px-6 py-4 sticky top-0 z-30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-foreground/80">
                Bem-vindo, <span className="font-medium text-primary">{user.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
