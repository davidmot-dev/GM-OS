import type { Acte, Scene, ImportanceDeScene } from '../../../types/trame.types';
import type { AtlasMap, Clue } from '../../../types/chronicle.types';
import { actesOrdonnes, scenesOrdonnees, etatDeLaScene, type EtatDeScene } from './trame';
import { importanceDeLaScene } from './importanceDeLaScene';
import { enchainementsDeLaScene, ordreEstDessine } from './enchainementsDeLaTrame';

/**
 * **La trame vue comme un graphe** — demandé par David le 2026-09-22.
 *
 * ⭐ **Rien n'est saisi ici : tout est déjà écrit.** Une scène porte son
 * `acteId`, son `lieuId`, ses `entiteIds`, ses `indiceIds`, ses
 * `personnagesIds` et son `momentDeStoryboardId`. Ce module ne fait que *montrer
 * ensemble* ce que six écrans montrent séparément. **Il n'écrit rien** — un
 * sixième écrivain de la trame est exactement ce que ce dépôt a payé une dizaine
 * de fois cette année.
 *
 * ---
 *
 * ⭐ **LES NIVEAUX, ET POURQUOI PAS SEPT CASES À COCHER.** Idée de David, et
 * elle est meilleure que celle que j'allais construire : *« je voudrais pouvoir
 * avoir différents niveaux de visualisation, niveau 0 : trame et scène, niveau 1
 * lieu, niveau 2 PNJ, etc. »*
 *
 * Sept bascules indépendantes, c'est 128 vues possibles dont le meneur doit
 * choisir la bonne. **Un seul curseur, c'est une profondeur** — on descend
 * jusqu'à ce que ce soit encore lisible, et on remonte. *La densité se règle par
 * un geste, pas par une négociation.*
 *
 * ⚠️ « Le secret de Milo » fait 3 actes, 29 scènes, 43 PNJ : au dernier niveau,
 * une centaine de nœuds. Le curseur n'est donc pas une commodité, c'est ce qui
 * rend l'écran utilisable.
 */

export type TypeDeNoeud = 'acte' | 'scene' | 'lieu' | 'pnj' | 'indice' | 'pj' | 'ambiance';

/**
 * Ce que chaque cran ajoute au précédent — **cumulatif**.
 *
 * L'ordre suit la question « à quel point est-ce l'histoire ? » : l'épine
 * d'abord, puis où ça se passe, qui on y rencontre, ce qu'on y trouve, qui du
 * côté des joueurs, et la production en dernier.
 */
export const NIVEAUX: readonly { libelle: string; ajoute: readonly TypeDeNoeud[] }[] = [
    { libelle: 'Trame', ajoute: [] },
    { libelle: 'Lieux', ajoute: ['lieu'] },
    { libelle: 'PNJ', ajoute: ['pnj'] },
    { libelle: 'Indices', ajoute: ['indice'] },
    { libelle: 'Personnages', ajoute: ['pj'] },
    { libelle: 'Ambiances', ajoute: ['ambiance'] },
] as const;

export const NIVEAU_MAXIMUM = NIVEAUX.length - 1;

/** Les actes et les scènes sont de tous les niveaux : c'est la trame elle-même. */
const TOUJOURS: readonly TypeDeNoeud[] = ['acte', 'scene'] as const;

export function typesDuNiveau(niveau: number): Set<TypeDeNoeud> {
    const borne = Math.max(0, Math.min(NIVEAU_MAXIMUM, Math.trunc(niveau)));
    const types = new Set<TypeDeNoeud>(TOUJOURS);
    for (let i = 0; i <= borne; i++) for (const type of NIVEAUX[i].ajoute) types.add(type);
    return types;
}

/** Le premier cran où ce type apparaît — ce que vaut « monte d'un niveau ». */
export function niveauQuiMontre(type: TypeDeNoeud): number {
    if (TOUJOURS.includes(type)) return 0;
    const rang = NIVEAUX.findIndex(n => n.ajoute.includes(type));
    return rang === -1 ? NIVEAU_MAXIMUM : rang;
}

export const LIBELLE_DU_TYPE: Record<TypeDeNoeud, string> = {
    acte: 'Acte', scene: 'Scène', lieu: 'Lieu', pnj: 'PNJ',
    indice: 'Indice', pj: 'Personnage', ambiance: 'Ambiance',
};

/**
 * La couleur de chaque sorte de nœud.
 *
 * ⚠️ **L'acte est neutre, exprès.** Il est l'épine dorsale : la colorer autant
 * que le reste ferait sept familles de même poids, et on ne saurait plus lire la
 * structure sous les renvois. *Le sky de la scène est celui du liseré de rang —
 * un même objet ne change pas de couleur d'un écran à l'autre.*
 */
export const COULEUR_DU_TYPE: Record<TypeDeNoeud, string> = {
    acte: '#cbd5e1',
    scene: '#38bdf8',
    lieu: '#34d399',
    pnj: '#fbbf24',
    indice: '#f472b6',
    pj: '#60a5fa',
    ambiance: '#c084fc',
};

/** Ce qu'on garde des scènes, selon leur rang dans l'intrigue. */
export type PorteeDeLIntrigue = 'tout' | 'sans-optionnelles' | 'principale';

export interface NoeudDeTrame {
    /** Préfixé par son type : deux objets de tables différentes peuvent partager un identifiant. */
    id: string;
    /** L'identifiant de l'objet lui-même, pour ouvrir sa fiche. */
    refId: string;
    type: TypeDeNoeud;
    nom: string;
    /** Scène seulement — ce qui décide son apparence, comme dans les listes. */
    importance?: ImportanceDeScene | null;
    etat?: EtatDeScene;
    /** Acte achevé, indice révélé. Deux faits distincts, une même question : c'est derrière nous ? */
    accompli?: boolean;
    /** Semées par `placerLeNoeud`, jamais calculées ici. */
    x?: number; y?: number; fx?: number; fy?: number;
}

export type NatureDeLien = 'appartenance' | 'suite' | 'enchainement' | TypeDeNoeud;

export interface LienDeTrame {
    source: string;
    target: string;
    nature: NatureDeLien;
    /**
     * La condition d'un enchaînement — *« si elle survit »*, *« en cas d'échec »*.
     *
     * ⭐ **C'est elle qui fait d'un graphe un plan de scénario**, et pas seulement
     * une carte de ce qui existe. Dessinée au milieu du trait quand on est assez
     * près.
     */
    libelle?: string;
}

export interface GrapheDeTrame {
    noeuds: NoeudDeTrame[];
    liens: LienDeTrame[];
}

export interface SourceDeLaTrame {
    actes?: readonly Acte[];
    scenes?: readonly Scene[];
    atlasMaps?: readonly AtlasMap[];
    entities?: readonly { id: string; campaignId?: string; name: string }[];
    clues?: readonly Clue[];
    moments?: readonly { id: string; campaignId?: string | null; name: string }[];
    personnages?: readonly { id: string; campaignId?: string | null; name: string }[];
}

export interface VueDuGraphe {
    niveau: number;
    /** Une scène terminée reste dans la trame ; on peut juste ne pas la regarder. */
    masquerLesScenesTerminees?: boolean;
    portee?: PorteeDeLIntrigue;
    /** Ce que `placerLeNoeud` a décidé pour chaque identifiant. */
    placer?: (id: string) => { x?: number; y?: number; fx?: number; fy?: number };
}

export function idDuNoeud(type: TypeDeNoeud, refId: string): string {
    return `${type}:${refId}`;
}

/** La scène passe-t-elle le filtre de rang ? */
export function porteeRetientLaScene(scene: Scene, portee: PorteeDeLIntrigue = 'tout'): boolean {
    const rang = importanceDeLaScene(scene);
    if (portee === 'sans-optionnelles') return rang !== 'optionnelle';
    if (portee === 'principale') return rang === 'principale';
    return true;
}

/**
 * Le graphe de la trame d'une campagne.
 *
 * ⭐ **Les objets d'une catégorie sont TOUS là dès que son niveau est atteint,
 * même ceux qu'aucune scène ne convoque.** C'est volontaire, et c'est la moitié
 * de la valeur de cet écran : *un indice que plus aucune scène ne livre apparaît
 * alors comme un nœud isolé, et on le voit sans rien avoir à demander.* Ne
 * garder que les objets reliés aurait produit un graphe où tout va bien par
 * construction.
 *
 * ⚠️ **Un renvoi vers un objet supprimé ne crée pas de nœud fantôme.** Il
 * disparaît du dessin et se retrouve compté dans les constats : *dessiner un
 * nœud pour un lieu qui n'existe plus ferait croire qu'il existe.*
 */
export function grapheDeLaTrame(
    campaignId: string | null | undefined,
    source: SourceDeLaTrame,
    vue: VueDuGraphe,
): GrapheDeTrame {
    if (!campaignId) return { noeuds: [], liens: [] };

    const types = typesDuNiveau(vue.niveau);
    const noeuds: NoeudDeTrame[] = [];
    const liens: LienDeTrame[] = [];
    /*
      ⚠️ **Les enchaînements se posent à la fin, pas au vol.** Une sortie peut
      viser une scène d'un acte qu'on n'a pas encore parcouru — c'est même leur
      raison d'être. Les ajouter tout de suite aurait produit des liens vers des
      nœuds absents, et *react-force-graph invente un nœud pour une extrémité
      inconnue* : un fantôme sans nom au milieu de la toile.
    */
    const enAttente: LienDeTrame[] = [];
    const poser = (noeud: Omit<NoeudDeTrame, 'id'>) => {
        const id = idDuNoeud(noeud.type, noeud.refId);
        noeuds.push({ ...noeud, id, ...(vue.placer?.(id) ?? {}) });
        return id;
    };

    const mesActes = actesOrdonnes(source.actes ?? [], campaignId);
    const toutesLesScenes = source.scenes ?? [];

    /* Les catégories annexes, entières, au niveau qui les montre. Leurs clés
       servent aussi à savoir si un renvoi de scène pointe encore sur du réel. */
    const lieux = new Map((source.atlasMaps ?? [])
        .filter(m => m.campaignId === campaignId).map(m => [m.id, m.name] as const));
    const pnj = new Map((source.entities ?? [])
        .filter(e => e.campaignId === campaignId).map(e => [e.id, e.name] as const));
    const indices = new Map((source.clues ?? [])
        .filter(c => c.campaignId === campaignId).map(c => [c.id, c.title] as const));
    const pjs = new Map((source.personnages ?? [])
        .filter(p => p.campaignId === campaignId).map(p => [p.id, p.name] as const));
    const ambiances = new Map((source.moments ?? [])
        .filter(m => m.campaignId === campaignId).map(m => [m.id, m.name] as const));

    const annexes: [TypeDeNoeud, Map<string, string>, ((ref: string) => boolean) | undefined][] = [
        ['lieu', lieux, undefined],
        ['pnj', pnj, undefined],
        ['indice', indices, (ref) => !!(source.clues ?? []).find(c => c.id === ref)?.isRevealed],
        ['pj', pjs, undefined],
        ['ambiance', ambiances, undefined],
    ];
    for (const [type, table, accompliDe] of annexes) {
        if (!types.has(type)) continue;
        for (const [refId, nom] of table) poser({ type, refId, nom, accompli: accompliDe?.(refId) });
    }

    for (const acte of mesActes) {
        const idActe = poser({ type: 'acte', refId: acte.id, nom: acte.titre, accompli: !!acte.acheve });

        const sesScenes = scenesOrdonnees(toutesLesScenes, acte.id).filter(scene =>
            porteeRetientLaScene(scene, vue.portee)
            && !(vue.masquerLesScenesTerminees && etatDeLaScene(scene) === 'terminee'));

        let precedente: string | null = null;
        /* La scène précédente laisse-t-elle l'ordre parler pour elle ? */
        let precedenteSuitSonOrdre = true;
        for (const scene of sesScenes) {
            const idScene = poser({
                type: 'scene', refId: scene.id, nom: scene.titre,
                importance: importanceDeLaScene(scene), etat: etatDeLaScene(scene),
            });
            liens.push({ source: idActe, target: idScene, nature: 'appartenance' });

            /*
              ⭐ **Le lien qui fait qu'on lit une TRAME et non une pelote.**
              Scène n → scène n+1 dans l'ordre de l'acte : l'épine dorsale de
              l'histoire, avec ses lieux et ses PNJ qui pendent autour. Sans lui,
              un graphe de force rend une étoile où chaque acte est un oursin.

              ⛔ **Mais seulement si la précédente n'a rien déclaré.** C'est la
              règle qui empêche deux vérités sur « ce qui suit » : *l'ordre ne se
              dessine que là où le meneur n'a rien dit.* Voir `ordreEstDessine`.
            */
            if (precedente && precedenteSuitSonOrdre) {
                liens.push({ source: precedente, target: idScene, nature: 'suite' });
            }
            precedente = idScene;
            precedenteSuitSonOrdre = ordreEstDessine(scene);

            /*
              **Les sorties déclarées**, par-dessus les actes et avec leur
              condition. La cible peut être masquée par un filtre ou avoir été
              supprimée : on ne trace que ce qui existe à l'écran, et les cibles
              disparues vont aux constats.
            */
            for (const sortie of enchainementsDeLaScene(scene)) {
                enAttente.push({
                    source: idScene,
                    target: idDuNoeud('scene', sortie.vers),
                    nature: 'enchainement',
                    libelle: sortie.libelle,
                });
            }

            /* Un renvoi ne devient un lien que si sa cible existe encore ET que
               son niveau est atteint. Les cibles disparues vont aux constats. */
            const renvois: [TypeDeNoeud, string[], Map<string, string>][] = [
                ['lieu', scene.lieuId ? [scene.lieuId] : [], lieux],
                ['pnj', scene.entiteIds ?? [], pnj],
                ['indice', scene.indiceIds ?? [], indices],
                ['pj', scene.personnagesIds ?? [], pjs],
                ['ambiance', scene.momentDeStoryboardId ? [scene.momentDeStoryboardId] : [], ambiances],
            ];
            for (const [type, refs, table] of renvois) {
                if (!types.has(type)) continue;
                for (const ref of refs) {
                    if (!table.has(ref)) continue;
                    liens.push({ source: idScene, target: idDuNoeud(type, ref), nature: type });
                }
            }
        }
    }

    const dessines = new Set(noeuds.map(n => n.id));
    for (const lien of enAttente) {
        if (dessines.has(lien.target)) liens.push(lien);
    }

    return { noeuds, liens };
}

/* ─────────────────────────────────────────────
   RELIER ET DÉLIER — ce que le graphe écrit
   ───────────────────────────────────────────── */

/**
 * **Quel champ de la scène porte chaque sorte de renvoi.**
 *
 * ⭐ **C'est la seule table du genre, et elle doit le rester.** La fiche de
 * `TrameDashboard` écrit déjà ces cinq champs par ses cases à cocher ; le graphe
 * écrit **les mêmes**, par la même action du magasin. *Il n'y a donc pas un
 * sixième écrivain de la trame — il y en a un, avec une seconde porte.*
 */
export const CHAMP_DU_RENVOI: Partial<Record<TypeDeNoeud, { champ: keyof Scene; multiple: boolean }>> = {
    lieu: { champ: 'lieuId', multiple: false },
    ambiance: { champ: 'momentDeStoryboardId', multiple: false },
    pnj: { champ: 'entiteIds', multiple: true },
    indice: { champ: 'indiceIds', multiple: true },
    pj: { champ: 'personnagesIds', multiple: true },
};

export interface RenvoiEcrit {
    updates: Partial<Scene>;
    /** Vrai quand un renvoi unique en remplace un autre — à dire au meneur. */
    remplace: boolean;
}

/**
 * Ce qu'il faut écrire pour relier — ou délier — une scène et un nœud annexe.
 *
 * Rend `null` quand le geste n'a pas de sens : *un acte ou une autre scène ne se
 * relient pas à la main.* L'appartenance vient de `acteId` et la suite de
 * `ordre` — les inventer ici aurait créé deux vérités sur la structure.
 *
 * ⚠️ **Le lieu et l'ambiance sont uniques : relier REMPLACE.** Le drapeau
 * `remplace` existe pour que l'écran le dise — *un renvoi qui disparaît sans un
 * mot ressemble à un geste qui a échoué*, et le meneur relierait deux fois.
 */
export function renvoiEcrit(
    scene: Scene,
    type: TypeDeNoeud,
    refId: string,
    relier: boolean,
): RenvoiEcrit | null {
    const cible = CHAMP_DU_RENVOI[type];
    if (!cible) return null;

    if (!cible.multiple) {
        const actuel = scene[cible.champ] as string | undefined;
        if (!relier) {
            /* Délier ce qui n'était pas lié n'écrit rien : un geste sans effet
               n'est pas une erreur, mais il ne doit pas non plus faire un tour
               au magasin. */
            if (actuel !== refId) return null;
            return { updates: { [cible.champ]: undefined } as Partial<Scene>, remplace: false };
        }
        if (actuel === refId) return null;
        return { updates: { [cible.champ]: refId } as Partial<Scene>, remplace: !!actuel };
    }

    const liste = (scene[cible.champ] as string[] | undefined) ?? [];
    const dedans = liste.includes(refId);
    if (relier === dedans) return null;
    const suite = relier ? [...liste, refId] : liste.filter(x => x !== refId);
    return { updates: { [cible.champ]: suite } as Partial<Scene>, remplace: false };
}

/**
 * Les deux nœuds désignés forment-ils un renvoi, et dans quel sens ?
 *
 * **On accepte les deux sens** — du PNJ vers la scène comme de la scène vers le
 * PNJ. *Exiger un sens sur une toile où rien ne l'indique reviendrait à faire
 * échouer un geste sur deux sans dire pourquoi.*
 */
export function coupleDeRenvoi(
    a: { type: TypeDeNoeud; refId: string },
    b: { type: TypeDeNoeud; refId: string },
): { sceneId: string; type: TypeDeNoeud; refId: string } | null {
    const scene = a.type === 'scene' ? a : b.type === 'scene' ? b : null;
    const annexe = scene === a ? b : a;
    if (!scene || annexe.type === 'scene' || !CHAMP_DU_RENVOI[annexe.type]) return null;
    return { sceneId: scene.refId, type: annexe.type, refId: annexe.refId };
}

/**
 * Deux scènes désignées forment un enchaînement, **dans le sens du geste**.
 *
 * ⛔ **Et ici le sens compte, contrairement aux renvois.** « A mène à B » n'est
 * pas « B mène à A » : *accepter les deux sens aurait inversé une branche sur
 * deux sans rien dire.* C'est pourquoi la toile annonce qui est le départ
 * pendant le geste.
 */
export function coupleDEnchainement(
    depart: { type: TypeDeNoeud; refId: string },
    arrivee: { type: TypeDeNoeud; refId: string },
): { deId: string; versId: string } | null {
    if (depart.type !== 'scene' || arrivee.type !== 'scene') return null;
    if (depart.refId === arrivee.refId) return null;
    return { deId: depart.refId, versId: arrivee.refId };
}

/* ─────────────────────────────────────────────
   LES CONSTATS — ce que le graphe remarque
   ───────────────────────────────────────────── */

export interface ConstatDeLaTrame {
    id: string;
    /** Au singulier : l'écran accorde d'après `noeuds.length`. */
    libelle: string;
    /** Les nœuds en cause, par leur identifiant de graphe. */
    noeuds: string[];
    /** Le cran minimal auquel ils sont visibles — l'écran y monte au clic. */
    niveau: number;
    ton: 'alerte' | 'info';
}

/**
 * **Ce qu'aucune liste ne dit.**
 *
 * ⛔ **Ils se calculent sur la trame ENTIÈRE, jamais sur la vue.** Un constat
 * qui disparaîtrait en masquant les scènes terminées ferait croire qu'un défaut
 * *se répare quand on détourne le regard*. Le niveau et les filtres décident de
 * ce qu'on dessine, jamais de ce qui est vrai.
 *
 * ⚠️ **Et on ne signale pas « ce PNJ n'apparaît que dans une scène ».** C'était
 * mon premier réflexe : sur « Le secret de Milo », 43 PNJ pour 29 scènes, il
 * aurait crié quarante fois. *Un constat qui se déclenche toujours ne dit plus
 * rien.*
 */
export function constatsDeLaTrame(
    campaignId: string | null | undefined,
    source: SourceDeLaTrame,
): ConstatDeLaTrame[] {
    if (!campaignId) return [];

    const mesActes = actesOrdonnes(source.actes ?? [], campaignId);
    const acteIds = new Set(mesActes.map(a => a.id));
    const mesScenes = (source.scenes ?? []).filter(s => acteIds.has(s.acteId));

    const lieux = new Set((source.atlasMaps ?? []).filter(m => m.campaignId === campaignId).map(m => m.id));
    const pnj = (source.entities ?? []).filter(e => e.campaignId === campaignId);
    const indices = (source.clues ?? []).filter(c => c.campaignId === campaignId);
    const moments = new Set((source.moments ?? []).filter(m => m.campaignId === campaignId).map(m => m.id));

    const indicesLivres = new Set(mesScenes.flatMap(s => s.indiceIds ?? []));
    const pnjConvoques = new Set(mesScenes.flatMap(s => s.entiteIds ?? []));

    const constats: ConstatDeLaTrame[] = [];
    const ajouter = (id: string, libelle: string, noeuds: string[], niveau: number, ton: ConstatDeLaTrame['ton']) => {
        if (noeuds.length > 0) constats.push({ id, libelle, noeuds, niveau, ton });
    };

    /* Le plus grave : le groupe ne peut plus le trouver, et rien ne le dit. */
    ajouter('indice-orphelin', 'indice que plus aucune scène ne livre',
        indices.filter(c => !indicesLivres.has(c.id)).map(c => idDuNoeud('indice', c.id)),
        niveauQuiMontre('indice'), 'alerte');

    ajouter('renvoi-mort', 'scène qui renvoie à quelque chose de supprimé',
        mesScenes.filter(s =>
            (s.lieuId && !lieux.has(s.lieuId))
            || (s.momentDeStoryboardId && !moments.has(s.momentDeStoryboardId))
            || (s.entiteIds ?? []).some(id => !pnj.some(e => e.id === id))
            || (s.indiceIds ?? []).some(id => !indices.some(c => c.id === id))
            /* Une sortie vers une scène disparue : le meneur la lirait comme
               valide jusqu'à cliquer. */
            || enchainementsDeLaScene(s).some(e => !mesScenes.some(autre => autre.id === e.vers)),
        ).map(s => idDuNoeud('scene', s.id)), 0, 'alerte');

    ajouter('pnj-hors-trame', 'PNJ qu’aucune scène ne convoque',
        pnj.filter(e => !pnjConvoques.has(e.id)).map(e => idDuNoeud('pnj', e.id)),
        niveauQuiMontre('pnj'), 'info');

    ajouter('scene-creuse', 'scène sans PNJ ni indice',
        mesScenes.filter(s => (s.entiteIds ?? []).length === 0 && (s.indiceIds ?? []).length === 0)
            .map(s => idDuNoeud('scene', s.id)), 0, 'info');

    ajouter('scene-sans-lieu', 'scène sans lieu',
        mesScenes.filter(s => !s.lieuId).map(s => idDuNoeud('scene', s.id)), 0, 'info');

    ajouter('acte-vide', 'acte sans aucune scène',
        mesActes.filter(a => !mesScenes.some(s => s.acteId === a.id)).map(a => idDuNoeud('acte', a.id)),
        0, 'info');

    return constats;
}
