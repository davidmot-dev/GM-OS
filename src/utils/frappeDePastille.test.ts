import { describe, it, expect, afterEach } from 'vitest';
import { estUneFrappeDePastille } from './frappeDePastille';
import { empilerLaSurcouche, depilerLaSurcouche } from './surcouchesOuvertes';

/**
 * **`Ctrl+C` lançait le son lié à la touche C.**
 *
 * Music-OS et Sound-OS comparent `e.code`, qui **ignore les modificateurs** :
 * `Ctrl+C` produit `KeyC` exactement comme `C` seul. Hors d'un champ de saisie,
 * un copier-coller déclenchait donc une pastille, en pleine séance. Les deux
 * modules portaient chacun leur garde, identiques et toutes deux incomplètes.
 *
 * Trouvé le 2026-08-30 en préparant les raccourcis de navigation, qui se
 * seraient heurtés au même mur — `Ctrl+1` produit `Digit1`.
 */

const frappe = (init: Partial<KeyboardEventInit> & { cible?: EventTarget } = {}) => {
    const { cible, ...reste } = init;
    const evenement = new KeyboardEvent('keydown', { code: 'KeyC', ...reste });
    if (cible) Object.defineProperty(evenement, 'target', { value: cible });
    return evenement;
};

afterEach(() => {
    document.body.innerHTML = '';
});

describe('ce qui atteint une pastille', () => {
    it('laisse passer une touche nue', () => {
        expect(estUneFrappeDePastille(frappe())).toBe(true);
    });

    /** Shift n'est revendiqué par rien : une main qui traîne dessus doit jouer. */
    it('laisse passer une touche tenue avec Maj', () => {
        expect(estUneFrappeDePastille(frappe({ shiftKey: true }))).toBe(true);
    });
});

describe('ce qui n’atteint plus une pastille', () => {
    it.each([
        ['Ctrl', { ctrlKey: true }],
        ['Cmd', { metaKey: true }],
        ['Alt', { altKey: true }],
    ])('écarte une touche tenue avec %s', (_nom, modificateur) => {
        expect(estUneFrappeDePastille(frappe(modificateur))).toBe(false);
    });

    it('écarte une frappe dans un champ de saisie', () => {
        const champ = document.createElement('input');
        expect(estUneFrappeDePastille(frappe({ cible: champ }))).toBe(false);
    });

    it('écarte une frappe dans une zone de texte', () => {
        const zone = document.createElement('textarea');
        expect(estUneFrappeDePastille(frappe({ cible: zone }))).toBe(false);
    });

    /** Les éditeurs riches ne sont ni `input` ni `textarea`. */
    it('écarte une frappe dans un bloc éditable', () => {
        const bloc = document.createElement('div');
        bloc.contentEditable = 'true';
        Object.defineProperty(bloc, 'isContentEditable', { value: true });
        expect(estUneFrappeDePastille(frappe({ cible: bloc }))).toBe(false);
    });

    it('écarte tout quand une boîte porte `role="dialog"`', () => {
        const boite = document.createElement('div');
        boite.setAttribute('role', 'dialog');
        document.body.appendChild(boite);

        expect(estUneFrappeDePastille(frappe())).toBe(false);
    });

    /**
     * ⛔ **La garde du dessus n'attrapait presque rien.** Compté le 2026-09-13 :
     * `role="dialog"` n'existait que dans **deux** fichiers côté meneur.
     * Médiathèque, Forge, aperçu plein écran, Oracle, visionneur de règles —
     * toutes ouvertes, **toutes muettes pour elle** : une lettre frappée hors
     * d'un champ y lançait la pastille de Sound-OS et la scène de Light-OS, en
     * pleine séance.
     *
     * *Une garde qui dépend d'un attribut qu'il faut penser à poser ne protège
     * que les écrans dont l'auteur connaissait la garde.*
     */
    it('écarte tout quand une surcouche est inscrite au registre', () => {
        const jeton = Symbol('médiathèque');
        empilerLaSurcouche({ jeton, nom: 'Médiathèque', fermer: () => {} });

        try {
            // Aucun `role="dialog"` dans le DOM : c'est le registre qui répond.
            expect(document.querySelectorAll('[role="dialog"]').length).toBe(0);
            expect(estUneFrappeDePastille(frappe())).toBe(false);
        } finally {
            depilerLaSurcouche(jeton);
        }

        expect(estUneFrappeDePastille(frappe())).toBe(true);
    });
});
