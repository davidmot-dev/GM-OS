import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChoixDuLivre from './ChoixDuLivre';

/**
 * Le choix du livre documenté — § 185, 01/11/2026. Il vit dans le panneau de
 * gauche, avant « Analyser les sources » : dans l'atelier, David ne le voyait
 * pas.
 */
describe('ChoixDuLivre', () => {
    const colonial = { slug: 'colonial-marines', titre: 'Colonial Marines Operations Manual' };
    const props = (surcharge = {}) => ({
        supplements: [colonial], supplement: null, onChoisir: vi.fn(), onDeclarer: vi.fn(), sourcesRetenues: [],
        ...surcharge,
    });

    it('propose le livre de base et chaque supplément déclaré', () => {
        const p = props();
        render(<ChoixDuLivre {...p} />);
        expect(screen.getByRole('button', { name: /Livre de base/ }).getAttribute('aria-pressed')).toBe('true');
        fireEvent.click(screen.getByRole('button', { name: /Colonial Marines/ }));
        expect(p.onChoisir).toHaveBeenCalledWith(colonial);
    });

    it('déclare un supplément par son titre', () => {
        const p = props();
        render(<ChoixDuLivre {...p} />);
        fireEvent.change(screen.getByLabelText('Titre du nouveau supplément'), { target: { value: '  Building Better Worlds ' } });
        fireEvent.click(screen.getByRole('button', { name: 'Déclarer' }));
        expect(p.onDeclarer).toHaveBeenCalledWith('Building Better Worlds');
    });

    it('prévient quand un supplément est choisi sans source retenue, et seulement alors', () => {
        const { rerender } = render(<ChoixDuLivre {...props()} />);
        expect(screen.queryByText(/Aucune source retenue/)).toBeNull();
        rerender(<ChoixDuLivre {...props({ supplement: colonial })} />);
        expect(screen.getByText(/Aucune source retenue/)).toBeTruthy();
        rerender(<ChoixDuLivre {...props({ supplement: colonial, sourcesRetenues: ['pdf-cm'] })} />);
        expect(screen.queryByText(/Aucune source retenue/)).toBeNull();
    });
});
