import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import { creerSemenceAlien } from '../outils/modules-du-jeu/recette-alien.mjs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { SauvegardeDesModules, VueDesModulesMJ } from '../src/modules/modulesDuJeu/protocole';

/**
 * **Préréglages et remise à zéro des modules Alien, de bout en bout** — 23/10/2026, demande de
 * David. Vrai Electron sur un profil jetable, pilote fictif de la recette ; sorties dans scratch/.
 */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '../scratch/modules-du-jeu-e2e');
type Magasins = { useSessionOSStore: typeof useSessionOSStore };
type Prereglages = { prereglages: { id: string; nom: string }[] };
let gmos: GmOsLance;
let semence: string;
let dossierSemence: string;

test.setTimeout(180_000);
test.beforeAll(async () => {
    fs.mkdirSync(SORTIE, { recursive: true });
    const demo = await creerSemenceAlien();
    demo.modules.sessionOS.customGameDrivers[0].modulesDuJeu.push({ id: 'alien-combat-spatial' });
    dossierSemence = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-alien-prereglages-'));
    semence = path.join(dossierSemence, 'fiction.json'); fs.writeFileSync(semence, JSON.stringify(demo));
});
test.afterEach(async () => { await gmos?.fermer(); });
test.afterAll(() => { if (dossierSemence) fs.rmSync(dossierSemence, { recursive: true, force: true }); });

const vueMJ = (): Promise<VueDesModulesMJ> => gmos.fenetre.evaluate(() => window.appBridge!.modulesDuJeu!.lire());
const vueDu = async (id: string) => (await vueMJ()).modules.find(m => m.id === id)!.vue as Prereglages & Record<string, unknown>;
async function pupitre(libelle: string, classe: string) {
    const carte = gmos.fenetre.locator('article').filter({ has: gmos.fenetre.getByRole('heading', { name: libelle, exact: true }) });
    await carte.getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
    const racine = gmos.fenetre.locator(classe);
    await expect(racine).toBeVisible();
    return racine;
}
async function capturer(page: Page, cible: ReturnType<Page['locator']>, nom: string) {
    await cible.scrollIntoViewIfNeeded();
    await cible.screenshot({ path: path.join(SORTIE, `${nom}.jpg`), quality: 85, animations: 'disabled' });
}
async function enregistrer(racine: ReturnType<Page['locator']>, nom: string) {
    const panneau = racine.getByRole('region', { name: 'Préréglages', exact: true });
    await panneau.getByLabel('Nom du préréglage', { exact: true }).fill(nom);
    await panneau.getByRole('button', { name: 'Enregistrer la préparation actuelle', exact: true }).click();
    await expect(panneau.getByLabel('Préréglage', { exact: true }).locator('option:checked')).toHaveText(nom);
    return panneau;
}
async function reinitialiser(racine: ReturnType<Page['locator']>, sujet: string) {
    const remise = racine.getByRole('region', { name: 'Remise à zéro', exact: true });
    const bouton = remise.getByRole('button', { name: `Réinitialiser ${sujet}`, exact: true });
    await expect(bouton).toBeDisabled();
    await remise.getByLabel('Confirmer la réinitialisation', { exact: true }).check();
    await bouton.click();
    await expect(remise.getByLabel('Confirmer la réinitialisation', { exact: true })).not.toBeChecked();
}
async function rappeler(panneau: ReturnType<Page['locator']>, nom: string) {
    await panneau.getByLabel('Préréglage', { exact: true }).selectOption({ label: nom });
    await panneau.getByLabel('Confirmer le remplacement de la préparation actuelle', { exact: true }).check();
    await panneau.getByRole('button', { name: 'Rappeler ce préréglage', exact: true }).click();
}

test('préréglages des trois modules : l’exemple du relais, la remise à zéro, le rappel et la reprise après redémarrage', async () => {
    gmos = await lancerGmOs({ semence });
    await attendreLHydratation(gmos);
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
    const cadre = await gmos.application.browserWindow(gmos.fenetre);
    await cadre.evaluate(w => { w.setContentSize(1440, 1000); w.webContents.setAudioMuted(true); });
    await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().setCurrentView('cockpit'));
    await gmos.fenetre.getByRole('button', { name: 'Modules du jeu', exact: true }).click();

    // Détecteur : l'exemple tout fait pose le plan du relais, raccordé, au Tour 1.
    const detecteur = await pupitre('Détecteur de mouvement', '.gmos-detecteur');
    const panneau = detecteur.getByRole('region', { name: 'Préréglages', exact: true });
    await rappeler(panneau, 'Exemple — relais à sept salles');
    await expect(detecteur.getByRole('img', { name: 'Plan privé des zones' })).toBeVisible();
    await expect(detecteur.getByText('Déplacements — Tour 1', { exact: true })).toBeVisible();
    await expect(panneau).toContainText('plan : 8 zones, 6 pions, raccordé');
    await capturer(gmos.fenetre, panneau, 'jeu-alien-prereglages-pupitre');
    await reinitialiser(detecteur, 'le détecteur');
    await expect(detecteur.getByRole('img', { name: 'Plan privé des zones' })).toHaveCount(0);
    expect((await vueDu('alien-detecteur')).prereglages.map(p => p.id)).toEqual(['exemple-relais']);

    // MU/TH/UR : la préparation sous un nom, puis la remise à zéro qui la garde.
    const maman = await pupitre('MU/TH/UR 6000', '.gmos-muthur');
    await maman.getByRole('button', { name: 'Réglages', exact: true }).click();
    await maman.getByLabel('Vaisseau', { exact: true }).fill('USCSS CRONOS');
    await maman.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
    await expect.poll(async () => ((await vueDu('alien-muthur')).config as { vessel: string }).vessel).toBe('USCSS CRONOS');
    const panneauMaman = await enregistrer(maman, 'Cronos');
    await reinitialiser(maman, 'MU/TH/UR');
    await expect.poll(async () => ((await vueDu('alien-muthur')).config as { vessel: string }).vessel).not.toBe('USCSS CRONOS');
    await rappeler(panneauMaman, 'Cronos');
    await expect.poll(async () => ((await vueDu('alien-muthur')).config as { vessel: string }).vessel).toBe('USCSS CRONOS');

    // Combat spatial : les vaisseaux sous un nom ; la remise à zéro les efface, le rappel les rend.
    const vue = await vueMJ();
    expect(await gmos.fenetre.evaluate(({ vue }) => window.appBridge!.modulesDuJeu!.commander({ campagneId: vue.campagneId!, contexte: vue.contexte, requeteId: crypto.randomUUID(),
        moduleId: 'alien-combat-spatial', commande: { id: 'vaisseau', charge: { nom: 'Montero', modele: 'libre', camp: 'joueurs', signature: 1, propulseurs: 1,
            coque: 9, protection: 6, armes: ['canon-electrique-leger'], transpondeur: true, ombilic: true } } }), { vue })).toEqual({ ok: true });
    const spatial = await pupitre('Combat spatial', '.gmos-spatial');
    const panneauSpatial = await enregistrer(spatial, 'Le Montero');
    await reinitialiser(spatial, 'le combat spatial');
    await expect(spatial.getByRole('heading', { name: /Montero/ })).toHaveCount(0);
    await rappeler(panneauSpatial, 'Le Montero');
    await expect(spatial.getByRole('heading', { name: /Montero/ })).toBeVisible();

    // Les préréglages vivent dans le fichier privé des modules et reviennent au redémarrage.
    const fichier = path.join(gmos.profil, 'modules-du-jeu/instances.json');
    const sauvegarde: SauvegardeDesModules = JSON.parse(fs.readFileSync(fichier, 'utf8'));
    await gmos.fermer();
    gmos = await lancerGmOs({ semence, preparerLeProfil: profil => {
        fs.mkdirSync(path.join(profil, 'modules-du-jeu'), { recursive: true });
        fs.writeFileSync(path.join(profil, 'modules-du-jeu/instances.json'), JSON.stringify(sauvegarde));
    } });
    await attendreLHydratation(gmos);
    await expect.poll(async () => (await vueMJ()).modules.length).toBeGreaterThan(2);
    expect((await vueDu('alien-detecteur')).prereglages.map(p => p.nom)).toEqual(['Exemple — relais à sept salles']);
    expect((await vueDu('alien-muthur')).prereglages.map(p => p.nom)).toEqual(['Cronos']);
    expect((await vueDu('alien-combat-spatial')).prereglages.map(p => p.nom)).toEqual(['Le Montero']);
});
