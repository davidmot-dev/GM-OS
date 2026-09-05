import type { Acte, Scene } from '../../types/trame.types';
import type { WikiEntry, Clue } from '../../types/chronicle.types';
import { actesOrdonnes, scenesOrdonnees, etatDeLaScene, type EtatDeScene } from '../session/logic/trame';

/**
 * **Ce que le meneur lit sur sa tablette pendant qu'il joue.**
 *
 * Demandé par David le 2026-09-05 : *« je voudrais que les notes contiennent
 * aussi d'autres éléments comme la trame, les scènes prévues dans la session,
 * l'accès au wiki »*.
 *
 * L'onglet Notes ne portait que le résumé public et les secrets de la séance —
 * deux champs de texte libre. Tout le reste de ce qu'un meneur relit en séance
 * (où on en est de la trame, ce qui reste à jouer, qui est ce PNJ) vivait sur
 * l'écran du PC, c'est-à-dire hors de portée dès qu'on tient la tablette.
 *
 * ⭐ **La fonction est typée en retour, comme `segmentDuTableau`.** C'est le
 * remède posé le matin même après un défaut qui a duré : un littéral anonyme au
 * milieu du synchroniseur n'oblige à rien, et trois champs manquants y sont
 * passés inaperçus pendant des mois. *Ce qui est déclaré doit être exigé.*
 */

/** Une scène telle que la tablette la lit — l'état est calculé ici, pas là-bas. */
export interface RemoteScene {
    id: string;
    titre: string;
    resume: string;
    notesDuMeneur?: string;
    /**
     * Dérivé par `etatDeLaScene`, jamais recalculé sur la tablette.
     *
     * *Un état déduit à deux endroits finit par diverger* — et celui-ci se
     * déduit de `passages` et `termineeLe`, deux champs qu'il faudrait alors
     * transmettre pour rien.
     */
    etat: EtatDeScene;
    /** Vrai quand la scène a été close sans avoir jamais été jouée. */
    jamaisJouee: boolean;
}

export interface RemoteActe {
    id: string;
    titre: string;
    resume: string;
    notesDuMeneur?: string;
    acheve: boolean;
    scenes: RemoteScene[];
}

export interface RemoteFicheDeWiki {
    id: string;
    titre: string;
    categorie: WikiEntry['category'];
    contenu: string;
    tags: string[];
}

export interface RemoteIndice {
    id: string;
    titre: string;
    contenu: string;
    revele: boolean;
}

export interface RemoteLectureDuMeneur {
    /** La trame entière de la campagne, actes et scènes dans l'ordre. */
    actes: RemoteActe[];
    /** Les fiches du wiki, **sans leurs images** — voir plus bas. */
    wiki: RemoteFicheDeWiki[];
    indices: RemoteIndice[];
}

/**
 * @param campaignId La campagne active. `null` rend tout vide — *une tablette
 *                   sans campagne ouverte ne doit pas recevoir la trame de la
 *                   dernière.*
 *
 * ⚠️ **Le wiki part sans ses images.** `imageUrls` est un tableau de références
 * média qu'il faudrait résoudre en base64 pour le réseau : une campagne bien
 * illustrée pèserait des mégaoctets **à chaque synchronisation**, pour des
 * vignettes qu'on ne regarde pas en jouant. Le texte, lui, est ce qu'on relit.
 *
 * *Même arbitrage que le sous-titre des pads : on envoie ce qui sert au geste,
 * pas tout ce qui existe.*
 */
export function segmentDeLecture(
    campaignId: string | null | undefined,
    source: {
        actes?: Acte[];
        scenes?: Scene[];
        wikiEntries?: WikiEntry[];
        clues?: Clue[];
    },
): RemoteLectureDuMeneur {
    if (!campaignId) return { actes: [], wiki: [], indices: [] };

    const toutesLesScenes = source.scenes ?? [];

    const actes = actesOrdonnes(source.actes ?? [], campaignId).map((acte) => ({
        id: acte.id,
        titre: acte.titre,
        resume: acte.resume,
        notesDuMeneur: acte.notesDuMeneur,
        acheve: !!acte.acheve,
        scenes: scenesOrdonnees(toutesLesScenes, acte.id).map((scene) => ({
            id: scene.id,
            titre: scene.titre,
            resume: scene.resume,
            notesDuMeneur: scene.notesDuMeneur,
            etat: etatDeLaScene(scene),
            jamaisJouee: !!scene.termineeLe && (scene.passages ?? []).length === 0,
        })),
    }));

    const wiki = (source.wikiEntries ?? [])
        .filter((fiche) => fiche.campaignId === campaignId)
        .map((fiche) => ({
            id: fiche.id,
            titre: fiche.title,
            categorie: fiche.category,
            contenu: fiche.content,
            tags: fiche.tags ?? [],
        }));

    const indices = (source.clues ?? [])
        .filter((indice) => indice.campaignId === campaignId)
        .map((indice) => ({
            id: indice.id,
            titre: indice.title,
            contenu: indice.content,
            revele: !!indice.isRevealed,
        }));

    return { actes, wiki, indices };
}
