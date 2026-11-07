import { useCombatStore } from './useCombatStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { valeursDuCombattant, ecrireLaFicheDuCombattant } from './ficheDesCombattants';
import { cosmsDesIds, idsDesCosmsCourants, loiEnVigueur } from '../session/logic/cosmsCourants';
import { HealthInterpreter } from '../session/logic/HealthInterpreter';
import { useJournalStore } from '../journal/useJournalStore';
import type { Combatant } from './types';
import type { HealthSystem } from '../../types/entity.types';

export function loisActivesDeTorg() {
    const s = useSessionOSStore.getState();
    return cosmsDesIds(s.getActiveDriver()?.cosms, idsDesCosmsCourants(s.campaigns.find(c => c.id === s.activeCampaignId), s.scenes));
}

function ecrireSante(c: Combatant, healthSystem: HealthSystem) {
    const s = useSessionOSStore.getState();
    const joueur = s.players.find(p => p.characters.some(ch => ch.id === c.sourcePlayerId));
    if (c.isPlayer && c.sourcePlayerId && joueur) s.updateCharacterHealth(joueur.id, c.sourcePlayerId, healthSystem);
    else if (c.sourceEntityId) s.updateEntityHealth(c.sourceEntityId, healthSystem);
    useCombatStore.getState().updateCombatant(c.id, { healthSystem });
}

/** Le reçu du coup fait foi : égaler le maximum de Choc ne suffit pas à proposer Ténacité. */
export function peutRecevoirTenaciteTorg(c: Combatant): boolean {
    const health = c.healthSystem;
    const cases = health?.type === 'boxes' && Array.isArray(health.data.boxes) ? health.data.boxes as { filled?: boolean }[] : [];
    return !!c.suiteTorg?.ko && !c.suiteTorg.tenaciteTraitee && !c.horde
        && (c.isPlayer || cases.length >= 4) && cases.length > 0 && !cases.every(b => b.filled);
}

export function appliquerTenaciteTorg(id: string): boolean {
    const p = useCombatStore.getState(), s = useSessionOSStore.getState(), pilote = s.getActiveDriver();
    const c = p.combatants.find(c => c.id === id), regle = pilote?.combat?.dommages;
    if (!c || !peutRecevoirTenaciteTorg(c) || !c.suiteTorg || !loiEnVigueur(loisActivesDeTorg(), 'tenacite') || regle?.mecanique !== 'torg') return false;
    const health = c.healthSystem;
    const cases = health?.type === 'boxes' && Array.isArray(health.data.boxes) ? health.data.boxes as { filled?: boolean }[] : [];
    if (!health || c.horde || (!c.isPlayer && cases.length < 4) || !cases.length || cases.every(b => b.filled)) return false;
    const apres = HealthInterpreter.calculateNextState(health, { value: 1 });
    const blessures = (apres.data.boxes as { filled?: boolean }[]).filter(b => b.filled).length;
    const dernierTour = blessures >= cases.length;
    if (dernierTour) apres.state = 'critical';
    // Le reçu est consommé avant les écritures de fiche ; deux clics ne paient jamais deux Blessures.
    p.updateCombatant(id, { suiteTorg: { ...c.suiteTorg, tenaciteTraitee: true, dernierTour } });
    ecrireLaFicheDuCombattant(c, { [regle.choc]: 0, ...(pilote?.jet?.torg?.blessures ? { [pilote.jet.torg.blessures]: blessures } : {}),
        ...(pilote?.torg?.etats?.ko ? { [pilote.torg.etats.ko]: false } : {}) });
    ecrireSante(c, apres);
    useJournalStore.getState().addEvent({ type: 'COMBAT', title: `${c.name} — Loi de la Ténacité`, content: `Une Blessure subie ; tout le Choc effacé.${dernierTour ? ' Dernière Blessure : un tour complet accordé avant le test de Défaite.' : ''}` });
    return true;
}

/** Une action, une récupération : plusieurs cibles portant le même reçu ne cumulent pas les points. */
export function appliquerSouffranceTorg(cibleId: string, attaquantId: string): boolean {
    const p = useCombatStore.getState(), s = useSessionOSStore.getState(), champ = s.getActiveDriver()?.combat?.dommages?.choc;
    const cible = p.combatants.find(c => c.id === cibleId), attaquant = p.combatants.find(c => c.id === attaquantId);
    const recu = cible?.suiteTorg;
    if (!cible || !attaquant || !recu || recu.blessures < 1 || recu.souffranceTraitee || !champ || !loiEnVigueur(loisActivesDeTorg(), 'souffrance')) return false;
    if (attaquant.actionsSouffranceTorg?.includes(recu.id)) return false;
    p.updateCombatant(cible.id, { suiteTorg: { ...recu, souffranceTraitee: true } });
    p.updateCombatant(attaquant.id, { actionsSouffranceTorg: [...(attaquant.actionsSouffranceTorg ?? []).slice(-63), recu.id] });
    const avant = Math.max(0, Number(valeursDuCombattant(attaquant)[champ]) || 0), apres = Math.max(0, avant - 1);
    ecrireLaFicheDuCombattant(attaquant, { [champ]: apres });
    useJournalStore.getState().addEvent({ type: 'COMBAT', title: `${attaquant.name} — Loi de la Souffrance`, content: `Action ayant blessé ${cible.name} : Choc ${avant} → ${apres} (une récupération pour cette action).` });
    return true;
}

export function finirTourTenaciteTorg(id: string) {
    const p = useCombatStore.getState(), c = p.combatants.find(c => c.id === id);
    if (!c?.suiteTorg?.dernierTour) return;
    p.updateCombatant(id, { suiteTorg: { ...c.suiteTorg, dernierTour: false } });
    if (c.healthSystem) ecrireSante(c, { ...c.healthSystem, state: 'dead' });
    useJournalStore.getState().addEvent({ type: 'COMBAT', title: `${c.name} — tour de Ténacité terminé`, content: 'Le tour complet est terminé : résoudre maintenant le test de Défaite.' });
}
