import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

type Temoin = Window & { useSessionOSStore: typeof useSessionOSStore; ecrituresStyles: number };
const ID = JSON.stringify(['enchainement', 'scene:temoin-scene-2', 'scene:temoin-scene-3']);
const SORTIE = path.resolve('documentation/Planning/graphe-trame/edition-liens');
let gmos: GmOsLance;
const lien = () => gmos.fenetre.locator(`.react-flow__edge[data-id='${ID}']`);
const trait = () => lien().locator('.react-flow__edge-path');
const bouton = (nom: string) => gmos.fenetre.getByRole('button', { name: nom, exact: true });
const ACCROCHES: Record<string, string> = { haut: 'haut', bas: 'bas', gauche: 'entree', droite: 'sortie' };
async function verifierLesJonctions(depart: string, arrivee: string) {
    for (const [id, cote, debut] of [['scene:temoin-scene-2', depart, true], ['scene:temoin-scene-3', arrivee, false]] as const) {
        await expect.poll(async () => {
            const cible = await gmos.fenetre.locator(`.react-flow__node[data-id='${id}'] [data-handleid='${ACCROCHES[cote]}']`).boundingBox();
            const point = await trait().evaluate((el: SVGPathElement, premier) => {
                const p = el.getPointAtLength(premier ? 0 : el.getTotalLength()), m = el.getScreenCTM()!;
                return { x: p.x * m.a + p.y * m.c + m.e, y: p.x * m.b + p.y * m.d + m.f };
            }, debut);
            const x = cible!.x + (cote === 'gauche' ? 0 : cote === 'droite' ? cible!.width : cible!.width / 2);
            const y = cible!.y + (cote === 'haut' ? 0 : cote === 'bas' ? cible!.height : cible!.height / 2);
            return Math.hypot(point.x - x, point.y - y);
        }).toBeLessThan(1);
    }
}
async function glisserUneJonction(extremite: string, carte: string, cote: string) {
    // L'inspecteur réduit la toile sans changer le cadrage : ramener les deux
    // cartes dans la zone visible avant le geste, plutôt que viser son panneau.
    await bouton('Cadrer la trame').click(); await gmos.fenetre.waitForTimeout(250);
    const origine = await lien().locator(`.react-flow__edgeupdater-${extremite}`).boundingBox();
    const cible = await gmos.fenetre.locator(`.react-flow__node[data-id='${carte}'] [data-handleid='${ACCROCHES[cote]}']`).boundingBox();
    await gmos.fenetre.mouse.move(origine!.x + origine!.width / 2, origine!.y + origine!.height / 2);
    await gmos.fenetre.mouse.down();
    await gmos.fenetre.mouse.move(cible!.x + cible!.width / 2, cible!.y + cible!.height / 2, { steps: 15 });
    await gmos.fenetre.mouse.up();
}
async function ouvrir() {
    await attendreLHydratation(gmos);
    await gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().setCurrentView('trame'));
    await bouton('Graphe').click();
    await expect(gmos.fenetre.locator(".react-flow__node[data-id='scene:temoin-scene-3']")).toBeVisible();
}
async function choisir() { await lien().focus(); await gmos.fenetre.keyboard.press('Enter'); await expect(gmos.fenetre.getByLabel('Inspecteur de lien')).toBeVisible(); }
async function campagne() {
    return gmos.fenetre.evaluate(() => {
        const s = (window as Temoin).useSessionOSStore.getState();
        return s.campaigns.find(c => c.id === s.activeCampaignId)!;
    });
}
async function positions() {
    return gmos.fenetre.locator('.react-flow__node').evaluateAll(elements => elements.map(el => ({ id: el.getAttribute('data-id'), transform: (el as HTMLElement).style.transform })));
}
async function observer() {
    await gmos.fenetre.evaluate(() => {
        const w = window as Temoin; w.ecrituresStyles = 0;
        w.useSessionOSStore.subscribe((s, avant) => { if (s.campaigns !== avant.campaigns) w.ecrituresStyles++; });
    });
}
const ecritures = () => gmos.fenetre.evaluate(() => (window as Temoin).ecrituresStyles);
async function personnaliser() {
    await gmos.fenetre.getByLabel('Tracé du lien', { exact: true }).selectOption('points');
    await gmos.fenetre.getByLabel('Épaisseur du lien', { exact: true }).selectOption('gras');
    await gmos.fenetre.getByLabel('Couleur du lien', { exact: true }).selectOption('personnalisee');
    await gmos.fenetre.getByLabel('Valeur hexadécimale', { exact: true }).fill('#8b5cf6');
}

test.describe('les styles des liens de Trame', () => {
    test.setTimeout(120_000);
    test.beforeEach(async () => {
        fs.mkdirSync(SORTIE, { recursive: true });
        gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 });
        await ouvrir();
        // Le signal de persistance précède parfois l'import de la semence : créer
        // la branche après que les scènes du témoin sont réellement à l'écran.
        await gmos.fenetre.evaluate(() => {
            const s = (window as Temoin).useSessionOSStore.getState();
            s.ajouterUnEnchainement('temoin-scene-2', 'temoin-scene-3', 'si Hale se tait');
        });
        await expect(lien()).toBeVisible();
    });
    test.afterEach(async () => {
        await gmos.application.close();
        fs.rmSync(gmos.profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    });

    test('cliquer un trait ouvre son inspecteur et l’aperçu s’enregistre une fois, sans déplacer ni relier', async () => {
        const point = await lien().locator('.react-flow__edge-interaction').evaluate((el: SVGPathElement) => {
            const p = el.getPointAtLength(el.getTotalLength() / 2);
            const m = el.getScreenCTM()!; return { x: p.x * m.a + p.y * m.c + m.e, y: p.x * m.b + p.y * m.d + m.f };
        });
        const avant = await positions(), c = await campagne(); await observer();
        await gmos.fenetre.mouse.click(point.x, point.y);
        await expect(gmos.fenetre.getByLabel('Inspecteur de lien')).toBeVisible();
        await personnaliser();
        await expect(trait()).toHaveCSS('stroke', 'rgb(139, 92, 246)');
        await expect(trait()).toHaveCSS('stroke-width', '4px');
        await expect(trait()).toHaveCSS('stroke-dasharray', '1px, 6px');
        expect(await ecritures()).toBe(0); expect(await campagne()).toEqual(c);
        await bouton('Appliquer').click(); expect(await ecritures()).toBe(1);
        expect((await campagne()).stylesDesLiensDeTrame?.[ID]).toEqual({ trace: 'points', epaisseur: 'gras', couleur: '#8b5cf6' });
        expect(await positions()).toEqual(avant);
        await expect(lien().locator('.react-flow__edge-text')).toHaveText('si Hale se tait');
        await expect.poll(() => gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().scenes.find(s => s.id === 'temoin-scene-2')?.enchainements))
            .toEqual([{ vers: 'temoin-scene-3', libelle: 'si Hale se tait' }]);
        // Le marqueur de cette flèche reprend bien la couleur du trait.
        const couleurFleche = await trait().evaluate(el => {
            const url = el.getAttribute('marker-end')!;
            const id = url.slice(url.indexOf('#') + 1).replace(/[)'"\s]+$/g, '');
            return getComputedStyle(document.getElementById(id)!.querySelector('polyline')!).stroke;
        });
        expect(couleurFleche).toBe('rgb(139, 92, 246)');
    });

    test('les douze combinaisons de tracé et d’épaisseur restent indépendantes ; le retour au thème ne touche qu’au style', async () => {
        await choisir(); const avant = await positions();
        for (const [trace, dash] of [['continu', 'none'], ['tirets', '10px, 6px'], ['points', '1px, 6px']])
            for (const [epaisseur, largeur] of [['fin', '1px'], ['normal', '2.5px'], ['gras', '4px'], ['tres-gras', '6px']]) {
                await gmos.fenetre.getByLabel('Tracé du lien', { exact: true }).selectOption(trace);
                await gmos.fenetre.getByLabel('Épaisseur du lien', { exact: true }).selectOption(epaisseur);
                await expect(trait()).toHaveCSS('stroke-width', largeur); await expect(trait()).toHaveCSS('stroke-dasharray', dash);
            }
        await bouton('Appliquer').click();
        await bouton('Ranger').click();
        if (await bouton('Confirmer').isVisible()) await bouton('Confirmer').click();
        expect((await campagne()).stylesDesLiensDeTrame?.[ID]?.epaisseur).toBe('tres-gras');
        const rangees = await positions();
        await bouton('Revenir au style du thème').click();
        expect((await campagne()).stylesDesLiensDeTrame).toBeUndefined();
        expect(await positions()).toEqual(rangees);
        await expect(trait()).toHaveCSS('stroke-width', '2.5px'); await expect(trait()).toHaveCSS('stroke-dasharray', 'none');
        expect(avant.length).toBe(rangees.length);
    });

    test('annuler, Échap, les couleurs invalides et les filtres n’enregistrent pas un aperçu', async () => {
        await choisir(); await observer(); const initial = await trait().evaluate(el => getComputedStyle(el).stroke);
        await personnaliser();
        await gmos.fenetre.getByLabel('Valeur hexadécimale', { exact: true }).fill('accent');
        await expect(bouton('Appliquer')).toBeDisabled(); await expect(gmos.fenetre.getByRole('alert')).toBeVisible();
        await bouton('Annuler les réglages').click(); await expect(trait()).toHaveCSS('stroke', initial);
        await personnaliser(); await gmos.fenetre.keyboard.press('Escape');
        await expect(gmos.fenetre.getByLabel('Inspecteur de lien')).toHaveCount(0);
        await expect(trait()).toHaveCSS('stroke', initial);
        await choisir(); await personnaliser();
        await gmos.fenetre.getByRole('combobox').first().selectOption('principale');
        await expect(gmos.fenetre.getByLabel('Inspecteur de lien')).toHaveCount(0);
        await gmos.fenetre.getByRole('combobox').first().selectOption('tout');
        await expect(trait()).toHaveCSS('stroke', initial); expect(await ecritures()).toBe(0);
    });

    test('le style revient dans un nouveau processus et reste propre à la campagne après A → B → A', async () => {
        await choisir(); await personnaliser();
        await gmos.fenetre.getByLabel('Côté de départ', { exact: true }).selectOption('bas');
        await gmos.fenetre.getByLabel('Côté d’arrivée', { exact: true }).selectOption('haut');
        await bouton('Appliquer').click();
        const idA = (await campagne()).id, sauvegarde = (await campagne()).stylesDesLiensDeTrame;
        const ancienProfil = gmos.profil; await gmos.fenetre.waitForTimeout(1000); await gmos.application.close();
        gmos = await lancerGmOs({ preparerLeProfil: nouveau => fs.cpSync(ancienProfil, nouveau, { recursive: true }) });
        fs.rmSync(ancienProfil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 }); await ouvrir();
        await expect(trait()).toHaveCSS('stroke', 'rgb(139, 92, 246)');
        await verifierLesJonctions('bas', 'haut');
        await gmos.fenetre.evaluate(() => {
            const store = (window as Temoin).useSessionOSStore, s = store.getState();
            const a = s.campaigns.find(c => c.id === s.activeCampaignId)!;
            store.setState({ sessions: s.sessions.map(seance => ({ ...seance, status: 'done' })),
                campaigns: [...s.campaigns, { ...a, id: 'style-b', name: 'B', stylesDesLiensDeTrame: undefined }],
                actes: [...s.actes, { ...s.actes[0], id: 'style-acte-b', campaignId: 'style-b' }],
                scenes: [...s.scenes, { ...s.scenes[0], id: 'style-scene-b', acteId: 'style-acte-b', campaignId: 'style-b' }] });
            store.getState().setActiveCampaign('style-b');
        });
        expect((await campagne()).stylesDesLiensDeTrame).toBeUndefined();
        await gmos.fenetre.evaluate(id => (window as Temoin).useSessionOSStore.getState().setActiveCampaign(id), idA);
        await ouvrir(); expect((await campagne()).stylesDesLiensDeTrame).toEqual(sauvegarde);
        await expect(trait()).toHaveCSS('stroke', 'rgb(139, 92, 246)');
        await verifierLesJonctions('bas', 'haut');
    });

    test('les seize couples de côtés sont prévisualisés, annulables et conservés sans changer les cartes reliées', async () => {
        await choisir(); const avant = await positions(), initial = await campagne(); await observer();
        for (const depart of ['haut', 'bas', 'gauche', 'droite']) for (const arrivee of ['haut', 'bas', 'gauche', 'droite']) {
            await gmos.fenetre.getByLabel('Côté de départ', { exact: true }).selectOption(depart);
            await gmos.fenetre.getByLabel('Côté d’arrivée', { exact: true }).selectOption(arrivee);
            await verifierLesJonctions(depart, arrivee);
        }
        expect(await campagne()).toEqual(initial); expect(await ecritures()).toBe(0);
        await bouton('Annuler les réglages').click(); await verifierLesJonctions('droite', 'gauche');
        await gmos.fenetre.getByLabel('Côté de départ', { exact: true }).selectOption('bas');
        await gmos.fenetre.getByLabel('Côté d’arrivée', { exact: true }).selectOption('haut');
        await personnaliser(); await bouton('Appliquer').click();
        expect(await ecritures()).toBe(1);
        await bouton('Revenir au style du thème').click();
        expect((await campagne()).stylesDesLiensDeTrame?.[ID]).toEqual({ depart: 'bas', arrivee: 'haut' });
        await verifierLesJonctions('bas', 'haut');
        await bouton('Revenir aux jonctions par défaut').click(); await verifierLesJonctions('droite', 'gauche');
        await bouton('Annuler les réglages').click(); await verifierLesJonctions('bas', 'haut');
        await bouton('Fermer la sélection').click(); await choisir();
        expect(await positions()).toEqual(avant);
        expect((await campagne()).positionsDeLaTrame).toEqual(initial.positionsDeLaTrame);
        await bouton('Cadrer la trame').click(); await gmos.fenetre.waitForTimeout(250);
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'jonctions-haut-bas-1440.png') });
        await gmos.fenetre.setViewportSize({ width: 900, height: 700 });
        await bouton('Cadrer la trame').click(); await gmos.fenetre.waitForTimeout(250);
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'jonctions-haut-bas-900.png') });
    });

    test('glisser les deux extrémités change leurs côtés ; un dépôt ailleurs ne rebranche ni ne supprime', async () => {
        await choisir(); await personnaliser(); const avant = await positions(), initial = await campagne(); await observer();
        await glisserUneJonction('target', 'scene:temoin-scene-3', 'haut');
        await verifierLesJonctions('droite', 'haut');
        await expect(gmos.fenetre.getByLabel('Côté d’arrivée', { exact: true })).toHaveValue('haut');
        await expect(gmos.fenetre.getByLabel('Couleur du lien', { exact: true })).toHaveValue('personnalisee');
        await glisserUneJonction('source', 'scene:temoin-scene-2', 'bas');
        await verifierLesJonctions('bas', 'haut');
        const enchainements = await gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().scenes.find(s => s.id === 'temoin-scene-2')?.enchainements);
        await glisserUneJonction('target', 'scene:temoin-scene-1', 'bas');
        await verifierLesJonctions('bas', 'haut');
        expect(await campagne()).toEqual(initial); expect(await ecritures()).toBe(0);
        expect(await positions()).toEqual(avant);
        await bouton('Appliquer').click(); expect(await ecritures()).toBe(1);
        expect((await campagne()).stylesDesLiensDeTrame?.[ID]).toMatchObject({ depart: 'bas', arrivee: 'haut', couleur: '#8b5cf6', trace: 'points', epaisseur: 'gras' });
        expect(await gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().scenes.find(s => s.id === 'temoin-scene-2')?.enchainements)).toEqual(enchainements);
        await bouton('Revenir aux jonctions par défaut').click(); await gmos.fenetre.keyboard.press('Escape');
        await verifierLesJonctions('bas', 'haut');
    });

    test('retirer depuis l’inspecteur demande confirmation et enlève le lien et son style', async () => {
        await choisir(); await personnaliser(); await bouton('Appliquer').click();
        await bouton('Retirer le lien').click(); await bouton('Annuler').click(); await expect(lien()).toBeVisible();
        await bouton('Retirer le lien').click(); await bouton('Confirmer').click();
        await expect(lien()).toHaveCount(0); expect((await campagne()).stylesDesLiensDeTrame).toBeUndefined();
        await expect(gmos.fenetre.getByLabel('Inspecteur de lien')).toHaveCount(0);
    });

    test('palette vivante et couleur personnalisée sur quatre thèmes, deux personnalités et trois formats', async () => {
        test.setTimeout(180_000); await choisir();
        await gmos.fenetre.getByLabel('Couleur du lien', { exact: true }).selectOption('accent'); await bouton('Appliquer').click();
        const avant = await positions(); const teintes = new Set<string>();
        for (const theme of ['cyberpunk', 'medieval', 'modern', 'claire']) for (const personnalites of [true, false]) {
            await gmos.fenetre.setViewportSize({ width: 1440, height: 900 });
            await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
            await gmos.fenetre.locator(`[aria-label$="${theme}"]`).click();
            const b = gmos.fenetre.getByRole('switch');
            if (await b.getAttribute('aria-checked') !== String(personnalites)) await b.click();
            await gmos.fenetre.keyboard.press('Escape');
            await bouton('Annuler les réglages').click();
            teintes.add(await trait().evaluate(el => getComputedStyle(el).stroke));
            expect((await campagne()).stylesDesLiensDeTrame?.[ID]?.couleur).toBe('accent');
            await personnaliser();
            for (const [width, height] of [[1440, 900], [1180, 820], [900, 700]]) {
                await gmos.fenetre.setViewportSize({ width, height }); await gmos.fenetre.waitForTimeout(200);
                await bouton('Cadrer la trame').click(); await gmos.fenetre.waitForTimeout(200);
                await expect(trait()).toHaveCSS('stroke', 'rgb(139, 92, 246)');
                const panneau = await gmos.fenetre.getByLabel('Inspecteur de lien').boundingBox();
                const toile = await gmos.fenetre.locator('.toile-de-trame').boundingBox();
                expect(panneau!.x + panneau!.width).toBeLessThanOrEqual(width + 1);
                expect(panneau!.y + panneau!.height).toBeLessThanOrEqual(height + 1);
                expect(panneau!.x >= toile!.x + toile!.width - 1 || panneau!.y >= toile!.y + toile!.height - 1).toBe(true);
                expect(await positions()).toEqual(avant);
                await gmos.fenetre.getByLabel('Inspecteur de lien').evaluate(el => { el.scrollTop = 0; });
                await gmos.fenetre.screenshot({ path: path.join(SORTIE, `${theme}-${personnalites ? 'personnalites' : 'base'}-${width}.png`) });
            }
        }
        expect(teintes.size).toBeGreaterThan(1);
    });
});
