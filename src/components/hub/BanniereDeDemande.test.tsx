import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import BanniereDeDemande from './BanniereDeDemande';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { messageDeDemande, messageDeSuite } from '../../modules/dice/filDesDemandes';
import {
    ENVOI_AFFICHE_MS, precisionsDeLaDemande, suivreLesEnvois, useDemandesDeLaTablette, useEnvoisDeLaTablette,
} from '../../modules/dice/demandesDeLaTablette';
import type { DemandeDeJet, DemandeDeTest } from '../../modules/dice/demandeDeJet';

/**
 * **« Le meneur te demande un jet »** — la tablette, plan
 * `2026-11-11-jets-demandes-et-caches.md`, T8 (C2, C5, C6) ; maquette Stitch
 * adoptée le 11/11. La bannière lit le fil des messages : une demande ouverte
 * se montre avec « Lancer » ; le jet envoyé la remplace par « Jet envoyé au
 * meneur » ; la clôture du meneur — reçue ou annulée — l'efface.
 */

const DEMANDE: DemandeDeTest = {
    genre: 'test', id: 'd-1', characterId: 'pj-wilson', emiseLe: 1, titre: 'Agilité + Mobilité',
    composition: { champs: { attribut: 'agilite', competence: 'mobilite' }, difficulte: 2 },
};

function Tablette({ onLancer }: { onLancer: (d: DemandeDeJet) => void }) {
    const demandes = useDemandesDeLaTablette('pj-wilson');
    return <BanniereDeDemande {...demandes} onLancer={onLancer} />;
}

let retirer: () => void;
beforeEach(() => {
    useSessionOSStore.setState({ messages: [] });
    useEnvoisDeLaTablette.setState({ envois: {} });
    retirer = suivreLesEnvois();
});
afterEach(() => { cleanup(); retirer(); vi.useRealTimers(); });

const recevoir = (...messages: ReturnType<typeof messageDeDemande>[]) =>
    act(() => { useSessionOSStore.setState({ messages: [...useSessionOSStore.getState().messages, ...messages] }); });

describe('la bannière de demande', () => {
    it('montre la demande ouverte, et « Lancer » rend la demande', () => {
        const onLancer = vi.fn();
        recevoir(messageDeDemande(DEMANDE, 'Wilson'));
        render(<Tablette onLancer={onLancer} />);
        expect(screen.getByText('Agilité + Mobilité')).toBeTruthy();
        expect(screen.getByText('difficulté 2')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Lancer/ }));
        expect(onLancer).toHaveBeenCalledWith(DEMANDE);
    });

    it('n’existe pas sans demande', () => {
        const { container } = render(<Tablette onLancer={() => {}} />);
        expect(container.innerHTML).toBe('');
    });

    it('ne montre pas la demande adressée à un autre personnage', () => {
        recevoir(messageDeDemande({ ...DEMANDE, characterId: 'pj-autre' }, 'Autre'));
        const { container } = render(<Tablette onLancer={() => {}} />);
        expect(container.innerHTML).toBe('');
    });

    it('le jet envoyé remplace « Lancer » par « Jet envoyé au meneur », qui s’efface seul', () => {
        vi.useFakeTimers();
        recevoir(messageDeDemande(DEMANDE, 'Wilson'));
        render(<Tablette onLancer={() => {}} />);
        act(() => { window.dispatchEvent(new CustomEvent('fiche:resultat', { detail: { characterId: 'pj-wilson', demandeId: 'd-1' } })); });
        expect(screen.queryByRole('button', { name: /Lancer/ })).toBeNull();
        expect(screen.getByRole('status').textContent).toContain('Jet envoyé au meneur');
        act(() => { vi.advanceTimersByTime(ENVOI_AFFICHE_MS + 100); });
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('une Sauvegarde envoyée (`fiche:jet`) compte aussi', () => {
        recevoir(messageDeDemande({ genre: 'sauvegarde', id: 'd-2', characterId: 'pj-wilson', emiseLe: 1, titre: 'Sauvegarde de Force', champ: 'force' }, 'Wilson'));
        render(<Tablette onLancer={() => {}} />);
        act(() => { window.dispatchEvent(new CustomEvent('fiche:jet', { detail: { characterId: 'pj-wilson', demandeId: 'd-2' } })); });
        expect(screen.queryByRole('button', { name: /Lancer/ })).toBeNull();
    });

    it('une demande annulée par le meneur disparaît (C5)', () => {
        recevoir(messageDeDemande(DEMANDE, 'Wilson'));
        render(<Tablette onLancer={() => {}} />);
        expect(screen.getByRole('button', { name: /Lancer/ })).toBeTruthy();
        recevoir(messageDeSuite(DEMANDE, 'annulee', 'Wilson'));
        expect(screen.queryByRole('button', { name: /Lancer/ })).toBeNull();
    });
});

describe('ce que le meneur a fixé, en une ligne', () => {
    it('dit la difficulté, l’ajustement et le modificateur', () => {
        expect(precisionsDeLaDemande({ ...DEMANDE, composition: { champs: {}, ajustementDeDifficulte: -3, modificateurDuSeuil: 2 } }))
            .toBe('difficulté -3 · modificateur +2');
    });
    it('rien pour une Sauvegarde : son titre dit déjà l’avantage', () => {
        expect(precisionsDeLaDemande({ genre: 'sauvegarde', id: 'x', characterId: 'p', emiseLe: 1, titre: 't', champ: 'f' })).toBe('');
    });
});
