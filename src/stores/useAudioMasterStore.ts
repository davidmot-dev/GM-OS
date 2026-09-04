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
    /*
      **Il n'y a pas de `getBackupData` ici, et c'est voulu** (point A10,
      2026-09-05). Il en existait un — sans aucun appelant, donc le bandeau
      n'était dans aucune sauvegarde. La tentation était de le brancher ; c'est
      l'inverse qu'il fallait faire.

      *Le volume général, le Focus et le tamisage décrivent une pièce, pas un
      univers.* Restaurer sur une autre machine le volume réglé pour les
      enceintes d'ici n'aurait aucun sens — c'est exactement la raison pour
      laquelle Music-OS ne sauvegarde que ses playlists et jamais sa sortie
      audio, tranchée le 2026-08-30.

      Ces trois valeurs sont persistées localement, ce qui est le bon niveau :
      elles survivent à un redémarrage et ne voyagent pas.
    */
}

export const useAudioMasterStore = create<AudioMasterState>()(
    persist(
        (set) => ({
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
        }),
        {
            name: 'gm-os-audio-master-storage',
        }
    )
);
