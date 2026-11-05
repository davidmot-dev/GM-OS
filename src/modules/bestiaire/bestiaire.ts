import type { BestiaireDuJeu, ColonneDuBestiaire, CreatureDuBestiaire } from '../../types/drivers';
import { slug } from '../../../electron/corpusSysteme';

/**
 * Le bestiaire du pilote — registre § 210, étape A (05/11/2026), à la demande de David
 * (« ok on commence par le A ») ; les créatures vivent dans le pilote (décision du 05/11).
 *
 * Ce module ne dépend d'aucun écran : l'éditeur du pilote (étape B), le remplissage depuis le
 * corpus (C), Combat-OS et les rencontres (D) le liront tous, comme `equipement/catalogue.ts` pour
 * le catalogue. Les types vivent dans `types/drivers.ts`. Plan :
 * `documentation/Planning/2026-11-04-bestiaire-du-pilote.md`.
 */

/** Même forme que `ConstatDuPilote`, que `controlerLePilote` reprend tel quel. */
export interface ConstatDuBestiaire {
    gravite: 'erreur' | 'avertissement';
    ou: string;
    message: string;
}

/** Un nombre tel qu'on l'écrit dans un tableau : « 3 », « +2 », « -1 », « 1,5 ». */
const estUnNombre = (v: unknown) =>
    (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && /^[+-]?\d+(?:[.,]\d+)?$/.test(v.trim()));

/**
 * Ce qui rendrait le bestiaire faux à l'usage — **dit, jamais réparé en douce**.
 *
 * Erreurs : ce qui casserait un geste (deux créatures du même identifiant, une valeur dans une
 * colonne que le jeu ne déclare pas, une colonne qui remplit un champ absent de la fiche, une table
 * d'attaques sans nom). Avertissements : ce qui se lit mais qu'une mécanique ne comptera pas
 * (« 4 contre le feu » dans une colonne de nombres), deux colonnes qui remplissent le même champ.
 *
 * `champsDeLaFiche` : les champs du modèle de fiche du pilote ; absent, on ne vérifie pas les
 * `champ` (la Forge le donne toujours). Les tables d'attaques vivent sur le disque, par jeu : leur
 * existence ne se vérifie pas ici, seulement leur forme.
 */
export function controlerLeBestiaire(bestiaire: BestiaireDuJeu | undefined, champsDeLaFiche?: ReadonlySet<string>): ConstatDuBestiaire[] {
    const constats: ConstatDuBestiaire[] = [];
    if (!bestiaire) return constats;
    const erreur = (ou: string, message: string) => constats.push({ gravite: 'erreur', ou, message });
    const avertir = (ou: string, message: string) => constats.push({ gravite: 'avertissement', ou, message });

    const colonnes = new Map<string, ColonneDuBestiaire>();
    const champsRemplis = new Map<string, string>();
    if (!Array.isArray(bestiaire.colonnes)) erreur('bestiaire.colonnes', 'Le bestiaire doit déclarer une liste de colonnes.');
    (Array.isArray(bestiaire.colonnes) ? bestiaire.colonnes : []).forEach((c, i) => {
        const ou = `bestiaire.colonnes[${i}]`;
        if (!c.id?.trim() || colonnes.has(c.id)) erreur(`${ou}.id`, `Chaque colonne du bestiaire porte un identifiant unique (« ${c.id ?? ''} »).`);
        if (!c.libelle?.trim()) erreur(`${ou}.libelle`, `La colonne « ${c.id} » n'a pas de libellé.`);
        if (c.nature !== 'nombre' && c.nature !== 'texte') erreur(`${ou}.nature`, `La colonne « ${c.libelle || c.id} » est un nombre ou un texte.`);
        if (c.champ !== undefined) {
            if (!c.champ.trim()) erreur(`${ou}.champ`, `La colonne « ${c.libelle || c.id} » remplit un champ sans nom.`);
            else if (champsDeLaFiche && !champsDeLaFiche.has(c.champ)) erreur(`${ou}.champ`, `La colonne « ${c.libelle || c.id} » remplit « ${c.champ} », absent de la fiche.`);
            else if (champsRemplis.has(c.champ)) avertir(`${ou}.champ`, `« ${c.champ} » est déjà rempli par la colonne « ${champsRemplis.get(c.champ)} » : la dernière l'emportera.`);
            if (c.champ.trim()) champsRemplis.set(c.champ, c.libelle || c.id);
        }
        if (c.id) colonnes.set(c.id, c);
    });

    if (!Array.isArray(bestiaire.creatures)) erreur('bestiaire.creatures', 'Le bestiaire doit porter une liste de créatures.');
    const ids = new Set<string>();
    (Array.isArray(bestiaire.creatures) ? bestiaire.creatures : []).forEach((cr, i) => {
        const ou = `bestiaire.creatures[${i}]`;
        const nom = cr.nom?.trim() || cr.id || `n° ${i + 1}`;
        if (!cr.id?.trim() || ids.has(cr.id)) erreur(`${ou}.id`, `Chaque créature porte un identifiant unique (« ${cr.id ?? ''} », ${nom}).`);
        ids.add(cr.id);
        if (!cr.nom?.trim()) erreur(`${ou}.nom`, `La créature « ${cr.id} » n'a pas de nom.`);
        for (const [cle, valeur] of Object.entries(cr.valeurs ?? {})) {
            const colonne = colonnes.get(cle);
            if (!colonne) {
                erreur(`${ou}.valeurs.${cle}`, `${nom} : « ${cle} » n'est pas une colonne du bestiaire de ce jeu.`);
            } else if (colonne.nature === 'nombre' && String(valeur).trim() !== '' && !estUnNombre(valeur)) {
                avertir(`${ou}.valeurs.${cle}`, `${nom} : « ${valeur} » n'est pas un nombre ; une mécanique qui lit « ${colonne.libelle} » ne le comptera pas.`);
            }
        }
        const t = cr.attaques?.table;
        if (t && (!t.univers?.trim() || !t.table?.trim())) erreur(`${ou}.attaques.table`, `${nom} : une table d'attaques nomme son jeu et sa table.`);
        (cr.attaques?.lignes ?? []).forEach((l, j) => {
            if (!l.de?.trim() || !l.nom?.trim()) erreur(`${ou}.attaques.lignes[${j}]`, `${nom} : chaque attaque dit son résultat de dé et son nom.`);
        });
        if (cr.source?.page !== undefined && !(Number.isInteger(cr.source.page) && cr.source.page > 0)) {
            erreur(`${ou}.source.page`, `${nom} : la page de la source est un entier positif.`);
        }
    });
    return constats;
}

/** Un identifiant tiré du nom, unique dans le bestiaire : « Biodrone XX121B » → `biodrone-xx121b`. */
export function identifiantDeCreature(nom: string, existants: Iterable<string>): string {
    const pris = new Set(existants);
    const base = slug(nom) || 'creature';
    if (!pris.has(base)) return base;
    let n = 2;
    while (pris.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
}

export const bestiaireVide = (): BestiaireDuJeu => ({ colonnes: [], creatures: [] });

const SANS_CATEGORIE = 'Sans catégorie';
const plier = (texte: string) => texte.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();

/** Les créatures par catégorie du livre, dans l'ordre où elles paraissent ; sans catégorie à la fin. */
export function rangerParCategorie(creatures: CreatureDuBestiaire[]): { categorie: string; creatures: CreatureDuBestiaire[] }[] {
    const groupes = new Map<string, CreatureDuBestiaire[]>();
    for (const c of creatures) {
        const k = c.categorie?.trim() || SANS_CATEGORIE;
        groupes.set(k, [...(groupes.get(k) ?? []), c]);
    }
    const sans = groupes.get(SANS_CATEGORIE);
    groupes.delete(SANS_CATEGORIE);
    const rangs = [...groupes].map(([categorie, liste]) => ({ categorie, creatures: liste }));
    return sans ? [...rangs, { categorie: SANS_CATEGORIE, creatures: sans }] : rangs;
}

/** Cherche sans accents ni majuscules dans le nom, le nom original, la catégorie, les étiquettes et les particularités. */
export function chercherDansLeBestiaire(creatures: CreatureDuBestiaire[], texte: string): CreatureDuBestiaire[] {
    const cherche = plier(texte.trim());
    if (!cherche) return creatures;
    return creatures.filter(c => plier([c.nom, c.nomOriginal, c.categorie, ...(c.etiquettes ?? []), ...(c.particularites ?? [])].filter(Boolean).join(' ')).includes(cherche));
}

/** Le rang de la créature que vise un constat (`bestiaire.creatures[3].valeurs.sante` → 3), ou `null`. */
export function rangDuConstat(ou: string): number | null {
    const m = /^bestiaire\.creatures\[(\d+)\]/.exec(ou);
    return m ? Number(m[1]) : null;
}

/* ── Les gestes de l'éditeur (étape B, 05/11/2026) ─────────────────────────
 * Chaque geste rend un bestiaire neuf ; l'éditeur du pilote n'a qu'à l'enregistrer. Ce qu'un geste
 * emporte (les valeurs d'une colonne retirée) est retiré dans le même geste : sinon le contrôle
 * crierait une erreur que le meneur n'a pas commise.
 */

/** Ajoute une colonne ; son identifiant vient du libellé et ne bouge plus ensuite. */
export function ajouterUneColonne(bestiaire: BestiaireDuJeu, libelle: string, nature: 'nombre' | 'texte'): BestiaireDuJeu {
    const id = identifiantDeCreature(libelle, bestiaire.colonnes.map(c => c.id));
    return { ...bestiaire, colonnes: [...bestiaire.colonnes, { id, libelle: libelle.trim(), nature }] };
}

/** `champ: undefined` : la colonne reste au bestiaire, sans rien écrire sur la fiche de plateau. */
export function modifierUneColonne(bestiaire: BestiaireDuJeu, id: string, patch: Partial<Pick<ColonneDuBestiaire, 'libelle' | 'nature' | 'champ'>>): BestiaireDuJeu {
    return {
        ...bestiaire,
        colonnes: bestiaire.colonnes.map(c => {
            if (c.id !== id) return c;
            const suivante = { ...c, ...patch };
            if ('champ' in patch && !patch.champ) delete suivante.champ;
            return suivante;
        }),
    };
}

/** Combien de créatures portent une valeur dans cette colonne — ce que son retrait effacerait. */
export function valeursDeLaColonne(bestiaire: BestiaireDuJeu | undefined, id: string): number {
    return (bestiaire?.creatures ?? []).filter(c => c.valeurs?.[id] !== undefined && String(c.valeurs[id]).trim() !== '').length;
}

/** Retire la colonne **et** ses valeurs dans les créatures. */
export function retirerUneColonne(bestiaire: BestiaireDuJeu, id: string): BestiaireDuJeu {
    return {
        colonnes: bestiaire.colonnes.filter(c => c.id !== id),
        creatures: bestiaire.creatures.map(c => {
            if (!(id in (c.valeurs ?? {}))) return c;
            const valeurs = { ...c.valeurs };
            delete valeurs[id];
            return { ...c, valeurs };
        }),
    };
}

/** Ajoute une créature nommée ; rend aussi son identifiant, pour que l'éditeur la déplie. */
export function ajouterUneCreature(bestiaire: BestiaireDuJeu, nom: string): { bestiaire: BestiaireDuJeu; id: string } {
    const id = identifiantDeCreature(nom, bestiaire.creatures.map(c => c.id));
    return { id, bestiaire: { ...bestiaire, creatures: [...bestiaire.creatures, { id, nom: nom.trim(), valeurs: {} }] } };
}

/** L'identifiant ne change pas : les rencontres et les variantes du meneur y renverront (étape D). */
export function modifierUneCreature(bestiaire: BestiaireDuJeu, id: string, patch: Partial<Omit<CreatureDuBestiaire, 'id'>>): BestiaireDuJeu {
    return { ...bestiaire, creatures: bestiaire.creatures.map(c => (c.id === id ? { ...c, ...patch } : c)) };
}

export function retirerUneCreature(bestiaire: BestiaireDuJeu, id: string): BestiaireDuJeu {
    return { ...bestiaire, creatures: bestiaire.creatures.filter(c => c.id !== id) };
}

/** Un nombre lu dans une case : « 8 » → 8, « +2 » → 2 ; un texte reste un texte. */
const lireLaValeur = (v: string | number): string | number => {
    if (typeof v === 'number') return v;
    return estUnNombre(v) ? Number(v.trim().replace(',', '.')) : v;
};

/**
 * **La fiche de plateau d'une créature** : chaque colonne qui déclare son `champ` y écrit sa
 * valeur. C'est le contrat du modèle — ce que Combat-OS posera sur le plateau (étape D), et ce que
 * les mécaniques existantes lisent. Une colonne sans `champ` reste au bestiaire (à lire, pas à jouer).
 */
export function ficheDePlateau(bestiaire: BestiaireDuJeu, creature: CreatureDuBestiaire): Record<string, string | number> {
    const fiche: Record<string, string | number> = {};
    for (const c of bestiaire.colonnes) {
        const v = creature.valeurs[c.id];
        if (!c.champ || v === undefined || String(v).trim() === '') continue;
        fiche[c.champ] = c.nature === 'nombre' ? lireLaValeur(v) : String(v);
    }
    return fiche;
}
