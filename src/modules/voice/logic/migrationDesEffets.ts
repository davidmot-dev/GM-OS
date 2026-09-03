/**
 * **La migration du réglage de débruitage, du booléen aux trois choix.**
 *
 * *Chantier du 2026-09-03.* Le matin, `noiseSuppression` était un booléen : le
 * débruiteur du navigateur, allumé ou éteint. L'après-midi, RNNoise est arrivé —
 * et **deux débruiteurs qui se suivent, ce n'est pas mieux, c'est pire** : le
 * premier rabote ce que le second aurait su garder.
 *
 * On ne pose donc pas un second interrupteur à côté du premier : *deux réglages
 * qui décident de la même chose finissent par ne plus être d'accord*, et c'est le
 * motif que ce projet paie le plus souvent. Un seul réglage, trois positions.
 *
 * D'où cette migration, qui n'a l'air de rien mais protège un réglage déjà
 * enregistré chez David : `gmos-voice-storage` contient son `noiseSuppression`
 * depuis ce matin, et une clé disparue vaudrait `undefined`, donc « aucun
 * débruitage » — *un changement de forme ne doit jamais changer un réglage en
 * silence.*
 */

/** Les trois positions du réglage de débruitage. */
export type Debruitage = 'aucun' | 'navigateur' | 'neuronal';

/** Ce qu'une version antérieure du rack a pu enregistrer. */
export interface EffetsALire {
    debruitage?: unknown;
    noiseSuppression?: unknown;
}

/**
 * La position à retenir pour un rack relu du disque.
 *
 * L'ordre compte : un `debruitage` déjà écrit fait foi (il vient d'une version
 * plus récente), sinon on traduit l'ancien booléen, et à défaut on prend le
 * défaut du module. *On ne réécrit jamais par-dessus un choix plus récent.*
 */
export function debruitageMigre(effets: EffetsALire | null | undefined, defaut: Debruitage = 'navigateur'): Debruitage {
    const valeur = effets?.debruitage;
    if (valeur === 'aucun' || valeur === 'navigateur' || valeur === 'neuronal') return valeur;

    if (typeof effets?.noiseSuppression === 'boolean') {
        return effets.noiseSuppression ? 'navigateur' : 'aucun';
    }

    return defaut;
}
