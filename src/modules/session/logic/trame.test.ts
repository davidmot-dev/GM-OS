import { describe, it, expect } from 'vitest';
import {
    actesOrdonnes, scenesOrdonnees, prochainOrdre, deplacer,
    remplissageDeLaScene, scenesEmportees,
} from './trame';
import type { Acte, Scene } from '../../../types/trame.types';

/**
 * Ce que ces tests protègent : **la trame se lit dans le même ordre partout**.
 *
 * Trois écrans liront cette structure — la trame elle-même, la Forge de
 * campagne, et plus tard la capture en séance. Trois lectures écrites
 * séparément finiraient par ne plus ranger les scènes pareil, et c'est le genre
 * d'écart qu'on ne voit qu'en pleine partie. Même raison que
 * `piloteDuPersonnage`.
 */

const acte = (id: string, campaignId: string, ordre: number): Acte =>
    ({ id, campaignId, ordre, titre: id, resume: '' });

const scene = (id: string, acteId: string, ordre: number, extra: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c1', acteId, ordre, titre: id, resume: '',
    origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 0, ...extra,
});

describe('l\'ordre de la trame', () => {
    it('ne mélange pas deux campagnes qui partagent le tableau plat', () => {
        // Le store tient une seule liste, toutes campagnes confondues : une
        // insertion ailleurs ne doit pas réordonner celle qu'on regarde.
        const actes = [acte('b', 'c1', 1), acte('x', 'c2', 0), acte('a', 'c1', 0)];
        expect(actesOrdonnes(actes, 'c1').map(a => a.id)).toEqual(['a', 'b']);
        expect(actesOrdonnes(actes, 'c2').map(a => a.id)).toEqual(['x']);
    });

    it('sans campagne active, la trame est vide et non « tout »', () => {
        // Rendre l'ensemble ferait afficher les actes de toutes les campagnes
        // sur un écran qui promet celle qui est ouverte.
        expect(actesOrdonnes([acte('a', 'c1', 0)], null)).toEqual([]);
        expect(scenesOrdonnees([scene('s', 'a1', 0)], undefined)).toEqual([]);
    });

    it('le prochain rang suit le plus grand, pas le nombre d\'éléments', () => {
        // Après une suppression au milieu, les rangs ne sont plus contigus ;
        // compter les éléments produirait un doublon de rang.
        expect(prochainOrdre([{ ordre: 0 }, { ordre: 5 }])).toBe(6);
        expect(prochainOrdre([])).toBe(0);
    });
});

describe('deplacer — un échange, jamais une réécriture complète', () => {
    const ordonnes = [acte('a', 'c1', 0), acte('b', 'c1', 1), acte('c', 'c1', 2)];

    it('échange avec le voisin et ne touche que les deux', () => {
        expect(deplacer(ordonnes, 'b', 'haut')).toEqual([
            { id: 'b', ordre: 0 },
            { id: 'a', ordre: 1 },
        ]);
    });

    it('aux extrémités, rien ne bouge et rien n\'est signalé', () => {
        // Monter le premier acte n'est pas une erreur : c'est un geste sans
        // effet. Refuser bruyamment aurait fait clignoter l'écran sur un clic
        // parfaitement légitime.
        expect(deplacer(ordonnes, 'a', 'haut')).toEqual([]);
        expect(deplacer(ordonnes, 'c', 'bas')).toEqual([]);
    });

    it('un identifiant inconnu ne produit aucune écriture', () => {
        expect(deplacer(ordonnes, 'fantome', 'bas')).toEqual([]);
    });

    it('échange les RANGS et non les positions — les trous survivent', () => {
        const troue = [acte('a', 'c1', 0), acte('b', 'c1', 7)];
        expect(deplacer(troue, 'a', 'bas')).toEqual([
            { id: 'a', ordre: 7 },
            { id: 'b', ordre: 0 },
        ]);
    });
});

describe('remplissageDeLaScene — le taux remplace un second type d\'objet', () => {
    it('une scène née d\'un combat improvisé n\'a que son titre', () => {
        expect(remplissageDeLaScene(scene('s', 'a', 0, { origine: 'improvisee' }))).toBe(0);
    });

    it('une scène entièrement préparée atteint un', () => {
        const preparee = scene('s', 'a', 0, {
            resume: 'Les PJ cherchent le manifeste',
            lieuId: 'am-1',
            entiteIds: ['e-1'],
            indiceIds: ['clue-1'],
            momentDeStoryboardId: 'sm-1',
        });
        expect(remplissageDeLaScene(preparee)).toBe(1);
    });

    it('un résumé fait d\'espaces ne compte pas', () => {
        expect(remplissageDeLaScene(scene('s', 'a', 0, { resume: '   ' }))).toBe(0);
    });

    it('le taux ne dépend PAS de l\'origine déclarée', () => {
        /**
         * Une scène improvisée qu'on a retravaillée après la partie est une
         * scène complète, et l'écran doit le montrer. Lier le taux à l'origine
         * l'aurait figée dans son état de naissance — exactement ce que le
         * choix « un seul objet, pas deux types » cherchait à éviter.
         */
        const retravaillee = scene('s', 'a', 0, {
            origine: 'improvisee',
            resume: 'ce qui s\'y est joué',
            lieuId: 'am-1',
            entiteIds: ['e-1'],
        });
        expect(remplissageDeLaScene(retravaillee)).toBeCloseTo(3 / 5);
    });
});

describe('scenesEmportees — la confirmation dit ce qu\'elle coûte', () => {
    it('rend les scènes de l\'acte, et elles seules', () => {
        const scenes = [scene('s1', 'a1', 0), scene('s2', 'a2', 0), scene('s3', 'a1', 1)];
        expect(scenesEmportees(scenes, 'a1').map(s => s.id)).toEqual(['s1', 's3']);
    });

    it('un acte sans scène n\'emporte rien', () => {
        expect(scenesEmportees([scene('s1', 'a1', 0)], 'a2')).toEqual([]);
    });
});
