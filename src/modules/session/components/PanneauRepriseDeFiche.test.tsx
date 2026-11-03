import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import type { GameDriver } from '../../../types/drivers';
import type { PlayerCharacter } from '../../../types/player.types';
import { PanneauRepriseDeFiche } from './PanneauRepriseDeFiche';
const pilote = { id: 'jeu', name: 'Jeu', templateId: 'tpl', version: '2.0.0' } as GameDriver;
const gabarit: SheetTemplate = { id: 'tpl', name: 'Fiche', emoji: '', sections: [{ id: 's', label: 'S', fields: [
    { id: 'force', label: 'Force', type: 'number', defaultValue: 0 },
] }] };
const personnage = { id: 'pj', templateId: 'ancien', systemId: 'jeu', sheetData: { ancienne: '12', note: 'Texte' } } as unknown as PlayerCharacter;

it('ne modifie rien à l’ouverture et exige la sauvegarde de l’aperçu choisi avant application', () => {
    const appliquer = vi.fn();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:sauvegarde');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { rerender } = render(<PanneauRepriseDeFiche {...{ pilote, gabarit, personnage, appliquer }} joueurId="j" brouillon={false} />);
    const bouton = () => screen.getByRole('button', { name: 'Appliquer cette reprise', hidden: true }) as HTMLButtonElement;
    expect(appliquer).not.toHaveBeenCalled(); expect(bouton().disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Reprendre ancienne vers'), { target: { value: 'force' } });
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger la sauvegarde avant reprise', hidden: true }));
    expect(bouton().disabled).toBe(false);
    // Une saisie du formulaire ou un changement de la fiche invalide la sauvegarde préparée.
    rerender(<PanneauRepriseDeFiche {...{ pilote, gabarit, personnage, appliquer }} joueurId="j" brouillon />);
    expect(bouton().disabled).toBe(true);
    rerender(<PanneauRepriseDeFiche {...{ pilote, gabarit, personnage, appliquer }} joueurId="j" brouillon={false} />);
    fireEvent.click(bouton());
    expect(appliquer).toHaveBeenCalledWith(expect.objectContaining({ sheetData: { ancienne: '12', note: 'Texte', force: 12 } }));
});

it('laisse corriger une liaison incompatible sans masquer les choix', () => {
    render(<PanneauRepriseDeFiche {...{ pilote, gabarit, personnage }} appliquer={vi.fn()} joueurId="j" brouillon={false} />);
    fireEvent.change(screen.getByLabelText('Reprendre note vers'), { target: { value: 'force' } });
    expect(screen.getByRole('alert', { hidden: true }).textContent).toContain('incompatible');
    fireEvent.change(screen.getByLabelText('Reprendre note vers'), { target: { value: '' } });
    expect(screen.queryByRole('alert', { hidden: true })).toBeNull();
});
