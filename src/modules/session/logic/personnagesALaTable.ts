/**
 * **À la Table, seulement ceux qui jouent** — David, 11/11/2026 : « lorsqu'on est
 * à Table, je voudrais quand je vais sur un joueur, ne voir que ses personnages
 * actifs dans la partie. Même chose dans le centre de liaison, je ne veux voir
 * que les personnages connectés ».
 *
 * Décisions du même jour : **à la Table seulement** (en Atelier, tout reste
 * visible pour préparer) ; « actif dans la partie » = **ajouté à la séance en
 * cours** (`sessionEntityIds`, le bouton de la carte du personnage) ; « connecté »
 * = **tenu par une tablette** (`connectedCharacters`, reflet des appareils que le
 * serveur voit — pas l'interrupteur manuel « en ligne » du joueur).
 */

/**
 * Les personnages d'un joueur à montrer : ceux de la séance quand il y en a une
 * (à la Table), tous sinon. `masques` dit combien la séance en retire, pour que
 * l'écran le dise — un personnage qui disparaît sans un mot a l'air perdu.
 */
export function personnagesDeLaSeance<T extends { id: string }>(
    personnages: readonly T[],
    seance: { sessionEntityIds?: string[] } | undefined,
): { visibles: T[]; masques: number } {
    if (!seance) return { visibles: [...personnages], masques: 0 };
    const dansLaSeance = new Set(seance.sessionEntityIds ?? []);
    const visibles = personnages.filter(p => dansLaSeance.has(p.id));
    return { visibles, masques: personnages.length - visibles.length };
}

/** Les destinataires tenus par une tablette — `connectes` : personnage → appareil. */
export function seulementLesConnectes<T extends { id: string }>(
    destinataires: readonly T[],
    connectes: Record<string, string> | undefined,
): T[] {
    return destinataires.filter(d => !!connectes?.[d.id]);
}
