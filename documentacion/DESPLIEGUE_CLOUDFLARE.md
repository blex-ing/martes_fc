# Cloudflare Workers Builds — MARTES FC

**Estado a 17-11-2026:** El usuario configuró el comando de build de Workers Builds; el despliegue correcto debe verificarse mediante los logs y la URL real. El código de la aplicación es público.

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

## Incidencia registrada: error ENOENT en la raíz

El primer despliegue ejecutó `npm run build` desde `/opt/buildhome/repo`, donde no existe `package.json`.
La aplicación está en `web/` y el archivo `wrangler.jsonc` en la raíz.

**Solución configurada por el propietario en Cloudflare:**
```sh
cd web && npm ci --no-audit --no-fund && npm run build
```

La compilación debe escribir `web/dist/` y después ejecutar `npx wrangler deploy`
desde la raíz. No cambiar el directorio raíz a `web`, porque Wrangler
necesita leer el archivo de configuración de la raíz.

## Comprobación tras el siguiente commit en master

- Build de GitHub Actions en verde (no sustituye al build de Cloudflare).
- Confirmar en el panel Workers Builds que ejecutó el nuevo build command completo.
- Confirmar `vite build` y `wrangler deploy` terminados correctamente.
- Abrir URL real `workers.dev` y refrescar rutas de la SPA.
- Probar escritorio, iPhone, fichas y marcadores ficticios.
- Confirmar que los previews de ramas no modifican producción.

El merge a `master` inicia automáticamente un nuevo build **solo si**
Cloudflare Workers Builds está conectado al repositorio y esa rama
está habilitada como producción.
