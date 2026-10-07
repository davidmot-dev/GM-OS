import { test, expect, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

type FenetreTemoin = Window & { useSessionOSStore: typeof useSessionOSStore; ecrituresTrame: number };
const SORTIE = path.resolve('documentation/Planning/graphe-trame/G6-cartes');
let gmos: GmOsLance;
const carte = (id: string) => gmos.fenetre.locator(`.react-flow__node[data-id='${id}']`);
async function centre(cible: Locator) {
    const b = await cible.boundingBox();
    if (!b) throw new Error('cible invisible');
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
async function ouvrir(id = 'scene:temoin-scene-2') {
    await attendreLHydratation(gmos);
    await gmos.fenetre.evaluate(() => (window as FenetreTemoin).useSessionOSStore.getState().setCurrentView('trame'));
    await gmos.fenetre.getByRole('button', { name: 'Graphe', exact: true }).click();
    await expect(carte(id)).toBeVisible();
}
async function positions() {
    return gmos.fenetre.locator('.react-flow__node').evaluateAll(elements => Object.fromEntries(elements.map(el => {
        const n = el as HTMLElement, m = new DOMMatrixReadOnly(n.style.transform);
        return [n.dataset.id, { x: m.m41 + n.offsetWidth / 2, y: m.m42 + n.offsetHeight / 2 }];
    })));
}
async function campagne() {
    return gmos.fenetre.evaluate(() => {
        const s = (window as FenetreTemoin).useSessionOSStore.getState();
        return s.campaigns.find(c => c.id === s.activeCampaignId)!;
    });
}
async function compterLesEcritures() {
    await gmos.fenetre.evaluate(() => {
        const w = window as FenetreTemoin;
        w.ecrituresTrame = 0;
        w.useSessionOSStore.subscribe((s, precedent) => { if (s.campaigns !== precedent.campaigns) w.ecrituresTrame++; });
    });
}
const ecritures = () => gmos.fenetre.evaluate(() => (window as FenetreTemoin).ecrituresTrame);
async function ranger() {
    await gmos.fenetre.getByRole('button', { name: 'Ranger', exact: true }).click();
    const confirmer = gmos.fenetre.getByRole('button', { name: 'Confirmer', exact: true });
    if (await confirmer.isVisible()) await confirmer.click();
    await expect.poll(async () => Object.keys((await campagne()).noeudsEpinglesDeLaTrame ?? {}).length).toBeGreaterThan(0);
    // Le rangement a écrit ses positions ; attendre aussi son cadrage avant
    // de relever les coordonnées d'une poignée pour un glissement.
    await gmos.fenetre.waitForTimeout(250);
}
async function relier(de: string, vers: string) {
    const a = await centre(carte(de).locator('[data-handleid="sortie"]'));
    const b = await centre(carte(vers).locator('[data-handleid="entree"]'));
    await gmos.fenetre.mouse.move(a.x, a.y); await gmos.fenetre.mouse.down();
    await gmos.fenetre.mouse.move(b.x, b.y, { steps: 12 }); await gmos.fenetre.mouse.up();
}

test.describe('les cartes de Trame — garanties G3 à G6', () => {
    test.setTimeout(120_000);
    test.beforeEach(async () => {
        fs.mkdirSync(SORTIE, { recursive: true });
        gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 });
        await ouvrir();
    });
    test.afterEach(async () => {
        await gmos.application.close();
        fs.rmSync(gmos.profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    });

    test('zoom, panoramique, sélection et filtres ne sauvegardent aucune position', async () => {
        const avant = await campagne();
        await compterLesEcritures();
        await carte('scene:temoin-scene-2').click();
        await expect(gmos.fenetre.getByLabel('Inspecteur de trame')).toBeVisible();
        await gmos.fenetre.getByRole('button', { name: 'Agrandir', exact: true }).click();
        await gmos.fenetre.getByRole('button', { name: 'Réduire', exact: true }).click();
        const p = await centre(gmos.fenetre.locator('.react-flow__pane'));
        await gmos.fenetre.mouse.move(p.x, p.y + 150); await gmos.fenetre.mouse.down();
        await gmos.fenetre.mouse.move(p.x + 30, p.y + 170, { steps: 5 }); await gmos.fenetre.mouse.up();
        await gmos.fenetre.getByRole('combobox').first().selectOption('principale');
        await expect(gmos.fenetre.getByText(/Aucune scène n’est classée/)).toBeVisible();
        await gmos.fenetre.getByRole('combobox').first().selectOption('tout');
        expect(await campagne()).toEqual(avant); expect(await ecritures()).toBe(0);
    });

    test('une liaison et un cycle ne déplacent aucune carte', async () => {
        await ranger();
        const avant = await positions(), epingles = (await campagne()).noeudsEpinglesDeLaTrame;
        await gmos.fenetre.getByRole('button', { name: 'Relier', exact: true }).click();
        await relier('scene:temoin-scene-2', 'scene:temoin-scene-3');
        await relier('scene:temoin-scene-3', 'scene:temoin-scene-2');
        await expect.poll(() => gmos.fenetre.evaluate(() => {
            const s = (window as FenetreTemoin).useSessionOSStore.getState();
            return s.scenes.filter(sc => sc.id === 'temoin-scene-2' || sc.id === 'temoin-scene-3').every(sc => sc.enchainements?.length);
        })).toBe(true);
        expect(await positions()).toEqual(avant);
        expect((await campagne()).noeudsEpinglesDeLaTrame).toEqual(epingles);
        await gmos.fenetre.keyboard.press('Escape');
        await expect(gmos.fenetre.getByText(/Glisse d’une scène vers une autre/)).toHaveCount(0);
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'cycle.png') });
    });

    test('le glisser sauvegarde une fois, le détachement garde la place, Figer bloque le glisser', async () => {
        await ranger();
        await compterLesEcritures();
        const a = await centre(carte('scene:temoin-scene-2'));
        await gmos.fenetre.mouse.move(a.x, a.y); await gmos.fenetre.mouse.down();
        await gmos.fenetre.mouse.move(a.x + 35, a.y + 25, { steps: 15 });
        expect(await ecritures()).toBe(0);
        await gmos.fenetre.mouse.up();
        expect(await ecritures()).toBe(1);
        await carte('scene:temoin-scene-2').click();
        const avant = (await positions())['scene:temoin-scene-2'];
        await gmos.fenetre.getByRole('button', { name: 'Détacher', exact: true }).click();
        expect((await positions())['scene:temoin-scene-2']).toEqual(avant);
        expect((await campagne()).noeudsEpinglesDeLaTrame?.['scene:temoin-scene-2']).toBeUndefined();
        await gmos.fenetre.getByRole('button', { name: 'Libre', exact: true }).click();
        const figees = await positions();
        await carte('scene:temoin-scene-2').press('ArrowRight');
        expect(await positions()).toEqual(figees);
    });

    test('l’instantané sans épingle revient après fermeture et nouveau processus', async () => {
        await ranger();
        await carte('scene:temoin-scene-2').click();
        await gmos.fenetre.getByRole('button', { name: 'Détacher', exact: true }).click();
        await gmos.fenetre.getByRole('button', { name: 'Libre', exact: true }).click();
        const avant = await positions();
        const ancienProfil = gmos.profil;
        await gmos.fenetre.waitForTimeout(1000);
        await gmos.application.close();
        gmos = await lancerGmOs({ preparerLeProfil: nouveau => fs.cpSync(ancienProfil, nouveau, { recursive: true }) });
        fs.rmSync(ancienProfil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
        await ouvrir();
        await expect(gmos.fenetre.getByRole('button', { name: 'Figé', exact: true })).toBeVisible();
        expect(await positions()).toEqual(avant);
    });

    test('le clavier sélectionne, déplace et protège les touches de saisie et de suppression', async () => {
        await ranger();
        await compterLesEcritures();
        await carte('scene:temoin-scene-2').focus();
        await gmos.fenetre.keyboard.press('Enter');
        await expect(gmos.fenetre.getByLabel('Titre du nœud')).toHaveValue('Entretien avec Hale');
        await carte('scene:temoin-scene-2').focus();
        await gmos.fenetre.keyboard.press('ArrowRight');
        expect(await ecritures()).toBe(1);
        const p = await positions();
        await gmos.fenetre.getByLabel('Titre du nœud').focus();
        await gmos.fenetre.keyboard.press('ArrowRight');
        expect(await positions()).toEqual(p);
        await carte('scene:temoin-scene-2').focus();
        await gmos.fenetre.keyboard.press('Delete'); await gmos.fenetre.keyboard.press('Backspace');
        await expect(carte('scene:temoin-scene-2')).toBeVisible();
        await gmos.fenetre.keyboard.press('Escape');
        await expect(gmos.fenetre.getByLabel('Inspecteur de trame')).toHaveCount(0);
    });

    test('réinitialiser efface les positions et revient au rangement déterministe', async () => {
        const initiales = await positions();
        await ranger();
        await gmos.fenetre.getByRole('button', { name: 'Libre', exact: true }).click();
        await gmos.fenetre.getByRole('button', { name: 'Réinitialiser les positions', exact: true }).click();
        const c = await campagne();
        expect(c.noeudsEpinglesDeLaTrame).toBeUndefined(); expect(c.positionsDeLaTrame).toBeUndefined(); expect(c.trameFigee).toBe(false);
        await expect.poll(positions).toEqual(initiales);
    });

    test('déposer une scène sur une autre respecte la confirmation à deux zooms', async () => {
        const ordre = () => gmos.fenetre.evaluate(() => (window as FenetreTemoin).useSessionOSStore.getState().scenes
            .filter(s => s.id === 'temoin-scene-2' || s.id === 'temoin-scene-3').map(s => ({ id: s.id, ordre: s.ordre, acte: s.acteId })));
        await ranger();
        const avant = await ordre();
        for (const confirmer of [false, true]) {
            await gmos.fenetre.evaluate(() => {
                const s = (window as FenetreTemoin).useSessionOSStore.getState();
                s.epinglerDansLaTrame(s.activeCampaignId!, 'scene:temoin-scene-2', { x: -350, y: 0 });
                s.epinglerDansLaTrame(s.activeCampaignId!, 'scene:temoin-scene-3', { x: 350, y: 0 });
            });
            await gmos.fenetre.getByRole('button', { name: 'Cadrer la trame', exact: true }).click();
            if (confirmer) await gmos.fenetre.getByRole('button', { name: 'Réduire', exact: true }).click();
            await gmos.fenetre.waitForTimeout(200);
            const a = await centre(carte('scene:temoin-scene-2')), b = await centre(carte('scene:temoin-scene-3'));
            await gmos.fenetre.mouse.move(a.x, a.y); await gmos.fenetre.mouse.down();
            await gmos.fenetre.mouse.move(a.x + 3, a.y);
            await gmos.fenetre.mouse.move(b.x, b.y, { steps: 15 }); await gmos.fenetre.mouse.up();
            await expect(gmos.fenetre.getByText(/Placer .* juste après/)).toBeVisible();
            await gmos.fenetre.getByRole('button', { name: confirmer ? 'Confirmer' : 'Annuler', exact: true }).click();
            if (!confirmer) expect(await ordre()).toEqual(avant);
            else {
                const apres = await ordre();
                expect(apres.find(s => s.id === 'temoin-scene-2')!.ordre).toBeGreaterThan(apres.find(s => s.id === 'temoin-scene-3')!.ordre);
            }
        }
    });

    test('passer de campagne A à B à A ne mélange pas les positions', async () => {
        // Une séance active ramène légitimement la préparation au cockpit.
        await gmos.fenetre.evaluate(() => {
            const store = (window as FenetreTemoin).useSessionOSStore;
            store.setState({ sessions: store.getState().sessions.map(s => ({ ...s, status: 'done' })) });
        });
        await ranger();
        const avant = await positions();
        const idA = (await campagne()).id;
        await gmos.fenetre.evaluate(() => {
            const store = (window as FenetreTemoin).useSessionOSStore, s = store.getState();
            const a = s.campaigns.find(c => c.id === s.activeCampaignId)!;
            store.setState({ campaigns: [...s.campaigns, { ...a, id: 'g6-b', name: 'Trame B', noeudsEpinglesDeLaTrame: undefined }],
                actes: [...s.actes, { ...s.actes[0], id: 'g6-acte-b', campaignId: 'g6-b' }],
                scenes: [...s.scenes, { ...s.scenes[0], id: 'g6-scene-b', acteId: 'g6-acte-b' }] });
            store.getState().setActiveCampaign('g6-b');
        });
        await ouvrir('scene:g6-scene-b');
        await expect(carte('scene:g6-scene-b')).toBeVisible();
        await expect(carte('scene:temoin-scene-2')).toHaveCount(0);
        await gmos.fenetre.evaluate(id => (window as FenetreTemoin).useSessionOSStore.getState().setActiveCampaign(id), idA);
        await ouvrir();
        await expect(carte('scene:temoin-scene-2')).toBeVisible();
        expect(await positions()).toEqual(avant);
    });

    test('la sélection disparaît après suppression ou filtrage du nœud', async () => {
        await carte('scene:temoin-scene-2').click();
        await gmos.fenetre.getByRole('button', { name: 'Supprimer', exact: true }).click();
        await gmos.fenetre.getByRole('button', { name: 'Annuler', exact: true }).click();
        await expect(carte('scene:temoin-scene-2')).toBeVisible();
        await gmos.fenetre.getByRole('button', { name: 'Supprimer', exact: true }).click();
        await gmos.fenetre.getByRole('button', { name: 'Confirmer', exact: true }).click();
        await expect(carte('scene:temoin-scene-2')).toHaveCount(0);
        await expect(gmos.fenetre.getByLabel('Inspecteur de trame')).toHaveCount(0);
    });

    test('quatre thèmes, deux personnalités et trois formats — titres et inspecteur lisibles', async () => {
        test.setTimeout(180_000);
        await carte('scene:temoin-scene-2').click();
        await gmos.fenetre.getByLabel('Titre du nœud').fill('Entretien avec Hale : une révélation très longue à lire dans son intégralité');
        const avant = await positions();
        const mesures: unknown[] = [];
        for (const theme of ['cyberpunk', 'medieval', 'modern', 'claire']) for (const personnalites of [true, false]) {
            await gmos.fenetre.setViewportSize({ width: 1440, height: 900 });
            await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
            await gmos.fenetre.locator(`[aria-label$="${theme}"]`).click();
            const bouton = gmos.fenetre.getByRole('switch');
            if (await bouton.getAttribute('aria-checked') !== String(personnalites)) await bouton.click();
            await gmos.fenetre.keyboard.press('Escape');
            for (const [width, height] of [[1440, 900], [1180, 820], [900, 700]]) {
                await gmos.fenetre.setViewportSize({ width, height });
                // Attendre le ResizeObserver du moteur avant le cadrage demandé.
                await gmos.fenetre.waitForTimeout(200);
                await gmos.fenetre.getByRole('button', { name: 'Cadrer la trame', exact: true }).click();
                await gmos.fenetre.waitForTimeout(250);
                await expect(gmos.fenetre.getByLabel('Titre du nœud')).toHaveValue('Entretien avec Hale : une révélation très longue à lire dans son intégralité');
                const panneau = await gmos.fenetre.getByLabel('Inspecteur de trame').boundingBox();
                const toile = await gmos.fenetre.locator('.toile-de-trame').boundingBox();
                expect(panneau!.x + panneau!.width).toBeLessThanOrEqual(width + 1);
                expect(panneau!.y + panneau!.height).toBeLessThanOrEqual(height + 1);
                expect(toile!.height).toBeGreaterThan(99);
                expect(panneau!.x >= toile!.x + toile!.width - 1 || panneau!.y >= toile!.y + toile!.height - 1).toBe(true);
                expect(await positions()).toEqual(avant);
                await gmos.fenetre.screenshot({ path: path.join(SORTIE, `${theme}-${personnalites ? 'personnalites' : 'base'}-${width}.png`) });
                mesures.push({ theme, personnalites, width, height, panneau, toile });
            }
        }
        fs.writeFileSync(path.join(SORTIE, 'formats.json'), JSON.stringify(mesures, null, 2));
    });

    test('une trame dense et une constellation se rangent sans chevauchement', async () => {
        const temps = await gmos.fenetre.evaluate(() => {
            const debut = performance.now(), store = (window as FenetreTemoin).useSessionOSStore, s = store.getState();
            const entities = [...s.entities], clues = [...s.clues];
            for (let a = 0; a < 5; a++) {
                const acte = s.ajouterActe(s.activeCampaignId!, `Acte de démonstration ${a + 1}`);
                const ids: string[] = [];
                for (let i = 0; i < 6; i++) {
                    const scene = s.ajouterScene(acte, `Piste ${a + 1}.${i + 1}`); ids.push(scene);
                    const pnj = [0, 1].map(k => `g6-pnj-${a}-${i}-${k}`), indice = `g6-indice-${a}-${i}`;
                    for (const [k, id] of pnj.entries()) entities.push({ ...s.entities[0], id, name: `Témoin ${a}.${i}.${k}`, campaignId: s.activeCampaignId! });
                    clues.push({ ...s.clues[0], id: indice, title: `Indice ${a}.${i}`, campaignId: s.activeCampaignId! });
                    s.modifierScene(scene, { entiteIds: pnj, indiceIds: [indice], lieuId: s.atlasMaps[0].id });
                }
                for (let i = 1; i < ids.length; i++) s.ajouterUnEnchainement(ids[a === 0 ? 0 : i - 1], ids[i]);
            }
            store.setState({ entities, clues });
            return performance.now() - debut;
        });
        await gmos.fenetre.getByTitle("Jusqu'aux ambiances").click();
        await ranger();
        const rectangles = await gmos.fenetre.locator('.react-flow__node').evaluateAll(elements => elements.map(el => {
            const n = el as HTMLElement, m = new DOMMatrixReadOnly(n.style.transform);
            return { id: n.dataset.id, x: m.m41, y: m.m42, w: n.offsetWidth, h: n.offsetHeight };
        }));
        expect(rectangles.length).toBeGreaterThan(100);
        for (let i = 0; i < rectangles.length; i++) for (let j = i + 1; j < rectangles.length; j++) {
            const a = rectangles[i], b = rectangles[j];
            expect(a.x + a.w <= b.x + 1 || b.x + b.w <= a.x + 1 || a.y + a.h <= b.y + 1 || b.y + b.h <= a.y + 1, `${a.id} recouvre ${b.id}`).toBe(true);
        }
        await compterLesEcritures();
        await gmos.fenetre.getByRole('button', { name: 'Agrandir', exact: true }).click();
        await gmos.fenetre.waitForTimeout(250);
        expect(await ecritures()).toBe(0);
        // Zoomer peut sortir le PNJ de la première scène de la toile. Tester
        // une carte effectivement atteignable, hors des boutons de cadrage.
        const pnj = await gmos.fenetre.locator(".react-flow__node[data-id^='pnj:']").evaluateAll(elements => {
            const toile = document.querySelector('.toile-de-trame')!.getBoundingClientRect();
            return elements.find(el => {
                const b = el.getBoundingClientRect(), x = b.x + b.width / 2, y = b.y + b.height / 2;
                return x > toile.left + 40 && x < toile.right - 40 && y > toile.top + 40 && y < toile.bottom - 40
                    && document.elementFromPoint(x, y)?.closest('.react-flow__node') === el;
            })?.getAttribute('data-id');
        });
        expect(pnj).toBeTruthy();
        const mutation = await gmos.fenetre.evaluate(id => {
            const cible = [...document.querySelectorAll('.react-flow__node')].find(n => n.getAttribute('data-id') === id)!.querySelector('article')!;
            const w = window as Window & { mutationsCartes?: number };
            w.mutationsCartes = 0;
            new MutationObserver(m => { w.mutationsCartes! += m.filter(x => x.type === 'childList' || x.type === 'characterData').length; })
                .observe(cible, { childList: true, characterData: true, subtree: true });
            return performance.now();
        }, pnj);
        const cible = await centre(carte(pnj!));
        await gmos.fenetre.mouse.move(cible.x, cible.y); await gmos.fenetre.mouse.down();
        await gmos.fenetre.mouse.move(cible.x + 3, cible.y);
        await gmos.fenetre.mouse.move(cible.x + 15, cible.y + 12, { steps: 20 });
        expect(await ecritures()).toBe(0);
        await gmos.fenetre.mouse.up();
        expect(await ecritures()).toBe(1);
        const mesure = await gmos.fenetre.evaluate(debut => ({
            dureeDuGesteMs: performance.now() - debut,
            mutationsDuContenuPendantGlisser: (window as Window & { mutationsCartes?: number }).mutationsCartes,
        }), mutation);
        expect(mesure.mutationsDuContenuPendantGlisser).toBe(0);
        await gmos.fenetre.getByRole('button', { name: 'Cadrer la trame', exact: true }).click();
        await gmos.fenetre.waitForTimeout(250);
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'dense-constellation.png') });
        fs.writeFileSync(path.join(SORTIE, 'dense.json'), JSON.stringify({ noeuds: rectangles.length, semenceMs: temps,
            ecrituresPendantZoom: 0, ecrituresAuLacher: await ecritures(), ...mesure }, null, 2));
    });

    test('un glisser annulé dans le vide et un couple incompatible n’écrivent rien', async () => {
        await ranger();
        const avant = await campagne();
        await compterLesEcritures();
        await gmos.fenetre.getByRole('button', { name: 'Relier', exact: true }).click();
        const a = await centre(carte('scene:temoin-scene-2').locator('[data-handleid="sortie"]'));
        await gmos.fenetre.mouse.move(a.x, a.y); await gmos.fenetre.mouse.down();
        await gmos.fenetre.mouse.move(a.x + 25, a.y + 30, { steps: 5 }); await gmos.fenetre.mouse.up();
        await relier('acte:temoin-acte-1', 'scene:temoin-scene-2');
        await expect(gmos.fenetre.getByText(/Un acte ne se relie pas/)).toBeVisible();
        expect(await campagne()).toEqual(avant); expect(await ecritures()).toBe(0);
    });

    test('mouvement réduit et mode léger conservent le cadrage et la sélection', async () => {
        await gmos.fenetre.emulateMedia({ reducedMotion: 'reduce' });
        await gmos.fenetre.evaluate(() => localStorage.setItem('gmos-performance-storage', JSON.stringify({ state: { isLowGraphics: true, autoPerformanceEnabled: false }, version: 0 })));
        await gmos.fenetre.reload(); await ouvrir();
        await carte('scene:temoin-scene-2').click();
        await expect(gmos.fenetre.locator('.toile-de-trame')).toHaveAttribute('data-graphismes-legers', 'true');
        await gmos.fenetre.getByRole('button', { name: 'Cadrer la trame', exact: true }).click();
        await expect(carte('scene:temoin-scene-2').locator('article')).toHaveAttribute('data-selection', 'true');
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'leger-mouvement-reduit.png') });
    });
});
