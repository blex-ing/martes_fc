# MARTES FC — Requisitos funcionales y no funcionales

> **Versión:** borrador público 0.1 · **Fecha:** 17-11-2026. Datos de demostración completamente ficticios. El código se publicará en GitHub; los registros reales se almacenarán fuera del repositorio y solo se publicarán los datos expresamente destinados a estadísticas públicas.

## Visión

Dashboard de estadísticas para un equipo amateur con estética Liquid Glass, paleta azul oscuro/cian/magenta/violeta, adaptable a móvil y PC. La web permite consultar resultados de partidos, goleadores y métricas de portería; más adelante tendrá administración protegida con origen de datos compartido.

## Actores

- **Visitante público**: consulta estadísticas, fichas y resultados publicados sin cuenta.
- **Administrador**: crea/edita encuentros, portería y jugadores tras autenticación (futuro).
- **Jugador**: consulta su ficha; los identificadores internos y contactos nunca se muestran.

## Funcionalidades

| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-001 | Resumen de partidos, victorias, empates, derrotas, GF/GC | P0 | Demo |
| RF-002 | Listado y detalle de partidos por fecha, rival y marcador | P0 | Demo |
| RF-003 | Goles individuales por partido y ranking de goleadores | P0 | Demo |
| RF-004 | Ficha pública de jugador con goles y partidos | P0 | Demo |
| RF-005 | Ficha de portería con paradas, encajados y efectividad | P0 | Demo |
| RF-006 | Validar entradas: suma goleadores = goles del equipo | P0 | Demo |
| RF-007 | Guardado local, exportación y restauración de demo | P0 | Demo |
| RF-008 | Datos ficticios indicados claramente | P0 | Demo |
| RF-009 | Edición/borrado seguro de partidos y jugadores | P1 | Futuro |
| RF-010 | Gestión de temporadas | P1 | Futuro |
| RF-011 | Lectura pública de datos publicados desde API | P1 | Futuro |
| RF-012 | Escritura administrada con autenticación y auditoría | P1 | Futuro |
| RF-013 | Fotos y nombres reales con autorización de publicación | P2 | Futuro |
| RF-014 | Estadísticas por periodos y enlaces individuales | P2 | Futuro |

## Fórmulas y reglas

- Solo partidos con `status = finished` computan.
- Equipo: `PJ`, `PG`, `PE`, `PP`, `GF`, `GC`, `DG = GF - GC`.
- Jugador: partidos en que figura como participante, suma de goles por encuentro, goles/partido.
- Portero: paradas, goles encajados cuando juega como portero, porterías a cero y porcentaje `paradas/(paradas+encajados)*100`, cuando el denominador > 0.
- Supuesto MVP: portero único, partido completo. Cuando haya sustituciones, registrar paradas/encajados por portero y minutos, sin asignación global errónea.
- Un goleador debe participar en el partido; goles y paradas son enteros >= 0; `sum(goalsByPlayer) = goalsFor`.

## No funcionales

| ID | Requisito | Objetivo |
|---|---|---|
| RNF-001 | Responsive | Sin desplazamiento horizontal a 320/375/390/430 px |
| RNF-002 | Accesibilidad | WCAG 2.2 AA como objetivo; foco visible, navegación teclado |
| RNF-003 | Rendimiento | Lighthouse móvil >= 90 como objetivo futuro medible |
| RNF-004 | Seguridad | Solo escritura autenticada y validada por servidor; mínimo privilegio |
| RNF-005 | Privacidad | Sin secretos, contactos ni registros reales en el repositorio |
| RNF-006 | Mantenibilidad | Dominio puro, UI modular, servicios desacoplados, TypeScript estricto objetivo |
| RNF-007 | Calidad | Tests de fórmulas, PR/CI, QA visual móvil, releases versionadas |
| RNF-008 | Compatibilidad | Chrome Android, Safari iOS, navegadores actuales |
| RNF-009 | Transparencia | Diferenciar datos ficticios, pendientes y reales publicados |
| RNF-010 | Backup y rollback | Estrategia documentada al adoptar backend |

## Modelo de datos de referencia (producto real)

```text
Team(id, slug, publicName)
Season(id, teamId, label, startDate, endDate, active)
Player(id, teamId, publicAlias, role, number, imageUrl?, active)
Match(id, seasonId, date, opponent, goalsFor, goalsAgainst, status)
Appearance(matchId, playerId, rolePlayed, minutes?)
Goal(matchId, playerId, count)
GoalkeeperStat(matchId, playerId, saves, goalsConceded, minutes?)
AdminUser(id, identityProviderSubject, role)
AuditEvent(id, actor, action, entityId, timestamp)
```

## Etapas y criterios de aceptación

1. **v0.1 demo**: navegación funcional, actualización KPIs tras registrar partido ficticio, tests y base de CI.
2. **Migración modular**: React+TypeScript+Vite, mismo comportamiento de dominio y UI, tests ampliados.
3. **Datos públicos reales**: consentimiento de visualización cuando sea necesario, base separada, API GET pública y escritura protegida; administración con credenciales seguras.
4. **Releases**: `feature/* → develop → release/vX.Y.Z → master`, CI obligatorio, preview, GitHub Release y rollback.

Para las decisiones de arquitectura: [`documentacion/ARQUITECTURA_Y_MANTENIMIENTO.md`](documentacion/ARQUITECTURA_Y_MANTENIMIENTO.md), [`documentacion/PRIVACIDAD_Y_DATOS.md`](documentacion/PRIVACIDAD_Y_DATOS.md) y [`documentacion/FLUJO_GIT_Y_RELEASES.md`](documentacion/FLUJO_GIT_Y_RELEASES.md).
