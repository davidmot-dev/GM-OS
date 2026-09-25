import type { GrapheDeTrame, NoeudDeTrame, TypeDeNoeud } from './grapheDeLaTrame';

/**
 * **Ranger la trame — des blocs d'actes qui occupent les deux dimensions.**
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
 * **Trois essais le même jour, et chacun a appris quelque chose à David :**
 *
 * 1. *Une colonne par acte, ses scènes dessous* — « trop serrées, il faut aussi
 *    travailler sur la dimension horizontale ». Quinze scènes sur un trait
 *    vertical, les enchaînements superposés au trait.
 * 2. *Le temps de gauche à droite, les branches empilées* — « c'est mieux mais
 *    toujours peu lisible, il faudrait s'étendre dans les deux dimensions ». Un
 *    ruban de 1 600 sur 100 : les suites linéaires s'étiraient sur une ligne, et
 *    les enchaînements entre actes couraient le long de cette ligne, par-dessus
 *    les nœuds.
 * 3. **Aujourd'hui** — la progression garde le sens de la lecture, mais elle **se
 *    replie** : *une dimension ne suffit jamais à une trame, qu'on la mette
 *    debout ou couchée.*
 *
 * **La disposition :**
 * - dans un acte, une scène se pose **un rang à droite** de celle qui y mène —
 *   par l'ordre du document ou par un enchaînement déclaré, vers l'avant
 *   seulement (*un retour au QG ferait une boucle, et une boucle n'a pas de
 *   profondeur*) ; ce qui part du même point s'**empile** ;
 * - les rangs se replient **en serpentin**, quatre par ligne : la deuxième ligne
 *   repart de droite à gauche, pour que le passage d'une ligne à l'autre soit un
 *   petit trait vertical et non un trait qui traverse le bloc ;
 * - les **blocs** d'actes se suivent comme des mots dans une page, sur une
 *   largeur calculée pour que l'ensemble ait les **proportions d'un écran** ;
 * - lieux, PNJ, indices : **sous le titre** de la première scène qui les
 *   convoque, en petite grappe. Ceux qu'aucune scène ne convoque, en rangées
 *   sous la trame, une par sorte — *un orphelin qu'on voit à l'écart est un
 *   constat qu'on lit sans le chercher.*
 *
 * ⚠️ **Rien n'est écrit dans la trame.** Ce module rend des positions ; l'écran
 * les épingle comme le ferait un glisser. Le meneur ajuste ensuite à la main.
 */

/** Entre deux rangs d'un même acte : la place d'un titre de scène. */
export const PAS_HORIZONTAL = 190;
/** Entre deux scènes empilées : le point, son titre, et deux rangées d'annexes. */
export const PAS_VERTICAL = 84;
/** Au-delà, un rang se replie en une colonne de plus. */
export const HAUTEUR_MAXIMALE_DE_RANG = 5;
/** Combien de colonnes par ligne, dans un acte, avant de replier. */
export const COLONNES_PAR_LIGNE = 4;
/** L'espace réservé au titre de l'acte, en haut de son bloc. */
const TETE_DE_BLOC = 56;
/** Entre deux lignes d'un même acte. */
const ENTRE_LIGNES = 24;
/** Entre deux blocs, dans les deux sens. */
const ENTRE_BLOCS = 90;
/** Les proportions visées pour l'ensemble — celles d'un écran. */
const PROPORTIONS = 16 / 9;

export interface Position { x: number; y: number }

export interface RangementDeLaTrame {
    /** Tout ce qui est rangé : posé, et épinglé. */
    epingles: Record<string, Position>;
}

const idDe = (bout: string | NoeudDeTrame): string => (typeof bout === 'string' ? bout : bout.id);

/** L'ordre d'affichage des orphelins, rangée par rangée. */
const ORDRE_DES_ANNEXES: readonly TypeDeNoeud[] = ['lieu', 'pnj', 'indice', 'pj', 'ambiance'];

interface Bloc {
    acte: string;
    largeur: number;
    hauteur: number;
    /** Positions relatives au coin haut-gauche du bloc. */
    positions: Map<string, Position>;
}

/** Un acte, rangé à part : ses rangs, repliés en serpentin. */
function rangerUnActe(acte: string, scenes: readonly string[], menesPar: Map<string, string[]>): Bloc {
    const ordre = new Map(scenes.map((s, i) => [s, i] as const));

    /* Le rang : un de plus que le plus profond des scènes qui y mènent — vers
       l'avant seulement. L'ordre du document garantit qu'on les a déjà vues. */
    const rang = new Map<string, number>();
    for (const scene of scenes) {
        const avant = (menesPar.get(scene) ?? []).filter(de => (ordre.get(de) ?? Infinity) < ordre.get(scene)!);
        rang.set(scene, avant.length ? Math.max(...avant.map(de => rang.get(de)! + 1)) : 0);
    }

    /* Les colonnes : un rang trop haut se découpe en plusieurs. */
    const parRang: string[][] = [];
    for (const scene of scenes) (parRang[rang.get(scene)!] ??= []).push(scene);
    const colonnes: string[][] = [];
    for (const membres of parRang) {
        if (!membres) continue;
        for (let i = 0; i < membres.length; i += HAUTEUR_MAXIMALE_DE_RANG) {
            colonnes.push(membres.slice(i, i + HAUTEUR_MAXIMALE_DE_RANG));
        }
    }

    /* Les lignes, en serpentin. */
    const positions = new Map<string, Position>();
    const largeurEnColonnes = Math.max(1, Math.min(colonnes.length, COLONNES_PAR_LIGNE));
    let y = TETE_DE_BLOC;
    for (let debut = 0, ligne = 0; debut < colonnes.length; debut += COLONNES_PAR_LIGNE, ligne++) {
        const cetteLigne = colonnes.slice(debut, debut + COLONNES_PAR_LIGNE);
        cetteLigne.forEach((colonne, j) => {
            /* Une ligne impaire repart de la droite : son premier rang est sous
               le dernier de la ligne précédente. */
            const place = ligne % 2 === 0 ? j : largeurEnColonnes - 1 - j;
            colonne.forEach((scene, k) => {
                positions.set(scene, {
                    x: place * PAS_HORIZONTAL + PAS_HORIZONTAL / 2,
                    y: y + k * PAS_VERTICAL,
                });
            });
        });
        const hauteur = Math.max(...cetteLigne.map(c => c.length));
        y += hauteur * PAS_VERTICAL + ENTRE_LIGNES;
    }

    const largeur = largeurEnColonnes * PAS_HORIZONTAL;
    positions.set(acte, { x: largeur / 2, y: 18 });
    return { acte, largeur, hauteur: Math.max(y, TETE_DE_BLOC + PAS_VERTICAL), positions };
}

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

    const blocs = actes.map(a => rangerUnActe(a.id, scenesDe.get(a.id) ?? [], menesPar));

    /* Les blocs comme des mots dans une page : une largeur qui donne à
       l'ensemble les proportions d'un écran, jamais moins que le plus large. */
    const aire = blocs.reduce((t, b) => t + (b.largeur + ENTRE_BLOCS) * (b.hauteur + ENTRE_BLOCS), 0);
    const largeurVisee = Math.max(
        ...blocs.map(b => b.largeur), Math.sqrt(aire * PROPORTIONS),
    );

    const lignes: Bloc[][] = [];
    let courante: Bloc[] = [];
    let largeurCourante = 0;
    for (const bloc of blocs) {
        const ajout = (courante.length ? ENTRE_BLOCS : 0) + bloc.largeur;
        if (courante.length && largeurCourante + ajout > largeurVisee) {
            lignes.push(courante);
            courante = [];
            largeurCourante = 0;
        }
        largeurCourante += (courante.length ? ENTRE_BLOCS : 0) + bloc.largeur;
        courante.push(bloc);
    }
    if (courante.length) lignes.push(courante);

    const largeurDe = (ligne: Bloc[]) =>
        ligne.reduce((t, b) => t + b.largeur, 0) + ENTRE_BLOCS * (ligne.length - 1);
    const hauteurDe = (ligne: Bloc[]) => Math.max(...ligne.map(b => b.hauteur));
    const largeurTotale = Math.max(0, ...lignes.map(largeurDe));
    const hauteurTotale = lignes.reduce((t, l) => t + hauteurDe(l), 0) + ENTRE_BLOCS * Math.max(0, lignes.length - 1);

    /* Centré sur l'origine : la force de centrage de la simulation n'a alors
       rien à corriger. */
    let haut = -hauteurTotale / 2;
    for (const ligne of lignes) {
        let gauche = -largeurTotale / 2;
        for (const bloc of ligne) {
            for (const [id, p] of bloc.positions) epingles[id] = { x: gauche + p.x, y: haut + p.y };
            gauche += bloc.largeur + ENTRE_BLOCS;
        }
        haut += hauteurDe(ligne) + ENTRE_BLOCS;
    }

    /* Les annexes, sous le titre de la première scène qui les convoque. */
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
        /* Cinq par rangée, centrées sous la scène, après son titre. */
        const n = grappes.get(scene) ?? 0;
        grappes.set(scene, n + 1);
        epingles[noeud.id] = {
            x: epingles[scene].x + ((n % 5) - 2) * 16,
            y: epingles[scene].y + 30 + Math.floor(n / 5) * 14,
        };
    }

    /* Les orphelines, une rangée par sorte, sous toute la trame. */
    let y = hauteurTotale / 2 + ENTRE_BLOCS;
    const pas = 60;
    const parRangee = Math.max(1, Math.floor(Math.max(largeurTotale, PAS_HORIZONTAL) / pas));
    for (const type of ORDRE_DES_ANNEXES) {
        const liste = orphelines.get(type) ?? [];
        liste.forEach((id, i) => {
            epingles[id] = {
                x: -largeurTotale / 2 + (i % parRangee) * pas,
                y: y + Math.floor(i / parRangee) * 36,
            };
        });
        if (liste.length) y += (Math.ceil(liste.length / parRangee) + 1) * 36;
    }

    return { epingles };
}
