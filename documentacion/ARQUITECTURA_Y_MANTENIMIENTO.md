# Arquitectura y mantenimiento — MARTES FC

## Stack vigente

- Web: React 19 y TypeScript estricto, compilada con **esbuild** y servida como Static Assets de Cloudflare Workers.
- Backend: `worker/index.ts` expone `/api/public/*` y `/api/admin/*`; utiliza D1 y validación de Cloudflare Access para las mutaciones.
- Datos: dos bases independientes, `martes-fc-prod` y `martes-fc-preview`. No copiar registros automáticamente entre ellas.
- Diseño: Glass híbrido web con tokens y primitivas compartidas; conservar fondos, reflejos, tipografía y KPI existentes.

## Módulos

- `web/src/App.tsx`: navegación, selección de temporada, sesión y orquestación del estado.
- `web/src/views/`: cinco vistas independientes.
- `web/src/components/`: componentes de presentación, ficha de jugador y formularios.
- `web/src/domain/stats.ts`: reglas puras de estadísticas y validaciones.
- `web/src/data/api.ts`: API D1, errores tipados y operaciones de administración.
- `web/src/data/demo.ts` y `storage.ts`: datos de demostración, separados de los datos remotos.
- `worker/index.ts`: autorización, transacciones D1 y auditoría de cambios.
- `migrations/`: esquema SQL versionado.

## Reglas de calidad

1. Partir de `develop` con ramas `feature/*` o `fix/*`; un propósito por PR.
2. Superar TypeScript, lint, pruebas web/Worker, SQL, build, análisis de dependencias y Visual QA.
3. Revisar los flujos táctiles de móvil; una simulación WebKit no sustituye pruebas con un iPhone físico.
4. Reutilizar el sistema visual existente; no reconstruir Glass ni modificar la iluminación de los paneles.
5. Publicar mediante `release/vX.Y.Z` y PR hacia `master`. Verificar tag y SHA; sincronizar `develop` después.
6. Dependabot propone actualizaciones; exigir revisión y QA antes de fusionarlas.

## Seguridad y privacidad

Nunca incluir secretos Cloudflare, claves, JWT, copias D1, información bancaria o datos privados en frontend, repositorio o logs. Configurar credenciales en Cloudflare Runtime Secrets; validar JWT y permisos también en servidor. El modo demo **no sustituye** una caída de la base remota. Separar DB preview/producción y respaldar antes de migraciones reales.

## Mantenimiento histórico

Las ramas históricas deben compararse antes de borrarlas. La limpieza automática de ramas `feature/*`, `fix/*` y `release/*` solo actúa tras merges compatibles y exige el SHA original. Ninguna rama con commits nuevos se elimina por automatización retrospectiva.
