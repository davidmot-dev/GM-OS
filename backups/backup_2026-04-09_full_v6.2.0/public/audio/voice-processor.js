class VoiceProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'pitch', defaultValue: 1.0, minValue: 0.5, maxValue: 2.0 },
            { name: 'distortion', defaultValue: 0.0, minValue: 0.0, maxValue: 1.0 },
            { name: 'bitcrush', defaultValue: 0.0, minValue: 0.0, maxValue: 1.0 }
        ];
    }

    constructor() {
        super();
        // Taille fixe pour le buffer circulaire
        this.bufferSize = 8192;
        this.buffer = new Float32Array(this.bufferSize);
        this.writePtr = 0;
        
        // Paramètres pour le pitch shifting professionnel (Cross-fading Delay Lines)
        this.delay1 = 0;
        this.delay2 = this.bufferSize / 2;
        this.fade = 0;
    }

    // Fonction d'interpolation linéaire pour une lecture fluide
    readLerp(ptr) {
        const floor = Math.floor(ptr);
        const frac = ptr - floor;
        const p1 = floor % this.bufferSize;
        const p2 = (floor + 1) % this.bufferSize;
        return (1 - frac) * this.buffer[p1] + frac * this.buffer[p2];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !input[0]) return true;

        const pitch = parameters.pitch[0];
        const distortion = parameters.distortion[0];
        const bitcrush = parameters.bitcrush[0];

        // Facteur de vitesse relative (si pitch > 1, on lit plus vite)
        const speed = 1.0 - pitch;

        for (let i = 0; i < input[0].length; i++) {
            let sample = input[0][i];

            // 1. Bitcrush (Lo-Fi)
            if (bitcrush > 0) {
                const bits = Math.pow(2, (1 - bitcrush) * 16);
                sample = Math.round(sample * bits) / bits;
            }

            // 2. Distortion (Waveshaping)
            if (distortion > 0) {
                const k = distortion * 50;
                sample = (1 + k) * sample / (1 + k * Math.abs(sample));
            }

            // 3. Écriture dans le buffer circulaire
            this.buffer[this.writePtr] = sample;

            // 4. Pitch Shifting (Double Délai avec Crossfade)
            // On gère deux lignes de délai déphasées de 180°
            this.delay1 = (this.delay1 + speed) % this.bufferSize;
            this.delay2 = (this.delay2 + speed) % this.bufferSize;
            if (this.delay1 < 0) this.delay1 += this.bufferSize;
            if (this.delay2 < 0) this.delay2 += this.bufferSize;

            // Calcul du crossfade triangulaire (période liée au buffer)
            const fade = Math.abs((this.delay1 / this.bufferSize) * 2 - 1);
            
            // Lecture interpolée des deux grains
            const ptr1 = (this.writePtr - this.delay1 + this.bufferSize) % this.bufferSize;
            const ptr2 = (this.writePtr - this.delay2 + this.bufferSize) % this.bufferSize;
            
            const s1 = this.readLerp(ptr1);
            const s2 = this.readLerp(ptr2);

            // Mixage final des deux grains (Crossfade)
            const finalSample = s1 * fade + s2 * (1 - fade);

            // Sortie (on duplique sur tous les canaux mono/stéréo)
            for (let channel = 0; channel < output.length; channel++) {
                output[channel][i] = finalSample;
            }

            this.writePtr = (this.writePtr + 1) % this.bufferSize;
        }

        return true;
    }
}

registerProcessor('voice-processor', VoiceProcessor);
