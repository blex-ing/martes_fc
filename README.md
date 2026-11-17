# MARTES FC · Estadísticas deportivas

Dashboard público de un equipo amateur, con diseño Liquid Glass neón y datos ficticios. El código es público; la administración remota y los datos privados aún no existen.

**Stack:** React 19, TypeScript estricto y Vite. **v0.2.0 en desarrollo:** Cloudflare D1 y Worker API permitirán estadísticas compartidas; mientras D1 o Access no estén configurados, la versión estable mantiene la demo local.

## Desarrollar

Necesitas Node.js 24 y npm.

    cd web
    npm ci --no-audit --no-fund
    npm run check:public
    npm run typecheck
    npm run typecheck:worker
    npm run lint
    npm test
    npm run test:worker
    npm run build
    npm run dev

La web local aparece en http://127.0.0.1:4173. Las pruebas visuales se ejecutan con Playwright: npx playwright install chromium y npm run test:visual.

## Arquitectura

- web/src/App.tsx — interfaz React, navegación, formularios y vistas.
- web/src/domain/stats.ts — tipos, reglas y cálculos.
- web/src/data/demo.ts — datos 100% inventados.
- web/src/data/storage.ts — persistencia local validada y exportación JSON.
- web/src/data/api.ts — lectura D1 y operaciones de administrador.
- web/src/AdminPanel.tsx — plantilla y temporadas, protegidas por el servidor.
- worker/index.ts — API D1 y autenticación Cloudflare Access.
- migrations/ — cambios SQL versionados; no guardar datos reales.
- web/tests — dominio Node y pruebas Playwright.
- web/styles.css — diseño responsive Liquid Glass.
- .github/workflows — CI, releases y limpieza segura.
- documentacion — arquitectura, gobierno, privacidad y guía Cloudflare.

## Gobierno del repositorio

GitHub es la fuente de verdad. Solo master (estable) y develop (integración) son permanentes:
feature/* → PR develop → release/vX.Y.Z → PR master → tag y GitHub Release → sincronizar master a develop.

El código es público; no se versionan teléfonos, capturas de chats privados, fotos no autorizadas, claves ni otros datos personales.

## Despliegue

La demo v0.1.1 está conectada a Cloudflare Workers Builds. La API v0.2.0 se desarrolla en feature; **requiere crear D1 producción/preview, configurar bindings y Cloudflare Access antes de la release**. No configurar recursos inventados ni publicar la feature sin pruebas de los servicios reales.

**Requisitos vivos de todas las features:** [documentacion/REQUISITOS_VIVOS.md](documentacion/REQUISITOS_VIVOS.md), y [propuesta v0.2.0](documentacion/PROPUESTA_V0.2.0.md).

Lee [Requisitos](REQUISITOS.md), [Arquitectura](documentacion/ARQUITECTURA_Y_MANTENIMIENTO.md), [Flujo Git](documentacion/FLUJO_GIT_Y_RELEASES.md), [Privacidad](documentacion/PRIVACIDAD_Y_DATOS.md) y [Cloudflare](documentacion/DESPLIEGUE_CLOUDFLARE.md).
