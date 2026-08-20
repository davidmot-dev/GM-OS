import type { Acte, Scene, PassageDeScene } from '../../../types/trame.types';

/**
 * La lecture de la trame : ordonner, mesurer, et dire ce qu'une suppression
 * emporte.
 *
 * **Pourquoi des fonctions pures et non des méthodes du store.** L'écran de
 * trame, la Forge de campagne et — plus tard — la capture en séance liront tous
 * cette structure. Trois lectures écrites séparément finiraient par ne plus
 * ranger les scènes dans le même ordre, et c'est le genre d'écart qu'on ne voit
 * qu'en pleine partie. Même raison que `piloteDuPersonnage`.
 */

/** Les actes d'une campagne, dans leur ordre. */
export function actesOrdonnes(actes: readonly Acte[], campaignId: string | null | undefined): Acte[] {
    if (!campaignId) return [];
    return actes.filter(a => a.campaignId === campaignId).sort((a, b) => a.ordre - b.ordre);
}

/** Les scènes d'un acte, dans leur ordre. */
export function scenesOrdonnees(scenes: readonly Scene[], acteId: string | null | undefined): Scene[] {
    if (!acteId) return [];
    return scenes.filter(s => s.acteId === acteId).sort((a, b) => a.ordre - b.ordre);
}

/** Le rang qu'occuperait un nouvel élément à la fin de la liste. */
export function prochainOrdre(elements: readonly { ordre: number }[]): number {
    return elements.length === 0 ? 0 : Math.max(...elements.map(e => e.ordre)) + 1;
}

/**
 * Échange un élément avec son voisin, dans le sens demandé.
 *
 * Rend les couples `{ id, ordre }` à écrire — **jamais la liste entière**.
 * Réécrire tous les rangs à chaque déplacement ferait diverger deux campagnes
 * qui partagent le même tableau plat, et rendrait un `git diff` de sauvegarde
 * illisible.
 *
 * Aux extrémités, rien ne bouge et rien n'est signalé : monter le premier acte
 * n'est pas une erreur, c'est un geste sans effet.
 */
export function deplacer<T extends { id: string; ordre: number }>(
    ordonnes: readonly T[],
    id: string,
    sens: 'haut' | 'bas',
): { id: string; ordre: number }[] {
    const index = ordonnes.findIndex(e => e.id === id);
    if (index === -1) return [];

    const voisin = sens === 'haut' ? index - 1 : index + 1;
    if (voisin < 0 || voisin >= ordonnes.length) return [];

    return [
        { id: ordonnes[index].id, ordre: ordonnes[voisin].ordre },
        { id: ordonnes[voisin].id, ordre: ordonnes[index].ordre },
    ];
}

/* ─────────────────────────────────────────────
   OÙ EN EST-ON — l'état de jeu d'une scène
   ───────────────────────────────────────────── */

/**
 * Les quatre états d'une scène, **tous dérivés** de `passages` et `termineeLe`.
 *
 * Aucun champ ne les stocke, et c'est le point : un état écrit à côté des faits
 * qui le fondent finit par les contredire. Une scène « en cours » dont le
 * dernier passage est clos serait un mensonge que rien ne rattraperait.
 *
 * *En pause* est la nuance qui a coûté le plus de discussion : une séance qui se
 * termine ne termine pas ses scènes, elle les suspend — elles reprendront à la
 * séance suivante de la même campagne.
 */
export type EtatDeScene = 'prevue' | 'en-cours' | 'en-pause' | 'terminee';

/** Le passage ouvert, s'il y en a un. Il n'y en a jamais deux. */
export function passageEnCours(scene: Scene): PassageDeScene | undefined {
    const passages = scene.passages ?? [];
    const dernier = passages[passages.length - 1];
    return dernier && dernier.fin === undefined ? dernier : undefined;
}

export function etatDeLaScene(scene: Scene): EtatDeScene {
    // Terminée l'emporte : une scène close reste close, quels que soient ses
    // passages. C'est une décision du meneur, pas un calcul sur l'horloge.
    if (scene.termineeLe) return 'terminee';
    if ((scene.passages ?? []).length === 0) return 'prevue';
    return passageEnCours(scene) ? 'en-cours' : 'en-pause';
}

/**
 * Close sans avoir jamais été jouée.
 *
 * L'acte s'est achevé et a emporté ses scènes, dont celles où le groupe n'est
 * jamais passé. Elles sont barrées comme les autres — mais *les confondre
 * ferait croire à une partie qui n'a pas eu lieu*, et le journal les lirait
 * comme du vécu. D'où le gris en plus du barré.
 */
export function closeSansAvoirEteJouee(scene: Scene): boolean {
    return !!scene.termineeLe && (scene.passages ?? []).length === 0;
}

/** Les scènes d'une campagne dans un état donné, dans l'ordre des actes puis des scènes. */
export function scenesDansLEtat(
    scenes: readonly Scene[],
    actes: readonly Acte[],
    campaignId: string | null | undefined,
    etat: EtatDeScene,
): Scene[] {
    if (!campaignId) return [];
    const rangDeLActe = new Map(actesOrdonnes(actes, campaignId).map((a, i) => [a.id, i]));
    return scenes
        .filter(s => s.campaignId === campaignId && etatDeLaScene(s) === etat)
        .sort((a, b) =>
            (rangDeLActe.get(a.acteId) ?? 0) - (rangDeLActe.get(b.acteId) ?? 0) || a.ordre - b.ordre);
}

/* ─────────────────────────────────────────────
   LES TRANSFORMATIONS — pures, une scène à la fois
   ───────────────────────────────────────────── */

/**
 * Ouvre un passage. **Rouvrir une scène terminée la ranime**, délibérément :
 * cliquer « commencer » sur une scène barrée est un geste explicite, et refuser
 * en silence serait pire que d'obéir. Une scène déjà ouverte ne bouge pas — un
 * second passage ouvert n'aurait aucun sens.
 */
export function ouvrirLaScene(scene: Scene, quand: number, seanceId?: string): Scene {
    if (passageEnCours(scene)) return scene;
    return {
        ...scene,
        termineeLe: undefined,
        passages: [...(scene.passages ?? []), { debut: quand, ...(seanceId ? { seanceId } : {}) }],
    };
}

/**
 * Ferme le passage ouvert sans terminer la scène — la mise en pause.
 *
 * Sans passage ouvert, rien ne bouge : mettre en pause une scène qui ne tourne
 * pas n'est pas une erreur, c'est un geste sans effet.
 */
export function suspendreLaScene(scene: Scene, quand: number): Scene {
    if (!passageEnCours(scene)) return scene;
    const passages = [...(scene.passages ?? [])];
    passages[passages.length - 1] = { ...passages[passages.length - 1], fin: quand };
    return { ...scene, passages };
}

/** Ferme le passage ouvert **et** déclare la scène close. */
export function terminerLaScene(scene: Scene, quand: number): Scene {
    if (scene.termineeLe) return scene;
    return { ...suspendreLaScene(scene, quand), termineeLe: quand };
}

/**
 * Un titre qui n'est pris par personne, sans empiler les suffixes.
 *
 * **Pourquoi on ne laisse pas deux scènes homonymes.** La Forge de campagne
 * résout ses renvois **par nom**, et sa règle est qu'*un ex æquo ne résout
 * rien* : deux scènes du même nom feraient échouer en silence tout renvoi qui
 * les vise, à la prochaine reforge.
 *
 * Deux appelants s'en servent, et pour le même risque — le clone d'une scène, et
 * la scène improvisée dont le titre peut retomber sur un existant (« Combat
 * improvisé », deux soirs de suite).
 */
export function titreDisponible(titre: string, dejaPris: readonly string[]): string {
    const base = titre.replace(/\s\(\d+\)$/, '');
    let n = 2;
    while (dejaPris.includes(`${base} (${n})`)) n++;
    return `${base} (${n})`;
}

/**
 * Une copie du contenu, avec un état de jeu **vierge**.
 *
 * *Cloner n'est pas rouvrir.* On rouvre quand c'est la même scène qu'on
 * reprend ; on clone quand le second passage doit compter comme une scène
 * distincte — et le journal les distinguera.
 */
export function clonerLaScene(scene: Scene, id: string, titre: string, ordre: number, quand: number): Scene {
    return {
        ...scene,
        id,
        titre,
        ordre,
        creeeLe: quand,
        passages: undefined,
        termineeLe: undefined,
    };
}

/* ─────────────────────────────────────────────
   LE PASSAGE D'UNE SÉANCE À L'AUTRE
   ───────────────────────────────────────────── */

/**
 * Toutes les scènes en cours d'une campagne passent en pause.
 *
 * Appelé quand une séance cesse d'être active. **On ne termine rien** : c'est la
 * règle posée par David — une séance qui s'arrête suspend, elle ne conclut pas.
 */
export function suspendreLesScenes(
    scenes: readonly Scene[], campaignId: string, quand: number,
): Scene[] {
    return scenes.map(s =>
        s.campaignId === campaignId && etatDeLaScene(s) === 'en-cours' ? suspendreLaScene(s, quand) : s);
}

/**
 * Toutes les scènes en pause d'une campagne repartent, dans la séance qui s'ouvre.
 *
 * **La conséquence assumée** : une scène laissée en pause il y a trois séances
 * se rallumera elle aussi — rien ne distingue l'oubli de la suspension
 * délibérée. Le garde-fou n'est pas ici mais à la fin de séance, où l'écran
 * listera ce qui reste ouvert et proposera de le clore d'un geste. *On préfère
 * montrer avant que deviner après.*
 */
export function reprendreLesScenes(
    scenes: readonly Scene[], campaignId: string, seanceId: string, quand: number,
): Scene[] {
    return scenes.map(s =>
        s.campaignId === campaignId && etatDeLaScene(s) === 'en-pause'
            ? ouvrirLaScene(s, quand, seanceId)
            : s);
}

/**
 * Ce qu'un acte achèverait, pour l'annoncer avant de le faire.
 *
 * Même geste que `scenesEmportees` pour la suppression : *une cascade se dit
 * avant, sinon elle se découvre après.* On sépare celles qui tournent — elles
 * s'interrompent — de celles qu'on n'a jamais jouées.
 */
export function scenesACloreAvecLActe(scenes: readonly Scene[], acteId: string): {
    enCours: Scene[]; jamaisJouees: Scene[]; total: number;
} {
    const concernees = scenes.filter(s => s.acteId === acteId && !s.termineeLe);
    return {
        enCours: concernees.filter(s => etatDeLaScene(s) === 'en-cours'),
        jamaisJouees: concernees.filter(s => (s.passages ?? []).length === 0),
        total: concernees.length,
    };
}

/**
 * Ce qu'une scène porte déjà, entre 0 et 1.
 *
 * **C'est lui qui distingue une scène préparée d'une scène improvisée**, plutôt
 * qu'un second type d'objet. Une scène née d'un combat lancé à la volée n'a
 * qu'un titre ; celle qu'on a préparée porte son résumé, son lieu, ses PNJ.
 *
 * Cinq critères de même poids — le résumé, le lieu, au moins un PNJ, au moins
 * un indice, une ambiance. **Aucun n'est obligatoire** : une scène de dialogue
 * n'a pas d'indice à porter, et l'écran doit l'annoncer comme incomplète sans
 * jamais la refuser. *L'outil suit l'état, il n'arbitre pas.*
 */
export function remplissageDeLaScene(scene: Scene): number {
    const criteres = [
        scene.resume.trim().length > 0,
        !!scene.lieuId,
        scene.entiteIds.length > 0,
        scene.indiceIds.length > 0,
        !!scene.momentDeStoryboardId,
    ];
    return criteres.filter(Boolean).length / criteres.length;
}

/**
 * Ce que la suppression d'un acte emporterait avec lui.
 *
 * **Une scène orpheline serait pire qu'une scène supprimée** : plus rattachée à
 * aucun acte, elle n'apparaîtrait sur aucun écran tout en pesant dans la base.
 * La suppression est donc en cascade — mais le nombre se demande **avant**, pour
 * que la confirmation dise ce qu'elle coûte au lieu de demander un accord à
 * l'aveugle.
 */
export function scenesEmportees(scenes: readonly Scene[], acteId: string): Scene[] {
    return scenes.filter(s => s.acteId === acteId);
}

/**
 * Les scènes prévues pour une séance, rangées selon qu'elles appartiennent ou
 * non à l'acte annoncé.
 *
 * **Pourquoi ne pas simplement écarter les autres.** *« Ne pas imposer la
 * linéarité »* — une séance déborde sur l'acte suivant, un groupe prend de
 * l'avance, une scène préparée ailleurs se joue plus tôt que prévu. Changer
 * l'acte d'une séance ne doit donc rien effacer en silence : ce qui sort du
 * cadre est **montré à part**, jamais jeté. *Ne rien refuser sans motif écrit*,
 * et ne rien supprimer sans le dire.
 *
 * `introuvables` compte les identifiants qui ne désignent plus rien — une scène
 * supprimée depuis ailleurs. Le nombre remonte à l'écran plutôt que de
 * disparaître dans un `filter` : c'est le défaut du `.filter(r => r.targetId)`
 * de la Forge de chronique, qui jette les liens non résolus sans un mot.
 */
export function repartirLesScenesPrevues(
    scenes: readonly Scene[],
    acteId: string | undefined,
    prevues: readonly string[] | undefined,
): { deLActe: Scene[]; horsActe: Scene[]; introuvables: number } {
    const ids = prevues ?? [];
    const retenues = ids
        .map(id => scenes.find(s => s.id === id))
        .filter((s): s is Scene => !!s);

    return {
        deLActe: retenues.filter(s => s.acteId === acteId).sort((a, b) => a.ordre - b.ordre),
        horsActe: retenues.filter(s => s.acteId !== acteId).sort((a, b) => a.ordre - b.ordre),
        introuvables: ids.length - retenues.length,
    };
}

/**
 * Ce que clôturer une campagne fait à sa trame.
 *
 * **Décision de David, 2026-08-20** — c'est la dernière des trois questions
 * laissées ouvertes au § 10 du plan du 2026-08-08 : *« que devient une scène
 * prévue jamais jouée ? »* Réponse : **elle devient annulée quand la campagne se
 * termine**, et pas avant. La trame est donc un **plan glissant tant que la
 * campagne vit, et un registre une fois qu'elle est close.**
 *
 * **Rien de neuf dans le modèle, et c'est le point.** Une scène annulée est une
 * scène `termineeLe` sans aucun passage — ce que `closeSansAvoirEteJouee`
 * appelle déjà « close sans avoir été jouée », et que tous les écrans rendent
 * déjà barrée *et* grisée. La doc du champ le disait mot pour mot depuis le
 * 2026-08-17 : *« l'acte s'est achevé avant qu'on n'y passe »*. Clôturer une
 * campagne, c'est le geste de `scenesACloreAvecLActe` étendu à tous ses actes.
 *
 * **Les scènes jouées sans avoir été terminées deviennent terminées**, pas
 * annulées (décision de David du même jour) : elles ont été jouées, et la
 * distinction survit toute seule dans les données — c'est le nombre de passages
 * qui la porte, jamais un second champ.
 *
 * **On ne touche pas à ce qui est déjà terminé.** Réécrire leur `termineeLe`
 * remplacerait la date où le meneur les a closes par celle de la clôture, et
 * ferait mentir la chronologie de la campagne au moment précis où on l'archive.
 */
export function laTrameALaCloture(
    scenes: readonly Scene[],
    actes: readonly Acte[],
    campaignId: string,
    quand: number,
): { scenes: Scene[]; actes: Acte[]; annulees: number; terminees: number } {
    const idsDesActes = new Set(actes.filter(a => a.campaignId === campaignId).map(a => a.id));

    let annulees = 0;
    let terminees = 0;

    const nouvelles = scenes.map(scene => {
        if (scene.campaignId !== campaignId && !idsDesActes.has(scene.acteId)) return scene;
        if (scene.termineeLe) return scene;

        if ((scene.passages ?? []).length === 0) annulees++;
        else terminees++;

        // `terminerLaScene` ferme aussi le passage en cours : une scène qu'on
        // clôt pendant qu'elle tourne ne doit pas garder un passage ouvert pour
        // toujours.
        return terminerLaScene(scene, quand);
    });

    return {
        scenes: nouvelles,
        // Les actes s'achèvent avec elle : un acte encore ouvert dans une
        // campagne close se relit mal des mois plus tard.
        actes: actes.map(a => (a.campaignId === campaignId && !a.acheve ? { ...a, acheve: true } : a)),
        annulees,
        terminees,
    };
}

/**
 * Ce que la clôture va faire, **annoncé avant qu'elle le fasse**.
 *
 * Même règle que pour l'achèvement d'un acte : *le nombre s'annonce AVANT,
 * sinon on découvre après coup ce qu'on vient de barrer.* Clôturer une campagne
 * est le geste le plus large de l'application ; il ne doit pas se prendre à
 * l'aveugle.
 */
export function ceQueLaClotureVaFaire(
    scenes: readonly Scene[],
    actes: readonly Acte[],
    campaignId: string,
): { annulees: Scene[]; terminees: Scene[]; actesOuverts: number } {
    const idsDesActes = new Set(actes.filter(a => a.campaignId === campaignId).map(a => a.id));
    const concernees = scenes.filter(s =>
        (s.campaignId === campaignId || idsDesActes.has(s.acteId)) && !s.termineeLe);

    return {
        annulees: concernees.filter(s => (s.passages ?? []).length === 0),
        terminees: concernees.filter(s => (s.passages ?? []).length > 0),
        actesOuverts: actes.filter(a => a.campaignId === campaignId && !a.acheve).length,
    };
}
