
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { apiFetch, getApiBaseUrl, getStoredAuthToken, setStoredAuthToken } from '@/lib/api';
import { mapApiProfileRowToUser } from '@/lib/mapApiProfileToUser';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isGestor: boolean;
  isFreelancer: boolean;
  isLiderFreelancer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function demoUserFromToken(token: string): User | null {
  if (token === 'demo-token-admin') {
    return {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Administrador',
      email: 'admin@frela.com',
      role: 'gestor',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      experienceLevel: 'expert',
      audioVisualRoles: [],
      certifications: [],
      equipment: [],
      languages: [],
      totalEventsAttended: 0,
      totalEarnings: 0,
    };
  }
  if (token === 'demo-token-freelancer') {
    return {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Freelancer Demo',
      email: 'freelancer@frela.com',
      role: 'freelancer',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      teamType: 'intermediario',
      phone: '(11) 99999-9999',
      address: 'Rua Demo, 123',
      city: 'São Paulo',
      state: 'SP',
      cpf: '000.000.000-00',
      hourlyRate: 50,
      dailyRate: 400,
      experienceLevel: 'intermediario',
      audioVisualRoles: ['camera', 'audio'],
      bio: 'Freelancer especializado em audiovisual',
      certifications: [],
      equipment: [],
      languages: ['Português', 'Inglês'],
      totalEventsAttended: 5,
      totalEarnings: 2000,
      averageRating: 4.5,
    };
  }
  if (token === 'demo-token-lider') {
    return {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Líder Freelancer',
      email: 'lider@frela.com',
      role: 'lider_freelancer',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      teamType: 'avancado',
      phone: '(11) 98888-8888',
      address: 'Rua Líder, 456',
      city: 'São Paulo',
      state: 'SP',
      cpf: '111.111.111-11',
      hourlyRate: 60,
      dailyRate: 500,
      experienceLevel: 'avancado',
      audioVisualRoles: ['director', 'producer'],
      bio: 'Líder de equipe especializado em gestão de projetos audiovisuais',
      certifications: [],
      equipment: [],
      languages: ['Português', 'Inglês', 'Espanhol'],
      totalEventsAttended: 15,
      totalEarnings: 7500,
      averageRating: 4.8,
    };
  }
  return null;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserFromApiToken = useCallback(async () => {
    const data = await apiFetch<{ user: Record<string, unknown> }>('/users/profile/me');
    setUser(mapApiProfileRowToUser(data.user));
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      if (token.startsWith('demo-token-')) {
        const demo = demoUserFromToken(token);
        setUser(demo);
        setLoading(false);
        return;
      }
      try {
        await loadUserFromApiToken();
      } catch {
        setStoredAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [loadUserFromApiToken]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (email === 'admin@frela.com' && password === 'admin123') {
        const u = demoUserFromToken('demo-token-admin')!;
        setUser(u);
        setStoredAuthToken('demo-token-admin');
        return;
      }
      if (email === 'freelancer@frela.com' && password === 'freelancer123') {
        const u = demoUserFromToken('demo-token-freelancer')!;
        setUser(u);
        setStoredAuthToken('demo-token-freelancer');
        return;
      }
      if (email === 'lider@frela.com' && password === 'lider123') {
        const u = demoUserFromToken('demo-token-lider')!;
        setUser(u);
        setStoredAuthToken('demo-token-lider');
        return;
      }

      const loginRes = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginBody = (await loginRes.json()) as { token?: string; error?: string };
      if (!loginRes.ok) {
        throw new Error(loginBody.error || 'Falha no login');
      }
      if (!loginBody.token) {
        throw new Error('Resposta de login sem token');
      }
      setStoredAuthToken(loginBody.token);
      await loadUserFromApiToken();
      await supabase.auth.signOut().catch(() => {});
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setStoredAuthToken(null);
    setUser(null);
    await supabase.auth.signOut().catch(() => {});
  };

  const isGestor = user?.role === 'gestor';
  const isFreelancer = user?.role === 'freelancer';
  const isLiderFreelancer = user?.role === 'lider_freelancer';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isGestor,
      isFreelancer,
      isLiderFreelancer,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
