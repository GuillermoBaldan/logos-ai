import express, { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { 
  extractClientInfo, 
  loginRateLimit, 
  refreshRateLimit, 
  requireAuth 
} from '../middleware/auth';

const router = express.Router();

// Configuración de cookies
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
  sameSite: 'lax' as const,
  path: '/api/auth/refresh',
  maxAge: 14 * 24 * 60 * 60 * 1000 // 14 días en milisegundos
};

// POST /auth/register - Registro de usuario
router.post('/register', extractClientInfo, async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validaciones básicas
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, contraseña y nombre son requeridos',
        code: 'MISSING_FIELDS'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres',
        code: 'WEAK_PASSWORD'
      });
    }

    // Crear usuario
    const user = await AuthService.register({ email, password, name });

    // Respuesta sin contraseña
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userWithoutPassword
    });

  } catch (error: any) {
    console.error('Error en registro:', error);
    
    if (error.message === 'El email ya está registrado') {
      return res.status(409).json({
        error: error.message,
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /auth/login - Inicio de sesión
router.post('/login', extractClientInfo, loginRateLimit, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const ip = req.clientInfo?.ip || 'unknown';
    const userAgent = req.clientInfo?.userAgent || 'unknown';

    // Realizar login
    const { loginResult, refreshToken, sessionId } = await AuthService.login(
      { email, password },
      ip,
      userAgent
    );

    // Establecer cookie con refresh token
    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);

    // Responder con access token
    res.json({
      ...loginResult,
      session_id: sessionId
    });

  } catch (error: any) {
    console.error('Error en login:', error);
    
    if (error.message === 'Credenciales inválidas') {
      return res.status(401).json({
        error: error.message,
        code: 'INVALID_CREDENTIALS'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /auth/refresh - Renovar access token
router.post('/refresh', extractClientInfo, refreshRateLimit, async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token no encontrado',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    const ip = req.clientInfo?.ip || 'unknown';
    const userAgent = req.clientInfo?.userAgent || 'unknown';

    // Renovar token
    const result = await AuthService.refresh(refreshToken, ip, userAgent);

    res.json(result);

  } catch (error: any) {
    console.error('Error en refresh:', error);
    
    if (error.message === 'Refresh token inválido o expirado') {
      // Limpiar cookie inválida
      res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
      
      return res.status(401).json({
        error: error.message,
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /auth/logout - Cerrar sesión
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.session?.id;

    if (sessionId) {
      await AuthService.logout(sessionId);
    }

    // Limpiar cookie
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });

    res.status(204).send();

  } catch (error: any) {
    console.error('Error en logout:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /auth/logout-all - Cerrar todas las sesiones
router.post('/logout-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
        code: 'UNAUTHENTICATED'
      });
    }

    const revokedCount = await AuthService.logoutAll(userId);

    // Limpiar cookie actual
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });

    res.json({
      message: 'Todas las sesiones han sido cerradas',
      revoked_sessions: revokedCount
    });

  } catch (error: any) {
    console.error('Error en logout-all:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /auth/sessions - Obtener sesiones activas
router.get('/sessions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
        code: 'UNAUTHENTICATED'
      });
    }

    const sessions = await AuthService.getUserSessions(userId);

    // Marcar la sesión actual
    const currentSessionId = req.session?.id;
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      is_current: session.id === currentSessionId
    }));

    res.json({
      sessions: sessionsWithCurrent
    });

  } catch (error: any) {
    console.error('Error obteniendo sesiones:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /auth/sessions/:id/revoke - Revocar sesión específica
router.post('/sessions/:id/revoke', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
        code: 'UNAUTHENTICATED'
      });
    }

    const success = await AuthService.revokeSession(sessionId, userId);

    if (!success) {
      return res.status(404).json({
        error: 'Sesión no encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Si es la sesión actual, limpiar cookie
    if (sessionId === req.session?.id) {
      res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    }

    res.status(204).send();

  } catch (error: any) {
    console.error('Error revocando sesión:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /auth/me - Obtener información del usuario actual
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const session = req.session;

    if (!user) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
        code: 'UNAUTHENTICATED'
      });
    }

    res.json({
      user,
      session: session ? {
        id: session.id,
        created_at: session.created_at,
        last_used_at: session.last_used_at,
        ip: session.ip,
        user_agent: session.user_agent
      } : null
    });

  } catch (error: any) {
    console.error('Error obteniendo información del usuario:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /auth/cleanup - Limpiar sesiones expiradas (endpoint administrativo)
router.post('/cleanup', requireAuth, async (req: Request, res: Response) => {
  try {
    // Solo administradores pueden limpiar sesiones
    if (!req.user?.roles.includes('admin')) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const deletedCount = await AuthService.cleanupExpiredSessions();

    res.json({
      message: 'Sesiones expiradas eliminadas',
      deleted_sessions: deletedCount
    });

  } catch (error: any) {
    console.error('Error en cleanup:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;