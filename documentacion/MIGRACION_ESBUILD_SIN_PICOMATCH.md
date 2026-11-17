# Sustitución experimental de Vite y eliminación de picomatch

Mantenemos npm, React, TypeScript, Workers y D1. La compilación pasa a esbuild 0.25.12, que ya figuraba en el lockfile.

## Diagnóstico
- Vite 6.4.6 depende directamente de picomatch 4.0.7 y de tinyglobby.
- @typescript-eslint/typescript-estree también utiliza tinyglobby. Por ello la eliminación completa exige reemplazar las reglas TypeScript de ESLint por el análisis estricto del compilador TypeScript. ESLint permanece para JavaScript y scripts Node.
- Se eliminan los paquetes inalcanzables del lockfile. Esta rama no cambia npm por Yarn.

## Validaciones antes de fusionar
```sh
cd web
npm ci
npm ls picomatch --all
npm run check:no-picomatch
npm audit --audit-level=high
npm run typecheck
npm run lint
npm test
npm run test:worker
npm run build
npm run test:visual
```

`npm ls picomatch --all` puede salir con código 1 si no existe, lo importante es que no muestre ninguna ruta al paquete. Validar además D1 y Access en Cloudflare Preview.

## Limitaciones
La eliminación de typescript-eslint sustituye algunas reglas específicas por las comprobaciones estrictas de TypeScript (incluyendo noUnusedLocals y noUnusedParameters); no debe asumirse equivalencia de cobertura. El servidor dev usa esbuild watch sin HMR, requiere recargar el navegador. Los recursos de producción tienen hash.

El lockfile se ha podado desde el árbol existente; `npm ci` y la auditoría real de GitHub Actions deben confirmar su consistencia antes del merge. No fusionar sin CI verde ni afectar a master o producción.
