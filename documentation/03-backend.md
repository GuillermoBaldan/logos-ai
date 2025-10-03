# Backend

Estado: Activo
Autor: Equipo logos-ai
Fecha: 2025-10-02
Versión: 0.1

Resumen
- Endpoints implementados: /auth/login, /auth/refresh, /auth/logout, /auth/sessions, /auth/sessions/:id/revoke, /me.
- Tokens: Access JWT (HS256) 10 minutos; Refresh en cookie HttpOnly con SameSite=Lax.
- Sesiones: en memoria (demo); migración a BD planificada.

Referencias
- [[jwt-login-system]]
- [[adrs/ADR-0001-eleccion-sistema-login]]

Próximos pasos
- Persistencia en BD (Postgres/Mongo) de usuarios y sesiones.
- RS256/ES256 con rotación de claves.
- CSRF según necesidades.