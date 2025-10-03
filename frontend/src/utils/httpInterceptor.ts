// HTTP Interceptor para manejo automático de tokens
// Basado en la documentación del sistema de autenticación JWT

interface RequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
}

interface InterceptorConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  excludeUrls?: string[];
}

class HttpInterceptor {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private excludeUrls: string[];
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    config: RequestConfig;
  }> = [];

  constructor(config: InterceptorConfig = {}) {
    this.baseURL = config.baseURL || 'http://localhost:3000';
    this.timeout = config.timeout || 10000;
    this.retryAttempts = config.retryAttempts || 1;
    this.excludeUrls = config.excludeUrls || [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh'
    ];
  }

  // Obtener token de acceso del localStorage
  private getAccessToken(): string | null {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.accessToken || null;
      }
    } catch (error) {
      console.error('Error parsing auth data:', error);
    }
    return null;
  }

  // Verificar si la URL debe ser excluida del interceptor
  private shouldExcludeUrl(url: string): boolean {
    return this.excludeUrls.some(excludeUrl => url.includes(excludeUrl));
  }

  // Verificar si el token ha expirado
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Renovar token de acceso
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      // Actualizar el token en localStorage
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        parsed.accessToken = data.accessToken;
        localStorage.setItem('auth', JSON.stringify(parsed));
      }

      return data.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      
      // Si falla la renovación, limpiar datos de autenticación
      localStorage.removeItem('auth');
      
      // Redirigir al login si estamos en el navegador
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      return null;
    }
  }

  // Procesar cola de peticiones fallidas
  private processFailedQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else {
        resolve(this.request(config));
      }
    });
    
    this.failedQueue = [];
  }

  // Método principal para realizar peticiones HTTP
  async request(config: RequestConfig): Promise<Response> {
    const { url, method = 'GET', headers = {}, body, credentials = 'include' } = config;
    
    // Construir URL completa
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Preparar headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Agregar token de autorización si no es una URL excluida
    if (!this.shouldExcludeUrl(fullUrl)) {
      const accessToken = this.getAccessToken();
      
      if (accessToken) {
        // Verificar si el token ha expirado
        if (this.isTokenExpired(accessToken)) {
          // Si ya se está renovando el token, agregar a la cola
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject, config });
            });
          }

          // Intentar renovar el token
          this.isRefreshing = true;
          
          try {
            const newToken = await this.refreshAccessToken();
            this.isRefreshing = false;
            
            if (newToken) {
              requestHeaders.Authorization = `Bearer ${newToken}`;
              this.processFailedQueue(null, newToken);
            } else {
              this.processFailedQueue(new Error('Failed to refresh token'));
              throw new Error('Authentication failed');
            }
          } catch (error) {
            this.isRefreshing = false;
            this.processFailedQueue(error);
            throw error;
          }
        } else {
          requestHeaders.Authorization = `Bearer ${accessToken}`;
        }
      }
    }

    // Configurar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Realizar la petición
      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Si la respuesta es 401 y no es una URL excluida, intentar renovar token
      if (response.status === 401 && !this.shouldExcludeUrl(fullUrl)) {
        // Si ya se está renovando el token, agregar a la cola
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject, config });
          });
        }

        // Intentar renovar el token
        this.isRefreshing = true;
        
        try {
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;
          
          if (newToken) {
            // Reintentar la petición original con el nuevo token
            const newConfig = {
              ...config,
              headers: {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              },
            };
            
            this.processFailedQueue(null, newToken);
            return this.request(newConfig);
          } else {
            this.processFailedQueue(new Error('Failed to refresh token'));
            throw new Error('Authentication failed');
          }
        } catch (error) {
          this.isRefreshing = false;
          this.processFailedQueue(error);
          throw error;
        }
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // Métodos de conveniencia para diferentes tipos de peticiones
  async get(url: string, config: Omit<RequestConfig, 'url' | 'method'> = {}) {
    return this.request({ ...config, url, method: 'GET' });
  }

  async post(url: string, body?: any, config: Omit<RequestConfig, 'url' | 'method' | 'body'> = {}) {
    return this.request({ ...config, url, method: 'POST', body });
  }

  async put(url: string, body?: any, config: Omit<RequestConfig, 'url' | 'method' | 'body'> = {}) {
    return this.request({ ...config, url, method: 'PUT', body });
  }

  async patch(url: string, body?: any, config: Omit<RequestConfig, 'url' | 'method' | 'body'> = {}) {
    return this.request({ ...config, url, method: 'PATCH', body });
  }

  async delete(url: string, config: Omit<RequestConfig, 'url' | 'method'> = {}) {
    return this.request({ ...config, url, method: 'DELETE' });
  }
}

// Crear instancia global del interceptor
export const httpClient = new HttpInterceptor({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  retryAttempts: 1,
  excludeUrls: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh'
  ]
});

// Exportar también la clase para casos de uso personalizados
export { HttpInterceptor };
export type { RequestConfig, InterceptorConfig };