/**
 * Le contrat de `transposition.js`, pour que le test puisse le typer.
 *
 * Le module lui-même reste du JavaScript : il est chargé par
 * `audioWorklet.addModule`, donc **par le navigateur et non par Vite** — il ne
 * peut pas être compilé. Cette déclaration existe pour que
 * `logic/transposition.test.ts` l'importe sans `any`, et elle est le seul
 * endroit où le contrat est écrit deux fois : à garder d'accord avec le module.
 */
export declare const RETARD_CIBLE: number;

export declare class Transposeur {
    /** Transpose `entree` dans `sortie`. `ratio` = 2^(demi-tons/12). */
    traiter(entree: Float32Array, sortie: Float32Array, ratio: number): void;
    /** Remet la lecture à son retard nominal, sans fondu. */
    resynchroniser(): void;
}
