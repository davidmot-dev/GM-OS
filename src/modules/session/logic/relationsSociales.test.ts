import { describe, it, expect } from 'vitest';
import {
    NATURES_DE_RELATION,
    NATURES_ORDONNEES,
    couleurDeRelation,
    distanceDeRelation,
    libelleDeRelation,
    natureDe,
} from './relationsSociales';
import fr from '../../../locales/fr/modules.json';

/**
 * Ce que ces tests protègent : **le formulaire enregistre ce qu'il affiche.**
 *
 * Il ne le faisait pas. La liste des types était écrite à la main et avait
 * divergé de l'union : « Ami » posait `romantic`, « Neutre » apparaissait deux
 * fois — une pour `mentor`, une pour `neutral` — et `other` n'était pas
 * proposé. *On ne soupçonne pas ce qu'on a soi-même choisi.*
 */

const legende = (fr as { session: { social_graph: { legend: Record<string, string> } } })
    .session.social_graph.legend;

describe('les natures de relation', () => {
    /**
     * **Le défaut d'origine, tenu par un test.** Trois types n'avaient aucun
     * libellé — c'est ce trou que le formulaire comblait en empruntant celui du
     * voisin.
     */
    it('ont toutes un libellé, et il existe vraiment', () => {
        for (const nature of NATURES_ORDONNEES) {
            const cle = NATURES_DE_RELATION[nature].cle;
            expect(legende[cle], `« ${nature} » n'a pas de libellé`).toBeTruthy();
        }
    });

    /** Deux entrées portant le même mot rendent le choix indécidable. */
    it('ne partagent pas deux fois le même libellé', () => {
        const libelles = NATURES_ORDONNEES.map(n => legende[NATURES_DE_RELATION[n].cle]);
        expect(new Set(libelles).size).toBe(libelles.length);
    });

    /**
     * Les données persistées portent un `type: string` libre — une campagne
     * d'avril ne doit pas faire tomber un écran d'août.
     */
    it('retombent sur « autre » devant un type inconnu, sans casser', () => {
        expect(natureDe('serment-de-sang')).toBe(NATURES_DE_RELATION.other);
        expect(couleurDeRelation('')).toBe(NATURES_DE_RELATION.other.couleur);
    });
});

describe('la physique du graphe', () => {
    /**
     * L'« influence sur la physique » du jalon d'avril 2026, qui n'existait
     * pas : la même distance valait pour tout le monde, et la disposition ne
     * disait donc rien que les couleurs ne disaient déjà.
     */
    it('rapproche les liens chaleureux et écarte les froids', () => {
        const base = 100;
        expect(distanceDeRelation('family', base)).toBeLessThan(base);
        expect(distanceDeRelation('ally', base)).toBeLessThan(base);
        expect(distanceDeRelation('neutral', base)).toBe(base);
        expect(distanceDeRelation('rival', base)).toBeGreaterThan(base);
        expect(distanceDeRelation('hostile', base)).toBeGreaterThan(base);
    });

    /** Le curseur du meneur reste la référence : on module, on ne remplace pas. */
    it('reste proportionnelle au réglage du meneur', () => {
        expect(distanceDeRelation('hostile', 200)).toBe(distanceDeRelation('hostile', 100) * 2);
    });
});

describe('le nom d’une relation', () => {
    const traduire = (cle: string) => cle.split('.').pop() ?? cle;

    it('est celui de sa nature quand le meneur n’en donne pas', () => {
        expect(libelleDeRelation({ type: 'hostile' }, traduire)).toBe('hostile');
    });

    /**
     * **C'est tout le mécanisme des types personnalisés** : la nature décide de
     * la couleur et de la distance, le libellé décide de ce qui s'affiche.
     */
    it('est celui que le meneur a écrit, sans changer la nature', () => {
        const serment = { type: 'ally', libelle: 'Serment de sang' };
        expect(libelleDeRelation(serment, traduire)).toBe('Serment de sang');
        expect(couleurDeRelation(serment.type)).toBe(NATURES_DE_RELATION.ally.couleur);
        expect(distanceDeRelation(serment.type, 100)).toBe(distanceDeRelation('ally', 100));
    });

    /**
     * Un libellé blanc n'est pas un libellé : sans ce garde, un espace saisi par
     * mégarde masquerait le nom de la nature et l'étiquette deviendrait vide.
     */
    it('ignore un libellé qui ne contient que du vide', () => {
        expect(libelleDeRelation({ type: 'rival', libelle: '   ' }, traduire)).toBe('rival');
    });
});
