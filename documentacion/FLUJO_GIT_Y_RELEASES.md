# Desarrollo, QA y publicación — MARTES FC

Proceso adaptado del repositorio real blex-ing/mini_podcast.

## Ramas
- master: versión estable y rama principal.
- develop: rama de integración protegida.
- feature/* y fix/*: salen de develop; PR obligatorio a develop.
- release/vX.Y.Z: sale de develop, estabilización y notas, PR obligatorio a master.
- main: rama histórica del bootstrap; no usar. Eliminar solo tras confirmar que no se necesita.

## Flujo
1. En feature/* y fix/*: npm ci; npm run typecheck; npm run lint; npm test; npm run build; npm run test:visual.
2. PR hacia develop: comprobar diff, CI verde y QA en móvil/escritorio; fusionar solo tras validación.
3. Crear release/vX.Y.Z desde develop; congelar funciones y versionar notas de release.
4. PR release/vX.Y.Z hacia master. GitHub Actions, después de fusionar, crea tag y Release si master coincide exactamente con el commit fusionado.
5. Sincronizar master con develop mediante PR. El workflow de limpieza elimina feature/* y fix/* únicamente tras un PR fusionado hacia develop, y release/* tras un PR fusionado hacia master, siempre que el SHA remoto coincida con el SHA original fusionado. No se eliminan ramas avanzadas, PR cerrados sin fusionar ni ramas permanentes.
6. Cloudflare se conectará después; previews por ramas, producción desde master.

## Seguridad y protecciones
- GitHub Free admite protección de ramas en repositorios públicos. Establecer reglas de master y develop en Settings → Branches.
- Exigir PR y checks 'TypeScript, lint, domain tests and build' y 'Visual QA (Chromium)' cuando hayan completado con éxito.
- No forzar push, ni borrar ramas permanentes, ni fusionar con CI roja.
- CI con permiso contents: read; write solo donde necesitan tags y limpieza.
- GitHub Actions oficiales fijadas por commit SHA y Dependabot semanal con revisión.
- Mantener datos de personas, claves y capturas privadas fuera de Git y del bundle frontend.
