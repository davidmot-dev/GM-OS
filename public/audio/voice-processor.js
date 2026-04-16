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
        this.bufferSize = 8192;
        this.buffer = new Float32Array(this.bufferSize);
        this.writePtr = 0;
        
        this.delay1 = 0;
        this.delay2 = this.bufferSize / 2;
        
        // Target values for parameter smoothing
        this.currentPitch = 1.0;
        this.currentDistortion = 0.0;
        this.currentBitcrush = 0.0;
        this.smoothFactor = 0.05; // ~5% convergence per frame (approx 3ms delay)
    }

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

        // One-pole smoothing for parameters
        const targetPitch = parameters.pitch[0];
        const targetDistortion = parameters.distortion[0];
        const targetBitcrush = parameters.bitcrush[0];

        // Process loop with parameter interpolation (simplified per-block)
        this.currentPitch += (targetPitch - this.currentPitch) * this.smoothFactor;
        this.currentDistortion += (targetDistortion - this.currentDistortion) * this.smoothFactor;
        this.currentBitcrush += (targetBitcrush - this.currentBitcrush) * this.smoothFactor;

        const speed = 1.0 - this.currentPitch;
        const bitcrushValue = this.currentBitcrush;
        const distortionValue = this.currentDistortion;

        for (let i = 0; i < input[0].length; i++) {
            let sample = input[0][i];

            // 1. Bitcrush (Lo-Fi)
            if (bitcrushValue > 0) {
                const bits = Math.pow(2, (1 - bitcrushValue) * 16);
                sample = Math.round(sample * bits) / bits;
            }

            // 2. Optimized Normalized Distortion (Waveshaper)
            if (distortionValue > 0) {
                const k = distortionValue * 10; // Reduced multiplier for better control
                // Soft clipping function that stays within [-1, 1]
                sample = (1 + k) * sample / (1 + k * Math.abs(sample));
                // Optional: Output gain compensation to avoid perceived volume jump
                sample *= (1 - (distortionValue * 0.3)); 
            }

            // 3. Circular Buffer Write
            this.buffer[this.writePtr] = sample;

            // 4. Pitch Shifting (Double Delay with Sinusoidal Crossfade)
            this.delay1 = (this.delay1 + speed) % this.bufferSize;
            this.delay2 = (this.delay2 + speed) % this.bufferSize;
            if (this.delay1 < 0) this.delay1 += this.bufferSize;
            if (this.delay2 < 0) this.delay2 += this.bufferSize;

            // Equal-power crossfade (more transparent than linear/triangular)
            const phase = this.delay1 / this.bufferSize;
            const fade = Math.sin(phase * Math.PI);
            
            const ptr1 = (this.writePtr - this.delay1 + this.bufferSize) % this.bufferSize;
            const ptr2 = (this.writePtr - this.delay2 + this.bufferSize) % this.bufferSize;
            
            const s1 = this.readLerp(ptr1);
            const s2 = this.readLerp(ptr2);

            let finalSample = (s1 * fade) + (s2 * (1 - fade));

            // 5. Digital Safety (Hard Clipping)
            if (finalSample > 1.0) finalSample = 1.0;
            if (finalSample < -1.0) finalSample = -1.0;

            // Output Routing
            for (let channel = 0; channel < output.length; channel++) {
                output[channel][i] = finalSample;
            }

            this.writePtr = (this.writePtr + 1) % this.bufferSize;
        }

        return true;
    }
}

registerProcessor('voice-processor', VoiceProcessor);
