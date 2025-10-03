# Visión y alcance

Estado: Activo
Autor: Equipo logos-ai
Fecha: 2025-10-02
Versión: 0.1

Propósito
- Describir la visión, objetivos y alcance inicial del proyecto logos-ai.

Resumen
- Proyecto full‑stack con enfoque en autenticación segura y UX fluida.
- Metodología Ágil: documentación mínima, decisiones registradas vía ADRs.

Alcance inicial
- Backend: sistema de login JWT (access corto + refresh en cookie HttpOnly) con multi‑sesión por dispositivo.
- Frontend: SPA con interceptores de auth y páginas básicas.
- DevOps: CI básico y estándares de contribución.

Documentos relacionados
- [[01-arquitectura-general]]
- [[03-backend]]
- [[05-seguridad]]
- [[adrs/ADR-0001-eleccion-sistema-login]]