import type { DegreDeReussite } from '../degresDeReussite';

/**
 * **Le jet du système Nocturne (NOC)** — 2026-10-13.
 *
 * *« La Loi consulte son niveau dans le Talent adéquat et le compare à la
 * difficulté. […] Le joueur peut lancer des dés de destin jusqu'à un maximum
 * égal à son score dans le Domaine concerné. Pour chaque succès, le niveau de
 * Talent est augmenté d'un point »* — livre de base, confirmé par le carnet
 * NotebookLM « NOC » le 2026-10-13, et `docs/systems/noc/rules/`
 * (`resolution-des-jets.md`, `etats-et-conditions.md`, `degres-de-reussite-et-critiques.md`).
 *
 * Tout ici est pur : le hasard vient de `DiceEngine`, la dépense des réserves
 * du panneau de jet.
 */

/** Une jauge de péril et ses seuils — Blessures, Trauma, Traque, Noirceur. */
export interface JaugeDePeril {
    /** Le champ de la fiche du Héros. */
    champ: string;
    /** Le nom de la jauge, pour dire d'où vient un malus. */
    label: string;
    /** À partir de quel point la jauge pénalise, et quoi : −1 aux Domaines à 5, aux Talents à 8. */
    seuils: { aPartirDe: number; label: string; domaines?: number; talents?: number }[];
}

export interface MalusDePeril {
    /** Ce qu'on retire au Domaine — donc aux dés de destin qu'on peut lancer. */
    domaines: number;
    /** Ce qu'on retire au niveau du Talent. */
    talents: number;
    /** Les états atteints, nommés : « Choqué (Blessures) ». */
    etats: string[];
}

/**
 * **Les malus de péril se cumulent**, d'une jauge à l'autre et d'un seuil à
 * l'autre : *« si un personnage accumule simultanément cinq points de Blessures
 * et de Trauma, il subit deux fois l'état Choqué […] un malus total de moins
 * deux »* (`etats-et-conditions.md`).
 */
export function malusDePeril(jauges: readonly JaugeDePeril[], valeurs: Record<string, unknown>): MalusDePeril {
    let domaines = 0;
    let talents = 0;
    const etats: string[] = [];
    for (const jauge of jauges) {
        const brut = valeurs[jauge.champ];
        const v = typeof brut === 'number' ? brut : Number(brut);
        if (!Number.isFinite(v)) continue;
        for (const s of jauge.seuils) {
            if (v < s.aPartirDe) continue;
            domaines += Math.abs(s.domaines ?? 0);
            talents += Math.abs(s.talents ?? 0);
            etats.push(`${s.label} (${jauge.label})`);
        }
    }
    return { domaines, talents, etats };
}

export interface JetDuDestin {
    /** Les faces tirées, relances comprises. */
    des: number[];
    reussites: number;
    /** Les 1 tirés — chacun est une goutte de Fiel. */
    uns: number;
    /** Ceux qu'une Singularité a annulés avant qu'ils ne rejoignent la jauge. */
    annules: number;
    /** Les gouttes qui partent dans le Fiel. */
    fiel: number;
    niveauFinal: number;
    /** Niveau final moins difficulté : la marge de réussite, ou le degré d'échec s'il est négatif. */
    marge: number;
    degre: DegreDeReussite;
    texte: string;
}

/**
 * Ce que donne un jet.
 *
 * `niveau` est déjà le niveau du Talent, malus de péril retirés et Vécu ajouté ;
 * `des` les faces tirées (vide si l'on n'a pas provoqué le destin) ;
 * `singularite` ce que le joueur a engagé pour annuler des 1.
 *
 * *« Le jeu n'intègre pas de concept automatique de réussite ou d'échec
 * critique »* : un niveau final égal ou supérieur à la difficulté réussit, un
 * écart d'un seul degré peut devenir un échec partiel — c'est la Loi qui
 * décide, on le dit.
 */
export function resoudreLeDestin(niveau: number, difficulte: number, des: readonly number[], singularite = 0): JetDuDestin {
    const reussites = des.filter(d => d >= 8).length;
    const uns = des.filter(d => d === 1).length;
    const annules = Math.min(uns, Math.max(0, Math.floor(singularite)));
    const fiel = uns - annules;
    const niveauFinal = niveau + reussites;
    const marge = niveauFinal - difficulte;
    const degre: DegreDeReussite = marge >= 0 ? 'reussite-normale' : 'echec-normal';

    const verdict = marge >= 0
        ? `Réussite, marge ${marge}`
        : marge === -1 ? 'Échec d’un degré — échec partiel possible' : `Échec de ${-marge} degrés`;
    const tirage = des.length > 0
        ? ` + ${reussites} réussite${reussites > 1 ? 's' : ''} (${des.length} dé${des.length > 1 ? 's' : ''} de destin)`
        : ' (sans provoquer le destin)';
    const goutte = (n: number) => `${n} goutte${n > 1 ? 's' : ''} de Fiel`;
    const annulesDit = `${annules} annulée${annules > 1 ? 's' : ''} par la Singularité`;
    const fielDit = uns === 0 ? '' : annules === 0
        ? ` · ${goutte(fiel)}`
        : fiel === 0 ? ` · aucune goutte de Fiel, ${annulesDit}` : ` · ${goutte(fiel)}, ${annulesDit}`;

    return {
        des: [...des], reussites, uns, annules, fiel, niveauFinal, marge, degre,
        texte: `${verdict} — niveau ${niveau}${tirage} = ${niveauFinal} contre difficulté ${difficulte}${fielDit}`,
    };
}
