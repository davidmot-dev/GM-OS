import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import type { GameDriver } from '../../../types/drivers';

/**
 * Les pilotes proposés à l'écran — **sans doublon d'identifiant**.
 *
 * **Le défaut, trouvé le 2026-08-15 sur l'état réel de David.** Ses pilotes
 * enregistrés contiennent un `dune`, exactement l'identifiant du pilote de
 * référence livré dans le code. Sept écrans écrivaient
 * `[...DEFAULT_GAME_DRIVERS, ...customGameDrivers]` : la liste portait donc
 * **deux entrées `dune`**, et React s'en est plaint — « Encountered two
 * children with the same key ».
 *
 * L'avertissement n'était que le symptôme visible. Le fond est plus gênant :
 * `getGameDriver` résout déjà `custom ?? défaut`, donc **le pilote personnalisé
 * l'emporte** partout où le jeu est réellement lu. Les listes, elles, montraient
 * les deux — et rien ne disait lequel serait employé en séance.
 *
 * On applique donc ici **le même ordre d'autorité que la résolution** : le
 * personnalisé masque celui du code, et il n'apparaît qu'une fois. C'est la
 * règle déjà tenue par `electron/corpusSysteme.ts`, où l'écriture résout comme
 * la lecture — *une asymétrie entre les deux est indétectable par
 * construction.*
 *
 * **On ne supprime rien.** Un pilote personnalisé qui reprend l'identifiant
 * d'une référence est peut-être exactement ce que son auteur voulait : partir
 * de l'étalon et l'adapter. On le laisse gagner, sans le dire deux fois.
 */
export function tousLesPilotes(customGameDrivers: readonly GameDriver[] = []): GameDriver[] {
    const idsPersonnalises = new Set(customGameDrivers.map(d => d.id));
    return [
        ...DEFAULT_GAME_DRIVERS.filter(d => !idsPersonnalises.has(d.id)),
        ...customGameDrivers,
    ];
}
