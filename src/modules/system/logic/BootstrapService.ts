import { spatialTriggerService } from '../../map/SpatialTriggerService';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useAIStore } from '../../../stores/useAIStore';
import { useLightStore } from '../../light/useLightStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { sessionBackupManager } from '../../session/logic/SessionBackupManager';

/**
 * Service centralisé pour orchestrer le démarrage de GM-OS.
 * Garantit que les bases de données, la sécurité et les services de fond
 * sont prêts avant d'autoriser l'accès à l'interface.
 */
export class BootstrapService {
    private static isInitialized = false;

    static async bootstrap(): Promise<void> {
        if (this.isInitialized) return;
        
        console.log('[Bootstrap] ⚙️ Initialisation du système...');

        try {
            // 1. Initialisation de la base de données Media (IndexedDB)
            // Essentiel pour la résolution des URLs m-ID
            console.log('[Bootstrap] 📂 Initialisation Media DB...');
            await useMediaStore.getState().initDB();

            // 2. Synchronisation de la sécurité (Keychain)
            // Récupère les clés API et tokens depuis le stockage sécurisé de l'OS
            console.log('[Bootstrap] 🔐 Synchronisation du trousseau de clés...');
            await Promise.all([
                useAIStore.getState().syncWithKeychain(),
                useLightStore.getState().syncWithKeychain()
            ]);

            // 3. Démarrage des services de fond
            console.log('[Bootstrap] 📡 Démarrage des services de fond (Spatial Triggers)...');
            spatialTriggerService.startWatching();

            // 4. Démarrage du cycle de sauvegarde automatique (15 min)
            sessionBackupManager.start();

            // 5. Marquage du système comme "Prêt"
            useSessionStore.getState().setSystemReady(true);
            this.isInitialized = true;
            
            console.log('[Bootstrap] ✅ Système prêt.');
        } catch (error) {
            console.error('[Bootstrap] ❌ Erreur fatale lors de l\'initialisation :', error);
            // On laisse isSystemReady à false pour bloquer l'interface si critique
        }
    }
}
