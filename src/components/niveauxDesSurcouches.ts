/**
 * **L'ordre d'empilement des surcouches communes**, en un seul endroit.
 *
 * David, 20/11/2026 : « quand j'essaie de modifier l'image de la campagne rien
 * ne se passe ». La médiathèque s'ouvrait bien, mais au niveau 100, **sous** la
 * fenêtre « Modifier la campagne » (niveau 150) : invisible, et Échap la
 * refermait sans qu'on l'ait vue. Même défaut pour toutes les fenêtres de
 * `ModalProvider` qui l'ouvrent (nouvelle campagne, joueur, personnage, PNJ,
 * dossier d'un favori).
 *
 * L'ordre, du bas vers le haut :
 * 1. la **fenêtre** de `ModalProvider` (formulaires, Loot-OS…) ;
 * 2. la **médiathèque**, qu'une fenêtre ouvre pour choisir une image ;
 * 3. les **questions** (`gmAlert`, `gmConfirm`, `gmPrompt`), que la
 *    médiathèque pose elle-même (renommer, supprimer) — sans quoi « Supprimer
 *    ce média ? » passerait à son tour derrière elle.
 *
 * Les classes sont écrites en entier : Tailwind les lit ici (`src/**\/*.ts`).
 */
export const NIVEAU_DE_LA_FENETRE = 'z-[150]';
export const NIVEAU_DE_LA_MEDIATHEQUE = 'z-[160]';
export const NIVEAU_DES_QUESTIONS = 'z-[170]';

/** Le nombre d'une classe `z-[n]`, pour comparer deux niveaux. */
export const valeurDuNiveau = (classe: string): number => Number(/z-\[(\d+)\]/.exec(classe)?.[1] ?? NaN);
