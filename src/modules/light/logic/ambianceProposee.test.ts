import { describe, it, expect } from 'vitest';
import {
    effetReconnu, couleurValide, brillanceDepuisPourcent,
    lampeDesignee, etatsDeLaProposition, nomDeLAmbiance,
} from './ambianceProposee';
import type { AmbianceProposee } from './ambianceProposee';
import type { HueLight } from '../useLightStore';

/**
 * Ce que ces tests protègent : **une ambiance proposée par l'IA joue vraiment,
 * ou elle le dit.**
 *
 * ⛔ **Le défaut qu'on redoute ici ne lève aucune erreur.** Un modèle qui
 * invente un nom d'effet donne une lampe dont le moteur ne trouve pas le
 * `case` : la boucle n'est jamais lancée, la lampe reste fixe, et *rien ne le
 * signale*. Une ambiance à moitié muette ressemble à une ambiance ratée, pas à
 * une panne — et on ne s'en aperçoit qu'en séance.
 *
 * *Un contrôle qui se trompe est pire qu'un contrôle absent* : c'est pourquoi
 * chaque refus de ce fichier rend une valeur jouable, jamais `undefined`.
 */

const LAMPES: Record<string, HueLight> = {
    '1': { id: '1', name: 'Lustre', type: 'Color', state: { on: true, bri: 200 } },
    '2': { id: '2', name: 'Lampe du fond', type: 'Color', state: { on: true, bri: 200 } },
};

const versXy = (): [number, number] => [0.4, 0.4];

const proposition = (lampes: AmbianceProposee['lampes']): AmbianceProposee => ({
    nom: 'Âtre enfumé',
    justification: 'La pluie dehors, le feu dedans.',
    lampes,
});

describe('l’effet rendu par le modèle', () => {
    it('passe quand le moteur le connaît', () => {
        expect(effetReconnu('candle')).toBe('candle');
        expect(effetReconnu('aube-doree')).toBe('aube-doree');
    });

    it('tolère une casse ou une espace de trop', () => {
        expect(effetReconnu('  Candle ')).toBe('candle');
    });

    it('accepte les deux entrées hors catalogue', () => {
        expect(effetReconnu('none')).toBe('none');
        expect(effetReconnu('colorloop')).toBe('colorloop');
    });

    /**
     * ⛔ **Le cas qui compte.** `feu-de-cheminee` n'existe pas dans le moteur :
     * le laisser passer donnerait une lampe qui *devrait* vaciller et reste
     * fixe, sans un mot. `none` est un mensonge plus honnête — la lampe est
     * fixe, et l'écran le dit.
     */
    it('retombe sur « aucun » quand le modèle l’invente', () => {
        expect(effetReconnu('feu-de-cheminee')).toBe('none');
        expect(effetReconnu('flamme vacillante')).toBe('none');
    });

    it('ne se laisse pas surprendre par ce qui n’est pas un texte', () => {
        expect(effetReconnu(undefined)).toBe('none');
        expect(effetReconnu(42)).toBe('none');
        expect(effetReconnu(null)).toBe('none');
    });
});

describe('la couleur', () => {
    it('accepte les deux écritures hexadécimales', () => {
        expect(couleurValide('#ff9a3c')).toBe('#ff9a3c');
        expect(couleurValide('#A3F')).toBe('#a3f');
    });

    /** *On n'invente pas une teinte* : sans couleur lisible, la lampe est écartée. */
    it('refuse tout le reste', () => {
        expect(couleurValide('orange')).toBeNull();
        expect(couleurValide('rgb(255,0,0)')).toBeNull();
        expect(couleurValide('#gg0000')).toBeNull();
        expect(couleurValide(undefined)).toBeNull();
    });
});

describe('la brillance', () => {
    it('convertit un pourcentage en brillance Hue', () => {
        expect(brillanceDepuisPourcent(100)).toBe(254);
        expect(brillanceDepuisPourcent(50)).toBe(127);
    });

    it('ne descend jamais à zéro par accident', () => {
        expect(brillanceDepuisPourcent(0.1)).toBe(1);
    });

    /** Zéro pile est une décision : « éteinte ». */
    it('mais zéro pile reste zéro', () => {
        expect(brillanceDepuisPourcent(0)).toBe(0);
    });

    it('borne ce qui dépasse, et retombe sur pleine si c’est illisible', () => {
        expect(brillanceDepuisPourcent(480)).toBe(254);
        expect(brillanceDepuisPourcent('beaucoup')).toBe(254);
    });
});

describe('retrouver la lampe que le modèle désignait', () => {
    it('par son nom exact', () => {
        expect(lampeDesignee('Lustre', LAMPES)).toBe('1');
    });

    /** *Refuser sur une majuscule ferait passer une ambiance entière pour un échec.* */
    it('malgré la casse, les accents et la ponctuation', () => {
        expect(lampeDesignee('lampe du Fond', LAMPES)).toBe('2');
        expect(lampeDesignee('Lampe-du-fond', LAMPES)).toBe('2');
    });

    it('et rend null pour une lampe qui n’existe pas', () => {
        expect(lampeDesignee('Applique murale', LAMPES)).toBeNull();
        expect(lampeDesignee('', LAMPES)).toBeNull();
    });
});

describe('la proposition ramenée à des états de lampe', () => {
    it('pose la couleur, l’effet et la brillance', () => {
        const etats = etatsDeLaProposition(
            proposition([{ lampe: 'Lustre', couleur: '#ff9a3c', effet: 'candle', brillance: 80 }]),
            LAMPES, versXy,
        );

        expect(etats['1'].on).toBe(true);
        expect(etats['1'].effect).toBe('candle');
        expect(etats['1'].bri).toBe(203);
        expect(etats['1'].xy).toEqual([0.4, 0.4]);
    });

    /**
     * ⚠️ **Une lampe oubliée est éteinte, pas laissée telle quelle.** Sinon elle
     * garderait ce qu'une autre scène y avait mis, et l'ambiance ne serait
     * jamais deux fois la même. *Un oubli silencieux est pire qu'un noir
     * assumé.*
     */
    it('éteint les lampes dont le modèle n’a rien dit', () => {
        const etats = etatsDeLaProposition(
            proposition([{ lampe: 'Lustre', couleur: '#ff9a3c', effet: 'none', brillance: 80 }]),
            LAMPES, versXy,
        );

        expect(Object.keys(etats)).toHaveLength(2);
        expect(etats['2'].on, 'la lampe oubliée garde ce qu’une autre scène y avait mis').toBe(false);
    });

    it('écarte une lampe dont la couleur est illisible', () => {
        const etats = etatsDeLaProposition(
            proposition([{ lampe: 'Lustre', couleur: 'orangé', effet: 'candle', brillance: 80 }]),
            LAMPES, versXy,
        );

        expect(etats['1'].on, 'une couleur inventée a été posée sur la lampe').toBe(false);
    });

    it('ignore une lampe qui n’existe pas chez le meneur', () => {
        const etats = etatsDeLaProposition(
            proposition([{ lampe: 'Projecteur de scène', couleur: '#ffffff', effet: 'none', brillance: 100 }]),
            LAMPES, versXy,
        );

        expect(Object.values(etats).every(e => e.on === false)).toBe(true);
    });

    /** Le pont refuse une commande de couleur sur une ampoule qu'on éteint. */
    it('n’envoie ni couleur ni effet à une lampe éteinte', () => {
        const etats = etatsDeLaProposition(
            proposition([{ lampe: 'Lustre', couleur: '#ff9a3c', effet: 'candle', brillance: 0 }]),
            LAMPES, versXy,
        );

        expect(etats['1'].on).toBe(false);
        expect(etats['1'].xy).toBeUndefined();
        expect(etats['1'].effect).toBe('none');
    });

    /*
      ⚠️ **Pas de proposition n'est pas une ambiance noire.** La règle « une
      lampe oubliée est éteinte » vaut *à l'intérieur* d'une proposition ; sans
      proposition du tout, il n'y a rien à appliquer — et rendre dix-huit
      lampes éteintes ferait d'un appel raté une extinction de la pièce.
    */
    it('ne rend rien du tout quand il n’y a pas de proposition', () => {
        expect(etatsDeLaProposition(null, LAMPES, versXy)).toEqual({});
        expect(etatsDeLaProposition(undefined, LAMPES, versXy)).toEqual({});
    });

    it('survit à un modèle qui rend n’importe quoi', () => {
        const nimporteQuoi = { nom: 'x', justification: 'y' } as AmbianceProposee;

        expect(() => etatsDeLaProposition(nimporteQuoi, LAMPES, versXy)).not.toThrow();
    });
});

describe('le nom de l’ambiance', () => {
    it('est repris tel quel', () => {
        expect(nomDeLAmbiance('Âtre enfumé', 'Ambiance')).toBe('Âtre enfumé');
    });

    it('perd les guillemets que le modèle aime ajouter', () => {
        expect(nomDeLAmbiance('« Âtre enfumé »', 'Ambiance')).toBe('Âtre enfumé');
        expect(nomDeLAmbiance('"Taverne"', 'Ambiance')).toBe('Taverne');
    });

    it('retombe sur le nom de la scène quand il manque', () => {
        expect(nomDeLAmbiance('', 'La taverne')).toBe('La taverne');
        expect(nomDeLAmbiance(undefined, 'La taverne')).toBe('La taverne');
    });

    /** Une tuile est un carré : un nom fleuve y devient illisible. */
    it('et se borne', () => {
        expect(nomDeLAmbiance('a'.repeat(80), 'x')).toHaveLength(40);
    });
});
