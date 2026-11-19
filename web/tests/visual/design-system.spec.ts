import {test,expect,type Page,type TestInfo} from '@playwright/test';

function nav(page:Page){
 const mobile=(page.viewportSize()?.width??0)<800;
 return page.getByRole('navigation',{name:mobile?'Navegación móvil':'Secciones'});
}

test('contrato visual: captura de hero, KPI, portería, jugadores y modal sin alterar Glass',async({page},testInfo:TestInfo)=>{
 await page.goto('/');
 const hero=page.locator('.hero');
 const score=page.locator('.hero-score');
 const metric=page.locator('.metrics-grid .metric').first();
 const panel=page.locator('.dashboard-grid .panel').first();
 await expect(hero).toBeVisible();
 await expect(score).toBeVisible();
 await expect(hero).toHaveCSS('border-radius','19px');
 await expect(score).toHaveCSS('border-radius','16px');
 await expect(metric).toHaveCSS('border-radius','16px');
 await expect(panel).toHaveCSS('border-radius','18px');
 await expect(page.locator('.hero.ui-hybrid-glass')).toHaveCount(0);
 await expect(page.locator('.hero-score.ui-hybrid-glass')).toHaveCount(0);
 await expect(page.locator('.metric.ui-hybrid-glass')).toHaveCount(0);
 for(const tone of ['cyan','purple','pink','green']){
  await expect(page.locator('.metric.tone-'+tone)).toHaveCount(1);
 }
 await page.screenshot({path:testInfo.outputPath('visual-overview.png'),fullPage:true});

 await nav(page).getByRole('button',{name:/Portería/}).click();
 await expect(page.locator('.keeper-original-hero')).toBeVisible();
 await expect(page.locator('.keeper-original-panels .panel')).toHaveCount(2);
 await expect(page.locator('.keeper-original-hero')).toHaveCSS('border-radius','17px');
 await page.screenshot({path:testInfo.outputPath('visual-goalkeeper.png'),fullPage:true});

 await nav(page).getByRole('button',{name:/Jugadores/}).click();
 await expect(page.locator('.player-card').first()).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('visual-players.png'),fullPage:true});

 await nav(page).getByRole('button',{name:(page.viewportSize()?.width??0)<800?'Inicio':/Resumen general/}).click();
 await page.getByRole('button',{name:/Añadir partido/}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog.locator('.modal-scroll')).toBeVisible();
 await expect(dialog.getByRole('button',{name:/Guardar partido/})).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('visual-match-modal.png'),fullPage:true});
});

test('tokens compartidos y preferencia de movimiento reducido conservan la accesibilidad',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 const action=page.locator('.ui-hybrid-control').first();
 await expect(action).toBeVisible();
 await expect(action).toHaveCSS('min-height','44px');
 await expect(action).toHaveCSS('transition-duration','0s');
 const materials=await page.evaluate(()=>{
  const root=getComputedStyle(document.documentElement);
  const card=getComputedStyle(document.querySelector<HTMLElement>('.panel.ui-hybrid-glass')!);
  const metric=getComputedStyle(document.querySelector<HTMLElement>('.metric')!,'::after');
  const hero=getComputedStyle(document.querySelector<HTMLElement>('.hero')!,'::before');
  return {target:root.getPropertyValue('--touch-target-min').trim(),isolation:card.isolation,metricGlow:metric.width,heroGlow:hero.width};
 });
 expect(materials.target).toBe('44px');
 expect(materials.isolation).toBe('isolate');
 expect(materials.metricGlow).toBe('70px');
 expect(materials.heroGlow).toBe('300px');
});
