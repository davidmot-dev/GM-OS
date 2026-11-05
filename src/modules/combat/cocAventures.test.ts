import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useCombatStore } from './useCombatStore';
import { acheterAvantageCoc, lireAvantagesCoc } from '../dice/systemes/avantagesDeCoc';
import { CLE_PSYCHISME_COC, confirmerChocCoc, lirePsychismeCoc } from '../dice/systemes/psychismeDeCoc';
import { porterImpactCoc } from './coc';
import type { GameDriver } from '../../types/drivers';
const s = () => useSessionOSStore.getState(), b = () => useCombatStore.getState(), f = () => s().players[0].characters[0].sheetData!;
const initial = s(), combat = b();
const p = { id: 'coc', name: 'COC', templateId: 't', jet: { coc: { heroisme: true, psychisme: true, sante: 'sante', evolution: { champ: 'evo', modele: 'modele' }, suivi: { defense: 'defense', constitution: 'constitution', initiative: 'initiative' } } },
    combat: { defaultHealthType: 'boxes', casesDeSante: { nombre: 20, champ: 'sante' }, encaissement: { mecanique: 'coc', sante: 'sante', rd: 'rd', suivi: true, heroisme: true }, statsToTrack: [] } } as unknown as GameDriver;
beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    Object.assign(window, { useSessionOSStore, useCombatStore });
    useSessionOSStore.setState({ activeCampaignId: 'c', customGameDrivers: [p], campaigns: [{ id: 'c', name: 'Recette', system: 'coc' }],
        players: [{ id: 'j', realName: 'Fictif', characters: [{ id: 'pj', name: 'Amelia', campaignId: 'c', systemId: 'coc', templateId: 't', hp: 0, maxHp: 0,
            sheetData: { evo: 13, modele: 'Héros', sante: 0, rd: 2, defense: 14, constitution: 2, intelligence: 0, perception: 2 } }] }], entities: [] } as never);
    useCombatStore.setState({ combatants: [{ id: 'lie', name: 'Amelia', init: 12, isPlayer: true, faction: 'player', statuses: [], sourcePlayerId: 'pj' },
        { id: 'autre', name: 'Autre', init: 10, isPlayer: false, faction: 'enemy', statuses: [], sheetData: { sante: 0 } }], currentTurnIdx: 0, round: 1 });
});
afterEach(() => { vi.restoreAllMocks(); useSessionOSStore.setState(initial, true); useCombatStore.setState(combat, true); });
function acheter(dest: Parameters<typeof acheterAvantageCoc>[3]) {
    const r = acheterAvantageCoc(f(), 'evo', 'modele', dest, 1, `achat-${dest}`); if ('refus' in r) throw new Error(r.refus);
    s().updateCharacter('j', 'pj', { sheetData: { ...f(), ...r.maj } });
}
describe('COC-A4/A5 aux portes de la fiche et du combat', () => {
    it('un bonus d’Init remonte au plateau, une seule fois, et disparaît au prochain Jet système', () => {
        acheter('initiative'); expect(b().combatants[0].init).toBe(17);
        s().updateCharacter('j', 'pj', { sheetData: { ...f() } }); expect(b().combatants[0].init).toBe(17);
        b().rollAutoInitiative({ formula: '10 + intelligence + perception', sortOrder: 'desc', resolver: (id, c) => c.sourcePlayerId === 'pj' ? Number(f()[id]) || 0 : 0 });
        expect(lireAvantagesCoc(f()).actifs).toHaveLength(0);
        expect(b().combatants.find(c => c.sourcePlayerId === 'pj')?.init).toBe(12);
    });
    it('Légende reste pendant le tour d’autrui et expire au début du prochain tour du héros', () => {
        s().updateCharacter('j', 'pj', { sheetData: { ...f(), evo: 20 } }); acheter('legende');
        expect(f().evo).toBe(19); expect(b().combatants[0].init).toBe(22);
        b().nextTurn(); expect(lireAvantagesCoc(f()).actifs).toHaveLength(1);
        b().nextTurn(); expect(lireAvantagesCoc(f()).actifs).toHaveLength(0);
        expect(b().combatants[0].init).toBe(12);
    });
    it('réduction d’une source à la porte native, sans seconde consommation ni effacement HTML', () => {
        acheter('dm-subis'); porterImpactCoc({ type: 'pc', id: 'pj' }, { value: 15, coc: { id: 'coup' } });
        expect(f().sante).toBe(8); expect(lireAvantagesCoc(f()).actifs).toHaveLength(0);
        porterImpactCoc({ type: 'pc', id: 'pj' }, { value: 15, coc: { id: 'coup' } }); expect(f().sante).toBe(8);
        s().updateCharacter('j', 'pj', { sheetData: { sante: 8, agilite: 3 } });
        expect(lireAvantagesCoc(f()).recus).toContain('achat-dm-subis');
    });
    it('le choc compte les rounds du plateau ; la sauvegarde/recharge ne compte pas de temps', () => {
        const r = confirmerChocCoc(f(), 'Événement', 2, 'echec', 'Brisé', 4, 'evt', 0); if ('refus' in r) throw new Error(r.refus);
        s().updateCharacter('j', 'pj', { sheetData: { ...f(), [CLE_PSYCHISME_COC]: r.apres } });
        b().nextTurn(); expect(lirePsychismeCoc(f()).choc?.reste).toBe(4);
        b().nextTurn(); expect(lirePsychismeCoc(f()).choc?.reste).toBe(3);
        useSessionOSStore.setState({ players: JSON.parse(JSON.stringify(s().players)) });
        expect(lirePsychismeCoc(f()).choc?.reste).toBe(3); expect(f().evo).toBe(13);
    });
});
