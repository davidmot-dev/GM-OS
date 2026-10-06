import { test, expect, type BrowserContext, type Page, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useDiceStore } from '../src/stores/useDiceStore';

// T5 : vrais navigateurs, réglages du PC et WebSocket, uniquement profil/démo jetables.
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '../documentation/Planning/tablettes/T5-fini');
const FORMATS = [
    { nom: 'compact', width: 360, height: 800 },
    { nom: 'telephone', width: 390, height: 844 },
    { nom: 'portrait', width: 820, height: 1180 },
    { nom: 'paysage', width: 1180, height: 820 },
    { nom: 'pupitre', width: 1440, height: 900 },
] as const;
const THEMES = ['cyberpunk', 'medieval', 'modern', 'claire'] as const;
let gmos: GmOsLance;
let secret: string;
test.use({ channel: 'msedge', locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block' });
test.setTimeout(90_000);
test.beforeAll(async () => {
    test.setTimeout(90_000);
    fs.mkdirSync(SORTIE, { recursive: true });
    gmos = await lancerGmOs({ semence: path.join(ICI, 'donnees/campagne-de-demo.json') });
    await attendreLHydratation(gmos);
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
    await gmos.fenetre.evaluate(() => {
        const magasin = (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore;
        magasin.setState({ sessions: magasin.getState().sessions.map(s => ({ ...s, status: s.id === 'demo-seance-2' ? 'active' : 'done' })) });
    });
    secret = await gmos.fenetre.evaluate(() => window.appBridge!.pairing!.getSecret!());
    await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
});
test.afterAll(async () => { await gmos?.fermer(); });
test.beforeEach(async () => {
    await gmos.fenetre.evaluate(() => {
        const w = window as unknown as { useDiceStore: typeof useDiceStore; useSessionOSStore: typeof useSessionOSStore };
        w.useDiceStore.getState().clearHistory();
        w.useSessionOSStore.setState({ messages: [] });
    });
});

async function regler(theme: typeof THEMES[number], personnalites = true) {
    await gmos.fenetre.locator(`[aria-label$="${theme}"]`).click();
    const bouton = gmos.fenetre.getByRole('switch');
    if ((await bouton.getAttribute('aria-checked')) !== String(personnalites)) await bouton.click();
}
async function ouvrir(context: BrowserContext, taille: { width: number; height: number }, leger = false, automatique = false, reduit = false) {
    await context.addInitScript(({ leger, automatique }) => {
        localStorage.setItem('gmos-tablet-uuid', 't5-client');
        localStorage.setItem('gmos-performance-storage', JSON.stringify({ state: { isLowGraphics: leger, autoPerformanceEnabled: automatique }, version: 0 }));
    }, { leger, automatique });
    const joueur = await context.newPage(), meneur = await context.newPage();
    for (const p of [joueur, meneur]) {
        await p.setViewportSize(taille);
        await p.emulateMedia({ reducedMotion: reduit ? 'reduce' : 'no-preference' });
    }
    const adresse = `http://127.0.0.1:${gmos.ports.sync}/`;
    await joueur.goto(`${adresse}?window=tablet&sync=${gmos.ports.sync}`);
    await meneur.goto(`${adresse}?window=remote&sync=${gmos.ports.sync}#token=${encodeURIComponent(secret)}`);
    await expect(joueur.getByRole('button', { name: /Nel Varga/ })).toBeVisible({ timeout: 20_000 });
    await joueur.getByRole('button', { name: /Nel Varga/ }).click();
    await expect(joueur.getByText('Connecté', { exact: true })).toBeVisible({ timeout: 20_000 });
    // « Connecté » précède la fin de l'interlude : son écran recouvrait les
    // captures joueur malgré un focus mesurable sur la navigation dessous.
    await expect(joueur.getByText('Synchronisation', { exact: true })).toHaveCount(0);
    await expect(meneur.getByText('Non appairée', { exact: true })).toHaveCount(0);
    await meneur.evaluate(port => new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}`);
        ws.addEventListener('open', () => { ws.close(); resolve(); }, { once: true });
        ws.addEventListener('error', () => reject(new Error('Synchronisation impossible')), { once: true });
    }), gmos.ports.sync);
    for (const p of [joueur, meneur]) expect(await p.evaluate(() => Boolean(window.appBridge))).toBe(false);
    return { joueur, meneur };
}
async function presentation(bouton: Locator) {
    return bouton.evaluate(e => {
        const s = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        const racine = getComputedStyle(document.documentElement);
        const couleur = s.boxShadow.match(/rgba\([^)]*,\s*([\d.]+)\)|\/\s*([\d.]+)\)/);
        return { halo: s.boxShadow, alpha: s.boxShadow === 'none' ? 0 : couleur ? Number(couleur[1] ?? couleur[2]) : 1,
            facteur: Number(racine.getPropertyValue('--halo-facteur')), outline: s.outlineStyle,
            epaisseur: s.outlineWidth, decalage: s.outlineOffset, couleur: s.outlineColor,
            fond: s.backgroundColor,
            transition: s.transitionDuration, largeur: r.width, hauteur: r.height,
            dedans: r.x >= -1 && r.y >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 };
    });
}
async function capturer(page: Page, nom: string) {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(SORTIE, nom + '.png'), animations: 'disabled', scale: 'css' });
}
async function verifierFocus(page: Page, suivante: Locator, cible: Locator) {
    await suivante.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(cible).toBeFocused();
    expect(await cible.evaluate(e => {
        const r = e.getBoundingClientRect();
        return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }), 'la commande ciblée est devant les surcouches').toBe(true);
    const s = await presentation(cible);
    expect(s.outline).toBe('solid');
    expect(s.epaisseur).toBe('2px');
    expect(s.decalage).toBe('-3px');
    expect(s.couleur, 'le focus se distingue du fond du contrôle').not.toBe(s.fond);
    expect(s.dedans).toBe(true);
    expect(s.largeur).toBeGreaterThanOrEqual(44);
    expect(s.hauteur).toBeGreaterThanOrEqual(44);
}

for (const theme of THEMES) for (const personnalites of [true, false]) for (const format of FORMATS) {
    test(`T5 ${theme} — personnalités ${personnalites ? 'oui' : 'non'} — ${format.nom}`, async ({ context }) => {
        await regler(theme, personnalites);
        const { joueur, meneur } = await ouvrir(context, format);
        const navJ = joueur.getByRole('navigation', { name: 'Navigation Hub' });
        const navM = meneur.getByRole('navigation', { name: 'Navigation du meneur' }).filter({ visible: true });
        for (const p of [joueur, meneur]) {
            await expect.poll(() => p.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(theme);
            await expect.poll(() => p.evaluate(() => document.documentElement.hasAttribute('data-personnalites'))).toBe(personnalites);
            await expect(p.locator('[data-tablette]')).toHaveCount(1);
        }
        const actifJ = navJ.getByTitle('Direct', { exact: true }), actifM = navM.getByRole('button', { name: 'Pads', exact: true });
        await verifierFocus(joueur, navJ.getByTitle('Archives', { exact: true }), actifJ);
        await verifierFocus(meneur, navM.getByRole('button', { name: 'Dés', exact: true }), actifM);
        for (const cible of [actifJ, actifM]) {
            const s = await presentation(cible);
            if (s.facteur === 0) expect(s.alpha, s.halo).toBe(0);
            else expect(s.alpha, s.halo).toBeGreaterThan(0);
            expect(s.transition).toBe('0.16s');
        }
        for (const cible of [navJ.getByTitle('Archives', { exact: true }), navM.getByRole('button', { name: 'Dés', exact: true })]) {
            expect((await presentation(cible)).alpha).toBe(0);
        }
        const prefixe = `${theme}-${personnalites ? 'personnalites' : 'base'}-${format.nom}`;
        await capturer(joueur, prefixe + '-joueur-focus');
        await capturer(meneur, prefixe + '-meneur-focus');
        await navM.getByRole('button', { name: 'Messages', exact: true }).click();
        const champ = meneur.getByRole('textbox');
        await champ.click();
        await champ.fill('Le relais reste silencieux.');
        expect((await presentation(champ)).epaisseur).toBe('2px');
        expect((await presentation(champ)).decalage).toBe('-3px');
        await capturer(meneur, prefixe + '-saisie');
        expect(await joueur.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await meneur.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
}

for (const format of FORMATS.filter(f => f.nom === 'compact' || f.nom === 'paysage')) test(`T5 réduction des animations — ${format.nom}`, async ({ context }) => {
    await regler('cyberpunk');
    const { joueur, meneur } = await ouvrir(context, format, false, false, true);
    for (const p of [joueur, meneur]) {
        await expect(p.locator('[data-tablette]')).toHaveAttribute('data-mouvement-reduit', '');
        const bouton = p.getByRole('navigation').filter({ visible: true }).getByRole('button').first();
        expect((await presentation(bouton)).transition).toBe('0s');
        expect(await p.locator('[data-tablette] .animate-pulse, [data-tablette] .animate-ping').evaluateAll(es => es.every(e => getComputedStyle(e).animationName === 'none'))).toBe(true);
    }
    // Un vrai message du MJ produit la pastille : contrôler un signal présent,
    // plutôt que déclarer une liste d'animations vide correctement réduite.
    await meneur.getByRole('navigation', { name: 'Navigation du meneur' }).filter({ visible: true }).getByRole('button', { name: 'Messages', exact: true }).click();
    await meneur.getByRole('textbox').fill('Le relais reste silencieux.');
    await meneur.getByRole('button', { name: 'Envoyer le message', exact: true }).click();
    const pastille = joueur.getByRole('navigation', { name: 'Navigation Hub' }).getByTitle('Messages', { exact: true }).locator('.animate-ping');
    await expect(pastille).toHaveCount(1);
    expect(await pastille.evaluate(e => getComputedStyle(e).animationName)).toBe('none');
    await joueur.getByRole('navigation', { name: 'Navigation Hub' }).getByTitle('Messages', { exact: true }).click();
    const dialogue = joueur.getByRole('dialog', { name: 'Messagerie' });
    await expect(dialogue).toBeVisible();
    await expect.poll(() => dialogue.evaluate(e => getComputedStyle(e).transform)).toBe('none');
    await capturer(joueur, format.nom + '-mouvement-reduit-joueur');
    await capturer(meneur, format.nom + '-mouvement-reduit-meneur');
    await joueur.keyboard.press('Escape');
    await expect(dialogue).toHaveCount(0);
    await meneur.getByRole('navigation', { name: 'Navigation du meneur' }).filter({ visible: true }).getByRole('button', { name: 'Dés', exact: true }).click();
    await meneur.getByRole('button', { name: 'Lancer D20' }).click();
    const resultat = meneur.getByRole('dialog', { name: 'Résultat du jet' });
    await expect(resultat).toBeVisible();
    await expect.poll(() => resultat.evaluate(e => getComputedStyle(e).transform)).toBe('none');
    // La durée fonctionnelle de quinze secondes garde sa jauge, même sans entrée animée.
    expect(await resultat.locator('.absolute.bottom-0').evaluate(e => e.getBoundingClientRect().width)).toBeGreaterThan(0);
    await capturer(meneur, format.nom + '-mouvement-reduit-resultat');
    if (format.nom === 'compact') await expect(resultat).toHaveCount(0, { timeout: 17_000 });
    else { await meneur.getByRole('button', { name: 'Fermer le résultat' }).click(); await expect(resultat).toHaveCount(0); }
});

for (const automatique of [false, true]) test(`T5 graphismes légers — ${automatique ? 'détection' : 'choix'} — compact`, async ({ context }) => {
    await regler('cyberpunk');
    const { joueur, meneur } = await ouvrir(context, FORMATS[0], !automatique, automatique);
    for (const p of [joueur, meneur]) {
        await expect(p.locator('[data-tablette]')).toHaveAttribute('data-graphismes-legers', '');
        const cible = p.getByRole('navigation').filter({ visible: true }).getByRole('button').first();
        expect((await presentation(cible)).alpha).toBe(0);
        await capturer(p, `compact-leger-${automatique ? 'auto' : 'manuel'}-${p === joueur ? 'joueur' : 'meneur'}`);
    }
});

test('T5 accent manuel du PC — focus et halos suivent sur les deux tablettes', async ({ context }) => {
    await regler('cyberpunk');
    const { joueur, meneur } = await ouvrir(context, FORMATS[0]);
    const navJ = joueur.getByRole('navigation', { name: 'Navigation Hub' });
    const navM = meneur.getByRole('navigation', { name: 'Navigation du meneur' }).filter({ visible: true });
    const direct = navJ.getByTitle('Direct', { exact: true }), pads = navM.getByRole('button', { name: 'Pads', exact: true });
    await verifierFocus(joueur, navJ.getByTitle('Archives', { exact: true }), direct);
    await verifierFocus(meneur, navM.getByRole('button', { name: 'Dés', exact: true }), pads);
    const ancien = await presentation(direct);
    const ancienAccent = await gmos.fenetre.evaluate(() => document.documentElement.style.getPropertyValue('--app-accent'));
    // Avec les personnalités, la première pastille peut être déjà la couleur
    // effective alors que le réglage stocké porte encore l'accent de base.
    await gmos.fenetre.locator('button[aria-pressed="false"]').filter({ hasText: /#[0-9a-f]{6}/i }).nth(1).click();
    await expect.poll(() => gmos.fenetre.evaluate(() => document.documentElement.style.getPropertyValue('--app-accent'))).not.toBe(ancienAccent);
    const haloDuPC = await gmos.fenetre.evaluate(() => document.documentElement.style.getPropertyValue('--app-accent-glow'));
    for (const [p, cible] of [[joueur, direct], [meneur, pads]] as const) {
        if (p === joueur) await expect.poll(async () => (await presentation(cible)).fond).not.toBe(ancien.fond);
        else await expect.poll(async () => (await presentation(cible)).couleur).not.toBe(ancien.couleur);
        // Le contrat du PC garde la teinte propre du halo du thème : elle peut
        // rester cyan quand la main choisit un autre accent pour les commandes.
        await expect.poll(() => p.evaluate(() => document.documentElement.style.getPropertyValue('--app-accent-glow'))).toBe(haloDuPC);
        expect((await presentation(cible)).alpha).toBeGreaterThan(0);
        // Le bouton plein emploie le contraste de l'accent ; le bouton sobre,
        // l'accent lui-même. Normaliser les variables en couleurs calculées.
        const couleurAttendue = await p.evaluate(joueur => {
            const temoin = document.createElement('span');
            temoin.style.color = joueur ? 'var(--app-accent-contrast)' : 'var(--app-accent)';
            document.body.append(temoin);
            const couleur = getComputedStyle(temoin).color;
            temoin.remove();
            return couleur;
        }, p === joueur);
        expect((await presentation(cible)).couleur).toBe(couleurAttendue);
        expect((await presentation(cible)).couleur).not.toBe((await presentation(cible)).fond);
        await capturer(p, `cyberpunk-accent-manuel-${p === joueur ? 'joueur' : 'meneur'}`);
    }
});
