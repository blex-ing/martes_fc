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
 expect(details.brand.size).toBe(page.viewportSize()!.width<=950?'22px':'24px');
 expect(details.brand.weight).toBe('800');
 expect(details.score.font).toContain('system-ui');
 expect(details.score.size).toBe(page.viewportSize()!.width<=700?'34px':'41px');
 expect(details.score.weight).toBe('900');
 expect(details.ranking.size).toBe('17px');
 expect(details.match.size).toBe(page.viewportSize()!.width<=700?(page.viewportSize()!.width<=380?'16px':'17px'):'19px');
 expect(details.background).toBe('#070a17');
 expect(details.fontToken).not.toContain('--color-background');
});

test('hybrid glass avanzado mantiene identidad y material común',async ({page})=>{
 await page.goto('/');
 await expect(page.locator('.sidebar.ui-hybrid-glass')).toHaveCount(1);
 await expect(page.locator('.hero.ui-hybrid-glass')).toHaveCount(1);
 await expect(page.locator('.metric.ui-hybrid-glass')).toHaveCount(4);
 await expect(page.locator('.panel.ui-hybrid-glass').first()).toBeVisible();
 await expect(page.locator('.primary-btn.ui-hybrid-control').first()).toBeVisible();
 const result=await page.evaluate(()=>{
  const h=document.querySelector('.hero.ui-hybrid-glass');
  if(!h)return null;
  return {overlay:getComputedStyle(h,'::before').content,background:getComputedStyle(h).backgroundImage};
 });
 expect(result).not.toBeNull();
 expect(result?.overlay).toBe('""');
 expect(result?.background).toContain('gradient');
});

test('portería ordena avatar, identidad y porcentaje sin solapamientos',async ({page},testInfo)=>{
 await page.goto('/');
 const mobile=(page.viewportSize()?.width??0)<800;
 if(mobile)await page.getByRole('navigation',{name:'Navegación móvil'}).getByRole('button',{name:'Portería'}).click();
 else await page.getByRole('navigation',{name:'Secciones'}).getByRole('button',{name:/Portería/}).click();
 const hero=page.locator('.keeper-hero');
 await expect(hero).toBeVisible();
 await expect(hero.locator('.keeper-avatar')).toHaveCount(1);
 await expect(hero.locator('.keeper-information h2')).toHaveText('Portero demo');
 await expect(hero.locator('.donut')).toHaveCount(1);
 const bounds=await hero.evaluate(element=>{
  function box(selector:string){const e=element.querySelector(selector);if(!e)throw Error('Elemento ausente '+selector);return e.getBoundingClientRect().toJSON();}
  return {hero:element.getBoundingClientRect().toJSON(),avatar:box('.keeper-avatar'),identity:box('.keeper-identity'),text:box('.keeper-information'),donut:box('.donut')};
 });
 function intersects(a:{left:number;right:number;top:number;bottom:number},b:{left:number;right:number;top:number;bottom:number}){return a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;}
 expect(intersects(bounds.avatar,bounds.text)).toBe(false);
 expect(intersects(bounds.identity,bounds.donut)).toBe(false);
 expect(bounds.avatar.left).toBeGreaterThanOrEqual(bounds.hero.left-1);
 expect(bounds.donut.right).toBeLessThanOrEqual(bounds.hero.right+1);
 expect(bounds.donut.bottom).toBeLessThanOrEqual(bounds.hero.bottom+1);
 await page.screenshot({path:testInfo.outputPath('goalkeeper.png'),fullPage:true});
});
test('D1 sin portero muestra estado vacío real, no portero demo',async ({page})=>{
 await page.route('**/api/public/snapshot',async route=>{
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   version:2,source:'d1',updatedAt:new Date().toISOString(),seasons:[],
   players:[{id:'real-player',name:'Jugador Real',role:'Jugador',initials:'JR',a:'#147aa3',b:'#6540a7',active:true}],
   matches:[]
  })});
 });
 await page.goto('/');
 const mobile=(page.viewportSize()?.width??0)<800;
 if(mobile)await page.getByRole('navigation',{name:'Navegación móvil'}).getByRole('button',{name:'Portería'}).click();
 else await page.getByRole('navigation',{name:'Secciones'}).getByRole('button',{name:/Portería/}).click();
 await expect(page.getByRole('heading',{name:'Sin portero registrado'})).toBeVisible();
 await expect(page.locator('.keeper-hero')).toHaveCount(0);
 await expect(page.getByText('Portero demo')).toHaveCount(0);
 await expect(page.getByText('La plantilla de Cloudflare D1 todavía no tiene un portero.')).toBeVisible();
});
