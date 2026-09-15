import type { TableEntry } from '../types';
import { decouperLaPortee } from './formeDeLaTable';

/**
 * **Coller une table de manuel, et la voir se ranger.**
 *
 * Demandé par David le 2026-09-15, après l'Atelier : la troisième couche de la
 * proposition. Jusqu'ici, alimenter Table-OS voulait dire taper du JSON, ou
 * copier un prompt dans ChatGPT et recoller sa réponse.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'IL LIT, ET CE QU'IL REFUSE DE DEVINER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Deux régimes, reconnus au contenu :
 *
 * | Ce qu'on colle | Ce qui en sort |
 * | --- | --- |
 * | `11-16  Fuite d'oxygène` | les bornes sont **lues** |
 * | `Fuite d'oxygène` (une ligne par résultat) | les bornes sont **calculées** sur le dé |
 *
 * ⛔ **Le texte d'une ligne va dans le TITRE, entier.** Découper « titre » et
 * « ambiance » sur un point ou un tiret serait une devinette, et *un contrôle
 * qui se trompe est pire qu'un contrôle absent* : on lirait à voix haute des
 * titres coupés au milieu. La répartition en titre / description / effet est le
 * travail de la passe IA, qui **propose** et se relit.
 *
 * ⭐ **Ce qui n'est PAS une devinette** : une ligne sans numéro qui en suit une
 * numérotée appartient à celle-ci. Les tables de manuel sont écrites comme ça —
 * un résultat, puis son paragraphe. Elle devient la **description**.
 *
 * ⚠️ **Un tiret n'est une plage que s'il a des chiffres des deux côtés.**
 * `11 — Fuite d'oxygène` est l'entrée 11, pas une plage de 11 à rien. C'est la
 * ponctuation la plus courante des tables françaises, et la confondre
 * produirait une table entière décalée.
 */

export type RegimeDeCollage =
    /** Les bornes sont écrites dans le texte. */
    | 'bornes'
    /** Une ligne, un résultat ; les bornes se calculent. */
    | 'lignes'
    /**
     * Une table déjà au format de Table-OS.
     *
     * ⛔ **Il manquait, et c'était le trou le plus bête** : le prompt livré dans
     * `databases/tables/MedFan/` fait produire du JSON à ChatGPT, et l'Atelier —
     * qui écrit du JSON — ne savait pas en lire. *Un import qui refuse le format
     * que l'application elle-même produit.* Mesuré avant de le combler : un
     * JSON collé donnait huit entrées de charabia (`11-15 {`, `16-24 "name":…`).
     */
    | 'json';

export interface ResultatDuCollage {
    entrees: TableEntry[];
    /** Le nom porté par la source, quand elle en porte un (JSON). */
    nom?: string;
    /** Le dé porté par la source, quand elle en porte un (JSON). */
    de?: string;
    /** Le régime effectivement employé — l'écran le montre, et on peut le forcer. */
    regime: RegimeDeCollage;
    /**
     * Ce qui n'a pas pu être rattaché. *Un import qui jette en silence laisse
     * croire que la table est complète.*
     */
    ignorees: string[];
}

/** `1-3`, `1–3`, `11 - 16` : des chiffres des DEUX côtés. */
const PLAGE = /^(\d+)\s*[-–—]\s*(\d+)\s*(.*)$/;
/** `7`, `7.`, `7)`, `7 :`, `7 —` suivis du texte. */
const SIMPLE = /^(\d+)\s*[.):|—–-]?\s+(.*)$/;
/** `7` seul sur sa ligne — le texte vient en dessous. */
const NUMERO_SEUL = /^(\d+)\s*[.):|—–-]?\s*$/;

/**
 * Nettoie une ligne de ce que le copier-coller traîne.
 *
 * Les tableaux Markdown et les PDF sont les deux sources réelles : l'un met des
 * barres verticales, l'autre des tabulations.
 */
function nettoyer(ligne: string): string {
    return ligne
        .replace(/\t+/g, ' ')
        .replace(/^\s*\|/, '')
        .replace(/\|\s*$/, '')
        .replace(/\s*\|\s*/g, '  ')
        .trim();
}

/** Les lignes utiles, dans l'ordre. */
function lignesUtiles(texte: string): string[] {
    return (texte ?? '')
        .split(/\r?\n/)
        .map(nettoyer)
        .filter(l => l !== '' && !/^[-–—|\s]+$/.test(l));
}

/**
 * **Le régime que ce texte appelle.**
 *
 * La moitié des lignes suffit : un manuel numérote toutes ses entrées, une liste
 * d'oracle n'en numérote aucune. *Entre les deux, on préfère lire des bornes
 * qui existent que d'en inventer.*
 */
export function regimeDuTexte(texte: string): RegimeDeCollage {
    /* Le JSON d'abord : il se reconnaît à coup sûr, là où les deux autres
       régimes se décident à la majorité. */
    if (lireDuJson(texte)) return 'json';

    const lignes = lignesUtiles(texte);
    if (lignes.length === 0) return 'lignes';

    const numerotees = lignes.filter(l => PLAGE.test(l) || SIMPLE.test(l) || NUMERO_SEUL.test(l)).length;
    return numerotees * 2 >= lignes.length ? 'bornes' : 'lignes';
}

/**
 * Range un collage en entrées.
 *
 * `de` ne sert qu'au régime `lignes`, pour calculer les bornes. Sans lui — ou
 * si le dé n'a pas assez de valeurs — les entrées sortent quand même, numérotées
 * une par une : *mieux vaut une table à recadrer qu'un import qui refuse.*
 */
export function lireUnCollage(
    texte: string,
    options: { de?: string; regime?: RegimeDeCollage } = {},
): ResultatDuCollage {
    const regime = options.regime ?? regimeDuTexte(texte);

    if (regime === 'json') {
        /* Forcé sur du non-JSON, on ne fabrique rien : l'écran dira « 0 entrée »
           plutôt que de ranger du charabia. */
        return lireDuJson(texte) ?? { entrees: [], regime: 'json', ignorees: [] };
    }

    const lignes = lignesUtiles(texte);

    if (regime === 'lignes') {
        const entrees: TableEntry[] = lignes.map(l => ({
            min: 0, max: 0, title: l, description: '',
        }));
        return { entrees: poserLesBornes(entrees, options.de), regime, ignorees: [] };
    }

    const entrees: TableEntry[] = [];
    const ignorees: string[] = [];

    for (const ligne of lignes) {
        const plage = ligne.match(PLAGE);
        if (plage) {
            entrees.push({
                min: Number(plage[1]), max: Number(plage[2]),
                title: plage[3].trim(), description: '',
            });
            continue;
        }

        const seul = ligne.match(NUMERO_SEUL);
        if (seul) {
            entrees.push({ min: Number(seul[1]), max: Number(seul[1]), title: '', description: '' });
            continue;
        }

        const simple = ligne.match(SIMPLE);
        if (simple) {
            entrees.push({
                min: Number(simple[1]), max: Number(simple[1]),
                title: simple[2].trim(), description: '',
            });
            continue;
        }

        /*
          Une ligne sans numéro appartient à l'entrée du dessus : c'est ainsi que
          les manuels écrivent un résultat suivi de son paragraphe. Avant la
          première entrée numérotée, en revanche, elle n'appartient à personne —
          c'est le titre de la table, ou l'en-tête d'une colonne.
        */
        const derniere = entrees.at(-1);
        if (!derniere) { ignorees.push(ligne); continue; }

        if (!derniere.title) derniere.title = ligne;
        else derniere.description = derniere.description ? `${derniere.description}\n${ligne}` : ligne;
    }

    return { entrees, regime, ignorees };
}

/**
 * Pose des bornes sur des entrées qui n'en ont pas.
 *
 * ⚠️ **Le dé d'abord** : `decouperLaPortee` connaît les valeurs réellement
 * tirables, et un `d66` ne se numérote pas de 1 à 36. Sans dé exploitable, on
 * numérote 1, 2, 3… — l'Atelier montrera le trou, et « Découper » le refermera
 * dès que le meneur aura choisi son dé.
 */
function poserLesBornes(entrees: TableEntry[], de?: string): TableEntry[] {
    const plages = decouperLaPortee(de, entrees.length);
    if (plages.length === entrees.length) {
        return entrees.map((e, i) => ({ ...e, ...plages[i] }));
    }
    return entrees.map((e, i) => ({ ...e, min: i + 1, max: i + 1 }));
}

/* ─────────────────────────────────────────────────────────────────────────────
   LE JSON
   ───────────────────────────────────────────────────────────────────────── */

/** Un entier, ou `null` — les modèles rendent volontiers des nombres en chaînes. */
function entier(valeur: unknown): number | null {
    const n = typeof valeur === 'string' ? Number(valeur.trim()) : valeur;
    return typeof n === 'number' && Number.isInteger(n) ? n : null;
}

/**
 * **Une table déjà écrite au format de Table-OS.**
 *
 * Rend `null` si ce n'est pas du JSON exploitable — l'appelant retombe alors sur
 * la lecture de texte, qui n'est pas pire qu'avant.
 *
 * ⚠️ **On accepte l'objet complet ET le tableau nu.** Un modèle rend parfois
 * directement la liste des entrées ; la refuser pour une accolade manquante
 * ferait recommencer une conversation entière.
 *
 * ⛔ **Une entrée sans bornes lisibles est écartée, pas rafistolée** — même règle
 * que la passe IA : *une entrée perdue se voit dans la bande, une entrée
 * déplacée ne se voit nulle part.*
 */
export function lireDuJson(texte: string): ResultatDuCollage | null {
    const brut = (texte ?? '').trim();
    if (!brut.startsWith('{') && !brut.startsWith('[')) return null;

    let objet: unknown;
    try { objet = JSON.parse(brut); } catch { return null; }

    const liste = Array.isArray(objet)
        ? objet
        : Array.isArray((objet as Record<string, unknown>)?.entries)
            ? (objet as Record<string, unknown>).entries as unknown[]
            : null;
    if (!liste) return null;

    const entrees: TableEntry[] = [];
    const ignorees: string[] = [];

    for (const item of liste) {
        const e = (item ?? {}) as Record<string, unknown>;
        const min = entier(e.min);
        const max = entier(e.max);
        if (min === null || max === null) {
            ignorees.push(JSON.stringify(item ?? null).slice(0, 80));
            continue;
        }
        entrees.push({
            min,
            max: Math.max(min, max),
            title: String(e.title ?? '').trim(),
            description: String(e.description ?? '').trim(),
            ...(e.effect ? { effect: String(e.effect).trim() } : {}),
            ...(Array.isArray(e.butin) ? { butin: e.butin as TableEntry['butin'] } : {}),
        });
    }

    const entete = Array.isArray(objet) ? {} : objet as Record<string, unknown>;
    return {
        entrees,
        regime: 'json',
        ignorees,
        ...(typeof entete.name === 'string' && entete.name.trim() ? { nom: entete.name.trim() } : {}),
        ...(typeof entete.dice === 'string' && entete.dice.trim() ? { de: entete.dice.trim() } : {}),
    };
}
