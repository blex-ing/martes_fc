# MARTES FC · Estadísticas deportivas

Web React 19 + TypeScript estricto para estadísticas de fútbol amateur. Utiliza **esbuild** para los assets, **Cloudflare Workers** como API y **D1** para datos compartidos. Cloudflare Access protege las mutaciones administrativas. Las bases de datos de Producción y Preview son independientes.

El modo demostración utiliza exclusivamente datos ficticios locales cuando no existe API; si falla D1, la aplicación **no** presenta la demo como si fueran resultados reales. El diseño de la release v0.3.0 es la referencia visual, incluyendo sus reflejos originales y el sistema de diseño.

## Desarrollo

Requiere Node.js 24 y npm. Desde el repositorio:

```bash
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

El servidor local está en http://127.0.0.1:4173. Las pruebas visuales se ejecutan con Playwright y los navegadores configurados en `web/playwright.config.ts`: instala `npx playwright install --with-deps chromium webkit` y ejecuta `npm run test:visual`. El chequeo SQL de concurrencia se ejecuta en CI con Python y SQLite.

## Arquitectura

- `web/src/App.tsx`: shell, sesión, navegación y estado de datos.
- `web/src/views/`: cinco vistas independientes; no reconstruir componentes que ya existen.
- `web/src/components/`: formulario de partidos, ficha del jugador, métricas, iconos y primitivas reutilizables.
- `web/src/domain/stats.ts`: tipos, validaciones y cálculos puros.
- `web/src/data/api.ts`: carga de snapshot y peticiones administrativas con errores tipados.
- `web/src/data/demo.ts`, `storage.ts`: demo local explícita y validada.
- `worker/index.ts`: API D1, control de sesiones Cloudflare Access y escritura transaccional.
- `migrations/`: esquema versionado, sin datos personales.
- `web/src/styles/tokens.css` y `primitives.css`: contrato visual; `web/styles.css` conserva reglas de layout.
- `web/tests/` y `worker/tests/`: pruebas del dominio, API, renderizado y accesibilidad.
- `.github/workflows/`: CI, release etiquetada y limpieza segura.

## Flujo y seguridad

GitHub es la fuente de verdad. Ramas permanentes: `master` (estable) y `develop` (integración). Todos los cambios siguen `feature/* → PR develop → release/vX.Y.Z → PR master → tag + GitHub Release → sync master/develop`.

Nunca guardar claves, JWT, tokens, datos bancarios ni registros personales en Git. No copiar D1 Preview a Producción automáticamente; probar migraciones con respaldo antes de cada cambio. La URL estable es https://martes-fc.ali-tio.workers.dev/ .

## Documentación

- [Sistema de diseño](documentacion/DESIGN_SYSTEM_MARTES_FC.md)
- [Arquitectura y mantenimiento](documentacion/ARQUITECTURA_Y_MANTENIMIENTO.md)
- [Proceso de releases](documentacion/FLUJO_GIT_Y_RELEASES.md)
- [Operación D1 y Access](documentacion/OPERACION_D1_ACCESS.md)
- [Modelo y API D1](documentacion/MODELO_Y_API_D1.md)
- [Requisitos vivos](documentacion/REQUISITOS_VIVOS.md)

Para la versión estable y su historial consulta [GitHub Releases](https://github.com/blex-ing/martes_fc/releases).
