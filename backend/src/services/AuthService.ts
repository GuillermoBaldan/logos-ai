import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserModel, User, CreateUserData } from '../models/User';
import { SessionModel, Session, CreateSessionData } from '../models/Session';

export interface JWTPayload {
  sub: string; // user_id
  iss: string; // issuer
  aud: string; // audience
  iat: number; // issued at
  exp: number; // expiration
  roles: string[];
  jti?: string; // session_id (opcional)
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  access_token: string;
  expires_in: number;
  user: Omit<User, 'password'>;
}

export interface RefreshResult {
  access_token: string;
  expires_in: number;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private static readonly JWT_ISSUER = process.env.JWT_ISSUER || 'logos-ai';
  private static readonly JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'logos-ai-users';
  private static readonly ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '10m';
  private static readonly REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '14d';
  private static readonly SALT_ROUNDS = 12;

  // Generar access token JWT
  static generateAccessToken(user: User, sessionId?: string): string {
    const payload: JWTPayload = {
      sub: user.id,
      iss: this.JWT_ISSUER,
      aud: this.JWT_AUDIENCE,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseTimeToSeconds(this.ACCESS_TOKEN_TTL),
      roles: user.roles,
      jti: sessionId
    };

    return jwt.sign(payload, this.JWT_SECRET);
  }

  // Generar refresh token
  static generateRefreshToken(): string {
    return uuidv4() + '-' + Date.now() + '-' + Math.random().toString(36);
  }

  // Hash del refresh token
  static async hashRefreshToken(refreshToken: string): Promise<string> {
    return bcrypt.hash(refreshToken, this.SALT_ROUNDS);
  }

  // Verificar refresh token
  static async verifyRefreshToken(refreshToken: string, hash: string): Promise<boolean> {
    return bcrypt.compare(refreshToken, hash);
  }

  // Hash de contraseña
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // Verificar contraseña
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Verificar y decodificar JWT
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      
      // Verificar claims básicos
      if (decoded.iss !== this.JWT_ISSUER || decoded.aud !== this.JWT_AUDIENCE) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Registrar usuario
  static async register(userData: CreateUserData): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await this.hashPassword(userData.password);

    // Crear usuario
    const user = await UserModel.create({
      ...userData,
      password: hashedPassword
    });

    return user;
  }

  // Login
  static async login(credentials: LoginCredentials, ip: string, userAgent: string): Promise<{ loginResult: LoginResult; refreshToken: string; sessionId: string }> {
    // Buscar usuario por email
    const user = await UserModel.findByEmail(credentials.email);
    if (!user || !user.is_active) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const isValidPassword = await this.verifyPassword(credentials.password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Generar refresh token y su hash
    const refreshToken = this.generateRefreshToken();
    const refreshHash = await this.hashRefreshToken(refreshToken);

    // Crear sesión
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + this.parseTimeToSeconds(this.REFRESH_TOKEN_TTL) * 1000);

    const session = await SessionModel.create({
      user_id: user.id,
      refresh_hash: refreshHash,
      ip,
      user_agent: userAgent,
      expires_at: expiresAt
    });

    // Generar access token
    const accessToken = this.generateAccessToken(user, session.id);

    // Actualizar último login
    await UserModel.update(user.id, { last_login_at: new Date() });

    // Preparar resultado sin contraseña
    const { password, ...userWithoutPassword } = user;

    return {
      loginResult: {
        access_token: accessToken,
        expires_in: this.parseTimeToSeconds(this.ACCESS_TOKEN_TTL),
        user: userWithoutPassword
      },
      refreshToken,
      sessionId: session.id
    };
  }

  // Refresh token
  static async refresh(refreshToken: string, ip: string, userAgent: string): Promise<RefreshResult> {
    // Buscar sesión activa por refresh token
    const sessions = await SessionModel.findAll();
    let validSession: Session | null = null;

    for (const session of sessions) {
      if (!session.revoked_at && session.expires_at > new Date()) {
        const isValid = await this.verifyRefreshToken(refreshToken, session.refresh_hash);
        if (isValid) {
          validSession = session;
          break;
        }
      }
    }

    if (!validSession) {
      throw new Error('Refresh token inválido o expirado');
    }

    // Buscar usuario
    const user = await UserModel.findById(validSession.user_id);
    if (!user || !user.is_active) {
      throw new Error('Usuario no encontrado o inactivo');
    }

    // Actualizar última actividad de la sesión
    await SessionModel.update(validSession.id, { 
      last_used_at: new Date() 
    });

    // Generar nuevo access token
    const accessToken = this.generateAccessToken(user, validSession.id);

    return {
      access_token: accessToken,
      expires_in: this.parseTimeToSeconds(this.ACCESS_TOKEN_TTL)
    };
  }

  // Logout
  static async logout(sessionId: string): Promise<void> {
    await SessionModel.revoke(sessionId);
  }

  // Logout global (todas las sesiones del usuario)
  static async logoutAll(userId: string): Promise<number> {
    return SessionModel.revokeAllByUserId(userId);
  }

  // Obtener sesiones activas del usuario
  static async getUserSessions(userId: string): Promise<Omit<Session, 'refresh_hash'>[]> {
    const sessions = await SessionModel.findByUserId(userId);
    
    return sessions.map(session => {
      const { refresh_hash, ...sessionWithoutHash } = session;
      return sessionWithoutHash;
    });
  }

  // Revocar sesión específica
  static async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    const session = await SessionModel.findById(sessionId);
    if (!session || session.user_id !== userId) {
      return false;
    }

    return SessionModel.revoke(sessionId);
  }

  // Limpiar sesiones expiradas
  static async cleanupExpiredSessions(): Promise<number> {
    return SessionModel.deleteExpired();
  }

  // Utilidad para parsear tiempo a segundos
  private static parseTimeToSeconds(timeStr: string): number {
    const unit = timeStr.slice(-1);
    const value = parseInt(timeStr.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 600; // 10 minutos por defecto
    }
  }
}