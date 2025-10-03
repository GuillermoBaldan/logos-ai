import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '10m';
const REFRESH_TTL_SECONDS = parseTtlToSeconds(process.env.REFRESH_TOKEN_TTL || '14d');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined; // set in prod

// Minimal in-memory users and sessions
const users = [{ id: 'u1', email: 'demo@logos.ai', passwordHash: await bcrypt.hash('demo123', 10), roles: ['user'] }];
const sessions = new Map(); // sessionId -> { userId, refreshHash, createdAt, lastUsedAt, ip, ua, revokedAt }

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

const loginLimiter = rateLimit({ windowMs: 60_000, max: 20 });
const refreshLimiter = rateLimit({ windowMs: 60_000, max: 60 });

// Helpers
function parseTtlToSeconds(ttl) {
  const m = String(ttl).match(/^(\d+)([smhd])$/);
  if (!m) return 600; // default 10m
  const num = Number(m[1]);
  const unit = m[2];
  const mult = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return num * mult;
}

function msFromSeconds(sec) { return sec * 1000; }

async function signAccess(userId, roles) {
  const alg = 'HS256';
  const key = new TextEncoder().encode(JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  const ttlSec = parseTtlToSeconds(ACCESS_TTL);
  return await new SignJWT({ sub: userId, roles })
    .setProtectedHeader({ alg })
    .setIssuer('logos-ai')
    .setAudience('logos-ai-client')
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSec)
    .sign(key);
}

async function verifyAccess(token) {
  const key = new TextEncoder().encode(JWT_SECRET);
  return await jwtVerify(token, key, { issuer: 'logos-ai', audience: 'logos-ai-client' });
}

function setRefreshCookie(res, refreshToken) {
  const options = {
    httpOnly: true,
    secure: true, // set to true, assumes HTTPS; for local dev with http, set to false via env if needed
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: msFromSeconds(REFRESH_TTL_SECONDS),
    domain: COOKIE_DOMAIN,
  };
  res.cookie('refresh_token', refreshToken, options);
}

function clearRefreshCookie(res) {
  res.clearCookie('refresh_token', { path: '/auth/refresh', domain: COOKIE_DOMAIN });
}

function randomId() { return Math.random().toString(36).slice(2); }

// Auth routes
app.post('/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password || '', user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const access = await signAccess(user.id, user.roles);
  const sessionId = randomId();
  const refreshPlain = randomId() + randomId();
  const refreshHash = await bcrypt.hash(refreshPlain, 10);
  sessions.set(sessionId, { userId: user.id, refreshHash, createdAt: new Date().toISOString(), lastUsedAt: new Date().toISOString(), ip: req.ip, ua: req.headers['user-agent'], revokedAt: null });
  setRefreshCookie(res, `${sessionId}.${refreshPlain}`);
  res.json({ access_token: access, expires_in: parseTtlToSeconds(ACCESS_TTL) });
});

app.post('/auth/refresh', refreshLimiter, async (req, res) => {
  const cookie = req.cookies?.refresh_token;
  if (!cookie) return res.status(401).json({ error: 'No refresh cookie' });
  const [sessionId, refreshPlain] = String(cookie).split('.');
  const s = sessions.get(sessionId);
  if (!s || s.revokedAt) return res.status(401).json({ error: 'Invalid session' });
  const ok = await bcrypt.compare(refreshPlain || '', s.refreshHash);
  if (!ok) return res.status(401).json({ error: 'Invalid refresh' });
  s.lastUsedAt = new Date().toISOString();
  const access = await signAccess(s.userId, ['user']);
  // simple rotation optional: emit new refresh
  const newRefreshPlain = randomId() + randomId();
  s.refreshHash = await bcrypt.hash(newRefreshPlain, 10);
  setRefreshCookie(res, `${sessionId}.${newRefreshPlain}`);
  res.json({ access_token: access, expires_in: parseTtlToSeconds(ACCESS_TTL) });
});

app.post('/auth/logout', (req, res) => {
  const cookie = req.cookies?.refresh_token;
  if (cookie) {
    const [sessionId] = String(cookie).split('.');
    const s = sessions.get(sessionId);
    if (s) s.revokedAt = new Date().toISOString();
  }
  clearRefreshCookie(res);
  res.status(204).end();
});

app.get('/auth/sessions', async (req, res) => {
  // demo: require access token
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  try {
    const { payload } = await verifyAccess(token);
    const list = [...sessions.entries()].filter(([_, v]) => v.userId === payload.sub).map(([id, v]) => ({ id, ...v }));
    res.json(list);
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.post('/auth/sessions/:id/revoke', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  try {
    const { payload } = await verifyAccess(token);
    const id = req.params.id;
    const s = sessions.get(id);
    if (!s || s.userId !== payload.sub) return res.status(404).json({ error: 'Not found' });
    s.revokedAt = new Date().toISOString();
    res.status(204).end();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.get('/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  try {
    const { payload } = await verifyAccess(token);
    res.json({ id: payload.sub, roles: payload.roles });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.get('/', (req, res) => {
  res.send('Auth server running');
});

app.listen(PORT, () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});