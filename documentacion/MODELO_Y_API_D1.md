# D1 + API v0.2.0 — contrato público y administración

## Entidades
`seasons` — temporadas, una activa.  
`players` — alias público, `role` (Portero o Jugador), avatar, `active` (desactivable sin perder partidos).  
`matches` — fecha, temporada, rival, marcador, paradas, ID del portero, publicación, revisión.  
`match_players` — participantes y goles, PK(match_id,player_id).  
`audit_events` — registro de operaciones autenticadas; **jamás aparece en API pública**.

### Integridad y supuestos
- Solo se computan partidos `finished` con `published=1`.
- Un jugador no puede tener goles si no participó; `sum(match_players.goals)=matches.goals_for`.
- Si hay portero debe ser un jugador con rol Portero y aparecer entre participantes; ausencia de portero obliga paradas = 0.
- Las paradas se asignan al portero del encuentro completo; no hay sustituciones modeladas.
- Alias públicos necesitan acuerdo previo; no registrar móviles, emails personales ni fotos.
- IDs internos son UUID aleatorios; no hay información personal derivable de IDs.

## API pública — mismo origen, JSON
- `GET /api/health` → `{ok,configured}`; no da credenciales.
- `GET /api/public/snapshot` → `{version:2,source:"d1",seasons,players,matches,updatedAt}`, estado 200 o 503; sin información privada.
- Cache corta `public,max-age=30`; cliente revalida al visitar la web.

## API privada (Cloudflare Access)
- `GET /api/admin/session` → `{ok:true,email}` con Access verificado; si navegación HTML redirige a `/?admin=1`.
- `POST /api/admin/players` → `{name,role}` opcional `a,b` → jugador creado; inicialmente activo.
- `PATCH /api/admin/players/:id` → `{name?,role?,active?}`; jugador histórico nunca se elimina.
- `POST /api/admin/matches` → contrato Match sin ID o con ID descartado; necesita `seasonId` opcional.
- `PUT /api/admin/matches/:id` → mismo contrato Match; reemplaza participantes y goles.
- `DELETE /api/admin/matches/:id` → elimina partido, cascada de participaciones y audita.
- JSON de error `{error,code}` con 400/401/403/404/405/409/413/503.

### Seguridad
Toda escritura requiere: JWT Cloudflare Access RS256 verificado contra las claves públicas de su TEAM_DOMAIN, issuer, audience, expiración y email del administrador; `Origin` del mismo sitio; `Content-Type: application/json`; longitud de cuerpo limitada. No confiar en un header sin firma ni en variables VITE_ para secretos. No hay CORS permisivo. Se niega todo por defecto si faltan bindings/configuración.

## Contrato frontend
`Player`: id, name, role, initials, a, b, active.  
`Match`: id, date, opponent, goalsFor, goalsAgainst, saves, appearances[], goals{}, goalkeeperId, status, seasonId.  
Nombres reales nunca se fijan en fuentes. El dominio React continúa calculando KPIs sin depender de SQL.

## Migraciones
SQL versionado bajo `migrations/`. Aplicar primero a preview local y remota separada, tras backup de producción. No autoaplicar migraciones a producción en cada build.
