/** Recette en navigateur hors ligne : vrais composants et hôte en mémoire, données fictives. */
import assert from 'node:assert/strict';
import path from 'node:path';
import { copyFile } from 'node:fs/promises';
export async function verifierErgonomie({ navigateur, url, autonomeUrl, sortie, manuel }) {
    const contexte = await navigateur.newContext({ offline: true, reducedMotion: 'reduce' });
    await contexte.route(/^https?:/, route => route.abort());
    const page = await contexte.newPage(), erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    const photo = async nom => {
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, nom);
        const instrument = page.locator('.gmos-muthur, .gmos-detecteur');
        if (await instrument.count()) await instrument.screenshot({ path: path.join(sortie, nom), quality: 90 });
        else await page.screenshot({ path: path.join(sortie, nom), fullPage: true, quality: 90 });
    };
    try {
        for (const largeur of [360, 768, 1180]) {
            await page.setViewportSize({ width: largeur, height: 4000 });
            await page.goto(url);
            await page.getByRole('button', { name: 'Cockpit MJ', exact: true }).click();
            const carte = nom => page.locator('article').filter({ has: page.getByRole('heading', { name: nom, exact: true }) });
            await carte('MU/TH/UR 6000').getByRole('checkbox', { name: 'Dana Okoro', exact: true }).check();
            await carte('MU/TH/UR 6000').getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
            const commande = page.getByLabel('Commande de test pour cet opérateur');
            for (const texte of ['/M Où se trouve la balise ?', 'HACK', '/M Quel secteur est verrouillé ?']) {
                await commande.fill(texte); await page.getByRole('button', { name: 'Essayer la commande', exact: true }).click();
                await page.waitForFunction(() => document.querySelector('input[maxlength="2000"]')?.value === '');
            }
            const select = page.getByLabel('Demande à traiter');
            await select.selectOption({ index: 3 });
            await page.getByLabel('Réponse de Maman', { exact: true }).fill('Secteur sept.');
            await page.getByRole('button', { name: 'Transmettre la réponse', exact: true }).click();
            await page.getByText('Demandes en attente : 2', { exact: true }).waitFor();
            await photo(`ergonomie-demandes-${largeur}.jpg`);
            await page.getByRole('button', { name: 'Dossiers', exact: true }).click();
            await page.getByLabel('Dossier', { exact: true }).selectOption('ordre');
            await page.getByRole('button', { name: 'Monter le dossier', exact: true }).click();
            await page.waitForFunction(() => document.querySelector('select[aria-label="Dossier"] option:nth-child(2)')?.value === 'ordre');
            await photo(`ergonomie-dossiers-${largeur}.jpg`);
            await page.getByLabel('Confirmer la suppression du dossier', { exact: true }).check();
            await page.getByRole('button', { name: 'Supprimer le dossier', exact: true }).click();
            await page.waitForFunction(() => !document.querySelector('select[aria-label="Dossier"] option[value="ordre"]'));
            await carte('Détecteur de mouvement').getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
            await page.getByLabel('Contacts', { exact: true }).fill('6');
            await page.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
            await page.getByLabel('Nom du préréglage', { exact: true }).fill('Couloir des machines');
            await page.getByRole('button', { name: 'Enregistrer les réglages actuels', exact: true }).click();
            await page.getByRole('button', { name: 'Démarrer le scan', exact: true }).click();
            await page.getByRole('button', { name: 'Arrêter le scan', exact: true }).waitFor();
            await page.getByRole('button', { name: 'Charger et arrêter le scan', exact: true }).click();
            await page.getByRole('button', { name: 'Démarrer le scan', exact: true }).waitFor();
            await photo(`ergonomie-prereglages-${largeur}.jpg`);
            if (manuel && largeur === 1180) for (const nom of ['demandes', 'dossiers', 'prereglages']) await copyFile(path.join(sortie, `ergonomie-${nom}-${largeur}.jpg`), path.join(manuel, `jeu-alien-${nom}.jpg`));

            await page.goto(autonomeUrl);
            // Nettoyage limité au navigateur jetable de cette recette.
            await page.evaluate(() => localStorage.clear()); await page.reload();
            await page.getByRole('button', { name: 'Accès', exact: true }).click();
            await page.locator('#documentSelect').selectOption('ordre');
            await page.locator('#monterDossier').click();
            assert.equal(await page.locator('#documentSelect option').nth(1).getAttribute('value'), 'ordre');
            await page.locator('#confirmerDossier').check(); await page.locator('#supprimerDossier').click();
            assert.equal(await page.locator('#documentSelect option[value="ordre"]').count(), 0);
            await page.getByRole('button', { name: 'Détecteur', exact: true }).click();
            await page.locator('#prereglageNom').fill('Coursive');
            await page.locator('#prereglageForm button').click();
            await page.locator('#powerButton').click(); await page.locator('#chargerPrereglage').click();
            assert.equal(await page.locator('#powerButton').getAttribute('aria-pressed'), 'false');
            await page.reload();
            await page.getByRole('button', { name: 'Détecteur', exact: true }).click();
            assert.equal(await page.locator('#prereglageSelect option').filter({ hasText: 'Coursive' }).count(), 1);
            await photo(`ergonomie-autonome-${largeur}.jpg`);
        }
        assert.deepEqual(erreurs, []);
        console.log('12 captures ergonomie : file, classement/suppression et préréglages, 360/768/1180 px ; autonome et hôte en mémoire, rappel en veille et reprise locale vérifiés.');
    } finally { await contexte.close(); }
}
