import type { SheetField, SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **Où lire la fiche d'un combattant, et avec quel gabarit la lire.**
 *
 * *Question de David, le 2026-09-03 : « comment faire pour revoir la fiche de
 * ces nouveaux combattants ? »* — et la réponse a mis un défaut au jour.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX LECTEURS D'UNE MÊME VÉRITÉ, ET UN SEUL AVAIT LE REPLI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `CombatCard` lit la fiche à deux endroits :
 *
 * - la voie des jauges (`ui_config`) lisait `sourceCharacter?.sheetData ||
 *   combatant.sheetData` — avec son repli ;
 * - la voie historique (`statsToTrack`) lisait **seulement**
 *   `sourceCharacter?.sheetData`.
 *
 * Tant que tout combattant venait d'une fiche de campagne, la différence ne se
 * voyait pas. **Les adversaires de la Fabrique n'en viennent pas** : leurs
 * caractéristiques vivent sur le combattant lui-même. Sur un jeu sans
 * `ui_config`, la seconde voie affichait donc **des zéros** pour un adversaire
 * parfaitement rempli — *un zéro se lit comme une valeur, jamais comme une
 * absence de lecteur.*
 *
 * Et le gabarit avait le même défaut : résolu depuis `sourceCharacter.templateId`
 * uniquement, il manquait pour ces mêmes adversaires — donc plus de type de
 * champ, plus de plafond, plus de libellé.
 *
 * *C'est le motif que ce projet paie le plus souvent : plusieurs écrivains — ou
 * ici plusieurs lecteurs — pour une même donnée.* D'où cette fonction, seule
 * porte vers la fiche d'un combattant.
 */

/** Ce qu'il faut savoir d'un combattant pour retrouver sa fiche. */
export interface CombattantLisible {
    sheetData?: Record<string, unknown>;
}

/** Ce que la campagne sait du personnage d'origine, s'il y en a un. */
export interface SourceLisible {
    sheetData?: Record<string, unknown>;
    templateId?: string;
}

export interface FicheDuCombattant {
    /** Les valeurs à afficher — jamais `undefined`, au pire un objet vide. */
    valeurs: Record<string, unknown>;
    /** Le gabarit qui donne les libellés, les types et les plafonds. */
    gabarit: SheetTemplate | null;
    /** D'où viennent les valeurs, pour que l'écran puisse le dire. */
    origine: 'campagne' | 'combattant' | 'aucune';
}

/**
 * La fiche d'un combattant, et le gabarit pour la lire.
 *
 * **La campagne fait foi quand elle a quelque chose à dire.** Un PJ ou un PNJ
 * enregistré évolue entre deux combats : sa fiche de campagne est plus fraîche
 * que la copie posée sur le plateau. Un adversaire fabriqué, lui, n'existe que
 * sur le plateau — c'est là qu'il faut le lire.
 *
 * **Le gabarit du pilote sert de repli** : un adversaire sans personnage
 * d'origine n'a pas de `templateId`, mais le jeu courant, lui, en a un.
 */
export function ficheDuCombattant(
    combattant: CombattantLisible,
    source: SourceLisible | null | undefined,
    gabarits: SheetTemplate[],
    gabaritDuJeuId: string | null | undefined,
): FicheDuCombattant {
    const deLaCampagne = source?.sheetData;
    const aQuelqueChose = (fiche: Record<string, unknown> | undefined): fiche is Record<string, unknown> =>
        !!fiche && Object.keys(fiche).length > 0;

    const valeurs = aQuelqueChose(deLaCampagne)
        ? deLaCampagne
        : (combattant.sheetData ?? {});

    const origine: FicheDuCombattant['origine'] = aQuelqueChose(deLaCampagne)
        ? 'campagne'
        : aQuelqueChose(combattant.sheetData) ? 'combattant' : 'aucune';

    const gabarit = gabarits.find(g => g.id === source?.templateId)
        ?? gabarits.find(g => g.id === gabaritDuJeuId)
        ?? null;

    return { valeurs, gabarit, origine };
}

/**
 * Les champs d'un gabarit qui méritent d'être montrés sur une fiche de combat.
 *
 * On écarte les zones de texte et les formules : les premières sont des notes
 * que le meneur écrit ailleurs, les secondes se recalculent et n'ont pas de
 * valeur propre à relire. *Une fiche de combat se lit d'un coup d'œil ; tout ce
 * qui demande à être lu en entier n'y a pas sa place.*
 */
export function champsAMontrer(gabarit: SheetTemplate | null): { section: string; champs: SheetField[] }[] {
    if (!gabarit) return [];
    return gabarit.sections
        .map(section => ({
            section: section.label,
            champs: section.fields.filter(c => c.type !== 'textarea' && c.type !== 'formula'),
        }))
        .filter(bloc => bloc.champs.length > 0);
}
