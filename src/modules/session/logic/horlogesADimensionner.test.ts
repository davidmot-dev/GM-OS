import { describe, it, expect } from 'vitest';
import { redimensionnerLesHorloges } from './horlogesADimensionner';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import type { Player } from '../store/types';

/**
 * Ce que ces tests protègent : **on ne remplace une valeur fausse que par une
 * valeur lue, jamais par une valeur devinée**.
 *
 * Le défaut réparé : les personnages créés avant le 2026-08-15 portent une
 * horloge de défaite à six segments — le chiffre de
 * `HealthInterpreter.createDefault('clocks')` —, alors que chez Dune le seuil
 * vaut la compétence défensive de la cible, de quatre à huit.
 *
 * La moitié la plus importante de ce module est ce qu'il **refuse** de faire :
 * une migration qui se trompe abîme des données que plus rien ne rattrapera.
 */

const dune = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
const CAMPAGNES = [{ id: 'c-dune', system: 'dune' }];

const joueurAvec = (perso: Record<string, unknown>): Player[] => ([{
    id: 'p-1',
    name: 'Joueur',
    characters: [{
        id: 'pj-1',
        name: 'Duncan',
        systemId: 'dune',
        campaignId: 'c-dune',
        ...perso,
    }],
} as unknown as Player]);

const horloge = (segments: number, filled = 0) => ({
    type: 'clocks' as const, data: { filled, segments }, state: 'healthy', badges: [],
});

const santeDe = (r: { players: Player[] }) =>
    (r.players[0].characters[0] as { healthSystem?: { data: Record<string, unknown>; state: string } }).healthSystem;

describe('redimensionner les horloges de défaite', () => {
    it('remplace le six générique par la compétence lue sur la fiche', () => {
        const resultat = redimensionnerLesHorloges(
            joueurAvec({ healthSystem: horloge(6), sheetData: { combat: 5 } }),
            CAMPAGNES, [dune],
        );

        expect(santeDe(resultat)!.data.segments).toBe(5);
        expect(resultat.redimensionnees).toEqual([
            { personnage: 'Duncan', ancienCompte: 6, nouveauCompte: 5 },
        ]);
    });

    it('conserve ce qui a déjà été encaissé, et fait recalculer l\'état', () => {
        /**
         * Trois segments sur six, c'est la moitié ; trois sur quatre, c'est
         * critique. Le même personnage ne décrit pas le même état selon
         * l'échelle, et c'est `HealthInterpreter` qui tranche ce seuil-là —
         * on ne recopie pas ses paliers ici.
         */
        const resultat = redimensionnerLesHorloges(
            joueurAvec({ healthSystem: horloge(6, 3), sheetData: { combat: 4 } }),
            CAMPAGNES, [dune],
        );

        expect(santeDe(resultat)!.data.filled, 'les coups reçus ne s\'effacent pas').toBe(3);
        expect(santeDe(resultat)!.data.segments).toBe(4);
        expect(santeDe(resultat)!.state).toBe('critical');
    });

    it('ramène un compte rempli au-delà de la nouvelle échelle', () => {
        const resultat = redimensionnerLesHorloges(
            joueurAvec({ healthSystem: horloge(8, 7), sheetData: { combat: 4 } }),
            CAMPAGNES, [dune],
        );

        expect(santeDe(resultat)!.data.filled).toBe(4);
        expect(santeDe(resultat)!.state, 'plein, donc hors de combat').toBe('dead');
    });
});

describe('la charge réelle du 2026-08-15', () => {
    /**
     * **Relevé dans l'état persisté de David**, et non écrit pour la
     * circonstance — *vérifier sur la charge réelle, jamais sur un exemple qu'on
     * a écrit soi-même.*
     *
     * Sur ses dix personnages, **un seul** porte une horloge : « test »,
     * `systemId: 'dune'`, `{filled: 0, segments: 6}`, avec `combat: 4` sur sa
     * fiche. Les autres comptent des points de vie ou n'ont pas de modèle du
     * tout, et la migration doit les laisser exactement où ils sont.
     *
     * Son pilote Dune vise `champParDefaut: 'combat'` et borne le seuil entre
     * quatre et huit : l'horloge doit donc passer de six à **quatre**.
     */
    it('la seule horloge existante passe de six à quatre', () => {
        const resultat = redimensionnerLesHorloges(
            joueurAvec({
                name: 'test',
                healthSystem: horloge(6),
                sheetData: { analyse: 4, combat: 4, discipline: 4, mob: 4, rhetoric: 4 },
            }),
            [{ id: 'c-dune', system: 'dune' }], [dune],
        );

        expect(santeDe(resultat)!.data.segments).toBe(4);
        expect(santeDe(resultat)!.data.filled, 'intact, il n\'a rien encaissé').toBe(0);
        expect(santeDe(resultat)!.state).toBe('healthy');
    });

    it('laisse intacts les personnages qui comptent des points de vie', () => {
        // « TEST Marine », « Willem Novak », « Fenna »… : modèle `hp`, hors sujet.
        const resultat = redimensionnerLesHorloges(
            joueurAvec({
                healthSystem: { type: 'hp', data: { current: 7, max: 7 }, state: 'healthy', badges: [] },
            }),
            CAMPAGNES, [dune],
        );
        expect(resultat.redimensionnees).toEqual([]);
    });

    it('laisse intacts les personnages sans modèle de santé', () => {
        // « Aldric le Paladin », « Elowen la Druide »… : rien à redimensionner,
        // et surtout rien à leur inventer. *L'absence n'est pas un zéro.*
        const resultat = redimensionnerLesHorloges(joueurAvec({}), CAMPAGNES, [dune]);
        expect(resultat.redimensionnees).toEqual([]);
    });
});

describe('ce que la migration refuse de faire', () => {
    it('ne touche pas une fiche où le seuil ne se lit pas', () => {
        /**
         * `seuilDeDefaite` retombe sur son minimum quand le champ manque, avec
         * un avertissement. Retenir ce minimum remplacerait une valeur fausse
         * par une valeur **devinée** — on n'aurait rien gagné, sinon de la
         * rendre crédible.
         */
        const resultat = redimensionnerLesHorloges(
            joueurAvec({ healthSystem: horloge(6), sheetData: {} }),
            CAMPAGNES, [dune],
        );

        expect(santeDe(resultat)!.data.segments, 'inchangé').toBe(6);
        expect(resultat.redimensionnees).toEqual([]);
    });

    it('ne touche pas un jeu sans tâche de défaite', () => {
        // Alien compte des points de vie : son horloge, s'il en avait une, ne
        // relèverait pas de cette règle.
        const sansTache = { ...dune, id: 'alien', combat: { ...dune.combat, tacheDeDefaite: undefined } };
        const resultat = redimensionnerLesHorloges(
            joueurAvec({ systemId: 'alien', healthSystem: horloge(6), sheetData: { combat: 5 } }),
            [{ id: 'c-dune', system: 'alien' }], [sansTache as typeof dune],
        );

        expect(resultat.redimensionnees).toEqual([]);
    });

    it('ne touche pas un modèle de santé qui n\'est pas une horloge', () => {
        const resultat = redimensionnerLesHorloges(
            joueurAvec({
                healthSystem: { type: 'hp', data: { current: 6, max: 6 }, state: 'healthy', badges: [] },
                sheetData: { combat: 5 },
            }),
            CAMPAGNES, [dune],
        );

        expect(resultat.redimensionnees).toEqual([]);
    });

    it('ne fait rien quand le compte est déjà juste — et rend le tableau d\'origine', () => {
        // Un `set` de store à chaque hydratation relancerait un rendu pour rien.
        const players = joueurAvec({ healthSystem: horloge(5), sheetData: { combat: 5 } });
        const resultat = redimensionnerLesHorloges(players, CAMPAGNES, [dune]);

        expect(resultat.redimensionnees).toEqual([]);
        expect(resultat.players, 'même référence').toBe(players);
    });

    it('est idempotente : la relancer ne change plus rien', () => {
        const premier = redimensionnerLesHorloges(
            joueurAvec({ healthSystem: horloge(6), sheetData: { combat: 7 } }),
            CAMPAGNES, [dune],
        );
        const second = redimensionnerLesHorloges(premier.players, CAMPAGNES, [dune]);

        expect(premier.redimensionnees).toHaveLength(1);
        expect(second.redimensionnees).toEqual([]);
    });
});
