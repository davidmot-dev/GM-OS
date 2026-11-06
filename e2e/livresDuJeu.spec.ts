import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, type GmOsLance } from './lancerGmOs';

/**
 * **La carte « PDF du livre » de la Forge** — « Les chemins des livres », étape B (06/11/2026),
 * maquette validée par David (`stitch/livres/pdf-du-livre.png`).
 *
 * Profil jetable, corpus jetable où l'on sème `livres.json` et `supplements.json` d'Alien, copiés du
 * dépôt. On lit le registre, on vérifie le livre (lecture seule, sur le NAS s'il répond) et on
 * photographie la carte ; rien n'est enregistré.
 */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const CAPTURES = path.resolve(ICI, '../documentation/User Guides/captures');

let gmos: GmOsLance;

test.beforeAll(async () => {
    // Le profil jetable a un corpus vide : on y sème le registre et les suppléments d'Alien.
    gmos = await lancerGmOs({
        preparerLeProfil: profil => {
            const jeu = path.join(profil, 'corpus', 'systems', 'alien');
            fs.mkdirSync(path.join(jeu, 'supplements', 'colonial-marines', 'rules'), { recursive: true });
            fs.mkdirSync(path.join(jeu, 'rules'), { recursive: true });
            const depot = path.resolve(ICI, '../docs/systems/alien');
            fs.copyFileSync(path.join(depot, 'livres.json'), path.join(jeu, 'livres.json'));
            fs.copyFileSync(path.join(depot, 'supplements', 'supplements.json'), path.join(jeu, 'supplements', 'supplements.json'));
        },
    });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Forge');
    await gmos.fenetre.getByRole('button', { name: /Atelier de Règles/i }).first().click();
});

test.afterAll(async () => { await gmos?.fermer(); });

test('le livre de base d’Alien : chemin, décalage + 3, puis Colonial Marines', async () => {
    const f = gmos.fenetre;
    const choixDuCorpus = f.locator('select').filter({ has: f.locator('option[value="alien"]') }).first();
    await choixDuCorpus.selectOption('alien');

    const carte = f.locator('[data-pdf-du-livre]');
    await carte.waitFor({ timeout: 20_000 });
    await expect(carte.getByLabel('Chemin du PDF du livre')).toHaveValue(/ALIEN_le_jeu_de_rôle\.pdf$/);
    await expect(carte.getByLabel('Décalage')).toHaveText('+3');
    await expect(carte.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();

    await carte.getByRole('button', { name: 'Vérifier' }).click();
    await expect(carte.getByRole('status').first()).toContainText(/Le livre répond|ne répond pas/, { timeout: 60_000 });

    await expect(carte.locator('[data-nom-du-fichier]')).toHaveText('ALIEN_le_jeu_de_rôle.pdf');

    // La capture : du titre « Livre documenté » au pied de la carte, rien d'autre.
    await f.locator('[data-choix-du-livre]').scrollIntoViewIfNeeded();
    const haut = (await f.locator('[data-choix-du-livre]').boundingBox())!;
    const bas = (await carte.boundingBox())!;
    await f.screenshot({
        path: path.join(CAPTURES, 'forge-pdf-du-livre.jpg'), quality: 85,
        clip: { x: Math.min(haut.x, bas.x) - 8, y: haut.y - 8, width: Math.max(haut.width, bas.width) + 16, height: bas.y + bas.height - haut.y + 16 },
    });

    await f.getByRole('button', { name: /Colonial Marines/ }).click();
    await expect(carte.getByLabel('Chemin du PDF du livre')).toHaveValue(/ALN-Marines Coloniaux_FR\.pdf$/);
});

/**
 * **Étape C** : le Drone, p. 309 du livre de base, s'ouvre à la page 312 du PDF dans la fenêtre de
 * lecture. Le livre est sur le NAS : s'il ne répond pas, l'essai le dit et s'arrête là.
 */
test('« Livre, p. 309 » : la fenêtre de lecture s’ouvre à la page 312 du PDF', async () => {
    const r = await gmos.fenetre.evaluate(() => window.appBridge!.livres!.ouvrir({ racine: 'systems/alien', cle: 'jeu', page: 309 }));
    test.skip(!r.ouvert && r.motif === 'introuvable', 'Le NAS ne répond pas : le livre d’Alien est introuvable.');
    expect(r).toEqual({ ouvert: true, titre: 'ALIEN, le jeu de rôle', pagePdf: 312, alaPage: true });

    const lecture = gmos.application.windows().find(w => /ALIEN_le_jeu_de_r%C3%B4le\.pdf\?ouverture=\d+#page=312$/.test(w.url()));
    expect(lecture, 'la fenêtre de lecture').toBeTruthy();
    expect(await gmos.application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map(w => w.getTitle())))
        .toContain('ALIEN, le jeu de rôle — page 312 du PDF');

    // La visionneuse charge le livre du NAS : on lui laisse le temps d'afficher la page. Elle tourne
    // dans un processus à part, que la capture de Playwright rend blanche : on capture la fenêtre
    // depuis le processus principal.
    // Le compteur dit 312 tout de suite ; la page s'affiche une fois le livre lu sur le NAS.
    await lecture!.waitForTimeout(16_000);
    const image = await gmos.application.evaluate(async ({ BrowserWindow }) => {
        const w = BrowserWindow.getAllWindows().find(x => x.getTitle().endsWith('page 312 du PDF'));
        return w ? (await w.webContents.capturePage()).toJPEG(80).toString('base64') : '';
    });
    // Une fenêtre blanche pèse ~10 Ko en JPEG, la page du Drone ~110 Ko : le livre est peint.
    expect(image.length).toBeGreaterThan(60_000);
    fs.writeFileSync(path.join(CAPTURES, 'livre-a-la-page.jpg'), Buffer.from(image, 'base64'));
});
