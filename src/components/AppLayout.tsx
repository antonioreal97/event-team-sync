
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import NotificationIndicator from '@/components/NotificationIndicator';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout, isProducer } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <h1 className="text-xl font-heading font-semibold text-event-DEFAULT">Event Team Sync</h1>
            </div>
            <div className="flex items-center space-x-3">
              <NotificationIndicator />
              <div className="flex items-center space-x-2">
                {user && (
                  <>
                    {user.avatar && (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium hidden md:block">{user.name}</span>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => logout()}>Sair</Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const AppSidebar = () => {
  const { isProducer } = useAuth();
  const navigate = useNavigate();
  
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-event-DEFAULT rounded-md flex items-center justify-center text-white font-bold">
            ETS
          </div>
          <span className="font-heading font-bold text-white">Event Team Sync</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate('/dashboard')}>
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate('/events')}>
                  <span>Eventos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => navigate('/notifications')}>
                  <span>Notificações</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isProducer && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={() => navigate('/equipment')}>
                    <span>Equipamentos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">
          Event Team Sync © 2025
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppLayout;
