import { useCallback, useEffect, useState } from 'react';

/**
 * **Le plein écran au premier toucher** — les trois rôles de la Fire HD 8 (registre § 256), demandé
 * par David le 15/11/2026 : « est-ce qu'on peut avoir le tout en full screen ? ».
 *
 * Un navigateur n'accorde le plein écran qu'après un geste de l'utilisateur : on le demande donc au
 * premier toucher, sans empêcher ce toucher de faire son effet (`demander` ne bloque rien). Refusé ou
 * absent (vieux moteur, iPhone), rien ne change. Android garde un geste pour en sortir (balayer du
 * haut, puis Retour) ; le toucher suivant y revient.
 */
export function usePleinEcranAuToucher() {
    const [pleinEcran, setPleinEcran] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
    useEffect(() => {
        const suivre = () => setPleinEcran(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', suivre);
        return () => document.removeEventListener('fullscreenchange', suivre);
    }, []);
    const demander = useCallback(() => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    }, []);
    return { pleinEcran, demander };
}
