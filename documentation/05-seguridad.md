# Seguridad

Estado: Activo
Autor: Equipo logos-ai
Fecha: 2025-10-02
Versión: 0.1

Lineamientos
- HTTPS obligatorio.
- Access tokens con exp corta.
- Refresh tokens en cookie HttpOnly, Path restringido, SameSite=Lax.
- Validación de iss, aud, iat, exp.
- Rate limiting en login/refresh.
- Auditoría de eventos y revocaciones por sesión.

Documentos relacionados
- [[jwt-login-system]]
- [[01-arquitectura-general]]