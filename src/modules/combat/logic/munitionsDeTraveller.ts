import { useJournalStore } from '../../journal/useJournalStore';
import { ecrireLesMunitions, lireLesMunitions, type ModeDeTir } from '../../dice/systemes/depensesDeTraveller';
import type { ArmeDeTraveller } from './attaqueDeTraveller';

/**
 * **Les munitions d'une arme de Traveller, côté fiche** — TRV-A6, 27/11/2026 (spécification
 * `2026-11-27-traveller-depenses-et-durees.md`, C1, C2, C9 ; David : « Écrire « 26/30 » »). Partagé
 * par la ligne des munitions de la carte Dégâts et par la carte des ressources de Combat-OS.
 */
export const MODES_DE_TIR: Record<ModeDeTir, string> = { simple: 'tir simple', rafale: 'rafale', auto: 'auto complet' };

export const noterAuJournal = (titre: string, texte: string) => useJournalStore.getState().addEvent({ type: 'COMBAT', title: titre, content: texte });

/** Le champ de la fiche qui porte les munitions de l'arme ; `null` pour une attaque d'animal. */
export const champDesMunitions = (arme: ArmeDeTraveller) => (arme.index > 0 ? `arme_${arme.index}_munitions` : null);

/** **Recharger** (une action mineure, p. 74) : la capacité du chargeur, écrite « 30/30 ». */
export function recharger(arme: ArmeDeTraveller, nom: string, ecrire: (maj: Record<string, unknown>) => void): string | null {
    const champ = champDesMunitions(arme);
    const m = lireLesMunitions(arme.munitions, arme.chargeur);
    if (!champ || !m) return null;
    const plein = ecrireLesMunitions({ restants: m.capacite, capacite: m.capacite });
    ecrire({ [champ]: plein });
    const texte = `${arme.libelle} rechargé : ${ecrireLesMunitions(m)} → ${plein} (une action mineure, p. 74).`;
    noterAuJournal(`${nom} — munitions`, texte);
    return texte;
}
