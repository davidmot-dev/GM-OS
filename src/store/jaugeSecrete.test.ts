import { describe, it, expect, beforeEach } from 'vitest';
import { useClockStore, jaugesVuesParLesJoueurs } from './useClockStore';
import { horlogesPourLaTable } from '../modules/ulanzi/widgets/librairie';

/**
 * **Une jauge secrète ne quitte pas la machine du meneur.**
 *
 * Point C1 du § 12, tranché par David le 2026-09-04. `isClockProjected` était
 * tout-ou-rien : cacher une seule jauge obligeait à cacher l'horloge entière.
 * Or c'est justement la jauge qu'on ne montre pas — le compte à rebours que le
 * meneur tient pendant que la table croit avoir le temps — qui rend les autres
 * utiles.
 */

describe('le filtre, à la source', () => {
    it("garde une jauge d’avant ce champ — aucune migration", () => {
        const anciennes: { id: string; name: string; vueParLesJoueurs?: boolean }[] =
            [{ id: 'a', name: 'Alerte' }];
        expect(jaugesVuesParLesJoueurs(anciennes)).toEqual(anciennes);
    });

    it('retire celles qui sont fermées', () => {
        const jauges = [
            { id: 'a', name: 'Alerte', vueParLesJoueurs: true },
            { id: 'b', name: 'Le secret du MJ', vueParLesJoueurs: false },
        ];

        expect(jaugesVuesParLesJoueurs(jauges).map(j => j.id)).toEqual(['a']);
    });

    it('supporte une liste absente', () => {
        expect(jaugesVuesParLesJoueurs(undefined)).toEqual([]);
    });
});

describe('une jauge neuve', () => {
    beforeEach(() => useClockStore.setState({ tensions: [] }));

    it('naît secrète — ouvrir est un geste, refermer est un regret', () => {
        useClockStore.getState().addTensionClock('Le secret du MJ', 6);

        const [jauge] = useClockStore.getState().tensions;
        expect(jauge.vueParLesJoueurs).toBe(false);
        expect(jaugesVuesParLesJoueurs(useClockStore.getState().tensions)).toEqual([]);
    });

    it("s’ouvre au premier clic, et se referme au second", () => {
        useClockStore.getState().addTensionClock('Alerte', 4);
        const id = useClockStore.getState().tensions[0].id;

        useClockStore.getState().basculerLaVueDesJoueurs(id);
        expect(useClockStore.getState().tensions[0].vueParLesJoueurs).toBe(true);

        useClockStore.getState().basculerLaVueDesJoueurs(id);
        expect(useClockStore.getState().tensions[0].vueParLesJoueurs).toBe(false);
    });

    it('referme au premier clic une jauge sans le drapeau', () => {
        /* Les deux sens marchent : `?? true` lit l'absence comme « vue ». */
        useClockStore.setState({ tensions: [{ id: 'vieille', name: 'Alerte', totalSegments: 4, filledSegments: 0 }] });

        useClockStore.getState().basculerLaVueDesJoueurs('vieille');

        expect(useClockStore.getState().tensions[0].vueParLesJoueurs).toBe(false);
    });
});

describe("l'afficheur de table obéit aussi", () => {
    it('les 32 pixels sont posés sur la table — une jauge secrète n’y va pas', () => {
        const rendu = horlogesPourLaTable({
            isClockProjected: true,
            tensions: [
                { id: 'a', name: 'Alerte', totalSegments: 4, filledSegments: 1 },
                { id: 'b', name: 'Secret', totalSegments: 6, filledSegments: 3, vueParLesJoueurs: false },
            ],
        });

        expect(rendu.map(h => h.id)).toEqual(['a']);
    });

    it('les deux drapeaux répondent à deux questions différentes', () => {
        /*
          `surLAfficheur` demande « celle-là plutôt que les cinq autres »,
          `vueParLesJoueurs` demande « la table a-t-elle le droit de la voir ».
          Une jauge ouverte aux joueurs mais retirée de l'afficheur reste
          retirée.
        */
        const rendu = horlogesPourLaTable({
            isClockProjected: true,
            tensions: [
                { id: 'a', name: 'Alerte', totalSegments: 4, filledSegments: 1, surLAfficheur: false, vueParLesJoueurs: true },
            ],
        });

        expect(rendu).toEqual([]);
    });
});
