# Arquitectura general

Estado: Activo
Autor: Equipo logos-ai
Fecha: 2025-10-02
Versión: 0.1

Resumen
- Arquitectura compuesta por frontend SPA y backend Node/Express.
- Autenticación basada en JWT (access corto) y refresh en cookie HttpOnly.

Capas
- Frontend: SPA (React/Vite) [por definir], uso de Authorization: Bearer + interceptor de refresh.
- Backend: Express + jose + cookies HttpOnly, sesiones por dispositivo.
- Persistencia: sesiones en memoria (demo), migración prevista a BD.

Diagrama (alto nivel)
```
Usuario -> Frontend SPA -> API Backend (Auth) -> BD Sesiones
```

Documentos relacionados
- [[03-backend]]
- [[02-frontend]]
- [[05-seguridad]]
- [[jwt-login-system]]