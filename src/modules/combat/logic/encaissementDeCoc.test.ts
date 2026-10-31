import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encaissementSelonLeJeu, type RegleDEncaissement } from './encaissementDeCoc';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { GameDriver } from '../../../types/drivers';

/** L'échelle de santé de COC à la porte des dégâts, contre les exemples du livre de règles (p. 72-73, 89). */

const REGLE: RegleDEncaissement = { mecanique: 'coc', sante: 'echelle_de_sante', rd: 'protection_rd', constitution: 'constitution' };
// Le gangster d'Amelia : vêtements épais, RD 2.
const GANGSTER = { constitution: 1, protection_rd: 2, echelle_de_sante: 0 };

describe('l’encaissement', () => {
    it('le revolver d’Amelia, 15 DM : la RD 2 des vêtements épais en retire deux, 13 échelons (p. 89)', () => {
        const r = encaissementSelonLeJeu(REGLE, GANGSTER, { value: 15 });
        expect(r?.impact.value).toBe(13);
        expect(r?.texte).toBe('13 DM (15 − RD 2) : échelle de santé 0 → 13 ; Contusionné — −1 en Init., en DEF et aux actions physiques ; '
            + 'Affaibli — −3 ; test de CON difficulté 10 pour ne pas perdre sa prochaine action.');
    });

    it('7 DM puis 4 : contusionné, puis affaibli au 11e échelon (p. 72)', () => {
        const sans = { ...GANGSTER, protection_rd: 0 };
        expect(encaissementSelonLeJeu(REGLE, sans, { value: 7 })?.texte).toMatch(/0 → 7 ; Contusionné/);
        expect(encaissementSelonLeJeu(REGLE, { ...sans, echelle_de_sante: 7 }, { value: 4 })?.texte).toMatch(/7 → 11 ; Affaibli/);
    });

    it('la chute, le feu et le poison ne passent pas par la protection', () => {
        expect(encaissementSelonLeJeu(REGLE, GANGSTER, { value: 5, type: 'sans protection (chute, feu, poison)' })?.impact.value).toBe(5);
    });

    it('plus de 20 + CON en une fois : tué sur le coup, toutes les cases noircies (p. 73)', () => {
        const r = encaissementSelonLeJeu(REGLE, { ...GANGSTER, protection_rd: 0 }, { value: 22 });
        expect(r?.impact.value).toBe(20);
        expect(r?.texte).toMatch(/tué sur le coup/);
    });

    it('un coup sur un mourant appelle le coup de grâce ; le soin passe tel quel', () => {
        expect(encaissementSelonLeJeu(REGLE, { ...GANGSTER, echelle_de_sante: 20 }, { value: 4 })?.texte).toMatch(/coup de grâce/);
        expect(encaissementSelonLeJeu(REGLE, GANGSTER, { value: 3, isRecovery: true })).toBeNull();
        expect(encaissementSelonLeJeu(undefined, GANGSTER, { value: 3 })).toBeNull();
    });
});

describe('à la porte des dégâts', () => {
    const session = useSessionOSStore.getState();
    const COC = {
        id: 'coc', name: 'COC', templateId: 'tpl',
        combat: {
            defaultHealthType: 'boxes', initiativeFormula: '10 + intelligence + perception', statsToTrack: [], encaissement: REGLE,
            casesDeSante: { libelle: 'Échelle de santé', nombre: 20, champ: 'echelle_de_sante', seuils: [
                { aPartirDe: 5, label: 'Contusionné', etat: 'scratched' }, { aPartirDe: 10, label: 'Affaibli', etat: 'wounded' },
                { aPartirDe: 15, label: 'Blessé', etat: 'wounded' }, { aPartirDe: 20, label: 'Mourant', etat: 'critical' },
            ] },
        },
    } as unknown as GameDriver;

    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        useSessionOSStore.setState({
            activeCampaignId: 'c', customGameDrivers: [COC],
            campaigns: [{ id: 'c', name: 'Big Apple', system: 'coc', activeLocationIds: [] }],
            players: [{ id: 'p', realName: 'Sébastien', avatarUrl: '', isOnline: false, characters: [{
                id: 'amelia', name: 'Amelia Steele', campaignId: 'c', templateId: 'tpl', systemId: 'coc',
                hp: 0, maxHp: 0, sheetData: { constitution: 1, protection_rd: 2, echelle_de_sante: 0 },
            }] }],
        } as never);
    });
    afterEach(() => {
        vi.restoreAllMocks();
        useSessionOSStore.setState(session, true);
    });

    it('Amelia, gilet rembourré RD 2, prend 9 DM : 7 échelons noircis, contusionnée, et la fiche le porte', () => {
        useSessionOSStore.getState().handleApplyImpact('amelia', 'pc', { value: 9 });
        const amelia = useSessionOSStore.getState().players[0].characters[0];
        expect(amelia.sheetData?.echelle_de_sante).toBe(7);
        expect(amelia.healthSystem?.type).toBe('boxes');
        expect(amelia.healthSystem?.state).toBe('scratched');
    });

    it('la fiche HTML dit 12 échelons, la santé en points de vie du pilote forgé n’en savait rien : 3 DM de plus mènent à 15', () => {
        useSessionOSStore.setState(s => ({ players: s.players.map(p => ({ ...p, characters: p.characters.map(c => ({ ...c,
            healthSystem: { type: 'hp', data: { current: 10, max: 10 }, state: 'healthy', badges: [] },
            sheetData: { ...c.sheetData, echelle_de_sante: 12, protection_rd: 0 } })) })) }) as never);
        useSessionOSStore.getState().handleApplyImpact('amelia', 'pc', { value: 3 });
        const amelia = useSessionOSStore.getState().players[0].characters[0];
        expect(amelia.sheetData?.echelle_de_sante).toBe(15);
        expect(amelia.healthSystem?.type).toBe('boxes');
    });
});
