## [Unreleased] — D1 bindings y seguridad de entornos
- Registrados en Wrangler los identificadores reales de `martes-fc-prod` y `martes-fc-preview`.
- Configuración independiente de migraciones de preview y comprobación CI contra contaminación de producción.
- Actualizado el manual de operación sin ejecutar migraciones ni publicar la release.

## [Unreleased] — Propuesta v0.2.0 (no desplegada)\n- Registro vivo de requisitos y trazabilidad por feature.\n- Migración SQL D1 y endpoints públicos y administrativos.\n- Conexión del dashboard React a datos compartidos con demo de contingencia.\n- Panel de administración de jugadores/temporadas y edición de partidos.\n- Protección de escritura con verificación JWT Cloudflare Access y Origin.\n- Tests Worker, contrato, dominio y esquema SQL.\n- La publicación requiere D1 + Access reales y QA previa.\n\n# Changelog — MARTES FC

## v0.1.1 — Preparación del primer despliegue en Cloudflare
- Metadatos Open Graph y esquema de color para compartir el dashboard de demostración.
- Prueba visual automatizada para el título y los metadatos de la web.
- Documentación del error de Cloudflare ENOENT y del build en la carpeta web.
- Sin backend, cuentas ni datos reales; cambios ficticios guardados localmente.

## v0.1.0 — Primer dashboard público
- Migración a React 19, TypeScript estricto y Vite.
- Vistas de equipo, partidos, jugadores, portería y ajustes de datos.
- Datos ficticios y almacenamiento local; exportación JSON.
- Pruebas de estadísticas, lint, compilación y QA visual Playwright.
- Pipeline GitHub Actions, Dependabot y notas de release.
- Preparación para Cloudflare, aún sin desplegar.
