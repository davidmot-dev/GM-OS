import { describe, it, expect } from 'vitest';
import type { GestesDesHeros } from '../../types/drivers';
import {
    appliquerLeMouvement, changementsEffectifs, effetsDuDebordement, herosDeLaCampagne, momentDeCalme,
    nombreDEffetsAChoisir, plafondDuMouvement, recuperationDesHeros, type HerosDeLaTable,
} from './gestesDesHeros';

/**
 * **Les gestes de NOC sur chaque Héros** — 2026-10-16, règles du carnet « NOC ».
 *
 * Le jeu de données décrit ce que le pilote de NOC déclare : les champs sont
 * ceux de la fiche `noc-reference` (`espoir`, `extase`, `ferveur`, `vecu`,
 * `trauma`, `folie`, `facade`, `lumiere`…), plus `fatigue`, `bouleversement` et
 * `soupcon`, que la fiche reçoit.
 */
const PERIL = ['blessures', 'trauma', 'traque', 'noirceur'] as const;
const NOC: GestesDesHeros = {
    momentDeCalme: {
        table: [{ ressource: 'Fiel', delta: -1 }],
        heros: [
            { champ: 'espoir', label: 'Espoir', delta: 1, plus: 'extase', max: { champ: 'ferveur', fois: 2, plus: 3, plafond: 10 } },
            ...PERIL.map(champ => ({ champ, delta: -1 })),
        ],
        leve: ['fatigue'],
        amputation: { champ: 'soupcon', label: 'Soupçon', seuils: [{ aPartirDe: 5, points: 2 }, { aPartirDe: 8, points: 4 }, { aPartirDe: 10, points: 6 }], parmi: 'Blessures, Trauma, Traque, Noirceur, Espoir' },
    },
    debutDeSeance: [{ champ: 'vecu', label: 'Vécu', delta: 1, max: 3 }],
    nouveauScenario: [{ champ: 'vecu', label: 'Vécu', delta: 'plein', max: 3 }],
    effetsDuDebordement: {
        ressource: 'Fiel', nombreSelon: 'Menace',
        effets: [
            { id: 'bouleversement', label: 'Bouleversement administratif', coche: 'bouleversement', aDire: 'pas de Faveur pendant 49 heures.' },
            { id: 'intervention', label: "Intervention de l'Artefact", heros: [{ champ: 'noirceur', delta: 2, resistance: 'lumiere', max: 10 }], aDire: "l'Aura de lumière d'un allié peut encore réduire." },
            { id: 'tension', label: 'Tension', heros: [{ champ: 'trauma', delta: 2, resistance: 'folie', max: 10 }] },
            { id: 'traque', label: 'Traque', heros: [{ champ: 'traque', delta: 2, resistance: 'facade', max: 10 }] },
            { id: 'fatigue', label: 'Fatigue', heros: [{ champ: 'espoir', delta: -1, aVideCoche: 'fatigue' }] },
        ],
    },
};
const heros = (valeurs: Record<string, unknown>, nom = 'Ilse'): HerosDeLaTable => ({ joueurId: 'j', id: nom, nom, valeurs });

describe('le plafond d’un mouvement', () => {
    it('l’Espoir se plafonne à la Ferveur : 1, 3, 5, 7, 9 puis 10', () => {
        const espoir = NOC.momentDeCalme!.heros[0];
        expect([-1, 0, 1, 2, 3, 4, 5].map(f => plafondDuMouvement(espoir, { ferveur: f }))).toEqual([1, 3, 5, 7, 9, 10, 10]);
    });
});

describe('le moment de calme', () => {
    it('Espoir +1 + Extase sous la Ferveur, −1 à chaque jauge, Fatigué prend fin', () => {
        const [c] = momentDeCalme(NOC.momentDeCalme!, [heros({ espoir: 2, extase: 1, ferveur: 2, blessures: 3, trauma: 0, traque: 1, noirceur: 5, fatigue: true })]);
        expect(c.maj).toEqual({ espoir: 4, blessures: 2, traque: 0, noirceur: 4, fatigue: false });
        expect(c.lignes).toContain('Espoir 2 → 4 (+2, +1 extase)');
        expect(c.lignes).toContain('fatigue prend fin');
    });

    it('l’Espoir ne dépasse pas le plafond de la Ferveur, et n’est jamais ramené en dessous', () => {
        const [plafonne] = momentDeCalme(NOC.momentDeCalme!, [heros({ espoir: 4, extase: 3, ferveur: 1 })]);
        expect(plafonne.maj.espoir).toBe(5);
        const [deja] = momentDeCalme(NOC.momentDeCalme!, [heros({ espoir: 7, extase: 0, ferveur: 1 })]);
        expect(deja.maj.espoir).toBeUndefined();
    });

    it('une jauge ne descend pas sous ses séquelles', () => {
        const avecSequelles = { ...NOC.momentDeCalme!, heros: [{ champ: 'trauma', delta: -1, plancher: 'sequellesTrauma' }] };
        const [c] = momentDeCalme(avecSequelles, [heros({ trauma: 1, sequellesTrauma: 1 })]);
        expect(c.maj).toEqual({});
        expect(c.lignes[0]).toBe('trauma 1 → 1 (±0, séquelles 1)');
    });

    it('le Soupçon dit la récupération à reprendre, selon son seuil', () => {
        const [a, b, c] = momentDeCalme(NOC.momentDeCalme!, [heros({ soupcon: 4 }, 'A'), heros({ soupcon: 8 }, 'B'), heros({ soupcon: 10 }, 'C')]);
        expect(a.lignes.some(l => l.startsWith('Soupçon'))).toBe(false);
        expect(b.lignes).toContain('Soupçon 8 : 4 points de récupération en moins, à reprendre au choix du joueur (Blessures, Trauma, Traque, Noirceur, Espoir)');
        expect(c.lignes.at(-1)).toMatch(/^Soupçon 10 : 6 points/);
    });
});

describe('le Vécu de la séance et du scénario', () => {
    it('+1 en début de séance, jusqu’à 3', () => {
        const [a, b] = recuperationDesHeros(NOC.debutDeSeance, [heros({ vecu: 1 }, 'A'), heros({ vecu: 3 }, 'B')]);
        expect(a.maj).toEqual({ vecu: 2 });
        expect(b.maj).toEqual({});
    });

    it('plein au nouveau scénario — un Vécu agrandi par le Développement n’est pas ramené', () => {
        const [a, b] = recuperationDesHeros(NOC.nouveauScenario, [heros({ vecu: 0 }, 'A'), heros({ vecu: 4 }, 'B')]);
        expect(a.maj).toEqual({ vecu: 3 });
        expect(changementsEffectifs([a, b])).toHaveLength(1);
    });
});

describe('les effets du Fiel', () => {
    const effets = NOC.effetsDuDebordement!.effets;

    it('Tension : 2 Trauma moins la Folie — et une Folie à −1 l’aggrave', () => {
        const { changements } = effetsDuDebordement(effets, { tension: 1 }, [heros({ trauma: 2, folie: 1 }, 'A'), heros({ trauma: 2, folie: -1 }, 'B')]);
        expect(changements.map(c => c.maj.trauma)).toEqual([3, 5]);
    });

    it('le même effet choisi deux fois cumule ses pertes AVANT la résistance', () => {
        const { changements } = effetsDuDebordement(effets, { traque: 2 }, [heros({ traque: 0, facade: 1 })]);
        // 2 + 2 − 1 = 3, et non (2 − 1) × 2 = 2.
        expect(changements[0].maj.traque).toBe(3);
    });

    it('Fatigue : un point d’Espoir de moins ; déjà à zéro, le Héros devient Fatigué', () => {
        const { changements } = effetsDuDebordement(effets, { fatigue: 1 }, [heros({ espoir: 1 }, 'A'), heros({ espoir: 0 }, 'B')]);
        expect(changements[0].maj).toEqual({ espoir: 0 });
        expect(changements[1].maj).toEqual({ fatigue: true });
        expect(changements[1].lignes[0]).toMatch(/fatigue coché$/);
    });

    it('Bouleversement coche sa case, et ce que l’outil ne sait pas faire est dit', () => {
        const { changements, aDire } = effetsDuDebordement(effets, { bouleversement: 1, intervention: 1 }, [heros({ noirceur: 0, lumiere: 1 })]);
        expect(changements[0].maj).toEqual({ noirceur: 1, bouleversement: true });
        expect(aDire).toEqual([
            'Bouleversement administratif — pas de Faveur pendant 49 heures.',
            "Intervention de l'Artefact — l'Aura de lumière d'un allié peut encore réduire.",
        ]);
    });

    it('une jauge de péril ne dépasse pas 10', () => {
        const { changements } = effetsDuDebordement(effets, { tension: 3 }, [heros({ trauma: 7, folie: 0 })]);
        expect(changements[0].maj.trauma).toBe(10);
    });

    it('le nombre d’effets à choisir est la Menace', () => {
        expect([undefined, -1, 0, 2.7].map(nombreDEffetsAChoisir)).toEqual([0, 0, 0, 2]);
    });
});

describe('les Héros de la campagne', () => {
    it('seuls les personnages liés à la campagne, avec leur joueur', () => {
        const liste = herosDeLaCampagne([
            { id: 'j1', characters: [{ id: 'a', name: 'Ilse', campaignId: 'c', sheetData: { espoir: 2 } }, { id: 'b', name: 'Autre', campaignId: 'x' }] },
            { id: 'j2', characters: [{ id: 'c', campaignId: 'c' }] },
        ], 'c');
        expect(liste).toEqual([
            { joueurId: 'j1', id: 'a', nom: 'Ilse', valeurs: { espoir: 2 } },
            { joueurId: 'j2', id: 'c', nom: 'Héros sans nom', valeurs: {} },
        ]);
        expect(herosDeLaCampagne([], null)).toEqual([]);
    });
});

describe('un mouvement seul', () => {
    it('« plein » sans plafond ne fait rien', () => {
        expect(appliquerLeMouvement({ champ: 'vecu', delta: 'plein' }, { vecu: 1 })).toBeNull();
    });
});

describe('un Héros déjà Fatigué', () => {
    it('la Fatigue ne recoche pas et ne le dit pas', () => {
        const { changements } = effetsDuDebordement(NOC.effetsDuDebordement!.effets, { fatigue: 1 }, [heros({ espoir: 0, fatigue: true })]);
        expect(changements[0].maj).toEqual({});
        expect(changements[0].lignes).toEqual([]);
    });
});
