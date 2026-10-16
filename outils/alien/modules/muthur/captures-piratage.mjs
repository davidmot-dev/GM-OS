/** Vérifier les effets pendant un vrai arbitrage, y compris avec le journal défilé. */
import assert from 'node:assert/strict';
import path from 'node:path';
import { cleSauvegardeConfiguration } from './configuration.mjs';

export async function verifierEffetsPiratage({ navigateur, url, autonomeUrl, sortie }) {
  const contexte = await navigateur.newContext({ offline: true, reducedMotion: 'no-preference' });
  await contexte.addInitScript(cle => localStorage.removeItem(cle), cleSauvegardeConfiguration);
  await contexte.route(/^https?:/, route => route.abort());
  const page = await contexte.newPage(), erreurs = [];
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
  let captures = 0;
  const lancer = async (crt, parasites, succes = false) => {
    await page.goto(url);
    await page.getByRole('button', { name: 'Poste meneur', exact: true }).click();
    await page.getByRole('button', { name: 'Réglages', exact: true }).click();
    await page.getByLabel('Effet CRT', { exact: true }).setChecked(crt);
    await page.getByLabel('Parasites visuels', { exact: true }).setChecked(parasites);
    await page.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
    await page.getByRole('button', { name: 'Terminal', exact: true }).click();
    await page.getByLabel('Commande de test pour cet opérateur', { exact: true }).fill('HACK');
    await page.getByRole('button', { name: 'Essayer la commande', exact: true }).click();
    await page.getByRole('button', { name: succes ? 'Autoriser l’intrusion' : 'Repousser l’intrusion', exact: true }).click();
    await page.locator(`.muthur-piratage-${succes ? 'accorde' : 'refuse'}`).waitFor();
  };
  const relever = () => page.locator('.muthur-journal').evaluate(element => {
    const contenu = element.querySelector('.muthur-journal-contenu'), bandeau = element.querySelector('.muthur-sequence');
    const cadre = element.getBoundingClientRect(), statut = bandeau.getBoundingClientRect();
    return {
      cadre: getComputedStyle(element).animationName,
      crt: getComputedStyle(element, '::before').animationName,
      dureeCrt: getComputedStyle(element, '::before').animationDuration,
      parasites: getComputedStyle(element, '::after').animationName,
      texte: getComputedStyle(element.querySelector('.muthur-message')).animationName,
      statut: getComputedStyle(bandeau).animationName,
      defilementCadre: element.scrollTop, defilementContenu: contenu.scrollTop,
      bandeauVisible: statut.top >= cadre.top && statut.bottom <= cadre.bottom,
      deborde: document.documentElement.scrollWidth > innerWidth,
    };
  });
  try {
    for (const largeur of [390, 1180]) {
      await page.setViewportSize({ width: largeur, height: 900 });
      for (const [crt, parasites] of [[true, true], [true, false], [false, true], [false, false]]) {
        await lancer(crt, parasites);
        await page.getByRole('button', { name: 'Vue joueur', exact: true }).click();
        await page.locator('.muthur-piratage-refuse').waitFor();
        const effets = await relever();
        assert.equal(effets.cadre !== 'none', crt); assert.equal(effets.crt !== 'none', crt);
        if (crt) assert.equal(effets.dureeCrt, '3.5s');
        assert.equal(effets.parasites !== 'none', parasites);
        assert.equal(effets.texte === 'muthur-brouillage-refus', parasites);
        assert.equal(effets.defilementCadre, 0); assert.ok(effets.defilementContenu > 0);
        assert.equal(effets.bandeauVisible, true); assert.equal(effets.deborde, false);
        // Relire le texte au maximum du halo, pas seulement au début de l'animation.
        await page.locator('.muthur-journal').evaluate(element => {
          for (const animation of element.getAnimations({ subtree: true })) {
            if (animation.animationName === 'muthur-halo-refus') { animation.pause(); animation.currentTime = 980; }
          }
        });
        await page.screenshot({ path: path.join(sortie, `hack-refuse-crt-${Number(crt)}-parasites-${Number(parasites)}-${largeur}.png`), fullPage: true }); captures++;
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 900 });
    await lancer(true, true);
    const reduits = await relever();
    for (const cle of ['cadre', 'crt', 'parasites', 'texte', 'statut']) assert.equal(reduits[cle], 'none');
    await page.screenshot({ path: path.join(sortie, 'hack-refuse-mouvements-reduits-390.png'), fullPage: true }); captures++;
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1180, height: 900 });
    await lancer(true, true, true);
    assert.equal(await page.locator('.muthur-piratage-refuse').count(), 0);
    await page.screenshot({ path: path.join(sortie, 'hack-accorde-1180.png'), fullPage: true }); captures++;

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(autonomeUrl);
    await page.getByLabel('Commande du terminal', { exact: true }).fill('HACK');
    await page.getByRole('button', { name: 'Envoyer la commande', exact: true }).click();
    await page.locator('#demandeSelect').selectOption({ index: 0 });
    await page.locator('#hackFail').click();
    await page.locator('.terminal-screen.hack-actif.hack-refuse.hack-parasites').waitFor();
    const couches = await page.locator('#terminalScreen').evaluate(element => ({
      crt: Number(getComputedStyle(element, '::after').zIndex),
      neige: Number(getComputedStyle(element.querySelector('.noise-canvas')).zIndex),
      panneau: Number(getComputedStyle(element.querySelector('.hack-overlay')).zIndex),
    }));
    assert.ok(couches.crt > couches.panneau); assert.ok(couches.neige > couches.panneau);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(sortie, 'autonome-hack-refuse-390.png'), fullPage: true }); captures++;
    assert.deepEqual(erreurs, []);
    console.log('Piratage : effets CRT/parasites indépendants, refus après changement de vue, bandeau visible et mouvements réduits vérifiés.');
    return captures;
  } finally { await contexte.close(); }
}
