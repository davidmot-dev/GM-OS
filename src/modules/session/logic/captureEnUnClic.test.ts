import { describe, it, expect } from 'vitest';
import { releverLEtatDeLaTable, titreParDefaut } from './etatDeLaTable';
import { laSceneQueLAmbianceOuvre } from './trame';
import type { AtlasMap } from '../../../types/chronicle.types';
import type { Scene } from '../../../types/trame.types';

/**
 * **Ce que ces tests protègent : marquer une scène reste gratuit.**
 *
 * Étape 4 du § 8 du plan du 2026-08-08, et son § 3.1 en donne l'enjeu : *« si
 * déclarer "on est maintenant dans la scène X" coûte plus d'un clic, ce ne sera
 * pas fait, et la trame pourrira en une séance. »*
 *
 * Elle est restée ouverte du 08/08 au 20/08 alors que le bouton existait —
 * parce qu'il demandait de **taper un titre**, ce que le plan avait annoncé
 * comme rédhibitoire dès son § 3.
 */

const carte = (id: string, name: string, fileUrl?: string): AtlasMap => ({
    id, campaignId: 'c-1', name, fileUrl, isVideo: false,
} as AtlasMap);

const scene = (id: string, sur: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c-1', acteId: 'a-1', ordre: 1, titre: `Scène ${id}`, resume: '',
    origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 0, ...sur,
});

describe('l\'état de la table, capturé', () => {
    const atlasMaps = [carte('m-1', 'Entrepôt', 'entrepot.png'), carte('m-2', 'Coursive', 'coursive.png')];

    it('reconnaît le lieu à la carte réellement projetée', () => {
        // « La carte active » du § 3 : ce que les joueurs ont sous les yeux.
        const etat = releverLEtatDeLaTable({ atlasMaps, carteProjetee: 'coursive.png' });
        expect(etat.lieuId).toBe('m-2');
    });

    it('préfère la carte projetée au lieu simplement ouvert dans l\'atlas', () => {
        // Le meneur consulte l'atlas pendant que la table regarde autre chose.
        const etat = releverLEtatDeLaTable({
            atlasMaps, carteProjetee: 'entrepot.png', lieuSelectionne: 'm-2',
        });
        expect(etat.lieuId).toBe('m-1');
    });

    it('se rabat sur le lieu sélectionné quand rien n\'est projeté', () => {
        // Une scène de dialogue se joue souvent sans rien projeter.
        expect(releverLEtatDeLaTable({ atlasMaps, lieuSelectionne: 'm-2' }).lieuId).toBe('m-2');
    });

    it('ne devine aucun lieu quand la carte projetée n\'est pas de l\'atlas', () => {
        // Une image posée à la volée n'est pas un lieu de la campagne.
        expect(releverLEtatDeLaTable({ atlasMaps, carteProjetee: 'inconnue.png' }).lieuId)
            .toBeUndefined();
        expect(releverLEtatDeLaTable({ atlasMaps, lieuSelectionne: 'm-effacee' }).lieuId)
            .toBeUndefined();
    });

    it('relève les PNJ en piste, sans doublon', () => {
        // Un même adversaire peut tenir plusieurs jetons sur le plateau.
        const etat = releverLEtatDeLaTable({
            atlasMaps,
            combattants: [
                { sourceEntityId: 'e-1' }, { sourceEntityId: 'e-1' },
                { sourceEntityId: 'e-2' }, {},
            ],
        });
        expect(etat.entiteIds.sort()).toEqual(['e-1', 'e-2']);
    });

    it('relève les PJ que la séance déclare présents', () => {
        const etat = releverLEtatDeLaTable({ atlasMaps, personnagesDeLaSeance: ['pj-1', 'pj-2'] });
        expect(etat.personnagesIds).toEqual(['pj-1', 'pj-2']);
    });

    it('ne rend que des identifiants, jamais des contenus', () => {
        // Le piège du § 3 : `SessionModuleSnapshot` embarque les playlists
        // complètes. Une scène qui ferait pareil pèserait des mégaoctets par
        // marquage, et il y en aura une dizaine par séance.
        const etat = releverLEtatDeLaTable({
            atlasMaps, carteProjetee: 'entrepot.png',
            combattants: [{ sourceEntityId: 'e-1' }],
            personnagesDeLaSeance: ['pj-1'], momentEnCours: 'sm-1',
        });
        expect(Object.values(etat).flat().every(v => typeof v === 'string')).toBe(true);
    });

    it('rend une capture vide plutôt que de refuser', () => {
        // Une capture partielle vaut infiniment mieux qu'un clic qui ne fait rien.
        expect(releverLEtatDeLaTable({ atlasMaps: [] }))
            .toEqual({ entiteIds: [], personnagesIds: [] });
    });
});

describe('le titre d\'une scène qu\'on n\'a pas nommée', () => {
    it('prend le nom du lieu quand il y en a un', () => {
        expect(titreParDefaut('Entrepôt', new Date())).toBe('Entrepôt');
    });

    it('se rabat sur l\'heure, faute de lieu', () => {
        // « L'entrepôt » se reconnaît dans une liste, « 21h14 » aussi — mais
        // seulement quand il n'y a rien de mieux.
        expect(titreParDefaut(undefined, new Date(2026, 7, 20, 21, 4))).toBe('Scène de 21h04');
        expect(titreParDefaut('   ', new Date(2026, 7, 20, 9, 30))).toBe('Scène de 09h30');
    });
});

describe('l\'ambiance qui ouvre sa scène', () => {
    it('ouvre celle qui la déclare', () => {
        const scenes = [scene('s-1', { momentDeStoryboardId: 'sm-1' }), scene('s-2')];
        expect(laSceneQueLAmbianceOuvre(scenes, 'c-1', 'sm-1')).toBe('s-1');
    });

    it('ne devine pas quand plusieurs scènes partagent l\'ambiance', () => {
        // « On LIE, on ne fusionne pas » : une même ambiance sert plusieurs
        // scènes, c'est le modèle qui le dit.
        const scenes = [
            scene('s-1', { momentDeStoryboardId: 'sm-1' }),
            scene('s-2', { momentDeStoryboardId: 'sm-1' }),
        ];
        expect(laSceneQueLAmbianceOuvre(scenes, 'c-1', 'sm-1')).toBeUndefined();
    });

    it('ne ressuscite pas une scène close', () => {
        // Rouvrir est une décision, et elle a son bouton.
        const scenes = [scene('s-1', { momentDeStoryboardId: 'sm-1', termineeLe: 42 })];
        expect(laSceneQueLAmbianceOuvre(scenes, 'c-1', 'sm-1')).toBeUndefined();
    });

    it('ne fait rien sur une scène déjà en cours', () => {
        // Un geste répété ne doit pas produire un second effet.
        const scenes = [scene('s-1', { momentDeStoryboardId: 'sm-1', passages: [{ debut: 1 }] })];
        expect(laSceneQueLAmbianceOuvre(scenes, 'c-1', 'sm-1')).toBeUndefined();
    });

    it('reprend en revanche une scène en pause', () => {
        // Elle reprendra : c'est exactement ce que l'ambiance annonce.
        const scenes = [scene('s-1', {
            momentDeStoryboardId: 'sm-1', passages: [{ debut: 1, fin: 2 }],
        })];
        expect(laSceneQueLAmbianceOuvre(scenes, 'c-1', 'sm-1')).toBe('s-1');
    });

    it('ignore les scènes d\'une autre campagne', () => {
        const scenes = [scene('s-1', { campaignId: 'c-2', momentDeStoryboardId: 'sm-1' })];
        expect(laSceneQueLAmbianceOuvre(scenes, 'c-1', 'sm-1')).toBeUndefined();
    });

    it('ne fait rien sans campagne ni sans ambiance', () => {
        const scenes = [scene('s-1', { momentDeStoryboardId: 'sm-1' })];
        expect(laSceneQueLAmbianceOuvre(scenes, null, 'sm-1')).toBeUndefined();
        expect(laSceneQueLAmbianceOuvre(scenes, 'c-1', null)).toBeUndefined();
    });
});
