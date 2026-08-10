import { describe, it, expect, beforeEach } from 'vitest';
import { useBrainstormStore } from './useBrainstormStore';
import { ModuleIDSchema } from '../../../../types/schemas';

/**
 * Ce que ces tests protègent : **le corpus reste choisi**.
 *
 * La Forge est sortie de Session OS le 2026-08-10. Elle n'a plus de campagne
 * active d'où tirer un corpus par défaut — et c'est voulu : un défaut hérité
 * d'ailleurs reste un choix que personne n'a fait, et celui-là a envoyé une
 * forge Dune dans `systems/blade-runner`.
 *
 * Ce qui remplace le défaut est la mémoire du module. Si elle se perd — parce
 * qu'on remet un jour `corpusCible` dans `reset()`, ou qu'on retire le
 * `partialize` —, on ne verra rien casser : on verra seulement un menu revenu
 * à vide, qu'on remplira machinalement. C'est le genre de régression que seul
 * un test attrape.
 */
describe('le corpus documenté survit à la série', () => {
    beforeEach(() => {
        useBrainstormStore.setState({ corpusCible: null, step: 'idle', candidates: [] });
    });

    it('n\'a aucune valeur par défaut', () => {
        // Rien ne le renseigne à l'ouverture : il se désigne, ou il est nul.
        expect(useBrainstormStore.getState().corpusCible).toBeNull();
    });

    it('survit à la fin d\'une série', () => {
        const store = useBrainstormStore.getState();
        store.setCorpusCible('dune');
        store.startDiscovery();
        store.setCandidates([{ id: 'x', title: 'X', category: 'rule', summary: '', tags: [] }]);

        useBrainstormStore.getState().reset();

        const apres = useBrainstormStore.getState();
        expect(apres.corpusCible).toBe('dune');   // le réglage du travail
        expect(apres.candidates).toEqual([]);      // la série, elle, se ferme
        expect(apres.step).toBe('idle');
    });

    it('s\'écrit dans le stockage, et lui seul', () => {
        useBrainstormStore.getState().setCorpusCible('dune');
        useBrainstormStore.getState().setCustomSubject('Les manoeuvres des Mentat');

        const brut = localStorage.getItem('gmos-forge-corpus');
        expect(brut, 'le corpus visé ne se persiste pas').not.toBeNull();

        const { state } = JSON.parse(brut!);
        expect(state.corpusCible).toBe('dune');
        // Une série restaurée de mémoire prétendrait connaître un état que seul
        // le disque atteste : l'avancement se relit dans `rules/`, pas ici.
        expect(Object.keys(state)).toEqual(['corpusCible']);
    });

    it('se remet à zéro explicitement, pour changer de livre', () => {
        useBrainstormStore.getState().setCorpusCible('dune');
        useBrainstormStore.getState().setCorpusCible(null);
        expect(useBrainstormStore.getState().corpusCible).toBeNull();
    });
});

describe('la Forge est un module', () => {
    it('« forge » est un module que l\'état persisté accepte', () => {
        /**
         * `activeModule` est persisté et relu au démarrage à travers ce schéma.
         * Sans cette valeur, le module s'ouvrirait, puis serait rejeté au
         * rechargement suivant et l'application retomberait sur le tableau de
         * bord — sans rien dire, puisque le schéma a un `default`.
         */
        expect(ModuleIDSchema.parse('forge')).toBe('forge');
    });
});
