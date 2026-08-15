import { tousLesPilotes } from '../store/tousLesPilotes';
import type { GameDriver } from '../../../types/drivers';

/** Ce qu'il faut savoir d'un personnage pour retrouver son jeu. */
export interface PersonnageDeJeu {
    systemId?: string;
    templateId?: string;
    /** `null` est une valeur réelle du modèle : un personnage sans campagne. */
    campaignId?: string | null;
}

/** Ce qu'il faut savoir d'une campagne pour la même chose. */
export interface CampagneDeJeu {
    id: string;
    system?: string;
}

/**
 * Le pilote d'un personnage — **le sien, pas celui de la campagne ouverte**.
 *
 * **Le défaut d'origine, relevé par David le 2026-08-15, capture à l'appui :**
 * sur une fiche de Dune, « Lancer un test » tirait cinq d6 en comptant les six
 * — du Year Zero Engine — parce que sa campagne active était « TEST Alien ».
 * Le jet n'était pas approximatif : il appartenait à un autre jeu.
 *
 * La campagne ne peut pas faire autorité. Une fiche s'ouvre depuis n'importe
 * où, et rien n'oblige la campagne ouverte à être celle du personnage. Sur la
 * tablette d'un joueur, la question ne se pose même pas dans les mêmes termes.
 *
 * **Trois sources, dans l'ordre de ce qui est le plus sûr :**
 *
 * 1. `systemId` — le jeu que le personnage déclare. Écrit depuis le 2026-08-15
 *    par l'écran de création.
 * 2. **Le pilote dont c'est le gabarit** : les personnages antérieurs n'ont pas
 *    de `systemId`, mais leur `templateId` désigne une fiche, et un pilote la
 *    réclame. C'est ce qui rattrape tous les personnages d'avant.
 * 3. La campagne, en dernier recours seulement.
 *
 * **Pourquoi cette fonction existe.** La règle vivait dans
 * `CharacterSheetEditor`, et la fiche de la tablette en a besoin mot pour mot.
 * La recopier aurait garanti la divergence : deux résolutions du même pilote
 * qui finissent par ne plus donner le même pilote sont indétectables par
 * construction — c'est exactement le défaut corrigé le même jour dans
 * `SessionDashboard`, où le pilote de référence l'emportait sur le
 * personnalisé.
 */
export function piloteDuPersonnage(
    personnage: PersonnageDeJeu | null | undefined,
    campagnes: readonly CampagneDeJeu[],
    pilotesPersonnalises: readonly GameDriver[] = [],
    /** Campagne à considérer si le personnage n'en désigne aucune — celle ouverte. */
    campagneCourante?: string | null,
): GameDriver | null {
    const pilotes = tousLesPilotes(pilotesPersonnalises);
    if (!personnage) return null;

    if (personnage.systemId) {
        const declare = pilotes.find(d => d.id === personnage.systemId);
        if (declare) return declare;
    }

    if (personnage.templateId) {
        const parGabarit = pilotes.find(d => d.templateId === personnage.templateId);
        if (parGabarit) return parGabarit;
    }

    /*
      La campagne du personnage passe avant celle qui est ouverte : sur la
      tablette, plusieurs joueurs regardent leur fiche pendant que le MJ tient
      une campagne à l'écran, et c'est la leur qui compte.
    */
    const idDeCampagne = personnage.campaignId ?? campagneCourante ?? undefined;
    const campagne = campagnes.find(c => c.id === idDeCampagne);
    return pilotes.find(d => d.id === campagne?.system) ?? null;
}
