/**
 * **Brancher un moteur audio sur le ducking de la voix, sans jamais le perdre en silence.**
 *
 * Écrit le 2026-09-05, après un défaut resté invisible on ne sait combien de temps.
 *
 * ⛔ **Ce qui se passait.** Music-OS et Ambient-OS se construisent au chargement
 * de leur module et s'abonnent aussitôt à `useVoiceStore`, par un `import()`
 * différé — précisément pour éviter un cycle. Mais quand `useVoiceStore` était
 * lui-même le point d'entrée du graphe, ce `import()` rendait un module **encore
 * en cours d'évaluation** : le lien était vide, la souscription levait une
 * exception dans une promesse que personne n'attend, et **la musique cessait de
 * baisser quand le meneur parle.** Rien à l'écran, rien dans la console de
 * l'application.
 *
 * L'arête fautive a été coupée dans `useVoiceStore`. Ce fichier tient la
 * seconde moitié : *une cause corrigée revient par un autre chemin ; une
 * défaillance qui se dit, non.*
 *
 * Deux remèdes, dans cet ordre :
 *
 * 1. **On garde l'espace de noms** au lieu d'en extraire la valeur tout de
 *    suite. Le lien d'un module ESM est **vivant** : vide pendant l'évaluation,
 *    rempli dès qu'elle s'achève. Le relire un tour plus tard suffit alors.
 * 2. **Si le second essai échoue aussi, on le crie.** Un moteur muet sur le
 *    ducking est un défaut qu'on ne remarque qu'en pleine partie, quand la
 *    musique couvre la voix.
 */

/** Ce que les deux moteurs lisent de la voix, et rien de plus. */
export interface EtatDuDuckingDeLaVoix {
    isDucking: boolean;
    currentEffects: {
        duckingRange: number;
        duckingAttack: number;
    };
}

/** Le peu qu'on attend du magasin : de quoi suivre les changements. */
interface MagasinDeVoix {
    subscribe: (rappel: (etat: EtatDuDuckingDeLaVoix) => void) => () => void;
}

/** Le module tel qu'il se présente — le lien peut être encore vide. */
type ModuleDeVoix = { useVoiceStore?: MagasinDeVoix };

/**
 * Lit le lien sans se laisser arrêter par lui.
 *
 * Selon la façon dont le module est transformé, un lien pas encore initialisé
 * vaut `undefined`… ou **lève** une `ReferenceError` (zone morte temporelle).
 * *Les deux disent la même chose : pas encore.*
 */
function magasinDe(module: ModuleDeVoix): MagasinDeVoix | undefined {
    try {
        return module.useVoiceStore;
    } catch {
        return undefined;
    }
}

/** Laisse le tour de boucle courant s'achever, pour que le module finisse. */
const unTourPlusTard = () => new Promise<void>((resoudre) => setTimeout(resoudre, 0));

/**
 * Abonne `reagir` au ducking de la voix.
 *
 * Rend la fonction de désabonnement, ou `null` si le magasin est resté
 * introuvable — auquel cas l'échec a été crié dans la console, au nom du moteur
 * appelant.
 *
 * `charger` n'existe que pour les tests : *un chemin de secours qu'on ne peut
 * pas exercer ne se distingue pas d'un chemin mort.*
 */
export async function brancherLeDucking(
    moteur: string,
    reagir: (etat: EtatDuDuckingDeLaVoix) => void,
    charger: () => Promise<ModuleDeVoix> = () => import('./useVoiceStore') as Promise<ModuleDeVoix>,
): Promise<(() => void) | null> {
    const module = await charger();

    let magasin = magasinDe(module);
    if (!magasin) {
        await unTourPlusTard();
        magasin = magasinDe(module);
    }

    if (!magasin) {
        console.error(
            `[${moteur}] Le magasin de la voix est resté introuvable : le ducking ne fonctionnera `
            + `pas — la musique ne baissera pas quand le meneur parle. `
            + `Cause probable : un cycle d'imports rouvert vers useVoiceStore.`,
        );
        return null;
    }

    /*
      ⚠️ **On ne rejoue PAS l'état courant au branchement, et c'est délibéré.**

      L'idée est tentante — un moteur né pendant que le meneur parle resterait à
      plein volume jusqu'à la phrase suivante, cent cinquante millisecondes plus
      tard. Mais l'essayer a fait tomber six fichiers de tests : plusieurs
      remplacent le magasin de la voix par un substitut partiel, dont l'état n'a
      pas d'`currentEffects`, et Music-OS le lit sans garde.

      *Un ajout qui n'était pas le correctif ne vaut pas le risque qu'il
      introduit.* On s'abonne, et rien de plus.
    */
    return magasin.subscribe(reagir);
}
