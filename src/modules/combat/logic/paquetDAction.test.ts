import { describe, it, expect } from 'vitest';
import {
    campQuiCommence,
    carteDecrite,
    defautsDeLaCarte,
    direLaLigne,
    effetsDuCamp,
    effetsDuRound,
    ligneActive,
    paquetDActionDuJeu,
} from './paquetDAction';
import type { CarteDAction, DeckManifest } from '../../../types/deck.types';

/**
 * **Le Paquet d'Action de Torg** — carnet NotebookLM « Torg », 2026-10-13. Une
 * carte : deux Lignes de Conflit (standard, dramatique), qui disent quel camp
 * commence et ce que chacun reçoit, et une ou deux Actions approuvées.
 */
const CARTE: CarteDAction = {
    standard: { premier: 'H', heros: ['inspiration'] },
    dramatique: { premier: 'V', vilains: ['vivacite'], heros: ['fatigues'] },
    approuvees: ['provocation'],
};

const paquet = (p: Partial<DeckManifest>): DeckManifest => ({
    id: 'd', name: 'Paquet', systemId: 'torg', folderPath: 'x', cardCount: 66, format: 'poker', orientation: 'portrait', useDiscard: true, ...p,
});

describe('la Ligne de Conflit', () => {
    it('la scène choisit la ligne : la claire en standard, la sombre en dramatique', () => {
        expect(campQuiCommence(ligneActive(CARTE, 'standard'))).toBe('joueurs');
        expect(campQuiCommence(ligneActive(CARTE, 'dramatique'))).toBe('adversaires');
    });

    it('chaque camp lit ce que la ligne lui donne', () => {
        const sombre = ligneActive(CARTE, 'dramatique');
        expect(effetsDuCamp(sombre, 'joueurs')).toEqual(['fatigues']);
        expect(effetsDuCamp(sombre, 'adversaires')).toEqual(['vivacite']);
        expect(effetsDuCamp(ligneActive(CARTE, 'standard'), 'adversaires')).toEqual([]);
    });

    it('se dit en une phrase, pour l’écran et le journal', () => {
        expect(direLaLigne(ligneActive(CARTE, 'dramatique'), CARTE.approuvees))
            .toBe('Vilains d’abord — Héros : Fatigués — Vilains : Vivacité — Action approuvée : Provocation');
    });
});

describe('le paquet et ses cartes', () => {
    it('le Paquet d’Action est le paquet du jeu marqué « action »', () => {
        const decks = [paquet({ id: 'oracle' }), paquet({ id: 'destin', role: 'destin' }), paquet({ id: 'action', role: 'action' }), paquet({ id: 'br', systemId: 'br', role: 'action' })];
        expect(paquetDActionDuJeu(decks, 'torg')?.id).toBe('action');
        expect(paquetDActionDuJeu(decks, 'dune')).toBeNull();
    });

    it('une carte que le meneur n’a pas décrite ne dit rien', () => {
        const deck = paquet({ cardMetadata: { 3: { name: 'Trois', action: CARTE } } });
        expect(carteDecrite(deck, 3)).toEqual(CARTE);
        expect(carteDecrite(deck, 4)).toBeNull();
        expect(carteDecrite(deck, null)).toBeNull();
    });

    it('une carte retouchée à la main dit ce qui ne va pas', () => {
        expect(defautsDeLaCarte(CARTE)).toEqual([]);
        expect(defautsDeLaCarte({
            standard: { premier: 'X' as 'H', heros: ['elan' as 'inspiration'] },
            dramatique: { premier: 'V' },
            approuvees: ['danse' as 'ruse'],
        })).toEqual([
            'La ligne standard ne dit pas qui commence (H ou V).',
            '« elan » n’est pas un effet de la Ligne de Conflit.',
            '« danse » n’est pas une Action approuvée.',
        ]);
    });
});

describe('les effets du round, envoyés aux tablettes (16/10)', () => {
    const deck = paquet({ role: 'action', cardMetadata: { 3: { action: CARTE } } });
    const ordre = { tour: { round: 1 }, carte: { index: 3 }, carteEnAttente: false, scene: 'standard' as const };

    it('la ligne de la scène, pour le camp demandé', () => {
        expect(effetsDuRound(ordre, deck, 'joueurs')).toEqual(['inspiration']);
        expect(effetsDuRound({ ...ordre, scene: 'dramatique' }, deck, 'joueurs')).toEqual(['fatigues']);
        expect(effetsDuRound({ ...ordre, scene: 'dramatique' }, deck, 'adversaires')).toEqual(['vivacite']);
    });

    it('rien sans round, sans carte, carte en attente ou non décrite', () => {
        expect(effetsDuRound({ ...ordre, tour: null }, deck, 'joueurs')).toEqual([]);
        expect(effetsDuRound({ ...ordre, carte: null }, deck, 'joueurs')).toEqual([]);
        expect(effetsDuRound({ ...ordre, carteEnAttente: true }, deck, 'joueurs')).toEqual([]);
        expect(effetsDuRound({ ...ordre, carte: { index: 9 } }, deck, 'joueurs')).toEqual([]);
    });
});
