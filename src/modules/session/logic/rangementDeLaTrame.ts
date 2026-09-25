import type { GrapheDeTrame, NoeudDeTrame, TypeDeNoeud } from './grapheDeLaTrame';

/**
 * **Ranger la trame — chaque acte selon sa forme : une chaîne, ou une étoile.**
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
 * **Quatre essais le même jour — chacun a montré à David ce que le précédent
 * cachait :**
 *
 * 1. *Une colonne par acte* — « trop serrées ». Quinze scènes sur un trait.
 * 2. *Le temps de gauche à droite* — « il faudrait s'étendre dans les deux
 *    dimensions ». Un ruban de 1 600 sur 100.
 * 3. *Des blocs repliés en serpentin* — « tu ne pourrais pas introduire des
 *    notions en étoile ? ». Une scène du Briefing envoyait une dizaine de pistes
 *    vers The Investigation, et la grille les faisait se croiser partout.
 * 4. **Aujourd'hui : la forme vient de la trame.** ⭐ *Une enquête ouverte EST une
 *    étoile* — un point de départ, des pistes au choix. La forcer dans une grille
 *    fabriquait les croisements ; la poser en cercle en fait des rayons.
 *
 * **La règle :**
 * - un acte est **ouvert** quand une scène y mène à trois autres ou plus, ou
 *   quand trois scènes ou plus y commencent sans rien avant elles — ce qui arrive
 *   quand on y entre par plusieurs portes, depuis un autre acte. Il devient une
 *   **étoile** : ses scènes en cercle autour de la scène carrefour, ou autour de
 *   l'acte lui-même quand le carrefour est ailleurs ;
 * - sinon c'est une **chaîne** : une scène se pose un rang à droite de celle qui
 *   y mène (vers l'avant seulement : *une boucle n'a pas de profondeur*), les
 *   rangs se replient en serpentin, quatre par ligne ;
 * - les blocs se suivent comme des mots dans une page, sur une largeur qui donne
 *   à l'ensemble **les proportions de la fenêtre** — pas celles d'un écran
 *   supposé : le troisième essai visait 16:9 et rendait une colonne ;
 * - lieux, PNJ, indices : sous le titre de la première scène qui les convoque.
 *   Les orphelins, en rangées sous la trame — *un orphelin qu'on voit à l'écart
 *   est un constat qu'on lit sans le chercher.*
 *
 * ⚠️ **Rien n'est écrit dans la trame.** Ce module rend des positions ; l'écran
 * les épingle comme le ferait un glisser. Le meneur ajuste ensuite à la main.
 */

/** Entre deux rangs d'une chaîne : la place d'un titre de scène. */
export const PAS_HORIZONTAL = 190;
/** Entre deux scènes empilées : le point, son titre, et deux rangées d'annexes. */
export const PAS_VERTICAL = 84;
/** Au-delà, un rang se replie en une colonne de plus. */
export const HAUTEUR_MAXIMALE_DE_RANG = 5;
/**
 * Combien de rangs par ligne, dans une chaîne, avant de replier — **les valeurs
 * essayées**. Quatre fixes ne se combinaient pas assez pour remplir une fenêtre
 * large (cinquième essai, 2026-09-25) : le rangement essaie chacune et garde
 * celle dont la page ressemble le plus à la fenêtre.
 */
export const COLONNES_ESSAYEES: readonly number[] = [3, 4, 5, 6, 8];
/** La valeur retenue quand rien ne départage. */
export const COLONNES_PAR_LIGNE = 4;
/** À partir de combien de pistes un point devient le centre d'une étoile. */
export const BRANCHES_D_UNE_ETOILE = 3;
/** L'arc entre deux scènes d'une étoile : assez pour deux titres voisins. */
const ARC_ENTRE_BRANCHES = 170;
const RAYON_MINIMAL = 150;
/** L'espace réservé au titre de l'acte, en haut de son bloc. */
const TETE_DE_BLOC = 70;
/** Entre deux lignes d'une même chaîne. */
const ENTRE_LIGNES = 24;
/** Entre deux blocs, dans les deux sens. */
const ENTRE_BLOCS = 90;

export interface Position { x: number; y: number }

export interface RangementDeLaTrame {
    /** Tout ce qui est rangé : posé, et épinglé. */
    epingles: Record<string, Position>;
    /**
     * **Ce que le rangement a visé et obtenu** — pour le journal. Sans elle, une
     * page trop étroite ne dit pas si c'est la fenêtre qui a été mal mesurée ou
     * le rangement qui a mal choisi (cinquième essai, 2026-09-25).
     */
    page: { largeur: number; hauteur: number; colonnesParLigne: number };
}

export interface OptionsDeRangement {
    /** Largeur sur hauteur de la fenêtre du graphe. 16:9 par défaut. */
    proportions?: number;
}

const idDe = (bout: string | NoeudDeTrame): string => (typeof bout === 'string' ? bout : bout.id);

/** L'ordre d'affichage des orphelins, rangée par rangée. */
const ORDRE_DES_ANNEXES: readonly TypeDeNoeud[] = ['lieu', 'pnj', 'indice', 'pj', 'ambiance'];

interface Bloc {
    largeur: number;
    hauteur: number;
    /** Positions relatives au coin haut-gauche du bloc. */
    positions: Map<string, Position>;
}

/** Le rang de chaque scène : un de plus que la plus profonde de celles qui y mènent. */
function rangs(scenes: readonly string[], menesPar: Map<string, string[]>): Map<string, number> {
    const ordre = new Map(scenes.map((s, i) => [s, i] as const));
    const rang = new Map<string, number>();
    for (const scene of scenes) {
        /* Vers l'avant seulement ; l'ordre du document garantit qu'on a déjà vu
           celles qui précèdent. */
        const avant = (menesPar.get(scene) ?? []).filter(de => (ordre.get(de) ?? Infinity) < ordre.get(scene)!);
        rang.set(scene, avant.length ? Math.max(...avant.map(de => rang.get(de)! + 1)) : 0);
    }
    return rang;
}

/**
 * **La forme d'un acte.** Le carrefour d'une étoile, s'il en a une : la scène
 * qui mène à trois autres ou plus, sinon l'acte lui-même quand trois scènes y
 * commencent sans rien avant elles. `null` : c'est une chaîne.
 */
export function centreDeLEtoile(
    acte: string,
    scenes: readonly string[],
    menesPar: Map<string, string[]>,
): string | null {
    const dans = new Set(scenes);
    const sorties = new Map<string, number>();
    for (const [vers, depuis] of menesPar) {
        if (!dans.has(vers)) continue;
        for (const de of depuis) if (dans.has(de)) sorties.set(de, (sorties.get(de) ?? 0) + 1);
    }
    let carrefour: string | null = null;
    let plus = BRANCHES_D_UNE_ETOILE - 1;
    for (const scene of scenes) {
        const n = sorties.get(scene) ?? 0;
        if (n > plus) { plus = n; carrefour = scene; }
    }
    if (carrefour) return carrefour;

    const rang = rangs(scenes, menesPar);
    const portes = scenes.filter(s => rang.get(s) === 0).length;
    return portes >= BRANCHES_D_UNE_ETOILE ? acte : null;
}

/** Une étoile : le centre, et toutes les autres scènes en cercle autour. */
function rangerEnEtoile(acte: string, scenes: readonly string[], centre: string): Bloc {
    const branches = scenes.filter(s => s !== centre);
    const rayon = Math.max(RAYON_MINIMAL, (branches.length * ARC_ENTRE_BRANCHES) / (2 * Math.PI));
    /* De la place pour les titres de part et d'autre du cercle. */
    const largeur = 2 * rayon + PAS_HORIZONTAL;
    const cx = largeur / 2;
    const cy = TETE_DE_BLOC + rayon;

    const positions = new Map<string, Position>();
    /* Dans l'ordre de l'acte, à partir de midi et dans le sens des aiguilles :
       on lit l'étoile comme on lit l'heure. */
    branches.forEach((scene, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, branches.length);
        positions.set(scene, { x: cx + rayon * Math.cos(angle), y: cy + rayon * Math.sin(angle) });
    });
    positions.set(centre, { x: cx, y: cy });
    /* Un carrefour qui est une scène laisse l'acte au-dessus du bloc. */
    if (centre !== acte) positions.set(acte, { x: cx, y: 12 });

    return { largeur, hauteur: cy + rayon + 60, positions };
}

/** Une chaîne : les rangs de gauche à droite, repliés en serpentin. */
function rangerEnChaine(
    acte: string, scenes: readonly string[], menesPar: Map<string, string[]>, parLigne: number,
): Bloc {
    const rang = rangs(scenes, menesPar);

    const parRang: string[][] = [];
    for (const scene of scenes) (parRang[rang.get(scene)!] ??= []).push(scene);
    const colonnes: string[][] = [];
    for (const membres of parRang) {
        if (!membres) continue;
        for (let i = 0; i < membres.length; i += HAUTEUR_MAXIMALE_DE_RANG) {
            colonnes.push(membres.slice(i, i + HAUTEUR_MAXIMALE_DE_RANG));
        }
    }

    const positions = new Map<string, Position>();
    const largeurEnColonnes = Math.max(1, Math.min(colonnes.length, parLigne));
    let y = TETE_DE_BLOC;
    for (let debut = 0, ligne = 0; debut < colonnes.length; debut += parLigne, ligne++) {
        const cetteLigne = colonnes.slice(debut, debut + parLigne);
        cetteLigne.forEach((colonne, j) => {
            /* Une ligne impaire repart de la droite : son premier rang est sous
               le dernier de la ligne précédente. */
            const place = ligne % 2 === 0 ? j : largeurEnColonnes - 1 - j;
            colonne.forEach((scene, k) => {
                positions.set(scene, { x: place * PAS_HORIZONTAL + PAS_HORIZONTAL / 2, y: y + k * PAS_VERTICAL });
            });
        });
        y += Math.max(...cetteLigne.map(c => c.length)) * PAS_VERTICAL + ENTRE_LIGNES;
    }

    const largeur = largeurEnColonnes * PAS_HORIZONTAL;
    positions.set(acte, { x: largeur / 2, y: 12 });
    return { largeur, hauteur: Math.max(y, TETE_DE_BLOC + PAS_VERTICAL), positions };
}

export function rangerLaTrame(graphe: GrapheDeTrame, options: OptionsDeRangement = {}): RangementDeLaTrame {
    const epingles: Record<string, Position> = {};
    const proportions = options.proportions && Number.isFinite(options.proportions) && options.proportions > 0
        ? options.proportions : 16 / 9;

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

    /* La forme de chaque acte ne dépend pas de la page : une étoile reste une
       étoile. Seule la largeur des chaînes varie d'un essai à l'autre. */
    const centres = new Map(actes.map(a => [a.id, centreDeLEtoile(a.id, scenesDe.get(a.id) ?? [], menesPar)] as const));
    const blocsPour = (parLigne: number): Bloc[] => actes.map(a => {
        const scenes = scenesDe.get(a.id) ?? [];
        const centre = centres.get(a.id);
        return centre ? rangerEnEtoile(a.id, scenes, centre) : rangerEnChaine(a.id, scenes, menesPar, parLigne);
    });

    /*
      **Les blocs comme des mots dans une page.** Ni la largeur de la page ni
      celle des chaînes ne sont calculées d'avance : avec des blocs de tailles
      très différentes — une étoile haute à côté de chaînes plates —, une formule
      rendait 1,2 quand la fenêtre en demandait 2,5. On essaie donc des
      combinaisons, et on garde celle dont les proportions sont les plus proches
      de celles de la fenêtre.
    */
    const largeurDe = (ligne: Bloc[]) =>
        ligne.reduce((t, b) => t + b.largeur, 0) + ENTRE_BLOCS * (ligne.length - 1);
    const hauteurDe = (ligne: Bloc[]) => Math.max(...ligne.map(b => b.hauteur));
    const dimensions = (page: Bloc[][]) => ({
        largeur: Math.max(0, ...page.map(largeurDe)),
        hauteur: page.reduce((t, l) => t + hauteurDe(l), 0) + ENTRE_BLOCS * Math.max(0, page.length - 1),
    });

    const mettreEnPage = (blocs: Bloc[], largeurVisee: number): Bloc[][] => {
        const page: Bloc[][] = [];
        let courante: Bloc[] = [];
        for (const bloc of blocs) {
            if (courante.length && largeurDe([...courante, bloc]) > largeurVisee) {
                page.push(courante);
                courante = [];
            }
            courante.push(bloc);
        }
        if (courante.length) page.push(courante);
        return page;
    };

    let lignes: Bloc[][] = [];
    let colonnesRetenues = COLONNES_PAR_LIGNE;
    let ecart = Infinity;
    /* La valeur par défaut d'abord : à égalité, c'est elle qui reste. */
    for (const parLigne of [COLONNES_PAR_LIGNE, ...COLONNES_ESSAYEES.filter(c => c !== COLONNES_PAR_LIGNE)]) {
        const blocs = blocsPour(parLigne);
        const plusLarge = Math.max(0, ...blocs.map(b => b.largeur));
        const toutSurUneLigne = blocs.length ? largeurDe(blocs) : 0;
        for (let i = 0; i <= 40; i++) {
            const essai = mettreEnPage(blocs, plusLarge + ((toutSurUneLigne - plusLarge) * i) / 40);
            const { largeur, hauteur } = dimensions(essai);
            if (hauteur <= 0) continue;
            const e = Math.abs(Math.log((largeur / hauteur) / proportions));
            if (e < ecart - 1e-9) { ecart = e; lignes = essai; colonnesRetenues = parLigne; }
        }
    }

    const { largeur: largeurTotale, hauteur: hauteurTotale } = dimensions(lignes);

    /* Chaque ligne centrée, le tout centré sur l'origine : la force de centrage
       de la simulation n'a alors rien à corriger. */
    let haut = -hauteurTotale / 2;
    for (const ligne of lignes) {
        let gauche = -largeurDe(ligne) / 2;
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

    return { epingles, page: { largeur: largeurTotale, hauteur: hauteurTotale, colonnesParLigne: colonnesRetenues } };
}
