# Arquitectura y mantenimiento — MARTES FC

## Stack real

- React 19 + TypeScript estricto, compilado con **esbuild** y servido como assets por Cloudflare Workers.
- Worker TypeScript con API `/api/public/*` y `/api/admin/*`, persistencia SQLite Cloudflare D1 y autenticación/autorización Cloudflare Access (JWT validado en servidor).
- Dos D1 separadas, `martes-fc-prod` y `martes-fc-preview`; no transferir registros entre ellas automáticamente.
- Liquid Glass híbrido web sobre el sistema de tokens; conservar fondos y reflejos propios del hero y de las tarjetas KPI.

## Responsabilidades

`web/src/App.tsx` coordina shell, navegación y estado de datos. `web/src/views/` define las cinco páginas, `web/src/components/` concentra presentación reutilizable y formularios, `web/src/domain/stats.ts` encapsula cálculos y validación. `web/src/data/api.ts` trata la comunicación D1; la demo local se mantiene explícita y no sustituye una caída del backend.

`worker/index.ts` valida el JWT RS256 de Cloudflare Access, permite lectura pública del snapshot D1 y realiza escrituras autenticadas con auditoría y control de revisión. `migrations/` contiene esquema y restricciones SQL; probar con SQLite y D1 Preview antes de Producción.

## Mantenimiento y calidad

- Partir siempre de `develop` en una feature, una intención por PR, sin modificar `master` directamente.
- TypeScript estricto, ESLint, tests de dominio y Worker, `npm audit --audit-level=high` y CI.
- Playwright en matriz responsive y WebKit de simulación; la revisión de Safari físico es adicional.
- Documentar la compatibilidad con el Design System, sin introducir gradientes duplicados sobre hero/marcador/KPI.
- Confirmar branch protection, PR de release y sincronización `master → develop`.
- Dependabot semanal con revisión humana; no fusionar cambios de dependencias sin QA.

## Seguridad y privacidad

No almacenar claves ni contraseñas en frontend, logs o repositorio. Cloudflare Access protege `/api/admin/*`; el Worker también valida tokens y origen. Evitar subir personas reales no autorizadas o información privada al bundle. Los secretos se configuran como **Runtime Secrets** en Cloudflare, separados de los parámetros de build.
