# Desarrollo, QA y publicación — MARTES FC

Proceso adaptado de mini-podcast, con dos ramas permanentes.

## Ramas

- `master`: versión estable conectada a Producción Cloudflare.
- `develop`: integración y Preview Cloudflare.
- `feature/*`: cambios aislados desde develop, PR de regreso a develop.
- `release/vX.Y.Z`: estabilización desde develop, versión y notas, PR a master.
- Las ramas históricas `main` y `sync/*` no forman parte del flujo actual; verificar referencias y eliminar restos manualmente o mediante una operación con lease.

## Pasos de release

1. Crear la feature desde develop y hacer cambios pequeños y reversibles.
2. CI: `npm ci`, auditoría completa `npm audit --audit-level=high`, typecheck frontend/Worker, lint, pruebas de dominio/Worker/SQL y build.
3. Playwright Chromium y WebKit en la matriz responsive, prestando especial atención a 320, 390, 768 y 1440 px; revisar Safari real antes de prometer equivalencia nativa.
4. Merge por PR en develop, comprobar el preview y D1 correspondiente.
5. Crear `release/vX.Y.Z`, actualizar `web/package.json`, lockfile y `documentacion/releases/vX.Y.Z.md`.
6. PR a master, CI protegida. El workflow de release comprueba el SHA y publica el tag y GitHub Release.
7. Confirmar deployment conectado en Cloudflare Workers, API pública D1 y Access administrativo.
8. Sincronizar master hacia develop mediante PR y limpiar ramas temporales solo si el SHA coincide.

## Seguridad

- No forzar push, eludir checks ni copiar datos D1 entre entornos.
- Acciones de GitHub fijadas a SHA, permisos mínimos, runtime secrets solo en Cloudflare.
- Preservar etiquetas y releases publicados; no modificar una versión ya etiquetada.
