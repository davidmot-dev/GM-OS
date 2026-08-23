/**
 * **Y a-t-il une séance en cours, et laquelle ?**
 *
 * La question se posait déjà dans au moins sept écrans le 2026-08-23 —
 * `CampaignCockpit`, `CampaignWidget`, `CharacterGrid`, `DoubleJournal`,
 * `NpcGallery`, `PlayerPrivateNotes`, `SessionWorkspace` — **et pas toujours
 * avec la même règle** :
 *
 * - les uns cherchent la séance que la campagne **désigne**
 *   (`campaign.activeSessionId`) ;
 * - les autres cherchent n'importe quelle séance **active de cette campagne**
 *   (`session.campaignId === activeCampaignId`).
 *
 * Les deux coïncident tant que rien ne cloche, et divergent dès qu'une séance
 * reste `active` sans être celle que la campagne désigne. *Deux lectures d'une
 * même vérité qui ne se comparent jamais* — le motif que ce dépôt paie chaque
 * jour.
 *
 * Ce fichier ne répare pas les sept, ce serait un autre chantier. Il existe pour
 * qu'on **cesse d'en ajouter**, et il tranche : **la campagne fait autorité.**
 * Une séance orpheline qui serait restée `active` n'ouvre pas la table ; c'est
 * la campagne qui dit laquelle de ses séances est en cours.
 */

/** Ce qu'il faut savoir d'une campagne pour répondre. */
export interface CampagneQuiDesigne {
    id: string;
    activeSessionId?: string;
}

/** Ce qu'il faut savoir d'une séance pour répondre. */
export interface SeanceQuiSeDeclare {
    id: string;
    status?: string;
}

/**
 * La séance ouverte de la campagne active, ou `null`.
 *
 * @param campagnes toutes les campagnes connues
 * @param seances toutes les séances connues
 * @param campagneActive l'identifiant de la campagne ouverte, s'il y en a une
 */
export function seanceOuverteDe<S extends SeanceQuiSeDeclare>(
    campagnes: readonly CampagneQuiDesigne[],
    seances: readonly S[],
    campagneActive: string | null | undefined,
): S | null {
    if (!campagneActive) return null;

    const campagne = campagnes.find(c => c.id === campagneActive);
    if (!campagne?.activeSessionId) return null;

    return (
        seances.find(s => s.id === campagne.activeSessionId && s.status === 'active') ?? null
    );
}

/** La même question, quand seule la réponse par oui ou non compte. */
export function uneSeanceEstOuverte(
    campagnes: readonly CampagneQuiDesigne[],
    seances: readonly SeanceQuiSeDeclare[],
    campagneActive: string | null | undefined,
): boolean {
    return seanceOuverteDe(campagnes, seances, campagneActive) !== null;
}
