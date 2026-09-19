import type { LightScene } from '../useLightStore';
import { tuilePorteUnEtat } from './tuilePorteUnEtat';

/**
 * **Où ranger une ambiance qu'on vient de composer.**
 *
 * La première case libre du râtelier de la campagne, dans l'ordre de la grille
 * — celle que le meneur verrait se remplir s'il regardait l'écran.
 *
 * ⛔ **On ne prend jamais une case du pot commun.** Une ambiance écrite pour
 * *cette* scène de *cette* campagne n'a rien à faire dans les tuiles qui
 * servent partout : elle y mangerait une case que le meneur a gardée pour ses
 * ambiances génériques. Il peut toujours la rendre commune ensuite, d'un clic
 * dans l'éditeur — *c'est son geste, pas une décision de l'IA.*
 *
 * ⚠️ **Sans campagne ouverte, on ne range nulle part.** Il n'y a alors pas de
 * râtelier à soi, et remplir une case commune ferait entrer dans la
 * bibliothèque partagée quelque chose qui ne lui appartient pas.
 *
 * @returns l'identifiant de la case, ou `null` s'il n'y en a plus — auquel cas
 *          l'écran doit le **dire** : *un bouton qui n'écrit rien sans
 *          expliquer passe pour une panne.*
 */
export function caseLibreDuRatelier(
    scenes: Record<string, LightScene>,
    campagneId: string | null,
): string | null {
    if (!campagneId) return null;

    const libres = Object.values(scenes)
        .filter(s => (s.campagneId ?? null) === campagneId && !tuilePorteUnEtat(s))
        .sort((a, b) => a.id.localeCompare(b.id));

    return libres[0]?.id ?? null;
}
