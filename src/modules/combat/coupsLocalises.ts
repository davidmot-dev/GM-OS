import i18next from 'i18next';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { HealthInterpreter } from '../session/logic/HealthInterpreter';
import { useJournalStore } from '../journal/useJournalStore';
import { gmToast } from '../../stores/useToastStore';
import { useCombatStore } from './useCombatStore';
import type { Combatant } from './types';
import type { HealthSystem } from '../../types/entity.types';
import { coupLocaliseSelonLeJeu } from './logic/coupsDeRuneQuest';
import { champDeSantePrincipale, santeAffichee } from './logic/SanteDuCombattant';
import { raconterLImpact } from './logic/RecitDeLImpact';

/**
 * **Porter un coup localisé à un combattant** — RuneQuest, 2026-10-30. Une seule
 * porte pour la carte du combattant et pour le panneau de jet.
 *
 * Un PJ ou un PNJ de la Galerie passe par `handleApplyImpact`, qui applique la règle
 * (`coupLocaliseSelonLeJeu`), écrit la fiche, reflète le plateau et consigne : le
 * même chemin que tous les dégâts. Le combattant autonome — l'adversaire fabriqué
 * dans Combat-OS — n'a pas de fiche de campagne : la même règle s'applique ici, sur
 * le plateau.
 */
export function porterUnCoupLocalise(c: Combatant, zone: string, points: number, soin = false): void {
    if (!soin) useCombatStore.getState().consignerLOuvertureDuCombat();
    const impact = { value: Math.max(0, Math.trunc(points)), isRecovery: soin, location: zone };
    const session = useSessionOSStore.getState();
    if (c.isPlayer && c.sourcePlayerId) return session.handleApplyImpact(c.sourcePlayerId, 'pc', impact);
    if (c.sourceEntityId) return session.handleApplyImpact(c.sourceEntityId, 'npc', impact);

    const pilote = session.getActiveDriver();
    const regle = coupLocaliseSelonLeJeu(pilote?.combat?.coupsLocalises, c.sheetData, impact);
    if (!regle) return;
    const avant = (santeAffichee(c) ?? HealthInterpreter.createDefault('hp')) as HealthSystem;
    const healthSystem = HealthInterpreter.calculateNextState(avant, regle.impact);
    const hp = Number(healthSystem.data.current ?? c.hp);
    // La jauge de la carte lit la fiche : le total s'y écrit aussi.
    const principale = champDeSantePrincipale(pilote);
    useCombatStore.getState().updateCombatant(c.id, {
        hp, healthSystem,
        sheetData: { ...(c.sheetData ?? {}), ...regle.fiche, ...(principale ? { [principale]: hp } : {}) },
    });
    useCombatStore.getState().noterUnCoup(c.id, regle.impact);
    gmToast(`${c.name} — ${regle.texte}`, 'info');
    useJournalStore.getState().addEvent({
        type: 'COMBAT',
        title: i18next.t('modules:session.events.impact_title', { name: c.name }),
        content: `${regle.texte}\n${raconterLImpact(regle.impact, { hp, maxHp: c.hpMax, healthSystem })}`,
        sceneId: useCombatStore.getState().sceneId ?? undefined,
    });
}
