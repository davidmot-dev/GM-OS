import type { Scene, EnchainementDeScene } from '../../../types/trame.types';

/**
 * **« Cette scène mène à celle-là »** — demandé par David le 2026-09-22 :
 * *« pouvoir dire qu'une scène A mène vers une scène B ou une scène C ».*
 *
 * ⭐ **LA DÉCISION QUI TIENT TOUT LE RESTE : l'ordre ne se dessine que là où le
 * meneur n'a rien dit.**
 *
 * L'ordre des scènes dans un acte *était déjà* un enchaînement — c'est lui que le
 * graphe trace en trait appuyé. Ajouter des liens explicites crée donc un second
 * répondant à la même question, et *une scène qui suit la 2 par l'ordre mais qui
 * « mène à » la 5 ne dit plus rien de fiable à personne.* C'est le motif que ce
 * dépôt a payé le plus souvent : **plusieurs écrivains pour une même donnée.**
 *
 * La règle l'interdit sans rien interdire au meneur : dès qu'une scène porte un
 * enchaînement sortant, son trait d'ordre disparaît. Une trame à moitié câblée
 * reste lisible, et aucune des deux vérités ne peut démentir l'autre.
 *
 * Et chacune garde son rôle : **l'ordre dit comment le document est rangé**,
 * **l'enchaînement dit comment l'histoire peut couler** — avec ses
 * embranchements, et par-dessus les actes.
 */

/**
 * Un libellé tient sur une ligne.
 *
 * ⚠️ **Il est dessiné sur la toile, au milieu du trait.** Un paragraphe y
 * deviendrait une tache qui recouvre les nœuds voisins — *et on ne saurait plus
 * lire ni le lien ni ce qu'il relie.* Les notes longues ont déjà leur champ :
 * `notesDuMeneur`.
 */
export const LIBELLE_MAXIMUM = 80;

/**
 * Les enchaînements d'une scène, nettoyés.
 *
 * ⛔ **Une scène ne mène jamais à elle-même**, et deux fois au même endroit
 * compte pour une. Rattrapé ici plutôt qu'à l'écriture : *le magasin d'un meneur
 * porte déjà ce que d'anciennes versions y ont mis*, et une boucle sur soi
 * dessinerait un trait de longueur nulle que rien ne permettrait de cliquer pour
 * le retirer.
 */
export function enchainementsDeLaScene(
    scene: { id?: string; enchainements?: unknown } | null | undefined,
): EnchainementDeScene[] {
    const brut = scene?.enchainements;
    if (!Array.isArray(brut)) return [];

    const vus = new Set<string>();
    const gardes: EnchainementDeScene[] = [];
    for (const entree of brut) {
        const vers = (entree as EnchainementDeScene)?.vers;
        if (typeof vers !== 'string' || vers.length === 0) continue;
        if (scene?.id && vers === scene.id) continue;
        if (vus.has(vers)) continue;
        vus.add(vers);
        gardes.push({ vers, ...(libelleGarde((entree as EnchainementDeScene).libelle) ?? {}) });
    }
    return gardes;
}

/**
 * Ce qu'on GARDE d'un libellé : la chaîne telle qu'elle a été tapée, bornée en
 * longueur. **Sans aucun rognage.**
 *
 * ⛔⛔ **LE DÉFAUT QUE DAVID A VU À L'ÉCRAN, le 2026-09-22** — *« dans les
 * conditions je ne peux pas mettre d'espace entre les mots »*, capture à l'appui :
 * « camérasurveillance ».
 *
 * Cette fonction faisait `trim()`. Le champ étant **contrôlé**, chaque frappe
 * repassait par ici : taper « caméra » puis l'espace écrivait « caméra », que le
 * rognage rendait aussitôt « caméra ». *L'espace était mangé avant d'avoir
 * existé*, et le mot suivant se collait au précédent.
 *
 * ⭐ ***Une normalisation qui s'applique à la frappe empêche d'écrire.*** Ce qui
 * est gardé est ce que le meneur a tapé ; c'est l'**affichage** qui nettoie —
 * voir `libelleLisible`.
 *
 * ⚠️ La borne de LONGUEUR, elle, reste ici : le champ la montre en refusant la
 * frappe suivante, ce qui s'explique de soi-même. Un rognage, non.
 */
function libelleGarde(libelle: unknown): { libelle: string } | undefined {
    if (typeof libelle !== 'string' || libelle.length === 0) return undefined;
    return { libelle: libelle.slice(0, LIBELLE_MAXIMUM) };
}

/**
 * Ce qu'on AFFICHE d'un libellé : rogné, et rien du tout s'il ne reste que du
 * blanc.
 *
 * Employé partout où la condition est **rendue comme du texte** — sur le trait du
 * graphe, dans le panneau de séance, sur la tablette — et **jamais** pour la
 * valeur d'un champ de saisie, sous peine de reproduire le défaut ci-dessus.
 */
export function libelleLisible(libelle: string | undefined): string | undefined {
    const propre = libelle?.trim();
    return propre && propre.length > 0 ? propre : undefined;
}

/**
 * ⭐ **La règle.** L'ordre relie cette scène à la suivante de son acte
 * **seulement** si le meneur n'a déclaré aucune sortie.
 */
export function ordreEstDessine(scene: Scene): boolean {
    return enchainementsDeLaScene(scene).length === 0;
}

/**
 * Ce qu'il faut écrire pour qu'une scène mène à une autre.
 *
 * Rend `null` quand le geste n'a pas de sens — vers elle-même, vers une sortie
 * qui existe déjà. *Un geste sans effet n'est pas une erreur, mais il ne doit pas
 * faire un tour au magasin pour rien.*
 */
export function enchainementAjoute(
    scene: Scene, versId: string, libelle?: string,
): Partial<Scene> | null {
    if (!versId || versId === scene.id) return null;

    const actuels = enchainementsDeLaScene(scene);
    if (actuels.some(e => e.vers === versId)) return null;

    return { enchainements: [...actuels, { vers: versId, ...(libelleGarde(libelle) ?? {}) }] };
}

/** Ce qu'il faut écrire pour retirer une sortie. */
export function enchainementRetire(scene: Scene, versId: string): Partial<Scene> | null {
    const actuels = enchainementsDeLaScene(scene);
    if (!actuels.some(e => e.vers === versId)) return null;

    const reste = actuels.filter(e => e.vers !== versId);
    /* `undefined` plutôt qu'un tableau vide : une scène sans sortie doit se
       relire exactement comme une scène d'avant ce champ. */
    return { enchainements: reste.length > 0 ? reste : undefined };
}

/** Ce qu'il faut écrire pour changer la condition d'une sortie. */
export function enchainementLibelle(
    scene: Scene, versId: string, libelle: string,
): Partial<Scene> | null {
    const actuels = enchainementsDeLaScene(scene);
    if (!actuels.some(e => e.vers === versId)) return null;

    return {
        enchainements: actuels.map(e =>
            e.vers === versId ? { vers: e.vers, ...(libelleGarde(libelle) ?? {}) } : e),
    };
}

/**
 * Les sorties dont la cible existe encore, avec le titre de celle-ci.
 *
 * ⚠️ **Une cible disparue n'est pas rendue** : *afficher « mène à » suivi de rien
 * ferait chercher longtemps une scène qui n'existe plus.* Elle se retrouve dans
 * le constat du graphe, qui est l'endroit pour le dire.
 */
export function sortiesDeLaScene(
    scenes: readonly Scene[], scene: Scene,
): { vers: Scene; libelle?: string }[] {
    const sorties: { vers: Scene; libelle?: string }[] = [];
    for (const enchainement of enchainementsDeLaScene(scene)) {
        const cible = scenes.find(s => s.id === enchainement.vers);
        if (cible) sorties.push({ vers: cible, libelle: enchainement.libelle });
    }
    return sorties;
}

/**
 * D'où l'on peut arriver dans cette scène.
 *
 * **Le sens inverse se déduit, il ne se stocke pas.** Le garder des deux côtés
 * aurait fait deux écritures pour un seul lien, et un jour l'une sans l'autre.
 */
export function entreesDeLaScene(
    scenes: readonly Scene[], sceneId: string,
): { depuis: Scene; libelle?: string }[] {
    const entrees: { depuis: Scene; libelle?: string }[] = [];
    for (const scene of scenes) {
        const trouve = enchainementsDeLaScene(scene).find(e => e.vers === sceneId);
        if (trouve) entrees.push({ depuis: scene, libelle: trouve.libelle });
    }
    return entrees;
}

/** Vrai si au moins une sortie de cette scène pointe dans le vide. */
export function aUneSortieMorte(scenes: readonly Scene[], scene: Scene): boolean {
    return enchainementsDeLaScene(scene).some(e => !scenes.some(s => s.id === e.vers));
}

/**
 * **Ce qu'il faut réécrire quand des scènes disparaissent.**
 *
 * ⛔ **Sans ça, supprimer une scène laisse des flèches vers le vide** dans toutes
 * celles qui y menaient — et le meneur les verrait comme des sorties valides
 * jusqu'à cliquer. Appelé par `supprimerScene` **et** par la cascade de
 * `supprimerActe` : *une suppression en cascade laisse autant de liens pendants
 * qu'elle emporte de scènes.*
 *
 * Rend les seules scènes à réécrire, avec leur nouvelle liste.
 */
export function enchainementsSansLesScenes(
    scenes: readonly Scene[], disparues: ReadonlySet<string>,
): { id: string; enchainements?: EnchainementDeScene[] }[] {
    const aEcrire: { id: string; enchainements?: EnchainementDeScene[] }[] = [];
    for (const scene of scenes) {
        if (disparues.has(scene.id)) continue;
        const actuels = enchainementsDeLaScene(scene);
        const reste = actuels.filter(e => !disparues.has(e.vers));
        if (reste.length === actuels.length) continue;
        aEcrire.push({ id: scene.id, enchainements: reste.length > 0 ? reste : undefined });
    }
    return aEcrire;
}
