import type { Acte, Scene } from '../../types/trame.types';
import { actesOrdonnes } from '../session/logic/trame';
import { natureParDefaut, type JournalEvent } from './types';

/**
 * **La curation : étape 1 des deux du § 4.1, décidée par David le 2026-08-08.**
 *
 * *« Ne pas résumer directement tous les éléments. »* Le journal mélange deux
 * natures, et `summarizeSession` envoyait tout — « Combat : Initiative, tirée
 * pour 6 combattants » compris — à un modèle chargé d'écrire une chronique.
 * Trois dégâts : l'invite gonfle, le signal narratif se dilue, et le résumé
 * risque de raconter des jets de dés.
 *
 * **Scène par scène, et non événement par événement.** *« Une dizaine de scènes
 * se revoit en quelques minutes là où deux cents événements ne se revoient
 * jamais. »* C'est tout le pari de l'étape, et il tient à ce que le regroupement
 * soit déjà fait quand le meneur arrive — d'où le rattachement automatique posé
 * au goulot le 2026-08-20.
 *
 * **Les deux étapes n'ont pas le même mode de défaillance** — c'est l'argument
 * de fond, celui qui va au-delà de la taille de l'invite. Un résumé raté se
 * relance, c'est bon marché. Une curation ratée fausse tout ce qui en découle.
 * Donc la curation mérite l'attention du meneur, et le résumé l'automatisation.
 *
 * **Et sa sortie vaut par elle-même** : une trame curée est la matière de la
 * chronique, du wiki et du carnet. Le résumé n'en est qu'un dérivé. D'où une
 * curation qui écrit dans la trame et dans les événements — des objets déjà
 * persistés — plutôt que dans un artefact intermédiaire jetable.
 */

/** Un événement tel que la curation le regarde. */
export type EvenementCure = JournalEvent;

/** Une scène de la revue, avec ce qui s'y est passé. */
export interface SceneAReviser {
    scene: Scene;
    acte: Acte | undefined;
    /** Ce qui raconte — ce qui partira au résumé si la scène est retenue. */
    recit: EvenementCure[];
    /** Ce qui est mécanique — gardé, jamais envoyé. */
    traces: EvenementCure[];
}

/** Le plan de travail de la revue. */
export interface RevueDeSeance {
    scenes: SceneAReviser[];
    /**
     * Ce que personne n'a su ranger.
     *
     * **Ce n'est pas une anomalie, c'est le cas prévu.** Quand deux scènes sont
     * ouvertes en même temps — le groupe s'est séparé — le rattachement
     * automatique s'abstient plutôt que de deviner. La revue est le moment, et
     * le seul, où le meneur peut trancher sans pression de temps.
     */
    sansScene: EvenementCure[];
    /** Vrai quand il n'y a rigoureusement rien à revoir. */
    vide: boolean;
}

/** La nature d'un événement : celle qu'il déclare, ou celle de son type. */
export const natureDe = (e: EvenementCure) => e.nature ?? natureParDefaut(e.type);

/**
 * Une scène mise de côté ne part pas au résumé.
 *
 * *« Jeter celles qui n'étaient rien »* — mais jeter au sens de la chronique, et
 * jamais au sens des données : la scène reste dans la trame, ses événements
 * restent dans le journal. **On n'efface rien**, c'est la règle déjà tenue par
 * l'acte achevé et la scène terminée, qui restent lisibles.
 */
export const sceneEcartee = (scene: Scene) => scene.ecarteeDeLaChronique === true;

/**
 * Le plan de travail : les scènes traversées par cette séance, dans l'ordre de
 * la trame, chacune avec ses événements.
 *
 * **L'ordre est celui de la trame, pas celui du fil.** Le journal empile du plus
 * récent au plus ancien ; une revue qui suivrait cet ordre demanderait de relire
 * la séance à l'envers. À l'intérieur d'une scène, en revanche, les événements
 * reprennent l'ordre des faits — c'est ainsi qu'on relit ce qui s'est passé.
 *
 * **Une scène sans le moindre événement n'entre pas dans la revue.** Elle a été
 * ouverte puis quittée sans que rien ne s'y écrive : la donner à revoir ferait
 * une ligne vide de plus à chaque séance, et *une dizaine de scènes se revoit en
 * quelques minutes* ne tient que si les dix ont quelque chose à dire.
 */
export function preparerLaRevue(
    evenements: readonly EvenementCure[],
    scenes: readonly Scene[],
    actes: readonly Acte[],
    campaignId: string | null | undefined,
): RevueDeSeance {
    const parScene = new Map<string, EvenementCure[]>();
    const sansScene: EvenementCure[] = [];

    // Du plus ancien au plus récent : à l'intérieur d'une scène, on relit dans
    // l'ordre des faits.
    const chronologiques = [...evenements].sort((a, b) => a.timestamp - b.timestamp);
    for (const e of chronologiques) {
        if (!e.sceneId) { sansScene.push(e); continue; }
        const deja = parScene.get(e.sceneId);
        if (deja) deja.push(e); else parScene.set(e.sceneId, [e]);
    }

    const rangDeLActe = new Map(actesOrdonnes(actes, campaignId).map((a, i) => [a.id, i]));
    const parId = new Map(scenes.map(s => [s.id, s]));

    const traversees = [...parScene.keys()]
        .map(id => parId.get(id))
        .filter((s): s is Scene => !!s)
        .sort((a, b) =>
            (rangDeLActe.get(a.acteId) ?? 0) - (rangDeLActe.get(b.acteId) ?? 0) || a.ordre - b.ordre);

    const revues: SceneAReviser[] = traversees.map(scene => {
        const tous = parScene.get(scene.id) ?? [];
        return {
            scene,
            acte: actes.find(a => a.id === scene.acteId),
            recit: tous.filter(e => natureDe(e) === 'chronique'),
            traces: tous.filter(e => natureDe(e) !== 'chronique'),
        };
    });

    /*
      **Les événements d'une scène disparue restent visibles.** Supprimer une
      scène après coup laisserait ses événements rattachés à un identifiant qui
      ne désigne plus rien ; les compter comme orphelins les rend au meneur au
      lieu de les faire disparaître du plan de travail sans un mot.
    */
    for (const [id, orphelins] of parScene) {
        if (!parId.has(id)) sansScene.push(...orphelins);
    }
    sansScene.sort((a, b) => a.timestamp - b.timestamp);

    return { scenes: revues, sansScene, vide: revues.length === 0 && sansScene.length === 0 };
}

/**
 * Ce qui partira au résumé — **l'ensemble curé**, entrée de l'étape 2.
 *
 * Trois filtres, dans cet ordre : les scènes mises de côté sortent, les traces
 * sortent, et ce qui reste est rendu **groupé par scène et dans l'ordre de la
 * trame**. Le troisième compte autant que les deux autres : un modèle qui reçoit
 * une chronologie plate doit deviner la structure, et il la devine mal — c'est
 * ce qui avait fait titrer une séance d'Alien « Chroniques des Terres Oubliées ».
 *
 * Les événements sans scène **sont du voyage** quand ils racontent : ils ont eu
 * lieu, et les écarter faute d'avoir été rangés perdrait de la séance pour une
 * raison purement technique.
 */
export function lEnsembleCure(revue: RevueDeSeance): {
    parScene: { scene: Scene; recit: EvenementCure[] }[];
    horsScene: EvenementCure[];
} {
    return {
        parScene: revue.scenes
            .filter(s => !sceneEcartee(s.scene) && s.recit.length > 0)
            .map(s => ({ scene: s.scene, recit: s.recit })),
        horsScene: revue.sansScene.filter(e => natureDe(e) === 'chronique'),
    };
}

/** Où en est la revue — ce que l'écran affiche en tête. */
export function ceQuiResteAReviser(revue: RevueDeSeance): {
    scenes: number;
    ecartees: number;
    aRanger: number;
    recit: number;
} {
    return {
        scenes: revue.scenes.length,
        ecartees: revue.scenes.filter(s => sceneEcartee(s.scene)).length,
        aRanger: revue.sansScene.length,
        recit: revue.scenes.filter(s => !sceneEcartee(s.scene))
            .reduce((n, s) => n + s.recit.length, 0)
            + revue.sansScene.filter(e => natureDe(e) === 'chronique').length,
    };
}

/**
 * Le récit à résumer, à plat mais **dans l'ordre de la trame**.
 *
 * L'étape 2 du § 4.1 — *« résumer l'ensemble curé »* — et le point où la
 * curation cesse d'être une intention pour devenir un effet. Trois choses le
 * distinguent de ce qui partait avant :
 *
 * - **les scènes mises de côté n'y sont pas**, ce qui est toute la promesse
 *   faite au meneur par l'écran de revue ;
 * - **l'ordre est celui de l'histoire**, scène après scène, et non celui du fil,
 *   qui empile du plus récent au plus ancien. Un modèle qui reçoit une
 *   chronologie plate doit deviner la structure, et il la devine mal — c'est ce
 *   qui a fait titrer une séance d'Alien « Chroniques des Terres Oubliées » ;
 * - **les orphelins ferment la marche** plutôt que de disparaître : ils ont eu
 *   lieu, et les écarter faute d'avoir été rangés perdrait de la séance pour une
 *   raison purement technique.
 */
export function leRecitAResumer(revue: RevueDeSeance): EvenementCure[] {
    const cure = lEnsembleCure(revue);
    return [...cure.parScene.flatMap(s => s.recit), ...cure.horsScene];
}
