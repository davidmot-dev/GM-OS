import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TitreProjete } from './TitreProjete';
import { normaliserLeTitre, useTitreProjeteStore } from '../modules/storyboard/titreProjete';

/**
 * **Le titre à l'écran : ce qui se voit, et pendant combien de temps.**
 *
 * *Demandé par David le 2026-08-31.* Les deux fondus et la tenue vivent ici ;
 * `titreProjete.test.ts` garde la minuterie et le trajet, cet essai-ci garde ce
 * que le meneur regarde.
 */

beforeEach(() => {
    useTitreProjeteStore.setState({ titre: null });
});

afterEach(() => {
    vi.useRealTimers();
    useTitreProjeteStore.setState({ titre: null });
});

const poser = (titre: Parameters<typeof normaliserLeTitre>[0]) =>
    act(() => { useTitreProjeteStore.getState().poserLeTitre(normaliserLeTitre(titre)); });

describe('le titre à l’écran', () => {
    it('s’affiche sur l’écran visé', () => {
        render(<TitreProjete cible="hub" />);

        poser({ cible: 'hub', texte: 'Los Angeles, novembre 2019' });

        expect(screen.getByText('Los Angeles, novembre 2019')).toBeTruthy();
    });

    /** Le titre envoyé au moniteur 2 n'a rien à faire sur la tablette. */
    it('ignore ce qui s’adresse à un autre écran', () => {
        render(<TitreProjete cible="hub" />);

        poser({ cible: 'moniteur-2', texte: 'Tyrell Corp.' });

        expect(screen.queryByText('Tyrell Corp.')).toBeNull();
    });

    /** Un titre vide **retire** ce qui était affiché : c'est le geste d'effacement. */
    it('n’affiche rien pour un texte vide', () => {
        render(<TitreProjete cible="hub" />);

        poser({ cible: 'hub', texte: '' });

        expect(document.querySelector('h1')).toBeNull();
    });

    /**
     * **La police vient du thème du jeu**, pas d'un réglage : `--font-display`
     * est posée par `useThemeDuJeu` depuis le CSS de la campagne.
     */
    it('prend la police de titre du thème', () => {
        render(<TitreProjete cible="hub" />);

        poser({ cible: 'hub', texte: 'Hadley Hope' });

        expect(document.querySelector('h1')?.getAttribute('style')).toContain('var(--font-display)');
    });

    it('porte la durée du fondu demandée', () => {
        render(<TitreProjete cible="hub" />);

        poser({ cible: 'hub', texte: 'Fondu long', fondu: 4 });

        expect(document.querySelector('h1')?.getAttribute('style')).toContain('4s');
    });

    /**
     * **Le texte ne part qu'après le fondu de sortie.** Le retirer à la fin de la
     * tenue supprimerait le fondu au lieu de le jouer.
     */
    it('s’efface après la tenue, et ne disparaît qu’après le fondu', () => {
        vi.useFakeTimers();
        render(<TitreProjete cible="hub" />);
        poser({ cible: 'hub', texte: 'Trois jours plus tard', fondu: 2, duree: 5 });

        act(() => { vi.advanceTimersByTime(5100); });
        // Encore là, mais en train de s'effacer.
        expect(screen.getByText('Trois jours plus tard')).toBeTruthy();
        expect(document.querySelector('h1')?.getAttribute('style')).toContain('opacity: 0');

        act(() => { vi.advanceTimersByTime(2000); });
        expect(screen.queryByText('Trois jours plus tard')).toBeNull();
    });

    /** *Permanent veut dire permanent* : il part avec le moment, pas tout seul. */
    it('reste indéfiniment quand aucune durée n’est donnée', () => {
        vi.useFakeTimers();
        render(<TitreProjete cible="hub" />);
        poser({ cible: 'hub', texte: 'Permanent', fondu: 1 });

        act(() => { vi.advanceTimersByTime(10 * 60 * 1000); });

        expect(screen.getByText('Permanent')).toBeTruthy();
    });
});
