import {
    classerParCampagne,
    visiblesDansLaCampagne,
    selectionApresChangement,
    type Rattachable,
    type ClasseesParCampagne,
} from '../../../logic/rattachementALaCampagne';

/**
 * **Ce que Sound-OS montre de la campagne ouverte.**
 *
 * La règle de rattachement — *étiquette, pas cloison ; ce qui n'a pas
 * d'étiquette est commun* — vit dans `src/logic/rattachementALaCampagne.ts`,
 * écrite pour Music-OS le 2026-08-30, remontée le 2026-09-19 pour les tuiles de
 * Light-OS, et reprise ici le soir même. **Troisième module, toujours pas de
 * copie.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ CE QUI REND SOUND-OS PLUS SIMPLE QUE SES DEUX VOISINS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Son clavier ne parcourt **pas** toutes les atmosphères : `KeyboardEngine` ne
 * regarde que celle qui est **active**. Le défaut que Music-OS a payé le 30/08
 * — *« le clavier était le dernier chemin non cloisonné »* — ne peut donc pas
 * se produire ici, et il n'y a pas de `padDuRaccourci` à écrire.
 *
 * ⛔ **Sauf par un repli.** `KeyboardEngine` retombe sur `atmospheres[0]` quand
 * l'identifiant actif ne désigne plus rien — et la première de la liste brute
 * peut appartenir à une autre campagne. *Un repli qui ignore le cloisonnement
 * le perce aussi sûrement qu'une boucle.* D'où {@link atmosphereDuClavier}.
 */

/** Une atmosphère, vue par le classement. */
export type AtmosphereAttribuable = Rattachable;

export type AtmospheresClassees<T> = ClasseesParCampagne<T>;

/** Range les atmosphères selon leur propriétaire, vu depuis une campagne donnée. */
export const classerLesAtmospheres = classerParCampagne;

/** Celles que les onglets doivent montrer — campagne, communes, orphelines. */
export const atmospheresVisibles = visiblesDansLaCampagne;

/**
 * **L'atmosphère à sélectionner après un changement de campagne.**
 *
 * On garde celle en cours si elle reste visible — changer de campagne ne doit
 * pas déplacer la sélection sans raison. Sinon la première visible : **une
 * sélection pointant sur une atmosphère masquée laisserait seize pads à
 * l'écran sans qu'aucun onglet ne soit allumé**, ou pire, ceux d'une autre
 * campagne.
 */
export const atmosphereApresChangement = selectionApresChangement;

/**
 * **Celle dont le clavier doit jouer les pads.**
 *
 * ⛔ Le repli de `KeyboardEngine` était `atmospheres[0]` — *la première de la
 * liste brute*, qui peut appartenir à une campagne qu'on ne joue pas. Une
 * touche aurait alors lanc  é un bruitage d'ailleurs, **devant les joueurs**, et
 * l'écran n'aurait rien montré d'anormal puisque les onglets, eux, sont
 * filtrés.
 *
 * @returns l'atmosphère active si elle est visible, sinon la première visible,
 *          sinon `null` — *et le clavier ne joue alors rien, ce qui est juste.*
 */
export function atmosphereDuClavier<T extends AtmosphereAttribuable>(
    atmospheres: readonly T[],
    campagneId: string | null,
    activeId: string | null,
    campagnesConnues?: Iterable<string>,
): T | null {
    const visibles = visiblesDansLaCampagne(atmospheres, campagneId, campagnesConnues);
    return visibles.find(a => a.id === activeId) ?? visibles[0] ?? null;
}
