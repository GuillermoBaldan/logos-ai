# Frontend

Estado: Activo
Autor: Equipo logos-ai
Fecha: 2025-10-02
Versión: 0.1

Pautas
- Usar Authorization: Bearer con access token en memoria.
- Interceptor para renovar token vía [[/auth/refresh]] cuando haya 401 por expirar.
- Evitar almacenar tokens en localStorage.

Tareas iniciales
- Configurar cliente HTTP con interceptor.
- Páginas: Login, Perfil (/me), Gestión de sesiones.

Documentos relacionados
- [[01-arquitectura-general]]
- [[03-backend]]
- [[05-seguridad]]