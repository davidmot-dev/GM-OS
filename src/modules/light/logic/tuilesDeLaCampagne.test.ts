import { describe, it, expect } from 'vitest';
import { tuilesVisibles, tuilesOffertesAuRepli, tuileDuRaccourci } from './tuilesDeLaCampagne';

/**
 * Ce que ces tests protègent : **on ne voit que les ambiances de la campagne
 * qu'on joue, plus celles qui servent partout.**
 *
 * La règle de rattachement elle-même (*étiquette, pas cloison*) vit dans
 * `src/logic/rattachementALaCampagne.ts` et a ses propres essais, hérités de
 * Music-OS. Ici on ne garde que ce qui est **propre au râtelier lumineux**, et
 * c'est exactement là qu'un filtre recopié se serait trompé :
 *
 * | Ce qui est propre aux tuiles | Pourquoi |
 * | --- | --- |
 * | L'**éclairage normal** reste offert | il est global, il **agit**, et le masquer le rendrait impossible à changer |
 * | Une tuile vide ne répond pas au clavier | la touche passerait pour morte |
 * | Une campagne **redéfinit** une touche commune | son râtelier passe avant le pot commun |
 */

const tuile = (
    id: string,
    campagneId?: string | null,
    options: { pleine?: boolean; keyCode?: string } = {},
) => ({
    id,
    campagneId,
    keyCode: options.keyCode,
    lightStates: options.pleine === false ? {} : { '1': { on: true, bri: 200 } },
});

const CAMPAGNES = ['camp-a', 'camp-b'];

describe('les tuiles de la campagne ouverte', () => {
    it('montre celles de la campagne et les communes', () => {
        const rack = [tuile('SCENE_01', 'camp-a'), tuile('SCENE_02', null), tuile('SCENE_03', 'camp-b')];

        const vues = tuilesVisibles(rack, 'camp-a', CAMPAGNES).map(t => t.id);

        expect(vues).toContain('SCENE_01');
        expect(vues).toContain('SCENE_02');
        expect(vues, 'l’ambiance d’une autre campagne est offerte').not.toContain('SCENE_03');
    });

    it('garde visible une tuile rattachée à une campagne disparue', () => {
        const rack = [tuile('SCENE_01', 'camp-supprimee')];

        expect(
            tuilesVisibles(rack, 'camp-a', CAMPAGNES).map(t => t.id),
            'une orpheline s’évanouit sans cause apparente',
        ).toContain('SCENE_01');
    });

    it('ne masque rien quand aucune campagne n’est ouverte', () => {
        const rack = [tuile('SCENE_01', 'camp-a'), tuile('SCENE_02', 'camp-b')];

        expect(tuilesVisibles(rack, null, CAMPAGNES)).toHaveLength(2);
    });

    /**
     * ⭐ **Une exception a disparu ici le 2026-09-19, avec ce qui la rendait
     * nécessaire.**
     *
     * Tant que les dix-huit cases étaient *partagées*, une case vide devait
     * rester visible même rattachée ailleurs : c'était le seul endroit où l'on
     * capture, et la masquer retirait une case au meneur sans rien lui dire.
     *
     * Depuis que **chaque campagne a son râtelier**, cette case vide est celle
     * *de l'autre campagne* : la montrer encombrerait la grille de dix-sept
     * cases qui ne sont pas les nôtres. *Une exception qui protégeait d'un
     * manque devient un défaut quand le manque est comblé.*
     */
    it('ne montre pas les cases vides d’une autre campagne', () => {
        const rack = [
            tuile('SCENE_01', 'camp-b'),
            tuile('SCENE_02', 'camp-b', { pleine: false }),
        ];

        const vues = tuilesVisibles(rack, 'camp-a', CAMPAGNES).map(t => t.id);

        expect(vues, 'la grille se remplit des cases libres des autres').not.toContain('SCENE_02');
        expect(vues).not.toContain('SCENE_01');
    });

    it('montre en revanche les cases vides du pot commun', () => {
        const rack = [tuile('SCENE_02', null, { pleine: false })];

        expect(tuilesVisibles(rack, 'camp-a', CAMPAGNES).map(t => t.id)).toContain('SCENE_02');
    });

    it('ne montre pas deux fois une case vide de la campagne', () => {
        const rack = [tuile('SCENE_01', 'camp-a', { pleine: false })];

        expect(tuilesVisibles(rack, 'camp-a', CAMPAGNES)).toHaveLength(1);
    });
});

describe('les candidates à l’éclairage normal', () => {
    it('écarte les tuiles vides', () => {
        const rack = [tuile('SCENE_01'), tuile('SCENE_02', null, { pleine: false })];

        expect(tuilesOffertesAuRepli(rack, 'camp-a', null, CAMPAGNES).map(t => t.id))
            .toEqual(['SCENE_01']);
    });

    it('écarte celles d’une autre campagne', () => {
        const rack = [tuile('SCENE_01', 'camp-b')];

        expect(tuilesOffertesAuRepli(rack, 'camp-a', null, CAMPAGNES)).toHaveLength(0);
    });

    /**
     * ⚠️ **Sauf celle qui est désignée.** `defaultSceneId` est global et **il
     * agit** : le Stop All et les retours automatiques y mènent. Le masquer
     * donnerait un réglage qui commande les lampes sans apparaître nulle part,
     * et que le meneur ne pourrait donc pas changer. *Un réglage qui agit doit
     * rester visible ; c'est ce qui le distingue d'une panne.*
     */
    it('offre quand même la désignation en cours, fût-elle d’ailleurs', () => {
        const rack = [tuile('SCENE_01', 'camp-b')];

        expect(
            tuilesOffertesAuRepli(rack, 'camp-a', 'SCENE_01', CAMPAGNES).map(t => t.id),
            'l’éclairage normal agit sans être visible ni modifiable',
        ).toEqual(['SCENE_01']);
    });

    it('mais pas si elle est vide : elle ne ferait rien', () => {
        const rack = [tuile('SCENE_01', 'camp-b', { pleine: false })];

        expect(tuilesOffertesAuRepli(rack, 'camp-a', 'SCENE_01', CAMPAGNES)).toHaveLength(0);
    });
});

/**
 * ⛔ **Le clavier est le pire endroit où se tromper.** Deux campagnes attribuent
 * naturellement la même touche à leur ambiance d'ouverture : sans filtre, la
 * première trouvée l'emporte, et la pièce change de couleur devant les joueurs.
 */
describe('la touche qui lance une tuile', () => {
    it('ne trouve que dans la campagne ouverte et les communes', () => {
        const rack = [tuile('SCENE_01', 'camp-b', { keyCode: 'Numpad1' })];

        expect(
            tuileDuRaccourci(rack, 'camp-a', 'Numpad1', CAMPAGNES),
            'une touche a lancé l’ambiance d’une autre campagne',
        ).toBeNull();
    });

    /** La campagne passe avant : elle doit pouvoir redéfinir une touche générique. */
    it('préfère la tuile de la campagne à la commune qui porte la même touche', () => {
        const rack = [
            tuile('SCENE_09', null, { keyCode: 'Numpad1' }),
            tuile('SCENE_02', 'camp-a', { keyCode: 'Numpad1' }),
        ];

        expect(tuileDuRaccourci(rack, 'camp-a', 'Numpad1', CAMPAGNES)?.id).toBe('SCENE_02');
    });

    it('retombe sur la commune quand la campagne n’a rien sur cette touche', () => {
        const rack = [tuile('SCENE_09', null, { keyCode: 'Numpad1' })];

        expect(tuileDuRaccourci(rack, 'camp-a', 'Numpad1', CAMPAGNES)?.id).toBe('SCENE_09');
    });

    it('ignore une tuile vide qui porterait encore une touche', () => {
        const rack = [tuile('SCENE_01', null, { keyCode: 'Numpad1', pleine: false })];

        expect(tuileDuRaccourci(rack, 'camp-a', 'Numpad1', CAMPAGNES)).toBeNull();
    });

    it('ne trouve rien pour une touche que personne ne porte', () => {
        expect(tuileDuRaccourci([tuile('SCENE_01')], 'camp-a', 'Numpad1', CAMPAGNES)).toBeNull();
    });
});
