import { describe, it, expect } from 'vitest';
import { COULEUR_NEUTRE, couleurDeLaTuile } from './couleurDeLaTuile';

/**
 * Ce que ces tests protègent : **un défaut qui veut dire « rien n'est choisi »
 * ne traverse pas la même porte qu'une couleur choisie.**
 *
 * Signalé par David le 2026-09-07, le lendemain de l'éditeur de tuile : *« je ne
 * sais pas donner de couleur à mes tuiles »*. La couleur par défaut des
 * dix-huit scènes est `#334155` ; le fond des tuiles est `#0f172a`. Peindre
 * l'une sur l'autre donne un rapport de contraste d'environ 1,6 — **sous le
 * seuil où l'œil distingue une forme**. Quatre des cinq repères de couleur
 * étaient donc perdus, dont l'étoile ✨ « cette scène porte un effet »,
 * invisible pour tout le monde depuis toujours.
 */

describe('la teinte d’une tuile', () => {
    /** *Le défaut n'a jamais voulu dire « peins-moi en gris ardoise ».* */
    it('est absente quand personne n’a choisi', () => {
        expect(couleurDeLaTuile({ color: COULEUR_NEUTRE })).toBeNull();
    });

    it('ne dépend pas de la casse de l’écriture', () => {
        expect(couleurDeLaTuile({ color: '#334155' })).toBeNull();
        expect(couleurDeLaTuile({ color: '#334155'.toUpperCase() })).toBeNull();
    });

    it('rend la couleur dès qu’elle a été choisie', () => {
        expect(couleurDeLaTuile({ color: '#ef4444' })).toBe('#ef4444');
    });

    /**
     * Une couleur voisine du défaut **est** un choix : on ne devine pas
     * l'intention à la ressemblance, on la lit à l'égalité.
     */
    it('ne confond pas une teinte proche avec le défaut', () => {
        expect(couleurDeLaTuile({ color: '#334156' })).toBe('#334156');
    });

    it('traite l’absence de valeur comme une absence de choix', () => {
        expect(couleurDeLaTuile({ color: '' })).toBeNull();
        expect(couleurDeLaTuile({ color: '   ' })).toBeNull();
        expect(couleurDeLaTuile({ color: undefined as unknown as string })).toBeNull();
    });
});
