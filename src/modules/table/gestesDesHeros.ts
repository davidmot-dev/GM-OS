import type { EffetDeDebordement, GestesDesHeros, MouvementDeFiche } from '../../types/drivers';
import { valeurDeJauge } from '../dice/systemes/nocturne';

/**
 * **Les gestes de table qui touchent chaque Héros** — NOC, 2026-10-16.
 *
 * Le moment de calme, le Vécu de la séance et du scénario, les effets du Fiel —
 * et depuis le 2026-10-22 la fin de scène (la Corruption temporaire de Symbaroum) :
 * le meneur fait un geste, et chaque fiche bouge. Les règles viennent du carnet
 * NotebookLM « NOC » (sections « LES MOMENTS DE CALME », « Les effets du Fiel »,
 * « Fatigue », « Retrouver Espoir ») et de `docs/systems/noc/rules/`.
 *
 * Tout ici est pur : on calcule **ce qui changerait**, Héros par Héros, avec la
 * phrase qui le dit. Le bandeau montre cet aperçu, puis écrit. *Un geste qui
 * touche six fiches d'un clic se lit avant de s'appliquer.*
 */

/** Un Héros de la campagne, tel que les gestes le lisent. */
export interface HerosDeLaTable {
    joueurId: string;
    id: string;
    nom: string;
    valeurs: Record<string, unknown>;
}

/**
 * Le nom d'un champ, dit dans l'aperçu : le libellé de la fiche (« Fatigué »)
 * plutôt que son identifiant (`fatigue`). Sans fiche, l'identifiant.
 */
export type Libelle = (champ: string) => string;
const sansLibelle: Libelle = champ => champ;

/** Les Héros de la campagne : les personnages des joueurs qui y sont liés. */
export function herosDeLaCampagne(
    joueurs: readonly { id: string; characters?: readonly { id: string; name?: string; campaignId?: string | null; sheetData?: Record<string, unknown> }[] }[],
    campaignId: string | null | undefined,
): HerosDeLaTable[] {
    if (!campaignId) return [];
    return joueurs.flatMap(j => (j.characters ?? [])
        .filter(c => c.campaignId === campaignId)
        .map(c => ({ joueurId: j.id, id: c.id, nom: c.name || 'Héros sans nom', valeurs: c.sheetData ?? {} })));
}

/** Ce qu'un geste change chez un Héros : les champs à écrire, et ce qu'on en dit. */
export interface ChangementDuHeros {
    joueurId: string;
    herosId: string;
    nom: string;
    maj: Record<string, number | boolean>;
    lignes: string[];
}

const nombre = (brut: unknown) => {
    const n = valeurDeJauge(brut);
    return Number.isFinite(n) ? Math.floor(n) : 0;
};

/** Le plafond d'un mouvement pour ce Héros — un nombre, ou lu sur sa fiche. */
export function plafondDuMouvement(m: Pick<MouvementDeFiche, 'max'>, valeurs: Record<string, unknown>): number | undefined {
    if (m.max === undefined) return undefined;
    if (typeof m.max === 'number') return m.max;
    const brut = (m.max.fois ?? 1) * nombre(valeurs[m.max.champ]) + (m.max.plus ?? 0);
    return m.max.plafond !== undefined ? Math.min(m.max.plafond, brut) : brut;
}

/**
 * Un mouvement sur une fiche, `fois` fois.
 *
 * **Les pertes s'additionnent AVANT la résistance** : *« lorsque la Loi choisit
 * plusieurs fois le même effet, les pertes brutes sont d'abord cumulées avant
 * déduction du Talent de résistance »* (carnet « NOC », « Le Fiel »). Deux fois
 * Tension avec Folie 1 donne 4 − 1 = 3 points de Trauma, pas 2 × 1.
 */
export function appliquerLeMouvement(
    m: MouvementDeFiche,
    valeurs: Record<string, unknown>,
    fois = 1,
    nom: Libelle = sansLibelle,
): { valeur: number; avant: number; coche?: string; ligne: string; retenuParSequelles?: boolean } | null {
    const avant = nombre(valeurs[m.champ]);
    const label = m.label ?? nom(m.champ);
    const plafond = plafondDuMouvement(m, valeurs);
    const plancher = Math.max(m.min ?? 0, m.plancher ? nombre(valeurs[m.plancher]) : 0);

    if (m.delta === 'plein') {
        if (plafond === undefined) return null;
        // Un Vécu agrandi par le Développement n'est pas ramené au plafond commun.
        const plein = Math.max(avant, plafond);
        return { valeur: plein, avant, ligne: `${label} ${avant} → ${plein} (plein)` };
    }
    // Remis à son plancher — la Corruption temporaire de Symbaroum en fin de scène.
    // Une jauge déjà sous son plancher n'est pas remontée : un geste de perte ne fait rien gagner.
    if (m.delta === 'vide') {
        const vide = Math.min(avant, plancher);
        return { valeur: vide, avant, ligne: `${label} ${avant} → ${vide} (remis à ${plancher})` };
    }

    const precisions: string[] = [];
    let quantite = Math.abs(m.delta) * Math.max(1, fois);
    if (m.plus) {
        const bonus = nombre(valeurs[m.plus]);
        quantite += bonus;
        if (bonus) precisions.push(`${bonus > 0 ? '+' : ''}${bonus} ${nom(m.plus)}`);
    }
    if (m.resistance) {
        const resistance = nombre(valeurs[m.resistance]);
        quantite = Math.max(0, quantite - resistance);
        if (resistance) precisions.push(`${nom(m.resistance)} ${resistance}`);
    }

    let valeur: number;
    let coche: string | undefined;
    let retenuParSequelles = false;
    if (m.delta >= 0) {
        // Déjà au-dessus du plafond, la fiche n'est pas ramenée : un geste de gain ne fait rien perdre.
        valeur = plafond === undefined ? avant + quantite : Math.max(avant, Math.min(plafond, avant + quantite));
        if (plafond !== undefined && avant + quantite > plafond) precisions.push(`plafond ${plafond}`);
    } else {
        valeur = Math.max(Math.min(avant, plancher), avant - quantite);
        if (quantite > 0 && avant - quantite < plancher && m.plancher && nombre(valeurs[m.plancher]) > 0) {
            precisions.push(`séquelles ${nombre(valeurs[m.plancher])}`);
            retenuParSequelles = true;
        }
        // Une réserve déjà vide qui devait encore perdre : l'état se coche (l'Espoir → Fatigué),
        // s'il ne l'est pas déjà.
        if (m.aVideCoche && quantite > avant - plancher && valeurDeJauge(valeurs[m.aVideCoche]) < 1) coche = m.aVideCoche;
    }

    const signe = valeur > avant ? `+${valeur - avant}` : valeur < avant ? `${valeur - avant}` : '±0';
    const dit = `${label} ${avant} → ${valeur} (${[signe, ...precisions].join(', ')})`;
    return { valeur, avant, coche, ligne: coche ? `${dit} — ${nom(coche)} coché` : dit, retenuParSequelles };
}

/** Les mouvements d'un geste, appliqués dans l'ordre à un Héros. */
function changerUnHeros(
    heros: HerosDeLaTable,
    mouvements: { m: MouvementDeFiche; fois: number }[],
    nom: Libelle,
): ChangementDuHeros {
    const valeurs = { ...heros.valeurs };
    const maj: Record<string, number | boolean> = {};
    const lignes: string[] = [];
    for (const { m, fois } of mouvements) {
        const r = appliquerLeMouvement(m, valeurs, fois, nom);
        if (!r) continue;
        // Une jauge déjà à zéro qui ne bouge pas ne se dit pas ; une séquelle qui la retient, si.
        if (r.valeur !== r.avant || r.coche || r.retenuParSequelles) lignes.push(r.ligne);
        if (r.valeur !== r.avant) { maj[m.champ] = r.valeur; valeurs[m.champ] = r.valeur; }
        if (r.coche && valeurDeJauge(valeurs[r.coche]) < 1) { maj[r.coche] = true; valeurs[r.coche] = true; }
    }
    return { joueurId: heros.joueurId, herosId: heros.id, nom: heros.nom, maj, lignes };
}

/** Une simple liste de mouvements pour chaque Héros — le Vécu d'un début de séance. */
export function recuperationDesHeros(mouvements: MouvementDeFiche[] | undefined, heros: HerosDeLaTable[], nom: Libelle = sansLibelle): ChangementDuHeros[] {
    if (!mouvements?.length) return [];
    return heros.map(h => changerUnHeros(h, mouvements.map(m => ({ m, fois: 1 })), nom));
}

/**
 * **Le moment de calme**, pour chaque Héros : ses récupérations dans l'ordre du
 * pilote, les états qui prennent fin, et la récupération amputée qu'il reste à
 * reprendre (le Soupçon). Les mouvements de table (le Fiel) restent au bandeau.
 */
export function momentDeCalme(geste: NonNullable<GestesDesHeros['momentDeCalme']>, heros: HerosDeLaTable[], nom: Libelle = sansLibelle): ChangementDuHeros[] {
    return heros.map(h => {
        const c = changerUnHeros(h, geste.heros.map(m => ({ m, fois: 1 })), nom);
        for (const champ of geste.leve ?? []) {
            if (valeurDeJauge(h.valeurs[champ]) >= 1) {
                c.maj[champ] = false;
                c.lignes.push(`${nom(champ)} prend fin`);
            }
        }
        const a = geste.amputation;
        if (a) {
            const niveau = nombre(h.valeurs[a.champ]);
            const points = Math.max(0, ...a.seuils.filter(s => niveau >= s.aPartirDe).map(s => s.points));
            if (points > 0) {
                c.lignes.push(`${a.label} ${niveau} : ${points} point${points > 1 ? 's' : ''} de récupération en moins, `
                    + `à reprendre au choix du joueur${a.parmi ? ` (${a.parmi})` : ''}`);
            }
        }
        return c;
    });
}

/** Le nombre d'effets à choisir — la Menace atteinte, jamais moins de zéro. */
export function nombreDEffetsAChoisir(valeur: number | undefined): number {
    return Math.max(0, Math.floor(valeur ?? 0));
}

/**
 * **Les effets du débordement choisis par la Loi**, appliqués à chaque Héros.
 *
 * `choix` compte combien de fois chaque effet est retenu. Un même effet choisi
 * deux fois cumule ses pertes **avant** la résistance (voir
 * `appliquerLeMouvement`) ; deux effets distincts s'appliquent l'un après l'autre.
 */
export function effetsDuDebordement(
    effets: EffetDeDebordement[],
    choix: Record<string, number>,
    heros: HerosDeLaTable[],
    nom: Libelle = sansLibelle,
): { changements: ChangementDuHeros[]; aDire: string[] } {
    const retenus = effets.filter(e => (choix[e.id] ?? 0) > 0);
    const mouvements = retenus.flatMap(e => (e.heros ?? []).map(m => ({ m, fois: choix[e.id] })));
    const changements = heros.map(h => {
        const c = changerUnHeros(h, mouvements, nom);
        for (const e of retenus) {
            if (e.coche && valeurDeJauge(h.valeurs[e.coche]) < 1) {
                c.maj[e.coche] = true;
                c.lignes.push(`${e.label} : ${nom(e.coche)} coché`);
            }
        }
        return c;
    });
    return { changements, aDire: retenus.flatMap(e => e.aDire ? [`${e.label} — ${e.aDire}`] : []) };
}

/** Des changements qui écrivent quelque chose — ceux qui ne changent rien ne s'appliquent pas. */
export const changementsEffectifs = (changements: ChangementDuHeros[]) =>
    changements.filter(c => Object.keys(c.maj).length > 0);
