import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TimelineEvent, WikiEntry } from '../../../types/chronicle.types';
import TimelineView from './TimelineView';

const commandes = vi.hoisted(() => ({ editer: vi.fn(), selectionnerWiki: vi.fn(), ouvrirWiki: vi.fn() }));
const evenement: TimelineEvent = {
    id: 'evt', campaignId: 'campagne', date: 'Jour 2', title: 'La flotte', description: 'Au port.',
    type: 'major-event', locationId: 'carte', involvedEntityIds: ['pnj'], sessionId: 'seance',
};
const article: WikiEntry = {
    id: 'wiki', campaignId: 'campagne', title: 'La fondation', content: 'Une ancienne histoire.',
    category: 'lore', eventDate: 'Jour 1', tags: [], imageUrls: [], linkedEntityIds: [],
};
vi.mock('../useSessionOSStore', () => ({ useSessionOSStore: () => ({
    activeCampaignId: 'campagne', timelineEvents: [evenement], wikiEntries: [article],
    deleteTimelineEvent: vi.fn(), atlasMaps: [{ id: 'carte', name: 'Port' }],
    setSelectedWikiEntryId: commandes.selectionnerWiki, setWikiTab: commandes.ouvrirWiki,
}) }));
vi.mock('../../../stores/useModalStore', () => ({ gmCustom: commandes.editer, gmConfirm: vi.fn() }));
vi.mock('../../../components/TexteMarkdown', () => ({ default: ({ children }: { children: string }) => <p>{children}</p> }));

describe('la chronologie distingue les événements persistés et les articles Wiki', () => {
    beforeEach(() => vi.clearAllMocks());

    it('le filtre majeur retrouve l’événement et l’édition reçoit son objet complet', () => {
        const avant = structuredClone(evenement);
        render(<TimelineView />);
        fireEvent.click(screen.getByRole('button', { name: 'Événement majeur (1)' }));
        expect(screen.queryByText('La fondation')).toBeNull();
        expect(screen.getByText('Port')).toBeTruthy();
        fireEvent.click(screen.getByTitle("Modifier l'événement"));
        expect(commandes.editer).toHaveBeenCalledWith('timeline-event-edit', evenement);
        expect(commandes.editer.mock.calls[0][1]).toBe(evenement);
        expect(evenement).toEqual(avant);
        expect(commandes.selectionnerWiki).not.toHaveBeenCalled();
    });

    it('le clic sur un article daté ouvre le Wiki au lieu du formulaire d’événement', () => {
        render(<TimelineView />);
        fireEvent.click(screen.getByText('La fondation'));
        expect(commandes.selectionnerWiki).toHaveBeenCalledWith('wiki');
        expect(commandes.ouvrirWiki).toHaveBeenCalledWith('wiki');
        expect(commandes.editer).not.toHaveBeenCalled();
    });
});
