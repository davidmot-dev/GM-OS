import { familleDuTableau } from '../../equipement/depuisLeCorpus';
import { estUnePremiereColonneDeProfil } from '../../bestiaire/depuisLeCorpus';

/**
 * **F4 — le livre vérifie la fiche** (plan `documentation/Planning/2026-11-06-forge-tableaux-equipement-bestiaire.md`,
 * 06/11/2026).
 *
 * Le carnet a déjà inventé des règles (Nephilim, Symbaroum), et la reforge des adversaires de COC du
 * 06/11 a réintroduit deux règles que la relecture avait retirées. Un tableau chiffré ne se publie
 * pas sans qu'on l'ait confronté au livre : pour chaque ligne d'un tableau que le catalogue ou le
 * bestiaire liront, on cherche **sur la page** le nom et chacune de ses valeurs.
 *
 * **La présence des jetons, pas leur ordre** : le texte extrait d'un PDF mêle les colonnes (Rêve de
 * Dragon, RuneQuest) ; l'ordre n'y est pas fiable, la présence l'est. Le contrôle est donc lâche
 * pour les petits nombres (un « 2 » se trouve sur toute page) et sûr pour ce qui compte : une valeur
 * absente de la page est une valeur à vérifier.
 *
 * Module pur : les pages arrivent du processus principal (`livres:lire-pages`), en pages imprimées.
 */

/** Une ligne de tableau à confronter au livre. */
export interface LigneAVerifier {
    tableau: string;
    nom: string;
    /**
     * La page imprimée de la ligne : sa colonne « Page », sinon celle du titre
     * (`### Tableau des Armes (p. 94)`), si la fiche la donne.
     */
    page?: number;
    /** La dernière page d'un titre qui en couvre plusieurs (`(p. 117-119)`). */
    pageFin?: number;
    /** Les valeurs chiffrées des colonnes vérifiables, telles que la fiche les écrit. */
    valeurs: string[];
}

export interface PageDuLivre {
    /** Page imprimée. */
    page: number;
    texte: string;
}

export interface LigneVerifiee {
    tableau: string;
    nom: string;
    /** La page imprimée où le nom a été le mieux retrouvé. */
    page?: number;
    nomTrouve: boolean;
    /**
     * Les valeurs absentes de la ligne du nom, mais lues ailleurs dans les pages lues : une valeur
     * venue d'une autre section (le premier rôle de COC : DEF 15 p. 108, santé Pulp 24 p. 92), ou
     * une valeur fausse qui se trouve être celle d'une autre ligne. À confirmer à l'œil.
     */
    ailleurs: { valeur: string; page: number }[];
    /** Les valeurs qu'aucune page lue ne porte : à vérifier. */
    manquantes: string[];
    /** Le nom et toutes ses valeurs, ensemble, sur la page. */
    retrouvee: boolean;
}

export interface VerificationAuLivre {
    lignes: LigneVerifiee[];
    /** Le nom et toutes ses valeurs ensemble, sur la page. */
    retrouvees: number;
    /** Aucune valeur introuvable, mais certaines lues loin du nom. */
    aConfirmer: number;
    /** Un nom absent, ou une valeur qu'aucune page lue ne porte. */
    introuvables: number;
    total: number;
    /** Les pages imprimées lues. */
    pages: number[];
}

/** Les colonnes en prose (paraphrasées) ou venues d'un autre chapitre (les prix par époque de COC). */
const COLONNE_NON_VERIFIABLE = /^(special|particularites|notes?|description|effets?|proprietes|remarques?|usage|stockage|table d'attaques|prix \d{4}|categorie|pages?|p\.?)$/;
/** La colonne « Page » d'un tableau de profils (le bestiaire) : la page de chaque ligne. */
const COLONNE_DE_PAGE = /^(pages?|p\.?)$/;

const MOTS_VIDES = new Set(['les', 'des', 'une', 'aux', 'par', 'sur', 'avec', 'pour', 'dans', 'the', 'and', 'of']);

/** Minuscules, sans accents ni ligatures, apostrophes et tirets ramenés à une forme, sur une ligne. */
export function normaliser(texte: string): string {
    return texte
        .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/ﬀ/g, 'ff').replace(/œ/gi, 'oe').replace(/æ/gi, 'ae')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[’‘`]/g, "'")
        .replace(/[–—−]/g, '-')
        // Les milliers : « 15 000 » est un nombre, des deux côtés. Une tabulation sépare deux colonnes
        // et n'est pas recollée (« 4 ⇥ 300 » reste deux valeurs).
        .replace(/(\d)[ \u00a0\u202f](?=\d{3}(?!\d))/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Les lignes d'une page, normalisées. **Les lignes comptent** : le texte extrait du livre de COC rend
 * une ligne de tableau sur une ligne (« Couteau / poignard / baïonnette ⇥ Petite ⇥ 1d6+FOR ⇥ 6 ») ;
 * chercher les valeurs dans toute la page laissait passer une arme faussée, ses valeurs étant celles
 * d'une autre arme de la même page (essai du 06/11/2026).
 */
export function lignesDeLaPage(texte: string): string[] {
    return texte
        // Un mot coupé en fin de ligne : « pro-\ntection ».
        .replace(/(\p{L})-\r?\n\s*(\p{L})/gu, '$1$2')
        .split(/\r?\n/)
        .map(normaliser)
        .filter(Boolean);
}

const cellules = (ligne: string) => ligne.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim());
const nettoyer = (cellule: string) => cellule.replace(/\\\$/g, '$').replace(/\s*\*\(([^)]*)\)\*/g, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

/** « (p. 94) » ou « (p. 117-119) » au bout d'un titre : la première et la dernière page. */
const pagesDuTitre = (titre: string): { page?: number; pageFin?: number } => {
    const m = /\(p\.\s*(\d+)(?:\s*[-–]\s*(\d+))?\)\s*$/.exec(titre);
    if (!m) return {};
    return { page: Number(m[1]), ...(m[2] && Number(m[2]) > Number(m[1]) ? { pageFin: Number(m[2]) } : {}) };
};

/** Les valeurs chiffrées d'une cellule : dés (`2d6`), nombres (`1,5`, `+2`, `-4`), dans l'ordre. */
export function valeursDeLaCellule(cellule: string): string[] {
    const valeurs: string[] = [];
    // Un dé ne suit pas une lettre : « and 3 » n'est pas « d3 ».
    const reste = normaliser(cellule).replace(/(?<![a-z])(\d*)d(\d+)/g, (_t, n: string, f: string) => {
        valeurs.push(`${n || ''}d${f}`);
        return ' ';
    });
    for (const m of reste.matchAll(/\d+(?:[.,]\d+)?/g)) valeurs.push(m[0]);
    return valeurs;
}

/**
 * Les lignes des tableaux que le catalogue ou le bestiaire liront — les mêmes règles de première
 * colonne que les deux lecteurs (`familleDuTableau`, `estUnePremiereColonneDeProfil`).
 */
export function lignesAVerifier(contenu: string): LigneAVerifier[] {
    const lignes = contenu.split(/\r?\n/);
    const aVerifier: LigneAVerifier[] = [];
    let titre = '';
    for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i];
        const t = /^#{2,4}\s+(.*)$/.exec(l);
        if (t) { titre = t[1].trim(); continue; }
        if (!l.trim().startsWith('|') || !/^\s*\|\s*:?-{2,}/.test(lignes[i + 1] ?? '')) continue;
        const entetes = cellules(l).map(nettoyer);
        const lu = familleDuTableau(entetes[0] ?? '') !== null || estUnePremiereColonneDeProfil(entetes[0] ?? '');
        const colonneDePage = entetes.findIndex(e => COLONNE_DE_PAGE.test(normaliser(e)));
        i += 2;
        while (i < lignes.length && lignes[i].trim().startsWith('|')) {
            const cases = cellules(lignes[i++]);
            const nom = nettoyer(cases[0] ?? '');
            if (!lu || !nom) continue;
            const valeurs = cases.slice(1).flatMap((c, k) =>
                COLONNE_NON_VERIFIABLE.test(normaliser(entetes[k + 1] ?? '')) ? [] : valeursDeLaCellule(c));
            const pageDeLaLigne = colonneDePage > 0 ? /^\s*(\d+)/.exec(cases[colonneDePage] ?? '')?.[1] : undefined;
            const pages = pageDeLaLigne ? { page: Number(pageDeLaLigne) } : pagesDuTitre(titre);
            aVerifier.push({ tableau: titre, nom, ...pages, valeurs: [...new Set(valeurs)] });
        }
        i--;
    }
    return aVerifier;
}

/**
 * Les pages imprimées à lire : celle de chaque tableau et ses voisines (un tableau déborde, une page
 * citée se trompe d'une), sinon la plage des sections que l'index a résolues. Au plus `plafond`.
 */
export function pagesAVerifier(lignes: readonly LigneAVerifier[], plage?: { min: number; max: number } | null, plafond = 30): number[] {
    const pages = new Set<number>();
    for (const l of lignes) if (l.page) for (let p = l.page - 1; p <= (l.pageFin ?? l.page) + 1; p++) pages.add(p);
    if (lignes.some(l => !l.page) && plage) for (let p = plage.min - 1; p <= plage.max + 1; p++) pages.add(p);
    return [...pages].filter(p => p >= 1).sort((a, b) => a - b).slice(0, plafond);
}

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** La valeur figure-t-elle, seule, dans le texte (« 20 » ne se trouve pas dans « 120 ») ? */
function valeurPresente(texteNormalise: string, valeur: string): boolean {
    const de = /^(\d*)d(\d+)$/.exec(valeur);
    const motif = de
        ? `(?<!\\d)${de[1] ? echapper(de[1]) : '1?'}\\s*d\\s*${echapper(de[2])}(?!\\d)`
        : `(?<![\\d.,])${echapper(valeur).replace(/[.,]/, '[.,]')}(?![\\d]|[.,]\\d)`;
    return new RegExp(motif).test(texteNormalise);
}

/** Les mots du nom qui comptent ; le nom est retrouvé si la moitié au moins figure sur la page. */
function nomPresent(texteNormalise: string, nom: string): boolean {
    const mots = normaliser(nom).split(/[^a-z0-9]+/).filter(m => m.length >= 3 && !MOTS_VIDES.has(m));
    if (!mots.length) return texteNormalise.includes(normaliser(nom));
    const trouves = mots.filter(m => new RegExp(`(?<![a-z])${echapper(m)}`).test(texteNormalise)).length;
    return trouves >= Math.ceil(mots.length / 2);
}

/** Au plus tant de lignes de texte pour le bloc d'un profil (le plus long de COC en compte 14). */
const LIGNES_D_UN_BLOC = 16;

/**
 * Confronte chaque ligne aux pages lues. On cherche la **rangée** : la ligne de texte où figure le nom
 * (les deux lignes, quand le nom s'y coupe ou que sa ligne ne porte aucun chiffre) ; les valeurs
 * doivent s'y trouver. Une valeur qui n'y est
 * pas est cherchée sur les pages lues (`ailleurs`, à confirmer), sinon déclarée introuvable.
 *
 * ⚠️ Pas de fenêtre plus large : avec les deux lignes suivantes, un couteau faussé à 1d8 prenait le
 * 1d8 du fleuret, imprimé juste en dessous (essai du 06/11/2026). Une rangée que le livre éclate sur
 * plusieurs lignes (les grenades de COC, en liste) reste donc « à confirmer » : c'est le bon côté
 * de l'erreur.
 */
export function verifierAuLivre(lignes: readonly LigneAVerifier[], pages: readonly PageDuLivre[]): VerificationAuLivre {
    const lues = pages.map(p => {
        const rangees = lignesDeLaPage(p.texte);
        return { page: p.page, rangees, texte: rangees.join(' ') };
    });
    const verifiees = lignes.map((l): LigneVerifiee => {
        const candidates = l.page ? lues.filter(p => p.page >= l.page! - 1 && p.page <= (l.pageFin ?? l.page!) + 1) : lues;
        // Les autres noms du même tableau : ils bornent un bloc de profil (« \ Rat » … « \ Serpent »).
        const autresNoms = lignes.filter(o => o.tableau === l.tableau && o !== l).map(o => o.nom);
        let meilleure: { page: number; nomTrouve: boolean; absentes: string[] } | null = null;
        const rang = (v: { nomTrouve: boolean; absentes: string[] }) => (v.nomTrouve ? 0 : 1000) + v.absentes.length;
        for (const p of candidates) {
            p.rangees.forEach((_r, i) => {
                // Le nom peut se couper sur deux lignes : on le cherche sur la ligne et la suivante.
                const deux = `${p.rangees[i]} ${p.rangees[i + 1] ?? ''}`;
                const surUneLigne = nomPresent(p.rangees[i], l.nom);
                // Coupé sur deux lignes, et seulement s'il ne tient pas tout entier sur la seconde : sinon
                // la rangée commencerait une ligne trop tôt (essai de l'encart, 06/11/2026).
                if (!surUneLigne && (!nomPresent(deux, l.nom) || nomPresent(p.rangees[i + 1] ?? '', l.nom))) return;
                // Une ligne qui ne porte que le nom, sans un chiffre, se poursuit sur la suivante :
                // « Casque (moderne et » / « médiéval) 2 ⇥ 4 ⇥ -2 » (COC, p. 96).
                let rangee = surUneLigne && /\d/.test(p.rangees[i]) ? p.rangees[i] : deux;
                // Un profil s'imprime en bloc (« \ Rat », « TAI 2 », « AGI +2 | CON -4 … », « DEF 16 »…) :
                // quand les deux lignes ne suffisent pas, la rangée court jusqu'au nom suivant du même
                // tableau, au plus `LIGNES_D_UN_BLOC` lignes (COC, p. 112-119, le 06/11/2026).
                if (rangee === deux && l.valeurs.some(v => !valeurPresente(deux, v))) {
                    let fin = i + 2;
                    while (fin < p.rangees.length && fin < i + LIGNES_D_UN_BLOC && !autresNoms.some(n => nomPresent(p.rangees[fin], n))) fin++;
                    rangee = p.rangees.slice(i, fin).join(' ');
                }
                const essai = { page: p.page, nomTrouve: true, absentes: l.valeurs.filter(v => !valeurPresente(rangee, v)) };
                if (!meilleure || rang(essai) < rang(meilleure)) meilleure = essai;
            });
            if (!meilleure) meilleure = { page: p.page, nomTrouve: false, absentes: [...l.valeurs] };
        }
        if (!meilleure) return { tableau: l.tableau, nom: l.nom, nomTrouve: false, ailleurs: [], manquantes: [...l.valeurs], retrouvee: false };
        const trouvee: { page: number; nomTrouve: boolean; absentes: string[] } = meilleure;
        const ailleurs: { valeur: string; page: number }[] = [];
        const manquantes: string[] = [];
        for (const v of trouvee.absentes) {
            // La page du nom d'abord, puis les autres pages lues.
            const autre = [...lues].sort((a, b) => (a.page === trouvee.page ? -1 : b.page === trouvee.page ? 1 : 0))
                .find(p => valeurPresente(p.texte, v));
            if (autre) ailleurs.push({ valeur: v, page: autre.page });
            else manquantes.push(v);
        }
        return {
            tableau: l.tableau, nom: l.nom, page: trouvee.page, nomTrouve: trouvee.nomTrouve,
            ailleurs, manquantes, retrouvee: trouvee.nomTrouve && !trouvee.absentes.length,
        };
    });
    const retrouvees = verifiees.filter(v => v.retrouvee).length;
    const introuvables = verifiees.filter(v => !v.nomTrouve || v.manquantes.length > 0).length;
    return {
        lignes: verifiees,
        retrouvees,
        aConfirmer: verifiees.length - retrouvees - introuvables,
        introuvables,
        total: verifiees.length,
        pages: lues.map(p => p.page),
    };
}
