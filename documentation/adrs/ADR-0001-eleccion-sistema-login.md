# ADR-0001: Elección del sistema de login JWT con refresh en cookie HttpOnly

Estado: Aprobado
Fecha: 2025-10-02
Autores: Equipo logos-ai

Contexto
- Necesitamos autenticación segura, multi‑sesión por dispositivo y UX fluida.

Decisión
- Acceso corto (5–15 min) en Authorization: Bearer.
- Refresh token (7–14 días) en cookie HttpOnly, Secure, SameSite=Lax.
- Tabla de sesiones por dispositivo (jti/session_id), revocación por sesión.

Justificación
- Implementación rápida, seguridad razonable, UX transparente.

Implicaciones
- Endpoints: /auth/login, /auth/refresh, /auth/logout, /auth/sessions, /auth/sessions/:id/revoke.
- Almacenamiento hash de refresh tokens en BD.
- Middleware de validación y rate limiting.

Referencias
- [[jwt-login-system]]
- [[03-backend]]