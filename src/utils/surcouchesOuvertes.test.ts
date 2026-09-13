import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    empilerLaSurcouche,
    depilerLaSurcouche,
    ilYAUneSurcoucheOuverte,
    surcouchesOuvertes,
    viderLesSurcouches,
} from './surcouchesOuvertes';

/**
 * **La pile des surcouches — ce qu'elle doit garantir.**
 *
 * Écrite le 2026-09-13 en refermant la famille « Échap ne ferme pas ». Ce
 * fichier éprouve **la mécanique** ; le geste du meneur — ouvrir les Paramètres
 * et presser Échap — vit dans `e2e/echapFermeLesSurcouches.spec.ts`, et c'est
 * lui qui aurait vu le défaut d'origine. *Éprouver la mécanique n'est pas
 * éprouver le geste.*
 */

const echap = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

afterEach(() => {
    viderLesSurcouches();
    document.body.innerHTML = '';
});

describe('qui répond à Échap', () => {
    it('ferme la surcouche ouverte', () => {
        const fermer = vi.fn();
        empilerLaSurcouche({ jeton: Symbol('a'), nom: 'a', fermer });

        echap();

        expect(fermer).toHaveBeenCalledOnce();
    });

    /**
     * ⛔ **Le défaut que les gardes écrites à la main laissaient passer.** La
     * médiathèque énumérait ses deux enfants pour se taire quand ils étaient
     * ouverts ; un troisième enfant l'aurait rouvert sans un mot.
     */
    it('ne ferme que celle du dessus, jamais les deux', () => {
        const dessous = vi.fn();
        const dessus = vi.fn();
        empilerLaSurcouche({ jeton: Symbol('dessous'), nom: 'dessous', fermer: dessous });
        empilerLaSurcouche({ jeton: Symbol('dessus'), nom: 'dessus', fermer: dessus });

        echap();

        expect(dessus).toHaveBeenCalledOnce();
        expect(dessous).not.toHaveBeenCalled();
    });

    it('rend la main à celle du dessous quand celle du dessus se retire', () => {
        const dessous = vi.fn();
        const jetonDuDessus = Symbol('dessus');
        empilerLaSurcouche({ jeton: Symbol('dessous'), nom: 'dessous', fermer: dessous });
        empilerLaSurcouche({ jeton: jetonDuDessus, nom: 'dessus', fermer: vi.fn() });

        depilerLaSurcouche(jetonDuDessus);
        echap();

        expect(dessous).toHaveBeenCalledOnce();
    });

    /**
     * ⚠️ React démonte parfois un parent avant son enfant. *Dépiler aveuglément
     * le dernier retirerait la mauvaise* — et la surcouche encore à l'écran
     * cesserait de répondre.
     */
    it('retire la bonne, même prise au milieu de la pile', () => {
        const haut = vi.fn();
        const jetonDuMilieu = Symbol('milieu');
        empilerLaSurcouche({ jeton: Symbol('bas'), nom: 'bas', fermer: vi.fn() });
        empilerLaSurcouche({ jeton: jetonDuMilieu, nom: 'milieu', fermer: vi.fn() });
        empilerLaSurcouche({ jeton: Symbol('haut'), nom: 'haut', fermer: haut });

        depilerLaSurcouche(jetonDuMilieu);

        expect(surcouchesOuvertes()).toEqual(['bas', 'haut']);
        echap();
        expect(haut).toHaveBeenCalledOnce();
    });

    it('ne répond plus une fois la dernière retirée', () => {
        const fermer = vi.fn();
        const jeton = Symbol('seule');
        empilerLaSurcouche({ jeton, nom: 'seule', fermer });
        depilerLaSurcouche(jeton);

        echap();

        expect(fermer).not.toHaveBeenCalled();
        expect(ilYAUneSurcoucheOuverte()).toBe(false);
    });

    it('ignore les autres touches', () => {
        const fermer = vi.fn();
        empilerLaSurcouche({ jeton: Symbol('a'), nom: 'a', fermer });

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

        expect(fermer).not.toHaveBeenCalled();
    });

    /**
     * **Un champ de saisie n'arrête pas Échap** — tranché le 2026-09-13 sur le
     * précédent de `SpotlightSearch`, qui ferme depuis son champ focalisé depuis
     * toujours. La règle des deux frappes aurait rendu la première muette sur
     * l'éditeur de scène, dont le champ est **sélectionné à l'ouverture**.
     */
    it('ferme aussi quand la frappe part d’un champ de saisie', () => {
        const fermer = vi.fn();
        empilerLaSurcouche({ jeton: Symbol('a'), nom: 'a', fermer });

        const champ = document.createElement('input');
        document.body.appendChild(champ);
        const evenement = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        champ.dispatchEvent(evenement);

        expect(fermer).toHaveBeenCalledOnce();
    });

    /**
     * *La charge revient aux éditions en ligne* : celles qui écoutent Échap sur
     * leur champ arrêtent la propagation, sans quoi une frappe annulerait la
     * saisie **et** refermerait l'écran derrière. Les trois cas du dépôt le font.
     */
    it('se tait quand le champ a gardé la frappe pour lui', () => {
        const fermer = vi.fn();
        empilerLaSurcouche({ jeton: Symbol('a'), nom: 'a', fermer });

        const champ = document.createElement('input');
        document.body.appendChild(champ);
        champ.addEventListener('keydown', e => e.stopPropagation());
        champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(fermer).not.toHaveBeenCalled();
    });
});

describe('ce que le registre dit aux moteurs de pastilles', () => {
    it('annonce le vide quand rien n’est ouvert', () => {
        expect(ilYAUneSurcoucheOuverte()).toBe(false);
    });

    it('annonce une boîte ouverte dès la première inscription', () => {
        empilerLaSurcouche({ jeton: Symbol('a'), nom: 'a', fermer: vi.fn() });
        expect(ilYAUneSurcoucheOuverte()).toBe(true);
    });

    /** Une double inscription du même jeton fausserait le compte au retrait. */
    it('ignore une inscription déjà faite', () => {
        const jeton = Symbol('a');
        empilerLaSurcouche({ jeton, nom: 'a', fermer: vi.fn() });
        empilerLaSurcouche({ jeton, nom: 'a', fermer: vi.fn() });

        expect(surcouchesOuvertes()).toEqual(['a']);
        depilerLaSurcouche(jeton);
        expect(ilYAUneSurcoucheOuverte()).toBe(false);
    });
});
