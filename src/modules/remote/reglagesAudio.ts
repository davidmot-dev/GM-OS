/**
 * **Ce que la tablette sait du son : ses trois voies, et où elles sortent.**
 *
 * Demandé par David le 2026-09-22 : *« sur la tablette remote GM-OS, je ne peux
 * pas choisir où va sortir le son. D'autre part, le slider du soundboard
 * fonctionne bien, mais il n'y a pas de slider dans les pads. »*
 *
 * ⛔ **LA RAISON POUR LAQUELLE CE MODULE EXISTE : la tablette ne peut pas lister
 * les sorties elle-même.** `navigator.mediaDevices.enumerateDevices()` y rendrait
 * les haut-parleurs **de la tablette** — le meneur choisirait « écouteurs
 * Bluetooth » et **rien ne changerait sur son PC**. Pire : la liste aurait l'air
 * juste. *Une liste plausible et fausse coûte plus cher qu'une liste absente.*
 *
 * La liste vient donc du meneur, et le choix y repart en message.
 *
 * ⭐ **Et elle porte les noms qu'il a donnés.** `useHardwareStore` recense déjà
 * les sorties et garde l'alias du meneur — « Enceintes du salon » plutôt que
 * « Realtek(R) Audio (High Definition Audio Device) ». *Le recensement était
 * fait ; il n'y avait qu'à le transporter.*
 *
 * ⚠️ **Les trois voies restent indépendantes**, comme sur l'écran du meneur :
 * c'est ce qui permet à un moment de storyboard d'envoyer la musique sur les
 * grandes enceintes et les bruitages sur la petite. *Une sortie unique sur la
 * tablette aurait été une quatrième vérité.*
 */

/** Une sortie audio de la machine du meneur, sous le nom qu'il lui donne. */
export interface RemoteSortieAudio {
    id: string;
    nom: string;
}

/** Une voie : son niveau, et par où elle sort. */
export interface RemoteVoieAudio {
    /** De 0 à 1 côté bruitages et ambiances, jusqu'à 1 pour la musique. */
    volume: number;
    /** L'identifiant de la sortie, ou `'default'`. */
    sortie: string;
}

export interface RemoteReglagesAudio {
    /** Les sorties de la machine du meneur. Jamais celles de la tablette. */
    sorties: RemoteSortieAudio[];
    sound: RemoteVoieAudio;
    music: RemoteVoieAudio;
    ambient: RemoteVoieAudio;
}

/** Le nom des trois voies, pour les actions comme pour l'écran. */
export const VOIES_AUDIO = ['sound', 'music', 'ambient'] as const;
export type NomDeVoie = (typeof VOIES_AUDIO)[number];

export const LIBELLE_DE_LA_VOIE: Record<NomDeVoie, string> = {
    sound: 'Bruitages',
    music: 'Musique',
    ambient: 'Ambiances',
};

/** L'entrée que toute liste de sorties porte en tête. */
export const SORTIE_PAR_DEFAUT: RemoteSortieAudio = { id: 'default', nom: 'Sortie par défaut' };

interface SourceDesReglages {
    /** Les sorties recensées par `useHardwareStore`. */
    appareils?: readonly { deviceId: string; kind?: string }[];
    /** Le nom du meneur, avec repli sur celui du système. */
    nomDeLaSortie?: (deviceId: string) => string;
    sound?: { masterVolume?: number; outputDeviceId?: string };
    music?: { masterVolume?: number; outputDeviceId?: string };
    ambient?: { masterVolume?: number; outputDeviceId?: string };
}

/**
 * Un volume qui tient debout.
 *
 * ⚠️ **`?? 1` ne suffit pas.** Un magasin peut porter `NaN` après une lecture
 * ratée, et `NaN ?? 1` vaut `NaN` — le curseur de la tablette deviendrait alors
 * vide, sans rien dire. *Le même piège que `valeur || undefined` qui avale un
 * zéro légitime, pris par l'autre bout.*
 */
function volumeSain(valeur: unknown, defaut: number): number {
    return typeof valeur === 'number' && Number.isFinite(valeur)
        ? Math.min(1, Math.max(0, valeur))
        : defaut;
}

function sortieSaine(valeur: unknown): string {
    return typeof valeur === 'string' && valeur.length > 0 ? valeur : SORTIE_PAR_DEFAUT.id;
}

/**
 * Les réglages audio tels que la tablette les reçoit.
 *
 * ⭐ **Typée en retour**, comme `segmentDeLecture` et pour la même raison : *un
 * littéral anonyme au milieu du synchroniseur n'oblige à rien, et trois champs
 * manquants y sont passés inaperçus pendant des mois.*
 */
export function reglagesAudio(source: SourceDesReglages): RemoteReglagesAudio {
    /* On ne garde que les sorties, jamais les entrées : proposer un micro comme
       destination serait une promesse que rien ne peut tenir. */
    const recensees = (source.appareils ?? [])
        .filter(appareil => !appareil.kind || appareil.kind === 'audiooutput')
        .filter(appareil => appareil.deviceId && appareil.deviceId !== SORTIE_PAR_DEFAUT.id)
        .map(appareil => ({
            id: appareil.deviceId,
            nom: source.nomDeLaSortie?.(appareil.deviceId) || appareil.deviceId,
        }));

    return {
        sorties: [SORTIE_PAR_DEFAUT, ...recensees],
        sound: {
            volume: volumeSain(source.sound?.masterVolume, 1),
            sortie: sortieSaine(source.sound?.outputDeviceId),
        },
        music: {
            volume: volumeSain(source.music?.masterVolume, 1),
            sortie: sortieSaine(source.music?.outputDeviceId),
        },
        ambient: {
            volume: volumeSain(source.ambient?.masterVolume, 1),
            sortie: sortieSaine(source.ambient?.outputDeviceId),
        },
    };
}

/**
 * La sortie à afficher comme choisie.
 *
 * ⚠️ **Une sortie débranchée depuis le dernier choix n'est plus dans la liste.**
 * Rendre « par défaut » alors que le magasin dit autre chose ferait croire au
 * meneur qu'il a changé de sortie sans le vouloir. On rend donc l'identifiant
 * tel quel, et l'écran dit *« sortie absente »* — *un appareil qu'on ne trouve
 * plus se signale, il ne se remplace pas en silence.*
 */
export function sortieChoisie(
    reglages: RemoteReglagesAudio, voie: NomDeVoie,
): { id: string; nom: string; absente: boolean } {
    const id = reglages[voie].sortie;
    const connue = reglages.sorties.find(sortie => sortie.id === id);
    return connue
        ? { ...connue, absente: false }
        : { id, nom: 'Sortie absente', absente: true };
}
