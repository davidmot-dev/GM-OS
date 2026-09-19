import type { HueLight } from '../useLightStore';

/**
 * Une lampe telle que le pont la décrit. C'est la forme brute de `GET /lights`,
 * réduite à ce dont la relecture a besoin.
 */
export interface LampeDuPont {
    name: string;
    type: string;
    state: {
        on: boolean;
        bri: number;
        xy?: [number, number];
        ct?: number;
        /** Le pont dit `false` quand il n'a plus de nouvelles de la lampe. */
        reachable?: boolean;
    };
}

/** Les réglages qui étaient en vigueur quand GM-OS a parlé au pont pour la dernière fois. */
export interface ReglagesDeLecture {
    /** Le curseur global, en pourcentage — *toute la pièce, ce soir*. */
    pourcentGlobal: number;
    /** L'intensité de la tuile jouée, en pourcentage. */
    pourcentDeScene?: number;
    /** Les lampes que cette tuile commande — les seules à qui son intensité s'applique. */
    lampesDeLaScene?: readonly string[];
}

/**
 * **La tolérance de l'arrondi, en points de brillance Hue.**
 *
 * Comparer deux brillances au nombre près se solderait par une divergence à
 * chaque lecture : notre calcul arrondit, le micrologiciel du pont arrondit
 * aussi, et une lampe en fondu peut être rapportée à un pas de sa cible.
 */
export const TOLERANCE_DE_BRILLANCE = 2;

/** La plage de brillance du protocole Hue. 0 n'est pas une brillance, c'est une lampe éteinte. */
const BRI_MIN = 1;
const BRI_MAX = 254;

const pourcentLisible = (valeur: number | undefined, defaut: number): number =>
    Number.isFinite(valeur) ? (valeur as number) : defaut;

/**
 * **Ce que le magasin doit retenir après avoir relu les lampes sur le pont.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CETTE FONCTION EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le magasin ne tenait **que le compte de ce que GM-OS avait envoyé**. Tant que
 * le pont n'obéit qu'à l'application, ce miroir est fidèle ; mais le meneur
 * règle aussi ses lampes depuis son téléphone — et alors capturer une tuile
 * n'enregistrait pas la pièce, elle enregistrait *ce que GM-OS croyait savoir
 * d'elle*, parfois vieux d'une soirée. **Un bouton nommé « Capturer l'état
 * actuel des lampes » qui capture autre chose est pire qu'un bouton absent :
 * rien ne dit qu'il s'est trompé.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LA BRILLANCE DU PONT N'EST PAS CELLE DU MAGASIN
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le magasin garde une brillance **nominale** ; le pont, lui, ne connaît que ce
 * qu'il a reçu — c'est-à-dire cette nominale déjà passée par le curseur global
 * et par celui de la tuile (voir `brillanceEffective`). Recopier le pont dans
 * le magasin sans y penser **rabaisserait le nominal d'un cran à chaque
 * lecture**, et deux allers-retours suffiraient à éteindre une scène par
 * étapes. *C'est exactement ce dont `setLightState` prévient depuis toujours.*
 *
 * D'où la règle, qui tient en une phrase : **ou bien le pont dit ce que nous
 * lui avons envoyé — et rien n'a bougé, on garde le nominal — ou bien il dit
 * autre chose, et c'est une valeur de la pièce, qu'on ramène au nominal en
 * défaisant le curseur global.**
 *
 * ⚠️ On défait le curseur **global** seulement, jamais celui de la tuile : le
 * nominal du magasin est celui d'un geste direct sur une lampe (le pied de page
 * envoie sans intensité de tuile), et c'est cette définition-là qu'affichent
 * les curseurs. L'intensité d'une tuile reste ce qu'elle est — *un
 * multiplicateur que le meneur a posé exprès*.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ DEUX LAMPES QU'ON NE RELIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * | Cas | Pourquoi | Ce qu'on garde |
 * | --- | --- | --- |
 * | La lampe **joue un effet logiciel** | sa brillance est l'image d'un battement, pas un réglage : la relire fige une bougie sur un creux au hasard | l'état d'avant l'effet, gardé par le magasin |
 * | La lampe est **injoignable** | le pont répète le dernier état connu, parfois vieux de plusieurs jours | le nôtre, tout aussi vieux mais au moins cohérent |
 *
 * *Le pont fait foi sur ce qu'il voit, pas sur ce qu'il se rappelle.*
 *
 * @param duPont ce que `GET /lights` vient de rendre — **il fait foi sur la liste des lampes**
 * @param miroir ce que le magasin tient aujourd'hui
 * @param reglages les curseurs en vigueur, qui disent ce que le pont aurait dû rapporter
 */
export const lampesRelues = (
    duPont: Record<string, LampeDuPont>,
    miroir: Record<string, HueLight>,
    reglages: ReglagesDeLecture,
): Record<string, HueLight> => {
    const global = pourcentLisible(reglages.pourcentGlobal, 100) / 100;
    const intensite = pourcentLisible(reglages.pourcentDeScene, 100) / 100;
    const deLaScene = new Set(reglages.lampesDeLaScene ?? []);

    const relues: Record<string, HueLight> = {};

    for (const [id, lampe] of Object.entries(duPont)) {
        const local = miroir[id];
        /* Le nom et le type appartiennent au pont, toujours : une lampe
           renommée dans l'application Hue doit se renommer ici aussi. */
        const identite = { id, name: lampe.name, type: lampe.type };

        const effetLocal = local?.state.effect;
        if (local && effetLocal && effetLocal !== 'none') {
            relues[id] = { ...identite, state: { ...local.state } };
            continue;
        }

        if (local && lampe.state.reachable === false) {
            relues[id] = { ...identite, state: { ...local.state } };
            continue;
        }

        relues[id] = {
            ...identite,
            state: {
                on: lampe.state.on,
                bri: brillanceNominale(lampe.state.bri, local, {
                    /*
                      **Le facteur de comparaison, et lui seul, porte l'intensité
                      de la tuile** — et uniquement pour les lampes qu'elle
                      commande. Sans ce tri, une lampe réglée au pied de page
                      pendant qu'une tuile à 60 % joue passerait pour déplacée,
                      et une lampe de la tuile passerait pour déplacée à chaque
                      lecture : *c'est la dérive par étapes, déguisée.*
                    */
                    facteurEnvoye: global * (deLaScene.has(id) ? intensite : 1),
                    facteurDeRetour: global,
                }),
                /* Le pont renvoie toujours ses deux couleurs ; une lampe blanche
                   n'a pas de `xy`, et on ne lui en invente pas. */
                xy: lampe.state.xy ?? local?.state.xy,
                ct: lampe.state.ct ?? local?.state.ct,
                /* Les effets sont suivis ici, pas là-bas : le `effect` du pont
                   ne connaît que ses deux animations natives. */
                effect: 'none',
            },
        };
    }

    return relues;
};

/**
 * La brillance à retenir pour une lampe que le pont vient de décrire.
 *
 * `facteurEnvoye` dit ce que le pont *aurait dû* rapporter si personne n'avait
 * touché à la lampe ; `facteurDeRetour` dit par quoi diviser une valeur qui ne
 * vient pas de nous. Ils diffèrent — voir la règle plus haut.
 */
const brillanceNominale = (
    duPont: number,
    local: HueLight | undefined,
    facteurs: { facteurEnvoye: number; facteurDeRetour: number },
): number => {
    if (!Number.isFinite(duPont)) return local?.state.bri ?? BRI_MAX;

    /*
      **Un curseur à zéro ne se défait pas.** Tout ce qui est parti vers le pont
      valait zéro : aucune division ne rend le nominal qu'il y avait derrière.
      On garde donc ce qu'on sait, et on ne devine pas.
    */
    if (facteurs.facteurDeRetour <= 0) return local?.state.bri ?? duPont;

    if (local) {
        const attendue = Math.round(local.state.bri * facteurs.facteurEnvoye);
        if (Math.abs(attendue - duPont) <= TOLERANCE_DE_BRILLANCE) return local.state.bri;
    }

    return Math.min(BRI_MAX, Math.max(BRI_MIN, Math.round(duPont / facteurs.facteurDeRetour)));
};
