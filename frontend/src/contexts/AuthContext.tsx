import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { httpClient } from '../utils/httpInterceptor';

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface Session {
  id: string;
  user_id: string;
  device_info: string;
  ip_address: string;
  last_used: string;
  expires_at: string;
  is_current: boolean;
}

interface AuthContextType {
  user: User | null;
  sessions: Session[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // API Base URL
  const API_BASE = 'http://localhost:3000/api/auth';

  // Helper para hacer peticiones a la API
  const apiRequest = async (url: string, options: { method?: string; body?: any } = {}) => {
    const { method = 'GET', body } = options;
    
    const response = await httpClient.request({
      url,
      method,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Función para obtener el usuario actual
  const getCurrentUser = async (): Promise<void> => {
    try {
      const data = await apiRequest('/api/auth/me');
      setUser(data.user);
    } catch (error) {
      console.error('Error getting current user:', error);
      await logout();
    }
  };

  // Función de login
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      // Guardar datos de autenticación
      localStorage.setItem('auth', JSON.stringify({
        accessToken: data.accessToken,
        user: data.user
      }));
      
      setUser(data.user);
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Función de registro
  const register = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
    } catch (error: any) {
      throw new Error(error.message || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  // Función de logout
  const logout = async (): Promise<void> => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Limpiar datos locales independientemente del resultado
      localStorage.removeItem('auth');
      setUser(null);
      setSessions([]);
    }
  };

  // Función de logout de todas las sesiones
  const logoutAll = async (): Promise<void> => {
    try {
      await apiRequest('/api/auth/logout-all', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout all:', error);
    } finally {
      // Limpiar datos locales independientemente del resultado
      localStorage.removeItem('auth');
      setUser(null);
      setSessions([]);
    }
  };

  // Función para renovar token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const data = await apiRequest('/api/auth/refresh', { method: 'POST' });
      
      // Actualizar datos de autenticación
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        parsed.accessToken = data.accessToken;
        localStorage.setItem('auth', JSON.stringify(parsed));
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await logout();
      return false;
    }
  };

  // Función para obtener sesiones
  const getSessions = async (): Promise<void> => {
    try {
      const data = await apiRequest('/api/auth/sessions');
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Función para revocar una sesión
  const revokeSession = async (sessionId: string): Promise<void> => {
    try {
      await apiRequest(`/api/auth/sessions/${sessionId}/revoke`, { method: 'POST' });
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  };

  // Función para actualizar perfil
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      const data = await apiRequest('/api/auth/me', {
        method: 'PATCH',
        body: userData,
      });
      
      setUser(data.user);
      
      // Actualizar datos de autenticación
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        parsed.user = data.user;
        localStorage.setItem('auth', JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };



  // Efecto para inicializar la autenticación
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        const authData = localStorage.getItem('auth');
        
        if (authData) {
          const parsed = JSON.parse(authData);
          
          if (parsed.accessToken && parsed.user) {
            setUser(parsed.user);
            
            // Verificar si el token sigue siendo válido
            await getCurrentUser();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Si hay error, limpiar datos
        localStorage.removeItem('auth');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Efecto para obtener sesiones cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated) {
      getSessions();
    }
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    sessions,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    logoutAll,
    refreshToken,
    getSessions,
    revokeSession,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;