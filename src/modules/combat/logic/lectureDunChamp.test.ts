import { describe, it, expect } from 'vitest';
import { valeurDuChamp, clefDeChamp, santeDeDepart } from './SanteDuCombattant';
import { controlerLePilote } from '../../forge/rules/controlesDuPilote';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **Une seule lecture d'un champ de fiche, et cinq portes qui s'y rangent.**
 *
 * Relevé par David le 2026-08-21 sur Rêves de Dragons : la revue reprochait à
 * `(Taille + Constitution) / 2` d'invoquer « Taille », que le combat retrouve
 * pourtant sans hésiter sur un champ `taille`. Cinq endroits posaient la même
 * question et répondaient de trois façons — le jet d'initiative et la santé au
 * combat sans la casse, l'éditeur de fiche, la création de personnage et le
 * contrôle du pilote avec.
 *
 * Deux conséquences, toutes deux muettes : **le contrôle condamnait ce que le
 * jeu sait jouer**, et **le même personnage n'obtenait pas la même santé de
 * départ selon l'écran par lequel il était passé.**
 *
 * *Cinq chemins vers la même question finissent toujours par ne plus dire la
 * même chose* — troisième fois que ce module le paie, après la découpe des
 * identifiants et le sens du comptage.
 */

const fiche: Partial<SheetTemplate> = {
    sections: [{
        id: 'personnage',
        label: 'Personnage',
        fields: [
            { id: 'taille', label: 'Taille', type: 'number' },
            { id: 'constitution', label: 'Constitution', type: 'number' },
            { id: 'de_de_vie', label: 'Dé de vie', type: 'text' },
        ],
    }] as SheetTemplate['sections'],
};

describe('la clé d\'un champ ignore la casse et les accents', () => {
    it('« Taille » et « taille » désignent le même champ', () => {
        expect(clefDeChamp('Taille')).toBe(clefDeChamp('taille'));
    });

    it('« Dé_de_vie » et « de_de_vie » aussi', () => {
        expect(clefDeChamp('Dé_de_vie')).toBe(clefDeChamp('de_de_vie'));
    });

    it('mais deux champs distincts le restent', () => {
        expect(clefDeChamp('force')).not.toBe(clefDeChamp('force_mentale'));
    });
});

describe('lire un champ, quel que soit l\'habillage de son nom', () => {
    const donnees = { taille: 12, Constitution: '8', de_de_vie: 'D (D6)' };

    it('retrouve la valeur sans la casse', () => {
        expect(valeurDuChamp(donnees, 'Taille')).toBe(12);
        expect(valeurDuChamp(donnees, 'constitution')).toBe(8);
    });

    it('un champ illisible en nombre est une ABSENCE, jamais un zéro', () => {
        // `force: "D (D6)"` — la notation des dés échelonnés. Y substituer zéro
        // ferait naître un personnage à un point de vie.
        expect(valeurDuChamp(donnees, 'de_de_vie')).toBeUndefined();
        expect(valeurDuChamp(donnees, 'inexistant')).toBeUndefined();
        expect(valeurDuChamp(undefined, 'taille')).toBeUndefined();
    });

    it('la santé de départ se calcule alors sur des libellés capitalisés', () => {
        // C'est la formule exacte que la dérivation de Rêves de Dragons a rendue.
        expect(santeDeDepart('(Taille + Constitution) / 2', c => valeurDuChamp(donnees, c))).toBe(10);
    });
});

describe('le contrôle du pilote ne condamne plus ce que le jeu sait jouer', () => {
    it('une formule écrite avec les libellés passe', () => {
        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '', santeDeDepart: '(Taille + Constitution) / 2' } } as Partial<GameDriver>,
            fiche,
        );

        expect(constats).toEqual([]);
    });

    it('mais un champ réellement absent est toujours nommé', () => {
        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: 'caracteristique_principale / 2 + 1d6' } } as Partial<GameDriver>,
            fiche,
        );

        expect(constats).toHaveLength(1);
        expect(constats[0].message).toContain('caracteristique_principale');
    });

    it('et quand la fiche porte ce libellé, elle dit sous quel identifiant', () => {
        /**
         * Le message s'arrêtait à « n'est un champ d'aucune section », laissant
         * deviner par quoi remplacer. L'outil le sait pourtant : même geste que
         * la suggestion déjà rendue sur les `sectionId`.
         */
        const avecLibelleSeul: Partial<SheetTemplate> = {
            sections: [{
                id: 'personnage', label: 'Personnage',
                fields: [{ id: 'carac_taille', label: 'Taille', type: 'number' }],
            }] as SheetTemplate['sections'],
        };

        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '', santeDeDepart: 'Taille * 2' } } as Partial<GameDriver>,
            avecLibelleSeul,
        );

        expect(constats[0].message).toContain('sous l\'identifiant « carac_taille »');
    });

    it('le type se juge sur le champ RÉEL, pas sur le nom invoqué', () => {
        // « Dé_de_vie » retrouve `de_de_vie`, qui est un `text` : la formule ne
        // s'évaluera jamais, et c'est ce qu'il faut dire.
        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '', santeDeDepart: 'Dé_de_vie + 8' } } as Partial<GameDriver>,
            fiche,
        );

        expect(constats).toHaveLength(1);
        expect(constats[0].message).toContain('« text »');
    });
});
