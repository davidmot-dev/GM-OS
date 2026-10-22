import type { Franchissement } from '../../types/drivers';
import { valeurDeJauge } from '../dice/systemes/nocturne';
import { appliquerLeMouvement, type HerosDeLaTable, type Libelle } from './gestesDesHeros';

/**
 * **Les seuils qui laissent une trace** — la Séquelle de NOC, 2026-10-22.
 *
 * *« Si une jauge atteint le seuil de huit points, le joueur note le gain d'une
 * séquelle »* (`docs/systems/noc/rules/etats-et-conditions.md`). Le moment de
 * calme savait déjà s'arrêter aux séquelles (`MouvementDeFiche.plancher`) ;
 * rien ne les faisait naître.
 *
 * **Une fois par passage, et la fiche s'en souvient.** Ce qui a été noté ou
 * écarté s'inscrit sur la fiche, sous `CLE_DES_FRANCHISSEMENTS` : un
 * rechargement, une tablette qui se reconnecte ou une fiche HTML qui se
 * resynchronise ne reproposent rien. Redescendue sous le seuil, la jauge
 * réarme le seuil (`rearmer`) — le prochain passage est un nouveau franchissement.
 *
 * Tout ici est pur : le bandeau propose, le meneur décide, puis on écrit.
 */

/** La clé de la fiche qui retient les seuils déjà traités : identifiant → `true`. */
export const CLE_DES_FRANCHISSEMENTS = '__franchissements';

const nombre = (brut: unknown) => {
    const n = valeurDeJauge(brut);
    return Number.isFinite(n) ? Math.floor(n) : 0;
};

/** La valeur surveillée : la jauge, et ce qui s'y ajoute (la Corruption totale). */
export function valeurSurveillee(f: Pick<Franchissement, 'champ' | 'ajouter'>, valeurs: Record<string, unknown>): number {
    return [f.champ, ...(f.ajouter ?? [])].reduce((total, champ) => total + nombre(valeurs[champ]), 0);
}

/**
 * Le seuil, pour cette fiche — `undefined` quand il ne se lit pas : un seuil lu
 * à zéro ou moins (une Volonté pas encore remplie) n'est jamais franchi.
 */
export function seuilDuFranchissement(f: Pick<Franchissement, 'aPartirDe'>, valeurs: Record<string, unknown>): number | undefined {
    if (typeof f.aPartirDe === 'number') return f.aPartirDe;
    const lu = Math.ceil((f.aPartirDe.fois ?? 1) * nombre(valeurs[f.aPartirDe.champ]) + (f.aPartirDe.plus ?? 0));
    return lu > 0 ? lu : undefined;
}

const franchi = (f: Franchissement, valeurs: Record<string, unknown>) => {
    const seuil = seuilDuFranchissement(f, valeurs);
    return seuil !== undefined && valeurSurveillee(f, valeurs) >= seuil;
};

/** Les seuils déjà traités sur cette fiche. */
export function franchissementsTraites(valeurs: Record<string, unknown>): Record<string, true> {
    const brut = valeurs[CLE_DES_FRANCHISSEMENTS];
    if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return {};
    return Object.fromEntries(Object.entries(brut).filter(([, v]) => v === true)) as Record<string, true>;
}

/** Un seuil franchi chez un Héros, et ce que « Noter » écrirait. */
export interface FranchissementEnAttente {
    heros: HerosDeLaTable;
    franchissement: Franchissement;
    /** La valeur de la jauge, qui a atteint le seuil. */
    valeur: number;
    /** Ce que « Noter » écrit : les mouvements, et le seuil marqué traité. */
    noter: Record<string, unknown>;
    /** Ce que « Écarter » écrit : le seuil marqué traité, rien d'autre. */
    ecarter: Record<string, unknown>;
    /** L'aperçu : « Séquelles (Blessures) 0 → 1 (+1) ». */
    lignes: string[];
}

/** Les seuils franchis et pas encore traités, Héros par Héros, dans l'ordre du pilote. */
export function franchissementsEnAttente(
    franchissements: readonly Franchissement[] | undefined,
    heros: readonly HerosDeLaTable[],
    nom: Libelle = champ => champ,
): FranchissementEnAttente[] {
    if (!franchissements?.length) return [];
    return heros.flatMap(h => {
        const traites = franchissementsTraites(h.valeurs);
        return franchissements
            .filter(f => !traites[f.id] && franchi(f, h.valeurs))
            .map(f => {
                const valeurs = { ...h.valeurs };
                const maj: Record<string, unknown> = {};
                const lignes: string[] = [];
                for (const m of f.mouvements) {
                    const r = appliquerLeMouvement(m, valeurs, 1, nom);
                    if (!r) continue;
                    lignes.push(r.ligne);
                    if (r.valeur !== r.avant) { maj[m.champ] = r.valeur; valeurs[m.champ] = r.valeur; }
                }
                // Le dé se lance au geste, jamais ici : l'aperçu se redessine.
                if (f.jet) lignes.push(`${f.jet.label ?? nom(f.jet.champ)} +1D${f.jet.faces}`);
                const marque = { [CLE_DES_FRANCHISSEMENTS]: { ...traites, [f.id]: true } };
                return {
                    heros: h, franchissement: f, valeur: valeurSurveillee(f, h.valeurs),
                    noter: { ...maj, ...marque }, ecarter: marque, lignes,
                };
            });
    });
}

/**
 * Ce qu'il faut écrire pour **réarmer** les seuils dont la jauge est redescendue
 * — `null` quand rien ne change. Un seuil retiré du pilote est oublié aussi.
 */
export function rearmer(
    franchissements: readonly Franchissement[] | undefined,
    valeurs: Record<string, unknown>,
): Record<string, unknown> | null {
    const traites = franchissementsTraites(valeurs);
    const ids = Object.keys(traites);
    if (ids.length === 0) return null;
    const gardes = ids.filter(id => {
        const f = franchissements?.find(x => x.id === id);
        return !!f && franchi(f, valeurs);
    });
    if (gardes.length === ids.length) return null;
    return { [CLE_DES_FRANCHISSEMENTS]: Object.fromEntries(gardes.map(id => [id, true])) };
}

/**
 * Ce que « Noter » écrit, **dé lancé** : le 1D4 de Corruption permanente du
 * Seuil de Corruption (Symbaroum, S4). `de` lance un dé de tant de faces —
 * `DiceEngine.roll` au geste, un dé fixe aux essais.
 */
export function noterLeFranchissement(
    a: FranchissementEnAttente,
    de: (faces: number) => number,
    nom: Libelle = champ => champ,
): { maj: Record<string, unknown>; lignes: string[] } {
    const jet = a.franchissement.jet;
    if (!jet) return { maj: a.noter, lignes: a.lignes };
    const tire = de(jet.faces);
    const champ = jet.champ;
    const avant = typeof a.noter[champ] === 'number' ? a.noter[champ] as number : nombre(a.heros.valeurs[champ]);
    const lignes = a.lignes.filter(l => !l.endsWith(`+1D${jet.faces}`));
    lignes.push(`${jet.label ?? nom(champ)} ${avant} → ${avant + tire} (1D${jet.faces} : ${tire})`);
    return { maj: { ...a.noter, [champ]: avant + tire }, lignes };
}
