/**
 * **Les circonstances qui déplacent le seuil du jet gardé** — Crimes, C0.1
 * (2026-10-23), livre p. 389-390 et 412. Voir `CirconstancesDuSeuil.tsx`.
 */
export interface Circonstances { distance: number; mobilite: number; taille: number; angoisse: number | null; autre: number }
export const CIRCONSTANCES: Circonstances = { distance: 0, mobilite: 0, taille: 0, angoisse: null, autre: 0 };

/** L'angoisse ne pèse au tir qu'au-dessus de 3 ; tant que le meneur n'a rien choisi, un point. */
export const penaliteDAngoisse = (c: Circonstances, angoisse?: number) =>
    c.angoisse ?? ((angoisse ?? 0) > 3 ? 1 : 0);

/** Ce que les circonstances ajoutent au seuil : celles du tir seulement avec une arme à feu. */
export const totalDesCirconstances = (c: Circonstances, tir: boolean, angoisse?: number) =>
    (tir ? c.distance + c.mobilite + c.taille + penaliteDAngoisse(c, angoisse) : 0) + c.autre;
