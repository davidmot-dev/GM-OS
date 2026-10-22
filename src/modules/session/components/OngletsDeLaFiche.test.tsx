import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import OngletsDeLaFiche from './OngletsDeLaFiche';

/** Les onglets de la fiche — le test dans son onglet, David, 2026-10-22. */
describe('OngletsDeLaFiche', () => {
    afterEach(cleanup);
    const onglets = [
        { id: 'formulaire' as const, libelle: 'Formulaire' },
        { id: 'test' as const, libelle: 'Lancer un test' },
    ];

    it('dit lequel est choisi, et à quel panneau il mène', () => {
        render(<OngletsDeLaFiche onglets={onglets} actif="formulaire" onChoisir={() => {}} idDuPanneau="fiche" />);
        const formulaire = screen.getByRole('tab', { name: 'Formulaire' });
        expect(formulaire.getAttribute('aria-selected')).toBe('true');
        expect(formulaire.getAttribute('aria-controls')).toBe('fiche-formulaire');
        expect(screen.getByRole('tab', { name: 'Lancer un test' }).getAttribute('aria-selected')).toBe('false');
    });

    it('rend la main à l’écran qui décide', () => {
        const onChoisir = vi.fn();
        render(<OngletsDeLaFiche onglets={onglets} actif="formulaire" onChoisir={onChoisir} idDuPanneau="fiche" />);
        fireEvent.click(screen.getByRole('tab', { name: 'Lancer un test' }));
        expect(onChoisir).toHaveBeenCalledWith('test');
    });
});
