# Arquitectura y mantenimiento — MARTES FC

## 1. Objetivo

Sitio público de métricas deportivas en móvil y escritorio, rápido y accesible, con una única fuente de verdad para partidos, goles y paradas. Las fórmulas no deben dispersarse entre componentes UI. El equipo podrá ampliar el producto a temporadas, fichas compartibles, administración y fotos con autorización.

## 2. Estado implementado (v0.1.0)

- Prototipo estático en `web/index.html`, `web/app.js`, `web/styles.css`.
- Extracción de reglas de dominio comprobables en `web/src/domain/stats.mjs`.
- Datos ficticios, guardados por navegador. No existe API ni multiusuario.
- `npm run check`, `npm test`, `npm run build`; build sin dependencias y auditable.
- CI inicial, Dependabot, release y limpieza de ramas versionados.
- Configuración base de Cloudflare Workers Static Assets, sin despliegue real confirmado.

**No se afirma que la versión actual sea React/TypeScript**. La migración debe hacerse en una feature con tests y validación de equivalencia visual y funcional.

## 3. Arquitectura destino (fase siguiente: React, TypeScript estricto y Vite)

```text
web/
  index.html
  public/                # favicon/escudo público con autorización
  src/
    app/                 # composición, rutas, errores, configuración
    domain/
      player.ts          # contratos y tipos
      match.ts
      metrics.ts         # fórmulas de goles, paradas, puntos
      validation.ts      # validación de datos importados/servidor
    features/
      dashboard/          # resumen, KPIs y gráficos
      matches/            # listado, detalle y formularios
      players/            # lista y fichas personales
      goalkeeper/         # estadísticas de portería
      seasons/            # evolución posterior
    components/
      ui/                 # GlassSurface, Card, Metric, Button, Modal
      layout/             # sidebar, bottom navigation
    repositories/
      StatsRepository.ts # contrato independiente del transporte
      demoRepository.ts  # datos ficticios
      httpRepository.ts  # futuro backend (solo lecturas públicas)
    styles/
      tokens.css
      glass.css
      responsive.css
    tests/
  package.json
  package-lock.json
  tsconfig.json
  vite.config.ts
worker/                   # futura API autenticada; solo cuando haga falta
.github/workflows/
documentacion/
wrangler.jsonc
```

La división modular no implica crear directorios vacíos: se construirán cuando aparezca la primera funcionalidad de cada área. Preservar la lógica de estadísticas al migrar, ejecutando primero tests equivalentes.

## 4. Reglas del dominio

- Partido finalizado válido: goles positivos/cero enteros, goleadores participantes, `suma(goles individuales) === goles del equipo`.
- Equipo: PJ/PG/PE/PP/GF/GC/DG desde partidos finalizados.
- Jugador: partidos que disputó y goles anotados; fichas con alias público independiente del identificador.
- Portero: paradas y encajados asignados a los encuentros en que participó como portero; `paradas / (paradas + encajados) × 100` solo bajo supuesto de portero único a tiempo completo.
- Cuando existan sustituciones, registrar minutos, encajados y paradas de cada portero por separado; no repartir goles de un partido automáticamente entre porteros.
- No usar métricas editables manualmente como segunda fuente de verdad.

## 5. Diseño

- Liquid Glass aplicado a navegación, KPIs y ventanas relevantes; superficies secundarias ligeras para evitar demasiados filtros de desenfoque.
- Tokens de diseño centralizados y consistentes: fondo azul muy oscuro, acentos cian/violeta/magenta.
- Adaptación a 320/375/390/430 px; interacción táctil adecuada; escritorio.
- Respetar `prefers-reduced-motion`, accesibilidad por teclado y contraste WCAG 2.2 AA como objetivo.
- Evitar librerías pesadas para métricas simples; medir antes de añadir efectos o gráficos.

## 6. Capa de datos y seguridad futura

```text
Visitante → Cloudflare Worker Static Assets → React SPA
                     |
                     | GET /api/public/... (datos publicados)
                     v
                API de lectura
                     |
                     v
               Base de datos
                     ^
                     | POST/PATCH/DELETE autenticados
Administrador → proveedor de identidad → API con control de roles
```

- La **base de datos y las credenciales** permanecen fuera del repositorio público.
- Datos `published` pueden ser leídos por cualquiera, con API pública de solo lectura y caché según el caso.
- Datos `draft`, información de contacto, pagos, logs personales y auditoría solo por servidores y usuarios autorizados.
- **Datos publicados no se vuelven privados por estar en una base de datos privada**: si aparecen en el dashboard o llegan por la API, son públicos.
- Separar entidades `public_player_name` y datos internos si estos se necesitara almacenar más adelante.
- No colocar contraseñas, claves de servicio, autorización de admin ni reglas de privilegios solo en JavaScript cliente.
- Validar altas en el backend, limitar tasa, prevenir escrituras no autorizadas, y registrar acciones sensibles.

## 7. Repositorios y entrega

- Un repositorio público para código e infraestructura no secreta.
- No hace falta repositorio Git distinto para la BD: los datos viven en un servicio privado y versionamos solo migraciones o esquema sin registros personales.
- Al conectar una base, activar backups, migraciones reversibles, diferenciación entorno preview vs producción y rollback.
- `Cloudflare Preview` no debe usar datos sensibles de producción; fixtures ficticios o staging segregado.

## 8. Plan evolutivo por features

1. `feature/migrate-react-typescript-vite`: migrar UI, mantener responsive y cálculos, tests, actualizar lockfile; PR a `develop`.
2. `feature/player-profiles-and-seasons`: rutas públicas individuales y filtros por temporada, fixtures.
3. `feature/persistent-data-api`: esquema de base, endpoints GET públicos, autenticación para escritura y pruebas de seguridad.
4. `feature/admin-match-editor`: panel protegido para gestionar partidos y paradas, auditoría y estados.
5. `release/v0.2.0`: QA completo, notas y PR a `master` al estar listo; no asumir automáticamente que se ha publicado.

## 9. Mantenimiento y calidad

- Por cada feature: especificar comportamiento, tests (dominio y UI), testear con móvil, contrastar capturas y desplegar preview.
- CI bloquea errores en sintaxis, dominio, secretos evidentes y build. En migración se añadirán `tsc`, ESLint, Vitest y Playwright visual.
- `npm audit --audit-level=high` se añadirá cuando haya dependencias externas (actualmente la app no tiene paquetes npm ajenos).
- Revisión semanal de Dependabot (sin automerge), análisis de alertas y dependencias abandonadas.
- Changelog para cambios de cara a usuario y notas específicas por release; rollback mediante publicación de un commit estable anterior o restauración de despliegue versionado.
