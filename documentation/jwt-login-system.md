Sistema de login: Access token (JWT) corto + Refresh token en cookie HttpOnly (multi‑sesión)

Objetivo
- Conseguir una implementación rápida con seguridad razonable y soporte de multi‑sesión por dispositivo/navegador.

Resumen del diseño
- Access token (JWT) de corta duración: 10 minutos. Se envía en Authorization: Bearer <token>.
- Refresh token de larga duración: 14 días. Se guarda en cookie HttpOnly, Secure, SameSite=Lax (o Strict si UX lo permite), path=/auth/refresh.
- Sesiones por dispositivo: cada login genera un session_id (jti) propio. Permite listar y revocar sesiones individuales.

Claims del access token (JWT)
- sub: identificador del usuario
- iss, aud: emisor y audiencia esperada
- iat, exp: emisión y expiración (corta)
- roles/scopes: autorización
- jti (opcional): id de token

Refresh token
- Contiene jti único (session_id) y exp larga
- No incluir datos sensibles
- Almacenar en BD solo un hash del refresh (nunca el valor en claro)
- Rotación sencilla: opcionalmente emitir uno nuevo en cada /auth/refresh y actualizar el hash

Cookies recomendadas
- HttpOnly: true (no accesible vía JS)
- Secure: true (solo HTTPS)
- SameSite: Lax (o Strict si no hay redirecciones cross‑site)
- Path: /auth/refresh (reduce superficie de envío)

Endpoints
- POST /auth/login
  - Entrada: credenciales (email/usuario + password) o método passwordless/SSO según tu caso
  - Proceso: valida credenciales, crea sesión (session_id/jti), registra ip y user_agent
  - Salida: access token en JSON, Set‑Cookie del refresh
- POST /auth/refresh
  - Entrada: cookie refresh_token
  - Proceso: valida sesión (refresh_hash coincide, no revocada, no expirada), opcional rotación
  - Salida: nuevo access token; opcionalmente Set‑Cookie con nuevo refresh
- POST /auth/logout
  - Proceso: revoca la sesión actual (session_id), borra cookie
  - Salida: 204/200
- GET /auth/sessions
  - Proceso: lista sesiones activas del usuario (device info, ip, last_used_at)
  - Salida: array de sesiones
- POST /auth/sessions/:id/revoke
  - Proceso: revoca esa sesión específica
  - Salida: 204/200

Esquema de BD (tabla sesiones)
- id (session_id, jti)
- user_id
- refresh_hash
- created_at
- last_used_at
- ip
- user_agent
- revoked_at (nullable)

Flujos
- Login
  - Verifica credenciales → crea sesión (session_id) → emite access + Set‑Cookie refresh
- Renovación de access
  - Cliente llama /auth/refresh (con cookie) → valida sesión → emite nuevo access (y opcional nuevo refresh)
- Logout del dispositivo actual
  - Marca sesión como revocada → borra cookie → rechaza futuros refresh de esa sesión
- Logout global
  - Revoca todas las sesiones de user_id
- Detección de uso indebido
  - Si rotas refresh y detectas reutilización de un refresh ya rotado, puedes revocar la cadena completa de esa sesión

Seguridad y buenas prácticas
- Firmar JWT con RS256/ES256 (claves rotables). Validar iss, aud, exp, iat, nbf.
- Clock skew: tolerancia 1–2 minutos en validación de tiempos.
- HTTPS obligatorio. No enviar tokens por HTTP.
- CSRF: con SameSite=Lax normalmente es suficiente para /auth/refresh; para endpoints que cambian estado, añadir token CSRF si usan cookies.
- Rate limiting: aplicar en /auth/login y /auth/refresh.
- Scopes/roles finos en access token; evitar meter datos sensibles en JWT.
- Logs y auditoría: login, refresh, rotaciones, revocaciones.
- Denylist/Revocación: comprobar sesión (revoked_at null) antes de aceptar refresh.
- Almacenar refresh como hash (bcrypt/argon2/HMAC) para evitar exposición.

Variables de entorno (orientativas)
- JWT_PRIVATE_KEY / JWT_PUBLIC_KEY (si RS256/ES256) o JWT_SECRET (si HS256 en entornos simples)
- ACCESS_TOKEN_TTL=10m
- REFRESH_TOKEN_TTL=14d
- COOKIE_DOMAIN (si aplica), COOKIE_SECURE=true, COOKIE_SAMESITE=Lax

Ejemplos de intercambio
- Login (POST /auth/login)
  - Body: { email, password }
  - Respuesta: { access_token, expires_in } y Set‑Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax; Path=/auth/refresh
- Refresh (POST /auth/refresh)
  - Cookie: refresh_token=...
  - Respuesta: { access_token, expires_in }
- Logout (POST /auth/logout)
  - Acciones: revocar session_id, borrar cookie

Integración frontend (SPA)
- Guardar access token en memoria (no en localStorage) y usar Authorization: Bearer
- Interceptor: si 401 por expirar, intentar /auth/refresh; si falla, redirigir a login
- Evitar enviar cookie refresh a endpoints que no la necesitan (Path restringido ya ayuda)

Multi‑sesión y control por dispositivo
- Cada login crea una sesión con su propio session_id/jti
- GET /auth/sessions devuelve lista (id, ip, user_agent, last_used_at)
- Revocar solo una sesión: POST /auth/sessions/:id/revoke
- Opcional: límite de sesiones activas por usuario (p.ej., 5 dispositivos)

Notas de implementación
- Validación estricta del JWT en middleware de acceso a APIs
- Persistencia fiable de sesiones (transacciones en revocación/rotación)
- Pruebas: flujos de login, refresh, revocación, expiración y casos de reloj desfasado