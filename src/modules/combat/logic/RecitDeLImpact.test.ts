import { describe, it, expect, beforeAll } from 'vitest';
import i18next from 'i18next';
import { raconterLImpact } from './RecitDeLImpact';

beforeAll(async () => {
    await i18next.init({
        lng: 'fr',
        interpolation: { escapeValue: false },
        resources: {
            fr: {
                modules: {
                    session: {
                        events: {
                            impact_damage: 'Encaisse **{{value}}**{{detail}}',
                            impact_healing: 'Récupère **{{value}}**{{detail}}',
                        },
                    },
                },
            },
        },
    });
});

const pointsDeVie = (current: number, max: number, state: string) =>
    ({ type: 'hp', data: { current, max }, state });

describe('raconterLImpact', () => {
    it('ecrit le coup ET l\'etat d\'arrivee, en toutes lettres', () => {
        const ligne = raconterLImpact(
            { value: 4 },
            { healthSystem: pointsDeVie(6, 10, 'scratched') },
        );

        expect(ligne).toBe('Encaisse **4** — 6/10 (égratigné)');
    });

    /* Le jeton interne `scratched` ne doit plus jamais atteindre le journal. */
    it('ne laisse pas passer le jeton d\'etat brut', () => {
        const ligne = raconterLImpact({ value: 1 }, { healthSystem: pointsDeVie(9, 10, 'wounded') });
        expect(ligne).not.toContain('wounded');
        expect(ligne).toContain('blessé');
    });

    it('distingue un soin d\'une blessure', () => {
        expect(raconterLImpact({ value: 3, isRecovery: true }, { healthSystem: pointsDeVie(9, 10, 'healthy') }))
            .toBe('Récupère **3** — 9/10 (indemne)');
    });

    /* Une valeur négative dit la même chose que `isRecovery` : « encaisse -3 »
       serait faux dans les deux sens. */
    it('lit une valeur negative comme un soin, et n\'ecrit pas de moins', () => {
        const ligne = raconterLImpact({ value: -3 }, { healthSystem: pointsDeVie(9, 10, 'healthy') });
        expect(ligne).toBe('Récupère **3** — 9/10 (indemne)');
    });

    it('ajoute le type et la localisation quand ils sont la', () => {
        expect(raconterLImpact(
            { value: 7, type: 'balistique', location: 'torse' },
            { healthSystem: pointsDeVie(3, 10, 'wounded') },
        )).toBe('Encaisse **7** (balistique, torse) — 3/10 (blessé)');
    });

    it('n\'ecrit pas de parentheses vides sans type ni localisation', () => {
        expect(raconterLImpact({ value: 2 }, { healthSystem: pointsDeVie(8, 10, 'healthy') }))
            .toBe('Encaisse **2** — 8/10 (indemne)');
    });

    /*
      Le défaut d'origine : `max` venait de la fiche quand `hp` venait du système
      de santé, et un jeu sans jauge écrivait « HP : 6 / undefined ».
    */
    it('se tait sur la sante quand le jeu n\'en compte pas', () => {
        const ligne = raconterLImpact({ value: 5 }, { hp: 6 });
        expect(ligne).toBe('Encaisse **5**');
        expect(ligne).not.toContain('undefined');
    });

    it('decrit une horloge sans inventer de points de vie', () => {
        const ligne = raconterLImpact(
            { value: 1 },
            { healthSystem: { type: 'clocks', data: { filled: 3, segments: 6 }, state: 'wounded' } },
        );

        expect(ligne).toContain('3/6');
        expect(ligne).not.toContain('undefined');
    });
});
