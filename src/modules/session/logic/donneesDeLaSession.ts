import type { SessionOSStore } from '../store/index';

/**
 * **Ce qu'une session contient durablement — une liste, et une seule.**
 *
 * Trois endroits écrivaient une session, et chacun portait sa propre idée de ce
 * qu'elle contient :
 *
 * - `partialize` (la persistance vivante, IndexedDB) — complète ;
 * - `SessionService.saveFullSession` (la sauvegarde vers un fichier) — sans
 *   `entities`, sans `clues`, sans `sessions`, sans les decks ;
 * - `useSessionOSStore.getBackupData()` — sans la trame ni les pilotes.
 *
 * La divergence ne se voyait pas : la persistance vivante gardait tout, donc
 * l'application se comportait bien. Elle se voyait **le jour où l'on rouvre une
 * sauvegarde** — et ce jour-là, les PNJ, les indices et l'historique des séances
 * n'y étaient pas. Signalé le 2026-08-16, reporté trois fois, corrigé ici.
 *
 * *Le remède n'est pas d'ajouter les champs manquants aux deux listes fautives :
 * c'est de n'en avoir qu'une.* Ajouter un champ au store et oublier de le
 * recopier ailleurs redeviendrait sinon possible dès demain — c'est exactement
 * ce qui est arrivé à `actes` et `scenes`, ajoutés à deux listes sur trois.
 *
 * Ce que cette liste ne contient PAS, et pourquoi : l'état de vue
 * (`currentView`, `isProjecting`, `selectedDeckId`, les sélections d'écran).
 * Ce n'est pas de la donnée, c'est où l'on regardait. `partialize` en garde deux
 * délibérément, pour rouvrir l'application là où on l'a laissée ; une sauvegarde
 * relue sur une autre machine n'a rien à en faire.
 */
export const lesDonneesDeLaSession = (state: SessionOSStore) => ({
    campaigns: state.campaigns,
    sessions: state.sessions,
    entities: state.entities,
    players: state.players,
    atlasMaps: state.atlasMaps,
    timelineEvents: state.timelineEvents,
    wikiEntries: state.wikiEntries,
    clues: state.clues,
    // La trame est de la préparation : elle survit à la fermeture au même titre
    // que les PNJ et les lieux qu'elle désigne.
    actes: state.actes,
    scenes: state.scenes,
    customSheetTemplates: state.customSheetTemplates,
    customGameDrivers: state.customGameDrivers,
    activeCampaignId: state.activeCampaignId,
    decks: state.decks,
    deckStates: state.deckStates,
});

/**
 * Les noms des champs durables, dans l'ordre de la liste ci-dessus.
 *
 * Sert aux tests à vérifier qu'aucun chemin d'écriture n'en perd en route, sans
 * avoir à réécrire la liste — une liste recopiée dans un test ne protège que
 * d'elle-même.
 */
export const CHAMPS_DURABLES = Object.keys(
    lesDonneesDeLaSession({} as SessionOSStore),
) as (keyof ReturnType<typeof lesDonneesDeLaSession>)[];
