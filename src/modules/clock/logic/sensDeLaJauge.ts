/**
 * **Dans quel sens cette jauge se lit-elle ?**
 *
 * *Demandé par David le 2026-09-15 :* **« j'ai des jauges qui augmentent, mais
 * je n'ai pas de jauge qui diminue pour simuler la diminution de
 * consommable »**.
 *
 * ⚠️ **Le mécanisme de descente existait déjà** — shift-clic et clic droit font
 * `−1` depuis toujours, et `remplirLaJauge` a été posé le 2026-08-31 pour
 * exactement ce cas (le Voight-Kampff). Ce qui manquait n'était pas un geste :
 * c'est que **rien autour de la jauge ne savait qu'elle se lit à l'envers**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUE LE SENS CHANGE, ET QUI SE TROMPAIT SANS LUI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. **La naissance.** `addTensionClock` écrivait `filledSegments: 0`. Des
 *    vivres naissent **pleins** ; il fallait créer la jauge, puis penser au
 *    chevron.
 * 2. ⛔ **L'alarme.** `NarrativeClock` teintait en rouge, faisait pulser le
 *    compte et échapper un cercle **quand la jauge est pleine**. Sur des
 *    provisions, le plein est la bonne nouvelle *et il hurlait* — pendant que le
 *    zéro, le seul moment qui compte, ne disait **rien du tout**. *Un instrument
 *    qui crie au mauvais moment est pire qu'un instrument muet : on apprend à
 *    ne plus le regarder.*
 * 3. **Le geste courant.** Clic gauche `+1`. Sur un consommable, le geste de la
 *    soirée est `−1` : le geste facile était celui qui ne sert pas.
 * 4. **La relecture.** Le compte rendu de séance consigne `remplis/total` : un
 *    consommable à `0/6` se relit comme « rien ne s'est passé », alors qu'il dit
 *    « ils n'ont plus rien ».
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA RÈGLE VIT ICI, PURE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Il y a quatre écrans qui dessinent une jauge** — le pupitre du meneur, le
 * Player Hub, les tablettes et l'afficheur de table — et un cinquième lecteur,
 * le compte rendu de séance. *Une règle recopiée dans trois écrans sur quatre
 * est le motif le plus cher de ce dépôt* : le caviardage des cartes scellées, la
 * liste « Donner à » de Deck-OS, les sept lecteurs des degrés de réussite. On
 * l'écrit une fois, on l'éprouve une fois.
 *
 * Rien ici ne lit d'état global et rien ne lève. C'est le magasin qui applique.
 */

/**
 * **Le sens d'une jauge.**
 *
 * `remplissage` : elle monte vers le danger — l'alerte des gardes, le rituel qui
 * s'achève. C'est la jauge de *Blades in the Dark*, et c'était la seule.
 *
 * `epuisement` : elle descend vers le manque — les rations, les munitions,
 * l'oxygène, la charge d'une batterie. **Le plein est l'état confortable, et
 * c'est le zéro qui doit crier.**
 */
export type SensDeLaJauge = 'remplissage' | 'epuisement';

export const SENS_DE_JAUGE: readonly SensDeLaJauge[] = ['remplissage', 'epuisement'];

/**
 * ⚠️ **Le remplissage reste le défaut, et c'est la migration.**
 *
 * Les jauges créées avant ce jour n'ont pas de sens et doivent continuer à se
 * comporter **exactement** comme hier : monter, et crier au plein. *Un choix
 * ajouté ne redessine pas ce qui existait* — la règle déjà tenue par `forme`,
 * `surLAfficheur` et `vueParLesJoueurs`.
 */
export const SENS_PAR_DEFAUT: SensDeLaJauge = 'remplissage';

/** Ce que ce module a besoin de savoir d'une jauge, et rien de plus. */
export interface JaugeOrientee {
    totalSegments: number;
    filledSegments: number;
    sens?: SensDeLaJauge;
    /**
     * **Ce qu'une scène coûte à cette jauge.** Toujours **positif** : c'est le
     * sens qui décide de la direction, pas le signe.
     *
     * Absent ou nul : la scène ne lui fait rien, et c'est le cas de toutes les
     * jauges existantes.
     */
    pasParScene?: number;
}

/** Le sens effectif, défaut compris. À préférer à `jauge.sens` partout. */
export function sensDe(jauge: { sens?: SensDeLaJauge }): SensDeLaJauge {
    return jauge.sens ?? SENS_PAR_DEFAUT;
}

/** Cette jauge descend-elle ? Le raccourci que les écrans posent le plus. */
export function elleSeVide(jauge: { sens?: SensDeLaJauge }): boolean {
    return sensDe(jauge) === 'epuisement';
}

/**
 * **Où en est une jauge qu'on vient de poser.**
 *
 * Un consommable naît **plein** : on ne commence pas une expédition sans vivres.
 * *Sans ça, créer « Rations » puis cliquer le chevron était un geste en deux
 * temps dont le second s'oublie — et une jauge de rations à zéro dès sa
 * naissance est à la fois fausse et alarmante.*
 */
export function departDeLaJauge(sens: SensDeLaJauge, total: number): number {
    if (!Number.isFinite(total) || total < 0) return 0;
    return sens === 'epuisement' ? total : 0;
}

/**
 * **La jauge est-elle au bout de sa course — celui qui fait mal ?**
 *
 * C'est ce que l'écran teinte en rouge, fait pulser, et entoure d'un cercle qui
 * s'échappe. Pour une jauge qui monte, c'est le plein ; pour une jauge qui se
 * vide, **c'est le vide**.
 *
 * Une jauge sans segment n'est critique dans aucun sens : elle n'a pas de
 * course. *Le rendu se gardait déjà de ce cas, et ce n'est pas une prudence
 * gratuite — `totalSegments` vient d'une saisie.*
 */
export function estCritique(jauge: JaugeOrientee): boolean {
    if (!Number.isFinite(jauge.totalSegments) || jauge.totalSegments <= 0) return false;
    if (!Number.isFinite(jauge.filledSegments)) return false;

    return elleSeVide(jauge)
        ? jauge.filledSegments <= 0
        : jauge.filledSegments >= jauge.totalSegments;
}

/* ────────────────────────── La gravité, en quatre crans ───────────────────── */

/**
 * **Combien de course reste-t-il avant le bout qui fait mal ?** — en fraction.
 *
 * `1` : on en est le plus loin possible. `0` : on y est.
 *
 * C'est **la fraction, pas le nombre de segments**, et c'est ce que David a
 * tranché le 2026-09-15 : une jauge de quatre et une jauge de douze doivent
 * s'alarmer *au même endroit de leur course*. Compter deux segments avant la fin
 * laisserait une jauge de douze muette pendant les neuf premiers.
 */
export function margeAvantLeBout(jauge: JaugeOrientee): number {
    if (!Number.isFinite(jauge.totalSegments) || jauge.totalSegments <= 0) return 1;
    if (!Number.isFinite(jauge.filledSegments)) return 1;

    const restants = elleSeVide(jauge)
        ? jauge.filledSegments
        : jauge.totalSegments - jauge.filledSegments;

    return Math.min(1, Math.max(0, restants / jauge.totalSegments));
}

/**
 * **À quelle distance du bout la jauge se trouve** — ce que la couleur raconte.
 *
 * *Demandé par David le 2026-09-15, juste après le sens : « est-ce qu'on pourrait
 * introduire un code couleur (orange, rouge) quand cela s'épuise ? ».*
 *
 * C'est le prolongement naturel d'`estCritique` : au lieu d'une question fermée
 * — *au bout, oui ou non ?* — une **distance au bout**. `estCritique` reste la
 * primitive, et `critique` s'y ramène : *deux définitions du même bout finiraient
 * par ne plus tomber sur le même segment.*
 *
 * ⚠️ **Elle vaut dans LES DEUX SENS** (tranché avec les seuils). Une alerte des
 * gardes passe à l'orange à mi-course comme des vivres — *deux jauges côte à côte
 * doivent se lire avec la même grammaire de couleur, sinon la couleur ne veut
 * plus rien dire du tout.* Conséquence assumée : les jauges existantes changent
 * d'apparence, sans qu'aucune donnée ne bouge.
 *
 * ⚠️ **Ce module ne connaît aucune couleur, et c'est délibéré.** Il dit le cran ;
 * le pigment appartient à chaque écran, parce qu'ils n'ont pas la même palette —
 * trois thèmes CSS d'un côté, une matrice de 32 pixels de l'autre. *La règle se
 * partage, le pigment non.*
 */
export type GraviteDeLaJauge = 'calme' | 'tension' | 'urgence' | 'critique';

/** Marge à partir de laquelle la jauge s'assombrit — la mi-course. */
export const SEUIL_DE_TENSION = 0.5;
/** Marge à partir de laquelle elle passe au rouge — le dernier quart. */
export const SEUIL_D_URGENCE = 0.25;

export function graviteDeLaJauge(jauge: JaugeOrientee): GraviteDeLaJauge {
    if (estCritique(jauge)) return 'critique';

    const marge = margeAvantLeBout(jauge);
    if (marge <= SEUIL_D_URGENCE) return 'urgence';
    if (marge <= SEUIL_DE_TENSION) return 'tension';
    return 'calme';
}

/**
 * **Ce que fait le clic principal sur cette jauge.**
 *
 * *Tranché par David le 2026-09-15 :* le clic facile suit le sens de la jauge.
 * Sur un consommable, le geste de la soirée est de consommer — shift-clic et
 * clic droit rendent ce qui a été repris.
 *
 * ⚠️ **Le geste s'inverse donc selon la jauge**, et c'est assumé : *un geste
 * uniforme qui va dans le mauvais sens n'est pas plus simple, il est seulement
 * plus régulier.* La forme de la jauge dit déjà qu'elle n'est pas de la même
 * famille.
 */
export function pasDuClicPrincipal(jauge: { sens?: SensDeLaJauge }): 1 | -1 {
    return elleSeVide(jauge) ? -1 : 1;
}

/**
 * Le nombre de segments après un mouvement, borné à la course de la jauge.
 *
 * Bornes explicites plutôt qu'héritées de `updateTensionSegments` : cette
 * fonction sert aussi l'usure de fin de scène, qui n'emprunte pas ce chemin.
 */
export function borner(valeur: number, total: number): number {
    if (!Number.isFinite(total) || total < 0) return 0;
    if (!Number.isFinite(valeur)) return 0;
    return Math.min(total, Math.max(0, valeur));
}

/**
 * **Où se retrouve une jauge dont on vient de changer le sens.**
 *
 * Le cas courant : on pose « Alerte », on la regarde, et on se dit que c'était
 * « Rations » qu'on voulait. À zéro, basculer en épuisement donnerait des vivres
 * **vides dès la première seconde**, alarme comprise — le contraire de ce qu'on
 * a voulu dire.
 *
 * ⚠️ **La règle : une jauge qu'on n'a pas touchée se replace, une jauge en cours
 * de partie ne bouge pas.** Si le compte est encore à son départ d'origine, il
 * passe au départ du nouveau sens ; dès que le meneur l'a fait bouger, on garde
 * ce qu'il a compté. *Deviner est bienvenu tant qu'il n'y a rien à perdre ;
 * au-delà, écraser le travail de quelqu'un pour être malin est un mauvais
 * marché.*
 */
export function apresChangementDeSens(
    jauge: JaugeOrientee,
    nouveau: SensDeLaJauge,
): number {
    const ancien = sensDe(jauge);
    if (ancien === nouveau) return jauge.filledSegments;

    const departAncien = departDeLaJauge(ancien, jauge.totalSegments);
    return jauge.filledSegments === departAncien
        ? departDeLaJauge(nouveau, jauge.totalSegments)
        : borner(jauge.filledSegments, jauge.totalSegments);
}

/* ───────────────────────── L'usure d'une scène ───────────────────────── */

/**
 * Un mouvement produit par la fin d'une scène, tel qu'on peut le dire.
 *
 * On rend **ce qui a bougé**, pas le nouvel état : c'est ce qui permet à
 * l'écran d'annoncer « Rations : 2 → 1 » et de crier quand une jauge touche son
 * bout. *Un magasin qui applique en silence prive le meneur de la seule
 * information qui l'intéresse.* Même forme que `RessourcesDeTable.finDeScene`,
 * qui a réglé la même question le 2026-08-15.
 */
export interface UsureDUneJauge {
    id: string;
    nom: string;
    avant: number;
    apres: number;
    /** La jauge touche-t-elle son bout **à cause de cette scène** ? */
    devientCritique: boolean;
    /**
     * Le sens de la jauge, recopié ici pour que l'annonce n'ait pas besoin
     * d'aller le rechercher. *Atteindre son bout ne se dit pas pareil dans les
     * deux sens : « il n'en reste plus » et « elle est pleine » ne sont pas la
     * même nouvelle.*
     */
    seVide: boolean;
}

/**
 * **Ce qu'une fin de scène fait aux jauges.**
 *
 * *Portée choisie par David le 2026-09-15.* Une jauge peut déclarer ce qu'une
 * scène lui coûte — une ration par scène, un segment de rituel par scène — et
 * la trame l'applique quand le meneur ferme réellement une scène.
 *
 * ⚠️ **Le pas va toujours vers le bout qui fait mal.** Il est stocké positif, et
 * c'est le sens qui décide de la direction : `−1` de provisions, `+1` de rituel.
 * *Stocker un signe aurait créé deux façons d'écrire la même intention, et donc
 * une jauge qui remonte à chaque scène sans que personne comprenne pourquoi.*
 *
 * ⚠️ **Une jauge déjà au bout ne bouge plus et ne figure pas dans le rapport.**
 * Sinon la fin de chaque scène annoncerait « Rations : 0 → 0 » jusqu'à la fin de
 * la campagne, et l'annonce qui compte — celle du passage à zéro — se noierait
 * dans les autres.
 */
export function usureDeLaScene<T extends JaugeOrientee & { id: string; name: string }>(
    jauges: readonly T[] | undefined,
): UsureDUneJauge[] {
    const usures: UsureDUneJauge[] = [];

    for (const jauge of jauges ?? []) {
        const pas = jauge.pasParScene;
        if (!Number.isFinite(pas) || !pas || pas <= 0) continue;
        if (!Number.isFinite(jauge.totalSegments) || jauge.totalSegments <= 0) continue;

        const avant = borner(jauge.filledSegments, jauge.totalSegments);
        const apres = borner(
            avant + (elleSeVide(jauge) ? -pas : pas),
            jauge.totalSegments,
        );
        if (apres === avant) continue;

        usures.push({
            id: jauge.id,
            nom: jauge.name,
            avant,
            apres,
            devientCritique: estCritique({ ...jauge, filledSegments: apres })
                && !estCritique({ ...jauge, filledSegments: avant }),
            seVide: elleSeVide(jauge),
        });
    }

    return usures;
}

/**
 * **Une jauge, telle qu'elle se relit dans un compte rendu.**
 *
 * ⛔ **Le quatrième endroit qui se trompait.** Le compte rendu de séance
 * consignait `0/6` sans plus : pour une tension c'est « rien ne s'est passé »,
 * pour des vivres c'est « ils n'ont plus rien ». *Le même nombre, la nouvelle
 * inverse* — et une relecture faite trois semaines plus tard n'a plus personne
 * pour lever le doute.
 *
 * Elle est ici plutôt que dans le journal parce que **trois écrans la rendent**
 * — le compte rendu en Markdown, son panneau, et l'entrée de journal — et que
 * trois formulations écrites à la main finissent par ne plus dire la même chose.
 */
export function libelleDeJauge(
    jauge: { name: string; filled: number; total: number; seVide?: boolean },
): string {
    const compte = `${jauge.name} : ${jauge.filled}/${jauge.total}`;
    return jauge.seVide ? `${compte} restants` : compte;
}

/** Une usure, telle qu'on la dit au meneur. */
export interface AnnonceDUsure {
    texte: string;
    /** La jauge vient de toucher son bout : le ton change. */
    alarme: boolean;
}

/**
 * **Ce qu'on dit au meneur quand une scène a coûté quelque chose.**
 *
 * ⚠️ **Une fin de scène ne doit pas se voir passer en silence.** L'usure est la
 * seule chose de l'application qui fasse bouger une jauge **sans que personne
 * n'ait cliqué dessus** : sans annonce, le meneur retrouverait des rations à
 * trois sans savoir quand elles sont passées de cinq, et soupçonnerait un
 * défaut. *Un automatisme muet est indistinguable d'un bogue.*
 *
 * La mise en forme est ici, pure, parce que c'est elle qu'on veut pouvoir
 * éprouver — le toast, lui, n'est qu'un canal.
 */
export function annoncesDeLUsure(usures: readonly UsureDUneJauge[]): AnnonceDUsure[] {
    return usures.map((u) => ({
        texte: u.devientCritique
            ? (u.seVide ? `${u.nom} : il n’en reste plus.` : `${u.nom} : la jauge est pleine.`)
            : `${u.nom} : ${u.avant} → ${u.apres}`,
        alarme: u.devientCritique,
    }));
}

/**
 * Applique les usures à une liste de jauges.
 *
 * ⚠️ **Rend la liste d'origine, par référence, quand rien ne bouge.** Une fin de
 * scène sans jauge usable est le cas courant — la plupart des tables n'en
 * déclareront aucune — et réécrire la liste ferait repeindre les quatre écrans
 * et repartir une diffusion réseau pour rien. *Le magasin s'en sert pour ne rien
 * écrire du tout.*
 */
export function appliquerLUsure<T extends JaugeOrientee & { id: string; name: string }>(
    jauges: readonly T[] | undefined,
    usures: readonly UsureDUneJauge[],
): T[] {
    const liste = (jauges ?? []) as T[];
    if (usures.length === 0) return liste;

    const parId = new Map(usures.map((u) => [u.id, u.apres]));
    return liste.map((jauge) =>
        (parId.has(jauge.id) ? { ...jauge, filledSegments: parId.get(jauge.id)! } : jauge));
}
