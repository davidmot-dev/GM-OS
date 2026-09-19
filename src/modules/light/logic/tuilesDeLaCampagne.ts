import {
    classerParCampagne,
    visiblesDansLaCampagne,
    type Rattachable,
    type ClasseesParCampagne,
} from '../../../logic/rattachementALaCampagne';
import { tuilePorteUnEtat } from './tuilePorteUnEtat';

/**
 * **Ce que Light-OS montre de la campagne ouverte.**
 *
 * La règle de rattachement — *étiquette, pas cloison ; ce qui n'a pas
 * d'étiquette est commun* — vit dans `src/logic/rattachementALaCampagne.ts`,
 * écrite pour Music-OS le 2026-08-30 et remontée le 2026-09-19 quand les tuiles
 * en ont eu besoin à l'identique. **On ne la recopie pas.**
 *
 * Ce fichier ne porte que ce qui est propre au râtelier lumineux, et c'est
 * précisément là qu'un filtre recopié se serait trompé.
 */

/** Une tuile, vue par le classement. */
export type TuileAttribuable = Rattachable & { lightStates?: Record<string, unknown> | null };

export type TuilesClassees<T> = ClasseesParCampagne<T>;

/** Range les tuiles selon leur propriétaire, vu depuis une campagne donnée. */
export const classerLesTuiles = classerParCampagne;

/**
 * **Les tuiles que la grille doit montrer** : celles de la campagne ouverte,
 * les communes, et les orphelines.
 *
 * ⭐ **Cette fonction gardait une exception, et elle a disparu le 2026-09-19
 * avec ce qui la rendait nécessaire.** Tant que les dix-huit cases étaient
 * *partagées*, une case vide devait rester visible même rattachée ailleurs :
 * c'est le seul endroit où l'on capture, et la masquer retirait au meneur une
 * case sans rien lui dire.
 *
 * Depuis que **chaque campagne a son propre râtelier**, l'exception se
 * retourne : une case vide rattachée ailleurs est la case libre *de l'autre
 * campagne*, et la montrer encombrerait la grille de dix-sept cases qui ne
 * sont pas les nôtres. *Une exception qui protégeait d'un manque devient un
 * défaut quand le manque est comblé.*
 *
 * @param campagneId la campagne ouverte, ou `null` — auquel cas rien n'est
 *                   masqué : masquer sur un critère absent cacherait tout
 *                   derrière un écran vide.
 */
export function tuilesVisibles<T extends TuileAttribuable>(
    tuiles: readonly T[],
    campagneId: string | null,
    campagnesConnues?: Iterable<string>,
): T[] {
    return visiblesDansLaCampagne(tuiles, campagneId, campagnesConnues);
}

/**
 * **Les tuiles qu'on peut proposer comme éclairage normal de la pièce.**
 *
 * Deux restrictions, et une exception qui compte :
 *
 * - seules les tuiles **capturées** — une tuile vide ne porte l'état d'aucune
 *   lampe, la choisir pour repli donnerait un réglage qui ne fait rien ;
 * - seules les tuiles **visibles** — sinon la liste offrirait l'ambiance d'une
 *   campagne qu'on ne joue pas ;
 * - ⚠️ **mais la désignation en cours reste toujours offerte**, même si elle
 *   appartient à une autre campagne. `defaultSceneId` est global et **il agit**
 *   : le Stop All et les retours automatiques y mènent. Le masquer donnerait un
 *   réglage qui commande les lampes sans apparaître nulle part, et que le
 *   meneur ne pourrait donc **pas changer**. *Un réglage qui agit doit rester
 *   visible ; c'est ce qui le distingue d'une panne.*
 */
export function tuilesOffertesAuRepli<T extends TuileAttribuable>(
    tuiles: readonly T[],
    campagneId: string | null,
    defaultSceneId: string | null | undefined,
    campagnesConnues?: Iterable<string>,
): T[] {
    const visibles = new Set(
        visiblesDansLaCampagne(tuiles, campagneId, campagnesConnues).map(t => t.id),
    );

    return tuiles.filter(
        t => tuilePorteUnEtat(t) && (visibles.has(t.id) || t.id === defaultSceneId),
    );
}

/**
 * **La tuile qu'une touche doit lancer, cherchée dans les seules tuiles
 * visibles.**
 *
 * ⛔ Sans ce filtre, le clavier resterait le seul chemin non cloisonné — et
 * c'est le pire des trois écrans où l'erreur peut arriver : deux campagnes
 * attribuent naturellement la même touche à leur ambiance d'ouverture, la
 * première trouvée gagne, et **la pièce change de couleur devant les joueurs**.
 * Music-OS a payé exactement ce défaut le 2026-08-30.
 *
 * L'ordre compte : les tuiles de la campagne passent avant les communes, pour
 * qu'une campagne puisse redéfinir une touche générique.
 *
 * Une tuile **vide** ne répond jamais : elle n'a l'état d'aucune lampe, la
 * lancer ne ferait rien, et elle masquerait une tuile plus loin qui, elle,
 * éclaire.
 */
export function tuileDuRaccourci<T extends TuileAttribuable & { keyCode?: string }>(
    tuiles: readonly T[],
    campagneId: string | null,
    touche: string,
    campagnesConnues?: Iterable<string>,
): T | null {
    const candidates = visiblesDansLaCampagne(tuiles, campagneId, campagnesConnues);
    return candidates.find(t => t.keyCode === touche && tuilePorteUnEtat(t)) ?? null;
}
