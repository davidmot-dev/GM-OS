import { describe, expect, it } from 'vitest';
import { affrontementPossible, attaqueSurLaCarte, cleCocDuCombattant, jetDuCombattantPossible, jeuDuCombat, regleDesDegats, ripostePossible } from './jetDuCombattant';
import { CLE_COMBAT_ALIEN, lireLeCombatAlien } from '../../dice/systemes/combatAlien';
import { xenoViergeAlien } from '../../dice/systemes/xenomorphesAlien';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **La table des jeux ouverts au combat des adversaires** — registre § 267, T0 (22/11/2026). Les
 * quatre jeux du § 263 et Vampire gardent leur geste ; un jeu absent de la table n'a ni bouton ni
 * dégâts devinés (C4, C6).
 */
const pilote = (jet: Record<string, unknown>, combat: Record<string, unknown> = {}) =>
    ({ jet, combat } as unknown as Pick<GameDriver, 'jet' | 'combat'>);
const GABARIT = { id: 'g', name: 'g', emoji: '', sections: [] } as SheetTemplate;
const ADVERSAIRE = { isPlayer: false };

const ALIEN = pilote({ alien: { competence: 'competence' } }, { alien: { sante: 'sante' } });
const BLADE_RUNNER = pilote({ bladeRunner: {}, desEchelonnes: { composantes: [] } });
const DUNE = pilote({ dune: { competences: ['combat'], principes: [] } });
const CTHULHU_HACK = pilote({ cthulhuHack: {} });
const VAMPIRE = pilote({ vampire: {} });
const SHADOWRUN = pilote({ shadowrun: {} });
const PENOMBRE = pilote({ penombre: {} });
const COC = pilote({ coc: {} });
const DELTA_GREEN = pilote({ deltaGreen: {} });
const BARBARIANS = pilote({ barbarians: {} });

describe('la table des jeux du combat (§ 267, T0)', () => {
    it('chaque jeu du § 263 garde son geste et sa règle de dégâts', () => {
        expect([ALIEN, BLADE_RUNNER, DUNE, CTHULHU_HACK, VAMPIRE, PENOMBRE, COC, DELTA_GREEN, BARBARIANS].map(d => {
            const j = jeuDuCombat(d);
            return j && `${j.jeu} · ${j.geste} · ${j.degats}`;
        })).toEqual([
            'Alien · attaquer · arme-plus-succes',
            'Blade Runner · attaquer · arme-plus-succes',
            'Dune · attaquer · porte-du-jeu',
            'Cthulhu Hack · riposte · porte-du-jeu',
            'Vampire · attaquer · marge-plus-arme',
            'Pénombre · affrontement · porte-du-jeu',
            'COC · attaquer · porte-du-jeu',
            'Delta Green · attaquer · porte-du-jeu',
            'Barbarians of Lemuria · attaquer · de-de-l-arme',
        ]);
    });

    it('T17 : Pénombre s’affronte — un bouton, aucun jet d’adversaire', () => {
        expect(affrontementPossible(ADVERSAIRE, PENOMBRE)).toBe(true);
        expect(affrontementPossible({ isPlayer: true }, PENOMBRE)).toBe(false);
        expect(attaqueSurLaCarte(ADVERSAIRE, PENOMBRE, GABARIT)).toBe(true);
        expect(jetDuCombattantPossible(ADVERSAIRE, PENOMBRE, GABARIT)).toBe(false);
        expect(ripostePossible(ADVERSAIRE, PENOMBRE)).toBe(false);
        expect(affrontementPossible(ADVERSAIRE, CTHULHU_HACK)).toBe(false);
    });

    it('T2 : COC — « Attaquer » ouvre son jet ; la cible de la carte se traduit dans le menu de COC', () => {
        expect(attaqueSurLaCarte(ADVERSAIRE, COC, GABARIT)).toBe(true);
        expect(jetDuCombattantPossible(ADVERSAIRE, COC, GABARIT)).toBe(true);
        expect(cleCocDuCombattant({ id: 'c1', sourcePlayerId: 'pj1' })).toBe('pc:pj1');
        expect(cleCocDuCombattant({ id: 'c1', sourceEntityId: 'pnj1' })).toBe('npc:pnj1');
        expect(cleCocDuCombattant({ id: 'c1' })).toBe('combatant:c1');
    });

    it('un jeu absent de la table : pas de jeu, et le montant se saisit', () => {
        for (const d of [SHADOWRUN, null, undefined]) {
            expect(jeuDuCombat(d)).toBeNull();
            expect(regleDesDegats(d)).toBe('montant');
        }
    });

    it('les boutons de la carte : Attaquer, Riposte, rien pour Vampire ni pour un jeu absent (C6)', () => {
        expect(attaqueSurLaCarte(ADVERSAIRE, BLADE_RUNNER, GABARIT)).toBe(true);
        expect(attaqueSurLaCarte(ADVERSAIRE, DUNE, GABARIT)).toBe(true);
        expect(attaqueSurLaCarte(ADVERSAIRE, CTHULHU_HACK, GABARIT)).toBe(true);
        expect(ripostePossible(ADVERSAIRE, CTHULHU_HACK)).toBe(true);
        expect(jetDuCombattantPossible(ADVERSAIRE, CTHULHU_HACK, GABARIT)).toBe(false);
        // § 267, T1 : Vampire gagne « Attaquer » (décision Q2 du 20/11), son jet reste dans « Fiche ».
        expect(attaqueSurLaCarte(ADVERSAIRE, VAMPIRE, GABARIT)).toBe(true);
        expect(jetDuCombattantPossible(ADVERSAIRE, VAMPIRE, GABARIT)).toBe(true);
        expect(attaqueSurLaCarte(ADVERSAIRE, SHADOWRUN, GABARIT)).toBe(false);
        expect(jetDuCombattantPossible(ADVERSAIRE, SHADOWRUN, GABARIT)).toBe(false);
    });

    it('jamais pour un personnage de joueur, ni sans gabarit', () => {
        expect(jetDuCombattantPossible({ isPlayer: true }, BLADE_RUNNER, GABARIT)).toBe(false);
        expect(jetDuCombattantPossible(ADVERSAIRE, BLADE_RUNNER, null)).toBe(false);
        expect(ripostePossible({ isPlayer: true }, CTHULHU_HACK)).toBe(false);
    });

    it('Alien : un humain lance, un xénomorphe tire son attaque au D6', () => {
        expect(jetDuCombattantPossible(ADVERSAIRE, ALIEN, GABARIT, {})).toBe(true);
        const xeno = { [CLE_COMBAT_ALIEN]: { ...lireLeCombatAlien({}), xenomorphe: xenoViergeAlien() } };
        expect(jetDuCombattantPossible(ADVERSAIRE, ALIEN, GABARIT, xeno)).toBe(false);
        // Le tirage d'une créature n'a besoin que de `combat.alien` ; son jet d'humain, aussi de `jet.alien`.
        expect(regleDesDegats(pilote({}, { alien: {} }))).toBe('arme-plus-succes');
        expect(jetDuCombattantPossible(ADVERSAIRE, pilote({}, { alien: {} }), GABARIT, {})).toBe(false);
    });
});
