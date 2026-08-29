import type { GameDriver } from '../../../types/drivers';
import type { ComposanteDeJet } from '../../dice/DescripteurDeJet';

/**
 * **Requalifier un seuil en dés échelonnés — un geste du meneur, pas du modèle.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE BOUTON EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * David a dérivé son pilote Blade Runner **trois fois** le 2026-08-29, avec une
 * consigne corrigée entre chaque, et il est ressorti trois fois avec un
 * `jet.seuil` — donc une addition de valeurs qui sont des lettres. Chaque
 * tentative coûte plusieurs minutes de modèle, et la quatrième n'avait aucune
 * raison d'être différente.
 *
 * *Quand une consigne échoue trois fois, ce n'est plus la consigne qu'il faut
 * réécrire.* `desEchelonnes` est une clé que le modèle n'a jamais vue, `seuil`
 * lui est familier depuis toujours, et aucune formulation ne rend l'inconnu plus
 * attirant que le connu à coup sûr.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE N'EST PAS UNE INVENTION, C'EST UNE REQUALIFICATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le modèle a fait **la moitié difficile correctement** : il a trouvé les bonnes
 * composantes, dans les bonnes sections, avec les bons identifiants. Ce qu'il
 * s'est trompé, c'est sur ce qu'on en fait — additionner au lieu de lancer.
 *
 * Cette fonction ne crée aucune donnée : elle **déplace** les composantes du
 * seuil vers les dés échelonnés, mot pour mot. Le meneur déclare une chose qu'il
 * sait et que le modèle rate ; l'outil ne devine rien.
 */

/** Ce que la conversion a fait, pour le dire à qui l'a demandée. */
export interface Requalification {
    driver: Partial<GameDriver>;
    /** Les composantes déplacées, dans l'ordre. Vide si rien n'a bougé. */
    deplacees: string[];
    /** Vrai quand le pilote portait aussi une `cible`, retirée elle aussi. */
    cibleRetiree: boolean;
}

/**
 * Ce pilote peut-il être requalifié ?
 *
 * Il faut un `seuil` avec au moins une composante, et pas déjà des dés
 * échelonnés. *Proposer le geste sur un pilote qui n'en a pas besoin le rendrait
 * suspect partout ailleurs.*
 */
export function peutEtreRequalifie(driver: Partial<GameDriver> | undefined): boolean {
    return !!driver?.jet && !driver.jet.desEchelonnes && (driver.jet.seuil?.length ?? 0) > 0;
}

/**
 * Déplace les composantes du seuil vers `jet.desEchelonnes`.
 *
 * `seuil` et `cible` partent : les trois répondent à la même question, et un
 * pilote qui en garde deux porte un calcul mort à côté de celui qui compte —
 * c'est ce que le contrôle du pilote réclame déjà.
 *
 * **Le pilote reçu n'est jamais modifié** : on en rend une copie. La revue
 * affiche l'objet du store, et le muter sous elle donnerait un écran qui change
 * sans qu'aucun rendu ne l'ait décidé.
 */
export function requalifierEnDesEchelonnes(driver: Partial<GameDriver>): Requalification {
    const composantes: ComposanteDeJet[] = driver.jet?.seuil ?? [];
    if (!driver.jet || composantes.length === 0) {
        return { driver, deplacees: [], cibleRetiree: false };
    }

    const { seuil: _seuil, cible: _cible, ...resteDuJet } = driver.jet;

    return {
        driver: {
            ...driver,
            /*
              **Le moteur du pupitre suit, sinon la moitié des écrans reste
              fausse.** Le panneau de fiche lit `jet.desEchelonnes` ; Dice-OS et
              la tablette, eux, ne connaissent que `dice.engine`. Requalifier
              l'un sans l'autre laisserait un jet lancé depuis le pupitre rendre
              une poignée de d6 — *des réussites plausibles, et le dé à douze
              faces du personnage nulle part.*
            */
            dice: { ...(driver.dice ?? { defaultDice: '2d10', logic: 'count-success' }), engine: 'yze-echelonne' as const },
            jet: {
                ...resteDuJet,
                desEchelonnes: {
                    // La seule échelle connue à ce jour. Le jour où il y en a une
                    // seconde, ce bouton devra demander laquelle — pas la deviner.
                    echelle: 'yze-lettres',
                    composantes: composantes.map(c => ({ ...c })),
                },
            },
        },
        deplacees: composantes.map(c => c.label || c.id),
        cibleRetiree: !!driver.jet.cible,
    };
}
