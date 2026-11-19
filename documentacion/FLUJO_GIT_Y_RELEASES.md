# Desarrollo, QA y publicación — MARTES FC

## Ramas permanentes

- `master`: versión estable; Cloudflare Workers producción.
- `develop`: integración; Cloudflare Workers preview.
- `feature/*` o `fix/*`: cambios aislados creados desde `develop`, PR a `develop`.
- `release/vX.Y.Z`: rama de estabilización creada desde `develop`, PR hacia `master`.

## Flujo

1. Crear rama temporal desde el HEAD actual de `develop`.
2. Implementar cambios acotados y pruebas; revisar el diff y mantener el diseño Glass original.
3. CI: `npm ci`, comprobaciones de diseño/API/D1, TypeScript, lint, pruebas web/Worker, SQL, build, `npm audit --audit-level=high` y Playwright con los navegadores configurados.
4. PR hacia `develop`. Requerir checks y comprobar el preview Cloudflare; no dar por buena una verificación sin evidencia.
5. Crear `release/vX.Y.Z`; actualizar `web/package.json`, lockfile y `documentacion/releases/vX.Y.Z.md`.
6. PR `release/vX.Y.Z` hacia `master`. El workflow de publicación verifica el commit exacto, genera el tag y publica GitHub Release.
7. Verificar build de producción, Worker, separación D1, y acceso administrativo; no copiar D1 Preview a producción.
8. Sincronizar `master` hacia `develop` mediante PR para reflejar versión y notas.

## Limpieza de ramas

`cleanup-temporary-branches.yml` borra únicamente la rama de un **PR fusionado**: `feature/*` y `fix/*` hacia `develop`, o `release/*` hacia `master`. Exige mismo repositorio, SHA remoto idéntico al SHA fusionado y eliminación con `--force-with-lease`. No actúa retroactivamente, ni sobre PR cerrados sin merge, ni sobre `master` o `develop`.

Las ramas históricas, incluidas `sync/*` y antiguas features, requieren auditoría individual de commits y autorización para su limpieza; **no** usar un job puntual que borre varias ramas sin verificar su contenido vigente.

## Seguridad

- No saltarse checks ni forzar merges; conservar los tags y releases publicados.
- Acciones GitHub fijadas por SHA, mínimos permisos y secretos solo en Cloudflare.
- Verificar protecciones de rama en GitHub Settings cuando se disponga de permisos; no afirmar que están habilitadas sin consultar su estado.
- No modificar directamente la base D1 de producción durante QA de preview.
