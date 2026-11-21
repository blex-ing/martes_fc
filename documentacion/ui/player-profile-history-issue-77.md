# MARTES FC — Especificación UX/UI: ficha del jugador e historial (issue #77)

Estado: **diseño aprobado por el usuario, implementación en revisión**. Esta especificación prevalece frente a las soluciones parciales anteriores de la issue #77.

## Problema observado
En la captura aportada, el título «Historial de partidos» está pegado a las estadísticas y las tarjetas de historial se comprimen y cambian de aspecto. La solución anterior mezclaba el área desplazable con el grid de filas, sin panel visual independiente.

## Objetivo visual aprobado
Referencia: maqueta validada en la conversación del 21/11/2026 (ficha de Ander, tema oscuro Liquid Glass, panel de historial delimitado y barra de desplazamiento visible). La maqueta es referencia de jerarquía y comportamiento, no una instrucción de sustituir globalmente colores ni elementos de la app.

- Zona inmóvil: título «Ficha del jugador», cerrar, avatar, nombre, rol, tarjetas de estadísticas y título «Historial de partidos», incluida la metodología si es portero.
- Sección de historial con separación superior perceptible, título alineado con acento cian, margen inferior y un panel Glass delimitado.
- Solo el interior del panel de historial puede desplazarse. El panel mantiene un alto natural cuando hay pocos partidos y se contrae cuando hay muchos.
- Cada encuentro conserva su alto natural, padding, borde, información de rival/fecha, goles/paradas y estado. No se permite repartir la altura disponible a partes iguales ni comprimir filas.
- Scrollbar discreta visible cuando haya overflow, sin abrir scroll horizontal. Sutil textura y profundidad (no parallax real ni efectos que alteren la lectura).
- Responsive desde 320px y en alturas cortas. Accesible por teclado y con etiqueta de región ligada al título.

## Arquitectura y decisiones
- `PlayerProfile` conserva cálculo de historial y contenido; no mueve lógica a `App`.
- `.profile-history-scroll` es exclusivamente viewport con `overflow-y:auto`, `min-height:0`, `overscroll-behavior:contain` y `tabIndex=0`.
- `.profile-history-list` es grid interno con `grid-auto-rows:max-content` y espaciado entre filas. Se evita aplicar reglas globales a `.match-row`.
- El título es un `h3` fuera del contenedor scrollable, asociado con `aria-labelledby`.
- Todos los nuevos selectores CSS están acotados a `.profile-modal`. Se reutilizan tokens, tipografías y superficies existentes.

## Casos de aceptación
1. Cero o un partido: panel compacto; no se genera un área vacía artificial.
2. Cinco partidos: filas legibles y sin solaparse.
3. Veinte/cincuenta partidos: scroll únicamente en `.profile-history-scroll`, último elemento alcanzable.
4. Antes y después del scroll: geometría del nombre, estadísticas, metodología, título y botón cerrar sin cambio.
5. En móvil (320, 390), tablet (768) y desktop (1440), Chromium y WebKit: sin overflow horizontal, filas comprimidas o cierre inaccesible.
6. La vista de partidos y otros modales mantienen sus dimensiones y colores anteriores; no se modifica API, D1 ni autenticación.

## Plan de QA/release
- Ejecutar `npm ci`, lint, TypeScript, tests y Playwright con capturas comparadas.
- Revisar preview de Cloudflare en SHA concreto y comprobar con navegador real al menos móvil y desktop.
- No publicar una versión ni dar por resuelta #77 sin estas verificaciones; coordinar el cambio con la PR de release #85 todavía pendiente.

## Vista previa de aceptación con datos ficticios (solo rama feature)
Para comprobar el scroll sin depender de la base Cloudflare D1:
1. Abrir la URL **real** del preview de Cloudflare de `feature/issue-77-history-panel-ux`.
2. Añadir `?previewHistory=1` al final (o `&previewHistory=1` si ya hay parámetros).
3. Se abre la ficha de **Ander (DEMO)** con **30 partidos ficticios**. Hacer scroll dentro del panel; confirmar que nombre, estadísticas y título no se mueven.
4. Cerrar la ficha para volver a ver el comportamiento normal y las estadísticas originales de la app.
5. Para regresar a la demo, recargar esa misma URL con el parámetro.

**Aislamiento:** estos partidos se generan en memoria desde `web/src/data/profile-preview.ts`; no se guardan en `localStorage`, no llaman a mutaciones de D1 y no alteran el resto de las estadísticas. Si D1 falla, las demás vistas mantienen su estado de no disponible. El rótulo «30 partidos ficticios» evita confundirlos con históricos reales.

**Entrega:** el mecanismo y su fixture son temporales para revisión visual de PR #86. Antes de fusionar hacia release/`master`, eliminar el preview por URL y el fixture (mantener los tests automatizados sin rutas de demo públicas), o justificar expresamente una solución de preview restringida al entorno de pruebas.

## Segunda iteración de fidelidad visual (21/11/2026)
Tras aceptar el funcionamiento del scroll, se completó el diseño hacia la maqueta de referencia:
- Tres tarjetas de estadísticas con iconos **SVG propios** (camiseta, balón, gráfico vertical), generados como SVG inline en el componente reutilizable `ProfileGlyph.tsx`. No emplean icon-font, CDN, imágenes raster ni paquetes adicionales.
- Escudo SVG vectorial con degradado cian/violeta e inicial del rival, reutilizado por cada fila.
- Espaciados y contornos Glass coherentes, badge de rol, tarjetas con borde iluminado sutil y estados de partido diferenciados cromáticamente.
- Reglas responsive acotadas al modal, incluido modo compacto a 420px y alturas cortas; la cabecera y el título siguen fuera del scroll.
- Comprobación Playwright adicional del número de iconos SVG y escudos por encuentro.

No se ha alterado el modelo de datos, API, Worker, Cloudflare D1 ni el comportamiento de otros listados. El preview temporal `?previewHistory=1` continúa disponible en la rama feature para validar manualmente estos cambios; **no publicarlo en master**. CI y revisión visual real siguen siendo condiciones de aceptación.
