# Arquitectura y mantenimiento — MARTES FC

## Implementación actual
La aplicación usa React + TypeScript estricto + Vite y conserva el CSS Liquid Glass del prototipo.
- web/src/App.tsx: navegación, filtros, formularios, vistas y modales accesibles.
- web/src/domain/stats.ts: tipos, validación de resultados y cálculos, sin DOM ni red.
- web/src/data/demo.ts: plantilla de futbolistas y partidos ficticios.
- web/src/data/storage.ts: persistencia local validada y exportación de datos.
- web/tests/stats.test.ts: pruebas del dominio con Node 24.
- web/tests/visual/visual.spec.ts: pruebas reales de interfaz con Playwright en Chromium.
- .github/workflows/ci.yml: typecheck, lint, pruebas, build, revisión preventiva, auditoría y QA visual.

## Mantenimiento
Toda modificación empieza en feature/* desde develop. Exigir pruebas para métricas y QA visual para cambios de interfaz.
Dependabot propone PR semanales, sin fusionar automáticamente.
CI usa acciones oficiales fijadas por SHA y permisos mínimos.
Release/vX.Y.Z pasa por PR a master y genera tag y GitHub Release. Sincronizar después master a develop.

## Límite de seguridad y siguiente etapa
No existe backend, autenticación, sincronización multiusuario ni administración remota.
El código está publicado, pero no contiene contactos, teléfonos ni resultados reales.
Una futura API ofrecerá lectura pública solo de estadísticas publicadas y escritura autenticada.
Mantener los datos internos en almacenamiento privado del servidor y no exponer claves al frontend.
