# Operación Cloudflare D1 + Access — MARTES FC

## Estado de los recursos (17-11-2026)
**Confirmados por captura del dashboard del propietario, no por conexión API:**
- D1 producción `martes-fc-prod`: `cd88771a-bfce-4b6b-873f-61066407a7db`
- D1 pruebas `martes-fc-preview`: `8242fd69-84d4-4630-b4c2-7b6d29550aeb`

La conexión a D1 está **declarada en Git**, pero la captura no acredita que el esquema SQL se haya aplicado ni que haya una sesión administrativa operativa. Nada de esto autoriza publicar aún en `master`.

## Paso 0 · Requisito externo todavía pendiente: Cloudflare Access
La integración GitHub **no administra la cuenta Cloudflare**.
- Crear la aplicación **Cloudflare Access Self-hosted** para proteger exclusivamente `/api/admin/*`, en la URL real de producción y, si procede, en las de previews, con correo autorizado.
- Registrar `TEAM_DOMAIN` como `https://<equipo>.cloudflareaccess.com`, `POLICY_AUD` (AUD del Access App) y `ADMIN_EMAIL` en variables/secrets del Worker **en el dashboard**, no en `wrangler.jsonc` ni `VITE_*`.
- Las previews no heredan automáticamente todas las variables de producción: configurar una identidad de prueba con permisos mínimos para ellas o mantener las escrituras completamente bloqueadas.
- El código valida la firma RS256 del JWT, audiencia, issuer y correo. Sin valores válidos debe rechazar las modificaciones.

## Paso 1 · Configuración Wrangler (hecha en la feature)
Archivo `wrangler.jsonc`:
```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "martes-fc-prod",
    "database_id": "cd88771a-bfce-4b6b-873f-61066407a7db",
    "preview_database_id": "8242fd69-84d4-4630-b4c2-7b6d29550aeb",
    "migrations_dir": "migrations"
  }
],
"previews": {
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "martes-fc-preview",
      "database_id": "8242fd69-84d4-4630-b4c2-7b6d29550aeb"
    }
  ]
}
```
El `preview_database_id` también protege las sesiones `wrangler dev --remote`; el campo **`previews.d1_databases`** separa las Worker Previews publicadas. `DB` es el nombre del binding para ambas, **pero los UUID son distintos**.

Archivo `wrangler.preview-migrations.jsonc`:
```json
{
  "d1_databases": [
    {
      "binding": "PREVIEW_DB",
      "database_name": "martes-fc-preview",
      "database_id": "8242fd69-84d4-4630-b4c2-7b6d29550aeb",
      "migrations_dir": "migrations"
    }
  ]
}
```

## Paso 2 · Aplicar migraciones primero en pruebas
**PREVIEW: migración aplicada y tablas verificadas el 17-11-2026. PRODUCCIÓN: pendiente, no aplicar todavía.** Según la salida compartida por el propietario desde GitHub Codespaces, Wrangler 4.164.0 ejecutó correctamente `0001_initial.sql` sobre `PREVIEW_DB` (`8242fd69-84d4-4630-b4c2-7b6d29550aeb`) y confirmó las tablas `seasons`, `players`, `matches`, `match_players` y `audit_events`, junto a las tablas internas `d1_migrations`, `_cf_KV` y `sqlite_sequence`. El resultado fue `12 commands` ejecutados y estado `✅`. Esta comprobación acredita el esquema SQL, **no** la conexión de la API Worker, la autenticación ni la publicación de v0.2.0.\n\nLos comandos siguientes quedan como referencia reproducible; **no es necesario repetir la migración ya aplicada en PREVIEW**. En una terminal autenticada de Wrangler, situada en la raíz del repositorio y con una rama que tenga los bindings:
```sh
# 1. Ver qué migraciones faltan en la D1 de PREVIEW
npx wrangler d1 migrations list PREVIEW_DB --remote --config wrangler.preview-migrations.jsonc

# 2. Aplicarlas SOLAMENTE a PREVIEW
npx wrangler d1 migrations apply PREVIEW_DB --remote --config wrangler.preview-migrations.jsonc

# 3. Comprobar que existen las tablas; únicamente preview
npx wrangler d1 execute PREVIEW_DB --remote --config wrangler.preview-migrations.jsonc --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"

# 4. Respaldar antes de aplicar en producción (si hay datos; export fuera del repo)
npx wrangler d1 export martes-fc-prod --remote --output martes-fc-prod-backup.sql

# 5. Aplicar la versión aprobada a producción cuando preview y seguridad funcionen
npx wrangler d1 migrations list DB --remote
npx wrangler d1 migrations apply DB --remote
```
`DB` se refiere al binding de producción; `PREVIEW_DB` al binding de migraciones de preview. Las migraciones de producción **no** deben ejecutarse automáticamente desde un PR o preview. Las migraciones incluyen únicamente esquema y temporada ficticia 2026; nunca contactos ni resultados reales.

**Importante:** conservar el backup fuera de GitHub. Una D1 recién creada no tiene tablas de la aplicación hasta aplicar `0001_initial.sql`. El código sin tablas puede devolver `503 database_unavailable` en `GET /api/public/snapshot`.

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
