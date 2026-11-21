# Prompt de implementación — issue #77

Actúa como ingeniero sénior React/TypeScript, CSS responsive y accesibilidad WCAG. Trabaja sobre `blex-ing/martes_fc`, rama `develop`, siguiendo CONTRIBUTING y el proceso feature → PR a develop → release → master.

## Fuente de verdad
Lee `documentacion/ui/player-profile-history-issue-77.md` y compara la ficha actual con la maqueta aprobada en la conversación del 21/11/2026.

## Trabajo
1. Inspecciona el DOM y CSS de `PlayerProfile`; mide la geometría con 0, 1, 5, 20, 50 encuentros en 320/390/768/1440 y WebKit.
2. Separa el panel scrollable externo del grid interno de filas. No apliques overflow al modal, al encabezado ni al grid de tarjetas.
3. Conserva fijo encabezado, avatar, métricas, metodología de portero y título del historial. Ajusta jerarquía y espacios del título.
4. Usa únicamente estilos scoped a `.profile-modal`, conserva la estética Liquid Glass/tokens existentes. El panel debe tener borde/sombra sutil, scroll accesible y scrollbar discreta.
5. Prueba que las tarjetas no se comprimen: calcula altura necesaria de sus textos + padding, no solapamiento y último partido visible tras hacer scroll. Revisa vacío, móvil bajo, teclado y cierre.
6. Mantén complejidad baja, sin dependencias nuevas, sin cambios en Worker/D1/APIs. Evita duplicar componentes e introduce cambios mínimos pero completos.
7. Documenta evidencia, CI, capturas, limitaciones y despliegue; no fusionar ni publicar si la verificación visual real sigue pendiente.

## Prohibido
No desplazar la ficha completa, no introducir scroll en métricas/cabecera, no usar `grid-template-rows:repeat(...,1fr)` para partidos, no modificar el estilo global de `.match-row`, no cerrar la issue por pasar solamente pruebas sintéticas.
