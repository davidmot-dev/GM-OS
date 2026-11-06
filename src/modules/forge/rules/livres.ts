/**
 * **Les livres d'un jeu : où est le PDF, et de combien ses pages sont décalées** — plan
 * `documentation/Planning/2026-11-06-chemins-des-livres.md`, étape A (06/11/2026).
 *
 * David : *« je n'ai pas envie de recopier mes livres un peu partout, donc un chemin pour moi est
 * une bonne idée »*. GM-OS garde **où est** le livre, jamais le livre : le registre
 * `docs/systems/<jeu>/livres.json` (choix de David : dans le dépôt, que les agents lisent aussi).
 * ⛔ Aucun PDF dans `docs/` : l'Oracle y indexe les `.pdf`.
 *
 * Le **décalage** : page PDF = page imprimée + décalage (Alien + 3, Dune + 7, le Haut-Rêve de Rêve
 * de Dragon − 166). C'est l'erreur la plus fréquente quand on cite une page.
 *
 * Module pur : l'interface le lit, le processus principal aussi (« Proposer depuis le livre »).
 */

export interface LivreDuJeu {
    /** `jeu` pour le livre de base, sinon le slug du supplément (`supplements.json`). */
    cle: string;
    titre: string;
    /** Chemin absolu du PDF, réseau compris (`\\CLOUDDAVID\Media\…`). */
    chemin: string;
    /** Page PDF = page imprimée + décalage. */
    decalage: number;
    edition?: string;
    /** L'errata, quand il est à part. */
    errata?: string;
    notes?: string;
}

export const CLE_DU_LIVRE_DE_BASE = 'jeu';

export interface ConstatDesLivres {
    gravite: 'erreur' | 'avertissement';
    ou: string;
    message: string;
}

const texte = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const estUnPdf = (chemin: string) => /\.pdf$/i.test(chemin.trim());

/** Le nom du fichier, quel que soit le séparateur (`\\` du NAS ou `/`). */
export const nomDuFichier = (chemin: string) => chemin.split(/[\\/]/).pop() ?? chemin;

/**
 * Lit le registre. Une entrée sans clé ni chemin est écartée ; un décalage qui n'est pas un entier
 * vaut 0 (le contrôle le dit). Les champs inconnus sont ignorés.
 */
export function lireLesLivres(brut: string | null | undefined): LivreDuJeu[] {
    let donnees: unknown;
    try { donnees = JSON.parse(brut ?? ''); } catch { return []; }
    if (!Array.isArray(donnees)) return [];
    return donnees.flatMap((d: Record<string, unknown>) => {
        const cle = texte(d?.cle);
        const chemin = texte(d?.chemin);
        if (!cle || !chemin) return [];
        const livre: LivreDuJeu = {
            cle,
            titre: texte(d.titre) || nomDuFichier(chemin),
            chemin,
            decalage: Number.isInteger(d.decalage) ? (d.decalage as number) : 0,
        };
        for (const champ of ['edition', 'errata', 'notes'] as const) {
            const v = texte(d[champ]);
            if (v) livre[champ] = v;
        }
        return [livre];
    });
}

/** Le registre tel qu'on l'écrit : deux espaces, une fin de ligne. */
export const ecrireLesLivres = (livres: readonly LivreDuJeu[]) => `${JSON.stringify(livres, null, 2)}\n`;

/**
 * Le contrôle du registre brut : ce que la lecture écarterait ou corrigerait en silence.
 * `cles` : les clés connues (`jeu` et les slugs des suppléments déclarés).
 */
export function controlerLesLivres(brut: string | null | undefined, cles: readonly string[]): ConstatDesLivres[] {
    if (brut == null || !brut.trim()) return [];
    let donnees: unknown;
    try { donnees = JSON.parse(brut); } catch {
        return [{ gravite: 'erreur', ou: 'livres.json', message: 'Le registre n’est pas un JSON lisible.' }];
    }
    if (!Array.isArray(donnees)) return [{ gravite: 'erreur', ou: 'livres.json', message: 'Le registre doit être une liste de livres.' }];
    const constats: ConstatDesLivres[] = [];
    donnees.forEach((d: Record<string, unknown>, i) => {
        const ou = `livres[${i}]`;
        const cle = texte(d?.cle);
        const chemin = texte(d?.chemin);
        if (!cle) constats.push({ gravite: 'erreur', ou, message: 'Livre sans clé (« jeu » ou le slug du supplément) : il est ignoré.' });
        else if (!cles.includes(cle)) constats.push({ gravite: 'avertissement', ou, message: `La clé « ${cle} » n’est ni le livre de base ni un supplément déclaré.` });
        if (!chemin) constats.push({ gravite: 'erreur', ou, message: 'Livre sans chemin : il est ignoré.' });
        else if (!estUnPdf(chemin)) constats.push({ gravite: 'avertissement', ou, message: `« ${nomDuFichier(chemin)} » n’est pas un PDF.` });
        if (d?.decalage !== undefined && !Number.isInteger(d.decalage)) {
            constats.push({ gravite: 'avertissement', ou, message: 'Le décalage doit être un nombre entier : il vaut 0.' });
        }
        const errata = texte(d?.errata);
        if (errata && !estUnPdf(errata)) constats.push({ gravite: 'avertissement', ou, message: `L’errata « ${nomDuFichier(errata)} » n’est pas un PDF.` });
    });
    return constats;
}

/**
 * Le livre d'une clé. Quand plusieurs livres la partagent (Rêve de Dragon : Voyageurs et Haut-Rêve),
 * on prend celui dont le nom de fichier figure dans `sources` (l'en-tête `sources:` de la fiche) ;
 * à défaut, le premier.
 */
export function livreDeLaCle(livres: readonly LivreDuJeu[], cle: string, sources?: string): LivreDuJeu | null {
    const candidats = livres.filter(l => l.cle === cle);
    if (candidats.length > 1 && sources) {
        const nomme = candidats.find(l => sources.includes(nomDuFichier(l.chemin)));
        if (nomme) return nomme;
    }
    return candidats[0] ?? null;
}

/** La clé du livre d'une fiche, d'après son chemin : `…/supplements/<slug>/rules/…` ou le livre de base. */
export function cleDeLaFiche(cheminDeFiche: string): string {
    return /\/supplements\/([^/]+)\/rules\//.exec(cheminDeFiche.replace(/\\/g, '/'))?.[1] ?? CLE_DU_LIVRE_DE_BASE;
}

/** Le livre d'une fiche : par son chemin, et par ses `sources:` quand le jeu a plusieurs volumes. */
export function livreDeLaFiche(livres: readonly LivreDuJeu[], cheminDeFiche: string, sources?: string): LivreDuJeu | null {
    return livreDeLaCle(livres, cleDeLaFiche(cheminDeFiche), sources);
}

/** La page du PDF pour une page imprimée ; jamais avant la première. */
export const pageDuPdf = (livre: Pick<LivreDuJeu, 'decalage'>, pageImprimee: number) => Math.max(1, Math.trunc(pageImprimee) + livre.decalage);

/** « La page imprimée 291 est la page 294 du PDF » → + 3. */
export const decalageDepuis = (pageImprimee: number, pagePdf: number) => Math.trunc(pagePdf) - Math.trunc(pageImprimee);

/**
 * Enregistre le chemin, le décalage (et le titre) d'un livre : remplace l'entrée de la clé, au
 * rang donné parmi celles qui la partagent, en gardant ses notes ; l'ajoute sinon. Rend une copie.
 */
export function enregistrerLeLivre(
    livres: readonly LivreDuJeu[],
    cle: string,
    champs: Pick<LivreDuJeu, 'chemin' | 'decalage'> & Partial<Pick<LivreDuJeu, 'titre'>>,
    rang = 0,
): LivreDuJeu[] {
    const copie = livres.map(l => ({ ...l }));
    const indices = copie.flatMap((l, i) => (l.cle === cle ? [i] : []));
    const chemin = champs.chemin.trim();
    if (indices[rang] !== undefined) {
        const l = copie[indices[rang]];
        copie[indices[rang]] = { ...l, chemin, decalage: Math.trunc(champs.decalage), ...(champs.titre?.trim() ? { titre: champs.titre.trim() } : {}) };
        return copie;
    }
    copie.push({ cle, titre: champs.titre?.trim() || nomDuFichier(chemin), chemin, decalage: Math.trunc(champs.decalage) });
    return copie;
}

/** Retire le livre d'une clé (au rang donné). Rend une copie. */
export function retirerLeLivre(livres: readonly LivreDuJeu[], cle: string, rang = 0): LivreDuJeu[] {
    const indice = livres.flatMap((l, i) => (l.cle === cle ? [i] : []))[rang];
    return indice === undefined ? [...livres] : livres.filter((_, i) => i !== indice);
}

export interface DecalageMesure {
    decalage: number;
    /** Les pages lues dont le numéro imprimé donne ce décalage. */
    concordantes: number;
    /** Les pages lues. */
    lues: number;
}

/**
 * **Mesurer le décalage** (« Proposer depuis le livre ») : sur chaque page lue, les nombres seuls
 * dans les trois premières et les trois dernières lignes sont des numéros imprimés candidats ; le
 * décalage le plus fréquent l'emporte. C'est la mesure faite à la main le 06/11/2026 sur dix-huit
 * livres ; elle retrouve le + 3 d'Alien. Un numéro doublé par une seconde couche de texte
 * (« 217217 », Blade Runner) est dédoublonné. Rend `null` si rien ne se dégage : moins de trois
 * pages concordantes, ou moins d'une page lue sur cinq.
 */
export function mesurerLeDecalage(pages: readonly { num: number; text: string }[], total: number): DecalageMesure | null {
    const compte = new Map<number, number>();
    for (const page of pages) {
        const lignes = page.text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        // Chaque bord, découpé à la tabulation ; un numéro en chiffres espacés redevient un nombre
        // (Blade Runner, lu par pdf.js : « 0 2 1⇥0 2 1 » pour la page 21).
        const bords = [...lignes.slice(0, 3), ...lignes.slice(-3)]
            .flatMap(l => l.split('\t'))
            .map(c => (/^\d(?: \d)+$/.test(c.trim()) ? c.replace(/\s/g, '') : c));
        const vus = new Set<number>();
        for (const ligne of bords) {
            for (const m of ligne.matchAll(/(?:^|\s)(\d{1,6})(?=\s|$)/g)) {
                let s = m[1];
                if (s.length % 2 === 0 && s.slice(0, s.length / 2) === s.slice(s.length / 2)) s = s.slice(0, s.length / 2);
                const v = Number(s);
                // Pas plafonné au nombre de pages : un second volume continue la numérotation du
                // premier (le Haut-Rêve, 153 pages, imprime 171 à 319).
                if (v < 1 || v > Math.max(total + 20, 999) || vus.has(v)) continue;
                vus.add(v);
                const d = page.num - v;
                compte.set(d, (compte.get(d) ?? 0) + 1);
            }
        }
    }
    const [meilleur] = [...compte.entries()].sort((a, b) => b[1] - a[1]);
    if (!meilleur) return null;
    const [decalage, concordantes] = meilleur;
    if (concordantes < 3 || concordantes * 5 < pages.length) return null;
    return { decalage, concordantes, lues: pages.length };
}

/** Ce que rendent les gestes « Vérifier » et « Proposer depuis le livre » (processus principal). */
export type MotifDuLivre = 'pas-un-pdf' | 'introuvable' | 'illisible' | 'pdf-indisponible';

export type VerificationDuLivre =
    | { repond: true; pages: number }
    | { repond: false; motif: MotifDuLivre };

export type PropositionDeDecalage =
    | { trouve: true; mesure: DecalageMesure; pages: number }
    | { trouve: false; motif: MotifDuLivre | 'rien-ne-se-degage' };

/** Ce que l'écran dit d'un livre qui ne répond pas. */
export const MOTIFS_DU_LIVRE: Record<MotifDuLivre | 'rien-ne-se-degage', string> = {
    'pas-un-pdf': 'Ce fichier n’est pas un PDF.',
    introuvable: 'Le livre ne répond pas : fichier introuvable, ou NAS éteint.',
    illisible: 'Le PDF ne se lit pas.',
    'pdf-indisponible': 'La lecture des PDF n’est pas disponible.',
    'rien-ne-se-degage': 'Aucun décalage ne se dégage des numéros imprimés : saisissez-le à la main.',
};

/**
 * **Ouvrir le livre à la page** — étape C (06/11/2026). L'interface ne désigne le livre que par son
 * jeu (`systems/<jeu>`), sa clé et son rang parmi ceux qui la partagent : **aucun chemin ne vient de
 * l'écran**, le processus principal le relit dans le registre.
 */
export interface DemandeDOuverture {
    /** La racine du jeu dans `docs/` : `systems/alien`. */
    racine: string;
    cle: string;
    /** Le rang parmi les livres de la même clé (plusieurs volumes) ; 0 par défaut. */
    rang?: number;
    /** La page imprimée ; sans elle, la première page. */
    page?: number;
}

export type MotifDOuverture = MotifDuLivre | 'sans-livre' | 'demande-invalide';

export type OuvertureDuLivre =
    | { ouvert: true; titre: string; pagePdf: number; alaPage: boolean }
    | { ouvert: false; motif: MotifDOuverture };

/** Ce que l'écran dit quand le livre ne s'ouvre pas. */
export const MOTIFS_D_OUVERTURE: Record<MotifDOuverture, string> = {
    'pas-un-pdf': MOTIFS_DU_LIVRE['pas-un-pdf'],
    introuvable: MOTIFS_DU_LIVRE.introuvable,
    illisible: 'Le livre ne s’ouvre pas.',
    'pdf-indisponible': MOTIFS_DU_LIVRE['pdf-indisponible'],
    'sans-livre': 'Ce livre n’a pas de PDF enregistré : Forge › Atelier de règles › PDF du livre.',
    'demande-invalide': 'Le livre demandé n’est pas reconnu.',
};

/** Une racine de jeu sûre : `systems/<dossier>`, un seul niveau, ni `.` ni `..`. */
export const racineDeJeuValide = (racine: unknown): racine is string =>
    typeof racine === 'string' && /^systems\/[^/\\]+$/.test(racine) && !/^systems\/\.\.?$/.test(racine);

/** La racine du jeu d'une fiche du corpus : `systems/alien/supplements/…/rules/x.md` → `systems/alien`. */
export function racineDuJeuDeLaFiche(fiche: string): string | null {
    const m = /^(?:docs\/)?(systems\/[^/]+)\//.exec(fiche.replace(/\\/g, '/'));
    return m && racineDeJeuValide(m[1]) ? m[1] : null;
}

/** La demande reçue par le processus principal, contrôlée champ par champ ; `null` si elle ne tient pas. */
export function demandeDOuvertureValide(brute: unknown): DemandeDOuverture | null {
    if (!brute || typeof brute !== 'object') return null;
    const d = brute as Record<string, unknown>;
    if (!racineDeJeuValide(d.racine) || typeof d.cle !== 'string' || !d.cle.trim()) return null;
    if (d.rang !== undefined && !(Number.isInteger(d.rang) && (d.rang as number) >= 0)) return null;
    if (d.page !== undefined && !(Number.isInteger(d.page) && (d.page as number) > 0)) return null;
    return {
        racine: d.racine, cle: d.cle.trim(),
        ...(d.rang !== undefined ? { rang: d.rang as number } : {}),
        ...(d.page !== undefined ? { page: d.page as number } : {}),
    };
}

/** Le livre d'une demande : la clé, au rang voulu. */
export const livreDeLaDemande = (livres: readonly LivreDuJeu[], demande: Pick<DemandeDOuverture, 'cle' | 'rang'>) =>
    livres.filter(l => l.cle === demande.cle)[demande.rang ?? 0] ?? null;

/** D'où viennent les chiffres d'une créature ou d'un objet (`source` du bestiaire, du catalogue). */
export interface SourceDuLivre {
    livre?: string;
    page?: number;
    fiche?: string;
    /** La clé, quand l'écran la connaît déjà (l'atelier de règles : le livre documenté). */
    cle?: string;
}

/**
 * Le livre d'une source : par sa fiche relue d'abord (le chemin dit la clé), sinon par son titre ;
 * une source saisie à la main dans un jeu qui n'a que son livre de base y renvoie. Rien sinon :
 * mieux vaut pas de bouton qu'un bouton qui ouvre le mauvais livre.
 */
export function livreDeLaSource(livres: readonly LivreDuJeu[], source: SourceDuLivre | undefined): LivreDuJeu | null {
    if (!source) return null;
    if (source.cle) return livreDeLaCle(livres, source.cle);
    if (source.fiche) return livreDeLaFiche(livres, source.fiche);
    const titre = source.livre?.trim().toLowerCase();
    const parTitre = titre ? livres.find(l => l.titre.trim().toLowerCase() === titre) : undefined;
    if (parTitre) return parTitre;
    return livres.length > 0 && livres.every(l => l.cle === CLE_DU_LIVRE_DE_BASE) ? livres[0] : null;
}

/** La demande qui ouvre `livre` (de ce registre) à la page imprimée voulue. */
export function demandePourLeLivre(livres: readonly LivreDuJeu[], livre: LivreDuJeu, racine: string, page?: number): DemandeDOuverture {
    const rang = livres.filter(l => l.cle === livre.cle).indexOf(livre);
    return { racine, cle: livre.cle, ...(rang > 0 ? { rang } : {}), ...(page ? { page } : {}) };
}

/** Les pages à lire pour la mesure : une sur dix environ, au plus `nombre`, réparties dans le livre. */
export function pagesAEchantillonner(total: number, nombre = 40): number[] {
    if (total <= nombre) return Array.from({ length: total }, (_, i) => i + 1);
    const pas = total / nombre;
    return Array.from({ length: nombre }, (_, i) => Math.min(total, Math.floor(i * pas) + 1));
}
