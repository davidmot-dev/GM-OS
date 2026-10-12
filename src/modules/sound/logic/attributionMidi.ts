/**
 * **Quelle pastille répond à une note MIDI — et comment l'écrire.**
 *
 * Posé le 2026-10-12, après la première séance jouée : *« dans le pad MIDI j'ai
 * plusieurs banques, mais GM-OS ne les reconnaît pas »*. Le Pocket Pad change de
 * **canal** d'une banque à l'autre en gardant les **mêmes notes** ; GM-OS jetait le
 * canal, donc un pad de la banque B déclenchait la pastille de la banque A.
 *
 * Le canal est retenu à l'apprentissage, **de 1 à 16** — comme l'affiche le
 * contrôleur, pas comme le porte l'octet de statut (0 à 15).
 */

/** Ce que la recherche lit d'une pastille. */
export interface PadAttribuable {
    midiMapping: number | null;
    /** Absent ou `null` : une attribution d'avant le 12/10, qui répond à tous les canaux. */
    midiChannel?: number | null;
}

/** Le canal lisible (1 à 16) d'un octet de statut MIDI. */
export const canalDuStatut = (status: number): number => (status & 0x0f) + 1;

/**
 * **La pastille qui répond à une note reçue sur un canal.**
 *
 * ⛔ **Une attribution exacte passe devant une attribution sans canal.** Les
 * pastilles apprises avant le 12/10 n'ont pas de canal : elles continuent de
 * répondre à tous — c'est le comportement d'avant, rien à migrer. Mais dès qu'une
 * pastille a appris la même note **sur ce canal-là**, c'est elle qui joue.
 */
export const padPourLaNote = <P extends PadAttribuable>(
    pads: readonly P[],
    note: number,
    canal: number,
): P | undefined =>
    pads.find(p => p.midiMapping === note && p.midiChannel === canal) ??
    pads.find(p => p.midiMapping === note && (p.midiChannel === undefined || p.midiChannel === null));

/** `#36` pour une attribution sans canal, `#36 · c2` pour une attribution exacte. */
export const libelleMidi = (note: number, canal?: number | null): string =>
    canal === undefined || canal === null ? `#${note}` : `#${note} · c${canal}`;
