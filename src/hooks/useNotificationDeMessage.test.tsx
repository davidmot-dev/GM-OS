import { StrictMode, useLayoutEffect, type PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useNotificationDeMessage } from './useNotificationDeMessage';
import type { SessionMessage } from '../types/session.types';

const message = (champs: Partial<SessionMessage> = {}): SessionMessage => ({
    id: 'message-1', fromId: 'GM', fromName: 'MJ', toId: 'joueur', toName: 'Joueur',
    content: 'Le sas se ferme', timestamp: 1001, isRead: false, ...champs,
});
const contexte = { messages: [] as SessionMessage[], characterId: 'joueur' as string | null,
    lastReadMessageTime: 1000, isMessengerOpen: false, selectedRecipientId: 'GM' };
const avancer = (duree: number) => act(() => vi.advanceTimersByTime(duree));

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

describe('la notification du message reçu', () => {
    it('reste vide sans message ni identité', () => {
        const { result, rerender } = renderHook(useNotificationDeMessage, { initialProps: contexte });
        expect(result.current.activeToast).toBeNull();
        rerender({ ...contexte, messages: [message()], characterId: null });
        expect(result.current.activeToast).toBeNull(); expect(vi.getTimerCount()).toBe(0);
    });

    it('affiche le signal dès le premier commit du message, sans commit intermédiaire', () => {
        const commits: Array<string | null> = [];
        const { result, rerender } = renderHook(props => {
            const signal = useNotificationDeMessage(props);
            useLayoutEffect(() => { commits.push(signal.activeToast?.fromName ?? null); });
            return signal;
        }, { initialProps: contexte });
        rerender({ ...contexte, messages: [message()] });
        expect(commits).toEqual([null, 'MJ']);
        expect(result.current.activeToast).toMatchObject({ fromName: 'MJ', channel: 'Maître du Jeu', recipientId: 'GM' });
    });

    it.each([
        { fromId: 'joueur' }, { toId: 'autre-joueur' }, { timestamp: 999 }, { timestamp: 1000 },
    ])('ne signale pas un message sortant, étranger ou déjà lu : %j', champs => {
        const { result } = renderHook(useNotificationDeMessage, {
            initialProps: { ...contexte, messages: [message(champs)] },
        });
        expect(result.current.activeToast).toBeNull(); expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['all', ''])('ouvre le canal général pour le destinataire %j', toId => {
        const { result } = renderHook(useNotificationDeMessage, {
            initialProps: { ...contexte, messages: [message({ toId, fromId: 'ami', fromName: 'Ami' })] },
        });
        expect(result.current.activeToast).toMatchObject({ fromName: 'Ami', channel: 'Canal Général', recipientId: 'all' });
    });

    it('associe le message privé à son expéditeur, même après une autre conversation', () => {
        const { result } = renderHook(useNotificationDeMessage, {
            initialProps: { ...contexte, selectedRecipientId: 'ancien-ami', isMessengerOpen: true,
                messages: [message({ fromId: 'ami', fromName: 'Ami' })] },
        });
        expect(result.current.activeToast).toMatchObject({ fromName: 'Ami', channel: 'Canal Privé', recipientId: 'ami' });
    });

    it('ne signale pas la conversation en cours et ne la rejoue pas en la quittant', () => {
        const props = { ...contexte, isMessengerOpen: true, messages: [message()] };
        const { result, rerender } = renderHook(useNotificationDeMessage, { initialProps: props });
        expect(result.current.activeToast).toBeNull(); expect(vi.getTimerCount()).toBe(0);
        rerender({ ...props, isMessengerOpen: false });
        expect(result.current.activeToast).toBeNull();
    });

    it('expire à cinq secondes sans recommencer lors d’une recopie des messages', () => {
        const props = { ...contexte, messages: [message()] };
        const { result, rerender } = renderHook(useNotificationDeMessage, { initialProps: props });
        avancer(3000); rerender({ ...props, messages: [{ ...props.messages[0], isRead: true }] });
        avancer(1999); expect(result.current.activeToast).not.toBeNull();
        avancer(1); expect(result.current.activeToast).toBeNull();
        rerender({ ...props, messages: props.messages.slice(), selectedRecipientId: 'ami' });
        expect(result.current.activeToast).toBeNull(); expect(vi.getTimerCount()).toBe(0);
    });

    it('conserve le signal et son échéance quand un message pour quelqu’un d’autre arrive', () => {
        const props = { ...contexte, messages: [message()] };
        const { result, rerender } = renderHook(useNotificationDeMessage, { initialProps: props });
        avancer(3000);
        rerender({ ...props, messages: [...props.messages, message({ id: 'autre', toId: 'autre-joueur' })] });
        expect(result.current.activeToast?.id).toBe('message-1');
        avancer(2000); expect(result.current.activeToast).toBeNull();
    });

    it('remplace le signal et donne cinq secondes au nouveau message', () => {
        const props = { ...contexte, messages: [message()] };
        const { result, rerender } = renderHook(useNotificationDeMessage, { initialProps: props });
        avancer(4000);
        rerender({ ...props, messages: [...props.messages, message({ id: 'message-2', fromId: 'ami', fromName: 'Ami' })] });
        avancer(1000); expect(result.current.activeToast?.fromName).toBe('Ami');
        avancer(3999); expect(result.current.activeToast).not.toBeNull();
        avancer(1); expect(result.current.activeToast).toBeNull();
    });

    it('ignore le rappel dépassé du message précédent', () => {
        const rappels: Array<() => void> = [];
        const minuterie = globalThis.setTimeout;
        vi.spyOn(globalThis, 'setTimeout').mockImplementation((rappel, delai, ...args) => {
            if (delai === 5000 && typeof rappel === 'function') rappels.push(() => rappel(...args));
            return minuterie(rappel, delai, ...args);
        });
        const props = { ...contexte, messages: [message()] };
        const { result, rerender } = renderHook(useNotificationDeMessage, { initialProps: props });
        rerender({ ...props, messages: [...props.messages, message({ id: 'message-2' })] });
        act(() => rappels[0]());
        expect(result.current.activeToast?.id).toBe('message-2');
    });

    it('masque le signal explicitement sans le rejouer et laisse arriver le suivant', () => {
        const props = { ...contexte, messages: [message()] };
        const { result, rerender } = renderHook(useNotificationDeMessage, { initialProps: props });
        act(() => result.current.masquerNotification());
        expect(result.current.activeToast).toBeNull(); expect(vi.getTimerCount()).toBe(0);
        rerender({ ...props, selectedRecipientId: 'ami', messages: props.messages.slice() });
        expect(result.current.activeToast).toBeNull();
        rerender({ ...props, messages: [...props.messages, message({ id: 'message-2' })] });
        expect(result.current.activeToast?.id).toBe('message-2');
    });

    it('masque les messages lus et la bonne conversation dès leur premier commit', () => {
        const commits: Array<string | null> = [];
        const props = { ...contexte, messages: [message()] };
        const { rerender } = renderHook(valeurs => {
            const signal = useNotificationDeMessage(valeurs);
            useLayoutEffect(() => { commits.push(signal.activeToast?.id ?? null); });
            return signal;
        }, { initialProps: props });
        rerender({ ...props, isMessengerOpen: true });
        rerender({ ...props, lastReadMessageTime: 1001 });
        expect(commits).toEqual(['message-1', null, null]);
    });

    it('retire le signal et son rappel quand la liste des messages est vidée', () => {
        const { result, rerender } = renderHook(useNotificationDeMessage, {
            initialProps: { ...contexte, messages: [message()] },
        });
        rerender(contexte);
        expect(result.current.activeToast).toBeNull(); expect(vi.getTimerCount()).toBe(0);
    });

    it('retire le signal de l’ancien personnage et annule son rappel', () => {
        const props = { ...contexte, messages: [message()] };
        const { result, rerender } = renderHook(useNotificationDeMessage, { initialProps: props });
        rerender({ ...props, characterId: 'autre-joueur' });
        expect(result.current.activeToast).toBeNull(); expect(vi.getTimerCount()).toBe(0);
        avancer(5000); expect(result.current.activeToast).toBeNull();
    });

    it('garde cinq secondes pour le nouveau personnage même avec le même identifiant de message', () => {
        const props = { ...contexte, messages: [message()] };
        const { result, rerender } = renderHook(useNotificationDeMessage, { initialProps: props });
        avancer(4000);
        rerender({ ...props, characterId: 'autre-joueur', messages: [message({ toId: 'autre-joueur' })] });
        avancer(1000); expect(result.current.activeToast).not.toBeNull();
        avancer(4000); expect(result.current.activeToast).toBeNull();
    });

    it('annule le rappel au démontage, y compris sous StrictMode', () => {
        const wrapper = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>;
        const { result, unmount } = renderHook(useNotificationDeMessage, {
            initialProps: { ...contexte, messages: [message()] }, wrapper,
        });
        expect(result.current.activeToast).not.toBeNull(); expect(vi.getTimerCount()).toBe(1);
        unmount(); expect(vi.getTimerCount()).toBe(0);
    });
});
