import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

type Temoin = Window & { useSessionOSStore: typeof useSessionOSStore; ecrituresOrganisation: number };
const SORTIE = path.resolve('documentation/Planning/graphe-trame/organisation');
let gmos: GmOsLance;
const bouton = (nom: string) => gmos.fenetre.getByRole('button', { name: nom, exact: true });
const toile = () => gmos.fenetre.locator('.toile-de-trame');
async function ouvrir() {
    await attendreLHydratation(gmos);
    await gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().setCurrentView('trame'));
    await bouton('Graphe').click();
    await expect(gmos.fenetre.locator(".react-flow__node[data-id='scene:temoin-scene-3']")).toBeVisible();
}
async function etat() {
    return gmos.fenetre.evaluate(() => {
        const s = (window as Temoin).useSessionOSStore.getState();
        return { campagne: s.campaigns.find(c => c.id === s.activeCampaignId)!, actes: s.actes, scenes: s.scenes };
    });
}
async function positions() {
    return gmos.fenetre.locator('.react-flow__node').evaluateAll(elements => elements.map(el => ({ id: el.getAttribute('data-id'), transform: (el as HTMLElement).style.transform })).sort((a, b) => a.id!.localeCompare(b.id!)));
}
async function observer() {
    await gmos.fenetre.evaluate(() => {
        const w = window as Temoin; w.ecrituresOrganisation = 0;
        w.useSessionOSStore.subscribe((s, avant) => { if (s.campaigns !== avant.campaigns) w.ecrituresOrganisation++; });
    });
}
const ecritures = () => gmos.fenetre.evaluate(() => (window as Temoin).ecrituresOrganisation);
async function organiser() {
    await bouton('Organiser').click();
    await expect(bouton('Appliquer la disposition')).toBeVisible({ timeout: 25_000 });
    await expect(toile()).toHaveAttribute('data-organisation', 'apercu');
    await expect(gmos.fenetre.locator('.groupe-de-trame')).toHaveCount(2);
}
async function sansChevauchement() {
    const rectangles = await gmos.fenetre.locator('.react-flow__node').evaluateAll(elements => elements.map(el => {
        const b = el.getBoundingClientRect(); return { id: el.getAttribute('data-id'), x: b.x, y: b.y, width: b.width, height: b.height };
    }));
    for (let i = 0; i < rectangles.length; i++) for (let j = i + 1; j < rectangles.length; j++) {
        const a = rectangles[i], b = rectangles[j];
        expect(a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1, `${a.id} / ${b.id}`).toBe(true);
    }
}

test.describe('organisation automatique de la Trame', () => {
    test.setTimeout(120_000);
    test.beforeEach(async () => {
        fs.mkdirSync(SORTIE, { recursive: true }); gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 }); await ouvrir();
        await gmos.fenetre.evaluate(() => {
            const s = (window as Temoin).useSessionOSStore.getState();
            s.ajouterUnEnchainement('temoin-scene-2', 'temoin-scene-3', 'si Hale se tait');
            s.stylerLeLienDeTrame(s.activeCampaignId!, JSON.stringify(['enchainement', 'scene:temoin-scene-2', 'scene:temoin-scene-3']),
                { depart: 'bas', arrivee: 'haut', couleur: '#8b5cf6', trace: 'points', epaisseur: 'gras' });
        });
    });
    test.afterEach(async () => {
        await gmos.application.close(); fs.rmSync(gmos.profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    });

    test('l’aperçu est local ; Annuler, Échap et changer de filtre retrouvent la disposition sans écriture', async () => {
        const avant = await positions(), s = await etat(); await observer();
        await organiser(); await sansChevauchement();
        expect(await positions()).not.toEqual(avant); expect(await etat()).toEqual(s); expect(await ecritures()).toBe(0);
        const chemins = await gmos.fenetre.locator('.react-flow__edge-path').evaluateAll(elements => elements.map(el => el.getAttribute('d')));
        expect(chemins.every(d => d?.startsWith('M') && d.includes('L') && !d.includes('C'))).toBe(true);
        await bouton('Annuler l’aperçu').click(); expect(await positions()).toEqual(avant); expect(await ecritures()).toBe(0);
        await organiser(); await gmos.fenetre.keyboard.press('Escape'); expect(await positions()).toEqual(avant);
        await organiser(); await gmos.fenetre.getByRole('combobox').first().selectOption('principale');
        await expect(bouton('Appliquer la disposition')).toHaveCount(0);
        await gmos.fenetre.getByRole('combobox').first().selectOption('tout'); expect(await positions()).toEqual(avant);
        // Annuler pendant le calcul ne doit pas faire réapparaître un aperçu tardif.
        await bouton('Organiser').click(); await gmos.fenetre.keyboard.press('Escape');
        await gmos.fenetre.waitForTimeout(700); await expect(bouton('Appliquer la disposition')).toHaveCount(0);
        expect(await etat()).toEqual(s); expect(await ecritures()).toBe(0);
    });

    test('appliquer et revenir écrivent une fois, conservent le scénario et gardent les styles et jonctions', async () => {
        const avant = await positions(), s = await etat(); await observer(); await organiser();
        const apercu = await positions(); await bouton('Appliquer la disposition').click();
        await expect(toile()).toHaveAttribute('data-organisation', 'appliquee'); expect(await positions()).toEqual(apercu);
        expect(await ecritures()).toBe(1);
        const applique = await etat(); expect(applique.actes).toEqual(s.actes); expect(applique.scenes).toEqual(s.scenes);
        expect(applique.campagne.stylesDesLiensDeTrame).toEqual(s.campagne.stylesDesLiensDeTrame);
        const id = JSON.stringify(['enchainement', 'scene:temoin-scene-2', 'scene:temoin-scene-3']);
        expect(applique.campagne.organisationDeLaTrame?.trajets[id]).toMatchObject({ depart: 'bas', arrivee: 'haut', libelle: 'si Hale se tait' });
        await bouton('Disposition précédente').click(); expect(await ecritures()).toBe(2);
        expect(await positions()).toEqual(avant); expect(await etat()).toEqual(s);
        await expect(bouton('Disposition précédente')).toHaveCount(0);
    });

    test('une disposition figée revient après relance, reste propre à la campagne et garde son retour arrière', async () => {
        await bouton('Libre').click(); const avant = await positions(), s = await etat();
        await organiser(); await bouton('Appliquer la disposition').click(); await expect(bouton('Figé')).toBeVisible();
        const applique = await positions(), sauvegarde = (await etat()).campagne;
        const ancien = gmos.profil; await gmos.fenetre.waitForTimeout(1000); await gmos.application.close();
        gmos = await lancerGmOs({ preparerLeProfil: profil => fs.cpSync(ancien, profil, { recursive: true }) });
        fs.rmSync(ancien, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 }); await ouvrir();
        expect(await positions()).toEqual(applique); await expect(bouton('Figé')).toBeVisible();
        expect((await etat()).campagne.organisationDeLaTrame).toEqual(sauvegarde.organisationDeLaTrame);
        await gmos.fenetre.evaluate(() => {
            const store = (window as Temoin).useSessionOSStore, s = store.getState(), a = s.campaigns.find(c => c.id === s.activeCampaignId)!;
            store.setState({ sessions: s.sessions.map(seance => ({ ...seance, status: 'done' })),
                campaigns: [...s.campaigns, { ...a, id: 'organisation-b', name: 'B', organisationDeLaTrame: undefined, dispositionPrecedenteDeTrame: undefined }],
                actes: [...s.actes, { ...s.actes[0], id: 'organisation-acte-b', campaignId: 'organisation-b' }],
                scenes: [...s.scenes, { ...s.scenes[0], id: 'organisation-scene-b', acteId: 'organisation-acte-b', campaignId: 'organisation-b' }] });
            store.getState().setActiveCampaign('organisation-b');
        });
        await expect(gmos.fenetre.locator('.groupe-de-trame')).toHaveCount(0);
        await gmos.fenetre.evaluate(id => (window as Temoin).useSessionOSStore.getState().setActiveCampaign(id), s.campagne.id); await ouvrir();
        expect(await positions()).toEqual(applique); await bouton('Disposition précédente').click();
        expect(await positions()).toEqual(avant); expect((await etat()).campagne).toEqual(s.campagne);
    });

    test('les trois espacements et les quatre thèmes restent lisibles ; un déplacement écarte les trajets périmés', async () => {
        test.setTimeout(180_000);
        const avant = await etat(); await organiser();
        for (const densite of ['compact', 'equilibre', 'aere']) {
            await gmos.fenetre.getByLabel('Espacement de la trame').selectOption(densite);
            await expect(bouton('Appliquer la disposition')).toBeVisible({ timeout: 25_000 }); await sansChevauchement();
            await gmos.fenetre.screenshot({ path: path.join(SORTIE, `espacement-${densite}.png`) });
        }
        expect(await etat()).toEqual(avant); await bouton('Appliquer la disposition').click();
        for (const theme of ['cyberpunk', 'medieval', 'modern', 'claire']) for (const personnalites of [true, false]) {
            await gmos.fenetre.setViewportSize({ width: 1440, height: 900 });
            await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
            await gmos.fenetre.locator(`[aria-label$="${theme}"]`).click(); const b = gmos.fenetre.getByRole('switch');
            if (await b.getAttribute('aria-checked') !== String(personnalites)) await b.click(); await gmos.fenetre.keyboard.press('Escape');
            for (const [width, height] of [[1440, 900], [1180, 820], [900, 700]]) {
                await gmos.fenetre.setViewportSize({ width, height }); await bouton('Cadrer la trame').click(); await gmos.fenetre.waitForTimeout(250);
                await sansChevauchement();
                await gmos.fenetre.screenshot({ path: path.join(SORTIE, `${theme}-${personnalites ? 'personnalites' : 'base'}-${width}.png`) });
            }
        }
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 }); await bouton('Cadrer la trame').click(); await gmos.fenetre.waitForTimeout(250);
        const scene = gmos.fenetre.locator(".react-flow__node[data-id='scene:temoin-scene-2']");
        await scene.focus(); await gmos.fenetre.keyboard.press('Enter'); await gmos.fenetre.keyboard.press('ArrowDown');
        const id = JSON.stringify(['enchainement', 'scene:temoin-scene-2', 'scene:temoin-scene-3']);
        await expect(gmos.fenetre.locator(`.react-flow__edge[data-id='${id}'] .react-flow__edge-path`)).toHaveAttribute('d', /C/);
        expect((await etat()).campagne.stylesDesLiensDeTrame).toEqual(avant.campagne.stylesDesLiensDeTrame);
    });

    test('une centaine de cartes avec branches, éléments partagés et liens entre actes reste organisée sans chevauchement', async () => {
        await gmos.fenetre.evaluate(() => {
            const store = (window as Temoin).useSessionOSStore, s = store.getState();
            const entities = [...s.entities], clues = [...s.clues]; const branches: string[][] = [];
            for (let a = 0; a < 5; a++) {
                const acte = s.ajouterActe(s.activeCampaignId!, `Acte de démonstration ${a + 1}`), ids: string[] = [];
                for (let i = 0; i < 6; i++) {
                    const scene = s.ajouterScene(acte, `Piste ${a + 1}.${i + 1}`); ids.push(scene);
                    const pnj = [0, 1].map(k => `elk-pnj-${a}-${i}-${k}`), indice = `elk-indice-${a}-${i}`;
                    for (const [k, id] of pnj.entries()) entities.push({ ...s.entities[0], id, name: `Témoin ${a}.${i}.${k}`, campaignId: s.activeCampaignId! });
                    clues.push({ ...s.clues[0], id: indice, title: `Indice ${a}.${i}`, campaignId: s.activeCampaignId! });
                    s.modifierScene(scene, { entiteIds: pnj, indiceIds: [indice], lieuId: s.atlasMaps[0].id });
                }
                for (let i = 1; i < ids.length; i++) s.ajouterUnEnchainement(ids[a === 0 ? 0 : i - 1], ids[i]);
                branches.push(ids);
            }
            for (let a = 1; a < branches.length; a++) s.ajouterUnEnchainement(branches[a - 1][5], branches[a][0], 'piste suivante');
            store.setState({ entities, clues });
        });
        await gmos.fenetre.getByTitle("Jusqu'aux ambiances").click();
        await expect.poll(() => gmos.fenetre.locator('.react-flow__node').count()).toBeGreaterThan(100);
        const avant = await etat(); await observer();
        const debut = Date.now(); await bouton('Organiser').click();
        await expect(bouton('Appliquer la disposition')).toBeVisible({ timeout: 25_000 });
        await expect(gmos.fenetre.locator('.groupe-de-trame')).toHaveCount(7);
        await sansChevauchement(); expect(await etat()).toEqual(avant); expect(await ecritures()).toBe(0);
        await gmos.fenetre.waitForTimeout(250); await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'dense-apercu.png') });
        await bouton('Appliquer la disposition').click(); expect(await ecritures()).toBe(1);
        const c = (await etat()).campagne;
        fs.writeFileSync(path.join(SORTIE, 'dense.json'), JSON.stringify({ cartes: await gmos.fenetre.locator('.react-flow__node').count(),
            calculEtControleMs: Date.now() - debut, trajets: Object.keys(c.organisationDeLaTrame!.trajets).length,
            ecrituresAvantApplication: 0, ecrituresApplication: 1 }, null, 2));
    });
});
