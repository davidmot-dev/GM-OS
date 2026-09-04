import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RemoteWhiteboardView from './RemoteWhiteboardView';
import type { WhiteboardTool } from '../types/remote.types';

/**
 * **Ce que la tablette dessine doit être ce que le meneur enregistre.**
 *
 * Réparé le 2026-09-05. Le meneur envoyait **quatre** des sept champs déclarés
 * du tableau : `currentTool`, `currentColor` et `currentWidth` n'arrivaient
 * jamais et restaient à leur valeur de départ. Comme le canevas les recopie
 * dans **chaque tracé qu'il émet**, tout ce qui partait d'une tablette était un
 * crayon blanc d'épaisseur 3 — *et la gomme dessinait au lieu d'effacer.*
 *
 * Ces tests gardent les deux moitiés : le geste part bien vers le meneur, et
 * **il s'applique tout de suite sur la tablette** sans attendre l'aller-retour,
 * sans quoi un doigt qui dessine aussitôt émettrait encore l'ancien outil.
 */

vi.mock('./RemoteDrawingCanvas', () => ({
    /* Le canevas est mis à nu : ce qui compte ici est **ce qu'on lui donne**. */
    default: ({ whiteboard }: { whiteboard: { currentTool: string; currentColor: string; currentWidth: number; backgroundMode: string } }) => (
        <div
            data-testid="canevas"
            data-outil={whiteboard.currentTool}
            data-couleur={whiteboard.currentColor}
            data-epaisseur={whiteboard.currentWidth}
            data-fond={whiteboard.backgroundMode}
        />
    ),
}));

const TABLEAU = {
    paths: [],
    activePath: null,
    laserPointer: null,
    backgroundMode: 'dark' as const,
    currentTool: 'brush' as WhiteboardTool,
    currentColor: '#ffffff',
    currentWidth: 3,
};

const poser = (surcharge = {}) => {
    const action = vi.fn();
    const rendu = render(<RemoteWhiteboardView whiteboard={{ ...TABLEAU, ...surcharge }} onAction={action} />);
    return { action, rendu };
};

const canevas = () => screen.getByTestId('canevas');

describe('le geste part vers le meneur', () => {
    it('envoie l’outil choisi', () => {
        const { action } = poser();
        fireEvent.click(screen.getByLabelText('Gomme'));
        expect(action).toHaveBeenCalledWith('whiteboard:set-tool', 'eraser');
    });

    it('envoie l’épaisseur — elle n’avait aucun émetteur avant le 05/09', () => {
        const { action } = poser();
        fireEvent.click(screen.getByLabelText('Trait épais'));
        expect(action).toHaveBeenCalledWith('whiteboard:set-width', 8);
    });

    it('envoie le fond — l’action était morte des deux côtés', () => {
        const { action } = poser();
        fireEvent.click(screen.getByLabelText('Passer en fond clair'));
        expect(action).toHaveBeenCalledWith('whiteboard:set-background', 'light');
    });

    it('envoie la couleur', () => {
        const { action } = poser();
        fireEvent.click(screen.getByLabelText('Choisir la couleur #ef4444'));
        expect(action).toHaveBeenCalledWith('whiteboard:set-color', '#ef4444');
    });
});

describe('le canevas dessine avec le choix, pas avec l’ancien', () => {
    it('LE DÉFAUT DU 05/09 : la gomme prend effet sans attendre l’aller-retour', () => {
        poser();
        expect(canevas().getAttribute('data-outil')).toBe('brush');

        fireEvent.click(screen.getByLabelText('Gomme'));

        /* Sans écho optimiste, le canevas resterait sur 'brush' jusqu'à la
           synchronisation suivante — et le tracé émis entre-temps aussi. */
        expect(canevas().getAttribute('data-outil')).toBe('eraser');
    });

    it('applique la couleur tout de suite', () => {
        poser();
        fireEvent.click(screen.getByLabelText('Choisir la couleur #3b82f6'));
        expect(canevas().getAttribute('data-couleur')).toBe('#3b82f6');
    });

    it('applique l’épaisseur tout de suite', () => {
        poser();
        fireEvent.click(screen.getByLabelText('Trait fin'));
        expect(canevas().getAttribute('data-epaisseur')).toBe('2');
    });
});

describe('le meneur garde la main', () => {
    it('un changement fait sur l’écran du meneur arrive sur la tablette', () => {
        const { rendu } = poser();

        rendu.rerender(
            <RemoteWhiteboardView
                whiteboard={{ ...TABLEAU, currentTool: 'circle' as WhiteboardTool, currentColor: '#10b981' }}
                onAction={vi.fn()}
            />,
        );

        expect(canevas().getAttribute('data-outil')).toBe('circle');
        expect(canevas().getAttribute('data-couleur')).toBe('#10b981');
    });

    it('l’écho confirme, puis le meneur redevient la source', () => {
        const { rendu } = poser();
        fireEvent.click(screen.getByLabelText('Gomme'));
        expect(canevas().getAttribute('data-outil')).toBe('eraser');

        /* L'aller-retour revient avec la même valeur : l'attente se lève. */
        rendu.rerender(
            <RemoteWhiteboardView whiteboard={{ ...TABLEAU, currentTool: 'eraser' as WhiteboardTool }} onAction={vi.fn()} />,
        );
        expect(canevas().getAttribute('data-outil')).toBe('eraser');

        /* Et le meneur peut alors reprendre la main depuis son écran. */
        rendu.rerender(
            <RemoteWhiteboardView whiteboard={{ ...TABLEAU, currentTool: 'laser' as WhiteboardTool }} onAction={vi.fn()} />,
        );
        expect(canevas().getAttribute('data-outil')).toBe('laser');
    });

    it('le fond reçu du meneur repeint le panneau', () => {
        poser({ backgroundMode: 'light' });
        expect(canevas().getAttribute('data-fond')).toBe('light');
        /* En fond clair, la première pastille est le noir et non le blanc. */
        expect(screen.getByLabelText('Choisir la couleur #000000')).toBeTruthy();
    });
});

describe('les gestes sans état', () => {
    it.each([
        ['Annuler', 'whiteboard:undo'],
        ['Rétablir', 'whiteboard:redo'],
        ['Effacer tout', 'whiteboard:clear'],
    ])('%s envoie %s', (libelle, type) => {
        const { action } = poser();
        fireEvent.click(screen.getByLabelText(libelle));
        expect(action).toHaveBeenCalledWith(type, null);
    });
});
