import { useEffect } from 'react';
import { useLightStore } from '../useLightStore';
import { hueEngine } from '../HueEngine'; // Instance en minuscule
import { useSessionStore } from '../../../store/useSessionStore';

/**
 * Hook global pour gérer la reconnexion automatique au pont Hue au démarrage.
 * S'assure que le système est prêt (bootstrap fini) avant de tenter quoi que ce soit.
 */
export const useHueAutoConnect = (isMainPC: boolean) => {
    const { status, bridgeIp, username, setConnection, setLights } = useLightStore();
    const isSystemReady = useSessionStore(state => state.isSystemReady);

    useEffect(() => {
        if (isMainPC) {
            console.log(`[Light OS] 🕵️ Surveillance Token: ${username ? 'PRÉSENT (' + username.substring(0, 5) + '...)' : 'ABSENT'} | Status: ${status}`);
        }
    }, [username, status, isMainPC]);

    useEffect(() => {
        // Diagnostic initial
        if (isMainPC) {
            console.log('[Light OS] 🌀 Hook useHueAutoConnect vérification...', {
                isSystemReady,
                status,
                hasIp: !!bridgeIp,
                hasToken: !!username
            });
        }

        // On n'active l'auto-connexion QUE sur le PC du MJ et une fois le bootstrap fini
        if (!isMainPC || !isSystemReady) return;

        // Petit délai de sécurité pour laisser l'état Zustand se propager après le bootstrap
        const timer = setTimeout(() => {
            const performConnect = async () => {
                // On récupère les valeurs FRAICHES depuis le store
                const currentStore = useLightStore.getState();
                const currentStatus = currentStore.status;
                const currentToken = currentStore.username;
                const currentIp = currentStore.bridgeIp;

                if (currentStatus === 'disconnected' && currentIp && currentToken) {
                    console.log(`[Light OS] 📡 Tentative de reconnexion automatique vers ${currentIp}...`);
                    try {
                        setConnection('discovering');
                        
                        // Utilisation de l'instance hueEngine
                        await hueEngine.fetchLights();
                        
                        setConnection('connected');
                        console.log('[Light OS] ✅ Reconnexion automatique réussie.');
                    } catch (err) {
                        console.error('[Light OS] ❌ Échec de la reconnexion automatique:', err);
                        
                        if (err instanceof Error && err.message === "UNAUTHORIZED") {
                            console.warn('[Light OS] ⚠️ Le jeton est invalide. L\'appairage a été perdu côté Pont.');
                            setConnection('disconnected', undefined, null);
                        } else {
                            // Erreur réseau ou autre : on reste en déconnecté mais on garde le token
                            setConnection('disconnected');
                        }
                    }
                }
            };

            performConnect();
        }, 500);

        return () => clearTimeout(timer);
    }, [isSystemReady, isMainPC, bridgeIp, username, status, setConnection, setLights]);
};
