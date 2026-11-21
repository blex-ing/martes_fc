import {test,expect,type Page} from '@playwright/test';

const baseSnapshot={
 version:2,source:'d1' as const,updatedAt:'2026-11-19T10:00:00.000Z',
 seasons:[{id:'season-2026',label:'2026',start:'2026-01-01',end:'2026-12-31',active:true}],
 players:[
  {id:'p1',name:'Portero prueba',role:'Portero',initials:'PP',a:'#147aa3',b:'#6540a7',active:true},
  {id:'p2',name:'Jugador prueba',role:'Jugador',initials:'JP',a:'#147aa3',b:'#6540a7',active:true}
 ],
 matches:[] as Record<string,unknown>[]
};
async function remoteAdmin(page:Page,authenticated=true,matches:Record<string,unknown>[]=[]){
 await page.route('**/api/public/snapshot',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...baseSnapshot,matches})}));
 await page.route('**/api/admin/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:authenticated})}));
 await page.goto('/?admin=1');
 if(authenticated)await expect(page.getByText('Sesión de administrador verificada.')).toBeVisible();
}

test('Access denegado no habilita la administración aunque HTTP responda 200',async({page})=>{
 await remoteAdmin(page,false);
 await expect(page.getByRole('button',{name:'Añadir jugador'})).toHaveCount(0);
 await expect(page.getByText('Solo una persona autorizada puede modificarlas.',{exact:false})).toBeVisible();
});

test('borrado del jugador exige confirmación y muestra el error de historial',async({page})=>{
 await remoteAdmin(page);
 let deletes=0;
 await page.route('**/api/admin/players/p1',async route=>{
  if(route.request().method()==='DELETE'){
   deletes++;
   await route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({code:'player_has_history'})});
  }else await route.continue();
 });
 const deleteButton=page.getByRole('button',{name:'Eliminar a Portero prueba'});
 await deleteButton.click();
 const group=page.getByRole('group',{name:'Confirmar eliminación de Portero prueba'});
 await expect(group).toBeVisible();
 expect(deletes).toBe(0);
 await group.getByRole('button',{name:'Cancelar'}).click();
 await expect(group).toHaveCount(0);
 expect(deletes).toBe(0);
 await deleteButton.click();
 await group.getByRole('button',{name:'Confirmar eliminación'}).click();
 await expect(page.getByRole('alert')).toContainText('tiene partidos registrados');
 expect(deletes).toBe(1);
 await expect(group).toBeVisible();
});

test('los fallos de red se muestran sin simular una escritura correcta',async({page})=>{
 await remoteAdmin(page);
 await page.route('**/api/admin/players',route=>route.abort('failed'));
 await page.locator('#admin-name').fill('Nuevo jugador');
 await page.getByRole('button',{name:'Añadir jugador'}).click();
 await expect(page.getByRole('alert')).toContainText('No hay conexión con el servidor');
 await expect(page.getByRole('button',{name:'Añadir jugador'})).toBeEnabled();
});

test('temporada con fechas invertidas se bloquea antes de enviar una mutación',async({page})=>{
 await remoteAdmin(page);
 let requests=0;
 await page.route('**/api/admin/seasons',async route=>{requests++;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});});
 await page.locator('#season-name').fill('Nueva temporada');
 await page.locator('#season-end').fill('2026-12-31');
 await page.getByRole('button',{name:'Crear temporada'}).click();
 await expect(page.getByRole('alert')).toContainText('el fin no puede preceder al inicio');
 expect(requests).toBe(0);
});

test('la edición obsoleta muestra conflicto y conserva el formulario abierto',async({page})=>{
 const match={id:'m1',date:'2026-11-10',opponent:'Rival',goalsFor:1,goalsAgainst:0,saves:2,goalkeeperId:'p1',appearances:['p1','p2'],goals:{p2:1},status:'finished',revision:1,seasonId:'season-2026'};
 await remoteAdmin(page,true,[match]);
 await page.route('**/api/admin/matches/m1',async route=>{
  await route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({code:'stale_revision'})});
 });
 const mobile=(page.viewportSize()?.width??0)<800;
 await page.getByRole('navigation',{name:mobile?'Navegación móvil':'Secciones'})
  .getByRole('button',{name:/Partidos/}).click();
 await page.getByRole('button',{name:'Editar partido'}).click();
 await page.getByRole('button',{name:/Actualizar partido/}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog.getByRole('alert')).toContainText('Otro cambio ha actualizado este partido');
 await expect(dialog).toBeVisible();
});

test('el servidor impide cambiar a Jugador al portero con partidos históricos',async({page})=>{
 await remoteAdmin(page);
 await page.route('**/api/admin/players/p1',async route=>route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({code:'goalkeeper_has_history'})}));
 await page.locator('.admin-row').filter({hasText:'Portero prueba'}).getByRole('button',{name:'Editar'}).click();
 const form=page.getByRole('form',{name:'Editar jugador Portero prueba'});
 await form.getByRole('combobox',{name:'Posición'}).selectOption('Jugador');
 await form.getByRole('button',{name:'Guardar cambios'}).click();
 await expect(page.getByRole('alert')).toContainText('figura como portero');
 await expect(form.getByRole('combobox',{name:'Posición'})).toHaveValue('Jugador');
});

test('al cerrar el modal con Escape se devuelve el foco al botón de apertura',async({page})=>{
 await page.goto('/');
 const add=page.getByRole('button',{name:/Añadir partido/});
 await add.click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(add).toBeFocused();
});

/**
 * #37 — La edición del rol debe sincronizar la vista de Portería tras el
 * snapshot actualizado, sin recargar el documento ni alterar datos reales.
 * D1 y Access están simulados exclusivamente mediante rutas Playwright.
 */
test('cambio de rol sin historial: administración y selector de porteros permanecen sincronizados',async({page})=>{
 let players=baseSnapshot.players.map(p=>({...p}));
 let patches=0;
 await page.route('**/api/public/snapshot',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({...baseSnapshot,players})
 }));
 await page.route('**/api/admin/session',route=>route.fulfill({
  status:200,contentType:'application/json',body:'{"ok":true}'
 }));
 await page.route('**/api/admin/players/p2',async route=>{
  expect(route.request().method()).toBe('PATCH');
  const payload=route.request().postDataJSON() as {name?:string;role?:string};
  expect(payload.name).toBe('Jugador prueba');
  expect(['Portero','Jugador']).toContain(payload.role);
  patches++;
  players=players.map(p=>p.id==='p2'?{...p,role:payload.role as 'Portero'|'Jugador'}:p);
  await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});
 });
 await page.goto('/?admin=1');
 await expect(page.getByText('Sesión de administrador verificada.')).toBeVisible();
 const row=page.locator('.admin-row').filter({hasText:'Jugador prueba'});
 await row.getByRole('button',{name:'Editar'}).click();
 let form=page.getByRole('form',{name:'Editar jugador Jugador prueba'});
 await form.getByRole('combobox',{name:'Posición'}).selectOption('Portero');
 await form.getByRole('button',{name:'Guardar cambios'}).click();
 await expect(row).toContainText('Jugador prueba · Portero');
 expect(patches).toBe(1);

 const navigation=page.getByRole('navigation',{
  name:(page.viewportSize()?.width??0)<800?'Navegación móvil':'Secciones'
 });
 await navigation.getByRole('button',{name:/Portería/}).click();
 const picker=page.getByRole('combobox',{name:'Seleccionar portero'});
 await expect(picker).toBeVisible();
 await expect(picker.locator('option')).toHaveCount(2);
 await picker.selectOption('p2');
 await expect(page.getByRole('heading',{name:'Jugador prueba'})).toBeVisible();

 // Volver a administración mediante el enlace visible de la cabecera lateral
 await page.locator('.side-text-btn').click();
 const secondRow=page.locator('.admin-row').filter({hasText:'Jugador prueba'});
 await secondRow.getByRole('button',{name:'Editar'}).click();
 form=page.getByRole('form',{name:'Editar jugador Jugador prueba'});
 await form.getByRole('combobox',{name:'Posición'}).selectOption('Jugador');
 await form.getByRole('button',{name:'Guardar cambios'}).click();
 await expect(secondRow).toContainText('Jugador prueba · Jugador');
 expect(patches).toBe(2);
 await navigation.getByRole('button',{name:/Portería/}).click();
 await expect(page.getByRole('combobox',{name:'Seleccionar portero'})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Portero prueba'})).toBeVisible();
});
