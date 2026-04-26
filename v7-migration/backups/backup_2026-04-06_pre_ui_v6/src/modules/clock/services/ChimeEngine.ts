/**
 * ChimeEngine.ts
 * Generates a mystical bell chime using Web Audio API.
 * Replicates the v3 logic: combining 220, 440, 660, 880, 1100 Hz.
 */

class ChimeEngine {
    private audioCtx: AudioContext | null = null;

    private initContext() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    public playChime() {
        this.initContext();
        if (!this.audioCtx) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        const frequencies = [220, 440, 660, 880, 1100];
        const duration = 4.0; // Long decay for a bell sound

        // Main gain node for the whole bell
        const masterGain = this.audioCtx.createGain();
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Long decay
        masterGain.connect(this.audioCtx.destination);

        frequencies.forEach((freq, index) => {
            const osc = this.audioCtx!.createOscillator();
            const oscGain = this.audioCtx!.createGain();

            // Lower frequencies are louder
            const volume = 1 / (index + 1);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            // Slight detune for more "mystical" character
            osc.detune.setValueAtTime(index * 2.5, now);

            oscGain.gain.setValueAtTime(volume, now);

            osc.connect(oscGain);
            oscGain.connect(masterGain);

            osc.start(now);
            osc.stop(now + duration);
        });
    }
}

export const chimeEngine = new ChimeEngine();
