import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';

/**
 * **La vitrine du socle, capturée** — refonte, phase 3, P3.8, 2026-09-30.
 *
 * L'écran s'ouvre **par la palette**, comme le meneur l'ouvrira (`Ctrl+K`,
 * « vitrine »). Il est capturé sous les quatre thèmes de base, personnalités
 * allumées, puis dans chaque campagne dont le jeu livre des ornements.
 * Instance jetable, semée par la dernière sauvegarde (lue, jamais écrite).
 *
 *   npx playwright test e2e/vitrineDuSocle.spec.ts --reporter=list
 *
 * Construction à jour et Zenbook en écran principal. Captures dans
 * `e2e-resultats/socle/`.
 */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'e2e-resultats', 'socle');
const SYSTEMES = path.join(ICI, '..', 'docs', 'systems');
const SAUVEGARDES = process.env.GMOS_VITRINE_SAUVEGARDES || 'C:\\Projet_David\\Security_Backup_GMOS';
const THEMES = ['cyberpunk', 'medieval', 'modern', 'claire'] as const;

function derniereSauvegarde(): string | null {
    if (!fs.existsSync(SAUVEGARDES)) return null;
    const f = fs.readdirSync(SAUVEGARDES).filter(n => /^gmos-auto-.*\.json$/.test(n)).sort();
    return f.length ? path.join(SAUVEGARDES, f[f.length - 1]) : null;
}

let gmos: GmOsLance;
test.afterAll(async () => { await gmos?.fermer(); });

test('la vitrine du socle, sous chaque thème et dans les jeux à ornements', async () => {
    test.setTimeout(600_000);
    fs.mkdirSync(SORTIE, { recursive: true });
    const semence = derniereSauvegarde();
    expect(semence, `aucune sauvegarde dans ${SAUVEGARDES}`).not.toBeNull();

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
    await gmos.fenetre.waitForFunction(() =>
        (window as never as { useSessionOSStore: { getState: () => { campaigns: unknown[] } } }).useSessionOSStore.getState().campaigns.length > 2,
    undefined, { timeout: 30_000 });
    const accueil = () => expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
    await accueil();

    const regler = async (theme: string) => {
        await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
        await gmos.fenetre.locator(`button[aria-label$=" ${theme}"]`).first().click();
        const interrupteur = gmos.fenetre.getByRole('switch');
        if ((await interrupteur.getAttribute('aria-checked')) !== 'true') await interrupteur.click();
        await gmos.fenetre.getByLabel(/Fermer les paramètres/i).click();
    };
    const ouvrirLaVitrine = async () => {
        await gmos.fenetre.keyboard.press('Control+KeyK');
        // Par le champ, pas au clavier : la frappe partait avant que le champ ait le focus.
        await gmos.fenetre.getByPlaceholder(/Rechercher une entité/).fill('vitrine');
        await gmos.fenetre.getByText('Vitrine du socle', { exact: true }).first().click();
        await expect(gmos.fenetre.locator('[data-vitrine-du-socle]')).toBeVisible();
        await gmos.fenetre.waitForTimeout(800);
    };
    const capturer = async (nom: string) => {
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, nom), animations: 'disabled', caret: 'hide', scale: 'css' });
        await gmos.fenetre.keyboard.press('Escape');
        await expect(gmos.fenetre.locator('[data-vitrine-du-socle]')).toHaveCount(0);
    };

    const campagnes = await gmos.fenetre.evaluate(() =>
        (window as never as { useSessionOSStore: { getState: () => { campaigns: { id: string; name: string }[] } } })
            .useSessionOSStore.getState().campaigns.map(c => ({ id: c.id, nom: c.name })));
    const activer = async (id: string | null) => {
        await gmos.fenetre.evaluate(async (cible) => {
            const m = (window as never as { useSessionOSStore: { getState: () => { setActiveCampaign: (i: string | null) => void } } }).useSessionOSStore;
            m.getState().setActiveCampaign(null);
            await new Promise(r => setTimeout(r, 300));
            if (cible) m.getState().setActiveCampaign(cible);
        }, id);
        await gmos.fenetre.waitForTimeout(2_000);
        await accueil();
    };

    // 1. Les quatre thèmes de base, sans jeu : leurs propres ornements (laiton, coupe).
    await activer(null);
    for (const theme of THEMES) {
        await regler(theme);
        await ouvrirLaVitrine();
        await capturer(`${theme}.png`);
    }

    /*
      2. Chaque campagne dont le jeu livre des ornements, sous le Médiéval.
      ⚠️ Changer de campagne rétablit le thème retenu pour elle : on règle le
      thème APRÈS l'avoir activée. Et seuls l'en-tête et le séparateur disent
      un jeu à ornements — les thèmes de base n'ont que des coins.
    */
    for (const { id, nom } of campagnes) {
        await activer(id);
        await regler('medieval');
        const orne = await gmos.fenetre.evaluate(() => document.documentElement.style.getPropertyValue('--orne-entete') !== ''
            || document.documentElement.style.getPropertyValue('--orne-separateur') !== '');
        if (!orne) continue;
        await ouvrirLaVitrine();
        await capturer(`jeu-${nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`);
        console.log(`[Socle] ${nom} — ornements du jeu`);
    }
});
