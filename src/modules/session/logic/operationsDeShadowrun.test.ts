import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { useSessionOSStore } from '../useSessionOSStore';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import { executerTableShadowrun, executerRiggingShadowrun } from './operationsDeShadowrun';
import { tableActions } from '../../remote/actions/tableActions';
import * as role from '../../../utils/windowRole';
import { PROFIL_RIGGER_VIDE } from '../../dice/systemes/riggingDeShadowrun';

const session = useSessionOSStore.getState(), stock = useRessourcesDeTableStore.getState();
const moniteur = { mecanique: 'shadowrun', suivi: true, legeres: 'l', graves: 'g', incapacitantes: 'i', sante: 'sante' };
beforeEach(() => {
    vi.spyOn(role, 'isMainWindow').mockReturnValue(true);
    useSessionOSStore.setState({ activeCampaignId: 'c', campaigns: [{ id: 'c', name: 'Fictive', system: 'sr' }],
        customGameDrivers: [{ id: 'sr', templateId: 'tpl', ressourcesDeTable: [{ id: 'plan', label: 'Planification', depart: 0, min: 0 }, { id: 'menace', label: 'Menace', depart: 0, min: 0 }],
            jet: { shadowrun: { anarchy: 'anarchy', suivi: moniteur, table: { planification: 'plan', menace: 'menace' }, rigging: { resistance: 'tableau-blessures' } } },
            combat: { defaultHealthType: 'boxes', moniteurDEtat: moniteur, casesDeSante: { nombre: 4, champ: 'sante' }, statsToTrack: [] } }],
        players: [{ id: 'j', characters: ['a', 'b'].map(id => ({ id, name: id, campaignId: 'c', systemId: 'sr', templateId: 'tpl', hp: 0, maxHp: 0,
            sheetData: { anarchy: 4, l: 0, g: 0, i: 0, sante: 0 } })) }],
    } as never);
    useRessourcesDeTableStore.setState({ reserves: { c: { plan: 4, menace: 0 } } });
});
afterEach(() => { vi.restoreAllMocks(); useSessionOSStore.setState(session, true); useRessourcesDeTableStore.setState(stock, true); });
const personnage = (id: string) => useSessionOSStore.getState().players[0].characters.find(c => c.id === id)!;
describe('les opérations SR-A4/A6 à la porte autoritaire', () => {
    it('débite la réserve native une fois et garde le reçu dans la campagne exportable', () => {
        const op = { id: 'f', type: 'flashback' as const, cout: 2, source: 'collective' as const, description: 'Badge' };
        executerTableShadowrun('c', 'a', op); executerTableShadowrun('c', 'a', op);
        expect(useRessourcesDeTableStore.getState().reserves.c.plan).toBe(2);
        expect(personnage('a').sheetData!.anarchy).toBe(4);
        const relue = JSON.parse(JSON.stringify(useSessionOSStore.getState().campaigns));
        useSessionOSStore.setState({ campaigns: relue });
        executerTableShadowrun('c', 'a', op);
        expect(useRessourcesDeTableStore.getState().reserves.c.plan).toBe(2);
    });
    it('paie le personnel et crédite une Menace pour le coût de 4, pas quatre', () => {
        executerTableShadowrun('c', 'a', { id: 'mode', type: 'mode', totale: true });
        executerTableShadowrun('c', 'a', { id: 'f', type: 'flashback', cout: 4, source: 'personnelle', description: 'Badge' });
        expect(personnage('a').sheetData!.anarchy).toBe(0);
        expect(useRessourcesDeTableStore.getState().reserves.c).toEqual({ plan: 4, menace: 1 });
    });
    it('refuse une confirmation dans une fenêtre joueuse ou pour un personnage absent de la campagne', () => {
        vi.mocked(role.isMainWindow).mockReturnValue(false);
        expect(executerTableShadowrun('c', 'a', { id: 'f', type: 'menace', delta: 1 })).toContain('réservée');
        expect(useRessourcesDeTableStore.getState().reserves.c).toEqual({ plan: 4, menace: 0 });
        vi.mocked(role.isMainWindow).mockReturnValue(true);
        expect(executerTableShadowrun('autre', 'a', { id: 'f', type: 'menace', delta: 1 })).toContain('réservée');
    });
    it('un renvoi tablette du même reçu ne recrédite pas la Menace ; une autre campagne est refusée', () => {
        executerTableShadowrun('c', 'a', { id: 'mode', type: 'mode', totale: true });
        const ctx = { activeCampaignId: 'c', sync: vi.fn() };
        tableActions['shadowrun:utilisation']({ id: 'test', characterId: 'a' }, ctx);
        tableActions['shadowrun:utilisation']({ id: 'test', characterId: 'a' }, ctx);
        tableActions['shadowrun:utilisation']({ id: 'test2', characterId: 'absent' }, ctx);
        expect(useRessourcesDeTableStore.getState().reserves.c.menace).toBe(1);
    });
    it('le véhicule et le rigger restent distincts ; l’impact confirmé par b touche le rigger a qui contrôle', () => {
        executerRiggingShadowrun('c', 'a', { id: 'v', type: 'ajouter', nom: 'Moustique' });
        executerRiggingShadowrun('c', 'a', { id: 'equip', type: 'profil', profil: { ...PROFIL_RIGGER_VIDE, ind: true, ccv: true } });
        executerRiggingShadowrun('c', 'a', { id: 'control', type: 'controle', vehiculeId: 'v', mode: 'plongee', connexion: 'hot' });
        const op = { id: 'degats', type: 'impact' as const, vehiculeId: 'v', vd: 11 };
        executerRiggingShadowrun('c', 'b', op); executerRiggingShadowrun('c', 'b', op);
        expect(personnage('a').sheetData!.l).toBe(1);
        expect(personnage('a').sheetData!.__shadowrun).toMatchObject({ blessures: [{ origine: 'biofeedback', nature: 'letal' }] });
        expect(personnage('b').sheetData!.l).toBe(0);
        expect(useSessionOSStore.getState().campaigns[0].suiviShadowrun!.vehicules[0].moniteur.graves).toBe(1);
    });
});
