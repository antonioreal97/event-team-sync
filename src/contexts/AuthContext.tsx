
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select(`
          *,
          freelancer_profiles (*)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        const freelancerProfile = profile.freelancer_profiles?.[0];
        
        const userData: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as 'gestor' | 'freelancer' | 'lider_freelancer',
          avatar: profile.avatar,
          isActive: profile.is_active,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          teamType: freelancerProfile?.team_type as 'equipe_a' | 'equipe_b' | 'sem_equipe' | undefined,
          phone: freelancerProfile?.phone,
          address: freelancerProfile?.address,
          city: freelancerProfile?.city,
          state: freelancerProfile?.state,
          cpf: freelancerProfile?.cpf,
          hourlyRate: freelancerProfile?.hourly_rate,
          dailyRate: freelancerProfile?.daily_rate,
          experienceLevel: (freelancerProfile?.experience_level as 'iniciante' | 'intermediario' | 'avancado' | 'expert') || 'iniciante',
          audioVisualRoles: (freelancerProfile?.audio_visual_roles as ('camera' | 'audio' | 'lighting' | 'director' | 'producer' | 'assistant' | 'technician' | 'streaming' | 'editing')[]) || [],
          bio: freelancerProfile?.bio,
          portfolio: freelancerProfile?.portfolio,
          linkedin: freelancerProfile?.linkedin,
          instagram: freelancerProfile?.instagram,
          website: freelancerProfile?.website,
          previousExperience: freelancerProfile?.previous_experience,
          certifications: freelancerProfile?.certifications || [],
          equipment: freelancerProfile?.equipment || [],
          languages: freelancerProfile?.languages || [],
          totalEventsAttended: freelancerProfile?.total_events_attended || 0,
          totalEarnings: freelancerProfile?.total_earnings || 0,
          averageRating: freelancerProfile?.average_rating,
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Demo login for development - create demo users with valid UUIDs
      if (email === 'admin@frela.com' && password === 'admin123') {
        const demoUser: User = {
          id: '00000000-0000-0000-0000-000000000001', // Valid UUID format
          name: 'Administrador',
          email: 'admin@frela.com',
          role: 'gestor',
          avatar: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teamType: undefined,
          phone: null,
          address: null,
          city: null,
          state: null,
          cpf: null,
          hourlyRate: null,
          dailyRate: null,
          experienceLevel: 'expert',
          audioVisualRoles: [],
          bio: null,
          portfolio: null,
          linkedin: null,
          instagram: null,
          website: null,
          previousExperience: null,
          certifications: [],
          equipment: [],
          languages: [],
          totalEventsAttended: 0,
          totalEarnings: 0,
          averageRating: undefined,
        };
        setUser(demoUser);
        // Armazenar token demo no localStorage para autenticação
        localStorage.setItem('token', 'demo-token-admin');
        return;
      }

      if (email === 'freelancer@frela.com' && password === 'freelancer123') {
        const demoUser: User = {
          id: '00000000-0000-0000-0000-000000000002', // Valid UUID format
          name: 'Freelancer Demo',
          email: 'freelancer@frela.com',
          role: 'freelancer',
          avatar: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teamType: 'equipe_a',
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
          portfolio: null,
          linkedin: null,
          instagram: null,
          website: null,
          previousExperience: null,
          certifications: [],
          equipment: [],
          languages: ['Português', 'Inglês'],
          totalEventsAttended: 5,
          totalEarnings: 2000,
          averageRating: 4.5,
        };
        setUser(demoUser);
        // Armazenar token demo no localStorage para autenticação
        localStorage.setItem('token', 'demo-token-freelancer');
        return;
      }

      if (email === 'lider@frela.com' && password === 'lider123') {
        const demoUser: User = {
          id: '00000000-0000-0000-0000-000000000003', // Valid UUID format
          name: 'Líder Freelancer',
          email: 'lider@frela.com',
          role: 'lider_freelancer',
          avatar: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teamType: 'equipe_a',
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
          portfolio: null,
          linkedin: null,
          instagram: null,
          website: null,
          previousExperience: null,
          certifications: [],
          equipment: [],
          languages: ['Português', 'Inglês', 'Espanhol'],
          totalEventsAttended: 15,
          totalEarnings: 7500,
          averageRating: 4.8,
        };
        setUser(demoUser);
        // Armazenar token demo no localStorage para autenticação
        localStorage.setItem('token', 'demo-token-lider');
        return;
      }

      // For production, use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUserProfile(data.user.id);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    setUser(null);
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
