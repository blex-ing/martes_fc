# Operación Cloudflare D1 + Access — MARTES FC

## Paso 0 · Requisitos externos
La integración GitHub permite editar el código pero **no administra la cuenta Cloudflare**. Crear recursos en el dashboard con el propietario antes de publicar v0.2.0:
- D1 `martes-fc-prod` y D1 `martes-fc-preview`, anotar los UUID reales.
- Crear una aplicación **Cloudflare Access** de tipo Self-hosted que cubra exclusivamente `/api/admin/*` en el dominio de producción y previews pertinentes, restringida al correo autorizado; conservar AUD y dominio `https://TU-EQUIPO.cloudflareaccess.com`.
- Configurar las variables de Worker `POLICY_AUD`, `TEAM_DOMAIN` y `ADMIN_EMAIL`; nunca en Git, capturas públicas o prefijos `VITE_`.

## Paso 1 · Configuración Wrangler (después de crear D1)
Mantener `wrangler.jsonc` con Worker Static Assets y `main: ./worker/index.ts`. Añadir, sustituyendo solo por IDs reales:

```json
"d1_databases": [
  {"binding":"DB","database_name":"martes-fc-prod","database_id":"UUID-REAL-PROD","migrations_dir":"migrations"}
],
"previews": {
  "d1_databases": [
    {"binding":"DB","database_name":"martes-fc-preview","database_id":"UUID-REAL-PREVIEW"}
  ]
}
```
**OJO**: la vinculación de previews y la de producción deben apuntar a UUID distintos. Nunca usar la D1 de producción en previews.

## Paso 2 · Migraciones
En un equipo con Wrangler instalado y login a esa cuenta:
```sh
npx wrangler d1 migrations apply martes-fc-prod --local
# PREVIEW: usar configuración wrangler.preview-migrations.jsonc con UUID real
npx wrangler d1 migrations apply martes-fc-preview --remote --config wrangler.preview-migrations.jsonc
# BACKUP antes de tocar producción (ver comando vigente en documentación oficial)
npx wrangler d1 migrations apply martes-fc-prod --remote
```
No ejecutar en remoto sin comprobar nombre, UUID, entorno y respaldo. Las migraciones no introducen datos personales: solo una temporada 2026.

## Paso 3 · Autenticación
Proteger **solo** el espacio `/api/admin/*`, manteniendo `/api/public/*` y estáticos públicos. Configurar Access en todos los dominios/preview hostnames que expongan la API. Las credenciales de correo de Access deben corresponder al campo `ADMIN_EMAIL` y al JWT verificado en el Worker. Si se omite cualquiera de los tres ajustes, toda operación ADM será denegada.

## Paso 4 · Verificación antes de release
- `GET /api/health` configured true en preview y producción.
- `GET /api/public/snapshot` 200 y solo datos autorizados.
- `POST /api/admin/matches` sin Access → 401/403; con un JWT inválido → 401/403.
- Sesión real Access permite alta de jugadores y partidos; dos navegadores observan mismo resultado.
- No pueden darse de alta partidos con goles desajustados, ausentes con goles ni portero inválido.
- La preview no toca producción; QA móvil y CI correctos; rollback del Worker mediante versión previa.

## Backup y rollback
Antes de migrar, exportar D1 o usar Time Travel/backup según el plan vigente y verificar capacidad de restauración; conservar la copia fuera del repo público. Un despliegue de frontend/Worker se revierte en Cloudflare; una migración destructiva **no** se revierte con un rollback de código. Realizar cambios SQL aditivos y ensayar restore en staging.

## Política de publicaciones
No fusionar a `master` ni etiquetar v0.2.0 hasta que D1 y Access reales estén configurados, pruebas remotas pasen y las URLs sean confirmadas. La demo v0.1.1 sigue accesible mientras se trabaja en develop.
