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

/**
 * Extrait les paires titre → page d'un texte d'index.
 *
 * Trois formes rencontrées sur les trois livres, aucune commune :
 * cellule `|TITRE<br>PAGE|` (Alien), table à deux colonnes
 * `|**TITRE**|**PAGE**|` (Blade Runner), points de conduite
 * `Titre.......PAGE` (Dune). On les accepte toutes.
 */
export function extraireEntrees(lignes: readonly string[]): EntreeIndex[] {
    const entrees: EntreeIndex[] = [];

    const pousser = (titre: string, page: string) => {
        const t = titre.replace(/[.\s…*]+$/, '').replace(/^[.\s…*]+/, '').trim();
        const p = Number(page);
        // Une page à quatre chiffres n'est pas une page : c'est un index de carnet.
        if (t.length >= 3 && /[a-zA-ZÀ-ÿ]{3}/.test(t) && p > 0 && p < 1000) {
            entrees.push({ titre: t, page: p });
        }
    };

    for (const ligne of lignes) {
        for (const m of ligne.matchAll(/([^|<>\r\n]{3,80}?)\s*<br>\s*(\d{1,3})\b/g)) pousser(m[1], m[2]);
        for (const m of ligne.matchAll(/\|\s*\*{0,2}([^|*]{3,80}?)\*{0,2}\s*\|\s*\*{0,2}(\d{1,3})\*{0,2}\s*\|/g)) pousser(m[1], m[2]);
        for (const m of ligne.matchAll(/([A-Za-zÀ-ÿ][^|<>]{2,80}?)[.\s…]{3,}(\d{1,3})\b/g)) pousser(m[1], m[2]);
    }

    return entrees;
}

/** Charge tous les index d'un système depuis `docs/systems/<id>/index/`. */
export function chargerIndex(racineDocs: string, systeme: string): IndexLivre {
    const dossier = path.join(racineDocs, 'systems', systeme, 'index');
    const livre: IndexLivre = { systeme, sources: [], entrees: [] };
    if (!fs.existsSync(dossier)) return livre;

    for (const nom of fs.readdirSync(dossier).sort()) {
        const complet = path.join(dossier, nom);
        const ext = path.extname(nom).toLowerCase();

        let lignes: string[] | null = null;
        if (ext === '.md' || ext === '.txt') lignes = fs.readFileSync(complet, 'utf8').split(/\r?\n/);
        else if (ext === '.docx') lignes = paragraphesDocx(complet);
        if (!lignes) continue;

        const trouvees = extraireEntrees(lignes);
        if (trouvees.length === 0) continue;   // format non exploitable pour ce livre

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
        return { indexDisponible: false, sources: [], resolutions: [], pagesDouteuses: [], plage: null };
    }
    const resolveur = creerResolveur(livre);
    return {
        indexDisponible: true,
        sources: livre.sources,
        resolutions: sectionsCitees(contenuFiche).map(s => resolveur.resoudre(s)),
        pagesDouteuses: pagesInvraisemblables(contenuFiche, livre),
        plage: plageDePages(livre),
    };
}
