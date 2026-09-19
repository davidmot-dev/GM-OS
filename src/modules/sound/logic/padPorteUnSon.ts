/**
 * **Ce qu'on exige d'un pad ici, et rien de plus.**
 *
 * Volontairement plus lâche que `SoundPad` : ces fonctions jugent le magasin,
 * où tout est garanti, **et le contenu d'un fichier de sauvegarde**, où rien ne
 * l'est. *Une fonction qui juge des données venues du disque ne peut pas exiger
 * qu'elles soient bien formées — c'est précisément ce qu'elle vérifie.*
 */
export interface PadLisible {
    filePath?: string | null;
    isActive?: boolean;
}

/** Une atmosphère telle qu'on la relit : ses pads, et rien d'autre d'obligatoire. */
export interface AtmosphereLisible {
    pads?: Record<string, PadLisible> | null;
}

/**
 * **Un pad porte-t-il du travail ?** Il porte un son, ou il n'est rien.
 *
 * Le titre, la couleur, la note MIDI et la touche ne suffisent pas : un pad
 * sans fichier ne joue rien. C'est le fichier qui fait la différence entre une
 * case décorée et une case qui sonne.
 */
export const padPorteUnSon = (pad: PadLisible | undefined | null): boolean =>
    typeof pad?.filePath === 'string' && pad.filePath.length > 0;

/**
 * **Les atmosphères qui portent au moins un son.**
 *
 * ⛔ **C'est ici que le contrôle habituel se serait cru posé sans rien
 * refuser.** Partout ailleurs dans `SessionService`, la garde *« un instantané
 * vide n'en remplace jamais un plein »* compte les éléments d'une liste. Mais
 * `atmospheres` **n'est jamais vide** : le magasin naît avec « Exploration » et
 * ses seize pads muets, et `removeAtmosphere` la **recrée** dès qu'on supprime
 * la dernière. Un `atmospheres?.length` vaudrait donc au moins 1 dans une base
 * qui n'a jamais rien préparé — et laisserait un magasin neuf effacer des mois
 * de pads à la restauration.
 *
 * ⭐ *Deuxième fois en une journée* : Light-OS a exactement le même piège avec
 * ses dix-huit tuiles qui existent toujours — voir
 * `light/logic/tuilePorteUnEtat.ts`. **La question qui les trouve est « cette
 * liste peut-elle être vide ? », et la réponse est presque toujours non quand
 * le magasin fabrique ses cases d'avance.**
 */
export const atmospheresQuiPortentUnSon = <T extends AtmosphereLisible>(
    atmospheres: readonly T[] | undefined | null,
): T[] =>
    (atmospheres ?? []).filter(a => Object.values(a?.pads ?? {}).some(padPorteUnSon));

/**
 * **Les atmosphères débarrassées de ce qui est en train de jouer.**
 *
 * `isActive` vit sur le pad, au milieu de la préparation — mais il décrit la
 * séance en cours, pas le travail. Le sauvegarder rendrait, six mois plus tard,
 * une grille où des pads s'allument sans qu'aucun son ne sorte : *un pad
 * allumé qui ne joue pas est un mensonge visuel, et on ne sauvegarde pas un
 * mensonge.*
 *
 * C'est la même frontière qu'Image-OS a tracée pour ses projections, et
 * Music-OS pour son volume général : **ce qui est à l'écran ou dans les
 * enceintes décrit la soirée, pas l'univers.**
 */
export const atmospheresAuRepos = <
    P extends PadLisible,
    T extends { pads?: Record<string, P> | null },
>(atmospheres: readonly T[] | undefined | null): T[] =>
    (atmospheres ?? []).map(atmosphere => ({
        ...atmosphere,
        pads: Object.fromEntries(
            Object.entries(atmosphere?.pads ?? {}).map(([id, pad]) => [id, { ...pad, isActive: false }]),
        ),
    }));

/**
 * **Sur quelle atmosphère pointer après avoir remplacé la liste.**
 *
 * ⛔ **Une atmosphère active qui n'existe plus rend tous les gestes muets.**
 * Les neuf actions de pad du magasin filtrent par
 * `a.id === activeAtmosphereId` : si cet identifiant ne désigne plus rien,
 * régler un volume, assigner un fichier ou déclencher un pad ne fait **rien**,
 * sans un mot. Et l'écran ne le montre pas — `SoundDashboard` retombe sur la
 * première atmosphère de la liste. *Le meneur verrait une grille normale où
 * plus aucun clic n'a d'effet.*
 *
 * `removeAtmosphere` pose déjà cette règle quand on supprime celle qui jouait.
 * Elle est écrite ici pour servir aussi à la restauration — *un même verdict,
 * pas deux copies.*
 *
 * @returns l'identifiant à garder, ou `null` s'il n'y a rien où pointer.
 */
export const atmosphereOuPointer = (
    atmospheres: readonly { id: string }[] | undefined | null,
    actuelle: string | null | undefined,
): string | null => {
    const liste = atmospheres ?? [];
    if (actuelle && liste.some(a => a.id === actuelle)) return actuelle;
    return liste[0]?.id ?? null;
};
