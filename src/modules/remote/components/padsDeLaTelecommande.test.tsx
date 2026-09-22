import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import RemoteUniversalPads from './RemoteUniversalPads';
import type { RemoteUniversalPad } from '../types/remote.types';
import { reglagesAudio } from '../reglagesAudio';

/**
 * **Ce que la grille de pads ne doit plus taire.**
 *
 * Refaite le 2026-09-05. Deux défauts s'y cachaient, tous deux muets : la grille
 * **tronquait sans le dire** — trente favoris en donnaient douze —, et
 * `pad.isActive` n'était **jamais posé** par le synchroniseur, si bien que
 * l'anneau lumineux dessiné pour lui ne s'était allumé sur aucun pad depuis
 * qu'il est écrit.
 */

/*
  Les réglages audio arrivés le 2026-09-22 : ces essais-ci portent sur la GRILLE,
  et les leurs vivent à part. On les pose muets pour ne pas les redire neuf fois.
*/
const MUET = { audio: reglagesAudio({}), onVolume: vi.fn(), onSortie: vi.fn() };

const pad = (id: string, type: RemoteUniversalPad['type'], label: string, reste: Partial<RemoteUniversalPad> = {}): RemoteUniversalPad =>
    ({ id, type, label, ...reste });

const PADS: RemoteUniversalPad[] = [
    pad('m1', 'music', 'Marche funèbre'),
    pad('a1', 'ambient', 'Taverne', { sublabel: 'Fantastique' }),
    pad('a2', 'ambient', 'Forêt', { sublabel: 'Fantastique' }),
    pad('i1', 'image', 'Le pont', { imageUrl: 'data:image/png;base64,x' }),
];

/**
 * ⭐ **Les deux lignes de volume, demandées par David le 2026-09-22** :
 * *« le slider du soundboard fonctionne bien, mais il n'y a pas de slider dans
 * les pads »*. Cet onglet lançait de la musique et des ambiances **sans pouvoir
 * les doser**, et sans pouvoir dire où elles sortent.
 */
describe('doser la musique et les ambiances', () => {
    const reglages = reglagesAudio({
        appareils: [{ deviceId: 'hp-salon', kind: 'audiooutput' }],
        nomDeLaSortie: () => 'Enceintes du salon',
        music: { masterVolume: 0.72, outputDeviceId: 'hp-salon' },
        ambient: { masterVolume: 0.45 },
    });

    it('offre un curseur pour chacune des deux familles', () => {
        render(<RemoteUniversalPads {...MUET} audio={reglages} pads={PADS} onTrigger={vi.fn()} />);

        expect((screen.getByLabelText('Volume — Musique') as HTMLInputElement).value).toBe('0.72');
        expect((screen.getByLabelText('Volume — Ambiances') as HTMLInputElement).value).toBe('0.45');
    });

    it('dit sur quelle sortie chacune part', () => {
        render(<RemoteUniversalPads {...MUET} audio={reglages} pads={PADS} onTrigger={vi.fn()} />);

        expect(screen.getByLabelText('Sortie — Musique').textContent).toContain('Enceintes du salon');
        expect(screen.getByLabelText('Sortie — Ambiances').textContent).toContain('Sortie par défaut');
    });

    it('remonte le volume demandé, avec sa voie', () => {
        const onVolume = vi.fn();
        render(<RemoteUniversalPads {...MUET} audio={reglages} pads={PADS} onVolume={onVolume} onTrigger={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Volume — Ambiances'), { target: { value: '0.2' } });

        expect(onVolume).toHaveBeenCalledWith('ambient', 0.2);
    });

    it('remonte la sortie choisie, avec sa voie', () => {
        const onSortie = vi.fn();
        render(<RemoteUniversalPads {...MUET} audio={reglages} pads={PADS} onSortie={onSortie} onTrigger={vi.fn()} />);

        fireEvent.click(screen.getByLabelText('Sortie — Musique'));
        /* Dans le menu, et pas n'importe où : « Sortie par défaut » est aussi
           le bouton de la ligne Ambiances. */
        const menu = screen.getByRole('menu');
        fireEvent.click(within(menu).getByText('Sortie par défaut'));

        expect(onSortie).toHaveBeenCalledWith('music', 'default');
    });

    /**
     * ⚠️ **Même quand la grille est vide.** Une ambiance peut tourner alors
     * qu'aucun pad n'est configuré sur cet univers : *un réglage qui disparaît
     * avec la liste qu'il ne commande pas est un réglage perdu au moment où il
     * sert.*
     */
    it('reste là quand aucun pad n’est configuré', () => {
        render(<RemoteUniversalPads {...MUET} audio={reglages} pads={[]} onTrigger={vi.fn()} />);

        expect(screen.getByLabelText('Volume — Musique')).toBeTruthy();
        expect(screen.getByText(/Aucun pad configuré/)).toBeTruthy();
    });
});

describe('les plafonds se disent', () => {
    it('écrit « 12 sur 30 » quand la famille a été tronquée', () => {
        render(<RemoteUniversalPads {...MUET} pads={PADS} onTrigger={vi.fn()} comptes={{
            music: { montres: 1, total: 1 },
            ambient: { montres: 2, total: 2 },
            image: { montres: 12, total: 30 },
        }} />);

        expect(screen.getByText(/12 sur 30/)).toBeTruthy();
    });

    it('ne dit rien quand rien n’est tronqué', () => {
        render(<RemoteUniversalPads {...MUET} pads={PADS} onTrigger={vi.fn()} comptes={{
            music: { montres: 1, total: 1 },
            ambient: { montres: 2, total: 2 },
            image: { montres: 1, total: 1 },
        }} />);

        expect(screen.queryByText(/ sur /)).toBeNull();
    });

    it('supporte l’absence de comptes — une tablette d’avant cette version', () => {
        render(<RemoteUniversalPads {...MUET} pads={PADS} onTrigger={vi.fn()} />);
        expect(screen.getByText('Taverne')).toBeTruthy();
    });
});

describe('le filtre', () => {
    it('trouve sans accent ni casse', () => {
        render(<RemoteUniversalPads {...MUET} pads={PADS} onTrigger={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Filtrer les pads'), { target: { value: 'foret' } });

        expect(screen.getByText('Forêt')).toBeTruthy();
        expect(screen.queryByText('Taverne')).toBeNull();
    });

    it('cherche aussi dans le sous-titre — deux jeux ont leur « Taverne »', () => {
        render(<RemoteUniversalPads {...MUET} pads={PADS} onTrigger={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Filtrer les pads'), { target: { value: 'fantastique' } });

        expect(screen.getByText('Taverne')).toBeTruthy();
        expect(screen.queryByText('Marche funèbre')).toBeNull();
    });

    it('le dit quand rien ne correspond, au lieu d’un écran vide', () => {
        render(<RemoteUniversalPads {...MUET} pads={PADS} onTrigger={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Filtrer les pads'), { target: { value: 'zzz' } });

        expect(screen.getByText(/Rien ne correspond/)).toBeTruthy();
    });

    it('tait le plafond pendant une recherche — il parlerait d’autre chose', () => {
        render(<RemoteUniversalPads {...MUET} pads={PADS} onTrigger={vi.fn()} comptes={{
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
        render(<RemoteUniversalPads {...MUET} pads={PADS} onTrigger={declencher} />);

        fireEvent.click(screen.getByText('Taverne'));

        expect(declencher).toHaveBeenCalledWith('a1');
    });

    it('affiche un mot quand il n’y a aucun pad', () => {
        render(<RemoteUniversalPads {...MUET} pads={[]} onTrigger={vi.fn()} />);
        expect(screen.getByText(/Aucun pad configuré/)).toBeTruthy();
    });
});
