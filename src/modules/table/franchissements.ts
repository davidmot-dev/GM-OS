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
            .filter(f => !traites[f.id] && nombre(h.valeurs[f.champ]) >= f.aPartirDe)
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
                const marque = { [CLE_DES_FRANCHISSEMENTS]: { ...traites, [f.id]: true } };
                return {
                    heros: h, franchissement: f, valeur: nombre(h.valeurs[f.champ]),
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
        return !!f && nombre(valeurs[f.champ]) >= f.aPartirDe;
    });
    if (gardes.length === ids.length) return null;
    return { [CLE_DES_FRANCHISSEMENTS]: Object.fromEntries(gardes.map(id => [id, true])) };
}
