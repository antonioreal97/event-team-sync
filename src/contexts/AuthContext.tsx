
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { buildApiUrl } from '@/config/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isGestor: boolean;
  isFreelancer: boolean;
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
    // Check for stored user on mount
    const storedUser = localStorage.getItem('equipe-s4u-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('equipe-s4u-user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no login');
      }

      const data = await response.json();
      
      // Criar objeto User compatível com o frontend
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Campos específicos de freelancer
        teamType: data.user.profile?.team_type || null,
        phone: data.user.profile?.phone || null,
        address: data.user.profile?.address || null,
        city: data.user.profile?.city || null,
        state: data.user.profile?.state || null,
        cpf: data.user.profile?.cpf || null,
        hourlyRate: data.user.profile?.hourly_rate || null,
        dailyRate: data.user.profile?.daily_rate || null,
        experienceLevel: data.user.profile?.experience_level || null,
        audioVisualRoles: data.user.profile?.audio_visual_roles || [],
        bio: data.user.profile?.bio || null,
        portfolio: data.user.profile?.portfolio || null,
        linkedin: data.user.profile?.linkedin || null,
        instagram: data.user.profile?.instagram || null,
        website: data.user.profile?.website || null,
        previousExperience: data.user.profile?.previous_experience || null,
        certifications: data.user.profile?.certifications || [],
        equipment: data.user.profile?.equipment || [],
        languages: data.user.profile?.languages || [],
        totalEventsAttended: data.user.profile?.total_events_attended || 0,
        totalEarnings: data.user.profile?.total_earnings || 0,
        averageRating: data.user.profile?.average_rating || 0,
      };

      setUser(userData);
      localStorage.setItem('equipe-s4u-user', JSON.stringify(userData));
      
      // Armazenar token JWT
      localStorage.setItem('equipe-s4u-token', data.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
          localStorage.removeItem('equipe-s4u-user');
      localStorage.removeItem('equipe-s4u-token');
  };

  const isGestor = user?.role === 'gestor';
  const isFreelancer = user?.role === 'freelancer';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isGestor,
      isFreelancer,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
