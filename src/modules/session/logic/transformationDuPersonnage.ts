import type { Entity, EntityRelation } from '../../../types/entity.types';
import type { Player, PlayerCharacter } from '../../../types/player.types';
import type { Scene } from '../../../types/trame.types';
import {
    CHAMPS_PROPRES_AU_PJ,
    CHAMPS_PROPRES_AU_PNJ,
    type ReserveDeTransformation,
} from '../../../types/transformation.types';

/**
 * **Transformer un PNJ en personnage joueur, et l'inverse** (§ 268, 21/11/2026).
 *
 * David : « je voudrais pouvoir transformer un PNJ en Personnage Joueur, et
 * vice-versa ». Spécification : `documentation/Planning/2026-11-21-pnj-en-pj-et-retour.md`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ LE PERSONNAGE CHANGE DE LISTE, PAS D'IDENTIFIANT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Décision de David (Q1, 21/11) : **« Déplacer »**, pas copier. C'est la leçon
 * du transfert entre joueurs (`transfertDePersonnage.ts`) : un identifiant qui
 * ne bouge pas, et tout ce qui le vise le suit. Ici, la séance du soir
 * (`sessionEntityIds` mêle PJ et PNJ), la chronique, les favoris suivent sans
 * réécriture. Aucun code ne devine PJ ou PNJ au préfixe `pc-` / `e-` (vérifié
 * le 21/11).
 *
 * **Ce qui, en revanche, nomme le GENRE à côté de l'identifiant** se réécrit
 * ici, en même temps :
 * - les relations des autres personnages (`EntityRelation.targetType`) ;
 * - les scènes de la trame (`entiteIds` pour les PNJ, `personnagesIds` pour les PJ).
 *
 * Le combattant du plateau et les cartes tenues vivent dans d'autres magasins :
 * l'écran les écrit après coup (T4, T5).
 *
 * ⛔ **En cas de refus, l'état d'origine est rendu par référence**, comme pour
 * le transfert : une copie ferait croire à un changement à tout ce qui compare
 * par identité (la synchronisation des tablettes la première).
 */

// ─────────────────────────────────────────────
// La correspondance des champs
// ─────────────────────────────────────────────

/** Les champs nommés, sans ceux qui valent `undefined` : une réserve vide n'est pas une réserve. */
function prendre<T extends object, K extends keyof T>(objet: T, cles: readonly K[]): Partial<Pick<T, K>> {
    const pris: Partial<Pick<T, K>> = {};
    for (const cle of cles) if (objet[cle] !== undefined) pris[cle] = objet[cle];
    return pris;
}

/** Retire les clés à `undefined`, pour qu'un aller-retour rende un objet égal à celui du départ. */
function sansVide<T extends object>(objet: T): T {
    return Object.fromEntries(Object.entries(objet).filter(([, v]) => v !== undefined)) as T;
}

/** La réserve qui reste une fois une moitié consommée ; `undefined` si elle est vide. */
function reserveRestante(reserve: ReserveDeTransformation): ReserveDeTransformation | undefined {
    const propre = sansVide({
        pj: reserve.pj && Object.keys(reserve.pj).length ? reserve.pj : undefined,
        pnj: reserve.pnj && Object.keys(reserve.pnj).length ? reserve.pnj : undefined,
    });
    return Object.keys(propre).length ? propre : undefined;
}

export interface OptionsVersPersonnage {
    /** Le jeu du personnage, résolu par l'appelant (`piloteDuPersonnage`) — sert si la réserve n'en garde pas. */
    systemId?: string;
    /** Le gabarit de fiche du jeu, si le PNJ n'en désigne aucun : un PJ en exige un. */
    templateIdDuJeu?: string;
}

/**
 * **Le PJ que devient ce PNJ.** Ce qu'un PJ ne porte pas (voix, CA, rôle…) part
 * en réserve ; ce qu'il avait comme PJ, s'il l'a été, revient de la réserve.
 */
export function pnjEnPersonnage(entite: Entity, options: OptionsVersPersonnage = {}): PlayerCharacter {
    const { reserveDeTransformation: reserve = {}, ...e } = entite;
    const { sansPointsDeVie, ...rendu } = reserve.pj ?? {};
    return sansVide({
        ...rendu,
        id: e.id,
        name: e.name,
        portraitUrl: e.avatar,
        campaignId: e.campaignId,
        systemId: rendu.systemId ?? options.systemId,
        templateId: e.templateId || options.templateIdDuJeu || '',
        sheetData: e.sheetData ?? {},
        healthSystem: e.healthSystem,
        hp: sansPointsDeVie ? undefined : e.hp,
        maxHp: sansPointsDeVie ? undefined : e.maxHp,
        relations: e.relations,
        faction: e.faction,
        // Une note vide et une note absente se valent ; la vide reviendrait autrement au retour.
        description: e.description || undefined,
        gmNotes: e.gmSecretInfo || undefined,
        reserveDeTransformation: reserveRestante({ pnj: prendre(e, CHAMPS_PROPRES_AU_PNJ) }),
    }) as PlayerCharacter;
}

export interface OptionsVersPnj {
    /** Le rôle choisi dans la confirmation. */
    role: Entity['role'];
    /** L'heure du passage, pour « rencontré » — les joueurs connaissent un ancien PJ. */
    maintenant: number;
}

/**
 * **Le PNJ que devient ce PJ.** Ce qu'un PNJ ne porte pas (Sac à dos, fiche
 * HTML, notes du joueur…) part en réserve ; ce qu'il avait comme PNJ revient.
 *
 * Le PJ doit avoir une campagne : l'appelant l'a vérifié (`refus 'sans-campagne'`).
 */
export function personnageEnPnj(personnage: PlayerCharacter, options: OptionsVersPnj): Entity {
    const { reserveDeTransformation: reserve = {}, ...p } = personnage;
    const rendu = reserve.pnj;
    return sansVide({
        // Les valeurs d'un PNJ créé à la main (`AddEntityForm`) quand la réserve n'a rien.
        type: 'npc',
        status: p.healthSystem?.state === 'dead' ? 'dead' : 'alive',
        ac: 0,
        speed: 0,
        initiative: 0,
        roleplayingNotes: '',
        linkedMapIds: [],
        /*
          Les joueurs le connaissent : il a été l'un d'eux. Seulement s'il n'a
          jamais été PNJ — sinon sa réserve dit ce qu'il était, visible ou non,
          et un aller-retour ne doit rien changer.
        */
        ...(rendu ? {} : { isVisibleByPlayers: true, vuParLesJoueurs: { le: options.maintenant } }),
        ...rendu,
        role: options.role,
        id: p.id,
        name: p.name,
        avatar: p.portraitUrl,
        campaignId: p.campaignId as string,
        templateId: p.templateId || undefined,
        sheetData: p.sheetData,
        healthSystem: p.healthSystem,
        // `Entity` les exige ; `healthSystem` fait foi, ils restent inertes là où le jeu ne compte pas de points.
        hp: p.hp ?? 0,
        maxHp: p.maxHp ?? p.hp ?? 0,
        relations: p.relations,
        faction: p.faction,
        description: p.description ?? '',
        gmSecretInfo: p.gmNotes ?? '',
        reserveDeTransformation: reserveRestante({
            pj: { ...prendre(p, CHAMPS_PROPRES_AU_PJ), ...(p.hp === undefined ? { sansPointsDeVie: true as const } : {}) },
        }),
    }) as Entity;
}

// ─────────────────────────────────────────────
// Les liens qui nomment le genre
// ─────────────────────────────────────────────

const genreDe = (versPersonnage: boolean): EntityRelation['targetType'] => (versPersonnage ? 'pc' : 'npc');

function relationsReecrites<T extends { relations?: EntityRelation[] }>(porteur: T, id: string, genre: EntityRelation['targetType']): T {
    if (!porteur.relations?.some(r => r.targetId === id && r.targetType !== genre)) return porteur;
    return { ...porteur, relations: porteur.relations.map(r => (r.targetId === id ? { ...r, targetType: genre } : r)) };
}

/**
 * **Les relations de tous les personnages qui le visent**, au nouveau genre.
 * Seuls les porteurs touchés sont recopiés : les autres gardent leur référence.
 */
export function reecrireLesRelations(
    entities: Entity[],
    players: Player[],
    id: string,
    versPersonnage: boolean,
): { entities: Entity[]; players: Player[] } {
    const genre = genreDe(versPersonnage);
    return {
        entities: entities.map(e => relationsReecrites(e, id, genre)),
        players: players.map(j => {
            const characters = j.characters.map(c => relationsReecrites(c, id, genre));
            return characters.some((c, i) => c !== j.characters[i]) ? { ...j, characters } : j;
        }),
    };
}

/** **Les scènes de la trame** : l'identifiant passe des PNJ présents aux PJ présents, ou l'inverse. */
export function deplacerDansLesScenes(scenes: Scene[], id: string, versPersonnage: boolean): Scene[] {
    return scenes.map(s => {
        const depart = versPersonnage ? s.entiteIds : (s.personnagesIds ?? []);
        if (!depart.includes(id)) return s;
        const arrivee = versPersonnage ? (s.personnagesIds ?? []) : s.entiteIds;
        const sans = depart.filter(x => x !== id);
        const avec = arrivee.includes(id) ? arrivee : [...arrivee, id];
        return versPersonnage
            ? { ...s, entiteIds: sans, personnagesIds: avec }
            : { ...s, personnagesIds: sans, entiteIds: avec };
    });
}

// ─────────────────────────────────────────────
// Ce que la confirmation doit dire (T5)
// ─────────────────────────────────────────────

/** Ce qu'il faut savoir des paquets et des rencontres, sans dépendre de leurs magasins. */
export interface AutourDuPersonnage {
    deckStates?: Record<string, { enMain?: { index: number; porteur: string | null }[] }>;
    rencontres?: { nom: string; lignes: ({ genre: string; entiteId?: string })[] }[];
}

export interface SuitesDeLaTransformation {
    /**
     * Les cartes qu'il tient (Deck-OS). Un PNJ ne tient pas de main : devenu PNJ,
     * elles reviennent au meneur (`donnerLaCarte(…, null)`), et la confirmation le dit.
     */
    cartesTenues: { deckId: string; index: number }[];
    /**
     * Les rencontres préparées qui l'envoient comme PNJ. Devenu PJ, elles ne
     * l'enverront plus : leur invocation le dit déjà (« Un PNJ de cette
     * rencontre n'existe plus »). On ne les modifie pas ; la confirmation les nomme.
     */
    rencontres: string[];
}

/** **Les suites à annoncer, puis à faire**, pour ce personnage et ce sens. */
export function suitesDeLaTransformation(autour: AutourDuPersonnage, id: string, versPersonnage: boolean): SuitesDeLaTransformation {
    return {
        cartesTenues: versPersonnage ? [] : Object.entries(autour.deckStates ?? {}).flatMap(([deckId, etat]) =>
            (etat.enMain ?? []).filter(c => c.porteur === id).map(c => ({ deckId, index: c.index }))),
        rencontres: versPersonnage
            ? (autour.rencontres ?? []).filter(r => r.lignes.some(l => l.genre === 'entite' && l.entiteId === id)).map(r => r.nom)
            : [],
    };
}

// ─────────────────────────────────────────────
// Les deux transformations
// ─────────────────────────────────────────────

/** Ce que la transformation lit et écrit, en une fois. */
export interface EtatDesPersonnages {
    entities: Entity[];
    players: Player[];
    scenes: Scene[];
}

/** Pourquoi une transformation n'a pas eu lieu. `null` : elle a eu lieu. */
export type RefusDeTransformation =
    /** Le PNJ, ou le PJ chez ce joueur, n'existe pas. */
    | 'introuvable'
    /** Le joueur qui doit le recevoir n'existe pas. */
    | 'joueur-introuvable'
    /** Un PNJ appartient à une campagne : un PJ qui n'en a pas ne peut pas en devenir un. */
    | 'sans-campagne'
    /** L'identifiant existe déjà de l'autre côté : le transformer en ferait deux. */
    | 'deja-present';

export interface ResultatDeTransformation {
    /** Le nouvel état. **Le même objet** en cas de refus. */
    etat: EtatDesPersonnages;
    refus: RefusDeTransformation | null;
}

const tousLesPersonnages = (players: Player[]) => players.flatMap(j => j.characters ?? []);

/** **Le PNJ rejoint le roster du joueur choisi**, en fin de liste — comme un transfert. */
export function transformerEnPersonnage(
    etat: EtatDesPersonnages,
    entiteId: string,
    joueurId: string,
    options: OptionsVersPersonnage = {},
): ResultatDeTransformation {
    const entite = etat.entities.find(e => e.id === entiteId);
    if (!entite) return { etat, refus: 'introuvable' };
    if (!etat.players.some(j => j.id === joueurId)) return { etat, refus: 'joueur-introuvable' };
    if (tousLesPersonnages(etat.players).some(c => c.id === entiteId)) return { etat, refus: 'deja-present' };

    const personnage = pnjEnPersonnage(entite, options);
    const liens = reecrireLesRelations(etat.entities.filter(e => e.id !== entiteId), etat.players, entiteId, true);
    return {
        etat: {
            entities: liens.entities,
            players: liens.players.map(j => (j.id === joueurId ? { ...j, characters: [...(j.characters ?? []), personnage] } : j)),
            scenes: deplacerDansLesScenes(etat.scenes, entiteId, true),
        },
        refus: null,
    };
}

/** **Le PJ quitte son joueur et rejoint les PNJ de sa campagne.** */
export function transformerEnPnj(
    etat: EtatDesPersonnages,
    joueurId: string,
    personnageId: string,
    options: OptionsVersPnj,
): ResultatDeTransformation {
    const personnage = etat.players.find(j => j.id === joueurId)?.characters?.find(c => c.id === personnageId);
    if (!personnage) return { etat, refus: 'introuvable' };
    if (!personnage.campaignId) return { etat, refus: 'sans-campagne' };
    if (etat.entities.some(e => e.id === personnageId)) return { etat, refus: 'deja-present' };

    const entite = personnageEnPnj(personnage, options);
    const sansLui = etat.players.map(j => (j.id === joueurId ? { ...j, characters: j.characters.filter(c => c.id !== personnageId) } : j));
    const liens = reecrireLesRelations(etat.entities, sansLui, personnageId, false);
    return {
        etat: {
            entities: [...liens.entities, entite],
            players: liens.players,
            scenes: deplacerDansLesScenes(etat.scenes, personnageId, false),
        },
        refus: null,
    };
}
