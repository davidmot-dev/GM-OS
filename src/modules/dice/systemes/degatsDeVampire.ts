/**
 * **Les dégâts de Vampire : la Mascarade (V5), case par case** — 17/11/2026, à la demande de
 * David (« commence les améliorations pour Vampire », la ligne 🔴 de la synthèse des pilotes).
 * Livre de base français, pages **imprimées** (PDF − 4).
 *
 * La Santé (Vigueur + 3) et la Volonté (Résolution + Sang-froid) sont deux jauges de cases ;
 * chaque case reçoit un dégât **superficiel** « / » ou **aggravé** « X » (p. 126) :
 *
 * - **Notation** : sauf précision contraire, les dégâts superficiels sont **divisés par deux,
 *   arrondi au supérieur**, avant d'être notés. Une dépense volontaire (relancer par la
 *   Volonté) se note « / » et ne se divise pas (p. 126).
 * - **Affaiblissement** : une jauge remplie, de « / », de « X » ou des deux, rend le
 *   personnage **Affaibli** : −2 dés aux groupements physiques (Santé) ou sociaux et mentaux
 *   (Volonté), et à tout autre que le conteur juge touché (p. 126). Chaque niveau de dégâts
 *   subi **en étant Affaibli** convertit un « / » déjà noté en « X » (p. 127).
 * - **Fin de la jauge** : remplie de « X », le personnage est hors de combat — coma ou mort
 *   pour un mortel, **torpeur** pour un vampire (p. 127, 223). La Volonté pleine de « X »
 *   lors d'un conflit social : il craque et perd la face (p. 127).
 * - **Guérison** (p. 127, 218-219) : un vampire régénère des « / » de Santé par test
 *   d'Exaltation, selon sa Puissance du sang (tableau p. 216), un seul test par tour ; un
 *   « X » par nuit contre trois tests de plus. Au début de chaque partie, la Volonté perd
 *   autant de « / » que la Résolution ou le Sang-froid, le plus élevé (p. 127).
 *
 * **Ce que GM-OS appelle la Santé (ou la Volonté) restante** : les cases **sans « X »**. Elle
 * tombe à zéro exactement quand le livre met hors de combat, ce que la santé de GM-OS, ses
 * états et Combat-OS savent déjà lire ; l'Affaiblissement se lit sur les marques. Une santé
 * « cases vides » serait tombée à zéro dès l'Affaiblissement, et GM-OS y aurait écrit la mort.
 *
 * Les marques se rangent dans un champ texte de la fiche, « X » d'abord, puis « / » :
 * `XX//` — deux aggravés, deux superficiels. C'est la forme que la fiche HTML relie case par
 * case (transformation `marquesDeVampire`, `fiches/correspondanceDeFiche.ts`).
 *
 * Tout ici est pur : des marques et des nombres entrent, des marques et un texte sortent.
 */

/** Les marques d'une jauge. */
export interface PisteDeVampire {
    superficiels: number;
    aggraves: number;
}

export type EtatDeLaPiste = 'indemne' | 'blesse' | 'affaibli' | 'hors-de-combat';

export const LIBELLES_DE_LA_PISTE: Record<EtatDeLaPiste, string> = {
    indemne: 'Indemne',
    blesse: 'Blessé',
    affaibli: 'Affaibli',
    'hors-de-combat': 'Hors de combat',
};

const entier = (n: unknown) => Math.max(0, Math.trunc(Number(n) || 0));

/**
 * Lit les marques d'un champ : « X » (ou « x ») pour un aggravé, « / » pour un superficiel ;
 * le reste — espaces, tirets, points — est ignoré, pour qu'une saisie à la main se lise.
 */
export function lireLesMarques(valeur: unknown): PisteDeVampire {
    const texte = String(valeur ?? '');
    return {
        aggraves: (texte.match(/[xX]/g) ?? []).length,
        superficiels: (texte.match(/\//g) ?? []).length,
    };
}

/** Écrit les marques, « X » d'abord : `XX//`. Une jauge indemne est un texte vide. */
export function ecrireLesMarques(piste: PisteDeVampire): string {
    return 'X'.repeat(entier(piste.aggraves)) + '/'.repeat(entier(piste.superficiels));
}

/** Les marques bornées à la jauge : jamais plus de cases que la capacité, les « X » d'abord. */
export function bornerLaPiste(piste: PisteDeVampire, capacite: number): PisteDeVampire {
    const cap = entier(capacite);
    const aggraves = Math.min(cap, entier(piste.aggraves));
    return { aggraves, superficiels: Math.min(cap - aggraves, entier(piste.superficiels)) };
}

/** L'état d'une jauge (p. 126-127). */
export function etatDeLaPiste(piste: PisteDeVampire, capacite: number): EtatDeLaPiste {
    const cap = entier(capacite);
    const { aggraves, superficiels } = bornerLaPiste(piste, cap);
    if (cap > 0 && aggraves >= cap) return 'hors-de-combat';
    if (cap > 0 && aggraves + superficiels >= cap) return 'affaibli';
    return aggraves + superficiels > 0 ? 'blesse' : 'indemne';
}

/** Les cases sans « X » : ce que GM-OS tient pour la Santé ou la Volonté restante. */
export const casesSansAggrave = (piste: PisteDeVampire, capacite: number) =>
    Math.max(0, entier(capacite) - bornerLaPiste(piste, capacite).aggraves);

export type NatureDuDegat = 'superficiel' | 'aggrave';

export interface Encaissement {
    piste: PisteDeVampire;
    /** Les niveaux notés, après la division des superficiels. */
    notes: number;
    /** Les « / » changés en « X » parce que la jauge était pleine (p. 127). */
    convertis: number;
    /** Les niveaux qui ne trouvent plus rien à marquer : la jauge est pleine de « X ». */
    perdus: number;
    avant: EtatDeLaPiste;
    apres: EtatDeLaPiste;
}

/**
 * Note des dégâts sur une jauge (p. 126-127). `diviser` : les superficiels se divisent par
 * deux, arrondi au supérieur, sauf précision contraire — et jamais pour une dépense.
 */
export function encaisserVampire(
    piste: PisteDeVampire,
    capacite: number,
    niveaux: number,
    nature: NatureDuDegat,
    options: { diviser?: boolean } = {},
): Encaissement {
    const cap = entier(capacite);
    const depart = bornerLaPiste(piste, cap);
    const brut = entier(niveaux);
    const notes = nature === 'superficiel' && options.diviser !== false ? Math.ceil(brut / 2) : brut;
    let { aggraves, superficiels } = depart;
    let convertis = 0, perdus = 0;
    for (let i = 0; i < notes; i++) {
        if (aggraves + superficiels < cap) {
            if (nature === 'aggrave') aggraves++; else superficiels++;
        } else if (superficiels > 0) {
            // Affaibli : chaque niveau, superficiel ou aggravé, change un « / » en « X » (p. 127).
            superficiels--; aggraves++; convertis++;
        } else perdus++;
    }
    const resultat = { aggraves, superficiels };
    return { piste: resultat, notes, convertis, perdus, avant: etatDeLaPiste(depart, cap), apres: etatDeLaPiste(resultat, cap) };
}

/** Efface des marques d'une nature (une guérison) ; les autres ne bougent pas. */
export function soignerVampire(piste: PisteDeVampire, niveaux: number, nature: NatureDuDegat): { piste: PisteDeVampire; rendus: number } {
    const n = entier(niveaux);
    if (nature === 'aggrave') {
        const rendus = Math.min(n, entier(piste.aggraves));
        return { piste: { ...piste, aggraves: entier(piste.aggraves) - rendus }, rendus };
    }
    const rendus = Math.min(n, entier(piste.superficiels));
    return { piste: { ...piste, superficiels: entier(piste.superficiels) - rendus }, rendus };
}

/**
 * Les « / » de Santé qu'un test d'Exaltation régénère, selon la Puissance du sang
 * (tableau p. 216) : 1 jusqu'à 1, 2 jusqu'à 3, 3 jusqu'à 7, 4 jusqu'à 9, 5 à 10.
 */
export function regenerationParExaltation(puissanceDuSang: unknown): number {
    const p = Math.min(10, entier(puissanceDuSang));
    if (p <= 1) return 1;
    if (p <= 3) return 2;
    if (p <= 7) return 3;
    if (p <= 9) return 4;
    return 5;
}

/** Les « / » de Volonté effacés au début d'une partie : la Résolution ou le Sang-froid, le plus élevé (p. 127). */
export const recuperationDeVolonte = (resolution: unknown, sangFroid: unknown) => Math.max(entier(resolution), entier(sangFroid));

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Ce que dit l'écran d'un encaissement, avec les pages du livre. */
export function direLEncaissement(jauge: 'Santé' | 'Volonté', brut: number, nature: NatureDuDegat, e: Encaissement, options: { diviser?: boolean; vampire?: boolean } = {}): string {
    const marque = nature === 'aggrave' ? 'aggravé' : 'superficiel';
    const division = nature === 'superficiel' && options.diviser !== false && e.notes !== brut ? ` (${brut} divisés par deux)` : '';
    const parts = [`${jauge} : ${pluriel(e.notes, `dégât ${marque}`)}${division} — ${ecrireLesMarques(e.piste) || 'aucune marque'}`];
    if (e.convertis > 0) parts.push(`${pluriel(e.convertis, '« / » changé')} en « X », jauge pleine (p. 127)`);
    if (e.apres === 'affaibli' && e.avant !== 'affaibli') {
        parts.push(jauge === 'Santé' ? 'Affaibli : −2 dés aux groupements physiques (p. 126)' : 'Affaibli : −2 dés aux groupements sociaux et mentaux (p. 126)');
    }
    if (e.apres === 'hors-de-combat' && e.avant !== 'hors-de-combat') {
        // Le pilote ne dit pas qui est vampire : sans l'information, les deux issues du livre.
        const issue = options.vampire === true ? 'torpeur (p. 127, 223)' : options.vampire === false ? 'coma ou mort (p. 127)'
            : 'torpeur pour un vampire, coma ou mort pour un mortel (p. 127, 223)';
        parts.push(jauge === 'Santé'
            ? `jauge pleine de « X » : ${issue}`
            : 'jauge pleine de « X » : dans un conflit social, il craque et perd la face (p. 127)');
    }
    return `${parts.join(' ; ')}.`;
}

/**
 * La capacité d'une jauge lue sur la fiche seule : ses cases sans « X » plus ses « X ». Le
 * panneau de jet ne connaît pas les maxima du pilote ; la porte des dégâts, qui les connaît,
 * écrit toujours la jauge restante avec les marques, et cette somme les retrouve.
 */
export const capaciteLueSurLaFiche = (marques: unknown, restante: unknown) => entier(restante) + lireLesMarques(marques).aggraves;

/**
 * **Dépenser un point** — relancer par la Volonté (p. 122, 126) : un « / » non divisé ; sur une
 * jauge pleine, un « / » devient « X ». `null` quand la jauge est déjà pleine de « X ».
 */
export function depenserUnPoint(jauge: 'Santé' | 'Volonté', marques: unknown, restante: unknown): { marques: string; restante: number; texte: string } | null {
    const capacite = capaciteLueSurLaFiche(marques, restante);
    const avant = lireLesMarques(marques);
    if (capacite <= 0 || etatDeLaPiste(avant, capacite) === 'hors-de-combat') return null;
    const e = encaisserVampire(avant, capacite, 1, 'superficiel', { diviser: false });
    return { marques: ecrireLesMarques(e.piste), restante: casesSansAggrave(e.piste, capacite), texte: direLEncaissement(jauge, 1, 'superficiel', e, { diviser: false }) };
}
