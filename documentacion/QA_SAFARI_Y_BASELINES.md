# QA de MARTES FC: Safari real, capturas y baseline visual

**Issue:** #37 · **Fecha de preparación:** 19-11-2026.

## Cobertura automatizada

Playwright ejecuta Chromium en **320 × 720, 390 × 844 (iPhone 13), 768 × 1024 y 1440 × 900** y WebKit emulando iPhone en **320 × 720 y 390 × 844**.

El job de GitHub Actions verifica:

- ausencia de desbordamiento horizontal en Inicio, Partidos, Jugadores, Portería, ficha, formulario, errores D1 y datos largos;
- controles táctiles frecuentes de al menos 44 × 44 px hasta 950 px, en el rectángulo interactivo **real**; escritorio conserva la geometría v0.3.8;
- restauración de foco, tabulación circular dentro del diálogo, Escape y foco visible;
- contraste calculado de etiquetas sólidas frente al fondo base (no extrapolable a degradados);
- validación de dos temporadas y un partido del año anterior que no debe contaminar la temporada activa;
- fallo D1 HTTP 503 sin sustituir datos reales por resultados ficticios;
- contrato de estilos en `web/tests/visual/baselines/layout-contract.json`: propiedades CSS conocidas del hero, marcador, KPI, paneles y fondo tomadas del contrato de v0.3.8.

Se guardan **PNG de todas las vistas principales y estados relevantes** en los artefactos de Visual QA de cada ejecución. Las capturas no se añaden a Git ni actualizan automáticamente. El JSON de propiedades congeladas sí produce fallo de CI si se modifica un radio, una luz o un color sin revisión.

## Control de baselines PNG: aprobación humana pendiente

El **contrato JSON no es una baseline de imagen** y los PNG adjuntos en GitHub Actions **no equivalen a capturas doradas aprobadas**. Para incorporar un gate de comparación píxel a píxel:

1. Con CI verde en un SHA concreto, descargar los artefactos `martes-fc-visual-<run_id>` y `martes-fc-webkit-<run_id>` y comprobar el SHA y viewport registrados.
2. Revisar lado a lado los PNG de Inicio (hero/marcador/KPI), Portería, Jugadores, ficha, modal y estado D1 caído frente a la referencia visual v0.3.8. Documentar diferencias intencionadas: solo áreas táctiles y posible reajuste de cabecera.
3. Aprobar explícitamente qué imágenes serán baselines. Crear un **PR independiente** con los PNG binarios versionados y pruebas `toHaveScreenshot` de Playwright configuradas para cada proyecto/viewport; no usar `--update-snapshots` desde CI ni actualizar imágenes sin aprobación.
4. Exigir en ese PR CI + WebKit + Chromium y una revisión humana de los diffs. El artefacto de fallo debe conservar actual, expected y diff.
5. No atribuir a una captura emulada la fidelidad de material Liquid Glass nativo en Safari real.

## Safari iPhone físico: checklist de aceptación pendiente

Probar la URL de Preview en **Safari de un iPhone real** con el viewport/escala del dispositivo y repetir en producción tras publicar:

- [ ] Inicio: fondo y brillo de hero/marcador/KPI sin desplazamientos ni recortes; barra de navegación visible sobre el safe area.
- [ ] Partidos: filtros, detalle y textos largos sin scroll horizontal; elementos táctiles accesibles con una mano.
- [ ] Jugadores: tarjetas, nombres largos, ficha y cierre del diálogo con devolución de foco.
- [ ] Portería: escudo e identidad alineados, paneles sin solaparse y métricas legibles.
- [ ] Formulario de partidos: teclado virtual no oculta Cancelar/Guardar, scroll interior disponible con más de 30 jugadores.
- [ ] Administración: protección Access real, validación de temporada y confirmación de eliminación; no publicar contraseñas ni capturas con datos personales.
- [ ] Accesibilidad: VoiceOver lee nombres/roles, foco y orden de navegación; preferencia Reducir movimiento; texto ampliado, contraste y zoom.
- [ ] Estados D1 vacíos, 503 y sesión expirada visibles sin mostrar demo como datos reales.
- [ ] Comparar capturas reales con PNG de CI y adjuntar evidencia y firma de aprobación en issue #37.

**Criterio de cierre:** evidencias del hardware físico y baselines PNG aprobadas además de la CI. Si aún no están, la issue **debe permanecer abierta**; no presentar emulación WebKit como validación del iPhone físico.

## Reproducción local

Desde `web/`:

```sh
npm ci
npx playwright install --with-deps chromium webkit
npm run test:visual -- --project=compact-chromium --project=mobile-chromium --project=tablet-chromium --project=desktop-chromium --project=compact-webkit --project=mobile-webkit
```

Los scripts `check:design`, `lint` y `test:worker` siguen siendo obligatorios. La prueba de un iPhone físico no se puede sustituir con Chrome DevTools o WebKit emulado.
