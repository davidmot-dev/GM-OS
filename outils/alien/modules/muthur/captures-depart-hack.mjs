/** Départ de HACK : brouillage fort, cinq secondes, puis attente sans résultat inventé. */
import assert from 'node:assert/strict';
import path from 'node:path';
export async function verifierDepartHack({ navigateur, url, autonomeUrl, sortie }) {
  const contexte = await navigateur.newContext({ offline: true, reducedMotion: 'no-preference' });
  await contexte.route(/^https?:/, route => route.abort());
  const page = await contexte.newPage(), erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await page.clock.install();
  let captures = 0;
  try {
    for (const reduit of [false, true]) {
      await page.emulateMedia({ reducedMotion: reduit ? 'reduce' : 'no-preference' });
      for (const autonome of [false, true]) {
        await page.setViewportSize({ width: 390, height: 900 });
        await page.goto(autonome ? autonomeUrl : url);
        // Uniquement le stockage du navigateur jetable de cette recette.
        await page.evaluate(() => localStorage.clear()); await page.reload();
        if (autonome) {
          await page.getByLabel('Commande du terminal', { exact: true }).fill('HACK');
          await page.getByRole('button', { name: 'Envoyer la commande', exact: true }).click();
        } else await page.getByRole('button', { name: 'HACK', exact: true }).click();
        const cadre = page.locator(autonome ? '.terminal-screen.hack-depart' : '.muthur-piratage-depart');
        await cadre.waitFor();
        const message = page.locator(autonome ? '#hackText' : '.muthur-sequence');
        assert.match(await message.textContent(), /INTRUSION EN COURS · ATTENTE DU MJ/);
        const animation = await cadre.locator(autonome ? '#hackText' : '.muthur-message').first().evaluate(e => getComputedStyle(e).animationName);
        assert.equal(animation, reduit ? 'none' : autonome ? 'alien-intrusion' : 'muthur-intrusion');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: path.join(sortie, `hack-depart-${autonome ? 'autonome' : 'module'}-${reduit ? 'reduit' : 'fort'}-390.png`), fullPage: true }); captures++;
        await page.clock.fastForward(5001);
        await cadre.waitFor({ state: 'hidden' });
        if (!autonome) {
          await page.getByRole('button', { name: 'Poste meneur', exact: true }).click();
          await page.getByRole('button', { name: 'Repousser l’intrusion', exact: true }).waitFor();
        } else {
          await page.locator('#demandeSelect').selectOption({ index: 0 });
          await page.locator('#hackFail').waitFor({ state: 'visible' });
        }
      }
    }
    assert.deepEqual(erreurs, []);
    console.log('HACK : départ fort pendant cinq secondes, attente conservée, module/prototype et mouvements réduits vérifiés (4 captures).');
    return captures;
  } finally { await contexte.close(); }
}
