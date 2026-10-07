import { test, expect } from '@playwright/test';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
type FenetreG0 = Window & { useSessionOSStore: typeof useSessionOSStore; __arcsG0: number[][] };
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN } from './lancerGmOs';

/** Témoin du moteur remplacé : exécution explicite seulement, avant G1. */
test('G0 — références du canevas et restauration de son instantané', async () => {
    test.skip(process.env.GMOS_TRAME_G0 !== '1', 'Archive du moteur antérieur aux cartes.');
    test.setTimeout(120_000);
    const dossier = path.resolve('documentation/Planning/graphe-trame/G0-reference');
    fs.mkdirSync(dossier, { recursive: true });
    const gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    try {
        await attendreLHydratation(gmos);
        await gmos.fenetre.setViewportSize({ width: 1440, height: 900 });
        await gmos.fenetre.evaluate(() => {
            const s = (window as FenetreG0).useSessionOSStore.getState();
            s.setCurrentView('trame');
        });
        await gmos.fenetre.getByRole('button', { name: 'Graphe', exact: true }).click();
        const capture = async (nom: string) => {
            await gmos.fenetre.waitForTimeout(1000);
            await gmos.fenetre.screenshot({ path: path.join(dossier, `${nom}.png`) });
        };
        await gmos.fenetre.getByRole('button', { name: 'Ranger', exact: true }).click();
        await capture('01-chaine');
        await gmos.fenetre.getByRole('button', { name: /2\s*scènes? sans lieu/ }).click();
        await capture('02-constat');
        await gmos.fenetre.getByRole('button', { name: 'Tout remontrer', exact: true }).click();
        await gmos.fenetre.getByRole('combobox').first().selectOption('principale');
        await capture('03-filtre-vide');
        await gmos.fenetre.getByRole('combobox').first().selectOption('tout');
        await gmos.fenetre.evaluate(() => {
            const s = (window as FenetreG0).useSessionOSStore.getState();
            const acte = s.actes.find((a) => a.id === 'temoin-acte-1');
            for (let i = 0; i < 4; i++) s.ajouterScene(acte!.id, `Piste G0 ${i + 1}`);
            s.ajouterUnEnchainement('temoin-scene-1', 'temoin-scene-2');
            s.libellerUnEnchainement('temoin-scene-1', 'temoin-scene-2', 'si le témoin parle');
        });
        await gmos.fenetre.getByRole('button', { name: 'Ranger', exact: true }).click();
        await gmos.fenetre.getByRole('button', { name: 'Confirmer', exact: true }).click();
        await capture('04-branches-condition');
        // Une position figée sans épingle isole la lecture de positionsDeLaTrame.
        await gmos.fenetre.evaluate(() => {
            const store = (window as FenetreG0).useSessionOSStore;
            const s = store.getState();
            s.detacherDeLaTrame(s.activeCampaignId);
            s.figerLeGrapheDeTrame(s.activeCampaignId, { 'scene:temoin-scene-1': { x: 9876, y: 5432 } });
        });
        await gmos.fenetre.waitForTimeout(800);
        await gmos.fenetre.reload();
        await attendreLHydratation(gmos);
        await gmos.fenetre.evaluate(() => {
            (window as FenetreG0).__arcsG0 = [];
            const arc = CanvasRenderingContext2D.prototype.arc;
            CanvasRenderingContext2D.prototype.arc = function (...args: Parameters<typeof arc>) {
                if (args[2] === 6) (window as FenetreG0).__arcsG0.push([args[0], args[1]]);
                return arc.apply(this, args);
            };
            (window as FenetreG0).useSessionOSStore.getState().setCurrentView('trame');
        });
        await gmos.fenetre.getByRole('button', { name: 'Graphe', exact: true }).click();
        await capture('05-reouverture-figee');
        const releve = await gmos.fenetre.evaluate(() => {
            const s = (window as FenetreG0).useSessionOSStore.getState();
            return { campagne: s.campaigns.find((c) => c.id === s.activeCampaignId), arcs: (window as FenetreG0).__arcsG0 };
        });
        expect(releve.campagne!.positionsDeLaTrame!['scene:temoin-scene-1']).toEqual({ x: 9876, y: 5432 });
        fs.writeFileSync(path.join(dossier, 'restauration.json'), JSON.stringify({
            date: '2026-10-07', instantane: releve.campagne!.positionsDeLaTrame,
            positionDessinee: releve.arcs.some((p: number[]) => p[0] === 9876 && p[1] === 5432),
            methode: 'Réouverture dans un nouveau renderer, sur le même profil fictif ; interception des arcs de scènes.',
        }, null, 2));
    } finally {
        await gmos.application.close();
        // Windows garde brièvement certains verrous après la fermeture d'Electron.
        fs.rmSync(gmos.profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    }
});
