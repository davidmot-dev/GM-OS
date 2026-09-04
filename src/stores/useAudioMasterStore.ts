import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioMasterState {
    masterVolume: number;
    /**
     * Le niveau d'avant la coupure, pour le rendre au retour.
     *
     * Le bouton basculait entre 0 et **1** : une table réglée à 40 %
     * repartait à fond après un aller-retour. *Une coupure qui ne se défait
     * pas à l'identique n'est pas une coupure, c'est un réglage.*
     */
    volumeAvantCoupure: number;
    isFocusMode: boolean;
    focusDuckingRatio: number;
    
    setMasterVolume: (volume: number) => void;
    /** Coupe le son, ou rend le niveau d'avant. */
    basculerLaCoupure: () => void;
    toggleFocusMode: () => void;
    setFocusDuckingRatio: (ratio: number) => void;
    getBackupData: () => {
        masterVolume: number;
        isFocusMode: boolean;
        focusDuckingRatio: number;
    };
}

export const useAudioMasterStore = create<AudioMasterState>()(
    persist(
        (set, get) => ({
            masterVolume: 1.0,
            volumeAvantCoupure: 1.0,
            isFocusMode: false,
            focusDuckingRatio: 0.1,

            setMasterVolume: (masterVolume) => set({ masterVolume }),

            basculerLaCoupure: () => set((etat) => {
                if (etat.masterVolume > 0) {
                    return { volumeAvantCoupure: etat.masterVolume, masterVolume: 0 };
                }
                /*
                  Un niveau retenu à zéro rendrait la coupure irréversible — il
                  suffit d'avoir baissé le curseur à fond avant de cliquer. On
                  remonte alors à plein, comme avant.
                */
                return { masterVolume: etat.volumeAvantCoupure > 0 ? etat.volumeAvantCoupure : 1 };
            }),
            toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
            setFocusDuckingRatio: (focusDuckingRatio) => set({ focusDuckingRatio }),
            getBackupData: () => ({
                masterVolume: get().masterVolume,
                isFocusMode: get().isFocusMode,
                focusDuckingRatio: get().focusDuckingRatio
            })
        }),
        {
            name: 'gm-os-audio-master-storage',
        }
    )
);
