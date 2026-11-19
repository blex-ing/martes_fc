# MARTES FC · Estadísticas deportivas

Aplicación de estadísticas de fútbol amateur con **React 19, TypeScript estricto, esbuild, Cloudflare Workers y D1**. La API pública sirve resultados compartidos y la administración se protege mediante Cloudflare Access y comprobaciones del Worker.

La demostración utiliza exclusivamente datos ficticios locales cuando no existe API. Si falla la base D1, el sistema muestra un error en lugar de sustituir datos reales por datos ficticios.

## Desarrollo

Requiere Node.js 24 y npm. Desde la raíz del repositorio:

```sh
cd web
npm ci --no-audit --no-fund
npm run check:public
npm run check:design
npm run check:d1
npm run check:no-picomatch
npm run typecheck
npm run typecheck:worker
npm run lint
npm test
npm run test:worker
npm run build
npm run dev
```

Servidor local: http://127.0.0.1:4173. QA visual: `npx playwright install --with-deps chromium webkit` y `npm run test:visual` (la selección de proyectos se define en `web/playwright.config.ts`).

## Arquitectura

- `web/src/App.tsx`: composición, navegación, sesión y estado.
- `web/src/views/`: vistas de resumen, partidos, plantilla, portería y ajustes.
- `web/src/components/`: formularios y componentes reutilizables.
- `web/src/domain/stats.ts`: validaciones y estadísticas.
- `web/src/data/`: API, datos demo y persistencia local.
- `worker/index.ts`: API de Workers, Access, autorización y operaciones D1.
- `migrations/`: esquema y migraciones SQL.
- `web/src/styles/tokens.css`, `primitives.css` y `web/styles.css`: contrato visual Liquid Glass.
- `web/tests/`, `worker/tests/`: pruebas automatizadas.
- `.github/workflows/`: checks, releases y limpieza segura.

## Ramas y despliegue

Ramas permanentes: **`master` (producción)** y **`develop` (integración/preview)**.

`feature/*` o `fix/*` → PR a `develop` → `release/vX.Y.Z` → PR a `master` → tag y GitHub Release → sincronización a `develop`.

El Worker de producción se configura desde `wrangler.jsonc`, con D1 de producción y preview **separadas**. El comando de build de Cloudflare ejecuta `cd web && npm ci --no-audit --no-fund && npm run build`.

No se guardan secretos, JWT, datos privados de jugadores ni respaldos D1 en Git. Los despliegues de preview no deben modificar producción. Un build correcto no sustituye una prueba real de la API y la autorización.

## Documentación

- [Arquitectura y mantenimiento](documentacion/ARQUITECTURA_Y_MANTENIMIENTO.md)
- [Flujo Git y releases](documentacion/FLUJO_GIT_Y_RELEASES.md)
- [Operación D1 y Access](documentacion/OPERACION_D1_ACCESS.md)
- [Despliegue Cloudflare](documentacion/DESPLIEGUE_CLOUDFLARE.md)
- [Requisitos vivos](documentacion/REQUISITOS_VIVOS.md)
- [Releases publicadas](https://github.com/blex-ing/martes_fc/releases)
