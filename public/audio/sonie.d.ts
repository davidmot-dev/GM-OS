/**
 * Le contrat de `sonie.js`, pour que les tests le typent.
 *
 * Comme `transposition.d.ts` : le module reste du JavaScript parce qu'il est
 * chargé par `audioWorklet.addModule`, donc par le navigateur et non par Vite.
 */
export declare const CIBLE_PAR_DEFAUT: number;

export interface CoefficientsBiquad {
    b0: number; b1: number; b2: number; a1: number; a2: number;
}

export declare function coefficientsK(taux: number): {
    etage1: CoefficientsBiquad;
    etage2: CoefficientsBiquad;
};

export declare class MesureDeSonie {
    constructor(taux: number, nbCanaux?: number);
    ajouter(canaux: Float32Array[]): void;
    /** La sonie intégrée en LUFS, ou `null` s'il n'y a pas de quoi juger. */
    lufs(): number | null;
    readonly nbBlocs: number;
}

export declare function gainDeNormalisation(
    lufs: number | null | undefined, cible?: number, limiteDb?: number,
): number;
