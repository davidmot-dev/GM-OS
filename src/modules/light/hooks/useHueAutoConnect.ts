import { useEffect } from 'react';
import { useLightStore } from '../useLightStore';
import { hueEngine } from '../HueEngine';

/**
 * Hook to handle automatic Philips Hue connection on application startup.
 * It checks for persisted credentials in the useLightStore and triggers
 * a light fetch to validate the connection without user intervention.
 */
export const useHueAutoConnect = () => {
    const status = useLightStore((state) => state.status);
    const bridgeIp = useLightStore((state) => state.bridgeIp);
    const username = useLightStore((state) => state.username);
    const setConnection = useLightStore((state) => state.setConnection);

    useEffect(() => {
        // Only trigger auto-connect if we're disconnected but have credentials
        if (status === 'disconnected' && bridgeIp && username) {
            console.log(`[Light OS] Auto-connecting to Hue Bridge at ${bridgeIp}...`);
            
            // Set temporary status to show we are working
            setConnection('discovering');

            hueEngine.fetchLights().then(() => {
                console.log(`[Light OS] Auto-connection successful.`);
                setConnection('connected');
            }).catch((err) => {
                console.error(`[Light OS] Auto-connection failed:`, err);
                setConnection('disconnected');
            });
        }
    }, [status, bridgeIp, username, setConnection]);
};
