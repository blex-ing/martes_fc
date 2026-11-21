import {expect,test,type Page} from '@playwright/test';

// #77: además de comprobar scrollTop, blindar la geometría de toda la ficha.
// Los datos de D1 son ficticios; las pruebas no modifican ninguna base remota.
type Role='Jugador'|'Portero';
const fixture=(count:number,role:Role)=>({
 version:2,
 source:'d1',
 updatedAt:'2026-11-20T00:00:00.000Z',
 seasons:[{id:'season-2026',label:'2026',start:'2026-01-01',end:null,active:true}],
 players:[{id:'player-1',name:'Jugador de prueba',role,initials:'JP',a:'#147aa3',b:'#6540a7',active:true}],
 matches:Array.from({length:count},(_,i)=>({
  id:`match-${String(i+1).padStart(3,'0')}`,
  date:'2026-11-19',opponent:`Rival ${i+1}`,
  goalsFor:1,goalsAgainst:1,appearances:['player-1'],goals:{'player-1':1},
  goalkeeperId:role==='Portero'?'player-1':null,
  saves:role==='Portero'?2:0,status:'finished',seasonId:'season-2026',revision:1
 }))
});

async function openProfile(page:Page,count:number,role:Role){
 await page.route('**/api/public/snapshot',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify(fixture(count,role))
 }));
 await page.goto('/');
 const mobile=(page.viewportSize()?.width??0)<800;
 const nav=page.getByRole('navigation',{name:mobile?'Navegación móvil':'Secciones'});
 await nav.getByRole('button',{name:/Jugadores/}).click();
 await page.getByRole('button',{name:'Ver estadísticas de Jugador de prueba'}).click();
 return page.getByRole('dialog',{name:'Ficha del jugador'});
}

const fixedSelectors=['.modal-head','.profile-top','.profile-numbers','.profile-history-title'];

async function readGeometry(dialog:ReturnType<Page['getByRole']>,role:Role){
 return dialog.evaluate((modal,{selectors,isKeeper})=>{
  const content=modal.querySelector<HTMLElement>('.profile-content')!;
  const region=modal.querySelector<HTMLElement>('.profile-history-scroll')!;
  const nodeRect=(el:Element)=>{
   const box=el.getBoundingClientRect();
   return {top:box.top,left:box.left,width:box.width,height:box.height,bottom:box.bottom};
  };
  const fixed=[...selectors,...(isKeeper?['.keeper-methodology']:[])].map(selector=>{
   const el=modal.querySelector(selector);
   if(!el)throw Error('Falta elemento fijo: '+selector);
   return {selector,...nodeRect(el)};
  });
  return {
   modal:{...nodeRect(modal),scrollTop:modal.scrollTop,scrollHeight:modal.scrollHeight,clientHeight:modal.clientHeight},
   content:{scrollTop:content.scrollTop,scrollHeight:content.scrollHeight,clientHeight:content.clientHeight},
   region:{...nodeRect(region),scrollTop:region.scrollTop,scrollHeight:region.scrollHeight,clientHeight:region.clientHeight,
    overflowY:getComputedStyle(region).overflowY},
   documentScroll:document.scrollingElement?.scrollTop??0,
   fixed,
   viewportWidth:document.documentElement.clientWidth,
   documentWidth:document.documentElement.scrollWidth
  };
 },{selectors:fixedSelectors,isKeeper:role==='Portero'});
}

for(const role of ['Jugador','Portero'] as const){
 for(const count of [0,1,5,20,50] as const){
  test(`ficha ${role} con ${count} partidos: dimensiones naturales y scroll exclusivo`,async({page},testInfo)=>{
   const dialog=await openProfile(page,count,role);
   const history=dialog.getByRole('region',{name:'Historial de partidos'});
   const rows=history.locator('.match-row');
   await expect(rows).toHaveCount(count);
   // El viewport de scroll y el grid de filas son nodos distintos.
   await expect(history.locator('.profile-history-list')).toHaveCount(1);
   await expect(history.locator('.profile-history-list .match-row')).toHaveCount(count);
   await expect(dialog.locator('.profile-history-title')).toHaveCSS('display','flex');
   await expect(history).toHaveCSS('overflow-y','auto');
   const structure=await history.evaluate(node=>{
    const list=node.querySelector<HTMLElement>('.profile-history-list')!;
    const heading=node.parentElement?.querySelector<HTMLElement>('.profile-history-title');
    const viewport=node.getBoundingClientRect(),title=heading?.getBoundingClientRect();
    return {display:getComputedStyle(list).display,rows:getComputedStyle(list).gridAutoRows,
      titledBeforePanel:!!title&&title.bottom<viewport.top,
      panelBorder:getComputedStyle(node).borderTopWidth};
   });
   expect(structure.display).toBe('grid');
   expect(structure.rows).toBe('max-content');
   expect(structure.titledBeforePanel).toBe(true);
   expect(parseFloat(structure.panelBorder)).toBeGreaterThan(0);
   await expect(dialog.getByRole('button',{name:'Cerrar'})).toBeInViewport();
   await expect(dialog.locator('.profile-top')).toBeInViewport();
   await expect(dialog.locator('.profile-numbers')).toBeInViewport();
   await expect(dialog.locator('.profile-history-title')).toBeInViewport();
   if(role==='Portero')await expect(dialog.locator('.keeper-methodology')).toBeInViewport();

   const before=await readGeometry(dialog,role);
   // Hallazgo visual: el grid comprimía las filas aunque el scrollTop funcionara.
   // Cada tarjeta debe contener sus textos y mantener separación respecto de la siguiente.
   const cards=await history.evaluate(root=>[...root.querySelectorAll<HTMLElement>('.match-row')].map(row=>{
    const box=row.getBoundingClientRect(),css=getComputedStyle(row);
    const info=row.querySelector<HTMLElement>('.match-info')!;
    const result=row.querySelector<HTMLElement>('.match-result')!;
    const required=Math.max(info.getBoundingClientRect().height,result.getBoundingClientRect().height)
     +parseFloat(css.paddingTop)+parseFloat(css.paddingBottom)
     +parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth);
    return {top:box.top,bottom:box.bottom,height:box.height,required};
   }));
   for(let i=0;i<cards.length;i++){
    expect(cards[i]!.height,`Fila ${i+1} recortada`).toBeGreaterThanOrEqual(cards[i]!.required-1);
    if(i>0)expect(cards[i]!.top,`Filas ${i} y ${i+1} solapadas`).toBeGreaterThanOrEqual(cards[i-1]!.bottom+5);
   }
   expect(before.region.overflowY).toBe('auto');
   // Ningún ancestro debe desplazar ni recortar el resto de la ficha.
   expect(before.modal.scrollHeight).toBeLessThanOrEqual(before.modal.clientHeight+2);
   expect(before.content.scrollHeight).toBeLessThanOrEqual(before.content.clientHeight+2);
   expect(before.documentWidth).toBeLessThanOrEqual(before.viewportWidth+2);
   expect(before.region.height).toBeGreaterThan(0);
   // Con lista corta el hueco no debe estirarse hasta llenar el modal.
   if(count<=1){
    expect(before.region.scrollHeight).toBeLessThanOrEqual(before.region.clientHeight+1);
    expect(before.region.clientHeight).toBeLessThanOrEqual(before.region.scrollHeight+1);
   }
   if(count>=20)expect(before.region.scrollHeight).toBeGreaterThan(before.region.clientHeight+1);

   await page.screenshot({path:testInfo.outputPath(`profile-${role}-${count}.png`)});
   await history.evaluate(node=>{node.scrollTop=node.scrollHeight;});
   const after=await readGeometry(dialog,role);
   for(let i=0;i<before.fixed.length;i++){
    expect(after.fixed[i]?.top).toBeCloseTo(before.fixed[i]!.top,0);
    expect(after.fixed[i]?.height).toBeCloseTo(before.fixed[i]!.height,0);
   }
   expect(after.modal.scrollTop).toBe(0);
   expect(after.content.scrollTop).toBe(0);
   expect(after.documentScroll).toBe(before.documentScroll);
   expect(after.modal.top).toBeCloseTo(before.modal.top,0);
   if(before.region.scrollHeight>before.region.clientHeight+1){
    expect(after.region.scrollTop).toBeGreaterThan(0);
    await expect(rows.last()).toBeInViewport();
   }else{
    expect(after.region.scrollTop).toBe(0);
   }
   await expect(dialog.getByRole('button',{name:'Cerrar'})).toBeInViewport();
   await expect(dialog.locator('.profile-history-title')).toBeInViewport();
  });
 }
}

test('pantalla de 320×568: portero y 50 partidos sin desplazar el modal',async({page},testInfo)=>{
 await page.setViewportSize({width:320,height:568});
 const dialog=await openProfile(page,50,'Portero');
 const history=dialog.getByRole('region',{name:'Historial de partidos'});
 const before=await readGeometry(dialog,'Portero');
 expect(before.region.clientHeight).toBeGreaterThan(0);
 expect(before.modal.scrollHeight).toBeLessThanOrEqual(before.modal.clientHeight+2);
 await expect(dialog.locator('.keeper-methodology')).toBeInViewport();
 await expect(dialog.locator('.profile-history-title')).toBeInViewport();
 await history.evaluate(node=>{node.scrollTop=node.scrollHeight;});
 await expect(history.locator('.match-row').last()).toBeInViewport();
 const after=await readGeometry(dialog,'Portero');
 expect(after.modal.scrollTop).toBe(0);
 expect(after.content.scrollTop).toBe(0);
 await page.screenshot({path:testInfo.outputPath('profile-short-height-keeper.png')});
});
