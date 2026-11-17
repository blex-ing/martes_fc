# Cloudflare Workers Builds — MARTES FC

**Estado: pendiente de configuración y despliegue.** El código de la aplicación es público.

- GitHub: blex-ing/martes_fc.
- Rama de producción: master.
- Root path: / (wrangler.jsonc en raíz).
- Build command: cd web && npm ci --no-audit --no-fund && npm run build
- Deploy command: npx wrangler deploy
- Preview command: npx wrangler preview
- Habilitar builds de preview; publicar web/dist con assets.not_found_handling=single-page-application y previews={}.

No incluir un archivo public/_redirects con regla global: Workers Static Assets ya maneja el fallback SPA.
Cuando exista backend, gestionar claves con bindings/secretos de Worker, nunca con variables VITE_* públicas.
Verificar URLs, recarga SPA, navegación y QA móvil después de conectar Cloudflare. No atribuir despliegues a CI de GitHub sin evidencia.
