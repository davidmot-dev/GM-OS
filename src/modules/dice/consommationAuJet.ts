import type { DegreDeReussite } from './degresDeReussite';

/**
 * **Ce qu'un jet consomme sur la fiche, selon ce qui a été lancé** — Nephilim,
 * 2026-10-18 (lot D, option B ; choix de David : « seules, au lancer »).
 *
 * Une transmutation alchimique consomme autant de degrés de Materiae Primae que
 * le degré de la formule, de l'élément de la formule, sur une réussite, un échec
 * ou une maladresse — et les conserve sur un critique (Quintessence p. 220).
 * La règle ne laisse pas de choix : GM-OS retire au lancer, et le dit.
 *
 * Le jet retient la formule par une composante (`composante`, son degré) ;
 * l'élément se lit sur un champ voisin de la même ligne de la fiche
 * (`elementSur` : `alchemy_formulas_3_degree` → `alchemy_formulas_3_element`) ;
 * `champs` dit quelle jauge porte chaque élément.
 */
export interface ConsommationAuJet {
    /** Ce qui se consomme, dit à l'écran : « Materiae Primae ». */
    label: string;
    /** La composante du jet dont le champ retenu donne la quantité (le degré de la formule). */
    composante: string;
    /** Le champ de l'élément, déduit de celui retenu : une expression et son remplacement. */
    elementSur: { remplacer: string; par: string };
    /** La jauge qui porte chaque élément : « Eau » → `alchemy_materia_water`. */
    champs: Record<string, string>;
    /** Les résultats qui ne consomment rien : le critique. */
    conserveeSur?: ('critique')[];
    /**
     * Le second élément d'une formule de l'Œuvre au blanc (2026-10-23) : la même
     * quantité de Materiae Primae de cet élément-là aussi (p. 220).
     */
    elementSecondSur?: { remplacer: string; par: string };
}

export type Consommation =
    | { conservee: true; label: string; quantite: number; element: string }
    | { conservee: false; label: string; quantite: number; element: string; champ: string; avant: number; apres: number; manque: number };

const nombre = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

/**
 * Ce que ce jet consomme, ou `null` quand il ne consomme rien : pas de formule
 * retenue, un degré nul, un élément inconnu de la table.
 */
export function consommationDuJet(
    regle: ConsommationAuJet | undefined,
    retenus: Record<string, string>,
    valeurs: Record<string, unknown>,
    degre: DegreDeReussite | undefined,
): Consommation | null {
    return consommationsDuJet(regle, retenus, valeurs, degre)[0] ?? null;
}

/** Tout ce que ce jet consomme : un élément, ou deux pour une formule de l'Œuvre au blanc. */
export function consommationsDuJet(
    regle: ConsommationAuJet | undefined,
    retenus: Record<string, string>,
    valeurs: Record<string, unknown>,
    degre: DegreDeReussite | undefined,
): Consommation[] {
    if (!regle) return [];
    const retenu = retenus[regle.composante];
    if (!retenu) return [];
    const quantite = Math.max(0, Math.floor(nombre(valeurs[retenu])));
    if (quantite === 0) return [];
    const premiere = consommer(regle, retenu, regle.elementSur, quantite, valeurs, degre);
    const seconde = regle.elementSecondSur ? consommer(regle, retenu, regle.elementSecondSur, quantite, valeurs, degre) : null;
    // « Double Ka-Lune » (p. 229) : deux fois la même jauge, en une seule écriture.
    if (premiere && seconde && premiere.element === seconde.element) {
        return [consommer(regle, retenu, regle.elementSur, quantite * 2, valeurs, degre)!];
    }
    return [premiere, seconde].filter((c): c is Consommation => !!c);
}

function consommer(
    regle: ConsommationAuJet, retenu: string, sur: { remplacer: string; par: string }, quantite: number,
    valeurs: Record<string, unknown>, degre: DegreDeReussite | undefined,
): Consommation | null {
    let champDeLElement: string;
    try {
        champDeLElement = retenu.replace(new RegExp(sur.remplacer), sur.par);
    } catch {
        return null;
    }
    const element = String(valeurs[champDeLElement] ?? '').trim();
    const champ = regle.champs[element];
    if (!champ) return null;
    if (degre === 'reussite-particuliere' && regle.conserveeSur?.includes('critique')) {
        return { conservee: true, label: regle.label, quantite, element };
    }
    const avant = Math.max(0, Math.floor(nombre(valeurs[champ])));
    const apres = Math.max(0, avant - quantite);
    return { conservee: false, label: regle.label, quantite, element, champ, avant, apres, manque: Math.max(0, quantite - avant) };
}

/** La ligne dite sous le résultat. */
export function direLaConsommation(c: Consommation): string {
    if (c.conservee) return `${c.label} ${c.element} conservées (critique) : ${c.quantite} non consommée${c.quantite > 1 ? 's' : ''}`;
    return `${c.label} ${c.element} −${c.quantite} → ${c.apres}`
        + (c.manque > 0 ? ` — il en manquait ${c.manque} : Ka du construct, du Pentacle ou de la stase à sacrifier (p. 218)` : '');
}
