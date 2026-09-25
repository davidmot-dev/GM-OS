import type { GrapheDeTrame, NoeudDeTrame, TypeDeNoeud } from './grapheDeLaTrame';

/**
 * **Ranger la trame — un bloc par acte, et le temps de gauche à droite.**
 *
 * *Demandé par David le 2026-09-25, capture à l'appui : « le graphe de la trame
 * narrative est illisible et très difficile à ranger correctement ».*
 *
 * ⛔ **La cause n'était pas un réglage de forces.** Une simulation physique ne
 * connaît ni « avant » ni « après » : les actes d'« Anges de Feu », leurs scènes
 * et une vingtaine d'enchaînements se repoussaient librement, et ranger à la
 * main revenait à se battre contre elle. *Une chronologie ne s'obtient pas d'une
 * physique ; elle se pose.*
 *
 * ---
 *
 * **Première version, le même jour : une colonne par acte, ses scènes empilées
 * dessous.** David, après essai : *« les colonnes sont trop serrées, il faut
 * aussi travailler sur la dimension horizontale »*. « The Investigation »
 * portait quinze scènes sur un seul trait vertical, et ses enchaînements se
 * superposaient au trait. **Une colonne ne sait dire qu'une dimension ; une
 * trame en a deux — ce qui suit, et ce qui bifurque.**
 *
 * **La disposition d'aujourd'hui :**
 * - chaque acte est un **bloc**, les blocs se suivent de gauche à droite ;
 * - dans un bloc, une scène se pose **une couche à droite** de celle qui y mène —
 *   par l'ordre du document ou par un enchaînement déclaré ; ce qui part du même
 *   point s'**empile** dans sa couche. Une suite linéaire devient une ligne, une
 *   enquête ouverte un éventail ;
 * - ⚠️ **seuls les liens vers l'avant comptent** (vers une scène plus loin dans
 *   l'ordre) : un retour en arrière — « revenir au QG » — ferait une boucle, et
 *   une boucle n'a pas de profondeur ;
 * - une couche trop haute se replie en plusieurs colonnes, pour qu'un bloc ne
 *   devienne pas une tour ;
 * - lieux, PNJ, indices… **épinglés eux aussi**, en grappe près de la première
 *   scène qui les convoque. Laissés à la simulation, ils dérivaient en arcs —
 *   la capture le montrait. Ceux qu'aucune scène ne convoque vont en rangées
 *   sous la trame, une par sorte : *un orphelin qu'on voit à l'écart est un
 *   constat qu'on lit sans le chercher.*
 *
 * ⚠️ **Rien n'est écrit dans la trame.** Ce module rend des positions ; l'écran
 * les épingle comme le ferait un glisser. Le meneur ajuste ensuite à la main.
 */

/** Entre deux couches d'un même acte : la place d'un titre de scène. */
export const PAS_HORIZONTAL = 190;
/** Entre deux scènes d'une même couche. */
export const PAS_VERTICAL = 64;
/** L'espace qui sépare deux actes. */
export const ENTRE_ACTES = 140;
/** Au-delà, une couche se replie en une colonne de plus. */
export const HAUTEUR_MAXIMALE_DE_COUCHE = 6;

export interface Position { x: number; y: number }

export interface RangementDeLaTrame {
    /** Tout ce qui est rangé : posé, et épinglé. */
    epingles: Record<string, Position>;
}

const idDe = (bout: string | NoeudDeTrame): string => (typeof bout === 'string' ? bout : bout.id);

/** L'ordre d'affichage des orphelins, rangée par rangée. */
const ORDRE_DES_ANNEXES: readonly TypeDeNoeud[] = ['lieu', 'pnj', 'indice', 'pj', 'ambiance'];

export function rangerEnColonnes(graphe: GrapheDeTrame): RangementDeLaTrame {
    const epingles: Record<string, Position> = {};

    const actes = graphe.noeuds.filter(n => n.type === 'acte');
    const types = new Map(graphe.noeuds.map(n => [n.id, n.type] as const));

    /* Les scènes de chaque acte, dans l'ordre de l'acte. */
    const scenesDe = new Map<string, string[]>(actes.map(a => [a.id, []]));
    const acteDe = new Map<string, string>();
    for (const lien of graphe.liens) {
        if (lien.nature !== 'appartenance') continue;
        const acte = idDe(lien.source);
        const scene = idDe(lien.target);
        scenesDe.get(acte)?.push(scene);
        acteDe.set(scene, acte);
    }

    /* Ce qui mène à quoi, à l'intérieur d'un même acte. */
    const menesPar = new Map<string, string[]>();
    for (const lien of graphe.liens) {
        if (lien.nature !== 'suite' && lien.nature !== 'enchainement') continue;
        const de = idDe(lien.source);
        const vers = idDe(lien.target);
        if (!acteDe.has(de) || acteDe.get(de) !== acteDe.get(vers)) continue;
        menesPar.set(vers, [...(menesPar.get(vers) ?? []), de]);
    }

    /* Chaque acte, rangé à part : ses couches, puis ses positions relatives. */
    const disposes = actes.map(acte => {
        const scenes = scenesDe.get(acte.id) ?? [];
        const rang = new Map(scenes.map((s, i) => [s, i] as const));

        /* La couche : un de plus que la plus profonde des scènes qui y mènent
           — vers l'avant seulement. L'ordre du document garantit qu'on les a
           déjà calculées. */
        const couche = new Map<string, number>();
        for (const scene of scenes) {
            const avant = (menesPar.get(scene) ?? []).filter(de => (rang.get(de) ?? Infinity) < rang.get(scene)!);
            couche.set(scene, avant.length ? Math.max(...avant.map(de => couche.get(de)! + 1)) : 0);
        }

        const parCouche: string[][] = [];
        for (const scene of scenes) (parCouche[couche.get(scene)!] ??= []).push(scene);

        const positions = new Map<string, Position>();
        let colonne = 0;
        let lignes = 0;
        for (const membres of parCouche) {
            if (!membres) continue;
            membres.forEach((scene, i) => {
                positions.set(scene, {
                    x: (colonne + Math.floor(i / HAUTEUR_MAXIMALE_DE_COUCHE)) * PAS_HORIZONTAL,
                    y: ((i % HAUTEUR_MAXIMALE_DE_COUCHE) + 1) * PAS_VERTICAL,
                });
            });
            colonne += Math.ceil(membres.length / HAUTEUR_MAXIMALE_DE_COUCHE);
            lignes = Math.max(lignes, Math.min(membres.length, HAUTEUR_MAXIMALE_DE_COUCHE));
        }

        return { acte, positions, largeur: Math.max(1, colonne) * PAS_HORIZONTAL, lignes };
    });

    /* Les blocs côte à côte, le tout centré sur l'origine. */
    const largeurTotale = disposes.reduce((t, d) => t + d.largeur, 0) + ENTRE_ACTES * Math.max(0, disposes.length - 1);
    const lignesMax = Math.max(0, ...disposes.map(d => d.lignes));
    const haut = -((lignesMax + 1) * PAS_VERTICAL) / 2;

    let gauche = -largeurTotale / 2;
    for (const { acte, positions, largeur } of disposes) {
        /* L'acte au-dessus du milieu de son bloc. */
        epingles[acte.id] = { x: gauche + largeur / 2 - PAS_HORIZONTAL / 2, y: haut };
        for (const [scene, p] of positions) epingles[scene] = { x: gauche + p.x, y: haut + p.y };
        gauche += largeur + ENTRE_ACTES;
    }

    /* Les annexes, en grappe près de la première scène qui les convoque. */
    const premiereScene = new Map<string, string>();
    for (const lien of graphe.liens) {
        if (lien.nature === 'appartenance' || lien.nature === 'suite' || lien.nature === 'enchainement') continue;
        const scene = idDe(lien.source);
        const annexe = idDe(lien.target);
        if (types.get(scene) !== 'scene' || !epingles[scene] || premiereScene.has(annexe)) continue;
        premiereScene.set(annexe, scene);
    }

    const grappes = new Map<string, number>();
    const orphelines = new Map<TypeDeNoeud, string[]>();

    for (const noeud of graphe.noeuds) {
        if (noeud.type === 'acte' || noeud.type === 'scene') continue;
        const scene = premiereScene.get(noeud.id);
        if (!scene) {
            orphelines.set(noeud.type, [...(orphelines.get(noeud.type) ?? []), noeud.id]);
            continue;
        }
        /* Sous la scène et vers la droite : le titre de la scène est dessous,
           la grappe commence après lui. Quatre par rangée. */
        const n = grappes.get(scene) ?? 0;
        grappes.set(scene, n + 1);
        epingles[noeud.id] = {
            x: epingles[scene].x + 40 + (n % 4) * 20,
            y: epingles[scene].y + 16 + Math.floor(n / 4) * 14,
        };
    }

    /* Les orphelines, une rangée par sorte, sous toute la trame. */
    let y = haut + (lignesMax + 3) * PAS_VERTICAL;
    const parRangee = Math.max(1, Math.floor(Math.max(largeurTotale, PAS_HORIZONTAL) / 60));
    for (const type of ORDRE_DES_ANNEXES) {
        const liste = orphelines.get(type) ?? [];
        liste.forEach((id, i) => {
            epingles[id] = {
                x: -largeurTotale / 2 + (i % parRangee) * 60,
                y: y + Math.floor(i / parRangee) * 36,
            };
        });
        if (liste.length) y += (Math.ceil(liste.length / parRangee) + 1) * 36;
    }

    return { epingles };
}
