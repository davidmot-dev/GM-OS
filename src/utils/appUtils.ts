/**
 * Utility to completely reset the application state.
 * Clears localStorage (Zustand) and IndexedDB (Media Hub).
 */
export const flushApplication = async () => {
    const message = "⚠️ ACTION IRRÉVERSIBLE\n\nCela va supprimer :\n- Toutes vos campagnes et sessions\n- Tous les médias importés dans le Hub\n- Tous vos réglages\n\nVoulez-vous vraiment réinitialiser GM-OS v5 ?";

    if (!confirm(message)) {
        return;
    }

    try {
        // 1. Clear LocalStorage (Zustand stores)
        localStorage.clear();
        console.log('[Flush] LocalStorage cleared');

        // 2. Clear Media Hub IndexedDB
        const DB_NAME = 'gmos-media-db';
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

        deleteRequest.onsuccess = () => {
            console.log('[Flush] Media DB deleted successfully');
            // 3. Reload the application
            window.location.reload();
        };

        deleteRequest.onerror = () => {
            console.error('[Flush] Failed to delete Media DB');
            alert("Erreur lors de la suppression de la base de données. Essayez de fermer tous les onglets et de recommencer.");
            window.location.reload();
        };

        deleteRequest.onblocked = () => {
            console.warn('[Flush] Delete blocked. Reloading anyway...');
            alert("La suppression est bloquée par une autre connexion. L'application va redémarrer.");
            window.location.reload();
        };

    } catch (err) {
        console.error('[Flush] Critical error during flush:', err);
        localStorage.clear();
        window.location.reload();
    }
};
