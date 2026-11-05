import { useSessionOSStore } from '../session/useSessionOSStore';
import { useCombatStore } from './useCombatStore';
import { casesAligneesSurLaFiche, HealthInterpreter } from '../session/logic/HealthInterpreter';
import { encaissementSelonLeJeu } from './logic/encaissementDeCoc';
import { CLE_SUIVI_COC, lireSuiviCoc, operationSanteCoc, type OperationSanteCoc } from '../dice/systemes/suiviDeCoc';
import { ficheDuProfilCoc, refusProfilCoc, type ProfilPnjCoc } from '../dice/systemes/profilsDeCoc';
import { isMainWindow } from '../../utils/windowRole';
import { useJournalStore } from '../journal/useJournalStore';
import type { DamageImpact, HealthSystem } from '../../types/entity.types';
import type { GameDriver } from '../../types/drivers';
import type { RegleDeCoc } from '../dice/systemes/coc';
import { CLE_AVANTAGES_COC, avancerAvantagesCoc, bonusAvantageCoc } from '../dice/systemes/avantagesDeCoc';
import { CLE_PSYCHISME_COC, avancerPsychismeCoc } from '../dice/systemes/psychismeDeCoc';

export interface CibleCoc { type: 'pc' | 'npc' | 'combatant'; id: string }
/** Lecture et écriture sur la source de vérité ; les PNJ autonomes restent sur le plateau. */
export function lireCibleCoc(cible: CibleCoc): { nom: string; fiche: Record<string, unknown>; healthSystem?: HealthSystem; cible: CibleCoc; pilote: GameDriver; regle: RegleDeCoc; campaignId: string } | undefined {
    const s = useSessionOSStore.getState(), pilote = s.getActiveDriver(), regle = pilote?.jet?.coc;
    if (!regle?.suivi || !pilote || !s.activeCampaignId) return undefined;
    if (cible.type === 'combatant') {
        const c = useCombatStore.getState().combatants.find(c => c.id === cible.id); if (!c) return undefined;
        if (c.sourcePlayerId) return lireCibleCoc({ type: 'pc', id: c.sourcePlayerId });
        if (c.sourceEntityId) return lireCibleCoc({ type: 'npc', id: c.sourceEntityId });
        return { nom: c.name, fiche: c.sheetData ?? {}, healthSystem: c.healthSystem, cible, pilote, regle, campaignId: s.activeCampaignId };
    }
    const p = cible.type === 'pc' ? s.players.flatMap(p => p.characters).find(c => c.id === cible.id && c.campaignId === s.activeCampaignId) : undefined;
    const n = cible.type === 'npc' ? s.entities.find(e => e.id === cible.id && e.campaignId === s.activeCampaignId) : undefined;
    const acteur = p ?? n;
    return acteur ? { nom: acteur.name, fiche: acteur.sheetData ?? {}, healthSystem: acteur.healthSystem, cible, pilote, regle, campaignId: s.activeCampaignId } : undefined;
}
export function ecrireCibleCoc(cible: CibleCoc, maj: Record<string, unknown>) {
    const c = lireCibleCoc(cible); if (!c) return;
    const s = useSessionOSStore.getState(), sheetData = { ...c.fiche, ...maj };
    const sante = casesAligneesSurLaFiche(c.healthSystem, c.pilote.combat, sheetData);
    const healthSystem = sante && lireSuiviCoc(sheetData).mort ? { ...sante, state: 'dead' as const } : sante;
    if (c.cible.type === 'combatant') {
        const acteur = useCombatStore.getState().combatants.find(x => x.id === c.cible.id);
        useCombatStore.getState().updateCombatant(c.cible.id, { sheetData, healthSystem,
            ...(c.regle.heroisme && acteur ? { init: acteur.init + bonusAvantageCoc(sheetData, 'initiative') - bonusAvantageCoc(c.fiche, 'initiative') } : {}) });
    }
    else if (c.cible.type === 'npc') s.updateEntity(c.cible.id, { sheetData, healthSystem });
    else {
        const p = s.players.find(p => p.characters.some(x => x.id === c.cible.id));
        if (p) s.updateCharacter(p.id, c.cible.id, { sheetData, healthSystem });
    }
}
function consigner(nom: string, texte: string) { useJournalStore.getState().addEvent({ type: 'COMBAT', title: `${nom} — COC`, content: texte }); }
export function porterImpactCoc(cible: CibleCoc, impact: DamageImpact): string {
    const c = lireCibleCoc(cible); if (!isMainWindow() || !c) return 'Confirmation réservée au meneur COC.';
    const s = useSessionOSStore.getState(), campagne = s.campaigns.find(x => x.id === c.campaignId);
    const id = impact.coc?.id ?? crypto.randomUUID();
    if (campagne?.recusCoc?.includes(id)) return 'Coup déjà appliqué.';
    if (lireSuiviCoc(c.fiche).mort) return 'Mort confirmée : rectifier explicitement le suivi avant tout soin.';
    if (!Number.isFinite(impact.value) || impact.value < 0) return 'DM invalides.';
    s.updateCampaign(c.campaignId, { recusCoc: [...(campagne?.recusCoc ?? []), id] });
    const transmis = { ...impact, coc: { ...impact.coc, id } };
    if (c.cible.type !== 'combatant') {
        s.handleApplyImpact(c.cible.id, c.cible.type, transmis);
        return 'Coup confirmé ; RD et santé appliquées à la porte commune.';
    }
    const r = encaissementSelonLeJeu(c.pilote.combat.encaissement, c.fiche, transmis);
    const health = casesAligneesSurLaFiche(c.healthSystem, c.pilote.combat, c.fiche) ?? HealthInterpreter.createDefault('boxes');
    const healthSystem = HealthInterpreter.calculateNextState(health, r?.impact ?? transmis);
    const champ = c.regle.sante!, boxes = healthSystem.data.boxes as { filled: boolean }[];
    useCombatStore.getState().updateCombatant(c.cible.id, { healthSystem, sheetData: { ...c.fiche, ...r?.fiche, [champ]: boxes.filter(b => b.filled).length } });
    useCombatStore.getState().noterUnCoup(c.cible.id, r?.impact ?? transmis);
    consigner(c.nom, r?.texte ?? 'Soin confirmé.');
    return r?.texte ?? 'Soin confirmé.';
}
export function confirmerSanteCoc(cible: CibleCoc, op: OperationSanteCoc): string {
    const c = lireCibleCoc(cible); if (!isMainWindow() || !c) return 'Confirmation réservée au meneur COC.';
    const resultat = operationSanteCoc(c.fiche, Number(c.fiche[c.regle.sante!]) || 0, Number(c.fiche[c.regle.suivi!.constitution]) || 0, op);
    if (!resultat.appliquee) return resultat.texte;
    ecrireCibleCoc(cible, { [CLE_SUIVI_COC]: resultat.suivi });
    if (resultat.dm) porterImpactCoc(cible, { value: resultat.dm, type: 'sans protection', coc: { id: `con-${c.cible.type}-${c.cible.id}-${op.id}` } });
    consigner(c.nom, resultat.texte); return resultat.texte;
}
export function preparerPnjCoc(cible: CibleCoc, profil: ProfilPnjCoc): string {
    const c = lireCibleCoc(cible); if (!isMainWindow() || !c || c.cible.type === 'pc') return 'Un profil PNJ se déclare sur un adversaire, par le meneur.';
    const refus = refusProfilCoc(profil); if (refus) return refus;
    if (!c.regle.pnj) return 'Rôles non déclarés dans ce pilote.';
    ecrireCibleCoc(cible, ficheDuProfilCoc(profil, c.regle.suivi!.defense, c.regle.suivi!.initiative));
    const texte = 'Profil PNJ confirmé ; blessures conservées, capacités déclarées à appliquer selon leur contexte.';
    consigner(c.nom, texte); return texte;
}
/** Appelé par la vraie fin de tour ; un rechargement ne l’appelle jamais. */
export function finDeTourCoc() {
    const b = useCombatStore.getState(), sortant = b.combatants[b.currentTurnIdx];
    if (!sortant || !isMainWindow() || !useSessionOSStore.getState().getActiveDriver()?.jet?.coc?.suivi) return;
    const avancer = (id: string, unite: 'round' | 'tour') => {
        const cible: CibleCoc = { type: 'combatant', id }, c = lireCibleCoc(cible);
        const suivi = c && lireSuiviCoc(c.fiche);
        if (suivi && (suivi.inconscience?.unite === unite || unite === 'round' && suivi.coma === 'rounds')) confirmerSanteCoc(cible, { id: crypto.randomUUID(), type: 'avancer', unite });
    };
    avancer(sortant.id, 'tour');
    if (b.currentTurnIdx === b.combatants.length - 1) {
        const vus = new Set<string>();
        for (const c of b.combatants) {
            const cle = c.sourcePlayerId ?? c.sourceEntityId ?? c.id;
            if (!vus.has(cle)) avancer(c.id, 'round');
            if (!vus.has(cle)) avancerAventuresCoc({ type: 'combatant', id: c.id }, 'round');
            vus.add(cle);
        }
    }
    const prochain = b.combatants[(b.currentTurnIdx + 1) % b.combatants.length];
    if (prochain) avancerAventuresCoc({ type: 'combatant', id: prochain.id }, 'debut-tour');
}
export function avancerAventuresCoc(cible: CibleCoc, evenement: 'round' | 'debut-tour' | 'initiative') {
    const c = lireCibleCoc(cible); if (!c || !isMainWindow()) return;
    const id = crypto.randomUUID(), maj: Record<string, unknown> = {};
    if (c.regle.heroisme) maj[CLE_AVANTAGES_COC] = avancerAvantagesCoc(c.fiche, evenement, id);
    if (evenement === 'round' && c.regle.psychisme) maj[CLE_PSYCHISME_COC] = avancerPsychismeCoc(c.fiche, id);
    if (Object.keys(maj).length) ecrireCibleCoc(cible, maj);
}
export function nouvelleInitiativeCoc() {
    if (!useSessionOSStore.getState().getActiveDriver()?.jet?.coc?.heroisme) return;
    const vus = new Set<string>();
    for (const c of useCombatStore.getState().combatants) {
        const cle = c.sourcePlayerId ?? c.sourceEntityId ?? c.id;
        if (!vus.has(cle)) avancerAventuresCoc({ type: 'combatant', id: c.id }, 'initiative');
        vus.add(cle);
    }
}
