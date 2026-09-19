/**
 * **Fusionner un instantané de séance dans ce qui existe aujourd'hui.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE DÉFAUT, TROUVÉ QUATRE FOIS LE MÊME JOUR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 2026-09-19, les quatre modules d'ambiance faisaient tous la même chose
 * dans leur `applySnapshot` :
 *
 * ```ts
 * if (snapshot.scenes)      set({ scenes: snapshot.scenes });           // Light-OS
 * if (snapshot.atmospheres) set({ atmospheres: snapshot.atmospheres }); // Sound-OS
 * if (snapshot.playlists)   set({ playlists: snapshot.playlists });     // Music-OS
 * if (snapshot.tracks)      set({ tracks: snapshot.tracks });           // Ambient-OS
 * ```
 *
 * **Le remplacement en bloc.** Un instantané est une photo prise à un moment :
 * le rejouer six mois plus tard efface *tout ce qui a été rangé depuis*, sans
 * rien en dire. Le bouton promet « restaurer l'état complet » et le meneur
 * confirme — mais il consent à retrouver une ambiance, pas à perdre celles
 * qu'il a écrites entre-temps.
 *
 * ⛔ **Et depuis que les atmosphères (30/08) puis les tuiles (19/09)
 * appartiennent à une campagne, le remplacement traversait les campagnes** :
 * restaurer une séance d'*Alien* rendait ses cases, celles de *Rêves de
 * Dragons* comprises.
 *
 * ⭐ *Quatre copies du même geste, écrites séparément, qui avaient toutes le
 * même trou.* C'est la raison d'être de ce fichier : la règle s'écrit une fois,
 * et chaque module n'apporte que **son** idée de ce qu'est un travail.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE : un instantané ne fait jamais disparaître un travail qui n'est pas le sien
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * | Ce qu'il y a aujourd'hui | Ce qui arrive | Verdict |
 * | --- | --- | --- |
 * | Rien sous cette clé | n'importe quoi | on prend — *rien ne se perd* |
 * | Un vide | n'importe quoi | on prend |
 * | Un travail | un **vide** | **on garde le nôtre** |
 * | Un travail | un travail, **même propriétaire** | on prend — *c'est le sens du geste* |
 * | Un travail | un travail, **autre propriétaire** | **on garde le nôtre** |
 *
 * ⚠️ Ce que l'instantané ne mentionne pas reste tel quel : **on ne supprime
 * jamais**. Et ce qu'il apporte en plus est ajouté à la suite, sans réordonner
 * ce que le meneur a sous les yeux.
 */
export interface ReglesDeFusion<T> {
    /** Ce qui identifie une entrée d'un côté comme de l'autre. */
    cle: (entree: T) => string;
    /**
     * **Cette entrée porte-t-elle du travail ?** C'est la seule chose que
     * chaque module définit lui-même : une tuile qui tient l'état d'une lampe,
     * une atmosphère dont un pad porte un fichier, une piste qui a une URL.
     */
    porteDuTravail: (entree: T) => boolean;
    /**
     * **Deux entrées appartiennent-elles à la même personne ?**
     *
     * Facultatif : les modules dont les objets ne sont pas rattachés à une
     * campagne n'en ont pas besoin, et tout y est alors « même propriétaire ».
     */
    memeProprietaire?: (actuelle: T, venue: T) => boolean;
}

export function fusionnerUnInstantane<T>(
    actuelles: readonly T[],
    venues: readonly T[] | undefined | null,
    regles: ReglesDeFusion<T>,
): T[] {
    if (!venues) return [...actuelles];

    const memeProprietaire = regles.memeProprietaire ?? (() => true);
    const parCle = new Map(venues.map(v => [regles.cle(v), v]));

    const fusionnees = actuelles.map(actuelle => {
        const venue = parCle.get(regles.cle(actuelle));
        if (!venue) return actuelle;

        /* Ce qui ne porte rien ne remplace jamais ce qui porte quelque chose. */
        if (!regles.porteDuTravail(actuelle)) return venue;
        if (!regles.porteDuTravail(venue)) return actuelle;

        /* Les deux portent du travail : seul le propriétaire tranche. */
        return memeProprietaire(actuelle, venue) ? venue : actuelle;
    });

    const connues = new Set(actuelles.map(regles.cle));
    const nouvelles = venues.filter(v => !connues.has(regles.cle(v)));

    return [...fusionnees, ...nouvelles];
}

/**
 * La même fusion, pour les modules dont la collection est un **enregistrement**
 * adressé par identifiant — les dix-huit tuiles de Light-OS.
 */
export function fusionnerUnInstantaneIndexe<T>(
    actuelles: Record<string, T>,
    venues: Record<string, T> | undefined | null,
    regles: Omit<ReglesDeFusion<T>, 'cle'>,
): Record<string, T> {
    if (!venues) return actuelles;

    const fusionnees: Record<string, T> = { ...actuelles };
    const memeProprietaire = regles.memeProprietaire ?? (() => true);

    for (const [id, venue] of Object.entries(venues)) {
        const actuelle = fusionnees[id];

        if (actuelle === undefined || !regles.porteDuTravail(actuelle)) {
            fusionnees[id] = venue;
            continue;
        }
        if (!regles.porteDuTravail(venue)) continue;

        if (memeProprietaire(actuelle, venue)) fusionnees[id] = venue;
    }

    return fusionnees;
}
