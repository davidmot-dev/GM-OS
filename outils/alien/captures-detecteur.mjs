/** Essai du radar réellement dessiné, avec données locales fictives et sans serveur. */
import assert from 'node:assert/strict';
import path from 'node:path';

export async function verifierDetecteur({ navigateur, url, sortie }) {
  const contexte = await navigateur.newContext({ offline: true, reducedMotion: 'reduce' });
  await contexte.route(/^https?:/, route => route.abort());
  await contexte.addInitScript(() => {
    localStorage.removeItem('alien-accessoires:atelier:v1');
    window.pointsDetecteur = [];
    const arc = CanvasRenderingContext2D.prototype.arc, effacer = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...argumentsRecus) {
      if (this.canvas.id === 'radarCanvas') window.pointsDetecteur = [];
      return effacer.apply(this, argumentsRecus);
    };
    CanvasRenderingContext2D.prototype.arc = function (...argumentsRecus) {
      if (this.canvas.id === 'radarCanvas' && argumentsRecus[2] === 3) window.pointsDetecteur.push({ x: argumentsRecus[0], y: argumentsRecus[1] });
      return arc.apply(this, argumentsRecus);
    };
  });
  const page = await contexte.newPage(), erreurs = [];
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
  const regler = (id, valeur) => page.locator('#' + id).evaluate((champ, valeur) => {
    champ.value = String(valeur); champ.dispatchEvent(new Event('input', { bubbles: true }));
  }, valeur);
  const graine = () => page.evaluate(() => JSON.parse(localStorage.getItem('alien-accessoires:atelier:v1')).tracker.seed);
  let captures = 0;
  try {
    for (const largeur of [390, 1180]) {
      await page.setViewportSize({ width: largeur, height: 900 });
      await page.goto(url);
      await page.getByRole('button', { name: 'Détecteur', exact: true }).click();
      for (const proximity of [0, 50, 100]) {
        const contacts = proximity === 0 ? 1 : proximity === 50 ? 3 : 9;
        await regler('contacts', contacts); await regler('proximity', proximity);
        await page.waitForFunction(({ contacts, proximity }) => {
          const tracker = JSON.parse(localStorage.getItem('alien-accessoires:atelier:v1'))?.tracker;
          return tracker?.contacts === contacts && tracker?.proximity === proximity;
        }, { contacts, proximity });
        await page.getByRole('button', { name: 'Activer le détecteur', exact: true }).click();
        await page.waitForFunction(nombre => window.pointsDetecteur.length === nombre, contacts);
        const releve = await page.locator('#radarCanvas').evaluate(element => ({
          points: window.pointsDetecteur,
          largeur: element.getBoundingClientRect().width, hauteur: element.getBoundingClientRect().height,
        }));
        const rayonMax = Math.min(releve.largeur, releve.hauteur) * .38 * (.2 + (1 - proximity / 100) * .57);
        for (const point of releve.points) assert.ok(Math.hypot(point.x - releve.largeur / 2, point.y - releve.hauteur / 2) <= rayonMax + 1e-6);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.locator('#trackerInstrument').screenshot({ path: path.join(sortie, `detecteur-proximite-${proximity}-${largeur}.png`) }); captures++;
        const premiereGraine = await graine();
        await page.getByRole('button', { name: 'Arrêter le détecteur', exact: true }).click();
        await page.waitForFunction(() => window.pointsDetecteur.length === 0);
        await page.getByRole('button', { name: 'Activer le détecteur', exact: true }).click();
        await page.waitForFunction(nombre => window.pointsDetecteur.length === nombre, contacts);
        assert.notEqual(await graine(), premiereGraine);
        if (contacts === 9) {
          const graineAvantFauxEcho = await graine();
          await page.locator('#anomalyButton').click();
          await page.waitForFunction(() => window.pointsDetecteur.length === 10);
          assert.equal(await graine(), graineAvantFauxEcho);
        }
        await page.getByRole('button', { name: 'Arrêter le détecteur', exact: true }).click();
        await page.waitForFunction(() => window.pointsDetecteur.length === 0);
      }
    }
    assert.deepEqual(erreurs, []);
    console.log('Détecteur : points dessinés dans la zone choisie, nouveau tirage à l’activation et faux écho vérifiés.');
    return captures;
  } finally { await contexte.close(); }
}
