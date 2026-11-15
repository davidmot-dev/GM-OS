import { useEffect, useState } from 'react';
import { useClientStore } from '../../stores/useClientStore';
import { portDeSynchronisation } from '../../utils/portsDuRenderer';
import { appliquerApparenceTablettes } from '../../theme/apparenceTablettes';
import { lireRepriseDesModules, enregistrerRepriseDesModules } from '../modulesDuJeu/reprise';
import type { EtatDeLEcran } from './ecranDeTable';

/**
 * **La connexion de l'écran de table** — Fire HD 8, registre § 256, T13.
 *
 * Une WebSocket en rôle `hub` : public, caviardé, sans jeton. L'écran ne lit qu'un segment du flux,
 * `ecranDeTable`, composé par le poste du meneur (`useDiffusionDeLEcranDeTable`), et le thème
 * (`apparence`). Rien n'est écrit, rien n'est persisté.
 */
const BACKOFF_INITIAL = 1000;
const BACKOFF_MAX = 30000;

export type EtatDeLaConnexion = 'connexion' | 'connecte' | 'deconnecte';

export function useEcranDeTable() {
    const [connexion, setConnexion] = useState<EtatDeLaConnexion>('connexion');
    const [ecran, setEcran] = useState<EtatDeLEcran | null>(null);
    const { deviceId } = useClientStore();

    useEffect(() => {
        let socket: WebSocket | null = null;
        let minuterie: ReturnType<typeof setTimeout> | null = null;
        let attente = BACKOFF_INITIAL;
        let fini = false;
        const connecter = () => {
            if (fini) return;
            setConnexion('connexion');
            socket = new WebSocket(`ws://${window.location.hostname}:${portDeSynchronisation()}`);
            const ici = socket;
            ici.onopen = () => {
                attente = BACKOFF_INITIAL;
                // La Fire garde le même identifiant dans tous ses rôles : sans son jeton de reprise, le serveur
                // refuserait l'écran à un appareil qui a déjà servi d'appareil de table (`reprise_refusee`).
                ici.send(JSON.stringify({ type: 'remote:register', payload: {
                    deviceId, pseudo: 'Écran de table', role: 'hub', repriseModules: lireRepriseDesModules(deviceId) } }));
            };
            ici.onmessage = evenement => {
                let message: { type?: unknown; payload?: Record<string, unknown> } | null = null;
                try { message = JSON.parse(String(evenement.data)); } catch { return; }
                if (!message || typeof message !== 'object') return;
                if (message.type === 'remote:registered') { enregistrerRepriseDesModules(deviceId, message.payload?.repriseModules); setConnexion('connecte'); return; }
                if (message.type !== 'sync' || !message.payload || typeof message.payload !== 'object') return;
                if (message.payload.apparence) appliquerApparenceTablettes(message.payload.apparence as Parameters<typeof appliquerApparenceTablettes>[0]);
                const recu = message.payload.ecranDeTable as EtatDeLEcran | undefined;
                if (recu && typeof recu === 'object' && Array.isArray(recu.tuiles)) setEcran(recu);
            };
            ici.onclose = () => {
                if (fini) return;
                setConnexion('deconnecte');
                minuterie = setTimeout(connecter, attente);
                attente = Math.min(attente * 2, BACKOFF_MAX);
            };
        };
        connecter();
        return () => { fini = true; if (minuterie) clearTimeout(minuterie); socket?.close(); };
    }, [deviceId]);

    return { connexion, ecran };
}
