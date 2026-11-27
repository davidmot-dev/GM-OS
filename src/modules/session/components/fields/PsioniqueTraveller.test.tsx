import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PsioniqueTraveller } from './PsioniqueTraveller';

/** TRV-A6 (27/11/2026) — C3 et C4 : un pouvoir psionique, sa difficulté, sa portée et sa dépense (p. 225-229). */
afterEach(cleanup);

describe('la carte « Pouvoir psionique »', () => {
    it('Suggestion : 12+ posé sur le test, portée allongée deux fois = coût ×4, réussite → 12 PSI dont 3 en dégâts', () => {
        const poser = vi.fn(), depenser = vi.fn();
        const { rerender } = render(<PsioniqueTraveller talent="Télépathie" psi={9} resultat={null} poserLaDifficulte={poser} depenser={depenser} />);
        fireEvent.change(screen.getByLabelText('Pouvoir psionique'), { target: { value: '5' } });
        expect(poser).toHaveBeenCalledWith(12);
        expect(document.querySelector('[data-cout-psionique]')!.textContent).toContain('3 PSI en cas de réussite, 1 en cas d’échec');
        fireEvent.change(screen.getByLabelText('Portée du pouvoir'), { target: { value: '2' } });
        expect(document.querySelector('[data-cout-psionique]')!.textContent).toContain('12 PSI');
        rerender(<PsioniqueTraveller talent="Télépathie" psi={9} resultat={{ effet: 1, compte: 1 }} poserLaDifficulte={poser} depenser={depenser} />);
        fireEvent.click(screen.getByText(/Réussite — dépenser 12 PSI \(3 en dégâts\)/));
        expect(depenser).toHaveBeenCalledWith(0, 3, expect.stringContaining('Suggestion (Télépathie) : réussite, 12 PSI dépensés — PSI 9 → 0'));
        expect(document.querySelector('[data-psi-depensee]')).toBeTruthy();
        expect(screen.queryByText(/dépenser/)).toBeNull(); // une seule fois par jet
    });

    it('un échec coûte un point ; un coût au choix se saisit (Télékinésie, 1 par 10 kg)', () => {
        const depenser = vi.fn();
        render(<PsioniqueTraveller talent="Télékinésie" psi={5} resultat={{ effet: -2, compte: 3 }} poserLaDifficulte={vi.fn()} depenser={depenser} />);
        fireEvent.change(screen.getByLabelText('Pouvoir psionique'), { target: { value: '0' } });
        fireEvent.change(screen.getByLabelText('Coût choisi en PSI'), { target: { value: '4' } });
        expect(document.querySelector('[data-cout-psionique]')!.textContent).toContain('4 PSI en cas de réussite');
        fireEvent.click(screen.getByText('Échec — dépenser 1 PSI'));
        expect(depenser).toHaveBeenCalledWith(4, 0, expect.stringContaining('échec, 1 PSI dépensé'));
    });

    it('sans point de PSI, la tentative est refusée', () => {
        render(<PsioniqueTraveller talent="Clairvoyance" psi={0} resultat={{ effet: 2, compte: 1 }} poserLaDifficulte={vi.fn()} depenser={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('Pouvoir psionique'), { target: { value: '0' } });
        expect(document.querySelector('[data-psi-epuisee]')).toBeTruthy();
        expect(screen.queryByText(/dépenser/)).toBeNull();
    });
});
