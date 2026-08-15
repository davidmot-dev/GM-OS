import { describe, it, expect } from 'vitest';
import { santeAAnnoncer, schemaDeLaChronique } from './ChronicleService';
import type { GameDriver } from '../../types/drivers';

/**
 * Ce que ces tests protègent : **la Forge de chronique ne demande que ce que le
 * jeu déclare compter**.
 *
 * **Le symptôme, relevé par David le 2026-08-15** : ses PNJ de Dune portaient
 * `hp: "Inférieure à 1 (gravement battu)"` et `speed: "Normal"` — des phrases
 * dans des champs typés `number`.
 *
 * La cause n'était pas le modèle. L'invite disait « Remplis "hp", "ac", "speed",
 * "initiative" en fonction du Driver » et montrait `"hp": 10, "ac": 10`. Sur
 * Dune, dont la mise hors de combat est une tâche étendue, il n'existe aucun
 * point de vie à donner : sommé de répondre, le modèle a répondu en mots.
 * *Ce n'est pas le modèle qui dérape, c'est la question qui n'a pas de réponse.*
 *
 * Le pilote savait pourtant répondre — `tacheDeDefaite`, `defaultHealthType`,
 * `santeDeDepart` — et rien de tout cela ne partait.
 */

const pilote = (combat: Partial<GameDriver['combat']>): GameDriver =>
    ({ id: 'x', name: 'Jeu', combat: { statsToTrack: [], initiativeFormula: '', ...combat } } as GameDriver);

describe('santeAAnnoncer — on ne demande que ce que le jeu compte', () => {
    it('un jeu à tâche de défaite ne se voit demander aucun point', () => {
        // Dune : le seuil vaut « la compétence défensive » de la cible, qui se lit
        // sur sa fiche. Une IA qui écrit une chronique ne la connaît pas.
        const { demandeDesPoints, consigne } = santeAAnnoncer(pilote({
            defaultHealthType: 'clocks',
            tacheDeDefaite: { sectionDuSeuil: 'competences', seuil: { min: 4, max: 8 } },
        } as Partial<GameDriver['combat']>));

        expect(demandeDesPoints, 'le défaut exact que David subissait').toBe(false);
        expect(consigne).toContain("N'A PAS DE POINTS DE VIE");
    });

    it('la tâche de défaite l\'emporte sur le modèle déclaré', () => {
        // `defaultHealthType: 'clocks'` ET des points seraient contradictoires ;
        // c'est la tâche qui décrit vraiment la mise hors de combat.
        const { demandeDesPoints } = santeAAnnoncer(pilote({
            defaultHealthType: 'hp',
            tacheDeDefaite: { sectionDuSeuil: 's', seuil: { min: 4, max: 8 } },
        } as Partial<GameDriver['combat']>));

        expect(demandeDesPoints).toBe(false);
    });

    it('un jeu à points demande des points, et dit à quelle échelle', () => {
        const { demandeDesPoints, consigne } = santeAAnnoncer(pilote({
            defaultHealthType: 'hp',
            santeDeDepart: 'force',
        }));

        expect(demandeDesPoints).toBe(true);
        // Chez Alien la Santé vaut la Force — deux à cinq. Sans le dire, le
        // modèle donne dix, parce que dix est ce qu'un autre jeu donne.
        expect(consigne).toContain('force');
        expect(consigne).toContain("à l'échelle de CE jeu");
    });

    it.each(['clocks', 'anatomy', 'wounds', 'boxes'] as const)(
        'un jeu qui compte en %s ne se voit demander aucun point',
        (modele) => {
            const { demandeDesPoints, consigne } = santeAAnnoncer(pilote({ defaultHealthType: modele }));
            expect(demandeDesPoints).toBe(false);
            expect(consigne).toContain('PAS par points');
        },
    );

    it('un pilote muet ne fait rien inventer', () => {
        // *L'absence n'est pas un zéro* : un pilote qui ne déclare pas de modèle
        // de santé n'en a pas un par défaut, il n'en a pas.
        const { demandeDesPoints, consigne } = santeAAnnoncer(pilote({}));
        expect(demandeDesPoints).toBe(false);
        expect(consigne).toContain('ne déclare aucun modèle de santé');
    });
});

describe('schemaDeLaChronique — la grammaire interdit ce que l\'invite enseignait', () => {
    const proprietesDUneEntite = (demandeDesPoints: boolean) => {
        const schema = schemaDeLaChronique(demandeDesPoints) as Record<string, any>;
        return schema.properties.entities.items;
    };

    it('aucun adversaire ne peut porter de classe d\'armure, de vitesse ni d\'initiative', () => {
        /**
         * Les trois partaient dans l'exemple et revenaient remplis. Aucun pilote
         * ne déclare de classe d'armure, et « trente pieds par round » est du
         * vocabulaire de D&D — personne ne lit ces champs.
         *
         * C'est `additionalProperties: false` qui fait le travail : une consigne
         * se contourne, une grammaire non.
         */
        const entite = proprietesDUneEntite(true);
        expect(entite.additionalProperties).toBe(false);
        expect(Object.keys(entite.properties)).not.toContain('ac');
        expect(Object.keys(entite.properties)).not.toContain('speed');
        expect(Object.keys(entite.properties)).not.toContain('initiative');
    });

    it('les points de vie n\'entrent dans la grammaire que si le jeu en compte', () => {
        expect(Object.keys(proprietesDUneEntite(true))).toBeDefined();
        expect(proprietesDUneEntite(true).properties.hp).toEqual({ type: 'number' });
        // Sur Dune, `hp` n'est pas « facultatif » : il est impossible à produire.
        expect(proprietesDUneEntite(false).properties.hp).toBeUndefined();
        expect(proprietesDUneEntite(false).properties.maxHp).toBeUndefined();
    });

    it('n\'exige qu\'un nom, jamais un contenu', () => {
        // Un champ absent se corrige ; un champ que la grammaire force à exister
        // se remplit par du bruit.
        expect(proprietesDUneEntite(true).required).toEqual(['name']);
    });

    it('les énumérations sont celles que le code accepte vraiment', () => {
        const schema = schemaDeLaChronique(true) as Record<string, any>;
        const relation = schema.properties.entities.items.properties.relations.items;

        // `EntityRelation['type']` — un type hors liste tombait dans le stockage
        // sans que rien ne le signale.
        expect(relation.properties.type.enum).toEqual(
            ['ally', 'neutral', 'hostile', 'family', 'romantic', 'mentor', 'rival', 'other'],
        );
        expect(schema.properties.lore.items.properties.category.enum).toContain('rumor');
        expect(schema.properties.locations.items.properties.type.enum).toContain('world-map');
    });
});
