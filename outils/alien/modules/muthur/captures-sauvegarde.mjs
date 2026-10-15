/** Essais navigateur sur un profil jetable : reprise, export/import et échecs de stockage. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cleSauvegardeConfiguration, lireConfiguration } from './configuration.mjs';

export async function verifierSauvegarde({ navigateur, url, sortie }) {
  const contexte = await navigateur.newContext({ offline: true, reducedMotion: 'reduce', acceptDownloads: true, viewport: { width: 390, height: 900 } });
  const erreurs = [];
  let page = await contexte.newPage();
  const surveiller = cible => {
    cible.on('pageerror', erreur => erreurs.push(erreur.message));
    cible.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
  };
  surveiller(page);
  await contexte.route(/^https?:/, route => route.abort());
  const stockage = () => page.evaluate(cle => localStorage.getItem(cle), cleSauvegardeConfiguration);
  const mj = () => page.getByRole('button', { name: 'Poste meneur', exact: true }).click();
  const fichier = texte => ({ name: 'configuration-test.json', mimeType: 'application/json', buffer: Buffer.from(texte) });
  const selectionner = texte => page.locator('#fichierConfiguration').setInputFiles(fichier(texte));
  const regler = async nom => {
    await page.getByRole('button', { name: 'Réglages', exact: true }).click();
    await page.getByLabel('Vaisseau', { exact: true }).fill(nom);
    await page.getByLabel('Effet CRT', { exact: true }).setChecked(false);
    await page.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
  };
  const saisir = async texte => {
    await page.getByLabel('Commande ou /M votre question', { exact: true }).fill(texte);
    await page.getByRole('button', { name: 'Transmettre', exact: true }).click();
  };
  try {
    await page.goto(url); await mj(); await regler('USCSS PERSISTANCE');
    await page.getByText('Configuration enregistrée sur cet appareil.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Protocoles', exact: true }).click();
    await page.locator('.gmos-muthur select').first().selectOption('autodestruction');
    await page.getByLabel('Code du protocole', { exact: true }).fill('0007');
    await page.getByRole('button', { name: 'Enregistrer le protocole', exact: true }).click();
    await page.waitForFunction(cle => JSON.parse(localStorage.getItem(cle)).protocoles.some(pr => pr.code === '0007'), cleSauvegardeConfiguration);
    await page.getByRole('button', { name: 'Dossiers', exact: true }).click();
    await page.getByLabel('Dossier', { exact: true }).selectOption('');
    await page.getByLabel('Identifiant du dossier', { exact: true }).fill('rapport-veille');
    await page.getByLabel('Titre', { exact: true }).fill('Rapport de veille');
    await page.getByLabel('Protection', { exact: true }).selectOption('code');
    await page.getByLabel('Code du dossier', { exact: true }).fill('0087');
    await page.getByLabel('Contenu', { exact: true }).fill('Quarantaine maintenue.');
    await page.getByRole('button', { name: 'Créer le dossier', exact: true }).click();
    await page.getByText('Commande de lecture : READ rapport-veille', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(sortie, 'sauvegarde-390.png'), fullPage: true });

    await page.reload();
    await page.getByText('USCSS PERSISTANCE', { exact: true }).waitFor();
    assert.equal(await page.locator('.gmos-muthur').evaluate(e => e.classList.contains('muthur-crt')), false);
    await saisir('CODE 0087'); await saisir('READ rapport-veille');
    await page.waitForFunction(() => document.querySelector('.muthur-journal').textContent.includes('Quarantaine maintenue.'));
    await saisir('CODE 0007');
    await page.getByRole('region', { name: 'Alerte autodestruction' }).waitFor();
    await page.reload();
    await page.getByText('USCSS PERSISTANCE', { exact: true }).waitFor();
    assert.equal(await page.getByRole('region', { name: 'Alerte autodestruction' }).count(), 0);
    assert.ok(!(await page.locator('.muthur-journal').textContent()).includes('Quarantaine maintenue.'));

    await page.close(); page = await contexte.newPage(); surveiller(page);
    await page.goto(url);
    await page.getByText('USCSS PERSISTANCE', { exact: true }).waitFor();
    await mj();
    const attente = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exporter la configuration', exact: true }).click();
    const telechargement = await attente;
    const exporte = await readFile(await telechargement.path(), 'utf8');
    const preparation = lireConfiguration(exporte);
    assert.equal(preparation.config.vessel, 'USCSS PERSISTANCE');
    assert.equal(preparation.documents.find(d => d.id === 'rapport-veille').code, '0087');
    assert.ok(!Object.hasOwn(preparation, 'players'));
    await regler('USCSS COURANTE');
    const avant = await stockage();
    await selectionner('{');
    await page.getByText(/Import refusé/).waitFor();
    assert.equal(await stockage(), avant);
    await selectionner(exporte);
    await page.getByRole('region', { name: 'Import à confirmer' }).waitFor();
    assert.equal(await stockage(), avant);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(sortie, 'import-configuration-390.png'), fullPage: true });
    await page.getByRole('button', { name: 'Annuler l’import', exact: true }).click();
    assert.equal(await stockage(), avant);
    await selectionner(exporte);
    await page.getByRole('button', { name: 'Remplacer la configuration', exact: true }).click();
    await page.getByText('USCSS PERSISTANCE', { exact: true }).waitFor();
    await page.reload(); await mj();
    await page.getByText('Configuration restaurée sur cet appareil.', { exact: true }).waitFor();

    const illisible = '{sauvegarde illisible à conserver';
    await page.evaluate(({ cle, texte }) => localStorage.setItem(cle, texte), { cle: cleSauvegardeConfiguration, texte: illisible });
    await page.reload(); await mj();
    await page.getByText(/Sauvegarde illisible/).waitFor();
    await regler('USCSS NON ÉCRASÉE');
    assert.equal(await stockage(), illisible);
    await selectionner(exporte);
    await page.getByRole('button', { name: 'Remplacer la configuration', exact: true }).click();
    await page.getByText('Configuration enregistrée sur cet appareil.', { exact: true }).waitFor();
    assert.equal(lireConfiguration(await stockage()).config.vessel, 'USCSS PERSISTANCE');

    const bloque = await navigateur.newContext({ offline: true, reducedMotion: 'reduce' });
    try {
      await bloque.route(/^https?:/, route => route.abort());
      await bloque.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota de test', 'QuotaExceededError'); }; });
      const autre = await bloque.newPage();
      autre.on('pageerror', erreur => erreurs.push(erreur.message));
      await autre.goto(url);
      await autre.getByRole('button', { name: 'Poste meneur', exact: true }).click();
      await autre.getByRole('button', { name: 'Réglages', exact: true }).click();
      await autre.getByLabel('Vaisseau', { exact: true }).fill('USCSS SANS STOCKAGE');
      await autre.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
      await autre.getByText(/Sauvegarde locale impossible/).waitFor();
      await autre.locator('#fichierConfiguration').setInputFiles(fichier(exporte));
      await autre.getByRole('button', { name: 'Remplacer la configuration', exact: true }).click();
      await autre.getByText('USCSS PERSISTANCE', { exact: true }).waitFor();
      await autre.getByText(/Sauvegarde locale impossible/).waitFor();
      const attenteExport = autre.waitForEvent('download');
      await autre.getByRole('button', { name: 'Exporter la configuration', exact: true }).click();
      const copiePortable = await attenteExport;
      assert.equal(lireConfiguration(await readFile(await copiePortable.path(), 'utf8')).config.vessel, 'USCSS PERSISTANCE');
    } finally { await bloque.close(); }
    assert.deepEqual(erreurs, []);
    console.log('Sauvegarde navigateur : rechargement, fermeture/réouverture, export/import, annulation, données illisibles et quota vérifiés.');
    return 2;
  } finally { await contexte.close(); }
}
