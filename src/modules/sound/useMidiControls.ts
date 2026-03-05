import { useEffect, useRef } from 'react';
import { useSoundStore } from './useSoundStore';
import { soundEngine } from './SoundEngine';

export const useMidiControls = () => {
    // We don't need store here if we use getState() below.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const midiAccess = useRef<any>(null);

    // Separated from useEffect to always have the latest store state without recreating MIDI listeners
    const handleMidiSignal = (midiNote: number) => {
        const currentState = useSoundStore.getState();

        console.log(`[MIDI] Note On received: ${midiNote}`);

        // Learn Mode
        if (currentState.isMidiLearnActive && currentState.activePadLearnId) {
            console.log(`[MIDI] Learning mode: Mapping ${midiNote} to pad ${currentState.activePadLearnId}`);
            currentState.setPadMidiMapping(currentState.activePadLearnId, midiNote);
            currentState.toggleMidiLearn(); // Turn off learn mode after mapping one key
            currentState.setActiveLearnPad(null);
            return;
        }

        // Playback Mode
        // Find which pad has this midi mapping
        const padToTrigger = Object.values(currentState.pads).find(p => p.midiMapping === midiNote);

        if (padToTrigger && padToTrigger.filePath) {
            if (padToTrigger.isActive) {
                soundEngine.stop(padToTrigger.id);
                currentState.setPadActive(padToTrigger.id, false);
            } else {
                currentState.setPadActive(padToTrigger.id, true);
                soundEngine.play(padToTrigger.id, padToTrigger.volume, () => {
                    currentState.setPadActive(padToTrigger.id, false);
                });
            }
        }
    };

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onMIDISuccess = (access: any) => {
            midiAccess.current = access;
            console.log('[MIDI] MIDI Access granted.');

            const inputs = access.inputs.values();
            for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
                input.value.onmidimessage = onMIDIMessage;
            }

            // Listen for device connections/disconnections
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            access.onstatechange = (event: any) => {
                const port = event.port;
                if (port.type === 'input') {
                    if (port.state === 'connected') {
                        console.log(`[MIDI] Device connected: ${port.name}`);
                        port.onmidimessage = onMIDIMessage;
                    } else if (port.state === 'disconnected') {
                        console.log(`[MIDI] Device disconnected: ${port.name}`);
                    }
                }
            };
        };

        const onMIDIFailure = (msg: string) => {
            console.error('[MIDI] Failed to get MIDI access:', msg);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onMIDIMessage = (event: any) => {
            const [status, data1, data2] = event.data;
            const command = status >> 4;
            // status >> 4 == 9 is NoteOn, data2 > 0 check for velocity
            const isNoteOn = command === 9 && data2 > 0;

            if (isNoteOn) {
                handleMidiSignal(data1);
            }
        };

        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
        } else {
            console.warn('[MIDI] WebMIDI API not supported by this browser.');
        }

        return () => {
            if (midiAccess.current) {
                const inputs = midiAccess.current.inputs.values();
                for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
                    input.value.onmidimessage = null;
                }
            }
        };
    }, []);
};
