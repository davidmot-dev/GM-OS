import type { GrapheDeTrame, NoeudDeTrame } from './grapheDeLaTrame';

/**
 * **Ranger la trame en colonnes — une colonne par acte.**
 *
 * *Demandé par David le 2026-09-25, capture à l'appui : « le graphe de la trame
 * narrative est illisible et très difficile à ranger correctement ».*
 *
 * ⛔ **La cause n'était pas un réglage de forces.** Une simulation physique ne
 * connaît ni « avant » ni « après » : les cinq actes d'« Anges de Feu », leurs
 * scènes et une vingtaine d'enchaînements se repoussaient librement, et ranger à
 * la main revenait à se battre contre elle. *Une chronologie ne s'obtient pas
 * d'une physique ; elle se pose.*
 *
 * **La disposition** — choisie par David parmi trois :
 * - les actes de gauche à droite, dans leur ordre ;
 * - sous chaque acte, ses scènes dans leur ordre, en léger zigzag pour qu'un
 *   enchaînement qui saute une scène ne passe pas à travers elle ;
 * - lieux, PNJ, indices… **semés** près des scènes qui les convoquent, et laissés
 *   à la simulation : épinglés eux aussi, cent nœuds tomberaient les uns sur les
 *   autres. Ceux qu'aucune scène ne convoque vont sur une ligne à part, en bas —
 *   *un orphelin qu'on voit à l'écart est un constat qu'on lit sans le chercher.*
 *
 * ⚠️ **Rien n'est écrit dans la trame.** Ce module rend des positions ; l'écran
 * les épingle comme le ferait un glisser. Le meneur ajuste ensuite à la main.
 */

export const LARGEUR_DE_COLONNE = 260;
export const HAUTEUR_DE_LIGNE = 56;
/** Le zigzag des scènes : assez pour qu'un trait qui saute une scène l'évite. */
export const ZIGZAG = 16;

export interface Position { x: number; y: number }

export interface RangementDeLaTrame {
    /** Actes et scènes : posés, et épinglés. */
    epingles: Record<string, Position>;
    /** Les annexes : un point de départ, la simulation fait le reste. */
    semis: Record<string, Position>;
}

const idDe = (bout: string | NoeudDeTrame): string => (typeof bout === 'string' ? bout : bout.id);

export function rangerEnColonnes(graphe: GrapheDeTrame): RangementDeLaTrame {
    const epingles: Record<string, Position> = {};
    const semis: Record<string, Position> = {};

    const actes = graphe.noeuds.filter(n => n.type === 'acte');
    const types = new Map(graphe.noeuds.map(n => [n.id, n.type] as const));

    /* Les scènes de chaque acte, dans l'ordre où `grapheDeLaTrame` les a
       posées — celui de l'acte. */
    const scenesDe = new Map<string, string[]>(actes.map(a => [a.id, []]));
    for (const lien of graphe.liens) {
        if (lien.nature !== 'appartenance') continue;
        scenesDe.get(idDe(lien.source))?.push(idDe(lien.target));
    }

    const plusLongue = Math.max(0, ...[...scenesDe.values()].map(s => s.length));
    /* Centré sur l'origine : la force de centrage de la simulation ne tire
       alors pas les annexes vers un coin. */
    const haut = -((plusLongue + 1) * HAUTEUR_DE_LIGNE) / 2;

    actes.forEach((acte, i) => {
        const x = (i - (actes.length - 1) / 2) * LARGEUR_DE_COLONNE;
        epingles[acte.id] = { x, y: haut };
        (scenesDe.get(acte.id) ?? []).forEach((scene, k) => {
            epingles[scene] = {
                x: x + (k % 2 === 0 ? -ZIGZAG / 2 : ZIGZAG / 2),
                y: haut + (k + 1) * HAUTEUR_DE_LIGNE,
            };
        });
    });

    /* Les annexes, près des scènes qui les convoquent. */
    const convoqueesPar = new Map<string, string[]>();
    for (const lien of graphe.liens) {
        if (lien.nature === 'appartenance' || lien.nature === 'suite' || lien.nature === 'enchainement') continue;
        const scene = idDe(lien.source);
        const annexe = idDe(lien.target);
        if (types.get(scene) !== 'scene') continue;
        convoqueesPar.set(annexe, [...(convoqueesPar.get(annexe) ?? []), scene]);
    }

    /* Plusieurs annexes autour d'une même scène : on les étage, sinon elles
       partent toutes du même point. */
    const autourDe = new Map<string, number>();
    const orphelines: string[] = [];

    for (const noeud of graphe.noeuds) {
        if (noeud.type === 'acte' || noeud.type === 'scene') continue;
        const scenes = (convoqueesPar.get(noeud.id) ?? []).filter(s => epingles[s]);
        if (scenes.length === 0) { orphelines.push(noeud.id); continue; }

        const x = scenes.reduce((t, s) => t + epingles[s].x, 0) / scenes.length;
        const y = scenes.reduce((t, s) => t + epingles[s].y, 0) / scenes.length;
        const cle = `${Math.round(x)}:${Math.round(y)}`;
        const rang = autourDe.get(cle) ?? 0;
        autourDe.set(cle, rang + 1);
        semis[noeud.id] = {
            x: x + LARGEUR_DE_COLONNE * 0.4 + (rang % 3) * 18,
            y: y + (Math.floor(rang / 3) - 1) * 14,
        };
    }

    /* Les orphelines, sur une ligne à part sous la trame. */
    const bas = haut + (plusLongue + 3) * HAUTEUR_DE_LIGNE;
    const largeur = Math.max(1, actes.length) * LARGEUR_DE_COLONNE;
    const parLigne = Math.max(1, Math.floor(largeur / 40));
    orphelines.forEach((id, i) => {
        semis[id] = {
            x: -largeur / 2 + (i % parLigne) * 40 + 20,
            y: bas + Math.floor(i / parLigne) * 30,
        };
    });

    return { epingles, semis };
}
