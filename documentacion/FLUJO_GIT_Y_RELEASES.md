# Flujo de Git, calidad, Cloudflare y releases — MARTES FC

**Referencia verificada:** `blex-ing/mini_podcast`, rama `master`, revisada el 17-11-2026; documentos `documentacion/FLUJO_GIT_Y_RELEASES.md`, `DESPLIEGUE_CLOUDFLARE.md`, `SEGURIDAD_CI_Y_DEPENDENCIAS.md` y workflows de `.github/workflows/`. Este proyecto reutiliza el **proceso**, no la lógica del podcast.

## 1. Fuente de verdad y estrategia

GitHub es la fuente de verdad del código. Existen solo dos ramas permanentes:

- `master`: producción y versión estable.
- `develop`: integración de cambios aprobados; muestra preview de integración.
- `feature/<ticket-o-nombre>`: desarrollo temporal, siempre nace de `develop`.
- `release/vX.Y.Z`: candidata a publicar, nace de `develop`; acepta solo correcciones, pruebas y documentación.
- `hotfix/<motivo>`: urgencia excepcional, parte de `master` y exige PR a `master` y posterior sincronización a `develop`; usa notas/versión coherentes para no saltar el proceso habitual.

El repositorio **no requiere una rama `main`**. Si alguien clonó el prototipo previo con `main`, debe revisar la migración antes de publicar el repositorio, no subir por error el historial anterior.

## 2. Una feature desde el inicio hasta la integración

1. Actualizar `develop`; crear `feature/...` desde ese SHA.
2. Especificar alcance y criterio de aceptación; cambios acotados.
3. Añadir/actualizar tests, documentación y changelog cuando corresponda.
4. Comprobar localmente `npm ci && npm run check && npm test && npm run build` dentro de `web/`.
5. Abrir PR **solo a `develop`**. Rellenar plantilla, evidencia de QA y riesgos.
6. GitHub Actions ejecuta comprobaciones; Cloudflare construye un preview por rama (cuando esté conectado).
7. Revisar el diff, el preview en móvil y escritorio, acceso por teclado y ausencia de datos privados.
8. Fusionar vía PR solo cuando los checks requeridos estén verdes; eliminar feature tras verificar merge y SHA.

## 3. Publicación estable

1. Desde `develop` crear `release/vX.Y.Z` con el alcance previsto.
2. Actualizar `CHANGELOG.md` y `documentacion/releases/vX.Y.Z.md` (obligatorio para publicación automática).
3. Ejecutar CI, revisar preview y confirmar que no se publican datos de ejemplo como reales.
4. PR `release/vX.Y.Z` → `master`; fusionar tras pasar reglas obligatorias.
5. Workflow `publish-release.yml` comprueba que `master` coincide con el SHA fusionado, verifica la etiqueta no existente y crea tag `vX.Y.Z` + GitHub Release con notas versionadas.
6. Cloudflare publica producción desde `master` cuando su integración haya sido configurada.
7. Comprobar manualmente URL de producción, móvil y escritorio; registrar incidencia/rollback si fuera necesario.
8. Sincronizar `master` → `develop` mediante PR/merge verificado; no dejar fixes de release fuera de develop.
9. Limpiar la rama `release/*` solo tras el merge y comprobación de SHA.

**Importante:** el tag/release depende de que la rama protegida exija CI antes del merge. El workflow de publicación no sustituye la protección del repositorio ni verifica por sí solo todos los checks. Tampoco afirma que el deploy Cloudflare haya terminado: se comprueba por separado.

## 4. Automatizaciones de mantenimiento

| Automatización | Evidencia / gatillo | Acción |
|---|---|---|
| CI | PR a `develop`/`master` y push a ramas relevantes | Validar sintaxis, dominio, privacidad y build |
| Dependabot | Semanal, PR a `develop` | Proponer cambios de npm/Actions, nunca auto-merge |
| Releases | PR fusionado `release/vX.Y.Z` → `master` | Crear tag y release si SHA y notas coinciden |
| Limpieza | PR de feature o release fusionado | Borrar rama solo si SHA remoto sigue siendo el esperado (`--force-with-lease`) |
| Previews | Integración Cloudflare Workers Builds | Previews por rama/PR; producción solo `master` |
| QA visual | Revisión manual en MVP; Playwright tras migración | Comprobar 320–430 px, escritorio, formularios y errores |

## 5. Protecciones compatibles con GitHub Free público

En `Settings → Branches` establecer protección para `master` y `develop`:

- Require a pull request before merging.
- Require status checks: `Static integrity and domain tests` (nombre del job `quality` del workflow CI).
- Bloquear force-push y borrado de ramas estables.
- Exigir actualización con base cuando sea viable y evitar cambios directos que no pasen CI.
- No activar obligación de aprobación de otro revisor en un repositorio de una sola persona si eso bloquea la entrega; GitHub no permite aprobar el PR propio como review externa.
- No desactivar reglas ni hacer push directo por comodidad; elevar excepciones documentadas si aparece una urgencia.

**Limitación operativa:** los ajustes de GitHub se realizan en el repositorio una vez creado; incorporar los archivos YAML **no aplica** branch protection automáticamente.

## 6. SemVer

- `PATCH` para corrección sin cambio de contrato.
- `MINOR` para nueva funcionalidad compatible.
- `MAJOR` para ruptura explícita de contrato o migración incompatible.
- Hasta publicar la primera release real, `v0.1.0` describe solo la base inicial propuesta y no es evidencia de un tag publicado.

## 7. Seguridad

- Acciones GitHub de proveedores oficiales, fijadas por SHA. Verificación registrada por Mini Podcast el 16-11-2026; futuras actualizaciones se revalidan con el mantenedor.
- CI `contents: read`; workflows de publicación y limpieza elevan a `contents: write` solo el job que lo requiere.
- PR de fuentes externas nunca obtiene credenciales de despliegue desde la CI del repositorio.
- Dependencias fijadas por lockfile y `npm ci`; instalar paquetes o nuevas versiones solo con justificación, PR y revisión.
- No datos reales, screenshots privados o archivos `.env` versionados.
