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
 await expect(page.getByRole('heading',{name:/Los que hacen/})).toBeVisible();
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

test('Glass no modifica las capas y luces originales del hero y los KPI',async ({page})=>{
 await page.goto('/');
 await expect(page.locator('.sidebar.ui-hybrid-glass')).toHaveCount(1);
 await expect(page.locator('.hero.ui-hybrid-glass')).toHaveCount(0);
 await expect(page.locator('.hero-score.ui-hybrid-glass')).toHaveCount(0);
 await expect(page.locator('.metric.ui-hybrid-glass')).toHaveCount(0);
 await expect(page.locator('.metric.glass')).toHaveCount(4);
 await expect(page.locator('.panel.ui-hybrid-glass').first()).toBeVisible();
 await expect(page.locator('.primary-btn.ui-hybrid-control').first()).toBeVisible();
 const surface=await page.evaluate(()=>{
  const hero=document.querySelector('.hero');
  const metric=document.querySelector('.metric');
  if(!hero||!metric)throw new Error('Faltan las tarjetas originales');
  const heroStyle=getComputedStyle(hero),lightA=getComputedStyle(hero,'::before'),lightB=getComputedStyle(hero,'::after');
  const glow=getComputedStyle(metric,'::after');
  return {
   heroBackground:heroStyle.backgroundImage,
   heroBeforeWidth:lightA.width,heroBeforeTop:lightA.top,heroBeforeRadius:lightA.borderRadius,
   heroAfterWidth:lightB.width,heroAfterBottom:lightB.bottom,heroAfterRight:lightB.right,
   metricGlowWidth:glow.width,metricGlowTop:glow.top,metricGlowFilter:glow.filter
  };
 });
 expect(surface.heroBackground).toContain('radial-gradient');
 expect(surface.heroBackground).toContain('linear-gradient');
 expect(surface.heroBeforeWidth).toBe('300px');
 expect(surface.heroBeforeTop).toBe('-90px');
 expect(surface.heroBeforeRadius).toBe('50%');
 expect(surface.heroAfterWidth).toBe('310px');
 expect(surface.heroAfterBottom).toBe('-260px');
 expect(surface.heroAfterRight).toBe('170px');
 expect(surface.metricGlowWidth).toBe('70px');
 expect(surface.metricGlowTop).toBe('-29px');
 expect(surface.metricGlowFilter).toContain('blur(34px)');
});

test('portería conserva jerarquía original y dos paneles, sin solapamientos',async ({page},testInfo)=>{
 await page.goto('/');
 const mobile=(page.viewportSize()?.width??0)<800;
 if(mobile)await page.getByRole('navigation',{name:'Navegación móvil'}).getByRole('button',{name:'Portería'}).click();
 else await page.getByRole('navigation',{name:'Secciones'}).getByRole('button',{name:/Portería/}).click();
 const hero=page.locator('.keeper-original-hero');
 await expect(hero).toBeVisible();
 await expect(hero.locator('.keeper-emblem')).toHaveCount(1);
 await expect(hero.getByText('El guardián del equipo')).toBeVisible();
 await expect(hero.getByRole('heading',{name:'Portero demo'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Paradas por partido'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Efectividad',exact:true})).toBeVisible();
 await expect(page.getByText('*Cómo se calcula:')).toBeVisible();
 await expect(page.getByText('PARTIDOS CON EL PORTERO REGISTRADO')).toBeVisible();
 await expect(page.getByText('Recibidos*')).toBeVisible();
 await expect(page.locator('.keeper-original-metrics .metric')).toHaveCount(4);
 await expect(page.getByText('Paradas / tiros a puerta*')).toBeVisible();
 const bounds=await page.evaluate(()=>{
  const hero=document.querySelector('.keeper-original-hero')!,emblem=hero.querySelector('.keeper-emblem')!,info=hero.querySelector('.keeper-original-identity')!;
  const a=emblem.getBoundingClientRect(),b=info.getBoundingClientRect(),h=hero.getBoundingClientRect();
  const panels=[...document.querySelectorAll('.keeper-original-panels .panel')].map(e=>e.getBoundingClientRect());
  return {emblemRight:a.right,infoLeft:b.left,heroLeft:h.left,heroRight:h.right,panels:panels.map(x=>({left:x.left,right:x.right}))};
 });
 expect(bounds.infoLeft).toBeGreaterThanOrEqual(bounds.emblemRight-2);
 expect(bounds.emblemRight).toBeLessThanOrEqual(bounds.heroRight+1);
 for(const p of bounds.panels){expect(p.left).toBeGreaterThanOrEqual(bounds.heroLeft-1);expect(p.right).toBeLessThanOrEqual(page.viewportSize()!.width+1);}
 await page.screenshot({path:testInfo.outputPath('goalkeeper-restored.png'),fullPage:true});
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

test('demo original: detalle del partido conserva goleadores y participantes',async ({page})=>{
 await page.goto('/');
 const mobile=(page.viewportSize()?.width??0)<800;
 if(mobile)await page.getByRole('navigation',{name:'Navegación móvil'}).getByRole('button',{name:'Partidos'}).click();
 else await page.getByRole('navigation',{name:'Secciones'}).getByRole('button',{name:/Partidos/}).click();
 await expect(page.getByRole('heading',{name:'Detalle del partido'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Participantes (6)'})).toBeVisible();
 await expect(page.locator('.match-participants')).toContainText('Jugador');
 await expect(page.locator('.highlight-number')).toBeVisible();
});
test('demo original: ficha de jugador conserva historial y tres estadísticas',async ({page})=>{
 await page.goto('/');
 const mobile=(page.viewportSize()?.width??0)<800;
 if(mobile)await page.getByRole('navigation',{name:'Navegación móvil'}).getByRole('button',{name:'Jugadores'}).click();
 else await page.getByRole('navigation',{name:'Secciones'}).getByRole('button',{name:/Jugadores/}).click();
 await page.getByRole('button',{name:/Ver estadísticas de Jugador 1/}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog.getByRole('heading',{name:'Historial de partidos'})).toBeVisible();
 await expect(dialog.locator('.profile-numbers > div')).toHaveCount(3);
 await expect(dialog.getByText('Goles / partido')).toBeVisible();
});


test('modal de partidos: botones accesibles con listas extensas y scroll independiente',async ({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Añadir partido/}).click();
 const dialog=page.getByRole('dialog');
 const footer=dialog.locator('.modal-footer');
 const scroll=dialog.locator('.modal-scroll');
 await expect(dialog).toBeVisible();
 for(const count of [7,15,30,50]){
  await scroll.evaluate((root,target)=>{
   const list=root.querySelector('.goal-input-list');
   if(!list)throw Error('Falta lista de jugadores');
   const original=list.querySelector('.goal-input-row');
   if(!original)throw Error('Falta fila original');
   while(list.children.length<target)list.appendChild(original.cloneNode(true));
   while(list.children.length>target)list.lastElementChild?.remove();
  },count);
  const bounds=await dialog.evaluate(node=>{
   const s=node.querySelector('.modal-scroll')!,f=node.querySelector('.modal-footer')!,h=node.querySelector('.modal-head')!;
   const a=s.getBoundingClientRect(),b=f.getBoundingClientRect(),c=h.getBoundingClientRect();
   return {scrollHeight:s.scrollHeight,clientHeight:s.clientHeight,overflow:getComputedStyle(s).overflowY,footerTop:b.top,footerBottom:b.bottom,headBottom:c.bottom,scrollTop:a.top,viewportWidth:document.documentElement.clientWidth,bodyWidth:document.documentElement.scrollWidth};
  });
  expect(bounds.overflow).toBe('auto');
  expect(bounds.scrollTop).toBeGreaterThanOrEqual(bounds.headBottom-1);
  expect(bounds.footerTop).toBeGreaterThanOrEqual(bounds.scrollTop-1);
  expect(bounds.footerBottom).toBeLessThanOrEqual(page.viewportSize()!.height+1);
  expect(bounds.bodyWidth).toBeLessThanOrEqual(bounds.viewportWidth+1);
  if(count===50){expect(bounds.scrollHeight).toBeGreaterThan(bounds.clientHeight);await scroll.evaluate(el=>{el.scrollTop=el.scrollHeight;});}
  await expect(footer.getByRole('button',{name:/Guardar partido/})).toBeVisible();
  await expect(footer.getByRole('button',{name:'Cancelar'})).toBeVisible();
 }
 await page.getByLabel('Equipo rival').fill('Rival demo');
 await page.getByLabel('Goles a favor').fill('2');
 await footer.getByRole('button',{name:/Guardar partido/}).click();
 await expect(footer.getByRole('alert')).toContainText('suma de goles');
 await page.keyboard.press('Escape');
 await expect(dialog).toHaveCount(0);
});


test('navegación móvil recibe clics reales dentro del viewport visual',async ({page})=>{
 await page.goto('/');
 if(page.viewportSize()!.width>390)return;
 const labels=['Partidos','Jugadores','Portería','Inicio'];
 for(const label of labels){
  const button=page.getByRole('navigation',{name:'Navegación móvil'}).getByRole('button',{name:label});
  const hit=await button.evaluate(node=>{
   const rect=node.getBoundingClientRect();
   const visual=window.visualViewport;
   const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
   const target=document.elementFromPoint(x,y);
   const width=document.documentElement.scrollWidth;
   return {clickable:!!target&&node.contains(target),x,y,viewportWidth:window.innerWidth,visualHeight:visual?.height??window.innerHeight,visualTop:visual?.offsetTop??0,scrollWidth:width,screenWidth:document.documentElement.clientWidth};
  });
  expect(hit.viewportWidth,JSON.stringify({label,hit})).toBeLessThanOrEqual(page.viewportSize()!.width+2);
  expect(hit.scrollWidth,JSON.stringify({label,hit})).toBeLessThanOrEqual(hit.screenWidth+2);
  expect(hit.y,JSON.stringify({label,hit})).toBeLessThanOrEqual(hit.visualHeight+hit.visualTop+1);
  expect(hit.clickable,JSON.stringify({label,hit})).toBe(true);
  await button.click();
  await expect(button).toHaveAttribute('aria-current','page');
 }
});

test('vistas principales sin desbordamiento horizontal en la matriz responsive',async ({page})=>{
 await page.goto('/');
 for(const label of ['Partidos','Jugadores','Portería']){
  const v=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,innerWidth:window.innerWidth}));
  expect(v.scrollWidth,JSON.stringify({label,v})).toBeLessThanOrEqual(v.clientWidth+2);
  const mobile=(page.viewportSize()?.width??0)<800;
  const nav=page.getByRole('navigation',{name:mobile?'Navegación móvil':'Secciones'});
  await nav.getByRole('button',{name:new RegExp(label)}).click();
 }
});

test('fallo de D1 no muestra resultados demo como datos reales',async ({page})=>{
 await page.route('**/api/public/snapshot',async route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'database_unavailable'})}));
 await page.goto('/');
 await expect(page.getByText('Servicio temporalmente no disponible.')).toBeVisible();
 await expect(page.getByText('Resultados ficticios. Tu navegador guarda los cambios de prueba.')).toHaveCount(0);
});
