import type { StoreApi } from 'zustand';

/** Les états viennent des magasins réels ; ces imports de types ne chargent aucun magasin. */
export interface EtatsDuHub {
    useImageStore: ReturnType<typeof import('../modules/image/useImageStore').useImageStore.getState>;
    useClockStore: ReturnType<typeof import('../store/useClockStore').useClockStore.getState>;
    useFavoriteStore: ReturnType<typeof import('../modules/favorite/useFavoriteStore').useFavoriteStore.getState>;
    useCombatStore: ReturnType<typeof import('../modules/combat/useCombatStore').useCombatStore.getState>;
    useSessionOSStore: ReturnType<typeof import('../modules/session/useSessionOSStore').useSessionOSStore.getState>;
    useClientStore: ReturnType<typeof import('../stores/useClientStore').useClientStore.getState>;
    useSyncStore: ReturnType<typeof import('../stores/useSyncStore').useSyncStore.getState>;
    useDiceStore: ReturnType<typeof import('../stores/useDiceStore').useDiceStore.getState>;
    useMapStore: ReturnType<typeof import('../modules/map/useMapStore').useMapStore.getState>;
    useMapUIStore: ReturnType<typeof import('../modules/map/useMapUIStore').useMapUIStore.getState>;
    useWhiteboardStore: ReturnType<typeof import('../modules/whiteboard/useWhiteboardStore').useWhiteboardStore.getState>;
    useRessourcesDeTableStore: ReturnType<typeof import('../modules/table/useRessourcesDeTableStore').useRessourcesDeTableStore.getState>;
}

export type NomDeMagasinDuHub = keyof EtatsDuHub;
type MagasinDuHub<Nom extends NomDeMagasinDuHub> = Pick<StoreApi<EtatsDuHub[Nom]>,
    'getState' | 'setState' | 'subscribe'>;
type MagasinsExposes = { [Nom in NomDeMagasinDuHub]?: MagasinDuHub<Nom> };

/**
 * Les magasins s'enregistrent eux-mêmes sous ces noms sur window. Seule cette
 * frontière relie le global à leurs types ; leur absence reste un cas normal.
 */
export function magasinDuHub<Nom extends NomDeMagasinDuHub>(nom: Nom): MagasinDuHub<Nom> | undefined {
    if (typeof window === 'undefined') return undefined;
    return (window as unknown as MagasinsExposes)[nom];
}

/** Même contrat à l'écriture : un nom ne peut pas recevoir le magasin d'un autre domaine. */
export function exposerMagasinDuHub<Nom extends NomDeMagasinDuHub>(
    nom: Nom, magasin: MagasinDuHub<NoInfer<Nom>>,
): void {
    if (typeof window === 'undefined') return;
    // TypeScript perd la relation nom/état à l'écriture dans un type mappé.
    // La signature vérifie cette relation chez l'appelant ; ici, une seule clé est écrite.
    const fenetre = window as unknown as Partial<Record<Nom, MagasinDuHub<Nom>>>;
    fenetre[nom] = magasin;
}
