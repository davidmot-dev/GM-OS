import { useEffect } from 'react';
import { useHardwareStore } from '../stores/useHardwareStore';
import { oublierLesAbsences } from '../utils/poserLaSortie';

/**
 * **Rebrancher une enceinte en pleine séance doit suffire.**
 *
 * Le démarrage recense le matériel une fois (`BootstrapService`, étape
 * « Matériel de table »). Sans ce crochet, une enceinte branchée **après**
 * resterait inconnue jusqu'au prochain lancement : ses alias ne seraient pas
 * reclassés, et une sortie qu'on vient de reconnecter continuerait d'être
 * déclarée disparue. *Un correctif qui demande un redémarrage n'en est pas un
 * pendant qu'on joue.*
 *
 * ⚠️ **Et l'oubli des absences signalées compte autant que le recensement.**
 * `poserLaSortie` ne prévient qu'une fois par appareil, pour ne pas noyer la
 * soirée sous les bulles ; si l'enceinte revient et repart, le meneur doit être
 * prévenu à nouveau.
 *
 * Fenêtre du MJ seulement : c'est la seule qui route du son vers des enceintes.
 */
export function useMaterielDeTable(isMainPC: boolean): void {
    useEffect(() => {
        if (!isMainPC || !navigator.mediaDevices?.addEventListener) return;

        const relever = () => {
            oublierLesAbsences();
            void useHardwareStore.getState().recenserLeMateriel();
        };

        navigator.mediaDevices.addEventListener('devicechange', relever);
        return () => navigator.mediaDevices.removeEventListener('devicechange', relever);
    }, [isMainPC]);
}
