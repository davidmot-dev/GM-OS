import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCombatStore } from './useCombatStore';

/**
 * **Les PJ que la scène déclare présents arrivent sur le plateau, par les deux
 * portes.**
 *
 * Défaut trouvé par David au combat de test du 2026-08-20 : *« lorsque je
 * switch de scène, il n'a pas retrouvé mon joueur dans la deuxième scène, j'ai
 * dû le rajouter manuellement »*.
 *
 * `BandeauDeLaScene` mène à une scène par deux chemins — `rattacherLeCombat`
 * quand aucune scène n'est encore choisie, `basculerVersLaScene` ensuite — et
 * seul le premier faisait entrer les PJ. Le meneur voyait donc l'outil se
 * comporter différemment selon un état qu'il n'avait pas en tête.
 *
 * **Pourquoi aucun test ne l'a vu** : `personnagesDeLaScene` lit le magasin de
 * séance par le global `window`, et pas un seul test de combat ne le posait.
 * L'arrivée des PJ rendait donc toujours une liste vide, et passait au vert
 * sans jamais s'exécuter. *Un test qui laisse sa dépendance absente ne teste
 * pas le chemin, il teste son garde-fou.*
 */

interface Scene { id: string; titre: string; personnagesIds?: string[] }

const poserLeMagasinDeSeance = (scenes: Scene[]) => {
    (window as unknown as { useSessionOSStore: { getState: () => unknown } }).useSessionOSStore = {
        getState: () => ({
            activeCampaignId: 'c-1',
            sessions: [],
            scenes,
            players: [
                { characters: [
                    { id: 'pj-ripley', name: 'Ripley', portraitUrl: 'ripley.png' },
                    { id: 'pj-dallas', name: 'Dallas' },
                ] },
            ],
        }),
    };
};

const store = () => useCombatStore.getState();
const noms = () => store().combatants.map(c => c.name);

beforeEach(() => {
    store().reset();
    useCombatStore.setState({ combatsGares: {} });
    poserLeMagasinDeSeance([
        { id: 'scene-A', titre: 'Le sas', personnagesIds: ['pj-ripley'] },
        { id: 'scene-B', titre: 'La coursive', personnagesIds: ['pj-ripley', 'pj-dallas'] },
    ]);
});

afterEach(() => {
    delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;
});

describe('les PJ d\'une scène et les deux portes', () => {
    it('rattacher une scène fait entrer ses PJ', () => {
        store().rattacherLeCombat('scene-A');
        expect(noms()).toEqual(['Ripley']);
    });

    it('basculer vers une scène jamais jouée fait entrer ses PJ', () => {
        // Le défaut du 2026-08-20 : ici, le plateau revenait vide.
        store().rattacherLeCombat('scene-A');
        store().basculerVersLaScene('scene-B');

        expect(store().sceneId).toBe('scene-B');
        expect(noms().sort()).toEqual(['Dallas', 'Ripley']);
    });

    it('revenir sur un plateau garé le rend tel quel, sans ressusciter personne', () => {
        // Restaurer, c'est rendre ce qu'on avait, pas ce qu'on aurait dû avoir :
        // un PJ que le meneur a retiré du plateau ne doit pas revenir seul.
        store().rattacherLeCombat('scene-A');
        store().addCombatant({
            name: 'Xénomorphe', init: 12, isPlayer: false, faction: 'enemy', statuses: [],
        });
        const ripley = store().combatants.find(c => c.name === 'Ripley')!;
        store().removeCombatant(ripley.id);

        store().basculerVersLaScene('scene-B');
        store().basculerVersLaScene('scene-A');

        expect(noms()).toEqual(['Xénomorphe']);
    });

    it('un PJ déjà sur le plateau n\'est pas ajouté deux fois', () => {
        store().rattacherLeCombat('scene-A');
        store().basculerVersLaScene('scene-B');
        store().basculerVersLaScene('scene-A');

        // Scène A garée avec Ripley : elle est restaurée, pas re-garnie.
        expect(noms()).toEqual(['Ripley']);
    });
});
