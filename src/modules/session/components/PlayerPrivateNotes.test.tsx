import { StrictMode, useLayoutEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import PlayerPrivateNotes from './PlayerPrivateNotes';
import { useSessionOSStore } from '../useSessionOSStore';
import type { PlayerCharacter } from '../../../types/player.types';
import type { GameSession, SessionFeedback } from '../../../types/session.types';

const initial = useSessionOSStore.getState();
const enregistrer = vi.fn<typeof initial.remoteUpdateCharacterNarrative>();
const transmettre = vi.fn<typeof initial.remoteSubmitSessionFeedback>();
const personnage = (id: string, playerNotes?: string): PlayerCharacter => ({
    id, name: id, campaignId: 'campagne', portraitUrl: '', templateId: 'test', sheetData: {}, playerNotes,
});
const seance = (id = 'seance'): GameSession => ({
    id, campaignId: 'campagne', number: 1, date: '2026-10-08', status: 'active', publicSummary: '',
    gmSecrets: '', checklist: [], sessionEntityIds: [], feedbacks: [],
});
const cle = (session = 'seance', character = 'a') => `feedback:campagne:${session}:${character}`;
const retour: SessionFeedback = { characterId: 'a', characterName: 'a', funRating: 3, storyRating: 4,
    combatRating: 2, notes: 'Le relais', timestamp: 1 };
const notes = () => screen.getByPlaceholderText(/Notez ici vos théories/) as HTMLTextAreaElement;
const commentaires = () => screen.getByPlaceholderText(/Ce que vous avez aimé/) as HTMLTextAreaElement;
const ongletFeedback = () => fireEvent.click(screen.getByRole('button', { name: 'Feedback MJ' }));
const saisir = (texte: string) => fireEvent.change(notes(), { target: { value: texte } });
const attendre = (duree: number) => act(() => vi.advanceTimersByTime(duree));
function publier(texte: string | undefined, id = 'a') {
    act(() => useSessionOSStore.setState(state => ({ players: state.players.map(p => ({ ...p,
        characters: p.characters.map(c => c.id === id ? { ...c, playerNotes: texte } : c),
    })) })));
}

beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    enregistrer.mockReset();
    transmettre.mockReset();
    useSessionOSStore.setState({ players: [{ id: 'joueur', realName: 'Joueur', avatarUrl: '', isOnline: true,
        characters: [personnage('a', 'Initial'), personnage('b', 'Autre')] }], sessions: [seance()],
        remoteUpdateCharacterNarrative: enregistrer, remoteSubmitSessionFeedback: transmettre });
});
afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    useSessionOSStore.setState(initial, true);
});

describe('les notes du personnage courant', () => {
    it('affiche les notes dès le premier commit et ne les renvoie pas au montage', () => {
        const valeurs: string[] = [];
        function Observation() {
            const courant = useSessionOSStore(state => state.players[0].characters[0]);
            useLayoutEffect(() => { valeurs.push(notes().value); }, [courant]);
            return <PlayerPrivateNotes playerId="joueur" characterId="a" />;
        }
        const vue = render(<Observation />);
        expect(valeurs).toEqual(['Initial']);
        publier('MJ');
        expect(valeurs).toEqual(['Initial', 'MJ']);
        vue.unmount();
        expect(enregistrer).not.toHaveBeenCalled();
    });

    it('retarde de 1 500 ms après la dernière frappe et termine son indicateur après 800 ms', () => {
        render(<PlayerPrivateNotes playerId="joueur" characterId="a" />);
        saisir('Premier'); attendre(1000); saisir('Dernier'); attendre(1499);
        expect(enregistrer).not.toHaveBeenCalled();
        attendre(1);
        expect(enregistrer).toHaveBeenCalledExactlyOnceWith('joueur', 'a', { playerNotes: 'Dernier' });
        expect(screen.getByText('SYNCHRO...')).toBeTruthy();
        attendre(799); expect(screen.getByText('SYNCHRO...')).toBeTruthy();
        attendre(1); expect(screen.getByText('À JOUR')).toBeTruthy();
    });

    it('ne renvoie pas le brouillon dépassé par une modification du MJ', () => {
        const vue = render(<PlayerPrivateNotes playerId="joueur" characterId="a" />);
        saisir('Brouillon'); attendre(700); publier('Version MJ');
        expect(notes().value).toBe('Version MJ');
        attendre(800); vue.unmount();
        expect(enregistrer).not.toHaveBeenCalled();
    });

    it('ne renvoie pas une version extérieure identique à la saisie', () => {
        const vue = render(<PlayerPrivateNotes playerId="joueur" characterId="a" />);
        saisir('Accord'); publier('Accord'); attendre(1500); vue.unmount();
        expect(enregistrer).not.toHaveBeenCalled();
    });

    it('accepte aussi la suppression extérieure des notes', () => {
        const vue = render(<PlayerPrivateNotes playerId="joueur" characterId="a" />);
        saisir('Brouillon'); publier(undefined); attendre(1500);
        expect(notes().value).toBe(''); vue.unmount();
        expect(enregistrer).not.toHaveBeenCalled();
    });

    it('garde la nouvelle saisie quand arrive un écho de la sauvegarde précédente', () => {
        render(<PlayerPrivateNotes playerId="joueur" characterId="a" />);
        saisir('Envoi'); attendre(1500); saisir('Suite'); publier('Envoi');
        expect(notes().value).toBe('Suite'); attendre(1500);
        expect(enregistrer.mock.calls).toEqual([
            ['joueur', 'a', { playerNotes: 'Envoi' }], ['joueur', 'a', { playerNotes: 'Suite' }],
        ]);
    });

    it('accepte l’écho synchrone du vrai magasin sans double sauvegarde', () => {
        enregistrer.mockImplementation((playerId, characterId, updates) => {
            useSessionOSStore.getState().updateCharacterNarrative(playerId, characterId, updates);
        });
        const vue = render(<PlayerPrivateNotes playerId="joueur" characterId="a" />);
        saisir('Synchronisé'); attendre(1500); vue.unmount();
        expect(enregistrer).toHaveBeenCalledTimes(1);
        expect(useSessionOSStore.getState().players[0].characters[0].playerNotes).toBe('Synchronisé');
    });

    it('garde la saisie pendant une modification sans rapport des métadonnées', () => {
        render(<PlayerPrivateNotes playerId="joueur" characterId="a" />);
        saisir('Brouillon');
        act(() => useSessionOSStore.setState(state => ({ players: state.players.map(p => ({ ...p,
            characters: p.characters.map(c => ({ ...c, name: 'Nouveau nom' })),
        })) })));
        expect(notes().value).toBe('Brouillon'); attendre(1500);
        expect(enregistrer).toHaveBeenCalledExactlyOnceWith('joueur', 'a', { playerNotes: 'Brouillon' });
    });

    it('sauve la dernière frappe à la fermeture et annule les rappels', () => {
        const vue = render(<PlayerPrivateNotes playerId="joueur" characterId="a" />);
        const rappelsDuMagasin = vi.getTimerCount();
        saisir('À la fermeture'); vue.unmount(); attendre(10000);
        expect(enregistrer).toHaveBeenCalledExactlyOnceWith('joueur', 'a', { playerNotes: 'À la fermeture' });
        expect(vi.getTimerCount()).toBe(rappelsDuMagasin);
    });

    it('nettoie aussi le rappel de l’indicateur après un envoi', () => {
        const vue = render(<PlayerPrivateNotes playerId="joueur" characterId="a" />);
        const rappelsDuMagasin = vi.getTimerCount();
        saisir('Envoyé'); attendre(1500); vue.unmount();
        expect(vi.getTimerCount()).toBe(rappelsDuMagasin); expect(enregistrer).toHaveBeenCalledTimes(1);
    });

    it('sauve pour l’ancien personnage puis affiche les notes du nouveau', () => {
        const vue = render(<PlayerPrivateNotes playerId="joueur" characterId="a" />);
        saisir('Pour A'); vue.rerender(<PlayerPrivateNotes playerId="joueur" characterId="b" />);
        expect(notes().value).toBe('Autre'); saisir('Pour B'); attendre(1500);
        expect(enregistrer.mock.calls).toEqual([
            ['joueur', 'a', { playerNotes: 'Pour A' }], ['joueur', 'b', { playerNotes: 'Pour B' }],
        ]);
    });

    it('isole aussi deux joueurs dont les personnages ont le même identifiant et les mêmes notes', () => {
        act(() => useSessionOSStore.setState(state => ({ players: [...state.players,
            { ...state.players[0], id: 'autre-joueur' }] })));
        const vue = render(<PlayerPrivateNotes playerId="joueur" characterId="a" />);
        saisir('Privé'); vue.rerender(<PlayerPrivateNotes playerId="autre-joueur" characterId="a" />);
        expect(notes().value).toBe('Initial'); attendre(10000);
        expect(enregistrer).toHaveBeenCalledExactlyOnceWith('joueur', 'a', { playerNotes: 'Privé' });
    });

    it('sauve une seule fois sous StrictMode et ne laisse aucun rappel', () => {
        const vue = render(<StrictMode><PlayerPrivateNotes playerId="joueur" characterId="a" /></StrictMode>);
        const rappelsDuMagasin = vi.getTimerCount();
        expect(enregistrer).not.toHaveBeenCalled(); saisir('Strict'); vue.unmount(); attendre(10000);
        expect(enregistrer).toHaveBeenCalledExactlyOnceWith('joueur', 'a', { playerNotes: 'Strict' });
        expect(vi.getTimerCount()).toBe(rappelsDuMagasin);
    });
});

describe('le retour de la séance courante', () => {
    it('retrouve le retour transmis et permet de le modifier', () => {
        localStorage.setItem(cle(), JSON.stringify(retour));
        render(<PlayerPrivateNotes playerId="joueur" characterId="a" />); ongletFeedback();
        expect(screen.getByRole('heading', { name: 'Feedback Transmis !' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Modifier mon feedback' }));
        expect(commentaires().value).toBe('Le relais');
        expect(screen.getByRole('button', { name: 'Histoire : 4 sur 5' }).getAttribute('aria-pressed')).toBe('true');
    });

    it.each(['null', '{"funRating":9,"storyRating":4,"combatRating":2,"notes":"ancien"}', '{'])(
        'revient à un formulaire neuf pour un retour invalide : %s', saved => {
            vi.spyOn(console, 'error').mockImplementation(() => {});
            localStorage.setItem(cle(), saved);
            render(<PlayerPrivateNotes playerId="joueur" characterId="a" />); ongletFeedback();
            expect(commentaires().value).toBe('');
            expect(screen.getByRole('button', { name: 'Histoire : 5 sur 5' }).getAttribute('aria-pressed')).toBe('true');
        });

    it('garde le brouillon en changeant d’onglet et en repliant le panneau', () => {
        render(<PlayerPrivateNotes playerId="joueur" characterId="a" />); ongletFeedback();
        fireEvent.change(commentaires(), { target: { value: 'À finir' } });
        fireEvent.click(screen.getByRole('button', { name: 'Notes Privées' }));
        fireEvent.click(screen.getByRole('button', { name: /Notes & Feedback/ }));
        fireEvent.click(screen.getByRole('button', { name: /Notes & Feedback/ })); ongletFeedback();
        expect(commentaires().value).toBe('À finir');
    });

    it('envoie les trois notes et le commentaire pour la bonne séance et le bon personnage', () => {
        render(<PlayerPrivateNotes playerId="joueur" characterId="a" />); ongletFeedback();
        fireEvent.click(screen.getByRole('button', { name: 'Plaisir de jeu : 3 sur 5' }));
        fireEvent.click(screen.getByRole('button', { name: 'Histoire : 4 sur 5' }));
        fireEvent.click(screen.getByRole('button', { name: 'Combat / Action : 2 sur 5' }));
        fireEvent.change(commentaires(), { target: { value: 'Le relais' } });
        fireEvent.click(screen.getByRole('button', { name: 'Transmettre au MJ' }));
        expect(transmettre).toHaveBeenCalledExactlyOnceWith('seance', { ...retour, timestamp: Date.now() });
        expect(JSON.parse(localStorage.getItem(cle())!)).toEqual({ ...retour, timestamp: Date.now() });
        expect(screen.getByRole('heading', { name: 'Feedback Transmis !' })).toBeTruthy();
    });

    it('change de retour avec la séance puis désactive l’envoi sans séance active', () => {
        localStorage.setItem(cle(), JSON.stringify(retour));
        render(<PlayerPrivateNotes playerId="joueur" characterId="a" />); ongletFeedback();
        act(() => useSessionOSStore.setState({ sessions: [seance('suivante')] }));
        expect(commentaires().value).toBe('');
        fireEvent.change(commentaires(), { target: { value: 'Brouillon suivant' } });
        act(() => useSessionOSStore.setState({ sessions: [] }));
        expect(commentaires().value).toBe('');
        expect((screen.getByRole('button', { name: 'Aucune session active' }) as HTMLButtonElement).disabled).toBe(true);
        expect(transmettre).not.toHaveBeenCalled();
    });

    it('ne montre pas le retour d’un autre personnage', () => {
        localStorage.setItem(cle(), JSON.stringify(retour));
        const vue = render(<PlayerPrivateNotes playerId="joueur" characterId="a" />); ongletFeedback();
        vue.rerender(<PlayerPrivateNotes playerId="joueur" characterId="b" />); ongletFeedback();
        expect(commentaires().value).toBe('');
        expect(screen.queryByRole('heading', { name: 'Feedback Transmis !' })).toBeNull();
    });
});
