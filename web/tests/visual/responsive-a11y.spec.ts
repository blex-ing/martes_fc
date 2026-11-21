import {readFileSync} from 'node:fs';
import {test,expect,type Page,type TestInfo} from '@playwright/test';

// Referencia textual de v0.3.8, independiente de las capturas que CI adjunta.
const baseline=JSON.parse(readFileSync(new URL('./baselines/layout-contract.json',import.meta.url),'utf8')) as Record<string,string>;
delete baseline._note;
const hitSelectors='.primary-btn,.secondary-btn,.outline-btn,.tab-btn,.icon-btn,.match-row-btn,.mobile-nav-item,.text-link,.player-card-foot button,.avatar-btn';

async function visit(page:Page,label:'Inicio'|'Partidos'|'Jugadores'|'Portería'){
 const narrow=(page.viewportSize()?.width??0)<800;
 const nav=page.getByRole('navigation',{name:narrow?'Navegación móvil':'Secciones'});
 await nav.getByRole('button',{name:label==='Inicio'?(narrow?'Inicio':/Resumen general/):new RegExp(label)}).click();
}

async function auditGeometry(page:Page,context:string,checkTouch=true){
 const geometry=await page.evaluate(selector=>{
  const root=document.documentElement;
  const buttonNodes=[...document.querySelectorAll<HTMLElement>(selector)];
  const buttons=buttonNodes.filter(el=>{
   const r=el.getBoundingClientRect(),style=getComputedStyle(el);
   return r.width>0&&r.height>0&&style.visibility!=='hidden';
  }).map(el=>{
   const r=el.getBoundingClientRect();
   return {name:el.getAttribute('aria-label')||el.textContent?.trim().slice(0,40)||el.className,width:r.width,height:r.height};
  });
  const offenders=[...root.querySelectorAll<HTMLElement>('*')].filter(el=>{
   const r=el.getBoundingClientRect(),style=getComputedStyle(el);
   return r.width>0&&style.position!=='fixed'&&(r.right>root.clientWidth+3||r.left< -3);
  }).slice(0,12).map(el=>({element:el.tagName.toLowerCase(),className:typeof el.className==='string'?el.className.slice(0,100):'',right:Math.round(el.getBoundingClientRect().right)}));
  return {scrollWidth:root.scrollWidth,clientWidth:root.clientWidth,innerWidth:window.innerWidth,buttons,offenders};
 },hitSelectors);
 expect(geometry.scrollWidth,JSON.stringify({context,geometry})).toBeLessThanOrEqual(geometry.clientWidth+2);
 expect(geometry.innerWidth,JSON.stringify({context,geometry})).toBeLessThanOrEqual((page.viewportSize()?.width??0)+2);
 if(checkTouch&&(page.viewportSize()?.width??0)<=950){
  expect(geometry.buttons.length,context).toBeGreaterThan(0);
  const small=geometry.buttons.filter(button=>button.width<43.5||button.height<43.5);
  expect(small,context+' tiene controles táctiles menores de 44 px').toEqual([]);
 }
}

test('contrato visual congelado y capturas revisables de Inicio y modal',async({page},testInfo:TestInfo)=>{
 await page.goto('/');
 const actual=await page.evaluate(()=>{
  const style=(selector:string)=>getComputedStyle(document.querySelector<HTMLElement>(selector)!);
  return {
   background:getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
   heroRadius:style('.hero').borderRadius,
   heroBeforeWidth:getComputedStyle(document.querySelector<HTMLElement>('.hero')!,'::before').width,
   heroAfterWidth:getComputedStyle(document.querySelector<HTMLElement>('.hero')!,'::after').width,
   scoreRadius:style('.hero-score').borderRadius,
   metricRadius:style('.metric').borderRadius,
   metricGlowWidth:getComputedStyle(document.querySelector<HTMLElement>('.metric')!,'::after').width,
   panelRadius:style('.panel').borderRadius
  };
 });
 expect(actual,'No actualizar el baseline sin explicar y revisar el cambio en el PR').toEqual(baseline);
 await auditGeometry(page,'Inicio');
 await page.screenshot({path:testInfo.outputPath('baseline-review-overview.png'),fullPage:true});
 await page.getByRole('button',{name:/Añadir partido/}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await auditGeometry(page,'Modal de partido');
 await page.screenshot({path:testInfo.outputPath('baseline-review-modal.png'),fullPage:true});
});

test('navegación, targets táctiles y rectángulos accesibles en cada vista',async({page},testInfo:TestInfo)=>{
 await page.goto('/');
 for(const label of ['Inicio','Partidos','Jugadores','Portería'] as const){
  if(label!=='Inicio')await visit(page,label);
  await auditGeometry(page,label);
  await page.screenshot({path:testInfo.outputPath('baseline-review-'+label.toLowerCase()+'.png'),fullPage:true});
 }
 await visit(page,'Jugadores');
 await page.getByRole('button',{name:/Ver estadísticas de Jugador 1/}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await auditGeometry(page,'Ficha del jugador');
 await page.screenshot({path:testInfo.outputPath('baseline-review-player-profile.png'),fullPage:true});
});

test('foco visible, contención por Tab y restauración al cerrar un diálogo',async({page})=>{
 await page.goto('/');
 await page.keyboard.press('Tab');
 const focused=await page.evaluate(()=>{
  const el=document.activeElement;
  return el instanceof HTMLElement?{tag:el.tagName,outline:getComputedStyle(el).outlineStyle,width:getComputedStyle(el).outlineWidth}:null;
 });
 expect(focused).not.toBeNull();
 expect(focused?.tag).toBe('BUTTON');
 expect(focused?.outline).toBe('solid');
 expect(focused?.width).toBe('2px');
 const open=page.getByRole('button',{name:/Añadir partido/});
 await open.click();
 const dialog=page.getByRole('dialog');
 const close=dialog.getByRole('button',{name:'Cerrar'});
 const save=dialog.getByRole('button',{name:/Guardar partido/});
 await close.focus();
 await page.keyboard.press('Shift+Tab');
 await expect(save).toBeFocused();
 await page.keyboard.press('Tab');
 await expect(close).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(dialog).toHaveCount(0);
 await expect(open).toBeFocused();
});

const longPlayer='JugadorConNombreLargoSinEspaciosDePrueba'.slice(0,40);
const longOpponent=('ClubDeportivoInternacionalSinEspacios').repeat(3).slice(0,80);
const fixtures={
 version:2,source:'d1',updatedAt:'2026-11-19T17:00:00.000Z',
 seasons:[
  {id:'season-2025',label:'2025',start:'2025-01-01',end:'2025-12-31',active:false},
  {id:'season-2026',label:'2026-2027-VERSION-EXTENDIDA',start:'2026-01-01',end:null,active:true}
 ],
 players:[
  {id:'keeper',name:'Portero del equipo',role:'Portero',initials:'PE',a:'#147aa3',b:'#6540a7',active:true},
  {id:'striker',name:longPlayer,role:'Jugador',initials:'JL',a:'#147aa3',b:'#6540a7',active:true}
 ],
 matches:[
  {id:'old',date:'2025-10-02',opponent:'Temporada anterior',goalsFor:9,goalsAgainst:0,appearances:['keeper','striker'],goals:{striker:9},goalkeeperId:'keeper',saves:2,status:'finished',seasonId:'season-2025',revision:1},
  {id:'current',date:'2026-11-10',opponent:longOpponent,goalsFor:1,goalsAgainst:0,appearances:['keeper','striker'],goals:{striker:1},goalkeeperId:'keeper',saves:6,status:'finished',seasonId:'season-2026',revision:1}
 ]
};
test('datos D1 con nombres largos, dos temporadas e historial sin overflow',async({page},testInfo:TestInfo)=>{
 await page.route('**/api/public/snapshot',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixtures)}));
 await page.goto('/');
 await expect(page.locator('.hero-scoreline')).toContainText('1 : 0');
 await expect(page.locator('.metrics-grid .metric-value').first()).toHaveText('1');
 for(const label of ['Inicio','Partidos','Jugadores','Portería'] as const){
  if(label!=='Inicio')await visit(page,label);
  await auditGeometry(page,'D1 '+label);
 }
 await visit(page,'Jugadores');
 await page.getByRole('button',{name:'Ver estadísticas de '+longPlayer}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await auditGeometry(page,'Ficha larga de D1');
 await page.screenshot({path:testInfo.outputPath('baseline-review-long-d1.png'),fullPage:true});
});

test('contraste legible de etiquetas y recuperación ante error de D1',async({page},testInfo:TestInfo)=>{
 await page.goto('/');
 const colors=await page.evaluate(()=>{
  const label=document.querySelector<HTMLElement>('.metric-label')!;
  const nav=document.querySelector<HTMLElement>('.mobile-nav-item');
  return {label:getComputedStyle(label).color,nav:nav?getComputedStyle(nav).color:null,background:getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()};
 });
 function channels(v:string){
  if(v.startsWith('#'))return [1,3,5].map(i=>parseInt(v.slice(i,i+2),16));
  return (v.match(/[\d.]+/g)??[]).slice(0,3).map(Number);
 }
 function luminance(v:string){
  const [r,g,b]=channels(v).map(c=>{const x=c/255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;});
  return 0.2126*r+0.7152*g+0.0722*b;
 }
 function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
 expect(contrast(colors.label,colors.background)).toBeGreaterThanOrEqual(4.5);
 // Valor orientativo frente al fondo general; los gradientes tienen QA visual por separado.
 await page.route('**/api/public/snapshot',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'database_unavailable'})}));
 await page.reload();
 await expect(page.getByText('Servicio temporalmente no disponible.')).toBeVisible();
 await auditGeometry(page,'Error 503',false);
 await page.screenshot({path:testInfo.outputPath('baseline-review-d1-error.png'),fullPage:true});
});

test('prefiere movimiento reducido: animaciones y transiciones desactivadas en controles y paneles',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.locator('.hero')).toBeVisible();
 const properties=await page.evaluate(()=>{
  const nodes=['.primary-btn.ui-hybrid-control','.hero','.metric.glass','.panel.glass'];
  return nodes.map(selector=>{
   const node=document.querySelector<HTMLElement>(selector);
   if(!node)throw Error('Falta elemento: '+selector);
   const style=getComputedStyle(node);
   return {selector,animationName:style.animationName,transitionDuration:style.transitionDuration,scrollBehavior:style.scrollBehavior};
  });
 });
 for(const css of properties){
  expect(css.animationName,css.selector).toBe('none');
  expect(css.transitionDuration,css.selector).toBe('0s');
  expect(css.scrollBehavior,css.selector).toBe('auto');
 }
});
