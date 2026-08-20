import { estTombe } from './RecitDuCombat';
import type { Combatant } from '../types';

/**
 * **Un décès s'écrit au journal quand il arrive, pour tout le monde.**
 *
 * Étape 2 de l'ordre de travail du 2026-08-08, marquée *correction* et non
 * fonctionnalité, parce que ce qui existait était faux deux fois :
 *
 * - **Il ne valait que pour les PNJ.** `propagateStatusToSession` était gardé
 *   par `!c.isPlayer` : la mort d'un personnage joueur — le seul événement
 *   qu'une table raconte encore des années après — ne laissait aucune trace.
 * - **Il n'arrivait qu'au bouton d'export.** L'émission vivait dans une action
 *   que seul `CombatControls` appelle, à la fin. Un décès survenu au round 3 se
 *   datait de la fin du combat, et n'existait pas du tout si le meneur ne
 *   cliquait jamais.
 *
 * **Et il avait sa propre idée de ce qu'est un mort** : `c.statuses.some(...)`,
 * recopié sur place, c'est-à-dire l'étiquette posée à la main et rien d'autre —
 * exactement le défaut corrigé dans `estTombe` le 2026-08-19, réapparu ici.
 * *Le module de santé avait acquis un onzième lecteur dissident.* Celui-ci
 * appelle `estTombe`, comme le récit, la carte et les cartes de combat.
 */

/** Ce qu'il faut d'un combattant pour dire s'il vient de tomber. */
export type ChuteObservable = Pick<
    Combatant,
    | 'id' | 'name' | 'isPlayer' | 'statuses' | 'hp' | 'hpMax'
    | 'healthSystem' | 'sourceEntityId' | 'sourcePlayerId'
>;

/**
 * Ceux qui viennent de tomber, entre deux états du plateau.
 *
 * **Une chute est une transition, pas un état** — et c'est tout l'objet de
 * cette fonction. Émettre sur l'état seul écrirait le même décès à chaque
 * changement du plateau : un mort reste mort, donc chaque coup porté à son
 * voisin le retuerait au journal.
 *
 * **Un combattant que l'état précédent ne connaît pas n'est jamais une chute.**
 * Il arrive déjà tombé — un PNJ ajouté à zéro, un plateau relu au démarrage, un
 * plateau garé qu'on restaure. Rien de tout cela ne s'est produit maintenant, et
 * le journal date ce qui se produit.
 */
export function chutesEntre(
    avant: ChuteObservable[],
    apres: ChuteObservable[],
): ChuteObservable[] {
    const etatAvant = new Map(avant.map(c => [c.id, estTombe(c)]));
    return apres.filter(c => etatAvant.get(c.id) === false && estTombe(c));
}

/** Comment le journal nomme et raconte un décès. */
export function raconterLeDeces(c: ChuteObservable): { title: string; content: string } {
    const quoi = c.isPlayer ? 'personnage' : 'PNJ';
    return {
        title: `Décès : ${c.name}`,
        content: `Le ${quoi} **${c.name}** est tombé au combat.`,
    };
}

/** Le minimum d'un magasin de combat pour y observer les chutes. */
interface MagasinObservable {
    subscribe: (
        ecouteur: (etat: { combatants: ChuteObservable[] }, precedent: { combatants: ChuteObservable[] }) => void,
    ) => () => void;
}

/**
 * Branche l'écriture des décès sur **le plateau lui-même**, et non sur les
 * actions qui le modifient.
 *
 * Cinq portes changent la santé d'un combattant — le pupitre, le panneau de
 * santé, la pose d'une étiquette, son retrait, la mise à jour directe — et
 * chacune pourrait oublier d'appeler l'émission. C'est le reproche fait aux
 * impacts le 2026-08-19, où le panneau racontait et le pupitre se taisait.
 * *Ce qui se lit une fois ne se recopie pas.*
 *
 * **Seule la fenêtre du meneur écrit.** Le Player Hub et le projecteur reçoivent
 * le même plateau par la synchronisation : sans ce garde, un décès s'écrirait
 * autant de fois qu'il y a d'écrans ouverts.
 */
export function observerLesChutes(
    magasin: MagasinObservable,
    ecrire: (chute: ChuteObservable) => void,
    fenetrePrincipale: () => boolean,
): () => void {
    return magasin.subscribe((etat, precedent) => {
        if (!fenetrePrincipale()) return;
        if (etat.combatants === precedent.combatants) return;
        for (const chute of chutesEntre(precedent.combatants, etat.combatants)) {
            ecrire(chute);
        }
    });
}
