import { useEffect, useCallback } from 'react';
import { midiEngine } from './MidiEngine';

export const useMidiControls = () => {
    const refreshMidi = useCallback(() => {
        midiEngine.initialize();
    }, []);

    useEffect(() => {
        // Only initialize once via the singleton
        midiEngine.initialize();

        // Note: We don't cleanup globally in the hook because 
        // multiple hooks might be mounted. The engine handles itself.
        // However, if we wanted absolute safety, we could use a ref counter
        // but for GM-OS, the SoundDashboard mount/unmount is enough.
    }, []);

    return { refreshMidi };
};
