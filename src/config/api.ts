// Configuração centralizada da API
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      VERIFY: '/auth/verify',
    },
    USERS: {
      BASE: '/users',
      PROFILE: '/users/profile',
      TEAM: '/users/:id/team',
      STATUS: '/users/:id/status',
    },
    EVENTS: {
      BASE: '/events',
      BY_ID: '/events/:id',
    },
    TEAMS: {
      BASE: '/teams',
      ALLOCATE: '/teams/allocate',
      ATTENDANCE: '/teams/attendance/:allocationId',
      PAYMENT: '/teams/payment/:allocationId/confirm',
    },
    EQUIPMENT: {
      BASE: '/equipment',
      BY_ID: '/equipment/:id',
    },
    NOTIFICATIONS: {
      BASE: '/notifications',
      READ: '/notifications/:id/read',
      READ_ALL: '/notifications/read-all',
    },
    INVITES: {
      BASE: '/invites',
      VERIFY: '/invites/verify/:token',
      ACCEPT: '/invites/accept/:token',
    },
  },
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// Função para obter token de autenticação
export const getAuthToken = (): string | null => {
  return localStorage.getItem('equipe-s4u-token');
};

// Função para configurar headers com autenticação
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return {
    ...API_CONFIG.HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Função para construir URL da API
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  
  return url;
};


