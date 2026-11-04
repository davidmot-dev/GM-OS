import { useSessionOSStore } from '../session/useSessionOSStore';
import { useCombatStore } from './useCombatStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';
import { ficheDuCombattant } from './logic/ficheDuCombattant';
import { avecOrigine } from '../session/logic/origineDesModifications';
import type { Combatant } from './types';
import type { PisteDuCoup } from '../dice/systemes/combatDeDegenesis';

/** La fiche d'un combattant : celle de la campagne (PJ, PNJ de la Galerie), sinon la sienne. */
export function valeursDuCombattant(c: Combatant): Record<string, unknown> {
    const s = useSessionOSStore.getState();
    const source = c.isPlayer ? s.players.flatMap(p => p.characters).find(x => x.id === c.sourcePlayerId) : s.entities.find(e => e.id === c.sourceEntityId);
    const { valeurs } = ficheDuCombattant(c, source, [...DEFAULT_SHEET_TEMPLATES, ...s.customSheetTemplates], s.getActiveDriver()?.templateId);
    return (valeurs ?? {}) as Record<string, unknown>;
}

/** Écrire sur cette fiche — l'Égo payé à l'initiative (DEG-A1). Le journal dit « (jet) ». */
export function ecrireSurLeCombattant(c: Combatant, maj: Record<string, unknown>): void {
    const s = useSessionOSStore.getState();
    if (c.isPlayer && c.sourcePlayerId) {
        const joueur = s.players.find(p => p.characters.some(x => x.id === c.sourcePlayerId));
        const perso = joueur?.characters.find(x => x.id === c.sourcePlayerId);
        if (joueur && perso) avecOrigine('jet', () => s.updateCharacter(joueur.id, perso.id, { sheetData: { ...perso.sheetData, ...maj } }));
        return;
    }
    const entite = c.sourceEntityId ? s.entities.find(e => e.id === c.sourceEntityId) : undefined;
    if (entite) { avecOrigine('jet', () => s.updateEntity(entite.id, { sheetData: { ...(entite.sheetData ?? {}), ...maj } })); return; }
    useCombatStore.getState().updateCombatant(c.id, { sheetData: { ...(c.sheetData ?? {}), ...maj } });
}

/**
 * **Porter un coup de Degenesis** — DEG-A2, 03/11/2026. Les dégâts arrivent **nets** : l'arme,
 * les déclencheurs, les Potentiels et une seule armure sont déjà comptés au panneau de jet.
 * La piste dit le type de l'impact que lit la porte des pistes (`pistesDeDegenesis.ts`) :
 * « mental » va à l'Égo, « mortel » droit aux Traumatismes, le reste aux Blessures
 * superficielles. Un PJ ou un PNJ de la Galerie passe par `handleApplyImpact`, le chemin de
 * tous les dégâts ; un adversaire autonome, sans fiche de campagne, suit le plateau (DEG-A6).
 */
export const TYPE_DE_LA_PISTE: Record<PisteDuCoup, string> = { blessures: 'physique', traumatismes: 'mortel', ego: 'mental' };

export function porterUnCoupDegenesis(c: Combatant, nets: number, piste: PisteDuCoup): void {
    const value = Math.max(0, Math.trunc(nets));
    if (value === 0) return;
    useCombatStore.getState().consignerLOuvertureDuCombat();
    const impact = { value, type: TYPE_DE_LA_PISTE[piste] };
    const session = useSessionOSStore.getState();
    if (c.isPlayer && c.sourcePlayerId) return session.handleApplyImpact(c.sourcePlayerId, 'pc', impact);
    if (c.sourceEntityId) return session.handleApplyImpact(c.sourceEntityId, 'npc', impact);
    useCombatStore.getState().applyDamage(value, impact.type, [c.id]);
}
