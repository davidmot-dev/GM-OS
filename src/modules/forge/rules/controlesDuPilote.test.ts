import { describe, it, expect } from 'vitest';
import { champsInvoques, controlerLePilote } from './controlesDuPilote';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * Ce que ces tests protègent : **un pilote forgé se raccorde à sa fiche**.
 *
 * Le défaut visé est toujours le même — `CombatCard` lit une valeur **par son
 * identifiant** en pleine séance, et un identifiant qui ne correspond à rien
 * affiche une jauge à zéro, qui ressemble à un personnage en pleine forme.
 *
 * Le premier test est le plus important, et c'est le seul qui porte sur une
 * charge réelle : **le pilote Dune de référence, vérifié à la main, doit passer
 * sans un constat.** Si les contrôles le condamnaient, ce seraient eux qu'il
 * faudrait corriger — c'est l'étalon, pas le suspect.
 */

const duneDriver = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
const duneFiche = DEFAULT_SHEET_TEMPLATES.find(t => t.id === 'dune')!;

/** Une fiche minimale, mais réelle dans sa forme : deux sections, deux champs. */
const fiche: Partial<SheetTemplate> = {
    sections: [
        { id: 'competences', label: 'Compétences', fields: [{ id: 'combat', label: 'Combat', type: 'number' }] },
        { id: 'jauges', label: 'Jauges', fields: [{ id: 'determination', label: 'Détermination', type: 'number' }] },
    ] as SheetTemplate['sections'],
};

describe('l\'étalon passe les contrôles', () => {
    it('le pilote Dune de référence ne produit aucun constat', () => {
        expect(controlerLePilote(duneDriver, duneFiche)).toEqual([]);
    });
});

describe('ce qui ne se raccorde à rien est nommé', () => {
    it('une jauge suivie qui ne pointe aucun champ', () => {
        const constats = controlerLePilote(
            { combat: { statsToTrack: [{ fieldId: 'points-de-progression', label: 'Points de progression' }], initiativeFormula: '' } } as Partial<GameDriver>,
            fiche,
        );
        expect(constats).toHaveLength(1);
        expect(constats[0].gravite).toBe('erreur');
        expect(constats[0].ou).toBe('combat.statsToTrack[0].fieldId');
        expect(constats[0].message).toContain('jauge affichera zéro');
    });

    it('une composante de jet qui vise un titre de chapitre plutôt qu\'une section', () => {
        /**
         * Relevé en réel le 2026-08-12 : le modèle a rendu
         * `sectionId: "Les compétences"` — le titre de la section **du livre** —
         * là où le pilote attend l'identifiant d'une section **de la fiche**.
         * Les deux groupes de champs étant forgés séparément, rien ne les
         * accorde : c'est précisément ce que ce contrôle rattrape.
         */
        const constats = controlerLePilote(
            { jet: { seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'Les compétences' }] } } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['jet.seuil[0].sectionId']);
    });

    it('une réserve qui paie les dés sans exister', () => {
        const constats = controlerLePilote(
            { jet: { seuil: [], reserve: { base: 2, max: 5, faces: 20, ressource: 'impulsion' } } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['jet.reserve.ressource']);
    });

    it('une formule d\'initiative qui invoque un champ absent', () => {
        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: 'dex + int' } } as Partial<GameDriver>,
            fiche,
        );
        expect(constats).toHaveLength(2);
        expect(constats.every(c => c.ou === 'combat.initiativeFormula')).toBe(true);
    });

    it('mais une formule à dés purs ne déclenche rien', () => {
        // `1d10` n'est pas un champ de fiche. Un faux positif est le plus sûr
        // moyen de faire ignorer les vrais.
        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '1d10' } } as Partial<GameDriver>,
            fiche,
        );
        expect(constats).toEqual([]);
    });

    it('une tâche de défaite dont la section n\'existe pas', () => {
        const constats = controlerLePilote(
            {
                combat: {
                    statsToTrack: [], initiativeFormula: '',
                    tacheDeDefaite: { sectionDuSeuil: 'aptitudes', seuil: { min: 4, max: 8 }, progressionDeBase: 2, qualiteMax: 4 },
                },
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['combat.tacheDeDefaite.sectionDuSeuil']);
    });

    it('un champ par défaut pris dans la mauvaise section', () => {
        const constats = controlerLePilote(
            {
                combat: {
                    statsToTrack: [], initiativeFormula: '',
                    tacheDeDefaite: { sectionDuSeuil: 'competences', champParDefaut: 'determination', seuil: { min: 4, max: 8 }, progressionDeBase: 2, qualiteMax: 4 },
                },
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['combat.tacheDeDefaite.champParDefaut']);
    });

    it('une réserve qui se déverse dans le vide, ou dans elle-même', () => {
        const constats = controlerLePilote(
            {
                ressourcesDeTable: [
                    { id: 'impulsion', label: 'Impulsion', proprietaire: 'joueurs', depart: 0, min: 0, reportSurEpuisement: 'menace' },
                    { id: 'elan', label: 'Élan', proprietaire: 'joueurs', depart: 0, min: 0, reportSurEpuisement: 'elan' },
                ],
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats).toHaveLength(2);
        expect(constats[1].message).toContain('elle-même');
    });

    it('une logique de dés que le moteur ne connaît pas', () => {
        const constats = controlerLePilote(
            { dice: { defaultDice: '2d20', logic: 'compte-les-reussites' } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['dice.logic']);
    });
});

describe('ce qui manque est signalé sans être refusé', () => {
    it('une fiche sans section est un avertissement, pas une erreur', () => {
        // Un pilote incomplet se corrige ; le déclarer fautif empêcherait de
        // voir ce qui a été correctement dérivé par ailleurs.
        const constats = controlerLePilote({}, { sections: [] });
        expect(constats).toEqual([
            expect.objectContaining({ gravite: 'avertissement', ou: 'template.sections' }),
        ]);
    });

    it('un jeu sans réserve, sans tâche de défaite et sans initiative reste valide', () => {
        expect(controlerLePilote({ combat: { statsToTrack: [], initiativeFormula: '' } }, fiche)).toEqual([]);
    });
});

describe('un type de champ que la fiche ne sait pas rendre', () => {
    it('« string » n\'existe pas, et le composant de fiche retomberait sur son cas par défaut', () => {
        // Relevé en réel le 2026-08-12 sur le gabarit dérivé de Dune.
        const constats = controlerLePilote({}, {
            sections: [{ id: 'identite', label: 'Identité', fields: [{ id: 'role', label: 'Rôle', type: 'string' }] }],
        } as unknown as Partial<SheetTemplate>);
        expect(constats).toHaveLength(1);
        expect(constats[0].ou).toBe('template.sections[identite].fields[role].type');
    });
});

describe('champsInvoques', () => {
    it('retire la notation de dés et dédoublonne', () => {
        expect(champsInvoques('2d6 + dex + dex + int')).toEqual(['dex', 'int']);
    });
});
