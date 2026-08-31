import { useEffect, useState } from 'react';

/**
 * **Les sorties audio de la machine, telles qu'on peut les proposer au meneur.**
 *
 * Trois modules énuméraient déjà les mêmes appareils, chacun dans son tableau de
 * bord. Le storyboard en a besoin **trois fois de plus** — musique, son,
 * ambiance —, et six copies du même `enumerateDevices` auraient fini par
 * diverger sur le détail qui compte : *se rafraîchir quand on branche un
 * casque*.
 *
 * L'écoute de `devicechange` est ici, une fois pour toutes.
 */
export function useSortiesAudioDisponibles(): MediaDeviceInfo[] {
    const [sorties, setSorties] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        // Un rendu hors navigateur complet — ou un test — ne doit rien casser.
        if (!navigator.mediaDevices?.enumerateDevices) return;

        let vivant = true;
        const relever = async () => {
            try {
                const appareils = await navigator.mediaDevices.enumerateDevices();
                if (vivant) setSorties(appareils.filter(a => a.kind === 'audiooutput'));
            } catch (e) {
                console.error('[SortiesAudio] énumération impossible :', e);
            }
        };

        void relever();
        navigator.mediaDevices.addEventListener?.('devicechange', relever);
        return () => {
            vivant = false;
            navigator.mediaDevices.removeEventListener?.('devicechange', relever);
        };
    }, []);

    return sorties;
}
