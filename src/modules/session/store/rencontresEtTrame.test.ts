import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionOSStore } from '../useSessionOSStore';
import { SessionManager } from '../logic/SessionManager';
import type { RencontrePreparee } from '../../../types/rencontres.types';

/*
  Les rencontres préparées (2026-10-12) vivent à part des scènes : chaque geste
  qui supprime, clone ou efface doit les connaître. Éprouvé ici sur le magasin
  RÉEL — c'est l'assemblage qui pourrait oublier une tranche.
*/
const lignes: RencontrePreparee['lignes'] = [{ genre: 'archetype', archetypeId: 'brute', rangId: 'pietaille', nombre: 2 }];
const etat = () => useSessionOSStore.getState();

describe('les rencontres et les gestes du magasin', () => {
    let sceneId: string;

    beforeEach(() => {
        useSessionOSStore.setState({ actes: [], scenes: [], rencontres: [] });
        const acteId = etat().ajouterActe('c-1', 'Acte I');
        sceneId = etat().ajouterScene(acteId, 'L’embuscade');
        etat().ajouterUneRencontre({ campaignId: 'c-1', sceneId, nom: 'La patrouille', lignes });
        etat().ajouterUneRencontre({ campaignId: 'c-1', nom: 'Libre', lignes });
    });

    it('supprimer la scène rend sa rencontre libre, sans l’effacer', () => {
        etat().supprimerScene(sceneId);
        const patrouille = etat().rencontres.find(r => r.nom === 'La patrouille');
        expect(patrouille, 'la rencontre préparée a disparu avec sa scène').toBeDefined();
        expect(patrouille?.sceneId).toBeUndefined();
    });

    it('cloner la scène recopie sa rencontre sur le clone', () => {
        const cloneId = etat().clonerLaScene(sceneId);
        const duClone = etat().rencontres.filter(r => r.sceneId === cloneId);
        expect(duClone.map(r => r.nom)).toEqual(['La patrouille']);
        expect(etat().rencontres.filter(r => r.sceneId === sceneId)).toHaveLength(1);
    });

    it('supprimer la campagne emporte ses rencontres, et celles-là seules', () => {
        etat().ajouterUneRencontre({ campaignId: 'c-2', nom: 'Ailleurs', lignes });
        const set = useSessionOSStore.setState as unknown as Parameters<typeof SessionManager.deleteCampaign>[0];
        useSessionOSStore.setState({ campaigns: [{ id: 'c-1', name: 'Test' }] as never });
        SessionManager.deleteCampaign(set, etat as never, 'c-1');
        expect(etat().rencontres.map(r => r.nom)).toEqual(['Ailleurs']);
    });
});
