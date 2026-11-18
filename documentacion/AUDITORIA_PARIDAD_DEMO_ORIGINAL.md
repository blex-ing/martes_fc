# Auditoría de paridad con MARTES_FC_DEMO.html

## Referencia

Documento HTML original proporcionado por el propietario. La demo es una especificación visual y funcional, no una fuente de datos reales que deban importarse automáticamente a Cloudflare D1.

## Comparativa de las cinco ventanas

| Vista | Demo HTML original | Develop antes de esta feature | Tratamiento |
| --- | --- | --- | --- |
| Resumen | Hero, cuatro KPI, ranking, últimos partidos, muro y balance | Conserva la estructura general | Mantener visual aprobado y D1 |
| Partidos | Filtros, lista, detalle con fecha/resultado/score grande, goleadores y participantes | Faltaban participantes y marcador editorial original | Recuperar detalle y mantener edición admin |
| Jugadores | Tarjetas compactas, subtítulo de rol, KPI paradas para portero y goles para jugadores; historial completo y tres estadísticas en ficha | Tarjetas y fichas reestructuradas, historial recortado y ficha sin tercer KPI para jugadores de campo | Recuperar estructura, historial y especialización |
| Portería | Cabecera con escudo y badge; KPI paradas, concedidos, efectividad, partidos; doble panel de evolución y eficacia; fórmula explicada | Cabecera avatar+donut, KPI diferente, panel único y nota eliminada | Restauración fiel de composición y textos con datos D1 |
| Datos y privacidad | Exportación/restauración de demo local | Añade administración protegida, D1 y autenticación | Conservar mejoras; no restaurar controles inseguros en producción |

## Reglas de conservación

- La demo define jerarquía y componentes; no fija identidades personales ni datos ficticios para Producción.
- `develop`/D1 preserva identificadores reales, ACL de administrador, transacciones y actualización de estadísticas.
- No se crean migraciones SQL ni se transfieren contenidos entre bases.
- Liquid Glass híbrido solo mejora el material sin introducir tamaños o paletas nuevos.
- Ante ausencia de portero, mostrar estado vacío explícito y nunca sustituir por datos demo.
- Métrica estimada de efectividad: `saves / (saves + conceded) × 100`, igual que la demo; la nota de limitación debe permanecer.
- Pruebas Chromium y CI deben cubrir escritorio y móvil, jerarquía de Portería, información del partido, y ficha de jugador.

## Fuente inspectada

El HTML original incluye la función `keeperView()` con dos paneles (paradas/efectividad), `detailPanel()` con participantes, `playersView()` con tarjetas compactas y `profileModal()` con historial completo. Se trasladan esos criterios a componentes React, no se incrusta el JavaScript de la demo.
