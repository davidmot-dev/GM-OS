import { describe, it, expect } from 'vitest';
import { fenetreMontreLaCarte, type FenetreDeProjection } from './fenetreDeLaCarte';

/**
 * **Seule la fenêtre de l'écran choisi montre la carte.**
 *
 * Constat du 2026-09-25 (§ 1 bis du registre) : une carte projetée sur un
 * moniteur s'affichait dans TOUTES les fenêtres de projection ouvertes.
 */

const fenetre = (f: Partial<FenetreDeProjection>): FenetreDeProjection => ({
    cibleDeLaCarte: 'monitor',
    ecranDeLaCarte: 'moniteur-2',
    idDeLaFenetre: 'moniteur-2',
    estUnProjecteur: true,
    imageAffichee: null,
    ...f,
});

describe('la fenêtre qui montre la carte', () => {
    it('la fenêtre du moniteur choisi la montre', () => {
        expect(fenetreMontreLaCarte(fenetre({}))).toBe(true);
    });

    /** **Le test qui garde le constat.** */
    it('un AUTRE moniteur ouvert ne la montre pas', () => {
        expect(fenetreMontreLaCarte(fenetre({ idDeLaFenetre: 'moniteur-1' }))).toBe(false);
    });

    /**
     * L'ancien écran de la carte garde son marqueur `__tactical_map__` jusqu'à
     * sa prochaine image : il ne doit pas continuer à la montrer quand elle est
     * partie ailleurs.
     */
    it('l’ancien écran de la carte ne la montre plus, malgré son marqueur', () => {
        expect(fenetreMontreLaCarte(fenetre({
            idDeLaFenetre: 'moniteur-1', imageAffichee: '__tactical_map__',
        }))).toBe(false);
    });

    it('écran inconnu : le comportement d’avant — toutes les fenêtres de projecteur', () => {
        expect(fenetreMontreLaCarte(fenetre({ ecranDeLaCarte: null, idDeLaFenetre: 'moniteur-1' }))).toBe(true);
    });

    it('le Player Hub montre la carte qui lui est destinée, et pas celle d’un moniteur', () => {
        const hub = { idDeLaFenetre: 'hub', estUnProjecteur: false };
        expect(fenetreMontreLaCarte(fenetre({ ...hub, cibleDeLaCarte: 'hub', ecranDeLaCarte: null }))).toBe(true);
        expect(fenetreMontreLaCarte(fenetre(hub))).toBe(false);
    });

    it('rien n’est projeté : aucune fenêtre', () => {
        expect(fenetreMontreLaCarte(fenetre({ cibleDeLaCarte: null, ecranDeLaCarte: null }))).toBe(false);
    });
});
