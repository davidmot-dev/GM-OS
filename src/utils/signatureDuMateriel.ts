/**
 * **Reconnaître une enceinte ou un écran d'une soirée à l'autre.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUI SE PERDAIT, ET POURQUOI CE N'ÉTAIT PAS UN DÉFAUT DE SAUVEGARDE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * David, le 2026-09-12 : *« est-il possible de garder les noms que j'attribue
 * aux sorties audio, aux écrans ou autre quand je rallume GM-OS »*.
 *
 * **Ils étaient déjà gardés.** `useHardwareStore` persiste ses deux carnets
 * d'alias depuis toujours. Ce qui bougeait, c'est **la clé sous laquelle ils
 * sont rangés** :
 *
 * | Carnet | Rangé par | Pourquoi ça bouge |
 * | --- | --- | --- |
 * | sorties audio | `deviceId` | une empreinte du périphérique : **rebrancher une enceinte en change l'identifiant** |
 * | écrans | `display.id` | attribué par le système, **réattribué** au redémarrage ou au changement de câble |
 *
 * *Le nom était toujours là, rangé sous l'ancienne clé ; GM-OS cherchait la
 * nouvelle.* Le même soir, `Device 22ad7d4a… not found, falling back to default`
 * disait la même chose du **routage** : une ambiance visant les enceintes du
 * fond sortait devant, en silence.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ON PREND COMME SIGNATURE, ET CE QUE ÇA COÛTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ **Aucune de ces deux signatures n'est parfaite, et il faut le dire.** On
 * n'échange pas un identifiant faux contre un identifiant vrai : on échange un
 * identifiant qui change **à chaque rebranchement** contre un autre qui ne
 * change que si l'on remanie son installation. *C'est un gain de fiabilité, pas
 * une garantie.*
 */

/**
 * Les identifiants que le navigateur réserve : ils désignent un **rôle**, pas un
 * appareil, et suivent donc déjà le réglage de Windows.
 */
export const SORTIES_SYSTEME: readonly string[] = ['default', 'communications'];

export function estUneSortieSysteme(id: string | null | undefined): boolean {
    return !id || SORTIES_SYSTEME.includes(id);
}

/**
 * **Le libellé système d'une sortie, débarrassé de ce qui bouge.**
 *
 * ⛔ **Windows numérote ses périphériques au rebranchement.** `Haut-parleurs
 * (Realtek Audio)` devient `Haut-parleurs (2- Realtek Audio)` — parfois `3-`
 * après quelques cycles. *Sans ce nettoyage, la signature serait aussi instable
 * que l'identifiant qu'elle remplace*, et tout ce module ne servirait à rien.
 *
 * Rend `null` quand il n'y a pas de libellé : `enumerateDevices` rend des
 * entrées anonymes tant que l'autorisation micro n'a pas été donnée. *Une
 * signature vide rangerait toutes les enceintes ensemble* — mieux vaut avouer
 * qu'on ne sait pas.
 */
export function signatureDeLaSortie(appareil: { deviceId?: string; label?: string }): string | null {
    if (estUneSortieSysteme(appareil.deviceId)) return null;

    const brut = (appareil.label ?? '').trim();
    if (brut === '') return null;

    const nettoye = brut
        .replace(/\b\d+-\s*/g, '')   // le « 2- » de la ré-énumération Windows
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    return nettoye === '' ? null : `audio:${nettoye}`;
}

/**
 * **La signature d'un écran : sa taille et sa place.**
 *
 * ⚠️ **Faute de mieux, et c'est à assumer.** Le processus principal ne transmet
 * aucun nom système : il fabrique `Moniteur 1`, `Moniteur 2`… **d'après le rang
 * dans la liste**, qui change autant que l'identifiant. Il ne reste que la
 * géométrie.
 *
 * *Ce que ça rate* : deux moniteurs identiques échangés de place prennent la
 * signature l'un de l'autre, et changer la résolution d'un écran lui en donne
 * une nouvelle. *Ce que ça gagne* : le cas courant — éteindre la machine et la
 * rallumer — ne perd plus rien.
 */
export function signatureDeLEcran(ecran: {
    bounds?: { x: number; y: number; width: number; height: number };
}): string | null {
    const b = ecran.bounds;
    if (!b) return null;
    return `ecran:${b.width}x${b.height}@${b.x},${b.y}`;
}

/** Une sortie réellement présente sur la machine, à l'instant où l'on regarde. */
export interface SortiePresente {
    deviceId: string;
    label?: string;
}

export type VerdictDeSortie =
    /** Rien n'était demandé : on suit la sortie par défaut de Windows. */
    | { sort: 'par-defaut' }
    /** La sortie visée est là — par son identifiant, ou retrouvée par signature. */
    | { sort: 'trouvee'; deviceId: string; par: 'identifiant' | 'signature' }
    /** Elle était demandée, et elle n'est plus branchée. */
    | { sort: 'disparue' };

/**
 * **Quelle sortie employer pour un identifiant enregistré la semaine dernière.**
 *
 * ⭐ **L'identifiant d'abord, la signature ensuite** — et pas l'inverse. Quand
 * l'appareil n'a pas bougé, son identifiant le désigne exactement ; passer par
 * le libellé ferait courir le risque d'en confondre deux qui portent le même
 * nom. *La signature est un filet, pas une méthode.*
 *
 * ⛔ **Et « disparue » n'est pas « par défaut ».** Les confondre est exactement
 * ce que faisait le code d'avant : l'ambiance repartait devant sans que rien ne
 * le dise. L'appelant doit pouvoir parler.
 */
export function retrouverLaSortie(
    enregistre: string | null | undefined,
    presentes: readonly SortiePresente[],
    signatureEnregistree?: string | null,
): VerdictDeSortie {
    if (estUneSortieSysteme(enregistre)) return { sort: 'par-defaut' };

    if (presentes.some(p => p.deviceId === enregistre)) {
        return { sort: 'trouvee', deviceId: enregistre!, par: 'identifiant' };
    }

    /*
      La signature mémorisée avec le choix vaut mieux que rien ; à défaut, on
      n'a plus que l'identifiant, et il ne dit plus rien.
    */
    if (signatureEnregistree) {
        const retrouvee = presentes.find(p => signatureDeLaSortie(p) === signatureEnregistree);
        if (retrouvee) return { sort: 'trouvee', deviceId: retrouvee.deviceId, par: 'signature' };
    }

    return { sort: 'disparue' };
}

/**
 * **Reclasse un carnet d'alias sous les signatures d'aujourd'hui.**
 *
 * ⛔ **On ajoute, on ne remplace jamais.** Un alias dont on ne sait pas calculer
 * la signature — appareil débranché au moment de la migration — reste rangé sous
 * son ancien identifiant. *Une migration qui perd ce qu'elle ne comprend pas est
 * une perte déguisée en nettoyage*, et ce dépôt a déjà payé ça deux fois avec
 * les campagnes.
 *
 * La relecture essaie donc les deux clés, et cette fonction peut tourner autant
 * de fois qu'on veut sans rien abîmer.
 */
export function migrerLesAlias<T extends { deviceId?: string; id?: string }>(
    alias: Readonly<Record<string, string>>,
    presents: readonly T[],
    signature: (present: T) => string | null,
): Record<string, string> {
    const migre: Record<string, string> = { ...alias };

    for (const present of presents) {
        const cle = present.deviceId ?? present.id;
        if (cle === undefined) continue;

        const nom = alias[cle];
        const sig = signature(present);
        /* Ne jamais écraser un alias déjà rangé sous sa signature : il est plus
           récent que celui de l'ancienne clé. */
        if (nom && sig && migre[sig] === undefined) migre[sig] = nom;
    }

    return migre;
}
