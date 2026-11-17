## Objetivo, alcance y referencias
Explica qué problema resuelve esta feature o release y qué cambia en el comportamiento.

## Flujo
- [ ] `feature/*` → PR a `develop` o `release/vX.Y.Z` → PR a `master`.
- [ ] No hay cambios ajenos al alcance ni código temporal innecesario.

## Validaciones
- [ ] `npm ci && npm run check && npm test && npm run build` en `web/`.
- [ ] GitHub Actions en verde.
- [ ] Preview Cloudflare revisado (si está disponible) o verificación local.
- [ ] Móvil (320/390/430 px), escritorio y navegación de teclado revisados.
- [ ] Los resultados de demo están claramente identificados como ficticios.
- [ ] No hay datos sensibles, fotos privadas, números personales ni secretos.

## Riesgos, seguridad y rollback
Describe efectos secundarios, validaciones, migraciones (si aplica) y reversión.

## Documentación y release
- [ ] Requisitos / arquitectura actualizados cuando corresponde.
- [ ] CHANGELOG actualizado cuando corresponde.
- [ ] Nota `documentacion/releases/vX.Y.Z.md` incluida si es una release.
\n## Requisitos vivos y trazabilidad\n- [ ] He actualizado `documentacion/REQUISITOS_VIVOS.md` con IDs, estado, pruebas y alcance, o he documentado por qué no aplica.\n- [ ] Para API/D1: migraciones SQL, contrato, permisos, rollback y entorno preview revisados.\n- [ ] Ningún dato real de jugadores o acceso administrativo se filtra al repositorio público.\n