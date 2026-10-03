import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

let gmos: GmOsLance;

/**
 * **Phase 6 · Le paquet témoin (T6.6)** — refonte, contrat v1.6, 2026-10-03.
 *
 * Un thème de jeu déposé dans le corpus jetable (`generic`, celui de la
 * campagne témoin) fournit trois icônes du § 9 : combat, dés, PNJ. On vérifie
 * dans l'application construite qu'elles remplacent celles de GM-OS dans la
 * barre latérale — et que les autres restent. *Le chargeur, le pont et le
 * composant ont chacun leurs essais ; celui-ci dit qu'ils se parlent.*
 */

const ICONES: Record<string, string> = {
    'icones/combat.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l11 11M20 4L9 15"/><path d="M13 17l4 4M11 17l-4 4"/><path d="M16 14l-2 2M8 14l2 2"/></svg>',
    'icones/des.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><g fill="currentColor"><circle cx="8" cy="8" r="1.6"/><circle cx="16" cy="8" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/></g></svg>',
    'icones/pnj.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6c3-2 13-2 16 0v6c0 5-4 8-8 9-4-1-8-4-8-9z"/><path d="M8 11h2M14 11h2M9 16c2 1.5 4 1.5 6 0"/></svg>',
};

test.beforeAll(async () => {
    gmos = await lancerGmOs({
        semence: CAMPAGNE_TEMOIN,
        preparerLeProfil: (profil) => {
            const dossier = path.join(profil, 'corpus', 'systems', 'generic', 'theme');
            fs.mkdirSync(path.join(dossier, 'icones'), { recursive: true });
            fs.writeFileSync(path.join(dossier, 'theme.css'), [
                ':root[data-theme="generic"] {',
                '  color-scheme: dark;',
                '  --rpg-bg: #0b1020;',
                '  --rpg-surface: #121a30;',
                '  --rpg-text: #e5e7eb;',
                '  --rpg-muted: #94a3b8;',
                '  --rpg-accent: #f59e0b;',
                '  --rpg-border: #24304d;',
                '}',
            ].join('\n'));
            fs.writeFileSync(path.join(dossier, 'icones.json'), JSON.stringify({ combat: 'icones/combat.svg', des: 'icones/des.svg', pnj: 'icones/pnj.svg' }));
            for (const [chemin, svg] of Object.entries(ICONES)) fs.writeFileSync(path.join(dossier, chemin), svg);
        },
    });
    await attendreLHydratation(gmos);
    const fenetre = await gmos.application.browserWindow(gmos.fenetre);
    await fenetre.evaluate((w) => { w.unmaximize(); w.setContentSize(1440, 900); });
    await fenetre.evaluate(w => w.webContents.setAudioMuted(true));
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 15_000 });
});
test.afterAll(async () => { await gmos?.fermer(); });

test('les icônes fournies remplacent celles de GM-OS, les autres restent', async () => {
    const f = gmos.fenetre;
    await ouvrirLeModule(gmos, 'Combat-OS');
    /* Le thème du jeu se charge après la campagne : on attend la variable, pas une durée. */
    await expect.poll(() => f.evaluate(() => document.documentElement.style.getPropertyValue('--icone-combat-repli')), { timeout: 15_000 }).toBe('none');

    const etat = (nom: string) => f.evaluate((n) => {
        const dessin = document.querySelector(`[data-icone="${n}"]`);
        const repli = document.querySelector(`[data-icone-repli="${n}"]`);
        return {
            dessin: dessin ? getComputedStyle(dessin).display : 'absent',
            repli: repli ? getComputedStyle(repli).display : 'absent',
        };
    }, nom);

    for (const nom of ['combat', 'des', 'pnj']) {
        expect(await etat(nom), nom).toEqual({ dessin: 'inline-block', repli: 'none' });
    }
    // La musique n'est pas dans le paquet : l'icône de GM-OS reste, le dessin ne s'affiche pas.
    expect(await etat('musique')).toEqual({ dessin: 'none', repli: 'contents' });
});
