/**
 * Résolveur titre de section → page, adossé aux index extraits des livres.
 *
 * **Pourquoi il existe.** Les numéros de page rendus par NotebookLM ne renvoient
 * pas au livre : neuf fiches Dune sur dix-sept citaient des pages au-delà de la
 * dernière page de l'ouvrage. Les gabarits v3 ne demandent donc plus de pages
 * mais des **titres de section** — que le carnet rapporte fidèlement, puisqu'ils
 * sont dans le texte. La pagination se résout ici, localement et sans modèle.
 *
 * **La confrontation a deux issues, et la seconde vaut autant que la première.**
 * Un titre retrouvé donne une page vérifiée. Un titre introuvable donne un
 * soupçon d'invention — et rien d'autre, aujourd'hui, n'attrape ce qui est faux.
 *
 * Module volontairement sans dépendance à `electron` : il tourne dans le projet
 * de tests `node`.
 */

import path from 'node:path';
import fs from 'node:fs';
import AdmZip from 'adm-zip';

export interface EntreeIndex {
    /** Titre tel qu'il apparaît dans l'index, après recollage éventuel. */
    titre: string;
    page: number;
}

export interface IndexLivre {
    systeme: string;
    /** Fichiers d'où proviennent les entrées, pour la traçabilité. */
    sources: string[];
    entrees: EntreeIndex[];
    /**
     * Fichiers **présents mais dont aucune entrée n'a pu être tirée**.
     *
     * *Un dossier vide et un dossier illisible ne se ressemblent pas.* Sans
     * cette liste, les deux rendaient « aucun index chargé » — et l'atelier
     * demandait de déposer un index déjà déposé.
     */
    ignores: string[];
}

export type StatutResolution = 'exact' | 'approche' | 'introuvable';

export interface Resolution {
    /** Titre demandé, tel que la fiche le cite. */
    demande: string;
    statut: StatutResolution;
    page?: number;
    /** Entrée d'index retenue — utile quand le rapprochement est approché. */
    entree?: string;
    /** 1 pour un rapprochement exact, décroissant ensuite. */
    score: number;
}

/**
 * Clé de comparaison : sans accents, sans casse, **sans aucun espace**.
 *
 * Supprimer les espaces règle d'un coup le défaut d'extraction le plus pénible —
 * les titres d'affichage éclatés lettre à lettre (`E T TO M B E N T L E S`), qui
 * se réduisent alors au même mot que leur forme normale.
 */
export function clef(valeur: string): string {
    return valeur
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

/** Levenshtein borné : au-delà de `plafond`, on rend `plafond + 1` sans finir. */
export function distance(a: string, b: string, plafond: number): number {
    if (Math.abs(a.length - b.length) > plafond) return plafond + 1;
    let precedent = Array.from({ length: b.length + 1 }, (_, i) => i);

    for (let i = 1; i <= a.length; i++) {
        const courant = [i];
        let minLigne = i;
        for (let j = 1; j <= b.length; j++) {
            const cout = a[i - 1] === b[j - 1] ? 0 : 1;
            const v = Math.min(courant[j - 1] + 1, precedent[j] + 1, precedent[j - 1] + cout);
            courant.push(v);
            if (v < minLigne) minLigne = v;
        }
        if (minLigne > plafond) return plafond + 1;
        precedent = courant;
    }
    return precedent[b.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Lecture des sources
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrait les paragraphes d'un `.docx`, en recollant les fragments atomisés.
 *
 * La conversion PDF → Word éclate les titres d'affichage en paragraphes d'une
 * seule lettre : le début d'`ALIEN_le_jeu_de_rôle.docx` est littéralement
 * « L », « E », « J », « E », « U ». On recolle les suites de fragments courts.
 */
export function paragraphesDocx(cheminOuXml: string, estXml = false): string[] {
    const xml = estXml ? cheminOuXml : new AdmZip(cheminOuXml).readAsText('word/document.xml');

    const bruts = xml.split(/<\/w:p>/).map(p =>
        [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(m => m[1]).join(''));

    const out: string[] = [];
    let tampon: string[] = [];
    const vider = () => { if (tampon.length) { out.push(tampon.join('')); tampon = []; } };

    for (const brut of bruts) {
        const t = brut.trim();
        if (!t) { vider(); continue; }
        if (t.length <= 2) { tampon.push(t.length === 1 ? t : `${t} `); continue; }
        vider();
        out.push(t);
    }
    vider();
    return out.filter(Boolean);
}

/** Fragments d'une cellule, séparés par `<br>`, débarrassés du gras. */
function fragments(cellule: string): string[] {
    return cellule.split('<br>').map(f => f.replace(/\*+/g, '').trim()).filter(Boolean);
}

const estUnTitre = (f: string) => /[a-zA-ZÀ-ÿ]{3}/.test(f) && !/^\d/.test(f);
const estUnePage = (f: string) => /^\d{1,3}$/.test(f);

/**
 * Apparie une colonne de titres avec la colonne de pages qui la suit.
 *
 * **La forme que prend un index de livre passé par une conversion Markdown.**
 * Un index imprimé est composé sur plusieurs colonnes ; le convertisseur en fait
 * une table où les titres d'une colonne tombent dans une cellule et leurs pages
 * dans la cellule voisine, chacun à son rang :
 *
 * ```
 * |**Cafés connectés**<br>**Catégories de portées**|**206**<br>**064**|
 * ```
 *
 * Relevé le 2026-08-10 sur `Blade Runner_Index.md` : **281 paires** que les
 * règles ligne à ligne ne voyaient pas, l'index n'en rendant que 63 sur 344.
 *
 * L'égalité des longueurs est le garde-fou. Deux colonnes qui ne s'alignent pas
 * ne sont pas une colonne de titres et sa colonne de pages : on préfère ne rien
 * rendre plutôt que d'apparier au hasard — une entrée d'index fausse est pire
 * qu'une entrée absente, puisqu'elle donne une page à un titre qui n'est pas là.
 */
function apparierColonnes(ligne: string, pousser: (t: string, p: string) => void): void {
    if (!ligne.startsWith('|')) return;
    const cellules = ligne.split('|').slice(1, -1);

    for (let i = 0; i < cellules.length - 1; i++) {
        const titres = fragments(cellules[i]);
        const pages = fragments(cellules[i + 1]);
        if (titres.length === 0 || titres.length !== pages.length) continue;
        if (!titres.every(estUnTitre) || !pages.every(estUnePage)) continue;
        for (let k = 0; k < titres.length; k++) pousser(titres[k], pages[k]);
    }
}

/**
 * Extrait les paires titre → page d'un texte d'index.
 *
 * Quatre formes rencontrées sur les trois livres, aucune commune : cellule
 * `|TITRE<br>PAGE|` (Alien), colonnes appariées (Blade Runner), table à deux
 * colonnes `|**TITRE**|**PAGE**|`, points de conduite `Titre.......PAGE` (Dune).
 * On les accepte toutes : c'est le convertisseur qui décide, pas nous.
 */
export function extraireEntrees(lignes: readonly string[]): EntreeIndex[] {
    const entrees: EntreeIndex[] = [];
    /**
     * Les quatre règles se recouvrent, et c'est voulu — chacune rattrape ce que
     * les autres laissent. `|**SOUVENIR CLÉ**|**030**|` satisfait aussi bien la
     * table à deux colonnes que l'appariement de colonnes. On dédoublonne donc
     * ici plutôt que de rendre les règles exclusives : les rendre exclusives
     * reviendrait à choisir laquelle a raison, et aucune n'a raison partout.
     */
    const vues = new Set<string>();

    const pousser = (titre: string, page: string) => {
        const t = titre.replace(/[.\s…*]+$/, '').replace(/^[.\s…*]+/, '').trim();
        const p = Number(page);
        // Une page à quatre chiffres n'est pas une page : c'est un index de carnet.
        if (t.length < 3 || !/[a-zA-ZÀ-ÿ]{3}/.test(t) || p <= 0 || p >= 1000) return;
        const empreinte = `${clef(t)}|${p}`;
        if (vues.has(empreinte)) return;
        vues.add(empreinte);
        entrees.push({ titre: t, page: p });
    };

    for (const ligne of lignes) {
        // Le gras est facultatif AUTOUR DE LA PAGE : sans cette tolérance, un
        // index dont le convertisseur met les pages en gras — `<br>**217**` —
        // ne rendait rien du tout par cette règle. 46 entrées sur Blade Runner.
        for (const m of ligne.matchAll(/([^|<>\r\n]{3,80}?)\s*<br>\s*\*{0,2}(\d{1,3})\*{0,2}(?![\d*])/g)) pousser(m[1], m[2]);
        apparierColonnes(ligne, pousser);
        for (const m of ligne.matchAll(/\|\s*\*{0,2}([^|*]{3,80}?)\*{0,2}\s*\|\s*\*{0,2}(\d{1,3})\*{0,2}\s*\|/g)) pousser(m[1], m[2]);
        for (const m of ligne.matchAll(/([A-Za-zÀ-ÿ][^|<>]{2,80}?)[.\s…]{3,}(\d{1,3})\b/g)) pousser(m[1], m[2]);
    }

    return entrees;
}

/**
 * Nombre d'entrées en dessous duquel un repli n'est pas un index.
 *
 * **C'est le garde-fou de la cinquième forme, et il vaut plus qu'elle.** Un
 * index alphabétique est une liste DENSE — celui de Rêves de Dragons couvre
 * quatorze pages. Une poignée de correspondances trouvées dans un fichier n'est
 * pas un index maigre : c'est de la prose où le hasard a mis un nombre après
 * quelques mots. On préfère alors ne rien rendre, parce qu'*une entrée d'index
 * fausse est pire qu'une entrée absente* — elle donne une page à un titre qui
 * n'est pas là, et le résolveur la servira avec le même aplomb qu'une vraie.
 */
const DENSITE_MINIMALE = 40;

/**
 * Cinquième forme : **l'index alphabétique nu**, `Titre 80, 88, 91-94`.
 *
 * **Pourquoi elle est à part.** Les quatre règles de `extraireEntrees` se
 * recouvrent et se rattrapent sans risque : chacune exige un balisage — un
 * `<br>`, une barre de table, trois points de conduite — qu'un texte ordinaire
 * ne porte pas. Celle-ci n'exige qu'**un espace** entre un titre et un nombre,
 * ce que la moindre phrase contient. Servie au même rang que les autres, elle
 * transformerait n'importe quel livre en index.
 *
 * Relevé par David le 2026-08-21 : l'index de Rêves de Dragons, 977 lignes et
 * 31 Ko déposés dans `index/`, rendait **zéro entrée**. Son convertisseur écrit
 * `Maladie 18, 25, 91 -94` — pas de balisage, un seul espace — et l'application
 * lui répondait *« aucun index chargé, déposez le sommaire et l'index du
 * livre »*, c'est-à-dire de refaire ce qu'il venait de faire.
 *
 * **Trois garde-fous, et ils sont la raison d'être de cette fonction :**
 *
 * 1. **Elle ne sert qu'en repli**, quand les quatre formes balisées n'ont rien
 *    rendu. Un corpus qui marche aujourd'hui ne peut donc pas se dégrader.
 * 2. **Elle exige une SUITE de pages séparées par des virgules.** C'est la
 *    signature d'une entrée d'index, et c'est ce qui écarte « attaque avec 3
 *    dés » : un nombre isolé au fil du texte n'est pas une pagination.
 * 3. **Un titre d'index est COURT** — six mots, soixante caractères, aucun
 *    chiffre. C'est ce qui protège du sommaire en pavé continu, où titres et
 *    numéros s'enchaînent sur cent quarante caractères : le candidat trop long
 *    est rejeté au lieu de produire un titre de paragraphe.
 *
 * Et `DENSITE_MINIMALE` par-dessus, appliquée par `chargerIndex`.
 */
export function extraireIndexNu(lignes: readonly string[]): EntreeIndex[] {
    const entrees: EntreeIndex[] = [];
    const vues = new Set<string>();

    /** Un titre d'index tient en une poignée de mots et ne porte pas de chiffre. */
    const estUnTitreCourt = (brut: string): boolean => {
        const t = brut.replace(/^[\s\-–—•*.,;:)\]]+/, '').trim();
        if (t.length < 3 || t.length > 60 || /\d/.test(t)) return false;
        if (!/[a-zA-ZÀ-ÿ]{3}/.test(t)) return false;
        /*
          **Une parenthèse orpheline trahit un fragment, pas un titre.** Un index
          imprimé sur deux colonnes déborde d'une colonne sur l'autre : la fin de
          « Mariol 408 - 409 (ill.), 418 (ill.) » retombe devant le nombre de la
          colonne voisine, et donne « ill.) » comme titre. Le compte des
          parenthèses le dit sans avoir à connaître le mot.
        */
        const ouvrantes = (t.match(/\(/g) ?? []).length;
        const fermantes = (t.match(/\)/g) ?? []).length;
        if (ouvrantes !== fermantes) return false;
        /*
          **Un titre porte au moins un mot plein.** « Chapitre 3 sur 12 » laissait
          passer « sur » devant le 12 : trois lettres suffisaient. Les entrées
          réelles d'un index ont un substantif — « Marche », « Maladie »,
          « Agilité » —, jamais une préposition seule.
        */
        const mots = t.split(/\s+/);
        if (!mots.some(m => /[a-zA-ZÀ-ÿ]{4}/.test(m))) return false;
        return mots.length <= 6;
    };

    /**
     * La ligne porte-t-elle une pagination d'index ?
     *
     * Au moins deux nombres séparés par une virgule, ou une plage — `18, 25` ou
     * `91 -94`. Une phrase qui cite un nombre n'en a pas.
     */
    const porteUnePagination = (ligne: string): boolean =>
        /\b\d{1,3}\s*(,\s*\d{1,3}|[-–]\s*\d{1,3})/.test(ligne);

    for (const ligne of lignes) {
        if (!porteUnePagination(ligne)) continue;

        for (const m of ligne.matchAll(/([A-Za-zÀ-ÿ][^\d|<>]{1,59}?)\s+(\d{1,3})(?!\d)/g)) {
            if (!estUnTitreCourt(m[1])) continue;
            const titre = m[1].replace(/^[\s\-–—•*.,;:)\]]+/, '').replace(/[\s.,;:]+$/, '').trim();
            const page = Number(m[2]);
            if (page <= 0 || page >= 1000) continue;
            const empreinte = `${clef(titre)}|${page}`;
            if (vues.has(empreinte)) continue;
            vues.add(empreinte);
            entrees.push({ titre, page });
        }
    }

    return entrees;
}

/**
 * Charge tous les index d'un système depuis `docs/systems/<id>/index/`.
 *
 * **Un fichier écarté se dit désormais.** La version d'avant faisait `continue`
 * en silence sur un format non reconnu, si bien qu'un index de 31 Ko déposé dans
 * le bon dossier laissait `sources` vide — et l'atelier affichait *« aucun index
 * chargé, déposez le sommaire et l'index du livre »*, c'est-à-dire demandait de
 * refaire ce qui venait d'être fait. Relevé par David le 2026-08-21.
 *
 * *Un dossier vide et un dossier illisible ne se ressemblent pas*, et c'est
 * exactement la distinction que `ignores` porte. Elle ne change rien au calcul :
 * elle change ce que l'écran peut dire.
 */
export function chargerIndex(racineDocs: string, systeme: string): IndexLivre {
    const dossier = path.join(racineDocs, 'systems', systeme, 'index');
    const livre: IndexLivre = { systeme, sources: [], entrees: [], ignores: [] };
    if (!fs.existsSync(dossier)) return livre;

    for (const nom of fs.readdirSync(dossier).sort()) {
        const complet = path.join(dossier, nom);
        const ext = path.extname(nom).toLowerCase();

        let lignes: string[] | null = null;
        if (ext === '.md' || ext === '.txt') lignes = fs.readFileSync(complet, 'utf8').split(/\r?\n/);
        else if (ext === '.docx') lignes = paragraphesDocx(complet);
        if (!lignes) continue;   // ni un texte ni un docx : ce n'est pas un index manqué

        let trouvees = extraireEntrees(lignes);

        /*
          **Le repli ne sert que si les formes balisées ont échoué**, et il doit
          alors ramener un index ENTIER. Une poignée d'entrées n'est pas un index
          maigre : c'est de la prose où quelques nombres suivent quelques mots.
          Voir `extraireIndexNu`, qui porte les trois autres garde-fous.
        */
        if (trouvees.length === 0) {
            const repli = extraireIndexNu(lignes);
            if (repli.length >= DENSITE_MINIMALE) trouvees = repli;
        }

        if (trouvees.length === 0) {
            livre.ignores.push(nom);
            continue;
        }

        livre.sources.push(nom);
        livre.entrees.push(...trouvees);
    }

    return livre;
}

// ─────────────────────────────────────────────────────────────────────────────
// Résolution
// ─────────────────────────────────────────────────────────────────────────────

/** Tolérance : un caractère par tranche de sept, au moins un. */
function plafondPour(longueur: number): number {
    return Math.max(1, Math.floor(longueur / 7));
}

export interface Resolveur {
    resoudre(titre: string): Resolution;
    readonly taille: number;
}

/**
 * Construit un résolveur sur un index.
 *
 * Le rapprochement approché n'est pas un confort : l'extraction PDF **perd des
 * ligatures** — « conflit » devient `confit`, « difficulté » devient
 * `diffculté`. Une égalité de chaînes échouerait précisément sur les termes les
 * plus structurants.
 */
export function creerResolveur(livre: IndexLivre): Resolveur {
    const parClef = new Map<string, EntreeIndex>();
    for (const e of livre.entrees) {
        const k = clef(e.titre);
        if (!k) continue;
        // À doublon, on garde la page la plus basse : la première occurrence
        // d'un titre est celle où la section commence.
        const existant = parClef.get(k);
        if (!existant || e.page < existant.page) parClef.set(k, e);
    }
    const clefs = [...parClef.keys()];

    return {
        taille: parClef.size,
        resoudre(titre: string): Resolution {
            const k = clef(titre);
            if (!k) return { demande: titre, statut: 'introuvable', score: 0 };

            const exact = parClef.get(k);
            if (exact) {
                return { demande: titre, statut: 'exact', page: exact.page, entree: exact.titre, score: 1 };
            }

            const plafond = plafondPour(k.length);
            let meilleur: { clef: string; d: number } | null = null;
            for (const candidat of clefs) {
                const d = distance(k, candidat, plafond);
                if (d <= plafond && (!meilleur || d < meilleur.d)) meilleur = { clef: candidat, d };
                if (meilleur?.d === 0) break;
            }

            if (!meilleur) return { demande: titre, statut: 'introuvable', score: 0 };

            const e = parClef.get(meilleur.clef)!;
            return {
                demande: titre,
                statut: 'approche',
                page: e.page,
                entree: e.titre,
                score: 1 - meilleur.d / k.length,
            };
        },
    };
}

/**
 * Plage de pages réellement attestée par l'index.
 *
 * Utilisable **sans attendre les `sections:`** : une fiche qui cite une page
 * au-delà de la dernière page attestée ne cite pas une page, mais un index
 * interne de carnet. C'est ce contrôle qui a révélé neuf fiches Dune citant
 * jusqu'à la page 1279 pour un livre qui s'arrête à 328.
 *
 * **Ce qu'il ne prouve pas** : une page fausse mais dans la plage reste
 * indétectable. L'absence de dépassement n'est donc pas un certificat.
 */
export function plageDePages(livre: IndexLivre): { min: number; max: number } | null {
    if (livre.entrees.length === 0) return null;
    const pages = livre.entrees.map(e => e.page);
    return { min: Math.min(...pages), max: Math.max(...pages) };
}

/** Pages citées par une fiche qui dépassent la pagination attestée du livre. */
export function pagesInvraisemblables(contenuFiche: string, livre: IndexLivre): number[] {
    const plage = plageDePages(livre);
    if (!plage) return [];

    const citees = new Set<number>();
    for (const m of contenuFiche.matchAll(/\bp(?:\.|ages?)\s*([\d,\s–-]+)/gi)) {
        for (const n of m[1].matchAll(/\d+/g)) citees.add(Number(n[0]));
    }
    return [...citees].filter(p => p > plage.max).sort((a, b) => a - b);
}

/** Lit le champ `sections:` du frontmatter d'une fiche. */
export function sectionsCitees(contenuFiche: string): string[] {
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(contenuFiche);
    if (!fm) return [];
    const ligne = /^sections\s*:\s*(.+)$/m.exec(fm[1]);
    if (!ligne) return [];
    return ligne[1]
        .replace(/^["']|["']$/g, '')
        .split(/\s*[;·]\s*|\s*,\s(?=[A-ZÀ-Ý«])/)
        .map(s => s.replace(/^[«"']\s*|\s*[»"']$/g, '').trim())
        .filter(Boolean);
}

/** Ce que la revue a besoin de savoir pour juger les citations d'une fiche. */
export interface Verification {
    /**
     * Un index a-t-il pu être chargé pour ce corpus ?
     *
     * **La distinction qui compte.** Sans ce drapeau, un corpus sans index et
     * une fiche aux titres inventés rendraient tous deux « zéro section
     * résolue » — et l'écran accuserait la fiche d'un manque qui n'est pas le
     * sien. Une mesure impossible n'est pas une mesure mauvaise.
     */
    indexDisponible: boolean;
    /** Fichiers d'index ayant contribué, pour que le verdict soit traçable. */
    sources: string[];
    /**
     * Fichiers **présents dans `index/` dont rien n'a pu être tiré**.
     *
     * Sans eux, « aucun index chargé » se disait de la même façon qu'on ait
     * déposé un fichier ou non — et l'écran demandait alors de déposer un index
     * déjà déposé. *Un dossier vide et un dossier illisible ne se ressemblent
     * pas.*
     */
    ignores: string[];
    resolutions: Resolution[];
    /** Pages citées au-delà de la pagination attestée. */
    pagesDouteuses: number[];
    plage: { min: number; max: number } | null;
}

/**
 * Confronte les citations d'une fiche à l'index du livre.
 *
 * Rassemble les trois contrôles que la revue doit présenter ensemble : les
 * titres de section résolus en pages, les pages citées en clair qui dépassent le
 * livre, et la pagination attestée qui sert de référence aux deux.
 *
 * **Ne juge pas, informe.** Une section introuvable peut venir d'un index
 * incomplet autant que d'un titre inventé — trancher demande de connaître le
 * livre, ce qu'aucun de ces contrôles ne fait.
 */
export function verifierLesCitations(livre: IndexLivre, contenuFiche: string): Verification {
    if (livre.entrees.length === 0) {
        return {
            indexDisponible: false,
            sources: [],
            // Ce qui distingue « rien déposé » de « déposé, mais illisible ».
            ignores: livre.ignores,
            resolutions: [], pagesDouteuses: [], plage: null,
        };
    }
    const resolveur = creerResolveur(livre);
    return {
        indexDisponible: true,
        sources: livre.sources,
        ignores: livre.ignores,
        resolutions: sectionsCitees(contenuFiche).map(s => resolveur.resoudre(s)),
        pagesDouteuses: pagesInvraisemblables(contenuFiche, livre),
        plage: plageDePages(livre),
    };
}
