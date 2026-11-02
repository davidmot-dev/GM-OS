import type { CatalogueDEquipement, ColonneDuCatalogue, FamilleDObjet, ObjetDuCatalogue } from '../../types/drivers';
import { slug } from '../../../electron/corpusSysteme';

/**
 * Le catalogue d'équipement du pilote — registre § 203, étape A (02/11/2026).
 *
 * Ce module ne dépend d'aucun écran : l'éditeur du pilote, la Forge qui le
 * remplit depuis le corpus, la fiche qui s'y équipe et le panneau de jet qui
 * rappelle les effets le liront tous. Les types vivent dans `types/drivers.ts`.
 */

export const FAMILLES_D_OBJET: readonly { id: FamilleDObjet; libelle: string; pluriel: string }[] = [
    { id: 'arme', libelle: 'Arme', pluriel: 'armes' },
    { id: 'protection', libelle: 'Protection', pluriel: 'protections' },
    { id: 'vehicule', libelle: 'Véhicule', pluriel: 'véhicules' },
    { id: 'materiel', libelle: 'Matériel', pluriel: 'matériel' },
];
const FAMILLES = new Set<string>(FAMILLES_D_OBJET.map(f => f.id));
const pluriel = (famille: string) => FAMILLES_D_OBJET.find(f => f.id === famille)?.pluriel ?? famille;

/** Même forme que `ConstatDuPilote`, que `controlerLePilote` reprend tel quel. */
export interface ConstatDuCatalogue {
    gravite: 'erreur' | 'avertissement';
    ou: string;
    message: string;
}

/** Un nombre tel qu'on l'écrit dans un tableau : « 3 », « +2 », « -1 », « 1,5 ». */
const estUnNombre = (v: unknown) =>
    (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && /^[+-]?\d+(?:[.,]\d+)?$/.test(v.trim()));

/**
 * Ce qui rendrait le catalogue faux à l'usage — **dit, jamais réparé en douce**.
 *
 * Erreurs : ce qui casserait un geste (un objet contenu introuvable, une
 * valeur dans une colonne que le jeu ne déclare pas, deux objets du même
 * identifiant). Avertissements : ce qui se lit mais qu'une mécanique ne saura
 * pas compter (« Puissance 9 » dans une colonne de nombres).
 */
export function controlerLeCatalogue(catalogue: CatalogueDEquipement | undefined): ConstatDuCatalogue[] {
    const constats: ConstatDuCatalogue[] = [];
    if (!catalogue) return constats;
    const erreur = (ou: string, message: string) => constats.push({ gravite: 'erreur', ou, message });
    const avertir = (ou: string, message: string) => constats.push({ gravite: 'avertissement', ou, message });

    const colonnesParFamille = new Map<string, Map<string, 'nombre' | 'texte'>>();
    for (const [famille, colonnes] of Object.entries(catalogue.colonnes ?? {})) {
        const ou = `catalogue.colonnes.${famille}`;
        if (!FAMILLES.has(famille)) erreur(ou, `« ${famille} » n'est pas une famille d'objets (armes, protections, véhicules, matériel).`);
        const vues = new Map<string, 'nombre' | 'texte'>();
        (colonnes ?? []).forEach((c, i) => {
            if (!c.id?.trim() || vues.has(c.id)) erreur(`${ou}[${i}].id`, `Chaque colonne des ${pluriel(famille)} porte un identifiant unique (« ${c.id ?? ''} »).`);
            if (!c.libelle?.trim()) erreur(`${ou}[${i}].libelle`, `La colonne « ${c.id} » n'a pas de libellé.`);
            if (c.nature !== 'nombre' && c.nature !== 'texte') erreur(`${ou}[${i}].nature`, `La colonne « ${c.libelle || c.id} » est un nombre ou un texte.`);
            if (c.id) vues.set(c.id, c.nature);
        });
        colonnesParFamille.set(famille, vues);
    }

    const objets = Array.isArray(catalogue.objets) ? catalogue.objets : [];
    if (!Array.isArray(catalogue.objets)) erreur('catalogue.objets', 'Le catalogue doit porter une liste d\'objets.');
    const ids = new Set<string>();
    objets.forEach((o, i) => {
        const ou = `catalogue.objets[${i}]`;
        const nom = o.nom?.trim() || o.id || `n° ${i + 1}`;
        if (!o.id?.trim() || ids.has(o.id)) erreur(`${ou}.id`, `Chaque objet porte un identifiant unique (« ${o.id ?? ''} », ${nom}).`);
        ids.add(o.id);
        if (!o.nom?.trim()) erreur(`${ou}.nom`, `L'objet « ${o.id} » n'a pas de nom.`);
        if (!FAMILLES.has(o.famille)) erreur(`${ou}.famille`, `${nom} : « ${o.famille} » n'est pas une famille d'objets.`);
        const colonnes = colonnesParFamille.get(o.famille) ?? new Map();
        for (const [cle, valeur] of Object.entries(o.valeurs ?? {})) {
            const nature = colonnes.get(cle);
            if (!nature) {
                erreur(`${ou}.valeurs.${cle}`, `${nom} : « ${cle} » n'est pas une colonne des ${pluriel(o.famille)} de ce jeu.`);
            } else if (nature === 'nombre' && String(valeur).trim() !== '' && !estUnNombre(valeur)) {
                avertir(`${ou}.valeurs.${cle}`, `${nom} : « ${valeur} » n'est pas un nombre ; une mécanique qui lit « ${cle} » ne le comptera pas.`);
            }
        }
        (o.effets ?? []).forEach((e, j) => {
            if (!e.texte?.trim()) erreur(`${ou}.effets[${j}]`, `${nom} : un effet doit dire ce qu'il fait.`);
            if (e.valeur !== undefined && !Number.isFinite(e.valeur)) erreur(`${ou}.effets[${j}].valeur`, `${nom} : la valeur d'un effet est un nombre.`);
        });
        if (o.source?.page !== undefined && !(Number.isInteger(o.source.page) && o.source.page > 0)) {
            erreur(`${ou}.source.page`, `${nom} : la page de la source est un entier positif.`);
        }
    });

    const parId = new Map(objets.map(o => [o.id, o]));
    objets.forEach((o, i) => {
        (o.contient ?? []).forEach((id, j) => {
            const ou = `catalogue.objets[${i}].contient[${j}]`;
            if (id === o.id) erreur(ou, `${o.nom} se contient lui-même.`);
            else if (!parId.has(id)) erreur(ou, `${o.nom} emporte « ${id} », absent du catalogue.`);
        });
    });
    // Un cercle (A contient B qui contient A) ferait tourner sans fin qui déplie l'équipement.
    const signales = new Set<string>();
    for (const depart of objets) {
        const chemin = cheminCirculaire(depart.id, parId);
        if (chemin && !signales.has(depart.id)) {
            chemin.forEach(id => signales.add(id));
            erreur(`catalogue.objets[${objets.indexOf(depart)}].contient`,
                `Les objets s'emportent en cercle : ${chemin.map(id => parId.get(id)?.nom ?? id).join(' → ')}.`);
        }
    }
    return constats;
}

/** Le premier cercle qui repasse par `depart`, ou `null`. */
function cheminCirculaire(depart: string, parId: Map<string, ObjetDuCatalogue>): string[] | null {
    const pile: { id: string; chemin: string[] }[] = [{ id: depart, chemin: [depart] }];
    const vus = new Set<string>();
    while (pile.length) {
        const { id, chemin } = pile.pop()!;
        for (const suivant of parId.get(id)?.contient ?? []) {
            if (suivant === depart && chemin.length > 1) return [...chemin, depart];
            if (suivant === id || vus.has(suivant) || !parId.has(suivant)) continue;
            vus.add(suivant);
            pile.push({ id: suivant, chemin: [...chemin, suivant] });
        }
    }
    return null;
}

/** Les objets qu'un objet emporte, dans son ordre ; une référence introuvable est ignorée (le contrôle la signale). */
export function objetsContenus(catalogue: CatalogueDEquipement, objet: ObjetDuCatalogue): ObjetDuCatalogue[] {
    const parId = new Map(catalogue.objets.map(o => [o.id, o]));
    return (objet.contient ?? []).flatMap(id => (id !== objet.id && parId.has(id) ? [parId.get(id)!] : []));
}

/** Les objets d'une famille, dans l'ordre du catalogue. */
export function objetsDeLaFamille(catalogue: CatalogueDEquipement | undefined, famille: FamilleDObjet): ObjetDuCatalogue[] {
    return (catalogue?.objets ?? []).filter(o => o.famille === famille);
}

/** Un identifiant tiré du nom, unique dans le catalogue : « Fusil à impulsion M41A » → `fusil-a-impulsion-m41a`. */
export function identifiantDObjet(nom: string, existants: Iterable<string>): string {
    const pris = new Set(existants);
    const base = slug(nom) || 'objet';
    if (!pris.has(base)) return base;
    let n = 2;
    while (pris.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
}

/* ── Les gestes de l'éditeur (étape B) ─────────────────────────────────────
 * Chaque geste rend un catalogue neuf ; l'éditeur du pilote n'a qu'à
 * l'enregistrer. Ce qu'un geste emporte avec lui (les valeurs d'une colonne
 * retirée, les renvois vers un objet supprimé) est retiré dans le même geste :
 * sinon le contrôle crierait ensuite une erreur que le meneur n'a pas commise.
 */

export const catalogueVide = (): CatalogueDEquipement => ({ colonnes: {}, objets: [] });

/** Ajoute une colonne à une famille ; son identifiant vient du libellé et ne bouge plus ensuite. */
export function ajouterUneColonne(catalogue: CatalogueDEquipement, famille: FamilleDObjet, libelle: string, nature: 'nombre' | 'texte'): CatalogueDEquipement {
    const colonnes = catalogue.colonnes[famille] ?? [];
    const id = identifiantDObjet(libelle, colonnes.map(c => c.id));
    return { ...catalogue, colonnes: { ...catalogue.colonnes, [famille]: [...colonnes, { id, libelle: libelle.trim(), nature }] } };
}

export function modifierUneColonne(catalogue: CatalogueDEquipement, famille: FamilleDObjet, id: string, patch: Partial<Pick<ColonneDuCatalogue, 'libelle' | 'nature'>>): CatalogueDEquipement {
    const colonnes = (catalogue.colonnes[famille] ?? []).map(c => (c.id === id ? { ...c, ...patch } : c));
    return { ...catalogue, colonnes: { ...catalogue.colonnes, [famille]: colonnes } };
}

/** Combien d'objets de la famille portent une valeur dans cette colonne — ce que son retrait effacerait. */
export function valeursDeLaColonne(catalogue: CatalogueDEquipement | undefined, famille: FamilleDObjet, id: string): number {
    return objetsDeLaFamille(catalogue, famille).filter(o => o.valeurs?.[id] !== undefined && String(o.valeurs[id]).trim() !== '').length;
}

/** Retire la colonne **et** ses valeurs dans les objets de la famille. */
export function retirerUneColonne(catalogue: CatalogueDEquipement, famille: FamilleDObjet, id: string): CatalogueDEquipement {
    return {
        colonnes: { ...catalogue.colonnes, [famille]: (catalogue.colonnes[famille] ?? []).filter(c => c.id !== id) },
        objets: catalogue.objets.map(o => {
            if (o.famille !== famille || !(id in (o.valeurs ?? {}))) return o;
            const valeurs = { ...o.valeurs };
            delete valeurs[id];
            return { ...o, valeurs };
        }),
    };
}

/** Ajoute un objet nommé ; rend aussi son identifiant, pour que l'éditeur le déplie. */
export function ajouterUnObjet(catalogue: CatalogueDEquipement, famille: FamilleDObjet, nom: string): { catalogue: CatalogueDEquipement; id: string } {
    const id = identifiantDObjet(nom, catalogue.objets.map(o => o.id));
    return { id, catalogue: { ...catalogue, objets: [...catalogue.objets, { id, famille, nom: nom.trim(), valeurs: {} }] } };
}

/** L'identifiant et la famille ne changent pas : d'autres objets, et bientôt les fiches, y renvoient. */
export function modifierUnObjet(catalogue: CatalogueDEquipement, id: string, patch: Partial<Omit<ObjetDuCatalogue, 'id' | 'famille'>>): CatalogueDEquipement {
    return { ...catalogue, objets: catalogue.objets.map(o => (o.id === id ? { ...o, ...patch } : o)) };
}

/** Retire l'objet, et le retire de ce que les autres emportent. */
export function retirerUnObjet(catalogue: CatalogueDEquipement, id: string): CatalogueDEquipement {
    return {
        ...catalogue,
        objets: catalogue.objets.filter(o => o.id !== id).map(o => (o.contient?.includes(id) ? { ...o, contient: o.contient.filter(c => c !== id) } : o)),
    };
}

const SANS_CATEGORIE = 'Sans catégorie';
const plier = (texte: string) => texte.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();

/** Les objets rangés sous leur catégorie, dans l'ordre où elles apparaissent ; les objets sans catégorie à la fin. */
export function rangerParCategorie(objets: ObjetDuCatalogue[]): { categorie: string; objets: ObjetDuCatalogue[] }[] {
    const groupes = new Map<string, ObjetDuCatalogue[]>();
    for (const o of objets) {
        const categorie = o.categorie?.trim() || SANS_CATEGORIE;
        groupes.set(categorie, [...(groupes.get(categorie) ?? []), o]);
    }
    const sans = groupes.get(SANS_CATEGORIE);
    groupes.delete(SANS_CATEGORIE);
    const rangs = [...groupes].map(([categorie, liste]) => ({ categorie, objets: liste }));
    return sans ? [...rangs, { categorie: SANS_CATEGORIE, objets: sans }] : rangs;
}

/** Cherche sans accents ni majuscules dans le nom, le nom original, la catégorie, les étiquettes et les propriétés. */
export function chercherDansLeCatalogue(objets: ObjetDuCatalogue[], texte: string): ObjetDuCatalogue[] {
    const cherche = plier(texte.trim());
    if (!cherche) return objets;
    return objets.filter(o => plier([o.nom, o.nomOriginal, o.categorie, ...(o.etiquettes ?? []), ...(o.proprietes ?? [])].filter(Boolean).join(' ')).includes(cherche));
}

/** Le rang de l'objet que vise un constat (`catalogue.objets[3].valeurs.degats` → 3), ou `null`. */
export function rangDuConstat(ou: string): number | null {
    const m = /^catalogue\.objets\[(\d+)\]/.exec(ou);
    return m ? Number(m[1]) : null;
}
