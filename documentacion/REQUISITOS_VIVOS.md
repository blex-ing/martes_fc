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
| ID | Capacidad / aceptación verificable | Prioridad | Estado inicial | Prueba objetivo |
|---|---|---|---|---|
| RF-020 | VIS obtiene jugadores y partidos publicados con un único GET, compartidos entre navegadores | P0 | Aprobado | API: 200, contrato JSON, solo campos públicos |
| RF-021 | Persistir jugadores con ID, alias público, rol (Portero/Jugador), colores de avatar y estado activo | P0 | Aprobado | SQL constraints, endpoint |
| RF-022 | Persistir partidos con fecha, rival, GF, GC, portero, paradas y temporada | P0 | Aprobado | API + SQL |
| RF-023 | Persistir participación por partido y goles individuales; suma goles = GF | P0 | Aprobado | Test de dominio y rechazo 400 |
| RF-024 | Calcular KPIs, ranking, fichas y portería sin guardar agregados duplicados | P0 | Aprobado | Tests de cálculo existentes |
| RF-025 | Mantener la demo usable si no hay D1, sin presentar demo como dato real | P0 | Aprobado | Test web y estado de origen |
| RF-026 | ADM crea partidos en servidor; no permite modificar desde interfaz anónima | P0 | Aprobado | API: 401/403 sin Access verificado |
| RF-027 | ADM edita y elimina partidos, actualiza plantilla; operaciones con trazabilidad | P1 | Aprobado | API + auditoría |
| RF-028 | Gestionar temporadas desde D1 (una activa inicialmente); consultar por temporada en futuro | P1 | Aprobado | SQL FK y lectura |
| RF-029 | ADM solo accede mediante JWT Cloudflare Access validado (firma, issuer, audience y correo autorizado) | P0 | Aprobado | Tests negativos auth |
| RF-030 | Separar D1 de producción y D1 de preview; nunca se reutiliza la D1 de producción en CI/preview | P0 | Aprobado | Config y revisión |
| RF-031 | Un administrador puede exportar datos públicos en JSON y el mantenimiento dispone de procedimiento de backup | P1 | Aprobado | Pruebas export y runbook |
| RF-032 | Nada de resultados reales ni nombres reales en las migraciones/fixtures públicas sin consentimiento previo | P0 | Aprobado | check:public y revisión |
| RF-033 | Mostrar fuente y estado de sincronización sin confundir datos demo, remotos o caídos | P0 | Aprobado | QA móvil/desktop |
| RF-034 | ADM puede desactivar jugadores sin borrar su histórico de partidos | P1 | Aprobado | SQL + UI |
| RF-035 | VIS recibe respuestas cacheables brevemente; cambios ADM invalidan mediante cache corto y revalidación | P1 | Aprobado | Control Cache-Control |

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
| v0.2.0 | RF-020 a RF-035 y RNF-020 a RNF-030 | `feature/d1-shared-stats-v020` (en desarrollo) | Pendiente | Requiere D1 y Access reales |

## Referencias
- [Propuesta de versión](PROPUESTA_V0.2.0.md)
- [Modelo y contrato](MODELO_Y_API_D1.md)
- [Operación y configuración](OPERACION_D1_ACCESS.md)
- [Requisitos iniciales](../REQUISITOS.md)
