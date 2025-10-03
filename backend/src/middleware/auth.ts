import { Request, Response, NextFunction } from 'express';
import { AuthService, JWTPayload } from '../services/AuthService';
import { UserModel } from '../models/User';
import { SessionModel } from '../models/Session';

// Extender el tipo Request para incluir user y session
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        roles: string[];
        is_active: boolean;
      };
      session?: {
        id: string;
        user_id: string;
        ip: string;
        user_agent: string;
        created_at: Date;
        last_used_at: Date;
      };
      jwtPayload?: JWTPayload;
    }
  }
}

export interface AuthMiddlewareOptions {
  required?: boolean; // Si es true, requiere autenticación. Si es false, es opcional
  roles?: string[]; // Roles requeridos para acceder
}

// Middleware principal de autenticación
export const authenticate = (options: AuthMiddlewareOptions = { required: true }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      // Extraer token del header Authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.required) {
          return res.status(401).json({
            error: 'Token de acceso requerido',
            code: 'MISSING_TOKEN'
          });
        }
        return next(); // Continuar sin autenticación si no es requerida
      }

      const token = authHeader.substring(7); // Remover 'Bearer '

      // Verificar y decodificar el token
      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        if (options.required) {
          return res.status(401).json({
            error: 'Token de acceso inválido o expirado',
            code: 'INVALID_TOKEN'
          });
        }
        return next();
      }

      // Buscar usuario
      const user = await UserModel.findById(payload.sub);
      if (!user || !user.is_active) {
        if (options.required) {
          return res.status(401).json({
            error: 'Usuario no encontrado o inactivo',
            code: 'USER_NOT_FOUND'
          });
        }
        return next();
      }

      // Verificar sesión si hay jti en el token
      if (payload.jti) {
        const session = await SessionModel.findById(payload.jti);
        if (!session || session.revoked_at || session.expires_at < new Date()) {
          if (options.required) {
            return res.status(401).json({
              error: 'Sesión inválida o expirada',
              code: 'INVALID_SESSION'
            });
          }
          return next();
        }

        // Actualizar última actividad de la sesión
        await SessionModel.update(session.id, { last_used_at: new Date() });

        // Agregar información de sesión al request
        req.session = {
          id: session.id,
          user_id: session.user_id,
          ip: session.ip,
          user_agent: session.user_agent,
          created_at: session.created_at,
          last_used_at: new Date()
        };
      }

      // Verificar roles si se especificaron
      if (options.roles && options.roles.length > 0) {
        const hasRequiredRole = options.roles.some(role => user.roles.includes(role));
        if (!hasRequiredRole) {
          return res.status(403).json({
            error: 'Permisos insuficientes',
            code: 'INSUFFICIENT_PERMISSIONS',
            required_roles: options.roles,
            user_roles: user.roles
          });
        }
      }

      // Agregar información del usuario al request (sin contraseña)
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        is_active: user.is_active
      };

      req.jwtPayload = payload;

      next();
    } catch (error) {
      console.error('Error en middleware de autenticación:', error);
      
      if (options.required) {
        return res.status(500).json({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR'
        });
      }
      
      next();
    }
  };
};

// Middleware para autenticación opcional
export const optionalAuth = authenticate({ required: false });

// Middleware para requerir autenticación
export const requireAuth = authenticate({ required: true });

// Middleware para requerir roles específicos
export const requireRoles = (roles: string[]) => {
  return authenticate({ required: true, roles });
};

// Middleware para requerir rol de administrador
export const requireAdmin = requireRoles(['admin']);

// Middleware para requerir rol de moderador o administrador
export const requireModerator = requireRoles(['moderator', 'admin']);

// Middleware para extraer información de IP y User-Agent
export const extractClientInfo = (req: Request, res: Response, next: NextFunction) => {
  // Obtener IP real considerando proxies
  const ip = req.headers['x-forwarded-for'] as string || 
             req.headers['x-real-ip'] as string ||
             req.connection.remoteAddress ||
             req.socket.remoteAddress ||
             'unknown';

  // Obtener User-Agent
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Agregar al request para uso posterior
  req.clientInfo = {
    ip: Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim(),
    userAgent
  };

  next();
};

// Extender el tipo Request para clientInfo
declare global {
  namespace Express {
    interface Request {
      clientInfo?: {
        ip: string;
        userAgent: string;
      };
    }
  }
}

// Middleware para rate limiting básico (en memoria)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number = 5, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.clientInfo?.ip || req.ip || 'unknown';
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      // Nueva ventana de tiempo
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Demasiadas solicitudes',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
    next();
  };
};

// Rate limiting específico para login
export const loginRateLimit = rateLimit(5, 15 * 60 * 1000); // 5 intentos por 15 minutos

// Rate limiting específico para refresh
export const refreshRateLimit = rateLimit(10, 5 * 60 * 1000); // 10 intentos por 5 minutos