# Flujo de integración hacia develop

Este documento deja constancia del flujo de trabajo acordado para integrar cambios en la rama `develop` del repositorio.

## Modelo de ramas
- `main`: línea estable y liberable (versionada con tags `vX.Y.Z`).
- `develop`: integración continua de cambios aprobados. Base para `release/*`.
- `feature/*`, `fix/*`, `docs/*`: ramas de trabajo puntuales que se integran a `develop` mediante Pull Request (PR).
- `release/x.y.z`: preparación de una versión desde `develop` que luego se integra a `main`.

## Política de integración hacia develop
- No se hace push directo a `develop`. Solo por PR.
- Requiere revisiones (≥1 aprobación) y checks verdes (lint, tests, build) antes de hacer merge.
- Estrategia recomendada: `squash merge` (un commit por PR). Alternativa: `rebase merge` si se quiere preservar commits.

## Ciclo estándar de trabajo
1. Sincroniza `develop`:
   ```bash
   git switch develop
   git pull --rebase
   ```
2. Crea o continúa tu rama:
   - Nueva: `git switch -c feature/<ticket-id>-descriptor`
   - Existente (ej. `full-stack-developer-1`): `git switch full-stack-developer-1`
3. Commits claros (Conventional Commits):
   - `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
   - Ejemplo: `feat(backend): endpoint /api/search con filtro semántico`
4. Rebase periódico sobre `develop`:
   ```bash
   git fetch origin
   git rebase origin/develop
   # resolver conflictos y probar
   git push --force-with-lease  # solo si hiciste rebase
   ```
5. Abre PR hacia `develop` (base: `develop`, compare: tu rama).
6. Revisión y checks: lint, type-check, unit tests, build.
7. Merge: `squash merge` y borrar la rama si ya no hace falta.
8. Post-merge: sincroniza `develop` y actualiza documentación cuando aplique.

## Flujo de releases desde develop
- Crear `release/x.y.z` desde `develop` cuando esté estable.
- Ajustes finales (versionado, changelog, pruebas de humo).
- Merge a `main` + tag `vX.Y.Z`.
- Merge de `main` a `develop` para sincronizar.

## Hotfix
- Si hay bug crítico en producción:
  - `hotfix/x.y.(z+1)` desde `main`, corregir y probar.
  - Merge a `main` + tag.
  - Merge a `develop` (o cherry-pick) para coherencia.

## Checklist de PR hacia develop
- Cambios claros y acotados.
- Lint y tests pasan localmente.
- No se introducen secretos.
- Documentación actualizada cuando aplica (por ejemplo en `Documentation/jwt-login-system.md`).
- Impacto comunicado (backend, frontend, IA).
- Evidencia si hay cambios de UI.
- Rama rebaseada con `develop` (sin conflictos).

## Controles recomendados (repositorio)
- Protecciones de rama (a configurar en el remoto):
  - `develop`: require PR, ≥1 aprobación, checks verdes, bloquear pushes directos.
- Automatización (CI):
  - Jobs de lint (frontend/backend), type-check, unit tests, build.
  - Convenciones: ESLint/Prettier (frontend), ESLint + TS (backend), commitlint + husky.

## Estado actual de configuración
- Se ha añadido una plantilla de PR y un workflow de CI inicial (lint/tests/build condicionales para backend y frontend).
- Las protecciones de rama requieren configuración en el remoto (GitHub) vía settings o `gh` CLI.