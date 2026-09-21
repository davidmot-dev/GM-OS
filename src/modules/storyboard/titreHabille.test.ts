import { describe, it, expect } from 'vitest';
import {
    normaliserLeTitre, lireLeTitre, POSITIONS, CONTOURS, COULEUR_PAR_DEFAUT,
} from './titreProjete';

/**
 * **Où le titre se pose, dans quelle police, de quelle couleur.**
 *
 * Demandé par David le 2026-09-21 : *« le texte qu'on peut mettre dans le
 * Master Storyboard au niveau de l'Image, je voudrais pouvoir dire où le
 * positionner Haut, Milieu, Bas et choisir la Police et la couleur »*.
 *
 * ⭐ **Ce que ces essais gardent avant tout : les titres d'hier.** Aucun moment
 * déjà écrit ne porte ces quatre champs, et chacun doit s'afficher exactement
 * comme avant — en haut, blanc, ombre forte, police de titre du thème. *Un champ
 * neuf ne doit jamais rendre faux ce qui marchait avant lui.*
 */

const titre = (extra: Record<string, unknown> = {}) =>
    normaliserLeTitre({ cible: 'hub', texte: 'Le sas s’ouvre', ...extra });

describe('les défauts sont le comportement d’avant', () => {
    it('en haut, blanc, ombre forte, police du thème', () => {
        const t = titre();

        expect(t.position).toBe('haut');
        expect(t.couleur).toBe(COULEUR_PAR_DEFAUT);
        expect(t.contour).toBe('fort');
        expect(t.police, 'vide veut dire « celle du thème »').toBe('');
    });

    /** ⚠️ Un moment d'hier ne porte aucun de ces champs. */
    it('tient devant des champs absents', () => {
        const t = normaliserLeTitre({ cible: 'hub', texte: 'x' });

        expect(t.position).toBe('haut');
        expect(t.contour).toBe('fort');
    });
});

describe('ce que le meneur choisit', () => {
    it('garde les trois hauteurs', () => {
        for (const p of POSITIONS) expect(titre({ position: p }).position).toBe(p);
    });

    it('garde les trois ombres', () => {
        for (const c of CONTOURS) expect(titre({ contour: c }).contour).toBe(c);
    });

    it('garde la police demandée', () => {
        expect(titre({ police: '  Cinzel ' }).police).toBe('Cinzel');
    });

    it('garde une couleur hexadécimale, en minuscules', () => {
        expect(titre({ couleur: '#FF9A3C' }).couleur).toBe('#ff9a3c');
    });
});

describe('ce qu’on refuse', () => {
    /**
     * ⛔ Une valeur inconnue ne doit pas arriver jusqu'à la table de placement :
     * elle y rendrait `undefined`, donc **aucune classe**, donc un titre collé
     * en haut à gauche de l'écran. *Une valeur fausse se rattrape ici ou pas du
     * tout.*
     */
    it('ramène une position inconnue en haut', () => {
        expect(titre({ position: 'diagonale' }).position).toBe('haut');
        expect(titre({ position: '' }).position).toBe('haut');
    });

    it('ramène une ombre inconnue à forte', () => {
        expect(titre({ contour: 'floue' }).contour).toBe('fort');
    });

    /** *Une couleur illisible rendrait un titre invisible, sans le dire.* */
    it('ramène une couleur illisible au blanc', () => {
        expect(titre({ couleur: 'rouge' }).couleur).toBe(COULEUR_PAR_DEFAUT);
        expect(titre({ couleur: '#abc' }).couleur).toBe(COULEUR_PAR_DEFAUT);
        expect(titre({ couleur: 42 as never }).couleur).toBe(COULEUR_PAR_DEFAUT);
    });

    it('ne laisse pas passer une police qui n’est pas du texte', () => {
        expect(titre({ police: 12 as never }).police).toBe('');
    });
});

describe('les réglages n’abîment pas le reste', () => {
    it('le fondu et la tenue restent ce qu’ils étaient', () => {
        const t = titre({ fondu: 2, duree: 30, position: 'bas' });

        expect(t.fondu).toBe(2);
        expect(t.duree).toBe(30);
        expect(t.texte).toBe('Le sas s’ouvre');
    });
});

/**
 * ⛔⛔ **LE DÉFAUT QUI A ÉCHAPPÉ AUX ESSAIS, ET POURQUOI.**
 *
 * `lireLeTitre` reconstruisait l'objet **champ par champ**, et sa liste s'était
 * arrêtée aux quatre d'origine. Les réglages d'habillage traversaient le pont
 * et étaient **jetés à la réception**, sans une erreur — David l'a vu à l'écran
 * avant qu'aucun essai ne bronche.
 *
 * ⭐ ***Un essai qui ne fournit que les défauts ne peut pas distinguer
 * « transmis » de « jeté ».*** L'essai existant envoyait un message sans ces
 * champs et vérifiait que les défauts s'appliquaient : il passait dans les deux
 * cas. Ceux-ci envoient des valeurs **qui ne sont pas les défauts**, la seule
 * forme qui puisse voir la différence.
 */
describe('le message relaie ce qu’il porte', () => {
    const envoye = {
        cible: 'moniteur-2',
        texte: 'Les Anges de Feu',
        fondu: 5,
        duree: 20,
        position: 'milieu',
        police: 'Cormorant Garamond',
        couleur: '#c0392b',
        contour: 'leger',
    };

    it('rend les quatre réglages d’habillage, et pas les défauts', () => {
        const recu = lireLeTitre(JSON.stringify(envoye));

        expect(recu, 'le message n’a pas été lu').not.toBeNull();
        expect(recu!.position, 'la position a été jetée à la réception').toBe('milieu');
        expect(recu!.police, 'la police a été jetée à la réception').toBe('Cormorant Garamond');
        expect(recu!.couleur, 'la couleur a été jetée à la réception').toBe('#c0392b');
        expect(recu!.contour, 'l’ombre a été jetée à la réception').toBe('leger');
    });

    it('et n’oublie pas ce qu’il relayait déjà', () => {
        const recu = lireLeTitre(JSON.stringify(envoye))!;

        expect(recu.cible).toBe('moniteur-2');
        expect(recu.texte).toBe('Les Anges de Feu');
        expect(recu.fondu).toBe(5);
        expect(recu.duree).toBe(20);
    });

    /** ⚠️ Relayer tout ne veut pas dire tout croire : le juge reste la normalisation. */
    it('borne quand même ce qui entre', () => {
        const recu = lireLeTitre(JSON.stringify({
            ...envoye, position: 'diagonale', couleur: 'rouge', contour: 'floue',
        }))!;

        expect(recu.position).toBe('haut');
        expect(recu.couleur).toBe(COULEUR_PAR_DEFAUT);
        expect(recu.contour).toBe('fort');
    });
});
