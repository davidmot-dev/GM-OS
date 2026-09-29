import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance,
} from './lancerGmOs';

/**
 * **P1.7 · Les personnalités, à juger par David** — refonte, 2026-09-29.
 *
 * Ce ne sont pas des captures de référence : rien n'est comparé. Chaque écran
 * est pris **deux fois**, interrupteur éteint puis allumé, pour les quatre
 * thèmes, et rangé dans `e2e-resultats/personnalites/` — *« Ici, les captures
 * changent, c'est le but. Tu les regardes avant qu'on les accepte. »* (plan de
 * la phase 1, P1.7).
 *
 * L'interrupteur se manœuvre **par l'écran des Paramètres**, comme le meneur :
 * c'est aussi l'épreuve du réglage lui-même.
 *
 *   npx playwright test e2e/personnalites.spec.ts --reporter=list
 *
 * Il faut une construction à jour (`npm run build`) et le Zenbook en écran
 * principal (voir `ecransDeReference.spec.ts`).
 */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'e2e-resultats', 'personnalites');
const THEMES = ['cyberpunk', 'medieval', 'modern', 'claire'] as const;
const PANNEAUX = ['Tableau de Bord', 'Journal de Jeu', 'Combat-OS', 'Musique', 'Image-OS', 'Dice-OS'];
const L_HEURE = new Date('2026-06-20T21:00:00');

const nomDeFichier = (panneau: string) =>
    panneau.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

let gmos: GmOsLance;

test.beforeAll(async () => {
    fs.mkdirSync(SORTIE, { recursive: true });
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    const fenetre = await gmos.application.browserWindow(gmos.fenetre);
    await fenetre.evaluate(w => { w.unmaximize(); w.setContentSize(1440, 900); });
    await fenetre.evaluate(w => w.webContents.setAudioMuted(true));
    await gmos.fenetre.clock.setFixedTime(L_HEURE);
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

/** Ouvre les Paramètres, choisit le thème, met l'interrupteur dans l'état voulu, referme. */
async function regler(theme: string, allumees: boolean): Promise<void> {
    await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
    await gmos.fenetre.locator(`button[aria-label$=" ${theme}"]`).first().click();
    const interrupteur = gmos.fenetre.getByRole('switch');
    if ((await interrupteur.getAttribute('aria-checked')) !== String(allumees)) await interrupteur.click();
    await expect(interrupteur).toHaveAttribute('aria-checked', String(allumees));
    await gmos.fenetre.getByLabel(/Fermer les paramètres/i).click();
}

test('les quatre personnalités, éteintes puis allumées', async () => {
    test.setTimeout(600_000);
    for (const theme of THEMES) {
        for (const allumees of [false, true]) {
            await regler(theme, allumees);
            await expect.poll(() => gmos.fenetre.evaluate(() => document.documentElement.hasAttribute('data-personnalites')))
                .toBe(allumees);
            for (const panneau of PANNEAUX) {
                await ouvrirLeModule(gmos, panneau);
                await gmos.fenetre.waitForTimeout(1_200);
                await gmos.fenetre.screenshot({
                    path: path.join(SORTIE, `${theme}-${allumees ? 'personnalite' : 'aujourdhui'}-${nomDeFichier(panneau)}.png`),
                    animations: 'disabled', caret: 'hide', scale: 'css',
                });
            }
        }
    }
    // L'instance est jetable, mais on la rend comme on l'a trouvée.
    await regler('cyberpunk', false);
});
