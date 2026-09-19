import { useSoundStore } from './useSoundStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { atmosphereDuClavier } from './logic/atmospheresDeLaCampagne';
import { soundController } from './SoundController';
import type { SoundPad } from './useSoundStore';
import { estUneFrappeDePastille } from '../../utils/frappeDePastille';

export class KeyboardEngine {
    private static instance: KeyboardEngine;
    private initialized: boolean = false;

    private constructor() {}

    public static getInstance(): KeyboardEngine {
        if (!KeyboardEngine.instance) {
            KeyboardEngine.instance = new KeyboardEngine();
        }
        return KeyboardEngine.instance;
    }

    public initialize() {
        if (this.initialized) return;

        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.initialized = true;
        console.log('[KEY] Keyboard Engine initialized.');
    }

    private handleKeyDown(e: KeyboardEvent) {
        /*
          La garde vit dans `estUneFrappeDePastille` — la même que celle de
          Music-OS, qui la recopiait. Elle écarte désormais aussi les frappes
          tenues avec Ctrl, Alt ou Cmd : `e.code` ignore les modificateurs, donc
          `Ctrl+C` produisait `KeyC` et **lançait le son lié à la touche C**.
        */
        if (!estUneFrappeDePastille(e)) return;

        const currentState = useSoundStore.getState();
        /*
          ⛔ **Le repli était `atmospheres[0]`** — la première de la liste brute,
          qui depuis le 2026-09-19 peut appartenir à une **autre campagne**. Une
          touche aurait alors lancé un bruitage d'ailleurs, devant les joueurs,
          et l'écran n'aurait rien montré d'anormal puisque les onglets, eux,
          sont filtrés. *Un repli qui ignore le cloisonnement le perce aussi
          sûrement qu'une boucle.*

          ⭐ Ce moteur ne lit que l'atmosphère **active** — il n'a donc jamais eu
          le défaut que Music-OS a payé en août, où le clavier parcourait toutes
          les playlists. Il n'avait que celui-ci.
        */
        const { activeCampaignId, campaigns } = useSessionOSStore.getState();
        const activeAtmos = atmosphereDuClavier(
            currentState.atmospheres,
            activeCampaignId,
            currentState.activeAtmosphereId,
            campaigns.map(c => c.id),
        );
        if (!activeAtmos) return;
        const keyCode = e.code; // e.g. "KeyA", "Numpad1", "Digit2"

        // Learn Mode
        if (currentState.isKeyLearnActive && currentState.activePadLearnId) {
            e.preventDefault();
            console.log(`[KEY] Learning mode: Mapping '${keyCode}' to pad ${currentState.activePadLearnId}`);
            currentState.setPadKeyMapping(currentState.activePadLearnId, keyCode);
            currentState.toggleKeyLearn(); 
            currentState.setActiveLearnPad(null);
            return;
        }

        // Playback Mode
        const padToTrigger = Object.values(activeAtmos.pads).find((p: SoundPad) => p.keyMapping === keyCode);

        if (padToTrigger) {
            e.preventDefault(); 
            console.log(`[KEY] Triggering pad: ${padToTrigger.title} (Key ${keyCode})`);
            soundController.togglePad(padToTrigger.id);
        }
    }

    public cleanup() {
        // Note: Removing anonymous arrow functions is tricky. 
        // In this architecture, the engine lives for the session.
        this.initialized = false;
    }
}

export const keyboardEngine = KeyboardEngine.getInstance();
