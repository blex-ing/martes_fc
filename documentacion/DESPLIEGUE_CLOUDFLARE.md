# Despliegue propuesto — Cloudflare Workers Builds

Basado en el deployment versionado de Mini Podcast (rama `master`), validado con la documentación oficial de Cloudflare (noviembre de 2026).

## Configuración de Workers Builds

- GitHub: `blex-ing/martes-fc` (solo cuando exista).
- Producción: `master`.
- Working path: `/` (Wrangler está en la raíz).
- Build command: `cd web && npm ci --no-audit --no-fund && npm run build`.
- Deploy command: `npx wrangler deploy`.
- Preview command: `npx wrangler preview`.
- Preview builds: habilitados.
- `wrangler.jsonc` raíz: assets `./web/dist`, SPA fallback y `previews: {}`.

En la UI de Cloudflare confirmar que los campos **Deploy** y **Preview** no están intercambiados. Los builds de ramas no productivas deben usar `wrangler preview`. La URL real solo se conoce cuando Cloudflare haya conectado el repo y publicado un despliegue correcto.

## Alertas aprendidas de Mini Podcast

- **No incluir** un `_redirects` universal `/* /index.html 200` con Workers Static Assets y `not_found_handling: single-page-application`: provoca un bucle.
- El bloque `previews: {}` es necesario para `wrangler preview` en la configuración actual usada.
- Preview NO hereda automáticamente secretos o bindings de producción; cuando exista base de datos, separar sus valores de staging.
- Las builds de producción no deben exponer secretos en el bundle Vite ni en logs públicos.

## Nota sobre la demo actual

La compilación v0.1.0 usa un script Node que copia assets estáticos; **no utiliza todavía Vite**. Esto permite una base deployable sin dependencias externas. Después de la migración, actualizar build a `tsc -b && vite build` y versionar `package-lock.json`.

## Verificación posterior al deploy

1. Comprobar CI verde y preview del PR en móvil/escritorio.
2. Confirmar que `master` despliega versión estable, que solo hay datos ficticios y no existe un formulario admin real.
3. Comprobar enlace por URL, navegación, refresco y contraste.
4. Comprobar GitHub Release/tag automático tras fusionar una rama release.

Enlaces oficiales: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/ y https://developers.cloudflare.com/workers/previews/configuration/
