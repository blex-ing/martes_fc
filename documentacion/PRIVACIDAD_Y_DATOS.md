# Política de datos y privacidad del repositorio público

## Decisión

Código, tests, diseño y workflows de MARTES FC estarán en un GitHub **público**. En la versión actual no se incluyen nombres de personas reales, capturas de chats, datos de pagos, fotografías privadas, teléfonos ni credenciales.

## Demostración y datos publicados

- `web/app.js` contiene **jugadores ficticios** y partidos ficticios; la etiqueta de demo debe ser visible.
- Los datos añadidos desde el formulario solo existen en `localStorage` del navegador; no están compartidos, sincronizados ni protegidos por inicio de sesión.
- Al publicar una web con estadísticas reales, los nombres/apodos, resultados y cifras servidos al visitante **son públicos**, aunque la base de datos esté protegida.
- Una ficha real solo se publica cuando el equipo haya acordado qué datos se muestran; las fotografías requieren permiso adecuado.

## Datos que podrían mantenerse privados en una segunda fase

- Cuentas e identificadores internos, permisos, registros de auditoría, borradores y notas administrativas.
- Contactos de jugadores, cuentas financieras y cualquier dato ajeno a la estadística publicada.
- Secretos de API y configuración sensible de backend en el gestor de secretos del proveedor, nunca en Git.

## Prevención de fugas

- La CI realiza una comprobación preventiva sobre archivos de texto comunes; **no garantiza** que detecte todos los secretos.
- Un `.gitignore` no protege los archivos que ya se han añadido a Git. Revisar `git log`, el diff y archivos binarios **antes** de hacer público el repositorio.
- Las pruebas y previews usan fixtures ficticios. No exportar bases reales a fixtures ni subir capturas de mensajería.
- En caso de exposición accidental de un secreto: revocarlo/rotarlo antes de limpiar el historial y revisar logs/artefactos.

## Separación arquitectura

Repositorio público = código; backend privado = protección de operaciones y campos privados; frontend/API públicos = datos deliberadamente expuestos a los visitantes.
