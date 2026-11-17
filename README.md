# MARTES FC · Estadísticas deportivas

Dashboard público de un equipo amateur, con diseño Liquid Glass neón y datos ficticios. El código es público; la administración remota y los datos privados aún no existen.

**Stack de la aplicación:** React 19, TypeScript estricto y Vite. El registro de partidos en esta fase es local al navegador, no compartido.

## Desarrollar

Necesitas Node.js 24 y npm.

    cd web
    npm ci --no-audit --no-fund
    npm run check:public
    npm run typecheck
    npm run lint
    npm test
    npm run build
    npm run dev

La web local aparece en http://127.0.0.1:4173. Las pruebas visuales se ejecutan con Playwright: npx playwright install chromium y npm run test:visual.

## Arquitectura

- web/src/App.tsx — interfaz React, navegación, formularios y vistas.
- web/src/domain/stats.ts — tipos, reglas y cálculos.
- web/src/data/demo.ts — datos 100% inventados.
- web/src/data/storage.ts — persistencia local validada y exportación JSON.
- web/tests — dominio Node y pruebas Playwright.
- web/styles.css — diseño responsive Liquid Glass.
- .github/workflows — CI, releases y limpieza segura.
- documentacion — arquitectura, gobierno, privacidad y guía Cloudflare.

## Gobierno del repositorio

GitHub es la fuente de verdad. Solo master (estable) y develop (integración) son permanentes:
feature/* → PR develop → release/vX.Y.Z → PR master → tag y GitHub Release → sincronizar master a develop.

El código es público; no se versionan teléfonos, capturas de chats privados, fotos no autorizadas, claves ni otros datos personales.

## Despliegue

Cloudflare Workers Builds será la plataforma, pero **todavía no está conectada ni desplegada**. Se configurará tras validar la integración de la aplicación.

Lee [Requisitos](REQUISITOS.md), [Arquitectura](documentacion/ARQUITECTURA_Y_MANTENIMIENTO.md), [Flujo Git](documentacion/FLUJO_GIT_Y_RELEASES.md), [Privacidad](documentacion/PRIVACIDAD_Y_DATOS.md) y [Cloudflare](documentacion/DESPLIEGUE_CLOUDFLARE.md).
