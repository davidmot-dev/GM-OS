/**
 * **Ce qui a changé sur une fiche, dit au journal** — H1 de l'audit du
 * 2026-10-22 (`documentation/Planning/2026-10-22-audit-fiches-tablettes-journal.md`).
 *
 * Une modification de fiche — par le meneur, une tablette, un geste de table,
 * un jet — ne s'inscrivait nulle part : seuls les coups, soins, jets et
 * réserves allaient au journal. Qui a changé quoi, de combien, ne se
 * retrouvait pas.
 *
 * Pur : on compare deux états de fiche, on cumule les changements d'un même
 * moment — **un curseur qu'on fait glisser donne une ligne, pas dix** — et on
 * les dit. L'observateur qui écoute le magasin et écrit au journal est
 * `useHistoriqueDesFiches`.
 */

/** Un champ qui a bougé : sa valeur d'avant le moment, et celle d'après. */
export interface ChangementDeChamp {
    champ: string;
    avant: unknown;
    apres: unknown;
}

/** Les champs narratifs du personnage, suivis comme ceux de la fiche. */
export const CHAMPS_NARRATIFS = ['description', 'playerNotes', 'gmNotes', 'inventory'] as const;

/**
 * **Au-delà, c'est un chargement, pas une modification** : une reprise, un
 * import, une fiche HTML reliée réécrivent des dizaines de champs d'un coup, et
 * les dire tous noierait le journal sous ce que personne n'a fait en séance.
 */
export const SEUIL_D_UN_CHARGEMENT = 20;

/** Au-delà de cette longueur, un texte se dit « modifié », sans être recopié. */
const TEXTE_LONG = 60;

const primitive = (v: unknown) => v === undefined || v === null || ['string', 'number', 'boolean'].includes(typeof v);

/**
 * Les champs qui diffèrent entre deux fiches. Les clés internes (`_…`, `__…` :
 * suivis Alien, santé du Voyageur, seuils traités) et les valeurs composées ne
 * se disent pas : ce sont des mécanismes, pas des valeurs que la table lit.
 */
export function changementsDeFiche(
    avant: Record<string, unknown> | undefined,
    apres: Record<string, unknown> | undefined,
): ChangementDeChamp[] {
    const a = avant ?? {};
    const b = apres ?? {};
    const cles = new Set([...Object.keys(a), ...Object.keys(b)]);
    const changements: ChangementDeChamp[] = [];
    for (const champ of cles) {
        if (champ.startsWith('_')) continue;
        if (!primitive(a[champ]) || !primitive(b[champ])) continue;
        if (a[champ] === b[champ]) continue;
        // « » et absent ne sont pas un changement que quelqu'un a fait.
        if ((a[champ] ?? '') === (b[champ] ?? '')) continue;
        changements.push({ champ, avant: a[champ], apres: b[champ] });
    }
    return changements;
}

/**
 * Ajoute des changements à ceux du moment en cours : le premier « avant » est
 * gardé, le dernier « après » l'emporte, et un champ revenu à sa valeur de
 * départ disparaît — taper puis effacer n'a rien changé.
 */
export function cumuler(moment: Map<string, ChangementDeChamp>, changements: readonly ChangementDeChamp[]): void {
    for (const c of changements) {
        const deja = moment.get(c.champ);
        const avant = deja ? deja.avant : c.avant;
        if ((avant ?? '') === (c.apres ?? '')) moment.delete(c.champ);
        else moment.set(c.champ, { champ: c.champ, avant, apres: c.apres });
    }
}

const dire = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v));

/** Une ligne du journal : « Force 3 → 4 », « Fatigué coché », « « Notes » modifié ». */
export function direLeChangement(c: ChangementDeChamp, libelle: string): string {
    if (typeof c.apres === 'boolean' || typeof c.avant === 'boolean') {
        return `${libelle} ${c.apres ? 'coché' : 'décoché'}`;
    }
    const long = (v: unknown) => typeof v === 'string' && v.length > TEXTE_LONG;
    if (long(c.avant) || long(c.apres)) return `« ${libelle} » modifié`;
    return `${libelle} ${dire(c.avant)} → ${dire(c.apres)}`;
}
