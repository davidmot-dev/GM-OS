import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useCombatStore } from './useCombatStore';
import { porterImpactCoc, confirmerSanteCoc, preparerPnjCoc } from './coc';
import { CLE_SUIVI_COC, lireSuiviCoc } from '../dice/systemes/suiviDeCoc';
import { CLE_PROFIL_COC, type ProfilPnjCoc } from '../dice/systemes/profilsDeCoc';
import type { GameDriver } from '../../types/drivers';

const pilote = { id: 'coc', name: 'COC', templateId: 't', jet: { coc: { sante: 'sante', pnj: true, suivi: { defense: 'defense', constitution: 'constitution', initiative: 'initiative' } } },
    combat: { defaultHealthType: 'boxes', initiativeFormula: '10 + intelligence + perception', casesDeSante: { champ: 'sante', nombre: 20, seuils: [{ aPartirDe: 10, label: 'Affaibli', etat: 'wounded' }] },
        encaissement: { mecanique: 'coc', sante: 'sante', rd: 'rd', constitution: 'constitution', suivi: true }, statsToTrack: [] } } as unknown as GameDriver;
const initial = useSessionOSStore.getState(), combatInitial = useCombatStore.getState();
const s = () => useSessionOSStore.getState(), b = () => useCombatStore.getState();
const pj = () => s().players[0].characters[0];
const f = () => pj().sheetData!;
beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    (window as unknown as { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore }).useSessionOSStore = useSessionOSStore;
    (window as unknown as { useCombatStore: typeof useCombatStore }).useCombatStore = useCombatStore;
    useSessionOSStore.setState({ activeCampaignId: 'c', campaigns: [{ id: 'c', name: 'Recette', system: 'coc' }], customGameDrivers: [pilote], entities: [],
        players: [{ id: 'j', realName: 'Test', characters: [{ id: 'pj', name: 'Amelia', campaignId: 'c', templateId: 't', systemId: 'coc', hp: 0, maxHp: 0,
            sheetData: { sante: 0, rd: 2, defense: 14, constitution: 2 } }] }] } as never);
    useCombatStore.setState({ combatants: [{ id: 'lie', name: 'Amelia', init: 12, isPlayer: true, faction: 'player', statuses: [], sourcePlayerId: 'pj' },
        { id: 'pnj', name: 'Voyous', init: 10, isPlayer: false, faction: 'enemy', statuses: [], sheetData: { sante: 0, rd: 2 } }], currentTurnIdx: 0, round: 1 });
});
afterEach(() => { vi.restoreAllMocks(); useSessionOSStore.setState(initial, true); useCombatStore.setState(combatInitial, true); });
describe('les portes COC entre fiche, plateau et persistance', () => {
    it('15DM vers un PJ lié : 13 après RD ; un seul coup même après rechargement et vers une autre cible', () => {
        const impact = { value: 15, coc: { id: 'coup', critique: true, touche: true } };
        porterImpactCoc({ type: 'combatant', id: 'lie' }, impact);
        expect(f().sante).toBe(13); expect(f().defense).toBe(14);
        expect(lireSuiviCoc(f()).demandes[0].difficulte).toBe(10);
        const sauvegarde = JSON.parse(JSON.stringify(s().campaigns));
        useSessionOSStore.setState({ campaigns: sauvegarde });
        expect(porterImpactCoc({ type: 'combatant', id: 'pnj' }, impact)).toContain('déjà');
        expect(b().combatants[1].sheetData?.sante).toBe(0);
        const suivi = lireSuiviCoc(f());
        confirmerSanteCoc({ type: 'pc', id: 'pj' }, { id: 'con', type: 'resoudre', demande: suivi.demandes[0].id, reussite: false });
        expect(lireSuiviCoc(f()).actionsPerdues).toBe(1);
        confirmerSanteCoc({ type: 'pc', id: 'pj' }, { id: 'con', type: 'resoudre', demande: suivi.demandes[0].id, reussite: false });
        expect(lireSuiviCoc(f()).actionsPerdues).toBe(1);
        s().updateCharacter('j', 'pj', { sheetData: { sante: 13, defense: 14 } });
        expect(f()[CLE_SUIVI_COC]).toBeTruthy(); // Une ancienne fiche HTML n’efface pas les reçus.
    });
    it('la saisie du plateau utilise la même RD ; le soin ne rejoue pas une conséquence', () => {
        b().applyDamage(12, 'coup', ['pnj']);
        expect(b().combatants[1].sheetData?.sante).toBe(10);
        b().applyDamage(-4, 'soin', ['pnj']);
        expect(b().combatants[1].sheetData?.sante).toBe(6);
        expect(lireSuiviCoc(b().combatants[1].sheetData!).demandes).toHaveLength(1);
    });
    it('bande de 3 : projection3 cases et une seule retirée par touche, même avec100DM ; profil interdit au PJ', () => {
        const profil: ProfilPnjCoc = { role: 'figurant', pulp: false, caracteristiques: ['force'], capacites: [], bande: 3 };
        expect(preparerPnjCoc({ type: 'pc', id: 'pj' }, profil)).toContain('PNJ');
        preparerPnjCoc({ type: 'combatant', id: 'pnj' }, profil);
        expect(b().combatants[1].healthSystem?.data.boxes).toHaveLength(3);
        porterImpactCoc({ type: 'combatant', id: 'pnj' }, { value: 100, coc: { id: 'bande', touche: true } });
        expect(b().combatants[1].sheetData?.sante).toBe(1);
        expect(b().combatants[1].sheetData?.[CLE_PROFIL_COC]).toMatchObject({ bande: 3 });
    });
    it('le passage de tour avance l’inconscience, le rechargement ne la rejoue pas', () => {
        porterImpactCoc({ type: 'pc', id: 'pj' }, { value: 22, coc: { id: 'mourant' } });
        const demande = lireSuiviCoc(f()).demandes.find(d => d.genre === 'mourant')!;
        confirmerSanteCoc({ type: 'pc', id: 'pj' }, { id: 'd6', type: 'resoudre', demande: demande.id, duree: 2 });
        b().nextTurn(); expect(lireSuiviCoc(f()).inconscience?.reste).toBe(2);
        b().nextTurn(); expect(lireSuiviCoc(f()).inconscience?.reste).toBe(1);
        useSessionOSStore.setState({ players: JSON.parse(JSON.stringify(s().players)) });
        expect(lireSuiviCoc(f()).inconscience?.reste).toBe(1);
    });
    it('PNJ de Galerie : la bande perd un membre et le compteur ne revient pas à zéro lors de la projection suivante', () => {
        useSessionOSStore.setState({ entities: [{ id: 'galerie', name: 'Bande', type: 'npc', campaignId: 'c', systemId: 'coc', hp: 0, maxHp: 0, sheetData: { sante: 0, rd: 2 } }] } as never);
        preparerPnjCoc({ type: 'npc', id: 'galerie' }, { role: 'figurant', pulp: false, caracteristiques: ['force'], capacites: [], bande: 3 });
        porterImpactCoc({ type: 'npc', id: 'galerie' }, { value: 0, coc: { id: 'galerie-touche', touche: true } });
        expect(s().entities[0].sheetData?.sante).toBe(1);
        expect((s().entities[0].healthSystem!.data.boxes as { filled: boolean }[]).filter(b => b.filled)).toHaveLength(1);
        s().updateEntity('galerie', { name: 'Bande après la touche' });
        expect(s().entities[0].sheetData?.sante).toBe(1);
    });
});
