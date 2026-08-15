import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * Les valeurs d'une fiche qui vient d'être créée.
 *
 * **Le défaut que ça corrige, relevé le 2026-08-15.** `AddCharacterForm`
 * écrivait `sheetData: {}` — **une fiche vide**, même quand le gabarit déclare
 * seize champs. Un personnage d'Alien naissait donc sans Force, sans Agilité et
 * sans les douze compétences que la Forge avait pourtant dérivées du livre.
 *
 * Les conséquences se voyaient partout ailleurs, sans qu'on remonte jamais à
 * la cause : `combat.santeDeDepart: 'force'` ne trouvait rien à lire, la tâche
 * de défaite non plus, `jet.seuil` ne pouvait composer aucun seuil, et
 * `CombatCard` affichait des jauges à zéro — *qui ressemblent à un personnage
 * en pleine forme*.
 *
 * **On n'invente rien : on prend ce que le gabarit déclare.** Chaque champ a
 * déjà sa `defaultValue`, décidée à la forge d'après les fiches du corpus. Un
 * champ sans valeur par défaut reçoit le zéro de son type — jamais une valeur
 * choisie ici, qui serait une règle inventée par l'outil.
 */

/** Le zéro d'un type de champ : ce qui vaut « pas encore rempli ». */
function valeurVide(type: string): unknown {
    switch (type) {
        case 'number':
        case 'gauge':
        case 'rating':
            return 0;
        case 'checkbox':
            return false;
        default:
            // `text`, `textarea`, `select`, `formula` — et tout type inconnu,
            // qu'on ne cherche pas à deviner.
            return '';
    }
}

/**
 * Toutes les valeurs d'un gabarit, prêtes à être posées sur un personnage neuf.
 *
 * Rend un objet vide sans gabarit — il n'y a alors rien à déclarer, et
 * fabriquer des champs au hasard serait pire que l'absence.
 */
export function ficheNeuve(gabarit: Pick<SheetTemplate, 'sections'> | undefined): Record<string, unknown> {
    if (!gabarit) return {};

    const valeurs: Record<string, unknown> = {};
    for (const section of gabarit.sections ?? []) {
        for (const champ of section.fields ?? []) {
            if (!champ?.id) continue;
            valeurs[champ.id] = champ.defaultValue ?? valeurVide(champ.type);
        }
    }
    return valeurs;
}
