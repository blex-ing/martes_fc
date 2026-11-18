# Sistema de diseño — MARTES FC

**Versión visual:** 1.0.0. Contrato obligatorio para nuevas features.
**Referencia de gobernanza:** documentacion/DESIGN_SYSTEM_MINI_PODCAST.md del repositorio blex-ing/mini_podcast.
**Referencia de inspiración iOS:** skill oficial de OpenAI swiftui-liquid-glass: https://github.com/openai/plugins/blob/main/plugins/build-ios-apps/skills/swiftui-liquid-glass/SKILL.md

## 1. Fuente de verdad
- web/src/styles/tokens.css: única fuente de nuevos valores cromáticos; mantiene la identidad actual tinta/cian/violeta/rosa. Incluye tokens de espaciado, radios, tipografías, sombras y movimiento.
- web/src/styles/primitives.css: materiales y controles compartidos y los fallbacks de accesibilidad.
- web/styles.css: estilos históricos de layouts y componentes. Sus colores preexistentes quedan congelados y se migrarán gradualmente.
- web/scripts/check-design-system.mjs: quality gate obligatorio; bloquea literales nuevos fuera de tokens, comprueba materiales y accesibilidad.
- web/scripts/design-legacy-colors.json: presupuesto exacto por literal de los dos archivos heredados (web/styles.css y web/src/App.tsx); no aumentarlo.

## 2. Jerarquía
| Nivel | Clase | Uso |
| --- | --- | --- |
| Navegación | ui-glass-nav ui-hybrid-glass | Sidebar y navegación móvil |
| Panel principal | ui-glass-primary | Paneles, detalle, modal y hero |
| Tarjeta de KPI | ui-glass-card | Métricas hermanas equivalentes |
| Superficie secundaria | ui-soft-surface | Filas y contenido interno sin otro blur |
| Acción principal | ui-button ui-button-primary o primary-btn ui-hybrid-control | Una CTA dominante por sección |
| Acción secundaria | ui-button ui-button-secondary / outline-btn | Editar, cancelar, alternativas |
| Etiqueta | ui-chip | Estado con texto legible, no solo color |

**Regla:** no anidar superficies con backdrop-filter y sombra completa. Todas las tarjetas hermanas comparten material, forma e interacción; los colores neon son acentos y no convierten controles secundarios en CTA.

## 3. Paleta y reglas de semántica
- --color-background: fondo nocturno; --color-surface y --color-surface-solid: superficies.
- --color-text y --color-text-muted: información principal y secundaria.
- --color-primary: cian de acciones y focus; --color-secondary: violeta; --color-accent: rosa.
- --color-success, --color-error y --color-warning: estados funcionales y no decoración.
- Escalas --space-1 a --space-12 y --radius-control/card/panel/shell/pill.
- Tipografías existentes --font y --display; nuevas fuentes requieren aprobación de design system.

## 4. Glass inspirado en iPhone, no nativo
La skill swiftui-liquid-glass de OpenAI se refiere a APIs nativas de SwiftUI en iOS 26+ (glassEffect y GlassEffectContainer). MARTES FC es React + CSS: aquí se implementa una **aproximación web** que conserva la intención de superficies agrupadas, formas consistentes y acentos moderados. No se afirma equivalencia óptica con el material nativo.

- Navegación: reflejo estático y blur limitado a desktop con puntero fino.
- Móvil/touch: sin blur adicional, para proteger batería y fluidez.
- No seguimiento continuo de puntero, ni morphing costoso para simples formularios.
- prefers-reduced-transparency proporciona superficie opaca; prefers-reduced-motion desactiva transiciones.
- Fallback sólido cuando backdrop-filter no está soportado; alto contraste siempre prevalece sobre la estética.

## 5. Contrato de implementación de futuras ventanas
1. Identificar jerarquía visual y reutilizar la primitiva existente.
2. Nuevos colores solo en tokens.css y referenciados con var(--color-*); nunca colores por capricho en TSX.
3. Si una vista heredada requiere cambios, migrar su color literal a un token y reducir el presupuesto legacy.
4. Una acción principal por contexto; eliminar/desactivar requiere semántica y confirmación, no solo color.
5. Probar estados focus-visible, hover, disabled, error, vacío y éxito.
6. Verificar 320, 390, 768 y 1440 px; controles principales táctiles ≥44 px; WCAG AA en texto esencial.
7. Ejecutar cd web && npm run check:design && npm run lint && npm run build && npm run test:visual.
8. Revisar Safari iPhone real antes de aprobar una nueva intensidad de Glass: Chromium CI no sustituye Safari.

## 6. Regla de conservación de la identidad de master

La versión `master` **v0.2.1** es la referencia visual aprobada por el propietario. El sistema de diseño documenta sus jerarquías; no debe reinterpretarlas sin una solicitud explícita.

- Logo MARTES FC: tipografía de sistema, peso 800, 24 px en escritorio y 22 px en móvil; conservar la proporción, color, espaciado y tratamiento de acento.
- Marcador principal: 41 px en escritorio y 34 px en pantallas pequeñas, peso 900; no reducir su importancia frente al escudo, rival o etiqueta del resultado.
- Puntuaciones de listas: 19 px en resultados, 17 px en ranking; preservar el orden de lectura y las proporciones de las filas.
- Mantener la paleta existente, densidad y contrastes de tarjetas. Las primitivas `ui-*` son **optativas** para componentes nuevos; no se inyectan masivamente en tarjetas, modal o navegación de `master`.
- Antes de modificar una primitiva existente, contrastar capturas simultáneas con la misma fuente de datos, ancho de pantalla y estado de autenticación. Diferencias de texto o de acciones entre preview y producción pueden derivar de sus bases D1 o sesiones, no necesariamente del CSS.
- Los tokens se pueden incorporar sin alterar los estilos computados. La QA visual comprobará tamaños y pesos de logo, marcador y estadísticas.

## 7. Deuda controlada
El stylesheet original aún contiene literales de color. Esta feature no los sustituye todos para evitar cambiar visualmente las pantallas ya publicadas. El nuevo presupuesto en CI impide aumentar la deuda y obliga a reutilizar tokens.
