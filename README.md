# MARTES FC · Estadísticas deportivas

Dashboard **público** de estadísticas de un equipo amateur, con diseño Liquid Glass neón y vistas de equipo, partidos, goleadores y portería. El código es público; los nombres de jugadores y resultados de la demostración son **ficticios**.

> **Estado:** v0.1.0 — prototipo estático mantenible, sin backend y sin cuentas. No hay resultados reales. Esta versión aún no está publicada en Cloudflare ni dispone de administración remota.

## Desarrollo y verificación (Node 22+; CI con Node 24)

```bash
cd web
npm ci --no-audit --no-fund
npm run check
npm test
npm run build
npm run dev
```

Abrir `http://127.0.0.1:4173`. `web/dist` contiene el build estático listo para revisar. El prototipo usa módulos JavaScript modernos, así que **no debe abrirse desde `file://`**: requiere un servidor HTTP.

## Estructura

```text
.github/
  workflows/ci.yml
  workflows/publish-release.yml
  workflows/cleanup-temporary-branches.yml
  dependabot.yml
  pull_request_template.md
web/
  index.html                 # App actual de demo
  styles.css                 # Diseño Liquid Glass
  app.js                     # UI demo (pendiente migración a React/TypeScript)
  src/domain/stats.mjs       # Cálculos puros reutilizables
  tests/stats.test.mjs       # Tests de reglas del dominio
  scripts/                   # Build, dev y revisión de privacidad
  package.json
  package-lock.json
  dist/                      # Compilación (ignorada por Git)
documentacion/
  ARQUITECTURA_Y_MANTENIMIENTO.md
  FLUJO_GIT_Y_RELEASES.md
  PRIVACIDAD_Y_DATOS.md
  DESPLIEGUE_CLOUDFLARE.md
  releases/v0.1.0.md
wrangler.jsonc
REQUISITOS.md
CHANGELOG.md
```

## Flujo Git

`feature/*` → PR a `develop` → CI/Preview → `release/vX.Y.Z` → PR a `master` → GitHub Release + tag → sincronización `master` a `develop`.

Solo `develop` y `master` son permanentes. Las ramas deben quedar protegidas por Pull Requests y checks. Las comprobaciones visuales se validarán de forma manual hasta instalar Playwright en la fase de migración.

El diseño y los workflows se basan en el repositorio [`blex-ing/mini_podcast`](https://github.com/blex-ing/mini_podcast), **sin arrastrar funcionalidades Python del podcast**.

## Datos públicos y privados

- En el repositorio **no** se guardan contactos, capturas de mensajería, información financiera, contraseñas, tokens ni datos personales.
- El prototipo muestra resultados y jugadores ficticios. Los cambios del formulario quedan solo en `localStorage`; cada navegador ve datos distintos.
- En la fase multiusuario, **lectura pública de estadísticas publicadas** y **API de escritura autenticada**, con base de datos separada y autorización a nivel servidor.
- Los nombres/fotos reales solo se incorporan cuando se acuerde su publicación con las personas afectadas; no introducir secretos ni datos internos en el frontend.

## Estado de la arquitectura

Este repositorio inicia con una aplicación web **estática** que se puede probar ya. La migración propuesta es **React + Vite + TypeScript estricto**, manteniendo dominio separado y conectándolo después a un repositorio/API seguro. No se presenta esta migración como realizada: quedará en su propia feature y PR.

Consulta las decisiones detalladas en [`documentacion/ARQUITECTURA_Y_MANTENIMIENTO.md`](documentacion/ARQUITECTURA_Y_MANTENIMIENTO.md).
