import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, type GmOsLance } from './lancerGmOs';

/**
 * **Chaque campagne sous chaque thème de base** — demandé par David le
 * 2026-09-29, après avoir vu Alien sous le thème Clair : *« les couleurs ne
 * sont pas cohérentes »*.
 *
 * Une instance jetable, semée par **la dernière sauvegarde** (lue, jamais
 * écrite), avec les dossiers `theme/` des jeux copiés dans son corpus : la
 * campagne retrouve son jeu comme dans la vraie application, par son pilote.
 * Pour chaque campagne × thème de base × interrupteur des personnalités, le
 * tableau de bord et Combat-OS — rangés dans `e2e-resultats/campagnes/`.
 *
 *   npx playwright test e2e/campagnesEtThemes.spec.ts --reporter=list
 *
 * Il faut une construction à jour (`npm run build`) et le Zenbook en écran
 * principal. Sur demande seulement : `GMOS_CAMPAGNES=1`.
 */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'e2e-resultats', 'campagnes');
const SYSTEMES = path.join(ICI, '..', 'docs', 'systems');
const SAUVEGARDES = process.env.GMOS_VITRINE_SAUVEGARDES || 'C:\\Projet_David\\Security_Backup_GMOS';
const THEMES = ['cyberpunk', 'medieval', 'modern', 'claire'] as const;
const ECRANS = ['Tableau de Bord', 'Combat-OS'];

const court = (texte: string) =>
    texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function derniereSauvegarde(): string | null {
    const designee = process.env.GMOS_VITRINE_SEMENCE;
    if (designee) return fs.existsSync(designee) ? designee : null;
    if (!fs.existsSync(SAUVEGARDES)) return null;
    const fichiers = fs.readdirSync(SAUVEGARDES).filter(n => /^gmos-auto-.*\.json$/.test(n)).sort();
    return fichiers.length ? path.join(SAUVEGARDES, fichiers[fichiers.length - 1]) : null;
}

test.describe('chaque campagne sous chaque thème de base', () => {
    test.skip(!process.env.GMOS_CAMPAGNES, 'Sur demande seulement : GMOS_CAMPAGNES=1');

    let gmos: GmOsLance;
    test.afterAll(async () => { await gmos?.fermer(); });

    test('les captures', async () => {
        test.setTimeout(1_200_000);
        const semence = derniereSauvegarde();
        expect(semence, `aucune sauvegarde dans ${SAUVEGARDES}`).not.toBeNull();
        console.log(`[Campagnes] semence : ${semence}`);

        gmos = await lancerGmOs({
            semence: semence!,
            preparerLeProfil: profil => {
                for (const jeu of fs.readdirSync(SYSTEMES)) {
                    const theme = path.join(SYSTEMES, jeu, 'theme');
                    if (fs.existsSync(path.join(theme, 'theme.css'))) {
                        fs.cpSync(theme, path.join(profil, 'corpus', 'systems', jeu, 'theme'), { recursive: true });
                    }
                }
            },
        });
        await attendreLHydratation(gmos);
        const fenetre = await gmos.application.browserWindow(gmos.fenetre);
        await fenetre.evaluate(w => { w.unmaximize(); w.setContentSize(1440, 900); });
        await fenetre.evaluate(w => w.webContents.setAudioMuted(true));

        // La semence arrive après l'hydratation : on attend ses campagnes.
        await gmos.fenetre.waitForFunction(() => {
            const s = (window as never as { useSessionOSStore: { getState: () => { campaigns: unknown[] } } }).useSessionOSStore.getState();
            return s.campaigns.length > 2;
        }, undefined, { timeout: 30_000 });
        const campagnes = await gmos.fenetre.evaluate(() =>
            (window as never as { useSessionOSStore: { getState: () => { campaigns: { id: string; name: string }[] } } })
                .useSessionOSStore.getState().campaigns.map(c => ({ id: c.id, nom: c.name })));
        const accueil = () => expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
        await accueil();

        const regler = async (theme: string, allumees: boolean) => {
            await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
            await gmos.fenetre.locator(`button[aria-label$=" ${theme}"]`).first().click();
            const interrupteur = gmos.fenetre.getByRole('switch');
            if ((await interrupteur.getAttribute('aria-checked')) !== String(allumees)) await interrupteur.click();
            await expect(interrupteur).toHaveAttribute('aria-checked', String(allumees));
            await gmos.fenetre.getByLabel(/Fermer les paramètres/i).click();
        };

        for (const { id, nom } of campagnes) {
            await gmos.fenetre.evaluate(async (cible) => {
                const m = (window as never as { useSessionOSStore: { getState: () => { setActiveCampaign: (i: string | null) => void } } }).useSessionOSStore;
                m.getState().setActiveCampaign(null);
                await new Promise(r => setTimeout(r, 300));
                m.getState().setActiveCampaign(cible);
            }, id);
            await gmos.fenetre.waitForTimeout(2_500);
            await accueil();
            const dossier = path.join(SORTIE, court(nom));
            fs.mkdirSync(dossier, { recursive: true });

            for (const theme of THEMES) {
                for (const allumees of [false, true]) {
                    await regler(theme, allumees);
                    for (const ecran of ECRANS) {
                        await ouvrirLeModule(gmos, ecran);
                        await gmos.fenetre.waitForTimeout(1_200);
                        await accueil();
                        await gmos.fenetre.screenshot({
                            path: path.join(dossier, `${theme}-${allumees ? 'personnalite' : 'aujourdhui'}-${court(ecran)}.png`),
                            animations: 'disabled', caret: 'hide', scale: 'css',
                        });
                    }
                }
            }
            const jeu = await gmos.fenetre.evaluate(() => document.documentElement.style.getPropertyValue('--app-bg'));
            console.log(`[Campagnes] ${nom} — fond sous le dernier thème : ${jeu}`);

            /*
              **L'interrupteur du thème du jeu, sur la carte de la campagne**
              (David, 2026-09-29). Là où le jeu a un thème : un clic rend le
              thème de base, un second rend le jeu.
            */
            // Le bouton vit sur la carte du tableau de bord : on y va AVANT de le chercher.
            await ouvrirLeModule(gmos, 'Tableau de Bord');
            await gmos.fenetre.waitForTimeout(1_000);
            const interrupteur = gmos.fenetre.locator('button[aria-pressed][title*="Thème du jeu"]');
            if (await interrupteur.count()) {
                const fondDuJeu = await gmos.fenetre.evaluate(() => document.documentElement.style.getPropertyValue('--app-bg'));
                await interrupteur.first().click();
                await expect.poll(() => gmos.fenetre.evaluate(() => document.documentElement.style.getPropertyValue('--app-bg')))
                    .not.toBe(fondDuJeu);
                await gmos.fenetre.screenshot({ path: path.join(dossier, 'theme-du-jeu-eteint.png'), scale: 'css' });
                await interrupteur.first().click();
                await expect.poll(() => gmos.fenetre.evaluate(() => document.documentElement.style.getPropertyValue('--app-bg')))
                    .toBe(fondDuJeu);
                console.log(`[Campagnes] ${nom} — interrupteur du thème du jeu : éprouvé`);
            }
        }
        await regler('cyberpunk', false);
    });
});
