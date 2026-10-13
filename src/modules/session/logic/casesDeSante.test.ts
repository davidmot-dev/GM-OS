import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HealthInterpreter, etatDesCases, seuilAtteint } from './HealthInterpreter';
import { abregerLaSante, decrireLaSante } from '../../combat/logic/SanteDuCombattant';
import { useSessionOSStore } from '../useSessionOSStore';
import type { CasesDeSante } from '../../../types/drivers';

/**
 * **Les cases de santé réglées par le jeu** — NOC, 2026-10-13.
 *
 * `docs/systems/noc/rules/sante-et-blessures.md` : la jauge Blessures va de zéro
 * à dix ; à cinq, Choqué ; à huit, lourdement blessé ; à dix, l'agonie. GM-OS
 * dessinait cinq cases (Léger, Grave, Critique) pour tous les jeux.
 */
const NOC: CasesDeSante = {
    libelle: 'Blessures',
    nombre: 10,
    seuils: [
        { aPartirDe: 5, label: 'Choqué', etat: 'wounded' },
        { aPartirDe: 8, label: 'Lourdement blessé', etat: 'critical' },
        { aPartirDe: 10, label: 'Agonie', etat: 'dead' },
    ],
    champ: 'blessures',
};

const coup = (valeur: number, isRecovery = false) => ({ value: valeur, type: 'physique', isRecovery });
const cochees = (h: { data: Record<string, unknown> }) =>
    (h.data.boxes as { filled: boolean }[]).filter(b => b.filled).length;

describe('les cases que le jeu déclare', () => {
    it('dix cases, chacune au nom du dernier seuil qu’elle atteint', () => {
        const sante = HealthInterpreter.createDefault('boxes', { cases: NOC });
        const noms = (sante.data.boxes as { label: string }[]).map(b => b.label);
        expect(noms).toEqual(['', '', '', '', 'Choqué', 'Choqué', 'Choqué', 'Lourdement blessé', 'Lourdement blessé', 'Agonie']);
        expect(sante.data.libelle).toBe('Blessures');
        expect(sante.data.champ).toBe('blessures');
    });

    it('sans déclaration, les cinq cases d’avant', () => {
        expect((HealthInterpreter.createDefault('boxes').data.boxes as unknown[]).length).toBe(5);
    });

    it('l’état suit le dernier seuil coché', () => {
        let sante = HealthInterpreter.createDefault('boxes', { cases: NOC });
        sante = HealthInterpreter.calculateNextState(sante, coup(3));
        expect([cochees(sante), sante.state, seuilAtteint(sante)]).toEqual([3, 'scratched', null]);
        sante = HealthInterpreter.calculateNextState(sante, coup(3));
        expect([cochees(sante), sante.state, seuilAtteint(sante)]).toEqual([6, 'wounded', 'Choqué']);
        sante = HealthInterpreter.calculateNextState(sante, coup(2));
        expect([sante.state, seuilAtteint(sante)]).toEqual(['critical', 'Lourdement blessé']);
        sante = HealthInterpreter.calculateNextState(sante, coup(5));
        expect([cochees(sante), sante.state, seuilAtteint(sante)]).toEqual([10, 'dead', 'Agonie']);
        // Un moment de calme retire un point.
        sante = HealthInterpreter.calculateNextState(sante, coup(1, true));
        expect([cochees(sante), sante.state]).toEqual([9, 'critical']);
    });

    it('l’état se calcule sur des seuils dans le désordre', () => {
        expect(etatDesCases([...NOC.seuils!].reverse(), 8)).toBe('critical');
        expect(etatDesCases(NOC.seuils!, 0)).toBe('healthy');
    });

    it('les résumés disent le seuil, pas seulement un compte', () => {
        const sante = HealthInterpreter.calculateNextState(HealthInterpreter.createDefault('boxes', { cases: NOC }), coup(6));
        expect(abregerLaSante({ healthSystem: sante })).toBe('Choqué · 6/10');
        expect(decrireLaSante({ healthSystem: sante })).toBe('6/10 cases cochées (Choqué)');
    });
});

describe('la jauge de la fiche suit les cases', () => {
    const initial = useSessionOSStore.getState();
    beforeEach(() => {
        useSessionOSStore.setState({
            players: [{ id: 'p1', realName: 'Léa', avatarUrl: '', isOnline: false, characters: [
                { id: 'pj', name: 'Ilya', campaignId: null, templateId: 'tpl', sheetData: { blessures: 0, trauma: 2 },
                    healthSystem: HealthInterpreter.createDefault('boxes', { cases: NOC }) },
            ] }],
        } as never);
    });
    afterEach(() => { useSessionOSStore.setState(initial, true); });

    it('un coup coche les cases ET la jauge Blessures de la fiche', () => {
        useSessionOSStore.getState().handleApplyImpact('pj', 'pc', coup(4));
        const pj = useSessionOSStore.getState().players[0].characters[0];
        expect(cochees(pj.healthSystem!)).toBe(4);
        expect(pj.sheetData).toEqual({ blessures: 4, trauma: 2 });
    });
});
