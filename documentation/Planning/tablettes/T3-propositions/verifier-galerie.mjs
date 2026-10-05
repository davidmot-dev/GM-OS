import { chromium } from '@playwright/test';
import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dossier = new URL('.', import.meta.url);
const navigateur = await chromium.launch({ channel: 'msedge', headless: true });
const resultats = [];
try {
  const page = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await page.goto(new URL('index.html', dossier).href);
  for (const [mode, largeur] of [['propositions', '390'], ['propositions', '360'], ['references', '360']]) {
    await page.locator(`#${mode}`).click();
    await page.locator('#largeur').selectOption(largeur);
    await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
    const images = await page.locator('img').evaluateAll(elements => elements.map(i => ({ id: i.id, largeur: i.naturalWidth, lienIdentique: i.src === i.parentElement.href })));
    if (images.length !== 18 || images.some(i => !i.lienIdentique)) throw new Error('Comparaison incomplète');
    resultats.push({ mode, largeur, images });
  }
  const liens = await page.locator('a').evaluateAll(elements => elements.map(a => a.href));
  for (const lien of liens) {
    const url = new URL(lien);
    if (url.protocol !== 'file:') continue;
    url.search = ''; url.hash = '';
    await access(fileURLToPath(url));
  }
  await page.setViewportSize({ width: 360, height: 800 });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Galerie trop large à 360 px');
  if (erreurs.length) throw new Error(erreurs.join('\n'));
  await writeFile(new URL('galerie-controles.json', dossier), JSON.stringify({ erreurs, liensLocauxValides: true, utilisableA360: true, resultats }, null, 2));
  console.log('Galerie : 18 images en T3/390, T3/360 et T0 ; liens locaux valides ; aucun débordement à 360 px.');
} finally { await navigateur.close(); }
