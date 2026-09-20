/**
 * **Les volumes qu'un moment pose sur les trois sources sonores.**
 *
 * Demandé par David le 2026-09-20 : *« je voudrais pouvoir définir le volume de
 * Music-OS, Ambient-OS et Sound-OS »*.
 *
 * ⭐ **C'est le réglage qui manquait pour qu'un moment soit un mixage.** Il
 * savait déjà *quoi* jouer sur chaque source ; il ne savait pas **dans quel
 * rapport**. Or une révélation chuchotée et une charge de cavalerie emploient
 * exactement les mêmes trois modules — ce qui les sépare est le dosage.
 *
 * ⛔ **En le branchant, on a trouvé que deux des trois volumes n'existaient
 * pas.** `SoundEngine.setMasterVolume` était écrit, complet, sans **aucun
 * appelant** ; Ambient-OS n'avait ni nœud ni méthode. *Un moment qui les
 * réglait aurait posé deux nombres que personne ne lit.*
 */

/** Ce que le moment déclare côté volumes — tout y est facultatif. */
export interface MomentDeVolume {
    musicVolume?: number;
    musicVolumeFondu?: number;
    ambientVolume?: number;
    ambientVolumeFondu?: number;
    soundVolume?: number;
    soundVolumeFondu?: number;
}

/** Les trois sources qu'un moment peut doser. */
export type SourceSonore = 'music' | 'ambient' | 'sound';

export interface ReglageDeVolume {
    source: SourceSonore;
    /** Le niveau visé, de 0 à 1. */
    volume: number;
    /** Le temps mis pour y aller, en millisecondes. */
    fonduMs: number;
}

/**
 * **Le fondu par défaut, quand le moment n'en demande pas.**
 *
 * ⭐ Il n'est pas nul, et c'est le point. *Un saut de niveau en pleine scène
 * s'entend comme une fausse manœuvre ; un fondu s'entend comme une intention.*
 * Une seconde et demie est le temps qu'il faut pour qu'une baisse passe pour un
 * choix du meneur plutôt que pour un câble qui se débranche.
 */
export const FONDU_PAR_DEFAUT_MS = 1500;

/** Au-delà d'une demi-minute, ce n'est plus un fondu, c'est un oubli. */
export const FONDU_MAXIMUM_MS = 30000;

const borner = (valeur: number, bas: number, haut: number): number =>
    Math.min(haut, Math.max(bas, valeur));

/**
 * **Un volume déclaré, ou rien.**
 *
 * ⛔ **Zéro est une valeur, pas une absence** — et c'est le piège de cette
 * fonctionnalité. « Couper la musique sur ce moment » s'écrit `0`, et tout le
 * code de ce dépôt qui range des champs facultatifs emploie `valeur ||
 * undefined`, qui **transforme ce zéro en « ne touche à rien »**. Le moment
 * ferait alors exactement l'inverse de ce qu'on lui demande : la musique
 * continuerait à plein volume sur le silence qu'on voulait.
 *
 * *Un défaut qui ne se produit qu'à une seule valeur est un défaut qu'aucune
 * relecture ne voit.*
 */
const volumeDeclare = (valeur: unknown): number | null => {
    if (typeof valeur !== 'number' || !Number.isFinite(valeur)) return null;
    return borner(valeur, 0, 1);
};

const fonduDeclare = (valeur: unknown): number => {
    if (typeof valeur !== 'number' || !Number.isFinite(valeur)) return FONDU_PAR_DEFAUT_MS;
    return borner(Math.round(valeur), 0, FONDU_MAXIMUM_MS);
};

/**
 * **Les réglages à poser, dans l'ordre où on les pose.**
 *
 * Seules les sources que le moment **déclare** sont rendues : ne rien dire
 * d'une source la laisse où elle est. *Un moment de storyboard décrit ce qu'il
 * change, jamais l'état complet du monde* — sans quoi chaque moment devrait
 * redire les trois volumes, et en oublier un reviendrait à le remettre à fond.
 */
export function volumesDuMoment(moment: MomentDeVolume | null | undefined): ReglageDeVolume[] {
    if (!moment) return [];

    const candidats: { source: SourceSonore; volume: unknown; fondu: unknown }[] = [
        { source: 'music', volume: moment.musicVolume, fondu: moment.musicVolumeFondu },
        { source: 'ambient', volume: moment.ambientVolume, fondu: moment.ambientVolumeFondu },
        { source: 'sound', volume: moment.soundVolume, fondu: moment.soundVolumeFondu },
    ];

    const reglages: ReglageDeVolume[] = [];
    for (const c of candidats) {
        const volume = volumeDeclare(c.volume);
        if (volume === null) continue;
        reglages.push({ source: c.source, volume, fonduMs: fonduDeclare(c.fondu) });
    }
    return reglages;
}

/** Le nom que le meneur reconnaît, pour le rapport du moment. */
export const NOM_DE_LA_SOURCE: Record<SourceSonore, string> = {
    music: 'Volume musique',
    ambient: 'Volume ambiance',
    sound: 'Volume bruitages',
};
