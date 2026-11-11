import { describe, it, expect, beforeEach } from 'vitest';
import { garderLeJetCache, useJetsCachesStore, JETS_CACHES_GARDES } from './jetsCaches';
import { useDiceStore, type RollRecord } from '../../stores/useDiceStore';
import { segmentDesDes } from '../remote/segmentDesDes';
import { useJournalStore } from '../journal/useJournalStore';
import { consignerLeJet, estUnJetCache } from '../journal/consignerLeJet';
import { natureDe } from '../journal/curation';
import { viderLesEcrituresDifferees } from '../../utils/ecritureReserveeAuMJ';

/**
 * Ce que ces essais protègent : **un jet caché ne quitte pas la fenêtre du
 * meneur** — plan `2026-11-11-jets-demandes-et-caches.md`, T5 (C7, C8).
 *
 * Trois chemins mènent un jet à la table : `lastRoll` dans le segment des dés,
 * le `localStorage` de `gmos-dice-storage` que lisent le Hub et le projecteur,
 * et le récit que résume l'IA. Chacun est vérifié ici, et non supposé.
 */

const jet = (titre: string, degre?: RollRecord['degre']): RollRecord => ({
    id: crypto.randomUUID(),
    timestamp: new Date(),
    title: titre,
    formula: '1d100',
    rolls: [{ val: 42, sides: 100 }],
    modifier: 0,
    total: 42,
    totalDisplay: '42',
    tagSuccess: true,
    degre,
} as RollRecord);

const evenements = () => {
    const j = useJournalStore.getState();
    return j.journals.find(x => x.id === j.activeJournalId)?.events ?? [];
};

describe('le jet caché', () => {
    beforeEach(() => {
        localStorage.clear();
        useDiceStore.setState({ lastRoll: null, history: [] });
        useJetsCachesStore.getState().vider();
        useJournalStore.setState({ journals: [], activeJournalId: null, isRecording: false });
        useJournalStore.getState().startJournal({ nom: 'Campagne de test' }, 'Séance de test');
    });

    it('n’atteint ni lastRoll, ni l’historique, ni le segment envoyé aux tablettes (C7)', () => {
        const visible = jet('Perception de Wilson');
        useDiceStore.getState().setLastRoll(visible);
        const segmentAvant = segmentDesDes(useDiceStore.getState());

        garderLeJetCache(jet('La patrouille passe-t-elle ?'));

        expect(useDiceStore.getState().lastRoll?.id).toBe(visible.id);
        expect(useDiceStore.getState().history.map(r => r.title)).toEqual(['Perception de Wilson']);
        expect(segmentDesDes(useDiceStore.getState())).toEqual(segmentAvant);
    });

    it('n’entre pas dans le localStorage que partagent le Hub et le projecteur (C7)', () => {
        useDiceStore.getState().setLastRoll(jet('Perception de Wilson'));
        garderLeJetCache(jet('La patrouille passe-t-elle ?'));
        /* Les écritures attendent 250 ms : l'essai exige le disque à jour. */
        viderLesEcrituresDifferees();

        const des = localStorage.getItem('gmos-dice-storage') ?? '';
        expect(des, 'le stockage des dés s’écrit bien ici').toContain('Perception de Wilson');
        expect(des).not.toContain('patrouille');
        /* Seul le journal le garde, et c'est voulu (« Ce que David garde »). */
        const horsJournal = Object.keys(localStorage)
            .filter(k => k !== 'journal-os-storage-v2')
            .map(k => localStorage.getItem(k) ?? '').join('\n');
        expect(horsJournal).not.toContain('patrouille');
    });

    it('reste au pupitre du meneur, du plus récent au plus ancien, et borné', () => {
        for (let i = 0; i < JETS_CACHES_GARDES + 3; i++) garderLeJetCache(jet(`Jet ${i}`));
        const { jets } = useJetsCachesStore.getState();
        expect(jets).toHaveLength(JETS_CACHES_GARDES);
        expect(jets[0].titre).toBe(`Jet ${JETS_CACHES_GARDES + 2}`);
    });

    it('s’inscrit au journal, marqué caché (C8)', () => {
        garderLeJetCache(jet('La patrouille passe-t-elle ?'), 50);
        const [e] = evenements().filter(x => x.type === 'DICE');
        expect(e.title).toBe('Jet caché : La patrouille passe-t-elle ?');
        expect(e.content).toContain('cible 50');
        expect(estUnJetCache(e)).toBe(true);
    });

    it('reste une trace même remarquable : il ne monte pas au récit que résume l’IA (C8)', () => {
        garderLeJetCache(jet('Le coffre est-il piégé ?', 'reussite-particuliere'));
        consignerLeJet({ titre: 'Tir de Wilson', totalDisplay: '01', degre: 'reussite-particuliere', tagSuccess: true });

        const des = evenements().filter(x => x.type === 'DICE');
        const cache = des.find(estUnJetCache)!;
        const visible = des.find(x => !estUnJetCache(x))!;
        expect(natureDe(cache)).toBe('trace');
        expect(natureDe(visible), 'un jet visible remarquable reste chronique').toBe('chronique');
    });

    it('un jet visible n’est jamais pris pour un jet caché', () => {
        useDiceStore.getState().setLastRoll(jet('Perception de Wilson'));
        const [e] = evenements().filter(x => x.type === 'DICE');
        expect(e.title).toBe('Jet : Perception de Wilson');
        expect(estUnJetCache(e)).toBe(false);
    });
});
