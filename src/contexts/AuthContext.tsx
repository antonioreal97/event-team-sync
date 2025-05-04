
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isProducer: boolean;
  isCollaborator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Producer',
    email: 'producer@example.com',
    role: 'producer',
    avatar: 'https://ui-avatars.com/api/?name=John+Producer&background=1E3A8A&color=fff',
  },
  {
    id: '2',
    name: 'Anna Collaborator',
    email: 'collaborator@example.com',
    role: 'collaborator',
    avatar: 'https://ui-avatars.com/api/?name=Anna+Collaborator&background=0EA5E9&color=fff',
  },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('event-team-sync-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const matchedUser = mockUsers.find(u => u.email === email);
      if (!matchedUser) {
        throw new Error('Invalid credentials');
      }
      
      setUser(matchedUser);
      localStorage.setItem('event-team-sync-user', JSON.stringify(matchedUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('event-team-sync-user');
    setUser(null);
  };

  const isProducer = user?.role === 'producer';
  const isCollaborator = user?.role === 'collaborator';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isProducer, isCollaborator }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
