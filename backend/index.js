require('dotenv').config();
const express=require('express');
const cors=require('cors');
const cookieParser=require('cookie-parser');
const rateLimit=require('express-rate-limit');
const bcrypt=require('bcrypt');
const {createSecretKey}=require('crypto');
const {SignJWT,jwtVerify}=require('jose');
const app=express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin:true,credentials:true}));
app.use(rateLimit({windowMs:60*1000,max:60}));
const ACCESS_TTL=process.env.ACCESS_TOKEN_TTL||'10m';
const REFRESH_TTL_S=parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS||(14*24*60*60),10);
const ISS=process.env.JWT_ISSUER||'logos-ai';
const AUD=process.env.JWT_AUDIENCE||'logos-ai-client';
const JWT_SECRET=process.env.JWT_SECRET||'change_this_dev_secret';
const secretKey=createSecretKey(Buffer.from(JWT_SECRET));
const users=[{id:'u1',email:'user@example.com',passwordHash:bcrypt.hashSync('password123',10),roles:['user']}];
const sessions=new Map();
function ttlToSeconds(str){const m=str.match(/^(\d+)([smhd])$/);if(!m)return 600;const v=parseInt(m[1],10),u=m[2];return u==='s'?v:u==='m'?v*60:u==='h'?v*3600:u==='d'?v*86400:600;}
async function signAccessToken(uid,roles){const now=Math.floor(Date.now()/1000);const exp=now+ttlToSeconds(ACCESS_TTL);return await new SignJWT({roles}).setProtectedHeader({alg:'HS256'}).setSubject(uid).setIssuer(ISS).setAudience(AUD).setIssuedAt(now).setExpirationTime(exp).sign(secretKey);} 
async function verifyAccessToken(t){const {payload}=await jwtVerify(t,secretKey,{issuer:ISS,audience:AUD});return payload;}
function rid(){return Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);} 
function setRefreshCookie(res,refresh){res.cookie('refresh_token',refresh,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/auth/refresh',maxAge:REFRESH_TTL_S*1000});}
app.post('/auth/login',async(req,res)=>{const{email,password}=req.body;const user=users.find(u=>u.email===email);if(!user)return res.status(401).json({error:'Invalid credentials'});if(!bcrypt.compareSync(password,user.passwordHash))return res.status(401).json({error:'Invalid credentials'});const sid=rid();const rt=rid();const now=Date.now();sessions.set(sid,{userId:user.id,refreshHash:bcrypt.hashSync(rt,10),createdAt:now,lastUsedAt:now,ip:req.ip,userAgent:req.headers['user-agent']||'',revokedAt:null,exp:now+REFRESH_TTL_S*1000});const at=await signAccessToken(user.id,user.roles);setRefreshCookie(res,`${sid}.${rt}`);res.json({access_token:at,expires_in:ttlToSeconds(ACCESS_TTL)});});
app.post('/auth/refresh',async(req,res)=>{const c=req.cookies['refresh_token'];if(!c)return res.status(401).json({error:'No refresh'});const[sid,rt]=c.split('.');const s=sessions.get(sid);if(!s||s.revokedAt)return res.status(401).json({error:'Invalid session'});if(Date.now()>s.exp)return res.status(401).json({error:'Session expired'});if(!bcrypt.compareSync(rt,s.refreshHash))return res.status(401).json({error:'Invalid refresh'});s.lastUsedAt=Date.now();const user=users.find(u=>u.id===s.userId);if(!user)return res.status(401).json({error:'Invalid user'});const newRt=rid();s.refreshHash=bcrypt.hashSync(newRt,10);setRefreshCookie(res,`${sid}.${newRt}`);const at=await signAccessToken(user.id,user.roles);res.json({access_token:at,expires_in:ttlToSeconds(ACCESS_TTL)});});
app.post('/auth/logout',(req,res)=>{const c=req.cookies['refresh_token'];if(c){const[sid]=c.split('.');const s=sessions.get(sid);if(s)s.revokedAt=Date.now();}res.clearCookie('refresh_token',{path:'/auth/refresh'});res.status(204).send();});
app.get('/auth/sessions',(req,res)=>{const{user_id}=req.query;const out=[];for(const[id,s]of sessions.entries()){if(s.userId===user_id)out.push({id,ip:s.ip,user_agent:s.userAgent,last_used_at:s.lastUsedAt,revoked_at:s.revokedAt,created_at:s.createdAt});}res.json(out);});
app.post('/auth/sessions/:id/revoke',(req,res)=>{const s=sessions.get(req.params.id);if(!s)return res.status(404).json({error:'Not found'});s.revokedAt=Date.now();res.status(204).send();});
function auth(req,res,next){const h=req.headers['authorization'];if(!h||!h.startsWith('Bearer '))return res.status(401).json({error:'No token'});const t=h.slice(7);verifyAccessToken(t).then(p=>{req.user={id:p.sub,roles:p.roles};next();}).catch(()=>res.status(401).json({error:'Invalid token'}));}
app.get('/me',auth,(req,res)=>{res.json({user_id:req.user.id,roles:req.user.roles});});
const PORT=process.env.PORT||4000;app.listen(PORT,()=>console.log('Auth server running on port '+PORT));