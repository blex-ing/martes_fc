# Cloudflare Workers Builds — MARTES FC

> **Estado vigente (noviembre de 2026):** producción desde `master`, previews desde `develop` y ramas, frontend React + TypeScript compilado con **esbuild**, Worker API y bases D1 separadas. Las releases se publican con PR `release/vX.Y.Z` y el workflow automático de GitHub. Los registros de fallos y comandos de Vite que siguen abajo son **históricos (17-11-2026)**; no son instrucciones vigentes de despliegue.

**Build actual:** `cd web && npm ci --no-audit --no-fund && npm run build`, desde la raíz del repositorio (donde reside `wrangler.jsonc`). **Deploy:** `npx wrangler deploy` (producción). **Preview:** `npx wrangler preview` cuando está configurado. Verificar la configuración efectiva y el SHA en Cloudflare Workers Builds, sin asumir que CI de GitHub equivale a desplegar.

---
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

**Solución documentada para Cloudflare (confirmar el valor efectivo de cada build):**
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

## Incidencia confirmada: Workers Builds Preview usa una orden incorrecta (17-11-2026)

**Evidencia aportada:** en un build de 17-11-2026 15:51 UTC, Cloudflare ejecutó `npm run build` desde `/opt/buildhome/repo` y devolvió `ENOENT: .../repo/package.json`. El archivo está realmente en `web/package.json`. **El fallo ocurre antes de ejecutar React, TypeScript, Wrangler, D1 o Cloudflare Access**.

La guía anterior presupone que la orden correcta estaba configurada; el log demuestra que **esta ejecución de Cloudflare no la utilizó**. Puede ser una diferencia entre configuración de producción y de Preview, o una configuración que no llegó a guardarse.

### Corrección obligatoria en Cloudflare Dashboard

1. Worker **martes-fc** → **Settings → Build → Build Configuration**.
2. Mantener **Root directory: /** (raíz del repositorio). `wrangler.jsonc` y `worker/index.ts` están en raíz, mientras la aplicación está en `web/`.
3. Configurar **Build command** de producción **y de Preview, si aparecen separados**:
   ```sh
   cd web && npm ci --no-audit --no-fund && npm run build
   ```
4. Verificar **Deploy command** de producción: `npx wrangler deploy`.
5. Verificar **Preview command**: `npx wrangler preview` (Worker Previews). No cambiar a `wrangler deploy` en previews.
6. Verificar **Settings → Build → Branch control**: `master` como producción y Preview Builds habilitado para ramas distintas de `master`.
7. Guardar ajustes. Reintentar el build fallido de `develop` o un PR, **no desplegar `develop` a producción**.

Según la documentación de Cloudflare, al reintentar un build se utiliza la configuración guardada en ese momento. No hace falta modificar el código de la app ni crear un `package.json` adicional en raíz.

### Evidencia de corrección

El log correcto debe mostrar:
```text
Executing user build command: cd web && npm ci --no-audit --no-fund && npm run build
...
vite build
...
dist/
```
y después la ejecución del Preview command, que debe publicar una URL aislada. Si aparece un error posterior, diagnosticarlo **por separado**; que desaparezca ENOENT no garantiza que el Worker o D1 queden desplegados correctamente.

### Estado de migraciones

El esquema `0001_initial.sql` ya se aplicó y verificó **solo** en `martes-fc-preview`. La configuración de Preview tiene que vincular `DB` a esa D1, no a `martes-fc-prod`. La versión `master` sigue siendo v0.1.1; no avanzar a release hasta validar el acceso a D1 y la autenticación.

Fuentes oficiales (consultadas 17-11-2026):
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/

## Resolución verificada: Preview `develop` desplegado (17-11-2026)

La persona propietaria aportó un log de Workers Builds de 16:03–16:04 UTC con `Success! Build completed`. El comando de compilación ya incluye `cd web && npm ci --no-audit --no-fund && npm run build`, Vite compiló correctamente y `npx wrangler preview` actualizó la vista `develop`.

- Preview estable de la rama: https://develop-martes-fc.ali-tio.workers.dev
- URL del despliegue observado: https://3d1baac6-martes-fc.ali-tio.workers.dev
- Incidencia `ENOENT /opt/buildhome/repo/package.json`: **resuelta para el build mostrado**.
- La advertencia de `wrangler preview` en beta no es un fallo y no impidió el despliegue.
- La advertencia npm sobre ESLint obsoleto es informativa; actualizar dependencias debe tramitarse por feature y CI, no en este ajuste de despliegue.

**Pendiente antes de v0.2.0:** comprobar respuesta HTTP real de `/api/health` y `/api/public/snapshot`, confirmar `DB` de Preview, verificar Access y pruebas administrativas, backups y migración producción. La existencia de una URL Preview no demuestra por sí sola la consulta a D1. `master` permanece sin cambios.
