import { etapeBornee, DUREE_MINIMALE_MS, type EtapeDEffet } from './effetDAtelier';

/**
 * **Ce qu'un modèle rend quand on lui demande un effet — et ce qu'on en garde.**
 *
 * ⛔ **La validation est le cœur, comme pour l'ambiance composée du 19/09.** Un
 * modèle qui invente ne lève aucune erreur : il rend des nombres plausibles et
 * faux. Une durée de 20 ms emballe le pont, un fondu de trois secondes sur une
 * étape qui en dure une vise une couleur que la lampe n'atteindra jamais, et
 * « bleu nuit » n'est pas une couleur pour une ampoule.
 *
 * ⭐ *La forme est garantie par le schéma imposé au décodeur ; le contenu est
 * vérifié ici.* Les deux sont nécessaires — le schéma dit qu'il y a un nombre,
 * pas qu'il est jouable.
 */

/** Ce que le décodeur doit produire — imposé au modèle, pas espéré de lui. */
export const SCHEMA_DE_L_EFFET = {
    type: 'object',
    properties: {
        nom: { type: 'string' },
        justification: { type: 'string' },
        alea: { type: 'number' },
        etapes: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    couleur: { type: 'string' },
                    brillance: { type: 'number' },
                    duree: { type: 'number' },
                    fondu: { type: 'number' },
                },
                required: ['couleur', 'brillance', 'duree', 'fondu'],
            },
        },
    },
    required: ['nom', 'justification', 'alea', 'etapes'],
} as const;

/** La proposition telle qu'elle arrive — chaque champ peut manquer ou mentir. */
export interface EffetPropose {
    nom?: unknown;
    justification?: unknown;
    alea?: unknown;
    etapes?: { couleur?: unknown; brillance?: unknown; duree?: unknown; fondu?: unknown }[];
}

/**
 * **Le nombre d'étapes qu'on accepte.**
 *
 * ⚠️ Le plafond n'est pas une contrainte technique, c'est une contrainte de
 * lecture : au-delà d'une douzaine, la liste ne se relit plus et l'aperçu ne
 * montre plus rien. *Un effet qu'on ne peut plus retoucher n'est plus un effet
 * d'atelier, c'est un effet subi.*
 */
export const ETAPES_MAXIMUM = 12;

const HEXADECIMAL = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `#abc` devient `#aabbcc` : le moteur ne lit que la forme longue. */
const hexLong = (couleur: string): string =>
    couleur.length === 4
        ? `#${couleur[1]}${couleur[1]}${couleur[2]}${couleur[2]}${couleur[3]}${couleur[3]}`
        : couleur;

/**
 * **Les étapes qu'on garde d'une proposition.**
 *
 * ⛔ **Une étape sans couleur lisible est JETÉE, pas repeinte en blanc.** C'est
 * le choix qui sépare ce contrôle de `etapeBornee`, qui, lui, protège une
 * saisie humaine : le meneur qui tape mal voit du blanc et corrige, alors qu'un
 * blanc glissé au milieu d'un orage passerait pour une intention. *Une étape
 * manquante se voit ; une étape fausse se croit.*
 *
 * Tout le reste — plancher de durée, fondu ramené à la durée, brillance en
 * pourcentage — repasse par les bornes ordinaires : **il n'y a pas deux façons
 * de borner une étape.**
 */
export function etapesDeLaProposition(
    proposition: EffetPropose | null | undefined,
): EtapeDEffet[] {
    const brutes = Array.isArray(proposition?.etapes) ? proposition.etapes : [];

    return brutes
        .filter(e => typeof e?.couleur === 'string' && HEXADECIMAL.test(e.couleur.trim()))
        .slice(0, ETAPES_MAXIMUM)
        .map(e => etapeBornee({
            couleur: hexLong((e.couleur as string).trim().toLowerCase()),
            brillance: Number(e.brillance),
            /* Une durée absente vaut le plancher, jamais zéro : zéro ferait une
               boucle sans attente, et le pont serait noyé en une seconde. */
            duree: Number(e.duree) || DUREE_MINIMALE_MS,
            fondu: Number(e.fondu),
        }));
}

/**
 * **Le désordre proposé, ramené dans ses bornes.**
 *
 * ⚠️ Absent, il vaut **25** et non zéro. Un modèle qui oublie ce champ rendrait
 * sinon une boucle parfaitement régulière — *et une boucle parfaitement
 * régulière ressemble à une machine, pas à une flamme.* Le défaut de l'atelier
 * est le même, pour la même raison.
 */
export function aleaDeLaProposition(proposition: EffetPropose | null | undefined): number {
    const brut = Number(proposition?.alea);
    if (!Number.isFinite(brut)) return 25;
    return Math.min(100, Math.max(0, Math.round(brut)));
}

/** Le nom de l'effet, borné : quelques mots, et jamais vide. */
export function nomDeLEffetPropose(propose: unknown, defaut: string): string {
    if (typeof propose !== 'string') return defaut;
    const propre = propose.trim().replace(/^[«"']+|[»"']+$/g, '').trim();
    if (!propre) return defaut;
    return propre.split(/\s+/).slice(0, 5).join(' ');
}

/** La phrase qui dit ce que l'effet fait, ou rien du tout. */
export function justificationDeLaProposition(proposition: EffetPropose | null | undefined): string {
    return typeof proposition?.justification === 'string' ? proposition.justification.trim() : '';
}
