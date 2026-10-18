import type { DemandeTMR, EcritureTMR } from '../../../../outils/reve-de-dragon/tmr/moteur.mjs';
import { etatDuVoyageur, proposerFatigue, suiviFatigueActif, suivrePerteDEndurance } from './fatigueDuVoyageur';
import { etatsDeSanteVoyageur } from './santeDuVoyageur';
import { CLE_RECUS_TMR, recusDesTMR, type RecuTMR } from './recusDesTMR';

type Fiche = { templateId?: string; sheetData?: Record<string, unknown> };
const entier = (v: unknown, nom: string) => {
    if (v === '' || typeof v === 'boolean' || v === null || v === undefined || !Number.isSafeInteger(Number(v)) || Number(v) < 0) throw new Error(`${nom} doit être un entier positif ou nul.`);
    return Number(v);
};
export interface CoutTMR { empreinte: string; reveAvant: number; reveApres: number; fatigueAvant: number; fatigueApres: number; sortieForcee: boolean; detail: string; maj: Record<string, unknown> }
/** Règles communes GM-OS, pas un moteur privé de ressources dans le module externe.
 * Livre 2.3.1 p. 182, fatigue p. 88–90, sommeil à zéro rêve p. 208. */
export function proposerCoutTMR(fiche: Fiche, demande: DemandeTMR): CoutTMR {
    const d = fiche.sheetData ?? {};
    if (d.__rddReprise231 !== 1 || !suiviFatigueActif(d)) throw new Error('Reprendre la fiche R0 et activer le suivi de fatigue R1 avant le raccord TMR.');
    const reveAvant = entier(d.reve_pts, 'Les points de rêve'), etat = etatDuVoyageur(d), sante = etatsDeSanteVoyageur(d);
    // Autorité GM-OS : ne jamais accepter un montant fourni par le module externe.
    // Le barème de son affichage est éprouvé séparément contre ce calcul commun.
    const cout = { reve: demande.action === 'monter' ? (demande.rythme === 'accelere' ? 2 : 1) : 0,
        fatigue: demande.action === 'descendre' ? 0 : 1 };
    if (demande.action !== 'descendre' && (reveAvant === 0 || etat.assomme || etat.endurance === 0 || Number(d.vie) <= 0 || sante?.horsCombat)) throw new Error('Le personnage ne peut pas se concentrer dans son état actuel.');
    if (reveAvant < cout.reve) throw new Error('Points de rêve insuffisants pour cette montée.');
    if (recusDesTMR(d).length >= 10000) throw new Error('La fiche contient déjà 10 000 reçus TMR ; le raccord est suspendu sans effacer ses preuves.');
    const reveApres = reveAvant - cout.reve;
    const fatigueApres = cout.fatigue ? Number(proposerFatigue(d, 'tmr', cout.fatigue).maj.fatigue) : etat.fatigue;
    const sortieForcee = reveApres === 0 || fatigueApres >= etat.maximum;
    const empreinte = JSON.stringify({ templateId: fiche.templateId, reve: reveAvant, fatigue: etat.fatigue, endurance: etat.endurance,
        enduranceMax: etat.enduranceMax, vie: d.vie, vieMax: d.vie_max, reveil: d.__rddFatigueReveil ?? null,
        fatigueDifferee: d.fatigue_differee ?? 0, sante: sante ?? null, reprise: d.__rddReprise231, suivi: d.__rddFatigue231 });
    const detail = `Rêve ${reveAvant} → ${reveApres} ; fatigue ${etat.fatigue} → ${fatigueApres}.${reveApres === 0 ? ' Zéro rêve : endormi, sortie des TMR.' : fatigueApres >= etat.maximum ? ' Fatigue pleine : sortie des TMR.' : ''}`;
    const maj = suivrePerteDEndurance(d, { ...d, reve_pts: reveApres, fatigue: fatigueApres });
    return { empreinte, reveAvant, reveApres, fatigueAvant: etat.fatigue, fatigueApres, sortieForcee, detail, maj };
}
export function recuPourEcritureTMR(d: Record<string, unknown>, e: EcritureTMR, campagneId: string, personnageId: string): RecuTMR | undefined {
    const r = recusDesTMR(d).find(r => r.id === e.id);
    if (r && (r.campagneId !== campagneId || r.personnageId !== personnageId || r.demandeId !== e.demande.operationId || r.empreinte !== e.empreinte)) throw new Error('Ce reçu appartient à une autre opération TMR. Aucun nouveau débit.');
    return r;
}
export function appliquerCoutTMR(fiche: Fiche, e: EcritureTMR, campagneId: string, personnageId: string) {
    const d = fiche.sheetData ?? {}, deja = recuPourEcritureTMR(d, e, campagneId, personnageId);
    if (deja) return { donnees: d, recu: deja, nouvelle: false };
    if (e.interrompue) throw new Error('Trajet interrompu avant débit : il doit être annulé, sans nouvelle dépense.');
    const p = proposerCoutTMR(fiche, e.demande);
    if (p.empreinte !== e.empreinte) throw new Error('La fiche a changé depuis l’aperçu. Aucun débit : annule puis prépare une nouvelle demande.');
    const recu: RecuTMR = { id: e.id, demandeId: e.demande.operationId, campagneId, personnageId, empreinte: e.empreinte, sortieForcee: p.sortieForcee, detail: p.detail };
    return { donnees: { ...p.maj, [CLE_RECUS_TMR]: [...recusDesTMR(d), recu] }, recu, nouvelle: true };
}
