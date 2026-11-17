# Propuesta de versión v0.2.0 — Estadísticas compartidas

**Estado:** aprobada para desarrollo; NO liberada hasta validar D1 y autenticación reales.  
**Fecha:** 17-11-2026. **Dueño del producto:** equipo MARTES FC.

## Problema
En v0.1.1 `localStorage` representa un prototipo distinto en cada dispositivo. Los resultados son ficticios. No existe autoría ni administración segura, por lo que una visita no puede consultar estadísticas comunes del equipo.

## Objetivo
La primera fuente de verdad remota será D1 y expondrá exclusivamente resultados publicados. Una persona administradora registrará resultados en una API Worker con Cloudflare Access. Se conservarán diseño, navegación, KPIs, cálculos de dominio, demo sin conexión y flujo Git.

## Decisiones
- Cloudflare Workers Static Assets + Worker API + Cloudflare D1: un despliegue, sin servidor adicional.
- Sin ORM para el modelo pequeño: sentencias SQL preparadas, schema versionado, consultas parametrizadas y batch.
- Tablas: seasons, players, matches, match_players, audit_events (esta última privada).
- No se guardan KPIs agregados; son derivados de partidos, participaciones y paradas.
- Un único portero por partido completo en esta versión, sin asignar a otros porteros goles recibidos ficticios.
- No se recopilan teléfonos ni correos de jugadores. `public_name`/alias debe contar con acuerdo de publicación.
- Access JWT verificado criptográficamente: no confiar en headers sin firma.
- No se desplegará una configuración D1 inventada: UUID y configuración Cloudflare Access deben proceder del panel real.

## Criterios de entrega (Definition of Done)
1. Documento de requisitos vivo y tabla de trazabilidad actualizados con pruebas.
2. D1 producción creada y D1 preview separada; migraciones aplicadas con respaldo.
3. GET público devuelve plantilla, temporadas y partidos publicados sin datos internos.
4. POST/PUT/DELETE solo tras JWT Access válido y correo autorizado, 401/403 en negativos.
5. Alta y edición del partido validan marcador, participantes, portero y goles.
6. Vista de todos los jugadores, ranking, KPIs y portero reflejan D1 en otra sesión/navegador.
7. Ausencia/error de D1 ofrece demo **identificada claramente**; escritura remota no se simula.
8. Al menos una prueba de seguridad, tests de SQL/lógica, CI, QA visual y comprobación manual real.
9. Release publicada por PR y tag solo tras CI y Cloudflare producción verificados.

## Plan por entregables
- A. Gobierno: requisitos vivos, contratos, migraciones y manual.
- B. Worker: endpoints públicos, autenticación, operaciones de administración, auditoría.
- C. React: lectura remota y controles de administrador visibles solo tras autenticación; experiencia demo segura.
- D. Validación y despliegue: recursos D1, Access, migraciones, CI y pruebas E2E.
- E. Release v0.2.0: PR release → master, GitHub tag, back-merge → develop.

## Riesgos y mitigación
- Cloudflare no conectado para administración desde GitHub: requiere que el propietario cree recursos y configure bindings/Access.
- Previews contra producción: binding separado obligatorio antes de habilitar previews de API.
- Datos reales sin permiso: solo fixtures ficticios; autorizaciones antes de registrar nombres.
- Alterar estado de producción antes de migrar: separar feature, no fusionar a master si D1 y Access no están listos.
- Cualquier caída de D1: demo etiquetada, GET 503, sin mostrar cifras falsas como oficiales.
- Rate limit/coste: controlar Workers+D1 Free y usar caché corta.

## Limitaciones aceptadas
La sincronización es por carga/actualización periódica, no WebSocket; v0.2.0 no incluye edición colaborativa ni multi-equipo. La administración precisa Cloudflare Zero Trust/Access configurado.
