# MARTES FC · Registro vivo de requisitos

**Fuente de verdad funcional:** este documento, versionado en GitHub junto con el código.  
**Última revisión:** 2026-11-17 · **Versión objetivo:** v0.2.0.  
**Proceso:** todo requisito nuevo/modificado debe incluir ID estable, versión, prioridad, estado, criterios de aceptación, tests y enlace al PR. Nunca borrar IDs: marcar «descartado» con motivo. 
**Estados permitidos:** Propuesto → Aprobado → En desarrollo → Implementado → Verificado → Publicado; Bloqueado y Descartado (con razón).

## Visión y límites
Una web abierta con estadísticas deportivas del equipo MARTES FC. El código y los resultados autorizados para publicación son públicos. Identidad privada, credenciales, sesiones, registros de edición y datos no publicados no se envían al cliente ni se guardan en Git.

## Actores
- VIS: público anónimo, solo consulta información publicada.
- ADM: una persona administradora autorizada por Cloudflare Access; solo ella modifica información desde la API.
- DEV: contribuyente al código mediante PR; NO obtiene privilegios sobre D1 ni sobre datos privados por acceso a GitHub.

## v0.2.0 — requisitos funcionales
| ID | Capacidad / aceptación verificable | Prioridad | Estado y evidencia | Prueba objetivo |
|---|---|---|---|---|
| RF-020 | VIS obtiene jugadores y partidos publicados con un único GET, compartidos entre navegadores | P0 | GET remoto Preview 200 con `source=d1`; sincronización entre navegadores y escritura pendientes | API: 200, contrato JSON, solo campos públicos |
| RF-021 | Persistir jugadores con ID, alias público, rol (Portero/Jugador), colores de avatar y estado activo | P0 | Verificado en CI; E2E remoto pendiente | SQL constraints, endpoint |
| RF-022 | Persistir partidos con fecha, rival, GF, GC, portero, paradas y temporada | P0 | Verificado en CI; E2E remoto pendiente | API + SQL |
| RF-023 | Persistir participación por partido y goles individuales; suma goles = GF | P0 | Verificado en CI; E2E remoto pendiente | Test de dominio y rechazo 400 |
| RF-024 | Calcular KPIs, ranking, fichas y portería sin guardar agregados duplicados | P0 | Verificado en CI; E2E remoto pendiente | Tests de cálculo existentes |
| RF-025 | Mantener la demo usable si no hay D1, sin presentar demo como dato real | P0 | Verificado en CI; E2E remoto pendiente | Test web y estado de origen |
| RF-026 | ADM crea partidos en servidor; no permite modificar desde interfaz anónima | P0 | Verificado en CI; E2E remoto pendiente | API: 401/403 sin Access verificado |
| RF-027 | ADM edita y elimina partidos, actualiza plantilla; operaciones con trazabilidad | P1 | Verificado en CI; E2E remoto pendiente | API + auditoría |
| RF-028 | Gestionar temporadas desde D1 (una activa inicialmente); consultar por temporada en futuro | P1 | Verificado en CI; E2E remoto pendiente | SQL FK y lectura |
| RF-029 | ADM solo accede mediante JWT Cloudflare Access validado (firma, issuer, audience y correo autorizado) | P0 | Verificado en CI; E2E remoto pendiente | Tests negativos auth |
| RF-030 | Separar D1 de producción y D1 de preview; nunca se reutiliza la D1 de producción en CI/preview | P0 | Binding `DB` Preview operativo, lectura SQL 200; aislamiento de escritura no comprobado | `npm run check:d1` + Workers Preview real |
| RF-031 | Un administrador puede exportar datos públicos en JSON y el mantenimiento dispone de procedimiento de backup | P1 | En desarrollo: backup remoto pendiente | Pruebas export y runbook |
| RF-032 | Nada de resultados reales ni nombres reales en las migraciones/fixtures públicas sin consentimiento previo | P0 | Verificado en CI; E2E remoto pendiente | check:public y revisión |
| RF-033 | Mostrar fuente y estado de sincronización sin confundir datos demo, remotos o caídos | P0 | Verificado en CI; E2E remoto pendiente | QA móvil/desktop |
| RF-034 | ADM puede desactivar jugadores sin borrar su histórico de partidos | P1 | Verificado en CI; E2E remoto pendiente | SQL + UI |
| RF-035 | VIS recibe respuestas cacheables brevemente; cambios ADM invalidan mediante cache corto y revalidación | P1 | Verificado en CI; E2E remoto pendiente | Control Cache-Control |

## No funcionales v0.2.0
| ID | Requisito | Criterio / protección |
|---|---|---|
| RNF-020 | Coste cero en escala del equipo | Workers Free+D1 Free; monitorizar cuotas, no prometer ilimitado |
| RNF-021 | Integridad | FKs, checks, transacciones D1 batch, validación de entrada y longitudes en servidor |
| RNF-022 | Privacidad | alias consentido, contactos no recopilados; logs de auditoría no públicos |
| RNF-023 | Seguridad | métodos permitidos, auth fail-closed, CSRF/origin en escritura, sin secrets VITE_, respuestas genéricas de error |
| RNF-024 | Mantenibilidad | contrato tipado, dominio puro, adaptadores separados, migraciones SQL versionadas |
| RNF-025 | Evolución segura | flujo feature → develop → release → master; bloqueo hasta recursos y tests |
| RNF-026 | Backups | copia antes de migrations remotas; restauración documentada |
| RNF-027 | Accesibilidad | conservar QA visual y uso móvil; errores visibles y no depender de color |
| RNF-028 | Performance | un GET para snapshot, respuesta reducida, control de caché |
| RNF-029 | Disponibilidad | si falta binding, servidor informa 503 y frontend conserva demo rotulada |
| RNF-030 | Observabilidad | endpoint health de estado sin exponer secretos ni datos privados |

## Exclusiones de v0.2.0
Cuentas para cada jugador, fotos reales, estadísticas de minutos o cambios de portero dentro del encuentro, inscripciones públicas, pagos, multi-equipo, clasificación de otras ligas y edición simultánea colaborativa. Los reemplazos de portero a mitad de partido quedan explícitamente fuera del modelo MVP: un portero por partido completo.

## Política de mantenimiento (obligatoria)
1. Crear/actualizar requisito con ID estable y decisión de alcance antes de codificar.
2. En el mismo PR actualizar este documento, contratos API, migraciones y tests cuando cambien.
3. Anotar en la tabla de trazabilidad el PR, test y release; promover estado solo con evidencia.
4. Datos reales requieren autorización de publicación y carga manual protegida, nunca en fixtures.
5. Antes de cada release: actualizar CHANGELOG, version package, release notes, ejecutar CI+QA, validar migraciones en preview, backup de producción y criterios de aceptación.
6. Una feature que afecta BD incluye migración **aditiva/reversible cuando sea posible**, procedimiento de rollback y revisión de permisos.
7. Tras release: sincronizar master → develop y cerrar ramas temporales con comprobación SHA.

## Trazabilidad (actualizar a lo largo de la implementación)
| Versión | Requisitos | Feature / PR | CI | Despliegue |
|---|---|---|---|---|
| v0.1.1 | RF-001 a RF-008 (ver `REQUISITOS.md`) | Historial anterior | Verificado | Workers Build OK |
| v0.2.0 | RF-020 a RF-035 y RNF-020 a RNF-030 | [PR #9](https://github.com/blex-ing/martes_fc/pull/9) | [CI Worker+React+SQL+QA](https://github.com/blex-ing/martes_fc/actions/runs/44104083710) ✅ | Requiere D1 y Access reales |

## Referencias
- [Propuesta de versión](PROPUESTA_V0.2.0.md)
- [Modelo y contrato](MODELO_Y_API_D1.md)
- [Operación y configuración](OPERACION_D1_ACCESS.md)
- [Requisitos iniciales](../REQUISITOS.md)

## Estado de aceptación v0.2.0 (actualizado 2026-11-17)
- Implementación y tests automáticos: completados en la feature, PR #9.
- Configuración remota D1 y Access, E2E con usuarios reales y export/restore D1: **BLOQUEADOS** hasta disponer de recursos externos; no declarar la versión publicada.
- Las pruebas de firma JWT incluyen una firma RS256 válida generada en test, cambios de audiencia y bloqueo por Origin. No sustituyen la prueba real con Cloudflare Access.
- Al crear D1, actualizar filas RF-030/RF-031, enlazar evidencia de test remoto y PR de release; conservar este historial, no borrar las versiones anteriores.

### Evidencia de la feature `configure-d1-bindings-v020` (17-11-2026)
- El propietario creó `martes-fc-prod` y `martes-fc-preview` en el panel Cloudflare (captura verificada). Identificadores D1 públicos en `wrangler.jsonc`.
- `previews.d1_databases` apunta solamente a `martes-fc-preview`; `wrangler.preview-migrations.jsonc` apunta a la misma D1 para migraciones remotas de pruebas.
- La CI comprueba con `npm run check:d1` que los UUID de producción y preview no coinciden.
- **Pendiente:** aplicar SQL a ambas D1, probar preview en Cloudflare, configurar Access y verificar escritura autorizada antes de completar RF-030 y publicar v0.2.0.

### Evidencia de migración remota de PREVIEW (17-11-2026)
- Origen: salida de Wrangler 4.164.0 ejecutado por el propietario desde GitHub Codespaces en rama `develop`.
- `npx wrangler d1 migrations apply PREVIEW_DB --remote --config wrangler.preview-migrations.jsonc` ejecutó `0001_initial.sql` con estado ✅ en UUID `8242fd69-84d4-4630-b4c2-7b6d29550aeb`.
- El `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name` confirmó las cinco tablas de dominio: `seasons`, `players`, `matches`, `match_players`, `audit_events`.
- **Alcance de la verificación:** solo estructura de `martes-fc-preview`. No se han verificado endpoint Worker, datos de jugador, Access, backups o la D1 de producción.
- **Siguiente control:** resolver Worker Preview y comprobar `GET /api/public/snapshot` antes de promocionar a producción.

### Bloqueo de Cloudflare Preview (17-11-2026)

- El build remoto de Preview falló **antes de compilar código**: Workers Builds ejecuta `npm run build` en la raíz `/opt/buildhome/repo`, pero el `package.json` está en `web/`; error `ENOENT` aportado por el propietario.
- No implica un fallo en la migración D1 ya aplicada en PREVIEW ni en los tests de GitHub. **No declarar RF-020/030 verificados end-to-end**.
- La corrección depende de Settings → Build en Cloudflare: root `/`, Build command `cd web && npm ci --no-audit --no-fund && npm run build` en las configuraciones pertinentes, Preview command `npx wrangler preview`; guardar y reintentar.
- Evidencia de cierre: logs de Preview con compilación Vite satisfactoria, URL aislada y `GET /api/public/snapshot` funcionando con la base `martes-fc-preview`.
- Procedimiento detallado: [Despliegue Cloudflare](DESPLIEGUE_CLOUDFLARE.md). La producción v0.1.1 se mantiene inalterada.

### Despliegue Preview corregido (17-11-2026, 16:04 UTC)

- Evidencia: log de Cloudflare Workers Builds aportado por el propietario; `Build command` efectivo `cd web && npm ci --no-audit --no-fund && npm run build`.
- Resultado: `tsc --noEmit && vite build` correcto, 34 módulos transformados, salida en `web/dist`; `npx wrangler preview` completado con **Success: Deploy command completed** y **Success! Build completed**.
- Preview de `develop` publicado: https://develop-martes-fc.ali-tio.workers.dev ; despliegue específico: https://3d1baac6-martes-fc.ali-tio.workers.dev .
- Se cierra **el bloqueo de compilación ENOENT**, no la aceptación E2E. El log no contiene un GET HTTP del endpoint ni validación de lectura D1; **RF-020 y RF-030 siguen pendientes de comprobar API y conexión a la base PREVIEW**.
- Próximo ensayo externo sin credenciales: `curl -i https://develop-martes-fc.ali-tio.workers.dev/api/health` y `curl -i https://develop-martes-fc.ali-tio.workers.dev/api/public/snapshot`. Esperado 200; `health.configured=true`; `snapshot.source=d1`, temporada 2026 y arrays de jugadores/partidos vacíos inicialmente. No cargar nombres reales sin autorización.
- Trabajos adicionales: Cloudflare Access y escrituras autorizadas, backups, migración de producción y release; `master` continúa en v0.1.1.

### Prueba remota de API y D1 Preview completada (17-11-2026, 16:30 UTC)

- Evidencia directa: transcripción aportada por el propietario desde Codespaces (rama `develop`); **no contiene secretos ni nombres personales**.
- `GET https://develop-martes-fc.ali-tio.workers.dev/api/health` → `HTTP/2 200`, JSON `{"ok":true,"configured":true}`.
- `GET https://develop-martes-fc.ali-tio.workers.dev/api/public/snapshot` → `HTTP/2 200`, `version=2`, `source=d1`, temporada `season-2026` activa, `players=[]`, `matches=[]`. Esto prueba la conexión real del Worker de Preview a una D1 migrada y funcional.
- La evidencia se corresponde con `martes-fc-preview` por la configuración versionada `previews.d1_databases` y la migración remota previa; las respuestas no exponen el UUID (separación demostrada por configuración, no por un endpoint interno).
- **No declarar aún publicada v0.2.0:** falta Cloudflare Access `/api/admin/*`, comprobaciones de escrituras y consulta desde dos navegadores, pruebas de privacidad, backups y migración exclusiva de producción.

### Instrumentación segura de Access Preview (17-11-2026)

- El propietario configuró variables en **Previews Base** y **develop**, pero `GET /api/admin/session` sigue devolviendo 401 después del login de Access.
- Se incorpora en la feature `diagnose-access-preview-401` un código de denegación en Workers Observability que **no contiene secretos, emails, tokens ni claims JWT**. No cambia el contrato HTTP ni relaja la validación.
- Se habilita observabilidad **solo en Preview**, sin cambiar la infraestructura de producción.
- Criterio de aceptación: obtener el código de motivo real tras redeploy `develop`; corregir la causa precisa; comprobar `session.ok=true`; comprobar rechazo en incógnito y POST no autorizado; probar alta real únicamente en D1 Preview.
- Estado RF-029: **validación automática en CI correcta; autenticación remota 401 pendiente de diagnóstico**.
