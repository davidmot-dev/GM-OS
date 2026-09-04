import type { Debruitage } from './logic/migrationDesEffets';

/**
 * **Les types de la voix, dans un module qui n'importe rien.**
 *
 * Ils vivaient dans `useVoiceStore`. Le jour où la fiche d'un PNJ de campagne a
 * eu besoin de porter un `ProfilVocal`, `entity.types.ts` s'est mis à importer
 * le magasin — et le cycle qui en est né a fait disparaître **l'augmentation
 * globale de `Window`** : `window.d.ts` importe `VoiceState`, donc le magasin,
 * qui remontait jusqu'à `entity.types`. Une centaine d'erreurs
 * « `appBridge` n'existe pas sur `Window` », pour un champ facultatif.
 *
 * *Un type partagé ne doit pas habiter chez celui qui s'en sert le plus.*
 * `useVoiceStore` les réexporte : rien de ce qui les importait ne change.
 */

export interface VoiceEffects {
    pitch: number;      // -12 to 12 semitones
    formant: number;    // -100 to 100 (timbre simulation via peaking EQ)
    reverb: number;     // 0 to 1 (mix)
    distortion: number; // 0 to 1 (amount)
    bitcrush: number;  // 0 to 1
    lowCut: number;     // 80, 250 or 0 (off)
    gateThreshold: number; // -100 to 0 dB
    /**
     * La compression, de 0 (aucune) à 100 (le réglage figé d'avant le
     * 2026-09-03 : 8:1, seuil −24 dB). Voir `logic/compression.ts`.
     */
    compression: number;
    outputGain: number; // 0 to 2
    antiLarsen: boolean; // Toggle browser echo cancellation
    /**
     * Qui débruite, et il n'y en a qu'un — voir `logic/migrationDesEffets.ts`.
     *
     * - `aucun` : le signal du micro arrive brut.
     * - `navigateur` : la suppression de bruit de WebRTC. Ce n'est pas un
     *   filtre mais un algorithme qui décide lui-même de ce qui est de la voix,
     *   **en amont de tout ce que Voice-OS peut régler** — d'où les fins de
     *   phrase rabotées.
     * - `neuronal` : RNNoise, dans la chaîne de GM-OS. Réglable, mesurable, et
     *   il rend en prime une probabilité de voix que la porte sait suivre.
     *
     * *Un seul réglage à trois positions, et non deux interrupteurs : deux
     * débruiteurs qui se suivent, ce n'est pas mieux, c'est pire.*
     */
    debruitage: Debruitage;
    noiseGate: boolean;  // Toggle gate logic
    duckingEnabled: boolean;
    duckingThreshold: number; // dB
    duckingRange: number; // 0 to 1 (target gain)
    duckingRelease: number; // ms delay before fade-in
    duckingAttack: number; // ms for the fade transition
}

/**
 * Un profil vocal enregistré sur la fiche d'un PNJ.
 *
 * **Ce qu'on garde, et pourquoi tout.** On enregistre l'état complet du rack —
 * pas les cinq valeurs suggérées par le modèle. Le meneur retouche presque
 * toujours aux curseurs après coup, et c'est cet état-là qu'il veut retrouver,
 * pas la proposition initiale. *Ce qu'on rappelle doit être ce qu'on a entendu.*
 */
export interface ProfilVocal {
    /** Le preset actif, s'il n'a pas été retouché depuis. */
    presetId: string | null;
    effects: VoiceEffects;
    /** Quand il a été posé — pour que l'écran puisse dire « il y a trois jours ». */
    enregistreLe: number;
}

export interface VoicePreset {
    id: string;
    name: string;
    icon: string;
    description: string;
    effects: VoiceEffects;
}
