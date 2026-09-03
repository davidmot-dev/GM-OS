/**
 * Le traitement d'échantillons de Voice-OS : bitcrush, distorsion, transposition.
 *
 * **Ce fichier ne fait plus que l'ordre des opérations.** La transposition, qui
 * était le gros de son code et la source de son défaut le plus audible, vit
 * désormais dans `transposition.js` — un module qui ne connaît rien à
 * `AudioWorklet` et qu'on peut donc mesurer au banc. *Ce qui décide du son doit
 * pouvoir être éprouvé sans micro.*
 *
 * L'ordre, et pourquoi : **bitcrush et distorsion AVANT la transposition.** Ce
 * sont des non-linéarités — elles fabriquent des harmoniques. Les poser après
 * la transposition les rendrait dépendantes du réglage de hauteur, et le grain
 * d'un androïde changerait selon qu'il parle grave ou aigu.
 *
 * ⛔ **L'écrêtage final était DUR** (`if (x > 1) x = 1`), ce qui fabrique de
 * l'harmonique impaire à chaque crête — le son que David décrit comme « ça
 * sature ». Genou souple au-dessus de 0,85 : transparent en dessous, borné à 1
 * au-dessus.
 */
import { Transposeur } from './transposition.js';
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
        this.transposeur = new Transposeur();

        /* Le bloc intermédiaire : entrée traitée avant transposition. */
        this.avantTransposition = new Float32Array(128);
        this.apresTransposition = new Float32Array(128);

        // Target values for parameter smoothing
        this.currentPitch = 1.0;
        this.currentDistortion = 0.0;
        this.currentBitcrush = 0.0;
        // Convergence par BLOC (128 échantillons), soit ~50 ms pour s'établir.
        this.smoothFactor = 0.05;

        /** Le genou de l'écrêtage souple. */
        this.genou = 0.85;
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

        const entree = input[0];
        const n = entree.length;

        /*
          Les blocs intermédiaires suivent la taille réelle du bloc. Elle vaut
          128 en pratique, mais la spécification ne le garantit pas — et un
          tableau trop court écrirait par-dessus rien du tout, en silence.
        */
        if (this.avantTransposition.length !== n) {
            this.avantTransposition = new Float32Array(n);
            this.apresTransposition = new Float32Array(n);
        }

        // One-pole smoothing for parameters
        const targetPitch = parameters.pitch[0];
        const targetDistortion = parameters.distortion[0];
        const targetBitcrush = parameters.bitcrush[0];

        this.currentPitch += (targetPitch - this.currentPitch) * this.smoothFactor;
        this.currentDistortion += (targetDistortion - this.currentDistortion) * this.smoothFactor;
        this.currentBitcrush += (targetBitcrush - this.currentBitcrush) * this.smoothFactor;

        const bitcrushValue = this.currentBitcrush;
        const distortionValue = this.currentDistortion;

        // 1. Bitcrush et distorsion — les non-linéarités, avant la transposition
        for (let i = 0; i < n; i++) {
            let sample = entree[i];

            if (bitcrushValue > 0) {
                const bits = Math.pow(2, (1 - bitcrushValue) * 16);
                sample = Math.round(sample * bits) / bits;
            }

            if (distortionValue > 0) {
                const k = distortionValue * 10; // Reduced multiplier for better control
                // Soft clipping function that stays within [-1, 1]
                sample = (1 + k) * sample / (1 + k * Math.abs(sample));
                // Compensation, pour que le curseur ne fasse pas aussi un volume
                sample *= (1 - (distortionValue * 0.3));
            }

            this.avantTransposition[i] = sample;
        }

        /*
          2. Transposition.

          On passe le ratio **de l'AudioParam** et non le ratio lissé ici : ce
          lissage-là n'atteint jamais exactement 1, et le transposeur ne
          contournerait donc jamais sa ligne — la voix garderait 43 ms de retard
          après un retour à l'unisson. C'est lui qui porte sa propre rampe.

          ⚠️ L'AudioParam lui-même approche l'unisson de façon exponentielle
          (`setTargetAtTime` côté moteur) : le contournement s'engage donc une
          demi-seconde environ après que le curseur est revenu à zéro. C'est
          voulu — la seule façon de l'engager pile à l'instant du relâchement
          serait de sauter la valeur, et ça claquerait.
        */
        this.transposeur.traiter(this.avantTransposition, this.apresTransposition, targetPitch);

        // 3. Sécurité, et diffusion sur toutes les voies de sortie
        for (let i = 0; i < n; i++) {
            const echantillon = this.borner(this.apresTransposition[i]);
            for (let channel = 0; channel < output.length; channel++) {
                output[channel][i] = echantillon;
            }
        }

        return true;
    }
}

registerProcessor('voice-processor', VoiceProcessor);
