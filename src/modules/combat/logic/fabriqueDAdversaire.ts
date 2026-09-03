import type { SheetField } from '../../../data/defaultSheetTemplates';
import { archetypeParId, rangParId, type PropositionDeChamps } from './archetypes';

/**
 * **La fabrique d'adversaires — des chiffres tirés dans les bornes du jeu.**
 *
 * *Demandé par David le 2026-09-03.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * D'OÙ VIENNENT LES CHIFFRES, ET POURQUOI PAS DU MODÈLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Du gabarit de fiche du jeu, et de nulle part ailleurs.** Chaque champ y
 * porte déjà tout ce qu'il faut :
 *
 * - `defaultValue` : ce que vaut un personnage ordinaire de ce jeu (4 chez Dune) ;
 * - `max` : le plafond (8 chez Dune) ;
 * - `options` : les échelons, quand le jeu compte en lettres (Blade Runner).
 *
 * Un adversaire fabriqué ainsi est **jouable par construction** : ses valeurs
 * sont dans l'échelle, sa santé sera calculée par la formule du pilote, son
 * initiative par la sienne. *C'est la leçon la plus chère de ce projet, payée
 * sur les jets de dés puis sur les pilotes : aucun nombre du livre n'entre par
 * un modèle de langage — ce qui décide d'une mécanique se lit dans le gabarit.*
 *
 * Le modèle, lui, sait faire ce que cette fabrique ne saura jamais : un nom, une
 * silhouette, une façon de se battre. Il vient **après**, sur des chiffres déjà
 * posés, et son échec ne coûte qu'un adversaire sans prose.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE TIRAGE EST REPRODUCTIBLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `fabriquer` ne touche pas à `Math.random` : elle reçoit son hasard. Sans quoi
 * on ne pourrait pas éprouver qu'une brute est vraiment plus forte qu'un
 * figurant — *une génération aléatoire non reproductible ne se teste pas, elle
 * se regarde.*
 */

/** Une source de hasard, pour que le tirage soit rejouable au banc. */
export type Hasard = () => number;

/** Un générateur pseudo-aléatoire déterministe, à partir d'une graine. */
export function hasardDeGraine(graine: number): Hasard {
    let etat = graine >>> 0;
    return () => {
        /* xorshift32 : court, sans dépendance, et suffisant pour du jeu. */
        etat ^= etat << 13; etat >>>= 0;
        etat ^= etat >> 17;
        etat ^= etat << 5; etat >>>= 0;
        return etat / 0xffffffff;
    };
}

export interface DemandeDAdversaire {
    /** Les champs du gabarit de fiche à remplir. */
    champs: SheetField[];
    /** Ce que l'archétype favorise et néglige, après validation du meneur. */
    repartition: PropositionDeChamps;
    archetypeId: string;
    rangId: string;
    hasard: Hasard;
}

/** Ce que la fabrique rend : de quoi remplir une fiche, et de quoi l'expliquer. */
export interface AdversaireFabrique {
    sheetData: Record<string, number | string | boolean>;
    /** Les champs réellement poussés vers le haut, pour que l'écran le montre. */
    pointsForts: string[];
    /** Ce qui a été laissé volontairement bas. */
    pointsFaibles: string[];
}

/** Les types de champs qui portent une valeur chiffrée qu'on sait tirer. */
const TYPES_CHIFFRES = new Set(['number', 'gauge', 'rating']);

/**
 * Tire un entier autour d'une moyenne, borné.
 *
 * **Deux tirages moyennés, et pas un seul** : un tirage plat rend un adversaire
 * sur cinq complètement raté et un sur cinq surhumain. En moyennant, les
 * extrêmes deviennent rares sans devenir impossibles — *ce qu'on attend d'une
 * fabrique, c'est une variété crédible, pas du bruit.*
 */
function tirerAutour(centre: number, amplitude: number, min: number, max: number, hasard: Hasard): number {
    const brut = centre + ((hasard() + hasard()) / 2 - 0.5) * 2 * amplitude;
    return Math.max(min, Math.min(max, Math.round(brut)));
}

/**
 * Fabrique un adversaire à partir du gabarit d'un jeu.
 *
 * Les champs textuels sont laissés vides : *un nom inventé par une formule est
 * pire qu'un nom absent*, et c'est le travail du meneur ou du modèle.
 */
export function fabriquer(demande: DemandeDAdversaire): AdversaireFabrique {
    const rang = rangParId(demande.rangId);
    const archetype = archetypeParId(demande.archetypeId);
    const sheetData: Record<string, number | string | boolean> = {};
    const pointsForts: string[] = [];
    const pointsFaibles: string[] = [];

    for (const champ of demande.champs) {
        const favorise = demande.repartition.favorises.includes(champ.id);
        const neglige = demande.repartition.negliges.includes(champ.id);

        if (TYPES_CHIFFRES.has(champ.type)) {
            const moyenne = typeof champ.defaultValue === 'number' ? champ.defaultValue : 1;
            const plafond = champ.max ?? Math.max(moyenne * 2, moyenne + 3);
            /*
              Le plancher vaut 1 et non 0 : dans presque tous ces jeux, un score
              à zéro veut dire « incapable », ce qui n'est pas la même chose que
              « mauvais ». Un adversaire incapable de bouger n'est pas un
              adversaire.
            */
            const plancherDuJeu = 1;

            let centre = moyenne;
            if (favorise) centre += rang.ecart;
            else if (neglige) centre -= rang.retrait;

            /* Le rang tient aussi un plancher : un boss n'est nulle part nul. */
            const plancher = Math.max(plancherDuJeu, moyenne + rang.plancher);

            const valeur = tirerAutour(centre, 1, Math.min(plancher, plafond), plafond, demande.hasard);
            sheetData[champ.id] = valeur;

            if (favorise && valeur > moyenne) pointsForts.push(champ.label);
            if (neglige && valeur < moyenne) pointsFaibles.push(champ.label);
            continue;
        }

        if (champ.type === 'select' && champ.options?.length) {
            /*
              **On suppose les options rangées de la meilleure à la pire.** C'est
              le cas des échelles en lettres — « A (D12), B (D10), C (D8), D (D6) »
              chez Blade Runner —, et c'est la seule convention qu'un gabarit
              porte réellement. Si un jeu les range dans l'autre sens, le meneur
              le verra du premier coup d'œil sur le premier adversaire : *une
              hypothèse visible est réparable, une hypothèse cachée ne l'est pas.*
            */
            const dernier = champ.options.length - 1;
            const milieu = dernier / 2;
            let position = milieu;
            if (favorise) position -= rang.ecart;
            else if (neglige) position += rang.retrait;

            const tire = tirerAutour(position, 0.75, 0, dernier, demande.hasard);
            sheetData[champ.id] = champ.options[tire];

            if (favorise && tire < milieu) pointsForts.push(champ.label);
            if (neglige && tire > milieu) pointsFaibles.push(champ.label);
            continue;
        }

        if (champ.type === 'checkbox') {
            sheetData[champ.id] = false;
            continue;
        }

        /*
          Texte, zone de texte, formule : on ne remplit pas. Une formule se
          recalcule toute seule, et le reste appartient au meneur.
        */
        if (champ.type !== 'formula') sheetData[champ.id] = '';
    }

    /* Le résumé sert l'écran ; il ne doit pas être vide sur un archétype neutre. */
    if (!pointsForts.length && archetype.motsFavorises.length === 0) {
        pointsForts.push('sans relief — c’est le propos');
    }

    return { sheetData, pointsForts, pointsFaibles };
}

/**
 * Le nom d'un exemplaire au sein d'un groupe.
 *
 * *Détail, mais il compte à la table :* trois « Pillard » identiques dans
 * l'ordre du tour sont ingérables. On numérote, et seulement s'il y en a
 * plusieurs.
 */
export function nommerLExemplaire(base: string, index: number, total: number): string {
    return total > 1 ? `${base} ${index + 1}` : base;
}
