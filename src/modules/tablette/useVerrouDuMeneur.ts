import { useCallback, useEffect, useRef, useState } from 'react';
import { portDeSynchronisation } from '../../utils/portsDuRenderer';

/**
 * **Le verrou de l'Aide au MJ, côté tablette** — § 256, T14 (24/11/2026). Une WebSocket courte vers
 * le `SyncServer`, sans inscription : elle demande si un code est réglé au poste (`verrou:etat`) et
 * soumet un code (`verrou:ouvrir`). Le serveur compare et, si le code est juste, rend le secret
 * d'appairage ; le code, lui, ne revient jamais.
 */
export type ResultatDuCode =
    | { ok: true; token: string }
    | { ok: false; raison: 'faux'; restants: number }
    | { ok: false; raison: 'bloque'; attenteMs: number }
    | { ok: false; raison: 'aucun-code' | 'hors-ligne' };

export function useVerrouDuMeneur() {
    const [connecte, setConnecte] = useState(false);
    const [codeRegle, setCodeRegle] = useState<boolean | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const attenteRef = useRef<((r: ResultatDuCode) => void) | null>(null);

    useEffect(() => {
        let fini = false;
        let minuterie: ReturnType<typeof setTimeout> | null = null;
        const connecter = () => {
            if (fini) return;
            const ici = new WebSocket(`ws://${window.location.hostname}:${portDeSynchronisation()}`);
            socketRef.current = ici;
            ici.onopen = () => { setConnecte(true); ici.send(JSON.stringify({ type: 'verrou:etat' })); };
            ici.onmessage = evenement => {
                let message: { type?: unknown; payload?: Record<string, unknown> };
                try { message = JSON.parse(String(evenement.data)); } catch { return; }
                const p = message.payload ?? {};
                if (message.type === 'verrou:etat') setCodeRegle(p.codeRegle === true);
                if (message.type === 'verrou:ouvrir' && attenteRef.current) {
                    const rendre = attenteRef.current;
                    attenteRef.current = null;
                    if (p.ok === true && typeof p.token === 'string') rendre({ ok: true, token: p.token });
                    else if (p.raison === 'faux') rendre({ ok: false, raison: 'faux', restants: Number(p.restants) || 0 });
                    else if (p.raison === 'bloque') rendre({ ok: false, raison: 'bloque', attenteMs: Number(p.attenteMs) || 0 });
                    else rendre({ ok: false, raison: 'aucun-code' });
                }
            };
            ici.onclose = () => {
                setConnecte(false);
                attenteRef.current?.({ ok: false, raison: 'hors-ligne' });
                attenteRef.current = null;
                if (!fini) minuterie = setTimeout(connecter, 2000);
            };
        };
        connecter();
        return () => { fini = true; if (minuterie) clearTimeout(minuterie); socketRef.current?.close(); };
    }, []);

    const ouvrir = useCallback((code: string) => new Promise<ResultatDuCode>(rendre => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) { rendre({ ok: false, raison: 'hors-ligne' }); return; }
        attenteRef.current = rendre;
        socket.send(JSON.stringify({ type: 'verrou:ouvrir', payload: { code } }));
    }), []);

    return { connecte, codeRegle, ouvrir };
}
