/**
 * **Une variante d'effet — « la torche, mais bleue et plus lente ».**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA COULEUR NE PEUT PAS SE POSER AVANT L'EFFET
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le moteur lit `baseXy` — la couleur de la lampe — et onze effets s'en
 * servent : `candle`, `holy`, `breathing`… Pour ceux-là, changer de couleur se
 * fait déjà, en posant la teinte avant de lancer l'effet.
 *
 * ⛔ **Mais ils sont onze sur quarante-sept.** Les trente-six autres écrivent
 * leur palette en dur — `hexToXy('#ff8a1e')` pour la torche, un rouge et un bleu
 * alternés pour le gyrophare. *« Comme la torche, mais bleue » ne marchait donc
 * pas, et rien ne le disait : le curseur de couleur existait, il n'avait
 * simplement aucun effet sur ces trente-six.*
 *
 * Une variante ne pose donc pas une couleur **avant**, elle reteinte **après** —
 * au seul endroit que les quarante-sept traversent, celui où la brillance
 * globale est déjà appliquée. *Une greffe, et tout le catalogue devient
 * déclinable.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ POURQUOI ON MÉLANGE AU LIEU DE REMPLACER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Remplacer la couleur rendrait un gyrophare **monochrome** — et un gyrophare
 * monochrome n'est plus un gyrophare. Ce qui fait un effet, ce n'est pas sa
 * teinte : c'est le **rapport** entre ses teintes et son rythme.
 *
 * On déplace donc toute sa palette vers la cible, en gardant les écarts. À 70 %,
 * le gyrophare garde son battement rouge/bleu, décalé dans les violets. À 100 %,
 * il devient une seule couleur qui clignote — c'est parfois ce qu'on veut, mais
 * ça doit être un choix, pas le défaut.
 *
 * *C'est la même leçon que les trois feux : deux effets dont on ne sait pas dire
 * ce qui les sépare sont un seul effet. Une variante qui écrase la palette
 * fabrique exactement ça.*
 */

/** Un point de couleur dans l'espace xy de la CIE, celui que parle une lampe Hue. */
export type PointXy = readonly [number, number];

/** Ce qu'une variante change à l'effet dont elle descend. */
export interface VarianteDEffet {
    id: string;
    /** Le nom que le meneur lui donne — c'est lui qui s'affiche dans la liste. */
    nom: string;
    /** L'effet du catalogue dont elle descend, par exemple `torche`. */
    source: string;
    /**
     * La teinte vers laquelle toute la palette est tirée, en hexadécimal.
     * Absente, la variante ne change pas les couleurs — elle peut n'être qu'un
     * changement de rythme.
     */
    teinte?: string;
    /**
     * Combien on tire vers elle, de 0 à 1.
     *
     * ⭐ **Jamais 1 par défaut.** Voir l'en-tête : à fond, un effet perd le
     * rapport entre ses couleurs, c'est-à-dire ce qui le rendait reconnaissable.
     */
    force: number;
    /** Multiplicateur de cadence, comme celui des scènes. 1 = le rythme d'origine. */
    vitesse: number;
}

/** La force de teinte d'une variante neuve : on décale, on n'écrase pas. */
export const FORCE_PAR_DEFAUT = 0.7;

/** Bornes de la force. Zéro est permis : une variante peut n'être qu'un rythme. */
export const FORCE_MIN = 0;
export const FORCE_MAX = 1;

/** Ramène une force dans ses bornes, et refuse ce qui n'est pas un nombre. */
export function bornerLaForce(valeur: unknown): number {
    const n = Number(valeur);
    if (!Number.isFinite(n)) return FORCE_PAR_DEFAUT;
    return Math.min(FORCE_MAX, Math.max(FORCE_MIN, n));
}

/**
 * Tire un point de couleur vers une cible, sans quitter le segment qui les
 * joint.
 *
 * ⚠️ **Le résultat peut sortir du gamut de la lampe**, et ce module ne le
 * recale pas : le recalage vit dans `HueEngine`, qui connaît le gamut du
 * matériel. *Deux modules qui recalent la même couleur finiraient par ne plus
 * être d'accord* — celui-ci calcule, celui-là contient.
 */
export function teinterVers(origine: PointXy, cible: PointXy, force: number): [number, number] {
    const f = bornerLaForce(force);
    return [
        origine[0] + (cible[0] - origine[0]) * f,
        origine[1] + (cible[1] - origine[1]) * f,
    ];
}

/**
 * **Le fondu ne doit jamais dépasser le battement — y compris une fois la
 * vitesse appliquée.**
 *
 * ⛔ **Le défaut que cette fonction corrige, trouvé le 2026-09-18.** Le contrôle
 * du catalogue interdit qu'un `transitiontime` dépasse son `interval`, et il a
 * raison : *la commande suivante arrive avant la fin du fondu, la lampe se
 * contente de suivre, et la forme voulue n'apparaît jamais.* Mais il vérifie la
 * **source**, où la vitesse vaut toujours 1.
 *
 * Or le curseur de vitesse divise l'attente **sans toucher au fondu**. À vitesse
 * 2, `holy` fondait sur 1 500 ms pour un battement de 750, et `aube-doree` sur
 * 2 400 pour 1 250. L'effet ne cassait pas : il **s'aplatissait**, et cette
 * platitude ressemble à un effet mal réglé.
 *
 * ⭐ *Une règle vérifiée là où on la lit, et pas là où la valeur devient vraie,
 * ne garde que la moitié du chemin.*
 *
 * @param fondu Le `transitiontime` voulu, en **dixièmes de seconde**.
 * @param cadence L'attente réelle du tour suivant, en millisecondes.
 */
export function fonduTenable(fondu: number, cadence: number): number {
    if (!Number.isFinite(fondu) || fondu <= 0) return 0;
    if (!Number.isFinite(cadence) || cadence <= 0) return fondu;

    /* Une marge d'un dixième : le fondu doit finir **avant** la commande
       suivante, pas juste au même instant. `Math.floor` fait le reste. */
    const plafond = Math.floor(cadence / 100) - 1;
    return Math.max(0, Math.min(fondu, plafond));
}

/** Le nom qu'on propose pour une copie : « Torche (copie) », puis (copie 2)… */
export function nomDeLaCopie(nomSource: string, nomsPris: readonly string[]): string {
    const base = `${nomSource} (copie)`;
    if (!nomsPris.includes(base)) return base;
    for (let n = 2; n < 100; n++) {
        const essai = `${nomSource} (copie ${n})`;
        if (!nomsPris.includes(essai)) return essai;
    }
    return `${base} ${Date.now()}`;
}

/**
 * L'identifiant d'effet que porte une variante.
 *
 * ⚠️ **Préfixé, et ce préfixe est un contrat.** Le moteur doit pouvoir dire,
 * d'un seul regard sur le nom, s'il a affaire à un effet du catalogue ou à une
 * variante — sinon il chercherait un `case` qui n'existe pas et ne ferait
 * **rien**, sans message. *Une porte qui ouvre sur rien*, comme le dit le
 * contrôle du catalogue.
 */
export const PREFIXE_VARIANTE = 'variante:';

export const estUneVariante = (effet: string | undefined | null): boolean =>
    typeof effet === 'string' && effet.startsWith(PREFIXE_VARIANTE);

export const identifiantDeVariante = (id: string): string => `${PREFIXE_VARIANTE}${id}`;

export const idDepuisLIdentifiant = (effet: string): string =>
    effet.slice(PREFIXE_VARIANTE.length);
