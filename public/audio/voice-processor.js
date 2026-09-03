/**
 * Le traitement d'échantillons de Voice-OS : bitcrush, distorsion, transposition.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX DÉFAUTS CORRIGÉS LE 2026-09-03 — « ça sature » et « je ne suis pas
 * content du résultat »
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **1. La ligne de transposition était traversée même sans transposition.**
 * À pitch = 0 demi-ton, le multiplicateur vaut 1, donc `speed` vaut 0, donc les
 * deux têtes de lecture ne bougent plus : le fondu se figeait sur la seconde,
 * qui lit **4 096 échantillons en arrière**. Le preset « voix claire » sortait
 * donc avec **85 ms de retard, pour rien** — un retour casque inutilisable et
 * une voix décalée sur les enceintes. La ligne est maintenant **contournée**
 * quand aucune transposition n'est demandée.
 *
 * **2. L'écrêtage était dur.** `if (x > 1) x = 1` fabrique de l'harmonique
 * impaire à chaque crête : c'est exactement le son que David décrit comme « ça
 * sature ». Remplacé par un genou souple au-dessus de 0,85 — transparent en
 * dessous, borné à 1 au-dessus, et sans le grain d'un écrêtage franc.
 *
 * ⚠️ **Ce que ce fichier ne corrige PAS.** La transposition reste un
 * *délai à deux têtes* : par construction, il module l'amplitude et peigne le
 * spectre dès qu'on s'éloigne de l'unisson. C'est ce qui donne le chuintement
 * des voix de PNJ très transposées. Le corriger demande un autre algorithme
 * (vocodeur de phase ou WSOLA), pas un réglage — *c'est un chantier, pas une
 * rustine.*
 */
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
        // Convergence par BLOC (128 échantillons), soit ~50 ms pour s'établir.
        this.smoothFactor = 0.05;

        /**
         * Où l'on en est entre le son direct (0) et la ligne transposée (1).
         *
         * Une bascule sèche entre les deux ferait claquer : on passerait d'un
         * échantillon courant à un échantillon vieux de 85 ms. D'où une rampe,
         * franchie en ~43 ms — assez lente pour être inaudible, assez rapide
         * pour que le curseur réponde.
         */
        this.melange = 0;
        this.pasDeMelange = 1 / 2048;

        /** En dessous de ce seuil, on considère qu'aucune transposition n'est demandée. */
        this.seuilDUnisson = 0.001;

        /** Le genou de l'écrêtage souple. */
        this.genou = 0.85;
    }

    readLerp(ptr) {
        const floor = Math.floor(ptr);
        const frac = ptr - floor;
        const p1 = floor % this.bufferSize;
        const p2 = (floor + 1) % this.bufferSize;
        return (1 - frac) * this.buffer[p1] + frac * this.buffer[p2];
    }

    /**
     * Borne l'échantillon sans le faire grincer.
     *
     * Transparent sous le genou, asymptotique à 1 au-dessus : les crêtes sont
     * arrondies au lieu d'être coupées. *Un limiteur s'entend d'autant moins
     * qu'il ne travaille que sur ce qui dépasse.*
     */
    borner(sample) {
        const abs = Math.abs(sample);
        if (abs <= this.genou) return sample;
        const marge = 1 - this.genou;
        const excedent = Math.tanh((abs - this.genou) / marge) * marge;
        return Math.sign(sample) * (this.genou + excedent);
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !input[0]) return true;

        // One-pole smoothing for parameters
        const targetPitch = parameters.pitch[0];
        const targetDistortion = parameters.distortion[0];
        const targetBitcrush = parameters.bitcrush[0];

        this.currentPitch += (targetPitch - this.currentPitch) * this.smoothFactor;
        this.currentDistortion += (targetDistortion - this.currentDistortion) * this.smoothFactor;
        this.currentBitcrush += (targetBitcrush - this.currentBitcrush) * this.smoothFactor;

        const speed = 1.0 - this.currentPitch;
        const bitcrushValue = this.currentBitcrush;
        const distortionValue = this.currentDistortion;

        /*
          La cible du mélange : la ligne transposée seulement si le meneur
          demande vraiment une transposition. On regarde la valeur DEMANDÉE et
          non la valeur lissée — sinon le retour à l'unisson resterait coincé
          sur la ligne, le lissage n'atteignant jamais exactement 1.
        */
        const cibleDeMelange = Math.abs(targetPitch - 1) > this.seuilDUnisson ? 1 : 0;

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

            // 4. Rampe entre le direct et la ligne transposée
            if (this.melange < cibleDeMelange) {
                this.melange = Math.min(cibleDeMelange, this.melange + this.pasDeMelange);
            } else if (this.melange > cibleDeMelange) {
                this.melange = Math.max(cibleDeMelange, this.melange - this.pasDeMelange);
            }

            let finalSample = sample;

            if (this.melange > 0) {
                // 5. Pitch Shifting (Double Delay with Sinusoidal Crossfade)
                this.delay1 = (this.delay1 + speed) % this.bufferSize;
                this.delay2 = (this.delay2 + speed) % this.bufferSize;
                if (this.delay1 < 0) this.delay1 += this.bufferSize;
                if (this.delay2 < 0) this.delay2 += this.bufferSize;

                /*
                  Chaque tête est muette à SA discontinuité : la première quand
                  son délai repasse par zéro, la seconde une demi-mémoire plus
                  loin. C'est ce qui masque le saut de lecture.
                */
                const phase = this.delay1 / this.bufferSize;
                const fade = Math.sin(phase * Math.PI);

                const ptr1 = (this.writePtr - this.delay1 + this.bufferSize) % this.bufferSize;
                const ptr2 = (this.writePtr - this.delay2 + this.bufferSize) % this.bufferSize;

                const transpose = (this.readLerp(ptr1) * fade) + (this.readLerp(ptr2) * (1 - fade));
                finalSample = (transpose * this.melange) + (sample * (1 - this.melange));
            } else {
                /*
                  Contournement : les têtes suivent l'écriture, de sorte qu'un
                  retour de la transposition reparte d'un délai nul et non d'un
                  point quelconque de la mémoire.
                */
                this.delay1 = 0;
                this.delay2 = this.bufferSize / 2;
            }

            // 6. Digital Safety (Soft Knee)
            finalSample = this.borner(finalSample);

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
