import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { NexusHUD } from './NexusHUD';
import { bilanQuiAlerte, DELAI_DE_LECTURE_DU_BILAN } from './bilanDeNexus';
import type { NexusProgress } from './nexus.types';

/**
 * **Un bilan sans histoire se ferme seul** — David, 2026-10-22 : l'écran
 * d'import ne se refermait plus. Le lot E6 gardait ouvert tout bilan, et un
 * import en a toujours un.
 */
const termine = (bilan: string[]): NexusProgress => ({ phase: 'done', progress: 100, message: 'Import terminé !', bilan });
const SANS_HISTOIRE = [
    "Sauvegarde automatique écrite juste avant l'import, à 09:04.",
    'Pilote « ALIEN » importé : la version locale « ALIEN » a été remplacée.',
];

describe('bilanQuiAlerte', () => {
    it('un import sans manque n’alerte pas', () => {
        expect(bilanQuiAlerte(SANS_HISTOIRE)).toBe(false);
        expect(bilanQuiAlerte(undefined)).toBe(false);
    });

    it('un média introuvable, un échec ou une sauvegarde absente se lisent jusqu’au bout', () => {
        expect(bilanQuiAlerte(['⚠️ 2 média(s) introuvable(s)'])).toBe(true);
        expect(bilanQuiAlerte(['Médias : 3 entré(s), 1 en échec (a.png).'])).toBe(true);
        expect(bilanQuiAlerte(['Aucune sauvegarde préalable : Aucune campagne.'])).toBe(true);
    });
});

describe('NexusHUD — la fermeture automatique du bilan', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        Element.prototype.scrollIntoView = vi.fn(); // absent de jsdom
    });
    afterEach(() => { cleanup(); vi.useRealTimers(); });

    const attendre = (secondes: number) => {
        for (let i = 0; i < secondes; i++) act(() => { vi.advanceTimersByTime(1000); });
    };

    it('se ferme seule après le délai', () => {
        const onClose = vi.fn();
        render(<NexusHUD progress={termine(SANS_HISTOIRE)} onClose={onClose} />);
        attendre(DELAI_DE_LECTURE_DU_BILAN - 1);
        expect(onClose).not.toHaveBeenCalled();
        attendre(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('le survol suspend le décompte', () => {
        const onClose = vi.fn();
        const { container } = render(<NexusHUD progress={termine(SANS_HISTOIRE)} onClose={onClose} />);
        const panneau = container.querySelector('#nexus-bilan-fermer')!.closest('.relative.w-\\[520px\\]')!;
        fireEvent.mouseEnter(panneau);
        attendre(DELAI_DE_LECTURE_DU_BILAN + 2);
        expect(onClose).not.toHaveBeenCalled();
        fireEvent.mouseLeave(panneau);
        attendre(DELAI_DE_LECTURE_DU_BILAN);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('un bilan qui alerte reste ouvert', () => {
        const onClose = vi.fn();
        render(<NexusHUD progress={termine([...SANS_HISTOIRE, '⚠️ 1 média introuvable'])} onClose={onClose} />);
        attendre(DELAI_DE_LECTURE_DU_BILAN * 2);
        expect(onClose).not.toHaveBeenCalled();
    });
});
