import type { StoreApi } from 'zustand';
import type { SessionOSStore } from './index';

/** Fusionne une mise à jour ; remplacer le magasin entier ne fait pas partie du contrat. */
export type PoserUnEtat<Etat> = (
    miseAJour: Partial<Etat> | ((etat: Etat) => Partial<Etat>),
) => void;

export type LireUnEtat<Etat> = () => Etat;

/**
 * Une slice construit sa partie du magasin, sans pouvoir remplacer ses voisins.
 * `StateCreator<Partie>` exposait aussi `set(partie, true)` : une partie seule
 * n'est pas un remplacement valide du magasin assemblé, d'où les 33 `any`.
 * Les lectures restent utilisables avec une slice isolée ou un contexte plus large.
 */
export type CreateurDeSlice<Partie, Etat extends Partie = Partie> = (
    poser: PoserUnEtat<Etat>,
    lire: LireUnEtat<Etat>,
    magasin: Pick<StoreApi<Etat>, 'getState' | 'getInitialState'>,
) => Partie;

export type PoserLaSession = PoserUnEtat<SessionOSStore>;
export type LireLaSession = LireUnEtat<SessionOSStore>;
