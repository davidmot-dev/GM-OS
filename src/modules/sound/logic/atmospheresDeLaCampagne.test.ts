import { describe, it, expect } from 'vitest';
import {
    atmospheresVisibles, atmosphereApresChangement, atmosphereDuClavier,
} from './atmospheresDeLaCampagne';
import { atmospheresApresInstantane } from './instantaneDeSeance';

/**
 * Ce que ces tests protègent : **on ne voit et on ne joue que les atmosphères
 * de la campagne qu'on mène.**
 *
 * Sound-OS était le **dernier des trois modules d'ambiance** sans rattachement,
 * après Music-OS (2026-08-30) et Light-OS (le matin du 19/09). La règle de
 * classement est partagée — `src/logic/rattachementALaCampagne.ts` — et a ses
 * propres essais. Ici on ne garde que ce qui est **propre à Sound-OS**.
 *
 * ⭐ **Et ce qui lui est propre, c'est surtout ce qu'il n'a PAS.** Son clavier
 * ne parcourt pas toutes les atmosphères : `KeyboardEngine` ne lit que
 * l'active. Le défaut que Music-OS a payé en août — *le clavier était le
 * dernier chemin non cloisonné* — ne peut donc pas se produire ici.
 *
 * ⛔ **Il n'en avait qu'un : son repli.** `atmospheres[0]`, la première de la
 * liste brute, peut appartenir à une campagne qu'on ne joue pas. *Un repli qui
 * ignore le cloisonnement le perce aussi sûrement qu'une boucle.*
 */

const atmo = (id: string, campagneId?: string | null, avecSon = true) => ({
    id,
    campagneId,
    pads: avecSon
        ? { PAD_01: { filePath: `C:/sons/${id}.wav` } }
        : { PAD_01: { filePath: null } },
});

const CAMPAGNES = ['camp-a', 'camp-b'];

describe('les atmosphères visibles', () => {
    it('montre celles de la campagne et les communes', () => {
        const liste = [atmo('a', 'camp-a'), atmo('c', null), atmo('b', 'camp-b')];

        const vues = atmospheresVisibles(liste, 'camp-a', CAMPAGNES).map(a => a.id);

        expect(vues).toContain('a');
        expect(vues).toContain('c');
        expect(vues, 'l’atmosphère d’une autre campagne est offerte').not.toContain('b');
    });

    it('garde visible une atmosphère dont la campagne a été supprimée', () => {
        const liste = [atmo('a', 'camp-disparue')];

        expect(
            atmospheresVisibles(liste, 'camp-a', CAMPAGNES).map(a => a.id),
            'du travail s’évanouit sans cause apparente',
        ).toContain('a');
    });

    it('ne masque rien quand aucune campagne n’est ouverte', () => {
        const liste = [atmo('a', 'camp-a'), atmo('b', 'camp-b')];

        expect(atmospheresVisibles(liste, null, CAMPAGNES)).toHaveLength(2);
    });
});

describe('l’onglet actif après un changement de campagne', () => {
    it('ne bouge pas si l’atmosphère reste visible', () => {
        const liste = [atmo('a', 'camp-a'), atmo('c', null)];

        expect(atmosphereApresChangement(liste, 'camp-a', 'c', CAMPAGNES)).toBe('c');
    });

    /**
     * ⛔ Une sélection pointant sur une atmosphère masquée laisserait **seize
     * pads à l'écran sans qu'aucun onglet ne soit allumé** — ou pire, ceux
     * d'une campagne qu'on ne joue pas.
     */
    it('retombe sur la première visible quand elle a disparu', () => {
        const liste = [atmo('a', 'camp-a'), atmo('b', 'camp-b')];

        expect(atmosphereApresChangement(liste, 'camp-a', 'b', CAMPAGNES)).toBe('a');
    });

    it('rend null quand la campagne n’a rien à montrer', () => {
        const liste = [atmo('b', 'camp-b')];

        expect(atmosphereApresChangement(liste, 'camp-a', 'b', CAMPAGNES)).toBeNull();
    });
});

/**
 * ⛔ **Le seul trou du clavier de Sound-OS, et il est dans le repli.**
 */
describe('l’atmosphère dont le clavier joue les pads', () => {
    it('est l’active quand elle est visible', () => {
        const liste = [atmo('a', 'camp-a'), atmo('c', null)];

        expect(atmosphereDuClavier(liste, 'camp-a', 'c', CAMPAGNES)?.id).toBe('c');
    });

    it('n’est JAMAIS celle d’une autre campagne, même en repli', () => {
        const liste = [atmo('b', 'camp-b'), atmo('a', 'camp-a')];

        expect(
            atmosphereDuClavier(liste, 'camp-a', null, CAMPAGNES)?.id,
            'une touche lance un bruitage d’une campagne qu’on ne joue pas',
        ).toBe('a');
    });

    /** Ne rien jouer est juste : le clavier se tait plutôt que de se tromper. */
    it('rend null quand la campagne n’a aucune atmosphère', () => {
        expect(atmosphereDuClavier([atmo('b', 'camp-b')], 'camp-a', null, CAMPAGNES)).toBeNull();
    });
});

/**
 * ⭐ **Un champ neuf change la réponse de fonctions écrites avant lui.** La
 * fusion d'instantané ne connaissait pas de propriétaire pour Sound-OS le matin
 * du 19/09 — elle en connaît un le soir, sans quoi restaurer une séance d'une
 * campagne écraserait le rangement d'une autre.
 */
describe('la fusion d’un instantané respecte le propriétaire', () => {
    it('refuse d’écraser l’atmosphère d’une autre campagne', () => {
        const mienne = [{ ...atmo('a', 'camp-b'), marque: 'aujourd_hui' }];
        const venue = [{ ...atmo('a', 'camp-a'), marque: 'instantane' }];

        expect(atmospheresApresInstantane(mienne, venue)[0].marque).toBe('aujourd_hui');
    });

    it('mais restaure bien la sienne', () => {
        const mienne = [{ ...atmo('a', 'camp-a'), marque: 'aujourd_hui' }];
        const venue = [{ ...atmo('a', 'camp-a'), marque: 'instantane' }];

        expect(atmospheresApresInstantane(mienne, venue)[0].marque).toBe('instantane');
    });

    it('et deux communes sont bien le même propriétaire', () => {
        const mienne = [{ ...atmo('a', null), marque: 'aujourd_hui' }];
        const venue = [{ ...atmo('a'), marque: 'instantane' }];

        expect(atmospheresApresInstantane(mienne, venue)[0].marque).toBe('instantane');
    });
});
