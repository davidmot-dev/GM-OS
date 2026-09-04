import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RemoteUniversalPads from './RemoteUniversalPads';
import type { RemoteUniversalPad } from '../types/remote.types';

/**
 * **Ce que la grille de pads ne doit plus taire.**
 *
 * Refaite le 2026-09-05. Deux défauts s'y cachaient, tous deux muets : la grille
 * **tronquait sans le dire** — trente favoris en donnaient douze —, et
 * `pad.isActive` n'était **jamais posé** par le synchroniseur, si bien que
 * l'anneau lumineux dessiné pour lui ne s'était allumé sur aucun pad depuis
 * qu'il est écrit.
 */

const pad = (id: string, type: RemoteUniversalPad['type'], label: string, reste: Partial<RemoteUniversalPad> = {}): RemoteUniversalPad =>
    ({ id, type, label, ...reste });

const PADS: RemoteUniversalPad[] = [
    pad('m1', 'music', 'Marche funèbre'),
    pad('a1', 'ambient', 'Taverne', { sublabel: 'Fantastique' }),
    pad('a2', 'ambient', 'Forêt', { sublabel: 'Fantastique' }),
    pad('i1', 'image', 'Le pont', { imageUrl: 'data:image/png;base64,x' }),
];

describe('les plafonds se disent', () => {
    it('écrit « 12 sur 30 » quand la famille a été tronquée', () => {
        render(<RemoteUniversalPads pads={PADS} onTrigger={vi.fn()} comptes={{
            music: { montres: 1, total: 1 },
            ambient: { montres: 2, total: 2 },
            image: { montres: 12, total: 30 },
        }} />);

        expect(screen.getByText(/12 sur 30/)).toBeTruthy();
    });

    it('ne dit rien quand rien n’est tronqué', () => {
        render(<RemoteUniversalPads pads={PADS} onTrigger={vi.fn()} comptes={{
            music: { montres: 1, total: 1 },
            ambient: { montres: 2, total: 2 },
            image: { montres: 1, total: 1 },
        }} />);

        expect(screen.queryByText(/ sur /)).toBeNull();
    });

    it('supporte l’absence de comptes — une tablette d’avant cette version', () => {
        render(<RemoteUniversalPads pads={PADS} onTrigger={vi.fn()} />);
        expect(screen.getByText('Taverne')).toBeTruthy();
    });
});

describe('le filtre', () => {
    it('trouve sans accent ni casse', () => {
        render(<RemoteUniversalPads pads={PADS} onTrigger={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Filtrer les pads'), { target: { value: 'foret' } });

        expect(screen.getByText('Forêt')).toBeTruthy();
        expect(screen.queryByText('Taverne')).toBeNull();
    });

    it('cherche aussi dans le sous-titre — deux jeux ont leur « Taverne »', () => {
        render(<RemoteUniversalPads pads={PADS} onTrigger={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Filtrer les pads'), { target: { value: 'fantastique' } });

        expect(screen.getByText('Taverne')).toBeTruthy();
        expect(screen.queryByText('Marche funèbre')).toBeNull();
    });

    it('le dit quand rien ne correspond, au lieu d’un écran vide', () => {
        render(<RemoteUniversalPads pads={PADS} onTrigger={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Filtrer les pads'), { target: { value: 'zzz' } });

        expect(screen.getByText(/Rien ne correspond/)).toBeTruthy();
    });

    it('tait le plafond pendant une recherche — il parlerait d’autre chose', () => {
        render(<RemoteUniversalPads pads={PADS} onTrigger={vi.fn()} comptes={{
            music: { montres: 1, total: 1 },
            ambient: { montres: 2, total: 2 },
            image: { montres: 12, total: 30 },
        }} />);

        fireEvent.change(screen.getByLabelText('Filtrer les pads'), { target: { value: 'pont' } });

        expect(screen.queryByText(/12 sur 30/)).toBeNull();
    });
});

describe('le geste', () => {
    it('envoie l’identifiant du pad touché', () => {
        const declencher = vi.fn();
        render(<RemoteUniversalPads pads={PADS} onTrigger={declencher} />);

        fireEvent.click(screen.getByText('Taverne'));

        expect(declencher).toHaveBeenCalledWith('a1');
    });

    it('affiche un mot quand il n’y a aucun pad', () => {
        render(<RemoteUniversalPads pads={[]} onTrigger={vi.fn()} />);
        expect(screen.getByText(/Aucun pad configuré/)).toBeTruthy();
    });
});
