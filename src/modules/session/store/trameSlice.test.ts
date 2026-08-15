import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'zustand';
import { createTrameSlice, type TrameSlice } from './trameSlice';
import { actesOrdonnes, scenesOrdonnees } from '../logic/trame';

/**
 * Ce que ces tests protègent : **les deux liens d'une scène ne se contredisent
 * jamais**.
 *
 * Une `Scene` porte `acteId` ET `campaignId`, et la redondance est voulue —
 * filtrer les scènes d'une campagne est l'opération la plus fréquente de tous
 * les écrans. Le prix de cette redondance est qu'elle peut diverger : une scène
 * rattachée à l'acte d'une autre campagne sans que `campaignId` suive
 * disparaîtrait de tous les écrans qui filtrent par campagne, sans qu'aucune
 * erreur ne soit levée. C'est le slice, et lui seul, qui tient les deux
 * ensemble.
 */

const nouveauStore = () => createStore<TrameSlice>()((...a) => createTrameSlice(...a));

describe('trameSlice', () => {
    let store: ReturnType<typeof nouveauStore>;

    beforeEach(() => {
        store = nouveauStore();
    });

    it('une scène hérite la campagne de son acte, jamais un paramètre', () => {
        const acteId = store.getState().ajouterActe('c1', 'Acte I');
        const sceneId = store.getState().ajouterScene(acteId, 'L\'embuscade');

        const scene = store.getState().scenes.find(s => s.id === sceneId)!;
        expect(scene.campaignId).toBe('c1');
        expect(scene.acteId).toBe(acteId);
    });

    it('une scène sans acte n\'est pas créée', () => {
        // Elle serait orpheline dès sa naissance : invisible sur tous les écrans
        // tout en pesant dans la base. Mieux vaut ne rien créer.
        expect(store.getState().ajouterScene('acte-inexistant', 'X')).toBe('');
        expect(store.getState().scenes).toHaveLength(0);
    });

    it('supprimer un acte emporte ses scènes, et elles seules', () => {
        const a1 = store.getState().ajouterActe('c1', 'Acte I');
        const a2 = store.getState().ajouterActe('c1', 'Acte II');
        store.getState().ajouterScene(a1, 'S1');
        store.getState().ajouterScene(a1, 'S2');
        const gardee = store.getState().ajouterScene(a2, 'S3');

        store.getState().supprimerActe(a1);

        expect(store.getState().actes.map(a => a.id)).toEqual([a2]);
        expect(store.getState().scenes.map(s => s.id)).toEqual([gardee]);
    });

    it('rattacher une scène à un autre acte emmène sa campagne avec elle', () => {
        const acteA = store.getState().ajouterActe('c1', 'Acte de c1');
        const acteB = store.getState().ajouterActe('c2', 'Acte de c2');
        const sceneId = store.getState().ajouterScene(acteA, 'Migrante');

        store.getState().rattacherSceneAUnActe(sceneId, acteB);

        const scene = store.getState().scenes.find(s => s.id === sceneId)!;
        expect(scene.acteId).toBe(acteB);
        expect(scene.campaignId, 'sinon elle disparaît de tous les écrans').toBe('c2');
    });

    it('rattacher à un acte inexistant ne fait rien', () => {
        const acteId = store.getState().ajouterActe('c1', 'Acte I');
        const sceneId = store.getState().ajouterScene(acteId, 'S');

        store.getState().rattacherSceneAUnActe(sceneId, 'fantome');

        expect(store.getState().scenes.find(s => s.id === sceneId)!.acteId).toBe(acteId);
    });

    it('les rangs se suivent par campagne, pas globalement', () => {
        store.getState().ajouterActe('c1', 'A');
        store.getState().ajouterActe('c2', 'X');
        store.getState().ajouterActe('c1', 'B');

        expect(actesOrdonnes(store.getState().actes, 'c1').map(a => a.ordre)).toEqual([0, 1]);
        expect(actesOrdonnes(store.getState().actes, 'c2').map(a => a.ordre)).toEqual([0]);
    });

    it('déplacer un acte réordonne sa campagne', () => {
        const a = store.getState().ajouterActe('c1', 'A');
        const b = store.getState().ajouterActe('c1', 'B');

        store.getState().deplacerActe(b, 'haut');

        expect(actesOrdonnes(store.getState().actes, 'c1').map(a => a.id)).toEqual([b, a]);
    });

    it('déplacer une scène ne touche que son acte', () => {
        const a1 = store.getState().ajouterActe('c1', 'Acte I');
        const a2 = store.getState().ajouterActe('c1', 'Acte II');
        const s1 = store.getState().ajouterScene(a1, 'S1');
        const s2 = store.getState().ajouterScene(a1, 'S2');
        const voisine = store.getState().ajouterScene(a2, 'Voisine');

        store.getState().deplacerScene(s2, 'haut');

        expect(scenesOrdonnees(store.getState().scenes, a1).map(s => s.id)).toEqual([s2, s1]);
        expect(store.getState().scenes.find(s => s.id === voisine)!.ordre).toBe(0);
    });

    it('une scène naît préparée, sauf si on dit le contraire', () => {
        // L'origine n'est pas un choix qu'on demande au meneur : c'est le code
        // qui crée la scène qui le sait. Ici, l'écran de trame ; plus tard, un
        // combat lancé sans scène active.
        const acteId = store.getState().ajouterActe('c1', 'Acte I');
        const prevue = store.getState().ajouterScene(acteId, 'Prévue');
        const surprise = store.getState().ajouterScene(acteId, 'Surprise', 'improvisee');

        expect(store.getState().scenes.find(s => s.id === prevue)!.origine).toBe('preparee');
        expect(store.getState().scenes.find(s => s.id === surprise)!.origine).toBe('improvisee');
    });
});
