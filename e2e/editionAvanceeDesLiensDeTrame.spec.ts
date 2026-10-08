import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

type Temoin = Window & { useSessionOSStore: typeof useSessionOSStore };
const ID = JSON.stringify(['enchainement', 'scene:temoin-scene-2', 'scene:temoin-scene-3']);
const SORTIE = path.resolve('documentation/Planning/graphe-trame/edition-avancee');
let gmos: GmOsLance;
const bouton = (nom: string) => gmos.fenetre.getByRole('button', { name: nom, exact: true });
const lien = () => gmos.fenetre.locator(`.react-flow__edge[data-id='${ID}']`);
const style = () => gmos.fenetre.evaluate(id => {
    const s = (window as Temoin).useSessionOSStore.getState();
    return s.campaigns.find(c => c.id === s.activeCampaignId)?.stylesDesLiensDeTrame?.[id];
}, ID);
async function choisir() { await lien().focus(); await gmos.fenetre.keyboard.press('Enter'); }

test.describe('édition avancée des liens de Trame', () => {
    test.setTimeout(120_000);
    test.beforeEach(async () => {
        fs.mkdirSync(SORTIE, { recursive: true });
        gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 });
        await attendreLHydratation(gmos);
        await gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().setCurrentView('trame'));
        await bouton('Graphe').click();
        await expect(gmos.fenetre.locator(".react-flow__node[data-id='scene:temoin-scene-3']")).toBeVisible();
        await gmos.fenetre.evaluate(() => {
            const s = (window as Temoin).useSessionOSStore.getState();
            s.ajouterUnEnchainement('temoin-scene-2', 'temoin-scene-3', 'si Hale se tait');
        });
        await choisir();
    });
    test.afterEach(async () => { await gmos.fermer(); });

    test('commentaire en aperçu, annulation, application et retour au graphe', async () => {
        const commentaire = gmos.fenetre.getByLabel('Commentaire du lien', { exact: true });
        await commentaire.fill('Attention : passage secret <b>à garder</b>');
        await expect(lien().locator('.react-flow__edge-text')).toContainText('passage secret <b>à garder</b>');
        expect(await style()).toBeUndefined();
        await bouton('Annuler les réglages').click(); await expect(commentaire).toHaveValue('');
        await commentaire.fill('Passage secret'); await bouton('Appliquer').click();
        expect(await style()).toMatchObject({ commentaire: 'Passage secret' });
        await bouton('Arbre').click(); await bouton('Graphe').click(); await choisir();
        await expect(commentaire).toHaveValue('Passage secret');
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'commentaire.png') });
    });

    test('les points latéraux se choisissent au clic et au clavier sans modifier le lien narratif', async () => {
        await gmos.fenetre.getByLabel('Afficher les trois points par côté', { exact: true }).check();
        const carte = gmos.fenetre.locator(".react-flow__node[data-id='scene:temoin-scene-2']");
        await carte.locator('[data-handleid="haut-1"]').click();
        await expect(gmos.fenetre.getByLabel('Côté de départ', { exact: true })).toHaveValue('haut');
        await expect(gmos.fenetre.getByLabel('Point de départ', { exact: true })).toHaveValue('1');
        const cible = gmos.fenetre.locator(".react-flow__node[data-id='scene:temoin-scene-3'] [data-handleid='bas-3']");
        await cible.focus(); await gmos.fenetre.keyboard.press('Space');
        await expect(gmos.fenetre.getByLabel('Point d’arrivée', { exact: true })).toHaveValue('3');
        expect(await style()).toBeUndefined();
        await bouton('Appliquer').click();
        expect(await style()).toMatchObject({ depart: 'haut', arrivee: 'bas', pointDepart: 1, pointArrivee: 3 });
        await expect.poll(() => gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().scenes.find(s => s.id === 'temoin-scene-2')?.enchainements))
            .toEqual([{ vers: 'temoin-scene-3', libelle: 'si Hale se tait' }]);
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'accroches.png') });
    });

    test('déplacer et supprimer les points ne sauvegarde qu’après Appliquer et conserve les autres réglages', async () => {
        await gmos.fenetre.getByLabel('Commentaire du lien', { exact: true }).fill('Contourner les scènes');
        await gmos.fenetre.getByLabel('Épaisseur du lien', { exact: true }).selectOption('gras');
        await bouton('Ajouter un point de passage').click();
        const point = lien().getByRole('button', { name: 'Point de passage 1', exact: true });
        await expect(point).toBeVisible();
        const avant = await point.getAttribute('cy');
        await point.focus(); await gmos.fenetre.keyboard.press('ArrowDown');
        await expect(point).toHaveAttribute('cy', String(Number(avant) + 10));
        const boite = (await point.boundingBox())!;
        await gmos.fenetre.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
        await gmos.fenetre.mouse.down(); await gmos.fenetre.mouse.move(boite.x + boite.width / 2 + 40, boite.y + boite.height / 2 + 20, { steps: 10 }); await gmos.fenetre.mouse.up();
        expect(Number(await point.getAttribute('cy'))).toBeGreaterThan(Number(avant) + 10);
        expect(await style()).toBeUndefined();
        await bouton('Appliquer').click();
        const conserve = await style(); expect(conserve?.pointsDePassage).toHaveLength(1);
        expect(conserve).toMatchObject({ commentaire: 'Contourner les scènes', epaisseur: 'gras' });
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'trajet-manuel.png') });
        await point.focus(); await gmos.fenetre.keyboard.press('Delete'); await expect(point).toHaveCount(0);
        expect(await style()).toEqual(conserve);
        await bouton('Annuler les réglages').click(); await expect(point).toBeVisible();
        await bouton('Revenir au trajet automatique').click(); await bouton('Appliquer').click();
        expect(await style()).toEqual({ commentaire: 'Contourner les scènes', epaisseur: 'gras' });
        await gmos.fenetre.setViewportSize({ width: 900, height: 700 });
        await bouton('Cadrer la trame').click();
        await gmos.fenetre.getByLabel('Inspecteur de lien').evaluate(el => { el.scrollTop = 0; });
        await gmos.fenetre.waitForTimeout(200);
        await gmos.fenetre.screenshot({ path: path.join(SORTIE, 'inspecteur-900.png') });
    });

    test('une poignée suit toute la souris dans les quatre directions et garde le focus au clavier', async () => {
        await bouton('Ajouter un point de passage').click();
        const point = lien().getByRole('button', { name: 'Point de passage 1', exact: true });
        const position = () => point.evaluate((el: SVGCircleElement) => ({ x: el.cx.baseVal.value, y: el.cy.baseVal.value }));
        const panneau = gmos.fenetre.getByLabel('Inspecteur de lien');
        const defilement = await panneau.evaluate(el => el.scrollTop);
        const initial = await position();
        await point.focus();
        for (const [touche, dx, dy] of [['ArrowUp', 0, -10], ['ArrowLeft', -10, 0], ['ArrowRight', 10, 0], ['ArrowDown', 0, 10]] as const) {
            const avant = await position();
            await gmos.fenetre.keyboard.press(touche);
            await expect.poll(position).toEqual({ x: avant.x + dx, y: avant.y + dy });
            await expect(point).toBeFocused();
        }
        expect(await position()).toEqual(initial);
        await gmos.fenetre.keyboard.press('ArrowLeft');
        await gmos.fenetre.keyboard.press('ArrowLeft');
        await gmos.fenetre.keyboard.press('ArrowLeft');
        await expect.poll(position).toEqual({ x: initial.x - 30, y: initial.y });
        await expect(point).toBeFocused();
        await gmos.fenetre.keyboard.press('ArrowRight');
        await gmos.fenetre.keyboard.press('ArrowRight');
        await gmos.fenetre.keyboard.press('ArrowRight');
        for (const dezoom of [false, true]) {
            if (dezoom) { await bouton('Réduire').click(); await bouton('Réduire').click(); }
            const boite = (await point.boundingBox())!;
            const centre = { x: boite.x + boite.width / 2, y: boite.y + boite.height / 2 };
            // Saisir au bord de la poignée : aucun saut initial, même à faible zoom.
            const prise = { x: centre.x + 6, y: centre.y - 4 };
            await gmos.fenetre.mouse.move(prise.x, prise.y);
            await gmos.fenetre.mouse.down();
            for (const [dx, dy] of [[-70, -50], [60, -50], [60, 60], [-70, 60]]) {
                await gmos.fenetre.mouse.move(prise.x + dx, prise.y + dy, { steps: 15 });
                await expect.poll(async () => {
                    const b = (await point.boundingBox())!;
                    return Math.hypot(b.x + b.width / 2 - centre.x - dx, b.y + b.height / 2 - centre.y - dy);
                }).toBeLessThan(1);
            }
            await gmos.fenetre.mouse.up();
        }
        expect(await style()).toBeUndefined();
        expect(await panneau.evaluate(el => el.scrollTop)).toBe(defilement);
        const finale = await position();
        await bouton('Appliquer').click();
        const sauvegardes = (await style())?.pointsDePassage;
        expect(sauvegardes).toHaveLength(1);
        // Les coordonnées exposées par SVG sont des flottants simples ; le magasin garde les doubles.
        expect(sauvegardes![0].x).toBeCloseTo(finale.x, 4);
        expect(sauvegardes![0].y).toBeCloseTo(finale.y, 4);
    });

    test('double-cliquer insère et retire un détour ; Échap abandonne tout l’aperçu', async () => {
        const endroit = await lien().locator('.ajout-point-de-passage').evaluate((el: SVGPathElement) => {
            const point = el.getPointAtLength(el.getTotalLength() * 0.4), m = el.getScreenCTM()!;
            return { x: point.x * m.a + point.y * m.c + m.e, y: point.x * m.b + point.y * m.d + m.f };
        });
        await gmos.fenetre.mouse.dblclick(endroit.x, endroit.y);
        const point = lien().getByRole('button', { name: 'Point de passage 1', exact: true });
        await expect(point).toBeVisible(); expect(await style()).toBeUndefined();
        await point.dblclick(); await expect(point).toHaveCount(0);
        await bouton('Ajouter un point de passage').click(); await expect(point).toBeVisible();
        await gmos.fenetre.keyboard.press('Escape'); await expect(point).toHaveCount(0);
        await choisir(); await expect(point).toHaveCount(0); expect(await style()).toBeUndefined();
    });

    test('la relance restitue commentaire, ports et trajet ; le retour au thème les conserve', async () => {
        await gmos.fenetre.getByLabel('Commentaire du lien', { exact: true }).fill('À jouer après la révélation');
        await gmos.fenetre.getByLabel('Point de départ', { exact: true }).selectOption('1');
        await gmos.fenetre.getByLabel('Point d’arrivée', { exact: true }).selectOption('3');
        await gmos.fenetre.getByLabel('Épaisseur du lien', { exact: true }).selectOption('gras');
        await bouton('Ajouter un point de passage').click(); await bouton('Appliquer').click();
        await bouton('Revenir au style du thème').click();
        const conserve = await style();
        expect(conserve).toMatchObject({ commentaire: 'À jouer après la révélation', pointDepart: 1, pointArrivee: 3 });
        expect(conserve?.epaisseur).toBeUndefined(); expect(conserve?.pointsDePassage).toHaveLength(1);
        const ancienProfil = gmos.profil;
        await gmos.fenetre.waitForTimeout(1000); await gmos.application.close();
        gmos = await lancerGmOs({ preparerLeProfil: nouveau => fs.cpSync(ancienProfil, nouveau, { recursive: true }) });
        fs.rmSync(ancienProfil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 }); await attendreLHydratation(gmos);
        await gmos.fenetre.evaluate(() => (window as Temoin).useSessionOSStore.getState().setCurrentView('trame'));
        await bouton('Graphe').click(); await choisir();
        expect(await style()).toEqual(conserve);
        await expect(gmos.fenetre.getByLabel('Commentaire du lien', { exact: true })).toHaveValue('À jouer après la révélation');
        await expect(lien().getByRole('button', { name: 'Point de passage 1', exact: true })).toBeVisible();
    });
});
