import i18next from 'i18next';
import { useJournalStore } from './useJournalStore';
import { cleI18nDuDegre, degreOuBooleen, estUneReussite } from '../dice/degresDeReussite';
import type { RollResult } from '../dice/DiceEngine';

/**
 * Un jet de dés au journal — **le module était muet, et il l'était depuis
 * toujours.**
 *
 * **Ce qui manquait, et ce qui manquait vraiment.** Le plan du chantier des
 * degrés annonçait qu'*« une réussite particulière et une réussite de justesse
 * laissent la même trace, donc l'Oracle ne peut pas savoir qu'un jet a été
 * spectaculaire »*. C'était vrai, et la cause était plus profonde : **le jet
 * n'atteignait pas le journal du tout.** Les dés ont leur propre registre,
 * `useDiceStore`, qui garde cinquante lancers pour l'écran et rien pour
 * l'histoire — il ne survit pas à la séance et n'entre dans aucun résumé.
 *
 * **Trois modules étaient muets** — les dés, les ambiances, les lumières —
 * relevés à la revue des 36 émetteurs du 2026-08-20, alors que la musique, geste
 * identique, émettait déjà.
 */

/**
 * La nature d'un jet : **une trace, sauf quand il est remarquable.**
 *
 * *Une séance compte des centaines de jets.* Les envoyer tous à la chronique
 * noierait le résumé sous « 14 vs 11 », et c'est exactement le bruit que l'axe
 * `trace`/`chronique` existe pour écarter — au même titre que « Initiative :
 * tirée pour 6 combattants ».
 *
 * Mais les deux extrêmes de l'échelle racontent quelque chose qu'aucune autre
 * ligne ne dira : **une réussite particulière et un échec total sont des faits
 * de fiction.** C'est le premier usage concret des six degrés, et la raison pour
 * laquelle le chantier de la table les a rendus lisibles.
 *
 * **Un jeu qui ne gradue pas n'en produit jamais** : ses jets rendent
 * `reussite-normale` ou `echec-normal`, donc ils restent tous des traces. Alien
 * ne remplira pas la chronique parce que Rêves de Dragons sait compter des
 * bandes.
 */
export function natureDuJet(degre: string | undefined): 'trace' | 'chronique' {
    return degre === 'reussite-particuliere' || degre === 'echec-total'
        ? 'chronique'
        : 'trace';
}

/** Ce qu'il faut d'un lancer pour le consigner — jamais le `RollResult` entier. */
export interface JetAConsigner extends Pick<RollResult, 'degre' | 'tagSuccess' | 'totalDisplay'> {
    /** Ce que le jet cherchait — « Combat + Devoir », « Discrétion ». */
    titre: string;
    /** La cible, quand le jet en avait une. */
    seuil?: number;
}

/**
 * Écrit un jet au journal de la séance en cours.
 *
 * **Rien à vérifier avant d'appeler** : `addEvent` refuse déjà tout ce qui
 * arrive hors enregistrement ou sur une séance close, et il le dit à la console.
 * Un émetteur qui referait ce contrôle en ferait un second, qui divergerait.
 */
export function consignerLeJet(jet: JetAConsigner): void {
    const degre = degreOuBooleen(jet.degre, jet.tagSuccess);

    /*
      **Le verdict se nomme d'un seul endroit**, celui-là même que les quatre
      écrans emploient. Recomposer ici « Réussite » ou « Succès » aurait rouvert
      les trois vocabulaires que le chantier des degrés vient de fermer — et
      cette fois dans le texte que l'Oracle relira dans six mois.
    */
    const verdict = degre ? i18next.t(cleI18nDuDegre(degre)) : null;

    const morceaux = [jet.totalDisplay];
    if (jet.seuil !== undefined) morceaux.push(`cible ${jet.seuil}`);
    if (verdict) morceaux.push(verdict);

    useJournalStore.getState().addEvent({
        type: 'DICE',
        title: `Jet : ${jet.titre}`,
        content: morceaux.join(' — '),
        nature: natureDuJet(degre ?? undefined),
        metadata: {
            degre: degre ?? undefined,
            reussi: degre ? estUneReussite(degre) : undefined,
        },
    });
}
