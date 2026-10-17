/**
 * **Les référentiels d'un jeu** — David, 2026-10-17 : *« on va relier les vécus »*.
 *
 * Un référentiel est une liste nommée que le corpus du jeu publie, par exemple
 * `docs/systems/nephilim/vecus/index.json` : les 80 Vécus passés du *Livre 0*,
 * chacun avec le fichier Markdown qui le décrit et des détails (Ka-élément,
 * ère, époque, page). Un champ de fiche le désigne (`SheetField.referentiel`) :
 * la fiche propose ses noms, et un nom saisi s'y relie.
 *
 * **Le nom fait le lien, et seulement lui** : la fiche garde le nom et le degré,
 * le référentiel la description. Rien n'est recopié, rien ne peut diverger. Une
 * liste n'est jamais fermée — un joueur peut inventer son Vécu.
 *
 * Tout est pur ici ; la lecture des fichiers vit dans `useReferentiel`.
 */
export interface EntreeDeReferentiel {
    nom: string;
    /** Le Markdown qui la décrit, relatif au dossier de l'index. */
    fichier?: string;
    /** Ce qui se montre à côté du nom : « Ka-élément : Feu », « Époque : … ». */
    details?: Record<string, string | number>;
}

export interface Referentiel {
    /** Le nom de la liste : « Vécus passés ». */
    titre: string;
    entrees: EntreeDeReferentiel[];
    /** D'où vient la liste, pour le dire. */
    source?: string;
}

/** Lit un index ; `null` s'il n'a pas la forme attendue — un référentiel faux ne s'affiche pas. */
export function lireLeReferentiel(brut: unknown): Referentiel | null {
    const objet = brut as { referentiel?: unknown; entrees?: unknown; source?: unknown } | null;
    if (!objet || !Array.isArray(objet.entrees)) return null;
    const entrees = objet.entrees
        .filter((e): e is EntreeDeReferentiel => !!e && typeof (e as EntreeDeReferentiel).nom === 'string' && (e as EntreeDeReferentiel).nom.trim() !== '')
        .map(e => ({
            nom: e.nom.trim(),
            fichier: typeof e.fichier === 'string' ? e.fichier : undefined,
            details: e.details && typeof e.details === 'object' ? e.details : undefined,
        }));
    return {
        titre: typeof objet.referentiel === 'string' ? objet.referentiel : 'Référentiel',
        entrees,
        source: typeof objet.source === 'string' ? objet.source : undefined,
    };
}

/**
 * Sans casse, sans accents, sans espaces superflus, et une seule apostrophe :
 * « Héros » et « heros », « L’An Mil » et « L'An Mil » sont le même nom.
 */
export const cleDuNom = (nom: string) => nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u02bc`\u00b4]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Les entrées d'un nom. **Plusieurs** : un même nom revient d'une époque à
 * l'autre (« Mercenaire », « Marchand ») — l'écran les montre toutes plutôt que
 * d'en choisir une au hasard.
 */
export function entreesDuNom(referentiel: Referentiel | null | undefined, nom: string | undefined): EntreeDeReferentiel[] {
    if (!referentiel || !nom?.trim()) return [];
    const cle = cleDuNom(nom);
    return referentiel.entrees.filter(e => cleDuNom(e.nom) === cle);
}

/** Les noms à proposer, sans doublon, dans l'ordre de la liste. */
export function nomsDuReferentiel(referentiel: Referentiel | null | undefined): string[] {
    const vus = new Set<string>();
    const noms: string[] = [];
    for (const e of referentiel?.entrees ?? []) {
        if (vus.has(cleDuNom(e.nom))) continue;
        vus.add(cleDuNom(e.nom));
        noms.push(e.nom);
    }
    return noms;
}

/** « Ka-élément : Feu · Époque : … » — les détails en une ligne. */
export const direLesDetails = (entree: EntreeDeReferentiel) =>
    Object.entries(entree.details ?? {}).map(([cle, valeur]) => `${cle} : ${valeur}`).join(' · ');

/**
 * La section qui décrit une entrée dans son Markdown : celle dont le titre de
 * niveau 2 commence par son nom (« ## Héros — Ka-Feu »), jusqu'au titre suivant
 * ou au filet. `null` si le fichier ne la porte pas.
 */
export function sectionDuMarkdown(markdown: string, nom: string): string | null {
    const cle = cleDuNom(nom);
    const lignes = markdown.split(/\r?\n/);
    const debut = lignes.findIndex(l => /^##\s+/.test(l) && cleDuNom(l.replace(/^##\s+/, '').split(/\s+[—–-]\s+/)[0]) === cle);
    if (debut < 0) return null;
    const suite = lignes.slice(debut + 1);
    const fin = suite.findIndex(l => /^#{1,2}\s+/.test(l) || /^---\s*$/.test(l));
    const texte = (fin < 0 ? suite : suite.slice(0, fin)).join('\n').trim();
    return texte || null;
}

/**
 * **Les entrées permises par d'autres champs** — un Vécu de Nephilim vient d'une
 * époque incarnée. `valeurs` : ce que portent ces champs (les époques saisies).
 * Aucune valeur : `null`, la liste entière vaut.
 */
export function entreesSelon(
    referentiel: Referentiel | null | undefined,
    detail: string,
    valeurs: readonly unknown[],
): EntreeDeReferentiel[] | null {
    const cles = new Set(valeurs.map(v => (typeof v === 'string' ? cleDuNom(v) : '')).filter(Boolean));
    if (!referentiel || cles.size === 0) return null;
    return referentiel.entrees.filter(e => {
        const valeur = e.details?.[detail];
        return typeof valeur === 'string' && cles.has(cleDuNom(valeur));
    });
}

/** L'entrée vient-elle d'une des valeurs permises ? `true` quand rien ne restreint. */
export function estPermise(entree: EntreeDeReferentiel, detail: string, valeurs: readonly unknown[]): boolean {
    const cles = new Set(valeurs.map(v => (typeof v === 'string' ? cleDuNom(v) : '')).filter(Boolean));
    if (cles.size === 0) return true;
    const valeur = entree.details?.[detail];
    return typeof valeur === 'string' && cles.has(cleDuNom(valeur));
}

/**
 * **Le lien visible entre deux listes** — David, 2026-10-18 : *« il faut qu'il y
 * ait un lien logique et visuel entre une époque et un vécu »*.
 *
 * Côté Vécu : de quel champ de la fiche (quelle incarnation) vient-il ? On
 * cherche, parmi les entrées de son nom, celle dont le détail (l'Époque) est la
 * valeur d'un des champs qui restreignent la liste. `null` : aucune incarnation
 * ne la porte.
 */
export function origineDansLaFiche(
    entrees: readonly EntreeDeReferentiel[],
    detail: string,
    champs: readonly string[],
    valeurs: Record<string, unknown>,
): { champ: string; valeur: string; entree: EntreeDeReferentiel } | null {
    for (const champ of champs) {
        const valeur = valeurs[champ];
        if (typeof valeur !== 'string' || !valeur.trim()) continue;
        const entree = entrees.find(e => typeof e.details?.[detail] === 'string' && cleDuNom(String(e.details[detail])) === cleDuNom(valeur));
        if (entree) return { champ, valeur, entree };
    }
    return null;
}

/**
 * Côté incarnation : les Vécus de la fiche qui en viennent. `vecus` : les champs
 * de nom (et leur degré, s'il est connu) ; `referentiel` : la liste qui dit
 * l'époque de chaque nom.
 */
export function liesALaValeur(
    referentiel: Referentiel | null | undefined,
    detail: string,
    valeur: string,
    vecus: readonly { nom: string; degre?: unknown }[],
): { nom: string; degre?: unknown }[] {
    if (!referentiel || !valeur.trim()) return [];
    const cle = cleDuNom(valeur);
    return vecus.filter(v => v.nom.trim() && entreesDuNom(referentiel, v.nom)
        .some(e => typeof e.details?.[detail] === 'string' && cleDuNom(String(e.details[detail])) === cle));
}

/** « Incarnation 1 » depuis « Incarnation 1 — dates et lieux » : le libellé court d'un champ. */
export const libelleCourt = (libelle: string) => libelle.split(/\s+[—–-]\s+/)[0].trim();
