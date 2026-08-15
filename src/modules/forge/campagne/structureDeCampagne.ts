/**
 * Lecture de la structure rendue par le carnet — la liste ordonnée des actes.
 *
 * **C'est la réponse la plus lourde de conséquences de tout l'atelier.** Elle
 * découpe les deux sujets interrogés acte par acte : un acte manquant, et ses
 * PNJ comme ses scènes ne seront jamais demandés. Un titre déformé, et la
 * requête suivante porte sur une partie que le livre ne connaît pas.
 *
 * **Le carnet rend la même demande sous des formes qu'on n'attend pas.** C'est
 * la leçon la plus chère du corpus de règles, rencontrée quatre fois : les hors
 * catégories en liste numérotée, les titres entre accents graves, les tableaux
 * **sans barres extérieures**, et la numérotation **en toutes lettres**
 * (« un. Résolution des jets »), qui a fait passer six sujets sur quatorze en
 * hors canevas avec leur vraie réponse. On lit donc ici les trois formes
 * connues — tableau bordé, tableau nu, liste numérotée — plutôt que de
 * n'attendre que celle du gabarit.
 */

export interface ActeLu {
    /** Rang tel qu'il sera écrit dans la trame. Contigu, à partir de zéro. */
    ordre: number;
    /** Le titre **tel que le livre l'écrit** : c'est lui qui bornera les requêtes. */
    titre: string;
    /** L'enjeu, en une ou deux phrases. */
    enjeu: string;
    /** Titres de section cités, pour amorcer la résolution des pages. */
    sections: string[];
}

/** Nettoie une cellule : gras, guillemets et espaces parasites. */
function cellule(valeur: string): string {
    return valeur.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Les nombres tels que le carnet numérote, **chiffres et lettres**.
 *
 * Relevé sur la charge réelle du 2026-08-14, le SRD Year Zero Engine :
 * `| **un. Résolution des jets** | oui | … |`. On ne retirait que les chiffres.
 */
const NOMBRES_EN_LETTRES = [
    'un', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit',
    'dix-neuf', 'vingt', 'premier', 'premiere', 'deuxieme', 'troisieme', 'quatrieme',
];

function sansAccent(valeur: string): string {
    return valeur.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().trim();
}

/**
 * Retire la numérotation de tête, chiffres ou lettres.
 *
 * **On ne retire QUE la numérotation, jamais le titre.** « Acte I — La Chute »
 * garde son « Acte I » : c'est le titre que le livre écrit, et c'est lui qui
 * doit repartir vers le carnet. On ne coupe que ce qui est suivi d'un point ou
 * d'une parenthèse fermante, la forme d'une puce.
 */
export function retirerLaNumerotation(valeur: string): string {
    const nu = valeur.trim();

    const enChiffres = /^\d+\s*[.)]\s+(.*)$/.exec(nu);
    if (enChiffres) return enChiffres[1].trim();

    const enLettres = /^([a-zA-ZÀ-ÿ-]+)\s*[.)]\s+(.*)$/.exec(nu);
    if (enLettres && NOMBRES_EN_LETTRES.includes(sansAccent(enLettres[1]))) {
        return enLettres[2].trim();
    }

    return nu;
}

/**
 * Les cellules d'une ligne de tableau markdown, barres extérieures ôtées.
 *
 * **Les barres extérieures sont facultatives, et le carnet s'en sert.** Sans
 * elles on exige au moins trois cellules : une phrase de prose contenant une
 * seule barre ne doit pas devenir une ligne de tableau.
 */
function cellulesDeLigne(ligne: string): string[] | null {
    const nu = ligne.trim();
    if (!nu.includes('|')) return null;
    if (/^\|?[\s|:-]+\|?$/.test(nu)) return null; // ligne de séparation

    const bordee = nu.startsWith('|');
    const cellules = nu.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cellule);
    if (!bordee && cellules.length < 3) return null;
    return cellules;
}

/** Vrai pour la ligne d'en-tête : « Ordre | Titre exact | … ». */
function estEntete(cellules: string[]): boolean {
    const premiere = sansAccent(cellules[0] ?? '');
    return premiere === 'ordre' || premiere === 'n' || premiere === 'numero';
}

/**
 * Découpe une liste de titres de section.
 *
 * **Les accents graves comptent** : le carnet Dune a rendu ses sections en
 * `` `Tests de compétence`, `Procédure des tests` ``, et sans les prendre en
 * charge la liste entière restait un seul titre.
 */
function decouperSections(valeur: string): string[] {
    if (!valeur || /^(—|-|n\/a|aucune?|rien)$/i.test(valeur.trim())) return [];
    return valeur
        .split(/\s*[;·]\s*|\s*,\s*(?=[`«"']|[A-ZÀ-Ý])/)
        .map(s => s.replace(/^[`«"'*\s]+|[`»"'*\s.]+$/g, '').trim())
        .filter(Boolean);
}

/**
 * Lit la structure d'une campagne dans la réponse du carnet.
 *
 * Ne lève jamais : une réponse illisible rend une liste vide, ce qui est un
 * résultat — l'atelier le montrera plutôt que de prétendre avoir compris. Perdre
 * la réponse coûterait une requête, et l'écran doit pouvoir la réafficher telle
 * quelle pour que le meneur tranche.
 *
 * **Le rang rendu est recalculé, jamais celui du carnet.** Il numérote parfois à
 * partir de zéro, saute une ligne, ou renumérote après un titre intercalaire ;
 * ce qui compte est l'ordre d'apparition, et c'est ce qu'on garde.
 */
export function lireLaStructure(contenu: string): ActeLu[] {
    const actes: ActeLu[] = [];
    const vus = new Set<string>();

    const ajouter = (titre: string, enjeu: string, sections: string[]) => {
        const propre = retirerLaNumerotation(titre).replace(/^[«"'`\s]+|[»"'`\s]+$/g, '').trim();
        if (!propre) return;
        // Un titre répété est une reformulation du carnet, pas un second acte :
        // deux actes de même titre produiraient deux fiches au même slug, et la
        // seconde effacerait la première.
        const clef = sansAccent(propre);
        if (vus.has(clef)) return;
        vus.add(clef);
        actes.push({ ordre: actes.length, titre: propre, enjeu: enjeu.trim(), sections });
    };

    for (const ligne of contenu.replace(/\r\n/g, '\n').split('\n')) {
        const cellules = cellulesDeLigne(ligne);

        if (cellules) {
            if (estEntete(cellules)) continue;
            // Colonnes attendues : Ordre | Titre exact | Enjeu | Sections. Une
            // ligne plus courte reste exploitable — un titre seul vaut mieux
            // qu'un acte perdu.
            const [, titre = '', enjeu = '', sections = ''] = cellules;
            ajouter(titre, enjeu, decouperSections(sections));
            continue;
        }

        /*
          Repli sur la liste numérotée : le carnet a rendu l'inventaire de Dune
          ainsi alors qu'on lui demandait un tableau, pendant qu'il rendait ceux
          d'Alien et de Blade Runner en tableau sans barres. Trois formes pour la
          même demande, et il n'en connaissait qu'une.
        */
        const puce = /^\s*(?:[-*•]\s*)?((?:\d+|[a-zA-ZÀ-ÿ-]+)\s*[.)]\s+.+)$/.exec(ligne);
        if (!puce) continue;
        const sansNumero = retirerLaNumerotation(puce[1]);
        if (sansNumero === puce[1].trim()) continue; // rien n'a été retiré : ce n'est pas une puce numérotée

        /*
          **On ne coupe PAS « titre — enjeu » ici, et c'est délibéré.**

          « Acte I — La Chute de Carthag » est un titre entier, et le tiret lui
          appartient : le couper rendrait « Acte I », qui ne désigne rien dans le
          livre. Or ce titre borne les onze requêtes suivantes — une variante et
          elles repartent toutes sur la campagne entière.

          Dans un tableau, les colonnes tranchent. Dans une liste plate, rien ne
          distingue un tiret de titre d'un tiret de séparation, et **un titre
          faux coûte infiniment plus qu'un enjeu manquant** : l'enjeu se retape
          en dix secondes, le titre se paie en dix appels au carnet. On garde
          donc la ligne entière.
        */
        ajouter(sansNumero, '', []);
    }

    return actes;
}
