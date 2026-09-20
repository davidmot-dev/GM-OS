import { describe, it, expect } from 'vitest';
import {
    formeCanonique, cleDeComparaison, memeTag, distance,
    tagsProches, suggestionsDeTag, tagsParUsage, renommerDansLaBibliotheque, appliquerEnLot,
} from './vocabulaireDesTags';

/**
 * Ce que ces essais protègent : **le vocabulaire des étiquettes ne se corrompt
 * pas tout seul, et ce qui est déjà corrompu se répare.**
 *
 * ⛔ Le défaut d'origine : le champ de saisie ne proposait rien, donc chaque
 * frappe pouvait créer un quasi-doublon — `taverne`, `tavernes`, `Taverne` —
 * et rien ne permettait de les fusionner ensuite. *Un vocabulaire qu'on ne peut
 * pas corriger se corrompt à chaque ajout.*
 */

describe('la forme rangée', () => {
    it('met en minuscules et resserre les espaces', () => {
        expect(formeCanonique('  Grande   Taverne ')).toBe('grande taverne');
    });

    /**
     * ⚠️ **Les accents restent.** L'étiquette s'affiche au meneur, et une
     * bibliothèque française sans accents a l'air cassée.
     */
    it('GARDE les accents', () => {
        expect(formeCanonique('Forêt')).toBe('forêt');
    });
});

describe('deux étiquettes sont-elles la même', () => {
    it('ignore la casse, les accents et le pluriel', () => {
        expect(memeTag('Forêt', 'foret')).toBe(true);
        expect(memeTag('torches', 'Torche')).toBe(true);
    });

    /** ⚠️ Le `s` ne tombe qu'à partir de quatre lettres, sinon `bois` → `boi`. */
    it('ne mutile pas les mots courts', () => {
        expect(cleDeComparaison('bois')).toBe('boi');
        expect(cleDeComparaison('os')).toBe('os');
        expect(memeTag('os', 'o')).toBe(false);
    });

    it('ne confond pas deux mots différents', () => {
        expect(memeTag('taverne', 'caverne')).toBe(false);
    });
});

describe('la distance d’édition', () => {
    it('compte les corrections', () => {
        expect(distance('taverne', 'taverne')).toBe(0);
        expect(distance('taverne', 'tavrne')).toBe(1);
        expect(distance('taverne', 'caverne')).toBe(1);
    });

    /** *On ne mesure pas la ressemblance, on cherche une faute de frappe.* */
    it('s’arrête au plafond au lieu de calculer pour rien', () => {
        expect(distance('taverne', 'donjon')).toBeGreaterThan(2);
        expect(distance('a', 'abcdefgh')).toBeGreaterThan(2);
    });
});

describe('les étiquettes qu’on retape de travers', () => {
    const CONNUS = ['taverne', 'donjon', 'forêt', 'combat'];

    it('rattrape une lettre en moins', () => {
        expect(tagsProches('tavrne', CONNUS)).toEqual(['taverne']);
    });

    it('rattrape un accent oublié', () => {
        expect(tagsProches('foret', CONNUS), 'l’accent seul ne suffit pas à distinguer')
            .toEqual([]);
        expect(memeTag('foret', 'forêt'), 'ce sont la MÊME étiquette').toBe(true);
    });

    /** Une étiquette identique n'est pas « proche » : elle est la même. */
    it('ne signale pas une étiquette déjà connue à l’identique', () => {
        expect(tagsProches('taverne', CONNUS)).toEqual([]);
        expect(tagsProches('Tavernes', CONNUS)).toEqual([]);
    });

    it('se tait sur une saisie trop courte pour juger', () => {
        expect(tagsProches('ta', CONNUS)).toEqual([]);
    });

    it('ne signale pas un mot franchement différent', () => {
        expect(tagsProches('vaisseau', CONNUS)).toEqual([]);
    });
});

describe('les suggestions pendant la frappe', () => {
    const CONNUS = ['bataille navale', 'bataille', 'bât', 'taverne', 'combat'];

    /** *Un classement alphabétique mettrait « bataille navale » avant « bât ».* */
    it('met devant ce qui COMMENCE par la saisie', () => {
        const proposees = suggestionsDeTag('bat', CONNUS);

        expect(proposees[0]).toBe('bataille');
        expect(proposees).toContain('bataille navale');
    });

    it('propose ensuite ce qui contient la saisie', () => {
        expect(suggestionsDeTag('vern', CONNUS)).toEqual(['taverne']);
    });

    it('ne se propose pas elle-même', () => {
        expect(suggestionsDeTag('combat', CONNUS)).not.toContain('combat');
    });

    /** *Montrer le vocabulaire existant est la meilleure façon de ne pas en inventer un second.* */
    it('montre le vocabulaire quand le champ est vide', () => {
        expect(suggestionsDeTag('', CONNUS).length).toBeGreaterThan(0);
    });

    it('se borne', () => {
        expect(suggestionsDeTag('', CONNUS, 2)).toHaveLength(2);
    });
});

describe('le classement par usage', () => {
    it('compte les porteurs, la plus employée d’abord', () => {
        const medias = [
            { tags: ['taverne', 'nuit'] },
            { tags: ['Tavernes'] },
            { tags: ['donjon'] },
        ];

        const classe = tagsParUsage(medias);

        expect(classe[0]).toEqual({ tag: 'taverne', compte: 2 });
        expect(classe.map(e => e.tag)).toContain('donjon');
    });

    it('ne compte pas deux fois une variante d’écriture', () => {
        expect(tagsParUsage([{ tags: ['Forêt'] }, { tags: ['foret'] }])).toHaveLength(1);
    });
});

describe('renommer dans toute la bibliothèque', () => {
    const BIBLIO = [
        { id: 'm-1', tags: ['tavernes', 'nuit'] },
        { id: 'm-2', tags: ['taverne'] },
        { id: 'm-3', tags: ['donjon'] },
        { id: 'm-4', tags: ['tavernes', 'taverne'] },
    ];

    it('remplace partout où l’ancienne se trouve', () => {
        const changements = renommerDansLaBibliotheque(BIBLIO, 'tavernes', 'auberge');

        expect(changements.map(c => c.id)).toEqual(['m-1', 'm-2', 'm-4']);
        expect(changements[0].tags).toEqual(['nuit', 'auberge']);
    });

    /**
     * ⭐ **Renommer et fusionner sont le même geste** — et c'est ce qui rend
     * l'écran simple : renommer `tavernes` en `taverne` alors que `taverne`
     * existe *est* une fusion.
     */
    it('fusionne sans laisser de doublon', () => {
        const changements = renommerDansLaBibliotheque(BIBLIO, 'tavernes', 'taverne');

        const m4 = changements.find(c => c.id === 'm-4')!;
        expect(m4.tags, 'le média portait les deux : il en reste une').toEqual(['taverne']);
    });

    it('supprime partout quand la cible est vide', () => {
        const changements = renommerDansLaBibliotheque(BIBLIO, 'tavernes', '');

        expect(changements.find(c => c.id === 'm-1')!.tags).toEqual(['nuit']);
        expect(changements.find(c => c.id === 'm-4')!.tags).toEqual([]);
    });

    /**
     * ⚠️ *Réécrire les deux cents autres pour rien, c'est deux cents écritures
     * IndexedDB et un miroir qui recopie tout.*
     */
    it('ne rend QUE les médias qui changent', () => {
        const changements = renommerDansLaBibliotheque(BIBLIO, 'tavernes', 'auberge');

        expect(changements.some(c => c.id === 'm-3'), 'un média intact a été réécrit')
            .toBe(false);
    });

    it('ne fait rien sur une étiquette absente ou vide', () => {
        expect(renommerDansLaBibliotheque(BIBLIO, 'vaisseau', 'x')).toEqual([]);
        expect(renommerDansLaBibliotheque(BIBLIO, '   ', 'x')).toEqual([]);
    });
});

describe('étiqueter en lot', () => {
    const SELECTION = [
        { id: 'm-1', tags: ['nuit'] },
        { id: 'm-2', tags: ['taverne', 'nuit'] },
        { id: 'm-3', tags: [] },
    ];

    it('ajoute à ceux qui ne l’ont pas', () => {
        const changements = appliquerEnLot(SELECTION, { ajouter: ['taverne'] });

        expect(changements.map(c => c.id), 'm-2 la portait déjà').toEqual(['m-1', 'm-3']);
        expect(changements[0].tags).toEqual(['nuit', 'taverne']);
    });

    it('ne double pas une étiquette écrite autrement', () => {
        const changements = appliquerEnLot([{ id: 'm-2', tags: ['Tavernes'] }], {
            ajouter: ['taverne'],
        });

        expect(changements, 'une variante d’écriture a été ajoutée à côté').toEqual([]);
    });

    it('retire de ceux qui la portent', () => {
        const changements = appliquerEnLot(SELECTION, { retirer: ['NUIT'] });

        expect(changements.map(c => c.id)).toEqual(['m-1', 'm-2']);
        expect(changements[1].tags).toEqual(['taverne']);
    });

    it('fait les deux dans le même geste', () => {
        const changements = appliquerEnLot(SELECTION, {
            ajouter: ['donjon'], retirer: ['nuit'],
        });

        expect(changements.find(c => c.id === 'm-2')!.tags).toEqual(['taverne', 'donjon']);
    });

    it('ne réécrit rien quand il n’y a rien à faire', () => {
        expect(appliquerEnLot(SELECTION, {})).toEqual([]);
        expect(appliquerEnLot(SELECTION, { retirer: ['vaisseau'] })).toEqual([]);
    });
});
