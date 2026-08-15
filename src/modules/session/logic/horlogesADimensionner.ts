import { horlogeDeDefaite } from '../../combat/logic/TacheDeDefaite';
import { HealthInterpreter } from './HealthInterpreter';
import { piloteDuPersonnage, type CampagneDeJeu } from './piloteDuPersonnage';
import type { GameDriver } from '../../../types/drivers';
import type { Player } from '../store/types';

/**
 * Les horloges de défaite figées à six, redimensionnées sur la fiche.
 *
 * **Le défaut, trouvé le 2026-08-15 par une question de David** : *« es-tu
 * certain que pour Dune la santé se gère par une horloge de 6 sections ? »*
 *
 * Non. `docs/systems/dune/rules/sante-et-blessures.md` écrit : « Dès que le
 * seuil (**la compétence défensive de quatre à huit**) est atteint, la cible est
 * vaincue et retirée. » Le nombre de segments **dépend du personnage** ; six est
 * le chiffre de `HealthInterpreter.createDefault('clocks')`, qui ne sait rien de
 * la fiche.
 *
 * La cause est corrigée à la source — `AddCharacterForm` consulte désormais la
 * tâche de défaite. Ceci répare **les personnages déjà créés**, parce qu'*un
 * correctif qui laisse les données abîmées ne corrige que la moitié du
 * problème*. Même geste que `reparerLiensDeGabarit`, et même prudence.
 *
 * **On ne redimensionne que ce dont on est certain.** Quatre conditions, toutes
 * requises :
 *
 * 1. la santé du personnage est bien une horloge ;
 * 2. son pilote déclare une tâche de défaite — sinon rien ne dit d'où sortirait
 *    un autre nombre ;
 * 3. **le seuil se lit sans le moindre avertissement**. `seuilDeDefaite` retombe
 *    sur son minimum quand le champ manque, et retenir ce minimum reviendrait à
 *    inscrire une valeur devinée à la place d'une valeur fausse — on n'aurait
 *    rien gagné, sinon de la rendre crédible ;
 * 4. le compte diffère vraiment de celui qui est écrit.
 *
 * **Ce qui a été encaissé n'est pas effacé.** `filled` est conservé, ramené dans
 * la nouvelle échelle, et l'état est **recalculé par `HealthInterpreter`** — pas
 * réécrit ici. Deux segments sur six et deux sur quatre ne décrivent pas le même
 * personnage, et c'est l'interpréteur qui fait autorité sur ce seuil-là.
 */

export interface HorlogeRedimensionnee {
    personnage: string;
    ancienCompte: number;
    nouveauCompte: number;
}

export function redimensionnerLesHorloges(
    players: readonly Player[],
    campagnes: readonly CampagneDeJeu[],
    pilotesPersonnalises: readonly GameDriver[],
): { players: Player[]; redimensionnees: HorlogeRedimensionnee[] } {
    const redimensionnees: HorlogeRedimensionnee[] = [];

    const corriges = players.map(joueur => {
        let touche = false;

        const personnages = (joueur.characters ?? []).map(perso => {
            const sante = perso.healthSystem;
            if (!sante || sante.type !== 'clocks') return perso;

            const tache = piloteDuPersonnage(perso, campagnes, pilotesPersonnalises)?.combat?.tacheDeDefaite;
            if (!tache) return perso;

            const { sante: neuve, seuil } = horlogeDeDefaite(tache, perso.sheetData ?? {});
            // Un seuil qui a dû se rabattre sur son minimum n'est pas une mesure :
            // on laisse en place, et le contrôle du pilote le signale à la revue.
            if (seuil.avertissements.length > 0) return perso;

            const ancien = Number(sante.data.segments ?? 0);
            const nouveau = Number(neuve.data.segments ?? 0);
            if (!Number.isFinite(nouveau) || nouveau < 1 || nouveau === ancien) return perso;

            const rempli = Math.max(0, Math.min(nouveau, Number(sante.data.filled ?? 0)));
            // Un impact nul : la seule façon de faire recalculer l'état par celui
            // qui en a la charge, plutôt que de recopier ses seuils ici.
            const recalculee = HealthInterpreter.calculateNextState(
                { ...sante, data: { ...sante.data, segments: nouveau, filled: rempli } },
                { value: 0 },
            );

            redimensionnees.push({ personnage: perso.name, ancienCompte: ancien, nouveauCompte: nouveau });
            touche = true;
            return { ...perso, healthSystem: recalculee };
        });

        return touche ? { ...joueur, characters: personnages } : joueur;
    });

    // Rendre les tableaux d'origine quand rien n'a bougé : un `set` inutile
    // relancerait un rendu à chaque hydratation.
    return redimensionnees.length > 0
        ? { players: corriges, redimensionnees }
        : { players: players as Player[], redimensionnees };
}
