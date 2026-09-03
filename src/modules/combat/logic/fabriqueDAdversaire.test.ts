import { describe, it, expect } from 'vitest';
import type { SheetField } from '../../../data/defaultSheetTemplates';
import { fabriquer, hasardDeGraine, nommerLExemplaire } from './fabriqueDAdversaire';
import { ARCHETYPES, archetypeParId, proposerLesChamps, RANGS, rangParId } from './archetypes';

/**
 * **La fabrique d'adversaires, éprouvée sur les échelles de vrais jeux.**
 *
 * *Chantier demandé par David le 2026-09-03.*
 *
 * Ce qui doit être prouvé n'est pas « ça produit quelque chose » — c'est que
 * **ce qui sort est jouable dans le jeu** : dans les bornes du gabarit, plus
 * fort quand le rang monte, et conforme à l'archétype demandé. Un adversaire
 * hors échelle ne se voit pas à l'écran : il se découvre en pleine séance, au
 * moment où il encaisse trois fois trop.
 */

/** Les cinq attributs de Dune : moyenne 4, plafond 8. */
const CHAMPS_DUNE: SheetField[] = [
    { id: 'analyse', label: 'Analyse', type: 'number', defaultValue: 4, max: 8 },
    { id: 'combat', label: 'Combat', type: 'number', defaultValue: 4, max: 8 },
    { id: 'discipline', label: 'Discipline', type: 'number', defaultValue: 4, max: 8 },
    { id: 'mobilite', label: 'Mobilité', type: 'number', defaultValue: 4, max: 8 },
    { id: 'rhetorique', label: 'Rhétorique', type: 'number', defaultValue: 4, max: 8 },
];

/** Blade Runner : des lettres, rangées de la meilleure à la pire. */
const CHAMPS_LETTRES: SheetField[] = [
    { id: 'force', label: 'Force', type: 'select', defaultValue: 'C (D8)', options: ['A (D12)', 'B (D10)', 'C (D8)', 'D (D6)'] },
    { id: 'agilite', label: 'Agilité', type: 'select', defaultValue: 'C (D8)', options: ['A (D12)', 'B (D10)', 'C (D8)', 'D (D6)'] },
    { id: 'nom', label: 'Nom', type: 'text', defaultValue: '' },
];

const brute = archetypeParId('brute');

/** Fabrique `n` adversaires et rend la valeur moyenne d'un champ. */
function moyenneDuChamp(champs: SheetField[], archetypeId: string, rangId: string, champ: string, n = 200): number {
    const archetype = archetypeParId(archetypeId);
    const repartition = proposerLesChamps(archetype, champs);
    let somme = 0;
    for (let i = 0; i < n; i++) {
        const { sheetData } = fabriquer({
            champs, repartition, archetypeId, rangId, hasard: hasardDeGraine(i + 1),
        });
        somme += Number(sheetData[champ]);
    }
    return somme / n;
}

describe('proposerLesChamps', () => {
    it('reconnaît ce qui sert une brute chez Dune', () => {
        const { favorises, negliges } = proposerLesChamps(brute, CHAMPS_DUNE);
        expect(favorises).toContain('combat');
        expect(negliges).toContain('mobilite');
        expect(negliges).toContain('analyse');
    });

    it('ne classe pas ce qu’il ne reconnaît pas', () => {
        /*
          Un champ dont le libellé ne dit rien reste neutre. L'absence de
          correspondance est une information : c'est ce que l'atelier montre au
          meneur pour qu'il tranche.
        */
        const champs: SheetField[] = [{ id: 'ferveur', label: 'Ferveur', type: 'number', defaultValue: 3, max: 6 }];
        const { favorises, negliges } = proposerLesChamps(brute, champs);
        expect(favorises).toHaveLength(0);
        expect(negliges).toHaveLength(0);
    });

    it('tranche en faveur du favorisé quand un libellé évoque les deux', () => {
        const champs: SheetField[] = [{ id: 'x', label: 'Agilité au combat', type: 'number', defaultValue: 4, max: 8 }];
        expect(proposerLesChamps(brute, champs).favorises).toContain('x');
    });

    it('ne favorise rien pour le figurant quelconque', () => {
        const quelconque = archetypeParId('quelconque');
        const { favorises, negliges } = proposerLesChamps(quelconque, CHAMPS_DUNE);
        expect(favorises).toHaveLength(0);
        expect(negliges).toHaveLength(0);
    });
});

describe('fabriquer', () => {
    it('⭐ reste TOUJOURS dans les bornes du gabarit', () => {
        /*
          Le test qui compte. Une valeur hors échelle ne se voit pas à l'écran —
          elle se découvre quand l'adversaire encaisse trois fois trop, en pleine
          séance. On balaie tous les archétypes et tous les rangs.
        */
        for (const archetype of ARCHETYPES) {
            for (const rang of RANGS) {
                const repartition = proposerLesChamps(archetype, CHAMPS_DUNE);
                for (let graine = 1; graine <= 60; graine++) {
                    const { sheetData } = fabriquer({
                        champs: CHAMPS_DUNE, repartition,
                        archetypeId: archetype.id, rangId: rang.id,
                        hasard: hasardDeGraine(graine),
                    });
                    for (const champ of CHAMPS_DUNE) {
                        const valeur = Number(sheetData[champ.id]);
                        expect(valeur).toBeGreaterThanOrEqual(1);
                        expect(valeur).toBeLessThanOrEqual(champ.max as number);
                        expect(Number.isInteger(valeur)).toBe(true);
                    }
                }
            }
        }
    });

    it('donne le même adversaire pour la même graine', () => {
        const repartition = proposerLesChamps(brute, CHAMPS_DUNE);
        const demande = { champs: CHAMPS_DUNE, repartition, archetypeId: 'brute', rangId: 'elite' };
        const a = fabriquer({ ...demande, hasard: hasardDeGraine(42) });
        const b = fabriquer({ ...demande, hasard: hasardDeGraine(42) });
        expect(a.sheetData).toEqual(b.sheetData);
    });

    it('rend une brute plus forte au combat qu’un figurant', () => {
        const brutale = moyenneDuChamp(CHAMPS_DUNE, 'brute', 'elite', 'combat');
        const figurant = moyenneDuChamp(CHAMPS_DUNE, 'quelconque', 'pietaille', 'combat');
        expect(brutale).toBeGreaterThan(figurant + 1);
    });

    it('rend une brute PLUS LENTE qu’un figurant — ce qu’elle néglige compte aussi', () => {
        const brutale = moyenneDuChamp(CHAMPS_DUNE, 'brute', 'pietaille', 'mobilite');
        const figurant = moyenneDuChamp(CHAMPS_DUNE, 'quelconque', 'pietaille', 'mobilite');
        expect(brutale).toBeLessThan(figurant);
    });

    it('monte avec le rang, sans jamais dépasser le plafond', () => {
        const suite = RANGS.map(r => moyenneDuChamp(CHAMPS_DUNE, 'brute', r.id, 'combat'));
        for (let i = 1; i < suite.length; i++) {
            expect(suite[i]).toBeGreaterThan(suite[i - 1]);
        }
        expect(suite[suite.length - 1]).toBeLessThanOrEqual(8);
    });

    it('⭐ un boss n’est nul nulle part, même dans ce qu’il néglige', () => {
        /* Le plancher du rang : un boss médiocre partout n'est pas un boss. */
        const repartition = proposerLesChamps(brute, CHAMPS_DUNE);
        for (let graine = 1; graine <= 80; graine++) {
            const { sheetData } = fabriquer({
                champs: CHAMPS_DUNE, repartition, archetypeId: 'brute', rangId: 'boss',
                hasard: hasardDeGraine(graine),
            });
            for (const champ of CHAMPS_DUNE) {
                expect(Number(sheetData[champ.id])).toBeGreaterThanOrEqual(4);
            }
        }
    });

    it('choisit des échelons valides sur une échelle en lettres', () => {
        const repartition = proposerLesChamps(brute, CHAMPS_LETTRES);
        const options = CHAMPS_LETTRES[0].options as string[];
        for (let graine = 1; graine <= 50; graine++) {
            const { sheetData } = fabriquer({
                champs: CHAMPS_LETTRES, repartition, archetypeId: 'brute', rangId: 'elite',
                hasard: hasardDeGraine(graine),
            });
            expect(options).toContain(sheetData.force);
            expect(options).toContain(sheetData.agilite);
        }
    });

    it('donne de meilleures lettres à une brute forte qu’à un figurant', () => {
        /* Sur une échelle en lettres, « meilleur » veut dire plus près de A. */
        const rang = (id: string, archetypeId: string) => {
            const repartition = proposerLesChamps(archetypeParId(archetypeId), CHAMPS_LETTRES);
            const options = CHAMPS_LETTRES[0].options as string[];
            let somme = 0;
            for (let graine = 1; graine <= 120; graine++) {
                const { sheetData } = fabriquer({
                    champs: CHAMPS_LETTRES, repartition, archetypeId, rangId: id,
                    hasard: hasardDeGraine(graine),
                });
                somme += options.indexOf(String(sheetData.force));
            }
            return somme / 120;
        };
        expect(rang('boss', 'brute')).toBeLessThan(rang('pietaille', 'quelconque'));
    });

    it('laisse le texte au meneur, et ne touche pas aux formules', () => {
        const champs: SheetField[] = [
            { id: 'nom', label: 'Nom', type: 'text', defaultValue: '' },
            { id: 'total', label: 'Total', type: 'formula', defaultValue: 0, formula: 'combat + 2' },
        ];
        const { sheetData } = fabriquer({
            champs, repartition: { favorises: [], negliges: [] },
            archetypeId: 'brute', rangId: 'elite', hasard: hasardDeGraine(1),
        });
        expect(sheetData.nom).toBe('');
        expect(sheetData).not.toHaveProperty('total');
    });

    it('supporte un gabarit sans plafond déclaré', () => {
        /* `max` est facultatif dans le gabarit : il ne doit pas rendre NaN. */
        const champs: SheetField[] = [{ id: 'vigueur', label: 'Vigueur', type: 'number', defaultValue: 3 }];
        const { sheetData } = fabriquer({
            champs, repartition: { favorises: ['vigueur'], negliges: [] },
            archetypeId: 'brute', rangId: 'boss', hasard: hasardDeGraine(9),
        });
        expect(Number.isFinite(Number(sheetData.vigueur))).toBe(true);
        expect(Number(sheetData.vigueur)).toBeGreaterThanOrEqual(1);
    });
});

describe('nommerLExemplaire', () => {
    it('numérote seulement quand il y en a plusieurs', () => {
        expect(nommerLExemplaire('Pillard', 0, 1)).toBe('Pillard');
        expect(nommerLExemplaire('Pillard', 0, 3)).toBe('Pillard 1');
        expect(nommerLExemplaire('Pillard', 2, 3)).toBe('Pillard 3');
    });
});

describe('rangParId', () => {
    it('retombe sur la piétaille plutôt que de rendre undefined', () => {
        expect(rangParId('inconnu').id).toBe('pietaille');
        expect(rangParId(null).id).toBe('pietaille');
    });
});
