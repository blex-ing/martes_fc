# Auditoría de ramas históricas — MARTES FC

**Fecha:** 19-11-2026. **Issue:** #38. **Referencia estable de comparación:** `master` v0.3.7, commit `dd9b06d48dd759443d5128b98ccd8e5335364cb7`.

Este registro recoge una **comparación real de commits y ficheros** contra `master`, junto con los PR cerrados. No interpreta `ahead > 0` como trabajo definitivamente no publicado: merges squash pueden dejar commits exclusivos aun cuando sus cambios de código sean equivalentes. Ante la duda se conserva la rama.

| Rama | SHA auditado (prefijo) | Ahead / behind frente a master | PR / estado | Decisión |
| --- | --- | --- | --- | --- |
| `master` | `dd9b06d` | — | Producción, permanente | **Nunca borrar** |
| `develop` | `de917da` | — | Integración, permanente | **Nunca borrar** |
| `sync/v0.1.1` | `507756ba` | **0 / 114** antes de borrado | #8 fusionado, árbol completamente contenido en master | **Eliminada el 19-11-2026**, comprobado en GitHub Actions |
| `feature/diagnose-access-preview-401` | `6ebddd4` | 5 / 62 | #16 cerrado sin merge; la puesta en marcha posterior corrigió configuración Access en Preview | Conservar: existe trabajo diagnóstico no fusionado |
| `feature/security-audit-controlled-exception` | `135bd7d` | 5 / 62 | #19 cerrado sin merge; #20 sustituyó la excepción por eliminación de dependencia | Conservar: propuesta no publicable; no reintroducir excepción |
| `feature/issue-31-season-goalkeeper-stats` | `89d6b28` | 3 / 45 | #40 cerrado sin merge; issue #31 cerrada | Conservar: verificar equivalencia semántica antes de decidir eliminación |
| `feature/issue-37-cross-browser-responsive-qa` | `b177975` | 7 / 38 | #49 cerrado sin merge por fallos; sustituido por #58 / v0.3.4 | Conservar: no integrar CSS fallido ni borrar sin revisión humana |
| `feature/issue-38-maintenance-docs` | `227c01a` | 6 / 36 | #51 cerrado sin merge; reemplazado por #59 / v0.3.4 | Conservar: contenía un job destructivo que no debe recuperarse |
| `fix/match-modal-scroll-footer` | `6d0da13` | 4 / 36 | #52 fusionado por squash, release v0.3.3 | Conservar: el SHA original tiene commits exclusivos aunque el fix se publicó |
| `docs/issue-38-current-stack-safe` | `0380ed7` | 6 / 24 | #59 fusionado por squash | Conservar: no es posible probar ausencia de diferencias de trabajo solo con el historial |

## Protocolo único para `sync/v0.1.1`

La rama `sync/v0.1.1` apuntaba exactamente a `507756ba7b2e2d6665cc281ff1ad23ab64a346ed`, commit ancestro de `master`, y tenía cero commits por delante en la comparación GitHub. Eliminar esta **referencia** no elimina el commit del historial, que continúa alcanzable desde `master` y `develop`/PR #8.

La issue #38 **prohíbe borrar por API de ramas**. Se ejecutó una limpieza segura mediante un job puntual y limitado del workflow existente tras fusionar el [PR #71](https://github.com/blex-ing/martes_fc/pull/71) en `develop`. El job de la [ejecución #44571729906](https://github.com/blex-ing/martes_fc/actions/runs/44571729906) terminó en **success** y sus logs muestran `- [deleted] sync/v0.1.1`. La lista de ramas posterior confirma su ausencia. El proceso exigió simultáneamente:

1. PR de la rama exacta `feature/issue-38-safe-history-audit`, en el mismo repositorio, **fusionado** a `develop`.
2. Existencia de `refs/heads/sync/v0.1.1` y coincidencia exacta con SHA `507756ba7b2e2d6665cc281ff1ad23ab64a346ed`. Si la rama avanzó se conserva y el job falla.
3. Verificación `git merge-base --is-ancestor` sobre el `master` **actual**, sin suponer que la comparación antigua basta.
4. Eliminación mediante Git `git push --force-with-lease` sobre **esa única referencia**. No se usa API de borrado.

El resultado se verificó contra la lista real de ramas y los logs de GitHub Actions. El job puntual **ya se retiró en `release/v0.3.8`** antes de publicarse, dejando el workflow de limpieza ordinaria idéntico al de `master` v0.3.7 (SHA de contenido original). Ningún nuevo job destructivo permanece en la versión destinada a producción. El workflow general conserva su política ordinaria de borrado solo tras merge con coincidencia de SHA.

## Política permanente

- Los borrados de ramas con commits exclusivos requieren primero una **reconciliación de patches/árboles** y un cambio autorizado. No basta con que un PR esté cerrado.
- No usar `git push --delete` sin comparar el SHA remoto; no realizar reset forzado de ninguna rama permanente.
- `master` y `develop` permanecen como ramas permanentes, y la sincronización de releases se mantiene mediante PR con CI completa.
- Antes de cualquier futuro borrado: consulta de PRs cerrados, `git merge-base`, `compare_commits`, verificación de archivos, SHA por lease y comprobación posterior de que no se perdió trabajo.
- Las operaciones D1, Cloudflare Access y secretos no se modifican durante esta limpieza.

**Nota:** esta auditoría no implica validación manual de producción o autorización para eliminar otras ramas.
