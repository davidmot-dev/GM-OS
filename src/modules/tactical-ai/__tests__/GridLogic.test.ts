import { describe, it, expect, vi } from 'vitest';
import { GridEngine } from '../logic/GridEngine';
import type { Combatant } from '../../combat/useCombatStore';
import { tacticalService } from '../../map/TacticalService';
import type { MapToken } from '../../map/types';
import type { TacticalConfig } from '../../../types/drivers';

describe('Sprint 2: Grid & Logic', () => {
  describe('GridEngine', () => {
    it('should calculate Euclidean distance correctly', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 30, y: 40 }; // 3-4-5 triangle
      const dist = GridEngine.calculateDistance(p1, p2);
      expect(dist).toBe(50);
    });

    it('should translate px to units correctly', () => {
      expect(GridEngine.pxToUnits(100, 50)).toBe(2);
      expect(GridEngine.pxToUnits(75, 50)).toBe(1.5);
    });

    it('should resolve range categories correctly', () => {
      expect(GridEngine.getRangeInfo(0.2).category).toBe('Contact');
      expect(GridEngine.getRangeInfo(1.5).category).toBe('Contact');
      expect(GridEngine.getRangeInfo(3.0).category).toBe('Courte');
      expect(GridEngine.getRangeInfo(10.0).category).toBe('Moyenne');
      expect(GridEngine.getRangeInfo(40.0).category).toBe('Longue');
      expect(GridEngine.getRangeInfo(100.0).category).toBe('Extrême');
    });

    it('should identify conflicting statuses', () => {
      const mockCombatant = {
        name: 'Test',
        statuses: [
          { name: 'En feu' },
          { name: 'Mouillé' }
        ]
      } as unknown as Combatant;
      const conflicts = GridEngine.getConflictingStatuses(mockCombatant);
      expect(conflicts).toContain('Mouillé');
      expect(conflicts).toContain('En feu');
    });
  });
});

/**
 * **Le test que le plan du 2026-08-07 réclamait, et qui n'avait jamais été
 * écrit.**
 *
 * *« Ajouter un test qui vérifie que les trois appelants produisent la même
 * catégorie pour la même distance — c'est la cohérence entre modules qui a
 * manqué, pas le calcul lui-même. »* (axe 1)
 *
 * Le défaut d'origine : `TacticalNarrativeService` ne transmettait pas la
 * configuration tactique du système à `GridEngine`, là où le pupitre et
 * l'orchestrateur la transmettaient. **Le même combattant à la même distance
 * était donc « Courte » sur un écran et « Contact » sur l'autre**, sans que rien
 * ne le signale — et c'est le rapport envoyé au modèle qui avait tort.
 */
describe('les appelants s’accordent sur la même distance', () => {
    const config: TacticalConfig = {
        uniteDeDistance: 'zones',
        useTacticalAI: true,
        ranges: {
            contact: { label: 'au toucher', maxUnits: 1, modifier: 0 },
            courte: { label: 'tranche courte', maxUnits: 2, modifier: 0 },
            moyenne: { label: 'tranche moyenne', maxUnits: 3, modifier: -1 },
            longue: { label: 'tranche longue', maxUnits: 4, modifier: -2 },
            extreme: { label: 'hors de portée', maxUnits: 5, modifier: -3 },
        },
    };

    /** Deux jetons séparés d'un nombre d'unités donné, sur une grille de 50 px. */
    const jetons = (unites: number) => [
        { id: 'a', name: 'A', x: 0, y: 0 } as MapToken,
        { id: 'b', name: 'B', x: unites * 50, y: 0 } as MapToken,
    ] as const;

    it('rendent la même bande, avec et sans configuration', () => {
        for (const unites of [0.5, 1, 1.8, 2.5, 3.5, 4.5, 10]) {
            const [a, b] = jetons(unites);

            // Le moteur, seule source du calcul.
            const duMoteur = GridEngine.getRangeInfo(unites, config);
            // La carte, qui passe par les pixels avant d'y revenir.
            const deLaCarte = tacticalService.getRangeInfo(a, b, 50, config);

            expect(deLaCarte.category, `à ${unites} unités`).toBe(duMoteur.category);
            expect(deLaCarte.modifier, `à ${unites} unités`).toBe(duMoteur.modifier);
        }
    });

    it('rendent la bande du PILOTE, et non celle du repli, dès qu’il en déclare une', () => {
        // Le repli interne place « Courte » jusqu'à 3,5 unités ; cette
        // configuration l'arrête à 2. Une distance de 3 sépare donc les deux —
        // c'est exactement l'écart que le défaut d'origine produisait.
        expect(GridEngine.getRangeInfo(3).category, 'sans pilote').toBe('Courte');
        expect(GridEngine.getRangeInfo(3, config).category, 'avec pilote').toBe('Moyenne');
    });

    it('portent le nom que le pilote donne à la bande', () => {
        expect(GridEngine.getRangeInfo(1, config).label).toBe('au toucher');
        // Sans pilote, le nom canonique — jamais un vide.
        expect(GridEngine.getRangeInfo(1).label).toBe('Contact');
    });
});


/**
 * **Un pilote qui ne déclare pas toutes ses bandes faisait planter le Cortex.**
 *
 * Trouvé par David le 2026-08-24, en relançant l'application après la
 * restauration de sa base : `Cannot read properties of undefined (reading
 * 'maxUnits')`, à chaque passe, sur la campagne « A la claire fontaine ».
 *
 * `config?.ranges || defaults` ne se déclenchait que si `ranges` manquait **en
 * entier**. Quatre bandes sur cinq passaient donc à travers, et la cinquième
 * restait `undefined`.
 *
 * *Il fallait deux conditions pour le voir*, et c'est pourquoi il a dormi : un
 * pilote incomplet, **et** une distance qui tombe pile dans la bande absente.
 */
describe('un pilote qui ne déclare pas toutes ses bandes', () => {
    /** Le pilote « Rêve de Dragon » tel qu'il est dans les données de David : sans `longue`. */
    const sansLongue = {
        useTacticalAI: true,
        ranges: {
            contact: { label: 'au contact', maxUnits: 1, modifier: 0 },
            courte: { label: 'courte', maxUnits: 3, modifier: 0 },
            moyenne: { label: 'moyenne', maxUnits: 12.5, modifier: -1 },
            extreme: { label: 'extrême', maxUnits: 200, modifier: -3 },
        },
    } as unknown as TacticalConfig;

    /** Le pilote « Cthulhu Hack », lui, n'a pas d'`extreme`. */
    const sansExtreme = {
        useTacticalAI: true,
        ranges: {
            contact: { label: 'contact', maxUnits: 1, modifier: 0 },
            courte: { label: 'courte', maxUnits: 3, modifier: 0 },
            moyenne: { label: 'moyenne', maxUnits: 10, modifier: -1 },
            longue: { label: 'longue', maxUnits: 30, modifier: -2 },
        },
    } as unknown as TacticalConfig;

    it('ne lève plus — c’est le plantage exact du 2026-08-24, à 13,9 unités', () => {
        expect(() => GridEngine.getRangeInfo(13.9, sansLongue)).not.toThrow();
        expect(GridEngine.getRangeInfo(13.9, sansLongue).category).toBe('Longue');
    });

    it('ne lève pas non plus sur la bande la plus lointaine', () => {
        expect(() => GridEngine.getRangeInfo(500, sansExtreme)).not.toThrow();
        expect(GridEngine.getRangeInfo(500, sansExtreme).category).toBe('Extrême');
    });

    /**
     * **La fusion ne doit pas coûter les bandes que le pilote déclare.** Un
     * repli qui remplacerait tout le bloc rendrait « Moyenne » jusqu'à 12,5 —
     * la valeur d'Alien — au lieu des 10 que ce pilote-ci annonce.
     */
    it('garde les bandes DÉCLARÉES et ne supplée que celle qui manque', () => {
        expect(GridEngine.getRangeInfo(11, sansExtreme).category).toBe('Longue');
        expect(GridEngine.getRangeInfo(9, sansExtreme).label).toBe('moyenne');
        expect(GridEngine.getRangeInfo(2, sansLongue).label).toBe('courte');
    });

    it('le dit à la console — une bande suppléée en silence ne se corrige jamais', async () => {
        vi.resetModules();
        const { GridEngine: Moteur } = await import('../logic/GridEngine');
        const avert = vi.spyOn(console, 'warn').mockImplementation(() => { /* silence */ });

        Moteur.getRangeInfo(13.9, sansLongue);

        expect(avert).toHaveBeenCalledTimes(1);
        expect(avert.mock.calls[0][0]).toContain('longue');

        // Et une seule fois : le Cortex appelle ceci pour chaque adversaire, à
        // chaque passe. Un avertissement par appel noierait la console.
        Moteur.getRangeInfo(20, sansLongue);
        expect(avert).toHaveBeenCalledTimes(1);

        avert.mockRestore();
    });

    it('reste muet quand le pilote ne declare AUCUNE portee — cas legitime', async () => {
        vi.resetModules();
        const { GridEngine: Moteur } = await import('../logic/GridEngine');
        const avert = vi.spyOn(console, 'warn').mockImplementation(() => { /* silence */ });

        // Un jeu sans portees chiffrees, ou un appel sans pilote : le repli
        // complet est le comportement voulu, il n'y a rien a signaler.
        Moteur.getRangeInfo(13.9);
        Moteur.getRangeInfo(13.9, { useTacticalAI: true } as never);

        expect(avert).not.toHaveBeenCalled();
        avert.mockRestore();
    });

    it('reste muet quand le pilote est complet', async () => {
        vi.resetModules();
        const { GridEngine: Moteur } = await import('../logic/GridEngine');
        const avert = vi.spyOn(console, 'warn').mockImplementation(() => { /* silence */ });

        const complet = {
            useTacticalAI: true,
            ranges: {
                contact: { label: 'contact', maxUnits: 1, modifier: 0 },
                courte: { label: 'courte', maxUnits: 3, modifier: 0 },
                moyenne: { label: 'moyenne', maxUnits: 10, modifier: -1 },
                longue: { label: 'longue', maxUnits: 30, modifier: -2 },
                extreme: { label: 'extrême', maxUnits: 200, modifier: -3 },
            },
        } as unknown as TacticalConfig;

        Moteur.getRangeInfo(3, complet);

        expect(avert).not.toHaveBeenCalled();
        avert.mockRestore();
    });
});
