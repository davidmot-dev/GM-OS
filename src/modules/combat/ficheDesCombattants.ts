import { useSessionOSStore } from '../session/useSessionOSStore';
import { useCombatStore } from './useCombatStore';
import type { Combatant } from './types';
import { ficheDuCombattant } from './logic/ficheDuCombattant';
import { maximumDeLaJauge, valeurDuChamp } from './logic/SanteDuCombattant';
import { ajouterLeChoc } from './logic/dommagesDeTorg';
import { campDe, type Camp } from './logic/OrdreDuTour';

/**
 * **Lire et écrire la fiche d'un combattant, par le chemin de son porteur** —
 * PJ, PNJ de la Galerie, ou combattant autonome.
 *
 * Écrit d'abord dans `CombatCard` pour les jauges, puis demandé par les gestes
 * de camp du Paquet d'Action de Torg (Inspiration, Fatigués, 2026-10-13) :
 * deux écrivains d'une même fiche finissent toujours par diverger, d'où cette
 * seule porte.
 */

/** Une valeur de fiche — un suivi structuré (Blade Runner, Cthulhu Hack) compris. */
type Valeur = unknown;

/** La fiche de campagne du combattant, quand il en a une. */
function source(c: Combatant): { sheetData?: Record<string, unknown> } | undefined {
    const s = useSessionOSStore.getState();
    return c.isPlayer
        ? s.players.flatMap(p => p.characters).find(ch => ch.id === c.sourcePlayerId)
        : s.entities.find(e => e.id === c.sourceEntityId);
}

/** Les valeurs de la fiche, d'où qu'elles viennent — même lecture que la carte. */
export function valeursDuCombattant(c: Combatant): Record<string, unknown> {
    return ficheDuCombattant(c, source(c), [], null).valeurs;
}

export function ecrireLaFicheDuCombattant(c: Combatant, maj: Record<string, Valeur>): void {
    const s = useSessionOSStore.getState();
    if (c.isPlayer && c.sourcePlayerId) {
        const joueur = s.players.find(p => p.characters.some(ch => ch.id === c.sourcePlayerId));
        if (joueur) for (const [champ, v] of Object.entries(maj)) s.updateCharacterSheetData(joueur.id, c.sourcePlayerId, champ, v as string);
        return;
    }
    if (c.sourceEntityId) {
        for (const [champ, v] of Object.entries(maj)) s.updateEntitySheetData(c.sourceEntityId, champ, v as string);
        return;
    }
    // Le combattant autonome : sa fiche vit sur le plateau.
    useCombatStore.getState().updateCombatant(c.id, { sheetData: { ...(c.sheetData ?? {}), ...maj } });
}

/**
 * **Ajouter (ou retirer) du Choc à tout un camp** — Inspiration (−2) et
 * Fatigués (+2) du Paquet d'Action. Le champ est celui que les dommages du
 * pilote déclarent ; le Choc ajouté plafonne au maximum de la jauge, et le
 * dépasser se dit (KO). Rend une phrase par combattant touché.
 */
export function ajusterLeChocDuCamp(camp: Camp, delta: number): string[] {
    const pilote = useSessionOSStore.getState().getActiveDriver();
    const champ = pilote?.combat?.dommages?.choc;
    if (!champ) return ['Le pilote ne déclare pas de champ de Choc (`combat.dommages.choc`).'];
    const dits: string[] = [];
    for (const c of useCombatStore.getState().combatants.filter(x => campDe(x) === camp)) {
        const valeurs = valeursDuCombattant(c);
        const actuel = valeurDuChamp(valeurs, champ) ?? 0;
        if (delta < 0) {
            const apres = Math.max(0, actuel + delta);
            if (apres !== actuel) {
                ecrireLaFicheDuCombattant(c, { [champ]: apres });
                dits.push(`${c.name} : Choc ${actuel} → ${apres}`);
            }
            continue;
        }
        const max = maximumDeLaJauge(champ, pilote?.combat?.statsToTrack, valeurs);
        const choc = ajouterLeChoc(actuel, delta, max);
        if (choc.valeur !== actuel) ecrireLaFicheDuCombattant(c, { [champ]: choc.valeur });
        dits.push(`${c.name} : Choc ${actuel} → ${choc.valeur}${choc.ko ? ' — KO' : ''}`);
    }
    return dits;
}
