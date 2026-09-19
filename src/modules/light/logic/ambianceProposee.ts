import { CATALOGUE_DES_EFFETS, HORS_CATALOGUE } from './catalogueDesEffets';
import type { HueLight, HueLightState } from '../useLightStore';

/**
 * **Ce que l'IA rend quand on lui demande une ambiance — et comment on s'en
 * méfie.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA VALIDATION EST LE CŒUR DE CE MODULE, ET NON UN DÉTAIL
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un modèle qui invente un nom d'effet ne provoque **aucune erreur** : le moteur
 * ne trouve pas son `case`, la boucle n'est jamais lancée, et la lampe reste
 * simplement fixe. *Une ambiance à moitié muette ressemble à une ambiance
 * ratée, pas à un défaut* — et c'est le genre de chose qu'on ne découvre qu'en
 * séance, quand rien ne se rattrape.
 *
 * Les quatre choses que ce fichier refuse :
 *
 * | Ce que le modèle peut rendre | Ce qu'on en fait |
 * | --- | --- |
 * | Un effet qui n'existe pas | `none` — la lampe reste fixe, mais **sur la couleur demandée** |
 * | Une couleur qui n'est pas un hexadécimal | la lampe est écartée : *on n'invente pas une teinte* |
 * | Une lampe qu'il a renommée ou inventée | on la rapproche par son nom, sinon on l'ignore |
 * | Une lampe qu'il a oubliée | elle est **éteinte**, explicitement |
 *
 * ⛔ **On ne demande jamais de coordonnées `xy` au modèle.** C'est l'espace CIE
 * du protocole Hue, avec un gamut par ampoule ; un modèle y répond des nombres
 * plausibles et faux. Il rend un hexadécimal, `hexToXy` fait le reste — c'est
 * du code qui existe et qui est juste.
 */

/** Une lampe, telle que le modèle est autorisé à la décrire. */
export interface LampeProposee {
    /** Le nom de la lampe, tel qu'il lui a été donné dans l'invite. */
    lampe: string;
    /** `#rrggbb`. */
    couleur: string;
    /** Un identifiant du catalogue, ou `none`. */
    effet: string;
    /** 0 à 100. Zéro éteint la lampe. */
    brillance: number;
}

export interface AmbianceProposee {
    nom: string;
    justification: string;
    lampes: LampeProposee[];
}

/** Le schéma imposé au décodeur — voir `generateJSON({ schema })`. */
export const SCHEMA_DE_L_AMBIANCE = {
    type: 'object',
    properties: {
        nom: { type: 'string' },
        justification: { type: 'string' },
        lampes: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    lampe: { type: 'string' },
                    couleur: { type: 'string' },
                    effet: { type: 'string' },
                    brillance: { type: 'number' },
                },
                required: ['lampe', 'couleur', 'effet', 'brillance'],
            },
        },
    },
    required: ['nom', 'justification', 'lampes'],
} as const;

/** Les identifiants d'effet que le moteur reconnaît vraiment. */
const EFFETS_CONNUS = new Set<string>([
    ...CATALOGUE_DES_EFFETS.map(e => e.valeur),
    ...HORS_CATALOGUE,
]);

const HEXADECIMAL = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** La plage de brillance du protocole Hue. 0 n'est pas une brillance, c'est une lampe éteinte. */
const BRI_MIN = 1;
const BRI_MAX = 254;

/**
 * **Un effet que le moteur sait jouer, ou rien.**
 *
 * ⛔ Rendre l'identifiant inventé tel quel donnerait une lampe qui *devrait*
 * scintiller et reste fixe, sans un mot. `none` est un mensonge plus honnête :
 * la lampe est fixe **et l'écran le dit**.
 */
export const effetReconnu = (valeur: unknown): string => {
    if (typeof valeur !== 'string') return 'none';
    const propre = valeur.trim().toLowerCase();
    return EFFETS_CONNUS.has(propre) ? propre : 'none';
};

/** `#a3f` et `#aa33ff` passent, le reste est refusé. */
export const couleurValide = (valeur: unknown): string | null => {
    if (typeof valeur !== 'string') return null;
    const propre = valeur.trim();
    return HEXADECIMAL.test(propre) ? propre.toLowerCase() : null;
};

/** Un pourcentage rendu en brillance Hue. Zéro reste zéro : il veut dire « éteinte ». */
export const brillanceDepuisPourcent = (valeur: unknown): number => {
    const pourcent = typeof valeur === 'number' && Number.isFinite(valeur) ? valeur : 100;
    if (pourcent <= 0) return 0;
    return Math.min(BRI_MAX, Math.max(BRI_MIN, Math.round((Math.min(100, pourcent) / 100) * BRI_MAX)));
};

/**
 * **La lampe que le modèle désignait**, rapprochée par son nom.
 *
 * On compare sur le nom réduit — sans accents, sans casse, sans ponctuation —
 * parce qu'un modèle rend « Lampe du Fond » là où le pont dit « Lampe du fond ».
 * *Refuser sur une majuscule ferait passer une ambiance entière pour un échec.*
 */
const reduire = (nom: string): string =>
    nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const lampeDesignee = (
    nom: string,
    lampes: Record<string, HueLight>,
): string | null => {
    const cherche = reduire(nom ?? '');
    if (!cherche) return null;

    const trouvee = Object.values(lampes).find(l => reduire(l.name) === cherche);
    return trouvee?.id ?? null;
};

/**
 * **La proposition, ramenée à des états de lampe que le pont acceptera.**
 *
 * @param proposition ce que le modèle a rendu, sans garantie
 * @param lampes les vraies lampes, pour retrouver qui est qui
 * @param versXy la conversion hexadécimal → CIE, fournie par le moteur
 *               (`hueEngine.hexToXy`) — *ce fichier reste pur*
 */
export function etatsDeLaProposition(
    proposition: AmbianceProposee | null | undefined,
    lampes: Record<string, HueLight>,
    versXy: (hex: string) => [number, number],
): Record<string, HueLightState> {
    const etats: Record<string, HueLightState> = {};
    if (!proposition) return etats;

    for (const brute of proposition.lampes ?? []) {
        const id = lampeDesignee(brute?.lampe ?? '', lampes);
        if (!id) continue;

        const couleur = couleurValide(brute?.couleur);
        if (!couleur) continue;

        const bri = brillanceDepuisPourcent(brute?.brillance);
        etats[id] = bri === 0
            /* Éteinte : ni couleur ni brillance — le pont refuse une commande
               de couleur sur une ampoule qu'on éteint. */
            ? { on: false, bri: BRI_MIN, effect: 'none' }
            : { on: true, bri, xy: versXy(couleur), effect: effetReconnu(brute?.effet) };
    }

    /*
      ⚠️ **Une lampe que le modèle a oubliée est éteinte, pas laissée telle
      quelle.** Une ambiance doit dire quelque chose de *toutes* les lampes :
      celle qu'on ne mentionne pas garderait ce qu'une autre scène y avait mis,
      et l'ambiance ne serait jamais deux fois la même. *Un oubli silencieux est
      pire qu'un noir assumé.*
    */
    for (const id of Object.keys(lampes)) {
        if (!etats[id]) etats[id] = { on: false, bri: BRI_MIN, effect: 'none' };
    }

    return etats;
}

/** Le nom de la tuile, borné : une tuile en porte deux à quatre mots. */
export const nomDeLAmbiance = (propose: unknown, defaut: string): string => {
    if (typeof propose !== 'string') return defaut;
    const propre = propose.trim().replace(/^[«"']+|[»"']+$/g, '').trim();
    return propre.length === 0 ? defaut : propre.slice(0, 40);
};
