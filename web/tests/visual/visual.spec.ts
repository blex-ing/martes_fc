import {test,expect} from '@playwright/test';

test('dashboard carga datos de demostración en escritorio y móvil',async ({page},testInfo)=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/Más que un equipo/})).toBeVisible();
 await expect(page.getByText('Paradas del portero')).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('overview.png'),fullPage:true});
});
test('navegación a jugadores y ficha individual',async ({page})=>{
 await page.goto('/');
 const mobile=page.viewportSize()!.width<800;
 if(mobile) await page.getByRole('navigation',{name:'Navegación móvil'}).getByRole('button',{name:'Jugadores'}).click();
 else await page.getByRole('navigation',{name:'Secciones'}).getByRole('button',{name:/Jugadores/}).click();
 await expect(page.getByRole('heading',{name:/Cada jugador/})).toBeVisible();
 await page.getByRole('button',{name:/Ver estadísticas de Jugador 1/}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:'Cerrar'}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('formulario valida la suma de goles',async ({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Añadir partido/}).click();
 await page.getByLabel('Equipo rival').fill('Rival demo');
 await page.getByLabel('Goles a favor').fill('2');
 await page.getByRole('button',{name:/Guardar partido/}).click();
 await expect(page.getByRole('alert')).toContainText('suma de goles');
});

test('metadatos accesibles para compartir la demo pública',async ({page})=>{
 await page.goto('/');
 await expect(page).toHaveTitle(/MARTES FC/);
 await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content','MARTES FC · Estadísticas');
 await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content','dark');
});

test('contrato visual de master: tipografía, marcador, identidad y tarjetas',async ({page})=>{
 await page.goto('/');
 const details=await page.evaluate(()=>{
  const css=(selector:string)=>{const node=document.querySelector(selector);if(!node)throw new Error('Falta '+selector);const s=getComputedStyle(node);return {font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,border:s.borderRadius};};
  const root=getComputedStyle(document.documentElement);
  return {brand:css(desktopView()),score:css('.hero-scoreline'),ranking:css('.bar-value'),match:css('.match-result strong'),background:root.getPropertyValue('--bg').trim(),fontToken:root.getPropertyValue('--display').trim()};
  function desktopView(){return window.innerWidth<800?'.mobile-brand strong':'.brand strong';}
 });
 expect(details.brand.font).toContain('system-ui');
 expect(details.brand.size).toBe('24px');
 expect(details.brand.weight).toBe('800');
 expect(details.score.font).toContain('system-ui');
 expect(details.score.size).toBe('41px');
 expect(details.score.weight).toBe('900');
 expect(details.ranking.size).toBe('17px');
 expect(details.match.size).toBe('19px');
 expect(details.background).toBe('#070a17');
 expect(details.fontToken).not.toContain('--color-background');
});
