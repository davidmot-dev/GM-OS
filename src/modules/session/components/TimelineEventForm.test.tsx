import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TimelineEventForm } from './TimelineEventForm';
import type { TimelineEvent } from '../useSessionOSStore';

const magasin = vi.hoisted(() => ({ ajouter: vi.fn(), modifier: vi.fn() }));
vi.mock('../useSessionOSStore', () => ({ useSessionOSStore: () => ({
    activeCampaignId: 'campagne', addTimelineEvent: magasin.ajouter,
    updateTimelineEvent: magasin.modifier, atlasMaps: [{ id: 'carte', campaignId: 'campagne', name: 'Port' }], entities: [],
}) }));
vi.mock('../../../store/useClockStore', () => ({ useClockStore: () => ({ getFantasyDate: () => null, calendars: {} }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (cle: string) => cle }) }));

const cle = (suffixe: string) => `modules:session.timeline_form.${suffixe}`;
const categories = ['session', 'combat', 'quest', 'lore', 'major-event'] as const;

describe('les cinq catégories de chronologie décidées par David le 08/10', () => {
    beforeEach(() => vi.clearAllMocks());

    it('propose les cinq catégories du modèle, sans les anciens minor/discovery', () => {
        render(<TimelineEventForm onClose={vi.fn()} />);
        for (const type of categories) {
            expect(screen.getByRole('button', { name: cle(`types.${type === 'major-event' ? 'major' : type}`) })).toBeTruthy();
        }
        expect(screen.queryByRole('button', { name: cle('types.minor') })).toBeNull();
        expect(screen.queryByRole('button', { name: cle('types.discovery') })).toBeNull();
    });

    it.each(categories)('enregistre la catégorie canonique %s depuis le formulaire réel', type => {
        const fermer = vi.fn();
        render(<TimelineEventForm onClose={fermer} />);
        fireEvent.change(screen.getByPlaceholderText(cle('title_placeholder')), { target: { value: 'Au port' } });
        fireEvent.change(screen.getByPlaceholderText(cle('date_placeholder')), { target: { value: ' Jour 1 ' } });
        fireEvent.change(screen.getByPlaceholderText(cle('desc_placeholder')), { target: { value: 'Une rencontre.' } });
        fireEvent.click(screen.getByRole('button', { name: cle(`types.${type === 'major-event' ? 'major' : type}`) }));
        fireEvent.click(screen.getByRole('button', { name: cle('save_create') }));
        expect(magasin.ajouter).toHaveBeenCalledWith(expect.objectContaining({
            id: expect.any(String), campaignId: 'campagne', title: 'Au port', date: 'Jour 1',
            description: 'Une rencontre.', type, involvedEntityIds: [],
        }));
        expect(magasin.modifier).not.toHaveBeenCalled();
        expect(fermer).toHaveBeenCalledTimes(1);
    });

    it('réédite un événement majeur en conservant ses liens sans muter l’original', () => {
        const evenement: TimelineEvent = {
            id: 'evt', campaignId: 'campagne', date: 'Jour 2', title: 'Arrivée', description: 'La flotte arrive.',
            type: 'major-event', locationId: 'carte', involvedEntityIds: ['pnj'], sessionId: 'seance',
        };
        const avant = structuredClone(evenement);
        render(<TimelineEventForm event={evenement} onClose={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText(cle('title_placeholder')), { target: { value: 'Départ' } });
        fireEvent.click(screen.getByRole('button', { name: cle('save_edit') }));
        expect(magasin.modifier).toHaveBeenCalledWith('evt', expect.objectContaining({
            title: 'Départ', type: 'major-event', locationId: 'carte', involvedEntityIds: ['pnj'],
        }));
        expect(evenement).toEqual(avant);
        expect(magasin.ajouter).not.toHaveBeenCalled();
    });
});
