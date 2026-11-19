# Rendimiento de snapshot e histórico — issue #36

## Qué se encontró

El Worker ya limitaba tanto la consulta de partidos publicados como la de participantes al **mismo conjunto de los 2.000 partidos más recientes** (fecha e ID descendentes). Una auditoría de la issue no justifica reemplazar esa consulta SQL: su subconsulta aprovecha el índice del esquema actual y evita devolver participantes ajenos a la página histórica.

El frontend ya calculaba `ranking` mediante `metricsByPlayer` una vez por cambio de plantilla/histórico, pero al abrir una ficha o visitar Portería se volvía a ejecutar `playerMetrics` sobre todo el histórico. La vista Partidos repetía búsquedas lineales de jugadores y filtros.

## Cambio aplicado

- `App.tsx` pasa los resultados de `ranking` a `PlayerProfile`; esa ficha solo filtra su historial cuando cambian jugador o lista ordenada.
- `GoalkeeperView` reutiliza la misma métrica de `ranking` y memoriza el histórico del portero.
- `MatchesView` memoriza la lista filtrada y usa un mapa de nombres. No cambia el HTML ni el estilo.
- **Sin migraciones SQL**, cambios de API pública, D1 producción ni nuevo almacenamiento.

## Benchmark y regresión reproducible

1. `cd web && npm run bench:stats` compara `playerMetrics` por jugador contra el índice común y la reapertura de una ficha con métrica ya calculada. Emite JSON con tiempos en milisegundos y microsegundos. Son mediciones sintéticas, no tiempos de producción.
2. `cd web && python3 scripts/check-snapshot-bounds.py` ejecuta **el SQL real extraído de `worker/index.ts`** contra el esquema SQLite versionado, con 0, 1, 2.000 y 2.350 partidos públicos y 13 registros privados más recientes. Verifica cardinalidad, orden por fecha/ID, que nunca se consulten participantes privados, siete participantes por partido y sumas de goles. Publica medianas de cinco consultas y volumen de filas SQL serializadas (no tamaño HTTP real).
3. `npm test` incluye equivalencia de `ranking`, `metricsByPlayer` y `playerMetrics` para 0, 1, 2.000 y 2.105 encuentros. El pipeline sigue ejecutando pruebas UI Chromium/WebKit, seguridad, build y Cloudflare.

## Alternativas SQL descartadas tras medir

En SQLite local con datos sintéticos y 8 participantes por partido, sustituir el `IN (SELECT ... LIMIT 2000)` actual por un `JOIN` o una CTE no mostró una mejora consistente. Por ejemplo, para 2.000 partidos (16.000 apariciones), se observaron medianas aproximadas de **10,18 ms** para la consulta vigente, **11,00 ms** con JOIN y **12,13 ms** con CTE. Son valores indicativos de una sola máquina, no resultados de Cloudflare D1. La decisión es **conservar el SQL probado**, sin optimizaciones especulativas.

## Límites explícitos

- El snapshot v2 **mantiene el tope de 2.000 partidos**; no expone páginas adicionales. Introducir paginación o filtro servidor para históricos superiores exige una decisión funcional y contrato nuevo, no un cambio oculto de este release.
- No se afirma mejora cuantitativa de red o latencia D1 real sin medición remota; las mejoras verificadas son menos cálculos redundantes en interfaz, pruebas de integridad y métricas locales reproducibles.
- Ninguna operación de este trabajo consulta o modifica la base de datos remota de producción o preview.
