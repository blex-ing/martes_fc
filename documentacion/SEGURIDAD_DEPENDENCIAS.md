# Excepción temporal y controles de dependencias — MARTES FC v0.2.0

**Fecha de evaluación:** 2026-11-17. **Estado:** propuesta en PR, pendiente de aprobación explícita del riesgo residual. No afirmar que el aviso se ha corregido.

## Hecho comprobado

- `npm audit --audit-level=high` sobre `web/` bloquea el CI por `picomatch@4.0.7` (GHSA-fc5q-39xc-vjpf, severidad alta, ReDoS), propagado como *metavulnerabilidad* a Vite, tinyglobby, fdir y otras dependencias de compilación.
- El árbol `web/package-lock.json` marca `picomatch@4.0.7` y sus dependientes afectados como `dev:true`. MARTES FC no acepta patrones glob de visitantes ni ejecuta Vite en el Worker de producción.
- El propietario ejecutó `npm audit --omit=dev --audit-level=high`, resultado `found 0 vulnerabilities`. Esta evidencia **no elimina** el riesgo que existe al compilar código o en CI.
- El aviso [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) del 17-11-2026 declara afectadas las versiones `<=4.0.7` y **sin versión corregida publicada**. No forzar un downgrade de Vite ni instalar forks nuevos no auditados.
- `minimatch@10.2.6` (GHSA-g3hv-75wg-m249) está afectado con severidad **moderada**; hay fix en `11.0.1`, pendiente de validar compatibilidad de TypeScript ESLint antes de forzar una versión mayor. El umbral CI es High.

## Política propuesta (NO es un parche)

La seguridad de dependencias tiene **dos controles obligatorios**:

1. **Ejecución, estricta**: `npm audit --omit=dev --audit-level=high`, **sin excepciones**; cualquier hallazgo de severidad alta/crítica frena el PR.
2. **Todas las dependencias**: `node scripts/security-audit.mjs` **ejecuta `npm audit --json --audit-level=high` real** y valida cada vulnerabilidad alta/crítica. La única excepción es el aviso `GHSA-fc5q-39xc-vjpf` atribuido exactamente a `picomatch@4.0.7`, exclusivamente cuando **todos** sus nodos y metavulnerabilidades son `dev:true` en el lockfile. No se permite excepción en nodos de runtime, en avisos nuevos, críticos, en errores de red/registro ni en cambios imprevistos de estructura del informe.

La excepción **caduca el 17 de diciembre de 2026 (UTC)**. En esa fecha CI vuelve a fallar si el aviso continúa, para obligar a una nueva revisión formal. `node --test scripts/security-audit.test.mjs` somete esta regla a 11 casos positivos/negativos (incluyendo severidades nuevas, runtime, expiración, metadatos corruptos y versiones distintas).

## Riesgo residual y mitigación

- **Impacto residual:** posible denegación de servicio al proceso Node de compilación si recibe un patrón extglob malicioso. No es una lectura de datos de usuarios ni una vulnerabilidad encontrada en la API desplegada.
- **Mitigaciones operativas:** lockfile y `npm ci` reproducible; sin globs proporcionados por peticiones HTTP; ejecutores GitHub Actions efímeros sin secretos de producción; PR y CI obligatorios; build no usa tokens D1/Access; auditar cualquier cambio a patrones de build.
- **El umbral de riesgo no se relaja para futuras alertas.** El CI muestra explícitamente la excepción y falla si hay vulnerabilidades altas/críticas distintas. Los avisos moderados siguen reportados.
- **Opción más conservadora:** mantener bloqueada la publicación hasta que `picomatch` publique parche; esta excepción debe ser una decisión consciente, no automática.

## Plan de retirada de la excepción

1. Vigilar el aviso oficial y una versión nueva reparada.
2. Abrir `feature/security-dependency-update` desde `develop`; actualizar de forma **compatible** Vite/TypeScript ESLint y regenerar el lockfile con `npm install --package-lock-only`.
3. Repetir `npm ci`, auditoría completa, tests, compilación y Playwright.
4. Eliminar la excepción y restaurar `npm audit --audit-level=high` directo cuando esta instrucción pase sin incidencias.
5. Sincronizar `develop` y la rama de release antes de fusionar a `master`.

**Seguimiento:** [issue #18](https://github.com/blex-ing/martes_fc/issues/18). **Release:** [PR #17](https://github.com/blex-ing/martes_fc/pull/17) en borrador mientras falten aprobaciones y comprobaciones de producción.
