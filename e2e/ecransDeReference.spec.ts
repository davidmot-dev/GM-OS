import { test, expect } from '@playwright/test';
import {
    lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, LES_PANNEAUX, type GmOsLance,
} from './lancerGmOs';

/**
 * **T0.1 · Les captures de référence — un écran par panneau.**
 *
 * Phase 0 de la refonte (`documentation/Planning/2026-09-17-refonte-interface.md`,
 * § 3). Un chantier qui change l'habillage de deux cents fichiers a besoin de
 * savoir ce qu'il a changé **sans le vouloir**.
 *
 * ⚠️ **Ce qu'elles prouvent, et ce qu'elles ne prouvent pas.** Une refonte
 * délibérée les fera **toutes** diverger. Leur valeur n'est donc pas « rien n'a
 * changé », c'est **« seul ce que je visais a changé »** : on les régénère à
 * chaque étape acceptée, et on *regarde* l'écart des modules qu'on n'a pas
 * touchés. *Une capture qu'on régénère sans la lire ne teste plus rien.*
 *
 *   npx playwright test e2e/ecransDeReference.spec.ts                      comparer
 *   npx playwright test e2e/ecransDeReference.spec.ts --update-snapshots   régénérer
 *
 * Il faut une construction à jour (`npm run build`). Les images de référence
 * vivent à côté de ce fichier, dans `ecransDeReference.spec.ts-snapshots/` : elles
 * sont **versionnées**, c'est ce qui permet de comparer d'un commit à l'autre.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI REND UNE CAPTURE REPRODUCTIBLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - **La donnée gelée** : la campagne témoin (`e2e/donnees/campagne-temoin.json`),
 *   jamais la sauvegarde du jour — elle change tous les soirs.
 * - **L'heure figée** : les horloges, les dates et les « il y a 3 min » de
 *   l'interface lisent `Date`.
 * - **Les animations coupées**, le curseur caché, et la capture en pixels CSS —
 *   indépendante de la mise à l'échelle de Windows.
 * - **La même taille** : 1440 × 900, une dalle du Zenbook.
 *
 * ⚠️ Les images dépendent de la machine (polices installées, rendu du GPU) :
 * elles valent pour le poste de David. Elles ne tournent pas avant l'envoi.
 *
 * ⛔ **Et de l'écran principal : le Zenbook, à 200 %.** Le 2026-09-29, l'écran
 * externe (1920×1080, 100 %) était principal : les captures sortaient en
 * 1440×900 au lieu de 1441×901, et **toutes** échouaient avant la moindre
 * modification. Un échec général sur la taille n'est pas un défaut du code.
 */

const LARGEUR = 1440;
const HAUTEUR = 900;
/** Un soir de partie, toujours le même. */
const L_HEURE = new Date('2026-06-20T21:00:00');

/** Un fichier par panneau : `Horloge & Temps` → `horloge-temps.png`. */
const nomDeFichier = (panneau: string) =>
    panneau.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';

let gmos: GmOsLance;

/**
 * **La taille s'impose avant chaque capture, et se vérifie** (2026-10-10).
 *
 * Donnée une fois au démarrage, elle ne tenait pas toujours : Windows peut
 * ramener la fenêtre à la zone utile de l'écran — **1 426 × 791** sur le
 * Zenbook, barre des tâches et titre ôtés. Vu deux fois le 10/10 : quand
 * David a ouvert GM-OS pendant une suite complète, et au premier écran d'un
 * test lancé seul. L'échec se lisait comme un écart de 15 % dans l'image,
 * c'est-à-dire comme un changement d'habillage qui n'existait pas. Ici, une
 * fenêtre qui refuse sa taille échoue en le disant.
 *
 * ⚠️ **Un pixel d'arrondi est la norme, pas un écart** : à 200 %, Windows rend
 * 1 441 × 901 pour 1 440 × 900 demandés — c'est la taille des références.
 * Exiger l'égalité stricte faisait échouer toute la série (mesuré le 10/10).
 */
async function imposerLaTaille(): Promise<void> {
    const fenetre = await gmos.application.browserWindow(gmos.fenetre);
    await fenetre.evaluate((w, [l, h]) => { if (w.isMaximized()) w.unmaximize(); w.setContentSize(l, h); }, [LARGEUR, HAUTEUR]);
    await expect.poll(async () => {
        const [l, h] = await fenetre.evaluate(w => w.getContentSize());
        return Math.abs(l - LARGEUR) <= 1 && Math.abs(h - HAUTEUR) <= 1 ? 'ok' : `${l} × ${h}`;
    }, {
        message: `la fenêtre n'a pas pris ${LARGEUR} × ${HAUTEUR} : écran trop petit, ou ramenée par Windows`,
        timeout: 5_000,
    }).toBe('ok');
}

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);

    const fenetre = await gmos.application.browserWindow(gmos.fenetre);
    await imposerLaTaille();
    await fenetre.evaluate(w => w.webContents.setAudioMuted(true));
    await gmos.fenetre.clock.setFixedTime(L_HEURE);

    /* L'écran d'accueil reste cinq secondes, tiré au hasard parmi quatre. */
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

/**
 * **Deux séries, depuis que David a adopté les personnalités** (T2.5,
 * 2026-09-29) : l'interface d'aujourd'hui et la nouvelle, tant que
 * l'interrupteur existe. Chacune le règle elle-même par l'écran des
 * Paramètres — le défaut est désormais allumé, et une série qui s'y fierait
 * surveillerait l'autre sans le dire.
 */
async function reglerLesPersonnalites(allumees: boolean): Promise<void> {
    await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
    const interrupteur = gmos.fenetre.getByRole('switch');
    if ((await interrupteur.getAttribute('aria-checked')) !== String(allumees)) await interrupteur.click();
    await expect(interrupteur).toHaveAttribute('aria-checked', String(allumees));
    await gmos.fenetre.getByLabel(/Fermer les paramètres/i).click();
    await expect.poll(() => gmos.fenetre.evaluate(() => document.documentElement.hasAttribute('data-personnalites')))
        .toBe(allumees);
}

for (const [serie, allumees, suffixe] of [
    ['les écrans de référence', false, ''],
    ['les écrans de référence — personnalités', true, '-personnalite'],
] as const) {
    test.describe(serie, () => {
        test.beforeAll(async () => { await reglerLesPersonnalites(allumees); });

        for (const panneau of LES_PANNEAUX) {
            test(panneau, async () => {
                await ouvrirLeModule(gmos, panneau);
                await expect.poll(() => gmos.fenetre.locator('main').last().innerText(), { timeout: 15_000 }).not.toBe('');
                /* Les modules chargés à la demande, leurs images et leurs polices. */
                await gmos.fenetre.waitForTimeout(1_500);
                await imposerLaTaille();

                await expect(gmos.fenetre).toHaveScreenshot(nomDeFichier(panneau).replace('.png', `${suffixe}.png`), {
                    animations: 'disabled',
                    caret: 'hide',
                    scale: 'css',
                    /* Un pixel anti-crénelé de travers n'est pas un changement d'habillage. */
                    maxDiffPixelRatio: 0.005,
                    /*
                      **Ce qui dépend du matériel ne se compare pas** (2026-10-03) : la
                      liste des sorties audio est celle de la machine, et un écran
                      branché ajoutait trois lignes — Musique et Ambiances échouaient
                      sans qu'une ligne de code ait changé. On masque toute la
                      colonne : la liste pousse ce qui est dessous.
                    */
                    mask: [gmos.fenetre.locator('aside:has([data-depend-du-materiel])')],
                    timeout: 15_000,
                });

                /*
                  ⚠️ **Cortex IA n'est pas un module, c'est un panneau latéral** : il
                  reste ouvert à droite après son clic, et couvrait un tiers de
                  chaque écran capturé ensuite. On le referme par son bouton.
                */
                if (panneau === 'Cortex IA') await ouvrirLeModule(gmos, panneau);
            });
        }
    });
}
