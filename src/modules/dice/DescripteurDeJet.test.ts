import { describe, it, expect } from 'vitest';
import { preparerLeJet, verdict, type DescripteurDeJet } from './DescripteurDeJet';
import { DiceEngine } from './DiceEngine';
import { DEFAULT_GAME_DRIVERS } from '../../data/defaultGameDrivers';

/**
 * Ce que ces tests protègent : **un jet lancé depuis la fiche est un jet juste**.
 *
 * Avant le descripteur, un pilote ne pouvait annoncer qu'un seuil constant. Chez
 * Dune il vaut une compétence plus un principe — de 8 à 16 — et l'on y
 * inscrivait 8, le minimum. Tout jet sous-estimait donc le personnage, et rien
 * ne le signalait : le résultat avait l'air d'un résultat.
 */

const dune = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
const jetDune = dune.jet!;

/** Un personnage plausible : Combat 6, Devoir 5, Mobilité 7. */
const FICHE = { combat: 6, devoir: 5, mobilite: 7, analyse: 4, determination: 1 };

describe('composition du seuil', () => {
    it('additionne la compétence et le principe retenus', () => {
        const jet = preparerLeJet(jetDune, FICHE, { champs: { competence: 'combat', principe: 'devoir' } });

        expect(jet.seuil, 'Combat 6 + Devoir 5').toBe(11);
        expect(jet.composantes).toEqual([
            { label: 'Compétence', champ: 'combat', valeur: 6 },
            { label: 'Principe', champ: 'devoir', valeur: 5 },
        ]);
        expect(jet.avertissements).toEqual([]);
    });

    it('change de seuil quand le joueur invoque un autre principe', () => {
        // C'est tout l'intérêt : « ce que fait le personnage » et « pourquoi il
        // agit » sont deux choix, et le second déplace réellement le seuil.
        const a = preparerLeJet(jetDune, FICHE, { champs: { competence: 'combat', principe: 'devoir' } });
        const b = preparerLeJet(jetDune, { ...FICHE, justice: 8 }, { champs: { competence: 'combat', principe: 'justice' } });

        expect(a.seuil).toBe(11);
        expect(b.seuil).toBe(14);
    });

    it('reste dans les bornes du livre', () => {
        // « Seuil minimal : huit. Seuil maximal : seize. »
        const min = preparerLeJet(jetDune, { analyse: 4, foi: 4 }, { champs: { competence: 'analyse', principe: 'foi' } });
        const max = preparerLeJet(jetDune, { analyse: 8, foi: 8 }, { champs: { competence: 'analyse', principe: 'foi' } });

        expect(min.seuil).toBe(8);
        expect(max.seuil).toBe(16);
    });
});

describe('ce qui manque se dit, et n\'empêche pas de lancer', () => {
    /**
     * **Jamais d'exception.** Un champ absent est une erreur de configuration,
     * pas une raison d'empêcher un joueur de lancer en pleine partie. On lance
     * avec ce qu'on a et on dit ce qui manquait — l'inverse de la jauge à zéro
     * qui se tait, qui est le défaut dont vient toute cette série.
     */
    it('signale un champ absent de la fiche sans échouer', () => {
        const jet = preparerLeJet(jetDune, FICHE, { champs: { competence: 'combat', principe: 'sagesse' } });

        expect(jet.seuil, 'seul le Combat a pu être lu').toBe(6);
        expect(jet.avertissements).toHaveLength(1);
        expect(jet.avertissements[0]).toContain('sagesse');
        expect(jet.nombreDeDes, 'le jet reste lançable').toBe(2);
    });

    it('signale une composante que le joueur n\'a pas choisie', () => {
        const jet = preparerLeJet(jetDune, FICHE, { champs: { competence: 'combat' } });

        expect(jet.avertissements[0]).toContain('Principe');
    });
});

describe('réserve de dés', () => {
    it('lance deux dés de base', () => {
        expect(preparerLeJet(jetDune, FICHE, { champs: {} }).nombreDeDes).toBe(2);
    });

    it('ajoute les dés achetés', () => {
        expect(preparerLeJet(jetDune, FICHE, { champs: {}, desSupplementaires: 3 }).nombreDeDes).toBe(5);
    });

    it('plafonne à cinq dés et le dit', () => {
        // « Réserve de dés : de deux à cinq. » Trois achats au maximum.
        const jet = preparerLeJet(jetDune, FICHE, { champs: {}, desSupplementaires: 9 });

        expect(jet.nombreDeDes).toBe(5);
        expect(jet.avertissements.some(a => a.includes('5'))).toBe(true);
    });
});

describe('difficulté', () => {
    it('ramène une difficulté hors bornes dans l\'intervalle du livre', () => {
        // « Difficulté : de zéro à cinq. »
        const jet = preparerLeJet(jetDune, FICHE, { champs: {}, difficulte: 12 });

        expect(jet.difficulte).toBe(5);
        expect(jet.avertissements.some(a => a.includes('0') && a.includes('5'))).toBe(true);
    });

    it('tranche la réussite et rend l\'excédent', () => {
        // Les réussites au-delà de la difficulté deviennent de l'Impulsion.
        expect(verdict(4, 2)).toEqual({ reussi: true, excedent: 2 });
        expect(verdict(1, 2)).toEqual({ reussi: false, excedent: 0 });
    });

    it('un jeu sans difficulté déclarée ne s\'en voit pas imposer une', () => {
        /**
         * **Le plantage du 2026-08-15, à l'ouverture d'une fiche d'Alien** :
         * *« Cannot read properties of undefined (reading 'defaut') »*.
         *
         * `difficulte` était obligatoire dans le type parce que Dune en a une,
         * de 0 à 5. Mais **Alien compte les six et réussir n'en demande qu'un**
         * — son pilote n'en déclare donc aucune, à juste titre. Encore un champ
         * tenu pour universel parce qu'un seul jeu s'en servait.
         *
         * Sans bornes, il n'y a rien à borner : la difficulté vaut ce que le
         * meneur demande, et zéro à défaut. Aucun avertissement, puisque rien
         * n'a été ramené.
         */
        const alien: DescripteurDeJet = {
            seuil: [],
            reserve: { base: 1, max: 10, faces: 6 },
            sens: 'superieur-ou-egal',
        };

        const parDefaut = preparerLeJet(alien, FICHE, { champs: {} });
        expect(parDefaut.difficulte).toBe(0);
        expect(parDefaut.avertissements.some(a => a.includes('Difficulté'))).toBe(false);

        // Le meneur reste libre d'en demander une : elle n'est simplement pas bornée.
        expect(preparerLeJet(alien, FICHE, { champs: {}, difficulte: 3 }).difficulte).toBe(3);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Le jet réellement lancé
// ─────────────────────────────────────────────────────────────────────────────

describe('le moteur compte SOUS le seuil', () => {
    /**
     * **Le défaut mesuré le 2026-08-10.** Le moteur `2d20` comptait les dés
     * au-dessus du seuil : sur 4 000 dés au seuil 12, il rendait 1 859 réussites
     * — exactement celles qu'il fallait rejeter. Toute la famille 2d20 de
     * Modiphius compte l'inverse, c'est la définition du système.
     */
    it('un dé sous le seuil réussit, un dé au-dessus échoue', () => {
        const resultats = Array.from({ length: 400 }, () =>
            DiceEngine.rollFromConfig(
                { defaultDice: '2d20', logic: 'count-success', successThreshold: 11, engine: '2d20' },
                { baseCount: 2 },
            ),
        );

        for (const r of resultats) {
            for (const de of r.rolls) {
                const v = typeof de.val === 'number' ? de.val : 0;
                expect(de.isCritMax, `le dé ${v} face au seuil 11`).toBe(v <= 11);
            }
        }
    });

    it('le 1 naturel vaut deux réussites', () => {
        // « Réussite critique standard : un naturel, valant deux réussites. »
        // Auparavant le 1 était compté comme un fléau et RETRANCHÉ du total.
        let vuUnUn = false;
        for (let i = 0; i < 600 && !vuUnUn; i++) {
            const r = DiceEngine.rollPool(20, 5, 0, 11, false, { sens: 'under', doubleSous: 1 });
            const uns = r.rolls.filter(d => d.val === 1).length;
            const autresReussites = r.rolls.filter(d => typeof d.val === 'number' && d.val !== 1 && d.val <= 11).length;
            if (uns > 0) {
                vuUnUn = true;
                expect(r.successes, `${uns} × 1 + ${autresReussites} autres`).toBe(uns * 2 + autresReussites);
                expect(r.fails, 'un 1 n\'est pas un fléau en comptage « sous »').toBe(0);
            }
        }
        expect(vuUnUn, 'aucun 1 tiré en 600 lancers de 5d20 — improbable').toBe(true);
    });

    it('la spécialisation élargit le critique à la compétence seule', () => {
        // « Réussite critique spécialisée : résultat inférieur ou égal à la
        // compétence, valant deux réussites. » Combat 6 → tout dé ≤ 6 vaut 2.
        const r = DiceEngine.rollPool(20, 5, 0, 11, false, { sens: 'under', doubleSous: 6 });
        const attendu = r.rolls.reduce((acc, d) => {
            const v = typeof d.val === 'number' ? d.val : 21;
            return acc + (v <= 6 ? 2 : v <= 11 ? 1 : 0);
        }, 0);
        expect(r.successes).toBe(attendu);
    });

    it('ne change rien aux réserves qui comptent au-dessus', () => {
        // Year Zero, Vampire et consorts : le comportement d'origine est le
        // défaut, et il ne bouge pas.
        const r = DiceEngine.rollPool(6, 10, 0, 5, false);
        for (const d of r.rolls) {
            const v = typeof d.val === 'number' ? d.val : 0;
            expect(d.isCritMax).toBe(v >= 5);
        }
    });
});

describe('de la fiche aux dés, bout en bout', () => {
    it('un personnage Combat 6 / Devoir 5 lance 2d20 sous 11', () => {
        const jet = preparerLeJet(jetDune, FICHE, {
            champs: { competence: 'combat', principe: 'devoir' },
            difficulte: 2,
        });

        const resultat = DiceEngine.rollFromConfig(
            { defaultDice: '2d20', logic: 'count-success', successThreshold: jet.seuil, engine: '2d20' },
            { baseCount: jet.nombreDeDes, doubleSous: jet.doubleSous },
        );

        expect(resultat.rolls).toHaveLength(2);
        const attendu = resultat.rolls.reduce((acc, d) => {
            const v = typeof d.val === 'number' ? d.val : 21;
            return acc + (v <= 1 ? 2 : v <= 11 ? 1 : 0);
        }, 0);
        expect(resultat.successes).toBe(attendu);

        const v = verdict(resultat.successes ?? 0, jet.difficulte);
        expect(typeof v.reussi).toBe('boolean');
    });

    it('les champs du descripteur existent tous dans la fiche de référence', async () => {
        /**
         * Le descripteur désigne des **sections** de la fiche ; si elles n'y sont
         * pas, le joueur n'aura rien à choisir et le seuil vaudra zéro — en
         * silence. C'est la même chaîne d'identifiants que celle des jauges.
         */
        const { DEFAULT_SHEET_TEMPLATES } = await import('../../data/defaultSheetTemplates');
        const fiche = DEFAULT_SHEET_TEMPLATES.find(t => t.id === dune.templateId)!;
        const sections = new Set(fiche.sections.map(s => s.id));

        for (const composante of jetDune.seuil) {
            expect(sections.has(composante.sectionId), `section « ${composante.sectionId} » absente de la fiche`).toBe(true);
        }
    });
});

describe('un système sans descripteur continue de fonctionner', () => {
    it('le champ est facultatif', () => {
        // Les pilotes antérieurs n'en ont pas ; ils ne doivent pas se casser.
        const sansJet: DescripteurDeJet | undefined = undefined;
        expect(sansJet).toBeUndefined();
        expect(DEFAULT_GAME_DRIVERS.every(d => d.jet === undefined || d.jet.seuil.length > 0)).toBe(true);
    });
});
