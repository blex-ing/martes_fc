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
