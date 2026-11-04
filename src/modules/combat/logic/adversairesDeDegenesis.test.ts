import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { coupSurLAdversaire, estUnAdversaireAutonome, pistesDeLAdversaire, preparerLAdversaire } from './adversairesDeDegenesis';
import { pistesDeSanteSelonLeJeu } from './pistesDeDegenesis';
import { useCombatStore } from '../useCombatStore';
import type { RegleDesMaximaDeDegenesis } from '../../dice/systemes/maximaDeDegenesis';
import type { Combatant } from '../types';

/** **L'adversaire sans fiche à deux pistes** — DEG-A6 (2026-11-04), p. 94, 107. */
const PISTES = { mecanique: 'degenesis' as const, blessures: 'blessures_superficielles', traumatismes: 'traumatismes', ego: 'ego_jauge' };
const STATS = [
    { fieldId: 'sante', isMainHP: true, max: '(physique + resistance) * 2 + physique + psyche' },
    { fieldId: 'blessures_superficielles', max: '(physique + resistance) * 2' },
    { fieldId: 'traumatismes', max: 'physique + psyche' },
    { fieldId: 'ego_jauge', max: 'ego_max' },
];
const MAXIMA: RegleDesMaximaDeDegenesis = {
    ego: { champ: 'ego_max', jauge: 'ego_jauge', branches: [] },
    blessures: { jauge: 'blessures_superficielles', champs: ['physique', 'resistance'] },
    traumatismes: { jauge: 'traumatismes', champs: ['physique', 'psyche'] },
};

describe('DEG-A6 — l’adversaire sans fiche (p. 94, 107)', () => {
    it('préparé avec PHY 3, Résistance 2, PSY 2, Égo 4 : Blessures 0/10, Traumatismes 0/5, santé 15', () => {
        const r = preparerLAdversaire(MAXIMA, PISTES, STATS, { agilite: 3 }, { physique: 3, resistance: 2, psyche: 2 }, 4)!;
        expect(r).toMatchObject({ hp: 15, hpMax: 15 });
        expect(r.sheetData).toMatchObject({ agilite: 3, physique: 3, ego_max: 4, ego_jauge: 4, blessures_superficielles: 0, traumatismes: 0 });
        expect(pistesDeLAdversaire(PISTES, STATS, r.sheetData)).toEqual({ blessures: 0, maxBlessures: 10, traumatismes: 0, maxTraumatismes: 5, ego: 4, maxEgo: 4 });
    });

    it('la même attaque contre un PNJ lié et un adversaire autonome : Blessures et Traumatismes identiques', () => {
        const fiche = { physique: 3, resistance: 2, psyche: 2, blessures_superficielles: 6, traumatismes: 0 };
        const lie = pistesDeSanteSelonLeJeu(PISTES, fiche, { value: 7, type: 'physique' }, STATS)!;
        const autonome = coupSurLAdversaire(PISTES, STATS, fiche, 7, 'physique');
        expect(autonome).not.toBe('a-preparer');
        if (autonome === 'a-preparer') return;
        expect(autonome.fiche).toEqual(lie.fiche);
        expect(autonome.fiche).toEqual({ blessures_superficielles: 10, traumatismes: 3 });
        expect(autonome.montant).toBe(7);
    });

    it('non préparé, on ne calcule rien : le coup reste en PV', () => {
        expect(coupSurLAdversaire(PISTES, STATS, { agilite: 3 }, 5, 'physique')).toBe('a-preparer');
        expect(estUnAdversaireAutonome({ sourceEntityId: 'pnj' })).toBe(false);
        expect(estUnAdversaireAutonome({})).toBe(true);
    });

    it('une attaque mentale va à l’Égo, la santé ne bouge pas', () => {
        const r = coupSurLAdversaire(PISTES, STATS, { physique: 3, resistance: 2, psyche: 2, ego_max: 4, ego_jauge: 4 }, 3, 'mental');
        expect(r).toMatchObject({ montant: 0, fiche: { ego_jauge: 1 } });
    });
});

describe('DEG-A6 — le coup porté au plateau', () => {
    const fenetre = window as unknown as { useSessionOSStore?: unknown };
    const avant = fenetre.useSessionOSStore;
    const combat = useCombatStore.getState();
    beforeEach(() => {
        fenetre.useSessionOSStore = { getState: () => ({ getActiveDriver: () => ({ combat: { pistesDeSante: PISTES, statsToTrack: STATS } }) }) };
        useCombatStore.setState({
            combatants: [
                { id: 'usudi', name: 'Usudi', init: 0, isPlayer: false, faction: 'enemy', statuses: [], hp: 15, hpMax: 15,
                    sheetData: { physique: 3, resistance: 2, psyche: 2, blessures_superficielles: 0, traumatismes: 0, ego_max: 4, ego_jauge: 4 } },
                { id: 'moniteur', name: 'Moniteur', init: 0, isPlayer: false, faction: 'enemy', statuses: [], hp: 12, hpMax: 12 },
            ] as Combatant[],
            consignerLOuvertureDuCombat: () => {}, syncCombatantToSession: () => {}, broadcastSync: () => {},
        });
    });
    afterEach(() => { fenetre.useSessionOSStore = avant; useCombatStore.setState(combat, true); });

    it('12 dégâts sur l’Usudi préparé : 10 Blessures, 2 Traumatismes, santé 3 ; le Moniteur perd ses PV d’un bloc', () => {
        useCombatStore.getState().applyDamage(12, 'physique', ['usudi', 'moniteur']);
        const [usudi, moniteur] = useCombatStore.getState().combatants;
        expect(usudi.sheetData).toMatchObject({ blessures_superficielles: 10, traumatismes: 2 });
        expect(usudi.hp).toBe(3);
        expect(moniteur.hp).toBe(0);
        // Mortel : droit aux Traumatismes (p. 155).
        useCombatStore.getState().applyDamage(2, 'mortel', ['usudi']);
        expect(useCombatStore.getState().combatants[0].sheetData).toMatchObject({ blessures_superficielles: 10, traumatismes: 4 });
        expect(useCombatStore.getState().combatants[0].hp).toBe(1);
    });
});
