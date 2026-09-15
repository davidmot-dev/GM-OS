import type { TableData } from '../types';

/**
 * **Ce qu'un dé de Table-OS peut sortir, et ce qu'une table doit couvrir.**
 *
 * ⛔ **Le défaut qui a motivé ce module, trouvé le 2026-09-15 en comptant** :
 * `Alien/blessures_critiques.json` déclarait **`1d66`**. La forme juxtaposée
 * s'écrit `d66` — *un seul chiffre, répété, et rien devant*. Le moteur lisait
 * donc un dé **uniforme à 66 faces**, quand les entrées vont de 11 à 66 par
 * paires de d6.
 *
 * **45 % des jets ne tombaient sur aucune entrée.** Et `resolveEntry` ne dit
 * jamais qu'il n'a rien trouvé : il rend la plus proche. *Un 17 sur la table
 * des blessures critiques rendait l'entrée 66* — la pire du jeu, lue à voix
 * haute, sans une ligne de journal.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE MODULE PLUTÔT QU'UNE RELECTURE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un trou de couverture est **invisible en relisant le fichier** : les bornes se
 * suivent, chaque entrée est plausible, et il faut tenir la liste des valeurs
 * possibles du dé dans sa tête pour voir ce qui manque. À la table, il ne produit
 * pas une erreur — *il produit un résultat plausible et faux.*
 *
 * ⚠️ **Une seule lecture de la formule, partagée avec `TableEngine`.** Deux
 * lectures auraient divergé le jour où l'une accepte `1d66` et pas l'autre —
 * c'est-à-dire exactement le défaut ci-dessus, mais en pire : le contrôle aurait
 * alors déclaré saine une table que le moteur casse.
 */

/** Comment la formule se lit. */
export type GenreDeDe =
    /** `2d6`, `1d100`, `1d20+2` — somme de dés identiques. */
    | 'standard'
    /** `d66`, `d444` — des chiffres collés, pas une somme. */
    | 'juxtapose'
    /** `20` — une valeur fixe, sans hasard. */
    | 'fixe'
    /** Rien de reconnaissable. `TableEngine.rollDice` rend alors **1**, toujours. */
    | 'illisible';

export interface FormuleDeDe {
    genre: GenreDeDe;
    /** Nombre de dés (standard) ou de chiffres (juxtaposé). */
    nombre: number;
    /** Faces d'un dé. `0` si illisible. */
    faces: number;
    /** Ajouté à la somme. Toujours `0` hors du genre standard. */
    modificateur: number;
}

/** Au-delà, on ne dresse plus la liste des valeurs : on dit qu'elle est trop grande. */
export const ENUMERATION_MAXIMALE = 2000;

const JUXTAPOSE = /^d([468])\1+$/;
const STANDARD = /^(\d+)?d(\d+)([+-]\d+)?$/;
const FIXE = /^\d+$/;

/**
 * Lit une formule de dé. **L'unique lecture** — `TableEngine` s'en sert pour
 * lancer, le contrôle pour vérifier.
 */
export function lireLaFormule(formule: string | undefined | null): FormuleDeDe {
    const f = (formule ?? '').toLowerCase().trim();

    const juxtapose = f.match(JUXTAPOSE);
    if (juxtapose) {
        return {
            genre: 'juxtapose',
            nombre: f.length - 1,
            faces: Number(juxtapose[1]),
            modificateur: 0,
        };
    }

    const standard = f.match(STANDARD);
    if (standard) {
        return {
            genre: 'standard',
            nombre: Number(standard[1] ?? 1),
            faces: Number(standard[2]),
            modificateur: Number(standard[3] ?? 0),
        };
    }

    if (FIXE.test(f)) return { genre: 'fixe', nombre: 1, faces: Number(f), modificateur: 0 };

    return { genre: 'illisible', nombre: 0, faces: 0, modificateur: 0 };
}

/**
 * Toutes les valeurs que ce dé peut sortir, en ordre croissant.
 *
 * `null` quand la formule est illisible **ou** que la liste dépasse
 * `ENUMERATION_MAXIMALE` — *un contrôle qui tronque en silence ment*, et
 * l'appelant doit pouvoir distinguer « aucune valeur » de « trop de valeurs ».
 *
 * ⚠️ **Un dé juxtaposé n'est pas un intervalle** : `d66` ne peut pas sortir 17,
 * ni 20, ni 30. C'est toute la différence avec un `1d66`, et c'est elle qu'on
 * ne voit pas en relisant un fichier.
 */
export function valeursPossibles(formule: string | undefined | null): number[] | null {
    const de = lireLaFormule(formule);

    if (de.genre === 'illisible') return null;
    if (de.genre === 'fixe') return [de.faces];

    if (de.genre === 'juxtapose') {
        let valeurs: number[] = [0];
        for (let chiffre = 0; chiffre < de.nombre; chiffre++) {
            const suivantes: number[] = [];
            for (const debut of valeurs) {
                for (let face = 1; face <= de.faces; face++) suivantes.push(debut * 10 + face);
            }
            valeurs = suivantes;
        }
        return valeurs.sort((a, b) => a - b);
    }

    const min = de.nombre + de.modificateur;
    const max = de.nombre * de.faces + de.modificateur;
    if (max - min + 1 > ENUMERATION_MAXIMALE) return null;

    const valeurs: number[] = [];
    for (let v = min; v <= max; v++) valeurs.push(v);
    return valeurs;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LE CONTRÔLE
   ───────────────────────────────────────────────────────────────────────── */

export type GraviteDuConstat =
    /** La table se comportera mal, et sans le dire. */
    | 'faute'
    /** Probablement une erreur, mais l'auteur peut l'avoir voulu. */
    | 'doute'
    /** Rien à corriger — une remarque qui aide à lire la table. */
    | 'note';

export interface Constat {
    gravite: GraviteDuConstat;
    /** Stable, pour que l'écran choisisse son icône sans lire le texte. */
    code: string;
    message: string;
    /** Les valeurs concernées, quand la remarque en désigne. */
    valeurs?: number[];
}

/** Combien de fois chaque valeur est couverte par les entrées. */
function couverture(table: TableData): Map<number, number> {
    const compte = new Map<number, number>();
    for (const entree of table.entries ?? []) {
        const { min, max } = entree;
        if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) continue;
        for (let v = min; v <= max; v++) compte.set(v, (compte.get(v) ?? 0) + 1);
    }
    return compte;
}

/**
 * **Tout ce qui cloche dans une table**, du plus grave au plus anodin.
 *
 * ⚠️ **Ce qui n'est PAS un défaut, et qu'il a fallu apprendre en comptant** :
 * des entrées **au-delà de la portée du dé**. `Alien/test_de_panique` déclare
 * `1d6` et va jusqu'à 20, parce que le jet de panique ajoute le stress — et
 * Table-OS a un champ « Modificateur » exprès. Les sentinelles `-99` et `99`
 * relèvent du même idiome. *Ma première passe les avait comptées comme des
 * fautes : sept tables sur neuf accusées à tort.* Elles ressortent en `note`.
 */
export function controlerLaTable(table: TableData): Constat[] {
    const constats: Constat[] = [];
    const entrees = table.entries ?? [];

    if (!table.name?.trim()) {
        constats.push({ gravite: 'doute', code: 'sans-nom', message: 'La table n’a pas de nom.' });
    }

    if (entrees.length === 0) {
        constats.push({
            gravite: 'faute',
            code: 'sans-entree',
            message: 'La table n’a aucune entrée : tout tirage lèvera une erreur.',
        });
    }

    const de = lireLaFormule(table.dice);

    if (de.genre === 'illisible') {
        constats.push({
            gravite: 'faute',
            code: 'de-illisible',
            message: `« ${table.dice ?? ''} » n’est pas une formule reconnue : le moteur rendra 1 à tous les tirages.`,
        });
    }

    /*
      ⛔ **Le contrôle qui aurait sauvé les deux tables Alien.** `1d66` est une
      formule parfaitement valide — c'est là le piège : elle est lue comme un dé
      uniforme à 66 faces, sans que rien ne proteste, et les deux tiers des jets
      tombent alors dans le vide. On le signale par son nom.
    */
    const juxtaposeAvecCompte = (table.dice ?? '').toLowerCase().trim().match(/^(\d+)d([468])\2+$/);
    if (juxtaposeAvecCompte) {
        const voulu = (table.dice ?? '').trim().replace(/^\d+/, '');
        constats.push({
            gravite: 'faute',
            code: 'juxtapose-avec-compte',
            message: `« ${table.dice} » est lu comme un dé ordinaire à ${de.faces} faces. `
                + `Un dé juxtaposé s’écrit sans nombre devant : « ${voulu} ».`,
        });
    }

    for (const [rang, entree] of entrees.entries()) {
        const { min, max } = entree;
        if (!Number.isInteger(min) || !Number.isInteger(max)) {
            constats.push({
                gravite: 'faute',
                code: 'bornes-non-entieres',
                message: `L’entrée n° ${rang + 1} a des bornes qui ne sont pas des entiers.`,
            });
        } else if (min > max) {
            constats.push({
                gravite: 'faute',
                code: 'bornes-inversees',
                message: `L’entrée n° ${rang + 1} va de ${min} à ${max} : elle ne sera jamais tirée.`,
            });
        }
        if (!entree.title?.trim()) {
            constats.push({
                gravite: 'doute',
                code: 'entree-sans-titre',
                message: `L’entrée n° ${rang + 1} n’a pas de titre.`,
            });
        }
        for (const objet of entree.butin ?? []) {
            const q = objet.quantite;
            if (typeof q === 'string' && q.trim() !== '' && lireLaFormule(q).genre === 'illisible') {
                constats.push({
                    gravite: 'doute',
                    code: 'quantite-illisible',
                    message: `« ${q} » n’est pas une quantité lisible (entrée n° ${rang + 1}, `
                        + `« ${objet.name} ») : elle vaudra 1.`,
                });
            }
        }
    }

    const compte = couverture(table);

    const chevauchements = [...compte].filter(([, n]) => n > 1).map(([v]) => v).sort((a, b) => a - b);
    if (chevauchements.length > 0) {
        constats.push({
            gravite: 'faute',
            code: 'chevauchement',
            message: `${chevauchements.length} valeur(s) sont couvertes par plusieurs entrées : `
                + 'seule la première sera jamais tirée.',
            valeurs: chevauchements,
        });
    }

    const possibles = valeursPossibles(table.dice);
    if (possibles) {
        const trous = possibles.filter(v => !compte.has(v));
        if (trous.length > 0) {
            const part = Math.round((100 * trous.length) / possibles.length);
            constats.push({
                gravite: 'faute',
                code: 'trou',
                message: `${trous.length} valeur(s) sur ${possibles.length} (${part} %) ne tombent sur `
                    + 'aucune entrée. Le moteur rendra l’entrée la plus proche, sans le dire.',
                valeurs: trous,
            });
        }

        const possiblesSet = new Set(possibles);
        const horsPortee = [...compte.keys()].filter(v => !possiblesSet.has(v)).sort((a, b) => a - b);
        if (horsPortee.length > 0) {
            constats.push({
                gravite: 'note',
                code: 'hors-portee',
                message: `${horsPortee.length} valeur(s) couvertes sortent de la portée du dé : `
                    + 'elles ne sont atteignables qu’avec un modificateur.',
                valeurs: horsPortee,
            });
        }
    }

    const ordre = { faute: 0, doute: 1, note: 2 } as const;
    return constats.sort((a, b) => ordre[a.gravite] - ordre[b.gravite]);
}

/** Vrai si la table se comportera mal — ce que la garde du dépôt refuse. */
export function laTableEstFautive(table: TableData): boolean {
    return controlerLaTable(table).some(c => c.gravite === 'faute');
}

/* ─────────────────────────────────────────────────────────────────────────────
   LE DÉCOUPAGE
   ───────────────────────────────────────────────────────────────────────── */

/** Une plage de bornes, telle qu'une entrée la porte. */
export interface Plage { min: number; max: number }

/**
 * **Répartir la portée d'un dé en `n` plages jointives.**
 *
 * Le geste qu'on fait à la main en créant une table, et celui où l'on se trompe :
 * on écrit `1-5, 6-10, 11-15` sur un d20 et on oublie les cinq dernières
 * valeurs. Ici la couverture est complète **par construction** — la somme des
 * plages est exactement la portée du dé.
 *
 * ⚠️ **Un dé juxtaposé se découpe sur ses valeurs, pas sur son intervalle.**
 * Découper `d66` en deux ne donne pas `11-38` et `39-66` : 38 ne peut pas
 * sortir. On coupe la **liste** des 36 valeurs possibles, et les plages
 * s'appuient sur des valeurs réelles.
 *
 * ⚠️ **Le reste va aux premières plages**, pas aux dernières : sur un d20 en 3,
 * ça donne 7/7/6. *Les premières entrées d'une table sont les plus banales ;
 * c'est là qu'une valeur de plus se remarque le moins.*
 *
 * Rend `[]` si le dé est illisible, trop large pour être énuméré, ou si `n`
 * dépasse le nombre de valeurs — *on ne fabrique pas des plages vides pour
 * satisfaire un compte.*
 */
export function decouperLaPortee(formule: string | undefined | null, n: number): Plage[] {
    const valeurs = valeursPossibles(formule);
    if (!valeurs || !Number.isInteger(n) || n < 1 || n > valeurs.length) return [];

    const base = Math.floor(valeurs.length / n);
    const reste = valeurs.length % n;

    const plages: Plage[] = [];
    let curseur = 0;
    for (let i = 0; i < n; i++) {
        const taille = base + (i < reste ? 1 : 0);
        plages.push({ min: valeurs[curseur], max: valeurs[curseur + taille - 1] });
        curseur += taille;
    }
    return plages;
}
