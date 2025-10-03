export interface Session {
  id: string; // session_id (jti)
  user_id: string;
  refresh_hash: string; // Hash del refresh token
  created_at: Date;
  last_used_at: Date;
  expires_at: Date;
  ip: string;
  user_agent: string;
  revoked_at?: Date;
}

export interface CreateSessionData {
  user_id: string;
  refresh_hash: string;
  ip: string;
  user_agent: string;
  expires_at: Date;
}

export interface UpdateSessionData {
  refresh_hash?: string;
  last_used_at?: Date;
  revoked_at?: Date;
}

// Simulación de base de datos en memoria (para desarrollo)
export class SessionModel {
  private static sessions: Session[] = [];

  static async findById(id: string): Promise<Session | null> {
    return this.sessions.find(session => session.id === id) || null;
  }

  static async findByUserId(userId: string): Promise<Session[]> {
    return this.sessions.filter(session => 
      session.user_id === userId && 
      !session.revoked_at &&
      session.expires_at > new Date()
    );
  }

  static async findActiveByRefreshHash(refreshHash: string): Promise<Session | null> {
    return this.sessions.find(session => 
      session.refresh_hash === refreshHash && 
      !session.revoked_at &&
      session.expires_at > new Date()
    ) || null;
  }

  static async create(sessionData: CreateSessionData): Promise<Session> {
    const session: Session = {
      id: require('uuid').v4(),
      user_id: sessionData.user_id,
      refresh_hash: sessionData.refresh_hash,
      created_at: new Date(),
      last_used_at: new Date(),
      expires_at: sessionData.expires_at,
      ip: sessionData.ip,
      user_agent: sessionData.user_agent
    };

    this.sessions.push(session);
    return session;
  }

  static async update(id: string, updateData: UpdateSessionData): Promise<Session | null> {
    const sessionIndex = this.sessions.findIndex(session => session.id === id);
    if (sessionIndex === -1) return null;

    this.sessions[sessionIndex] = {
      ...this.sessions[sessionIndex],
      ...updateData
    };

    return this.sessions[sessionIndex];
  }

  static async revoke(id: string): Promise<boolean> {
    const sessionIndex = this.sessions.findIndex(session => session.id === id);
    if (sessionIndex === -1) return false;

    this.sessions[sessionIndex].revoked_at = new Date();
    return true;
  }

  static async revokeAllByUserId(userId: string): Promise<number> {
    let revokedCount = 0;
    const now = new Date();

    this.sessions.forEach(session => {
      if (session.user_id === userId && !session.revoked_at) {
        session.revoked_at = now;
        revokedCount++;
      }
    });

    return revokedCount;
  }

  static async deleteExpired(): Promise<number> {
    const now = new Date();
    const initialLength = this.sessions.length;
    
    this.sessions = this.sessions.filter(session => 
      session.expires_at > now || !session.revoked_at
    );

    return initialLength - this.sessions.length;
  }

  static async findAll(): Promise<Session[]> {
    return this.sessions;
  }
}