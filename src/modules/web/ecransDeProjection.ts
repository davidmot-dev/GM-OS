import type { DisplayInfo } from '../image/types';

/**
 * **Où une vidéo peut partir, et où elle est déjà.**
 *
 * Demandé par David le 2026-09-05 : *« quand je lance une vidéo YouTube, je veux
 * pouvoir choisir la sortie »*.
 *
 * ⛔ **Le bouton nommait l'écran sans laisser en changer.** Web-OS projetait sur
 * la cible réglée **dans Image-OS**, un autre module : pour envoyer une vidéo sur
 * le second moniteur, il fallait quitter Web-OS, changer un réglage ailleurs, et
 * revenir. *Un réglage qui vit dans un module et décide dans un autre est une
 * action à distance* — exactement ce qu'on reprochait au mode de contexte le
 * 22/08.
 *
 * Le choix se fait donc là où le geste se fait.
 */

/** Un écran proposé au meneur. */
export interface EcranDeProjection {
    id: string;
    libelle: string;
    /** Ce média y est-il à l'antenne en ce moment ? */
    aLAntenne: boolean;
}

/**
 * Les écrans où l'on peut envoyer ce média, dans l'ordre d'affichage.
 *
 * **Le Player Hub vient en premier**, toujours : c'est le seul qui existe sans
 * matériel, donc le seul qu'on soit certain de pouvoir viser. *Une liste qui
 * commence par ce qui peut manquer commence parfois par rien.*
 *
 * ⚠️ Un écran débranché depuis la dernière détection ne figure pas ici, et c'est
 * voulu : proposer une cible qui n'existe plus ouvrirait une fenêtre sur un
 * bureau invisible.
 */
export function ecransDeProjection(
    ecrans: readonly DisplayInfo[],
    projections: Readonly<Record<string, string | null>>,
    marqueur: string | null,
    libelleDe: (id: string) => string,
): EcranDeProjection[] {
    const aLAntenne = (id: string) => !!marqueur && projections[id] === marqueur;

    return [
        { id: 'hub', libelle: libelleDe('hub'), aLAntenne: aLAntenne('hub') },
        ...ecrans.map((e) => ({
            id: e.id,
            libelle: libelleDe(e.id),
            aLAntenne: aLAntenne(e.id),
        })),
    ];
}

/**
 * Les écrans où ce média est à l'antenne, pour les annoncer sur le pad.
 *
 * *Une vidéo qu'on a lancée et qu'on ne retrouve plus est une vidéo qu'on ne peut
 * pas couper* — d'où l'étiquette, visible sans survoler.
 */
export function ecransOccupes(
    ecrans: readonly EcranDeProjection[],
): EcranDeProjection[] {
    return ecrans.filter((e) => e.aLAntenne);
}
