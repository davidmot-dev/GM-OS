import { useEffect } from 'react';
import { useMusicStore } from './useMusicStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { padDuRaccourci } from './logic/playlistsDeLaCampagne';
import { estUneFrappeDePastille } from '../../utils/frappeDePastille';

export const useMusicKeyboardControls = () => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            /*
              La garde est partagée avec Sound-OS, qui portait la même à
              l'identique. Elle écarte maintenant les frappes tenues avec Ctrl,
              Alt ou Cmd : `e.code` ignore les modificateurs, donc `Ctrl+C`
              produisait `KeyC` et lançait la pastille liée à la touche C.
            */
            if (!estUneFrappeDePastille(e)) return;

            const currentState = useMusicStore.getState();
            const keyCode = e.code; // e.g., "KeyA", "Numpad1"

            // Key Learn Mode
            if (currentState.isKeyLearnActive && currentState.activePadLearnInfo) {
                e.preventDefault();
                console.log(`[KEY] Learning mode (Music): Mapping '${keyCode}' to pad at index ${currentState.activePadLearnInfo.padIndex}`);
                currentState.updatePad(currentState.activePadLearnInfo.playlistId, currentState.activePadLearnInfo.padIndex, { keybind: keyCode });
                currentState.toggleKeyLearn();
                currentState.setActiveLearnPad(null, null);
                return;
            }

            /*
              **Le clavier voit exactement ce que l'écran montre.**

              Il cherchait dans TOUTES les playlists, ce qui n'avait aucune
              conséquence tant que la bibliothèque était unique. Depuis que les
              atmosphères appartiennent à une campagne (2026-08-30), c'était le
              dernier chemin non cloisonné : deux campagnes attribuent
              naturellement `Numpad1` à leur ambiance d'ouverture, et la
              première trouvée l'emportait — celle qu'on ne joue pas.

              *Le filtre est le même objet que celui de l'écran.* Deux filtres
              écrits séparément finiraient par diverger, et l'écart ne se
              verrait qu'en séance, quand rien ne se rattrape.
            */
            const { activeCampaignId, campaigns } = useSessionOSStore.getState();
            const targetPad = padDuRaccourci(
                currentState.playlists,
                activeCampaignId,
                keyCode,
                campaigns.map(c => c.id),
            );

            if (targetPad) {
                e.preventDefault();
                currentState.playPad(targetPad);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
};
