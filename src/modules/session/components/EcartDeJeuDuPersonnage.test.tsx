import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EcartDeJeuDuPersonnage } from './EcartDeJeuDuPersonnage';
import { useSessionOSStore } from '../useSessionOSStore';
import type { PlayerCharacter } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/* « TEst NOC » (David, 2026-10-13) : lié à une campagne NOC, il portait la fiche de Within. */
const initial = useSessionOSStore.getState();
const NOC = { id: 'noc', name: 'NOC', templateId: 'tpl-noc', combat: { statsToTrack: [], initiativeFormula: '', defaultHealthType: 'hp' } } as unknown as GameDriver;
const WITHIN = { id: 'within', name: 'Within', templateId: 'tpl-within', combat: { statsToTrack: [], initiativeFormula: '' } } as unknown as GameDriver;
const fiche = (id: string, champ: string) => ({ id, name: id, sections: [{ id: 's', label: 'S', fields: [{ id: champ, label: champ, type: 'number' }] }] }) as unknown as SheetTemplate;
const perso = { id: 'pj', name: 'TEst NOC', campaignId: 'c-noc', systemId: 'within', templateId: 'tpl-within', portraitUrl: '', sheetData: { esprit: 3 } } as unknown as PlayerCharacter;

const lePerso = () => useSessionOSStore.getState().players[0].characters[0];

beforeEach(() => {
    useSessionOSStore.setState({
        campaigns: [{ id: 'c-noc', name: 'TEST NOC', system: 'noc' }] as never,
        customGameDrivers: [NOC, WITHIN],
        customSheetTemplates: [fiche('tpl-noc', 'action'), fiche('tpl-within', 'esprit')],
        players: [{ id: 'p', realName: 'Daniel', avatarUrl: '', isOnline: false, characters: [perso] }],
    });
});

afterEach(() => {
    cleanup();
    useSessionOSStore.setState(initial, true);
});

describe('EcartDeJeuDuPersonnage', () => {
    it('dit le jeu du personnage et celui de sa campagne', () => {
        render(<EcartDeJeuDuPersonnage playerId="p" personnage={lePerso()} />);
        expect(screen.getByRole('status').textContent).toContain('Within');
        expect(screen.getByRole('status').textContent).toContain('NOC');
    });

    it('fait passer le personnage au jeu de la campagne, une fois confirmé', () => {
        render(<EcartDeJeuDuPersonnage playerId="p" personnage={lePerso()} />);
        fireEvent.click(screen.getByRole('button'));

        // Rien ne change avant la confirmation, qui nomme ce qui se perd.
        expect(lePerso().systemId).toBe('within');
        expect(useModalStore.getState().message).toContain('esprit');

        useModalStore.getState().onConfirm?.();
        expect(lePerso().systemId).toBe('noc');
        expect(lePerso().templateId).toBe('tpl-noc');
        expect(lePerso().sheetData).toEqual({ action: 0 });
    });

    it('ne s’affiche pas quand le personnage suit le jeu de sa campagne', () => {
        const { container } = render(<EcartDeJeuDuPersonnage playerId="p" personnage={{ ...perso, systemId: 'noc', templateId: 'tpl-noc' }} />);
        expect(container.firstChild).toBeNull();
    });
});
