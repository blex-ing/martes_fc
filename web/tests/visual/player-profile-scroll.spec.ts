import {test,expect} from '@playwright/test';

// Regresión #77: muchos partidos no deben quedar recortados en el modal móvil.
const snapshot={
 version:2,source:'d1',updatedAt:'2026-11-19T20:00:00.000Z',
 seasons:[{id:'season-2026',label:'2026',start:'2026-01-01',end:null,active:true}],
 players:[{id:'player-1',name:'Jugador de prueba',role:'Jugador',initials:'JP',a:'#147aa3',b:'#6540a7',active:true}],
 matches:Array.from({length:20},(_,i)=>({
  id:`match-${String(i+1).padStart(2,'0')}`,date:'2026-11-19',opponent:`Rival ${i+1}`,
  goalsFor:1,goalsAgainst:1,appearances:['player-1'],goals:{'player-1':1},
  goalkeeperId:null,saves:0,status:'finished',seasonId:'season-2026',revision:1
 }))
};

test('el historial completo tiene scroll independiente y el cierre permanece visible',async({page})=>{
 await page.route('**/api/public/snapshot',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify(snapshot)
 }));
 await page.goto('/');
 const nav=page.getByRole('navigation',{
  name:(page.viewportSize()?.width??0)<800?'Navegación móvil':'Secciones'
 });
 await nav.getByRole('button',{name:/Jugadores/}).click();
 await page.getByRole('button',{name:'Ver estadísticas de Jugador de prueba'}).click();
 const dialog=page.getByRole('dialog',{name:'Ficha del jugador'});
 const scroll=dialog.getByRole('region',{name:'Estadísticas e historial del jugador'});
 const close=dialog.getByRole('button',{name:'Cerrar'});
 const rows=scroll.locator('.match-row');
 await expect(rows).toHaveCount(20);
 await expect(close).toBeInViewport();
 await expect(scroll).toHaveAttribute('tabindex','0');
 const before=await scroll.evaluate(node=>({
  overflow:getComputedStyle(node).overflowY,
  height:node.clientHeight,fullHeight:node.scrollHeight,
  pageScroll:document.scrollingElement?.scrollTop??0
 }));
 expect(before.overflow).toBe('auto');
 expect(before.fullHeight).toBeGreaterThan(before.height);
 await scroll.evaluate(node=>{node.scrollTop=node.scrollHeight;});
 await expect(rows.last()).toBeInViewport();
 await expect(rows.last()).toContainText('Rival 1');
 await expect(close).toBeInViewport();
 const after=await scroll.evaluate(node=>({
  top:node.scrollTop,pageScroll:document.scrollingElement?.scrollTop??0,
  horizontal:document.documentElement.scrollWidth-document.documentElement.clientWidth
 }));
 expect(after.top).toBeGreaterThan(0);
 expect(after.pageScroll).toBe(before.pageScroll);
 expect(after.horizontal).toBeLessThanOrEqual(2);
 await close.click();
 await expect(dialog).toHaveCount(0);
});
