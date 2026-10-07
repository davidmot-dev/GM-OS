import type { GrapheDeTrame, NoeudDeTrame, TypeDeNoeud } from './grapheDeLaTrame';
import { DIMENSIONS_DES_CARTES } from './geometrieDesCartesDeTrame';

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
    /** G3, 07/10/2026 : réserver les rectangles des cartes et de leurs annexes. */
    cartes?: boolean;
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
    if (options.cartes) return rangerLesCartes(graphe, options);
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

/**
 * Même grammaire chaîne/étoile, mais chaque scène réserve aussi ses annexes.
 * Une annexe partagée n'appartient qu'à sa première scène pour le placement.
 * Les blocs englobent les rectangles entiers : leurs centres seuls ne suffisent
 * plus à garantir une disposition lisible (plan G3, David, 07/10/2026).
 */
function rangerLesCartes(graphe: GrapheDeTrame, options: OptionsDeRangement): RangementDeLaTrame {
    const marge = 48;
    const scene = DIMENSIONS_DES_CARTES.scene, carteActe = DIMENSIONS_DES_CARTES.acte, annexe = DIMENSIONS_DES_CARTES.pnj;
    const actes = graphe.noeuds.filter(n => n.type === 'acte');
    const parId = new Map(graphe.noeuds.map(n => [n.id, n]));
    const scenesDe = new Map(actes.map(a => [a.id, [] as string[]]));
    const acteDe = new Map<string, string>();
    for (const l of graphe.liens) if (l.nature === 'appartenance') {
        scenesDe.get(l.source)?.push(l.target);
        acteDe.set(l.target, l.source);
    }
    const menesPar = new Map<string, string[]>();
    const annexesDe = new Map<string, string[]>();
    const dejaPosees = new Set<string>();
    for (const l of graphe.liens) {
        if (l.nature === 'suite' || l.nature === 'enchainement') {
            if (acteDe.has(l.source) && acteDe.get(l.source) === acteDe.get(l.target))
                menesPar.set(l.target, [...(menesPar.get(l.target) ?? []), l.source]);
        } else if (l.nature !== 'appartenance' && parId.get(l.source)?.type === 'scene' && !dejaPosees.has(l.target)) {
            annexesDe.set(l.source, [...(annexesDe.get(l.source) ?? []), l.target]);
            dejaPosees.add(l.target);
        }
    }
    const grappe = (id: string): Bloc => {
        const annexes = annexesDe.get(id) ?? [];
        const colonnes = Math.min(2, annexes.length);
        const largeur = Math.max(scene.largeur, colonnes * annexe.largeur + Math.max(0, colonnes - 1) * marge);
        const hauteur = scene.hauteur + Math.ceil(annexes.length / 2) * (annexe.hauteur + marge);
        const positions = new Map<string, Position>([[id, { x: largeur / 2, y: scene.hauteur / 2 }]]);
        annexes.forEach((a, i) => positions.set(a, {
            x: largeur / 2 + ((i % 2) - (colonnes - 1) / 2) * (annexe.largeur + marge),
            y: scene.hauteur + marge + annexe.hauteur / 2 + Math.floor(i / 2) * (annexe.hauteur + marge),
        }));
        return { largeur, hauteur, positions };
    };
    const ajouter = (dans: Map<string, Position>, bloc: Bloc, x: number, y: number) => {
        for (const [id, p] of bloc.positions) dans.set(id, { x: x + p.x, y: y + p.y });
    };
    const blocsPour = (parLigne: number): Bloc[] => actes.map(acte => {
        const scenes = scenesDe.get(acte.id) ?? [];
        const grappes = new Map(scenes.map(id => [id, grappe(id)]));
        const positions = new Map<string, Position>();
        const centre = centreDeLEtoile(acte.id, scenes, menesPar);
        let largeur = carteActe.largeur, hauteur = carteActe.hauteur;
        if (centre) {
            const branches = scenes.filter(id => id !== centre);
            const diametre = Math.max(scene.largeur, ...[...grappes.values()].map(g => Math.hypot(g.largeur, g.hauteur))) + marge;
            const rayon = Math.max(diametre, diametre / (2 * Math.sin(Math.PI / Math.max(2, branches.length))));
            largeur = 2 * rayon + diametre;
            const cx = largeur / 2, cy = carteActe.hauteur + marge + rayon + diametre / 2;
            branches.forEach((id, i) => {
                const angle = -Math.PI / 2 + i * 2 * Math.PI / branches.length;
                const g = grappes.get(id)!;
                ajouter(positions, g, cx + rayon * Math.cos(angle) - g.largeur / 2,
                    cy + rayon * Math.sin(angle) - g.hauteur / 2);
            });
            if (centre === acte.id) positions.set(acte.id, { x: cx, y: cy });
            else {
                const g = grappes.get(centre)!;
                ajouter(positions, g, cx - g.largeur / 2, cy - g.hauteur / 2);
                positions.set(acte.id, { x: cx, y: carteActe.hauteur / 2 });
            }
            hauteur = cy + rayon + diametre / 2;
        } else {
            const rang = rangs(scenes, menesPar);
            const colonnes: string[][] = [];
            for (const id of scenes) (colonnes[rang.get(id)!] ??= []).push(id);
            const nonVides = colonnes.filter(Boolean);
            const pasX = Math.max(scene.largeur, ...[...grappes.values()].map(g => g.largeur)) + marge;
            largeur = Math.max(scene.largeur, Math.min(parLigne, nonVides.length) * pasX - marge);
            let y = carteActe.hauteur + marge;
            for (let debut = 0, ligne = 0; debut < nonVides.length; debut += parLigne, ligne++) {
                const cetteLigne = nonVides.slice(debut, debut + parLigne);
                let hauteurLigne = 0;
                cetteLigne.forEach((colonne, j) => {
                    let bas = 0;
                    const x = (ligne % 2 ? Math.min(parLigne, nonVides.length) - 1 - j : j) * pasX;
                    for (const id of colonne) {
                        const g = grappes.get(id)!;
                        ajouter(positions, g, x + (pasX - marge - g.largeur) / 2, y + bas);
                        bas += g.hauteur + marge;
                    }
                    hauteurLigne = Math.max(hauteurLigne, bas);
                });
                y += hauteurLigne + marge;
            }
            hauteur = Math.max(carteActe.hauteur, y - marge);
            positions.set(acte.id, { x: largeur / 2, y: carteActe.hauteur / 2 });
        }
        return { largeur, hauteur, positions };
    });
    // Les scènes hors bloc et les annexes orphelines restent visibles et rangées.
    const restants = graphe.noeuds.filter(n => !acteDe.has(n.id) && n.type !== 'acte' && !dejaPosees.has(n.id));
    const proportions = options.proportions && Number.isFinite(options.proportions) && options.proportions > 0 ? options.proportions : 16 / 9;
    let meilleur: RangementDeLaTrame = { epingles: {}, page: { largeur: 0, hauteur: 0, colonnesParLigne: 4 } };
    let ecart = Infinity;
    for (const parLigne of [4, 3, 5, 6, 8]) {
        const blocs = blocsPour(parLigne);
        const largeurMax = Math.max(scene.largeur, ...blocs.map(b => b.largeur));
        const largeurLigne = blocs.reduce((s, b) => s + b.largeur + ENTRE_BLOCS, 0);
        for (let essai = 0; essai <= 20; essai++) {
            const visee = largeurMax + (largeurLigne - largeurMax) * essai / 20;
            const places = new Map<string, Position>();
            let x = 0, y = 0, hauteurLigne = 0, largeur = 0;
            for (const bloc of blocs) {
                if (x && x + bloc.largeur > visee) { y += hauteurLigne + ENTRE_BLOCS; x = 0; hauteurLigne = 0; }
                ajouter(places, bloc, x, y);
                largeur = Math.max(largeur, x + bloc.largeur);
                x += bloc.largeur + ENTRE_BLOCS;
                hauteurLigne = Math.max(hauteurLigne, bloc.hauteur);
            }
            y += hauteurLigne;
            if (restants.length) {
                y += ENTRE_BLOCS;
                const parRangee = Math.max(1, Math.floor(Math.max(largeur, scene.largeur) / (scene.largeur + marge)));
                restants.forEach((n, i) => places.set(n.id, { x: scene.largeur / 2 + (i % parRangee) * (scene.largeur + marge), y: y + scene.hauteur / 2 + Math.floor(i / parRangee) * (scene.hauteur + marge) }));
                largeur = Math.max(largeur, Math.min(parRangee, restants.length) * (scene.largeur + marge) - marge);
                y += Math.ceil(restants.length / parRangee) * (scene.hauteur + marge);
            }
            const e = y ? Math.abs(Math.log((largeur / y) / proportions)) : 0;
            if (e < ecart) {
                ecart = e;
                meilleur = { epingles: Object.fromEntries([...places].map(([id, p]) => [id, { x: p.x - largeur / 2, y: p.y - y / 2 }])),
                    page: { largeur, hauteur: y, colonnesParLigne: parLigne } };
            }
        }
    }
    return meilleur;
}
