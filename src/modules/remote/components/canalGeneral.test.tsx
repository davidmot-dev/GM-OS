import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RemoteMessenger from './RemoteMessenger';
import type { SessionMessage } from '../../../types/session.types';

/**
 * **On peut écrire à tout le monde depuis la tablette.**
 *
 * Trouvé par David le 2026-09-05 : *« je ne peux pas envoyer de message à tout
 * le monde »*. J'avais fermé le champ d'écriture sur « Tous », au motif qu'un
 * message sans destinataire n'existe pas.
 *
 * ⛔ **C'était faux.** Le meneur écrit au canal général depuis son cockpit
 * depuis toujours, en envoyant à l'identifiant `'all'`, et le Tablet Hub des
 * joueurs le reçoit comme *Canal Général* (`toId === 'all'`). Tout le circuit
 * existait ; je l'avais fermé d'un seul côté. *Une précaution qui interdit ce
 * que le reste de l'application permet n'est pas une précaution, c'est une
 * régression.*
 */

const msg = (id: string, fromId: string, toId: string, content = 'texte'): SessionMessage =>
    ({ id, fromId, fromName: fromId, toId, toName: toId, content, timestamp: 1000, isRead: false });

const DESTINATAIRES = [{ id: 'pc-1', nom: 'Alia' }, { id: 'pc-2', nom: 'Boro' }];

const poser = (messages: SessionMessage[] = []) => {
    const envoyer = vi.fn();
    render(<RemoteMessenger messages={messages} destinataires={DESTINATAIRES} onEnvoyer={envoyer} />);
    return envoyer;
};

const champ = () => screen.getByLabelText('Message à envoyer') as HTMLInputElement;

describe('le canal général', () => {
    it('LE DÉFAUT DU 05/09 : le champ est ouvert sur « Tous »', () => {
        poser();
        expect(champ().disabled).toBe(false);
    });

    it('envoie à l’identifiant « all », celui que le hub des joueurs reconnaît', () => {
        const envoyer = poser();

        fireEvent.change(champ(), { target: { value: 'Tout le monde en arrière.' } });
        fireEvent.click(screen.getByLabelText('Envoyer le message'));

        expect(envoyer).toHaveBeenCalledWith('all', 'Tous les joueurs', 'Tout le monde en arrière.');
    });

    it('dit à qui l’on parle, même sur le canal général', () => {
        poser();
        expect(champ().placeholder).toContain('Tous les joueurs');
    });

    it('affiche « → Tous » sur un message du canal, et non l’identifiant brut', () => {
        poser([msg('m1', 'GM', 'all', 'Annonce')]);
        expect(screen.getByText(/→ Tous/)).toBeTruthy();
    });
});

describe('écrire à une personne', () => {
    it('envoie à ce personnage-là', () => {
        const envoyer = poser();

        fireEvent.click(screen.getByText('Alia'));
        fireEvent.change(champ(), { target: { value: 'Toi seule vois la trappe.' } });
        fireEvent.click(screen.getByLabelText('Envoyer le message'));

        expect(envoyer).toHaveBeenCalledWith('pc-1', 'Alia', 'Toi seule vois la trappe.');
    });

    it('nomme le destinataire dans le champ — deviner enverrait un jour le secret d’un joueur à un autre', () => {
        poser();
        fireEvent.click(screen.getByText('Boro'));
        expect(champ().placeholder).toContain('Boro');
    });

    it('filtre le fil sur ce correspondant', () => {
        poser([msg('m1', 'GM', 'pc-1', 'Pour Alia'), msg('m2', 'GM', 'pc-2', 'Pour Boro')]);

        fireEvent.click(screen.getByText('Alia'));

        expect(screen.getByText('Pour Alia')).toBeTruthy();
        expect(screen.queryByText('Pour Boro')).toBeNull();
    });
});

describe('ce qui ne part pas', () => {
    it('un message vide', () => {
        const envoyer = poser();
        fireEvent.change(champ(), { target: { value: '   ' } });
        fireEvent.click(screen.getByLabelText('Envoyer le message'));
        expect(envoyer).not.toHaveBeenCalled();
    });

    it('le champ se vide après un envoi', () => {
        poser();
        fireEvent.change(champ(), { target: { value: 'Parti.' } });
        fireEvent.keyDown(champ(), { key: 'Enter' });
        expect(champ().value).toBe('');
    });
});
