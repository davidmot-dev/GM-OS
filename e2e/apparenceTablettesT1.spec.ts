import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';

const ICI = path.dirname(fileURLToPath(import.meta.url));
test.use({ channel: 'msedge', viewport: { width: 820, height: 1180 }, serviceWorkers: 'block' });

test('T1 : thème, jeu et reconnexion sur les deux tablettes', async ({ context }) => {
    const gmos: GmOsLance = await lancerGmOs({
        semence: path.join(ICI, 'donnees/campagne-de-demo.json'),
        preparerLeProfil: profil => {
            const cible = path.join(profil, 'corpus/systems/alien/theme');
            fs.mkdirSync(cible, { recursive: true });
            fs.copyFileSync(path.join(ICI, '../docs/systems/alien/theme/theme.css'), path.join(cible, 'theme.css'));
            fs.mkdirSync(path.join(cible, 'icones'));
            fs.writeFileSync(path.join(cible, 'icones.json'), JSON.stringify({ journal: 'icones/journal.svg' }));
            fs.writeFileSync(path.join(cible, 'icones/journal.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v18H3z"/></svg>');
        },
    });
    const joueur = await context.newPage();
    const meneur = await context.newPage();
    const requetesDePoliceDuJeu: string[] = [];
    for (const page of [joueur, meneur]) {
        page.on('request', requete => {
            if (requete.url().includes('fonts.googleapis.com') && requete.url().includes('IBM+Plex+Mono')) {
                requetesDePoliceDuJeu.push(requete.url());
            }
        });
    }
    try {
        await attendreLHydratation(gmos);
        await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
        await gmos.fenetre.evaluate(() => {
            const store = (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore;
            const sessions = store.getState().sessions;
            store.setState({ sessions: sessions.map(seance => ({
                ...seance, status: seance.id === 'demo-seance-2' ? 'active' : 'done',
            })) });
        });
        const secret = await gmos.fenetre.evaluate(() => window.appBridge!.pairing!.getSecret!());
        const adresse = `http://127.0.0.1:${gmos.ports.sync}/`;
        await joueur.goto(`${adresse}?window=tablet&sync=${gmos.ports.sync}`);
        await meneur.goto(`${adresse}?window=remote&sync=${gmos.ports.sync}#token=${encodeURIComponent(secret)}`);
        await expect(joueur.getByRole('button', { name: /Nel Varga/ })).toBeVisible({ timeout: 20_000 });
        await expect(meneur.getByRole('button', { name: 'Pads', exact: true })).toBeVisible({ timeout: 20_000 });

        const theme = (page: Page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
        const fond = (page: Page) => page.evaluate(() => document.documentElement.style.getPropertyValue('--app-bg'));
        await expect.poll(() => theme(joueur)).toBe('cyberpunk');
        await expect.poll(() => theme(meneur)).toBe('cyberpunk');

        await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
        const debutTheme = Date.now();
        await gmos.fenetre.locator('[aria-label$="medieval"]').click();
        await Promise.all([
            joueur.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'medieval', undefined, { timeout: 1000 }),
            meneur.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'medieval', undefined, { timeout: 1000 }),
        ]);
        expect(Date.now() - debutTheme).toBeLessThan(1000);
        const personnalites = gmos.fenetre.getByRole('switch');
        await personnalites.click();
        await expect.poll(() => joueur.evaluate(() => document.documentElement.hasAttribute('data-personnalites')), { timeout: 1000 }).toBe(false);
        await expect.poll(() => meneur.evaluate(() => document.documentElement.hasAttribute('data-personnalites')), { timeout: 1000 }).toBe(false);
        const accentAvant = await gmos.fenetre.evaluate(() => document.documentElement.style.getPropertyValue('--app-accent'));
        await gmos.fenetre.locator('button[aria-pressed="false"]').filter({ hasText: /#[0-9a-f]{6}/i }).first().click();
        const accentApres = await gmos.fenetre.evaluate(() => document.documentElement.style.getPropertyValue('--app-accent'));
        expect(accentApres).not.toBe(accentAvant);
        await expect.poll(() => joueur.evaluate(() => document.documentElement.style.getPropertyValue('--app-accent')), { timeout: 1000 }).toBe(accentApres);
        await expect.poll(() => meneur.evaluate(() => document.documentElement.style.getPropertyValue('--app-accent')), { timeout: 1000 }).toBe(accentApres);
        await personnalites.click();
        await expect.poll(() => joueur.evaluate(() => document.documentElement.hasAttribute('data-personnalites')), { timeout: 1000 }).toBe(true);
        await gmos.fenetre.getByLabel(/Fermer les paramètres/i).click();

        // Changement de campagne fictive : le thème Alien réel est lu sur le PC.
        await gmos.fenetre.route('https://fonts.googleapis.com/**', route => route.fulfill({
            contentType: 'text/css',
            headers: { 'access-control-allow-origin': '*' },
            body: '@font-face { font-family: "T1"; src: url(https://fonts.gstatic.com/t1.woff2) format("woff2"); }',
        }));
        await gmos.fenetre.route('https://fonts.gstatic.com/**', route => route.fulfill({
            contentType: 'font/woff2',
            headers: { 'access-control-allow-origin': '*' },
            body: Buffer.from([0, 1, 2, 3]),
        }));
        const debutCampagne = Date.now();
        await gmos.fenetre.evaluate(() => {
            const store = (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore;
            const campagnes = store.getState().campaigns;
            store.setState({
                campaigns: [...campagnes, { ...campagnes[0], id: 'temoin-alien', name: 'Alien témoin', system: 'alien' }],
                activeCampaignId: 'temoin-alien',
            });
        });
        await Promise.all([
            joueur.waitForFunction(() => document.documentElement.style.getPropertyValue('--app-bg') === '#060909', undefined, { timeout: 1000 }),
            meneur.waitForFunction(() => document.documentElement.style.getPropertyValue('--app-bg') === '#060909', undefined, { timeout: 1000 }),
        ]);
        expect(Date.now() - debutCampagne).toBeLessThan(1000);
        await expect.poll(() => gmos.fenetre.evaluate(() => document.documentElement.style.getPropertyValue('--app-bg'))).toBe('#060909');
        // Les icônes du jeu sont un dessin, pas une feuille CSS envoyée au navigateur.
        await expect.poll(() => joueur.evaluate(() => document.documentElement.style.getPropertyValue('--icone-journal')), { timeout: 1500 }).toContain('data:image/svg+xml');
        await expect.poll(() => meneur.evaluate(() => document.documentElement.style.getPropertyValue('--icone-journal')), { timeout: 1500 }).toContain('data:image/svg+xml');
        await expect.poll(() => joueur.locator('style[data-polices-tablette]').textContent(), { timeout: 5000 }).toContain('data:font/woff2;base64,AAECAw==');
        await expect.poll(() => meneur.locator('style[data-polices-tablette]').textContent(), { timeout: 5000 }).toContain('data:font/woff2;base64,AAECAw==');
        expect(requetesDePoliceDuJeu).toEqual([]);
        expect(await joueur.evaluate(() => Boolean(window.appBridge))).toBe(false);
        expect(await meneur.evaluate(() => Boolean(window.appBridge))).toBe(false);

        await joueur.reload();
        await meneur.reload();
        await expect.poll(() => fond(joueur), { timeout: 5000 }).toBe('#060909');
        await expect.poll(() => fond(meneur), { timeout: 5000 }).toBe('#060909');
    } finally {
        await joueur.close();
        await meneur.close();
        await gmos.fermer();
    }
});
