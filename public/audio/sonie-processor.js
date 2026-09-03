import { MesureDeSonie } from './sonie.js';

/**
 * **La sonde de sonie d'une platine.**
 *
 * *Chantier du 2026-09-03.* Elle est **transparente** : elle recopie ce qu'elle
 * reçoit et mesure au passage. Aucun réglage ne dépend d'elle, ce qui est le
 * seul moyen d'avoir le droit de la laisser branchée en permanence.
 *
 * **Elle se place AVANT le gain de normalisation**, sinon elle mesurerait le
 * résultat de sa propre correction — une boucle qui converge vers n'importe
 * quoi. *On mesure le morceau, pas ce qu'on en a fait* (la même leçon que le
 * détecteur de Voice-OS, le même jour).
 *
 * La mesure part vers la fenêtre **une fois par seconde**, et seulement quand
 * elle a de quoi conclure. La norme demande 400 ms de matière et deux portes :
 * c'est `sonie.js` qui les applique, et il rend `null` tant qu'il ne sait pas.
 */
class SonieProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.canaux = options?.processorOptions?.canaux || 2;
        this.mesure = new MesureDeSonie(sampleRate, this.canaux);
        this.dernierEnvoi = 0;
        this.piste = options?.processorOptions?.piste || null;

        this.port.onmessage = (evenement) => {
            const message = evenement.data;
            if (!message) return;
            /*
              Changer de piste REMET la mesure à zéro. Sans quoi la sonie du
              morceau suivant serait moyennée avec celle du précédent — et
              l'erreur serait invisible, juste un peu fausse.
            */
            if (message.type === 'piste') {
                this.piste = message.piste;
                this.mesure = new MesureDeSonie(sampleRate, this.canaux);
                this.dernierEnvoi = currentTime;
            }
        };
    }

    process(inputs, outputs) {
        const entrees = inputs[0];
        const sorties = outputs[0];
        if (!entrees || !entrees.length || !sorties || !sorties.length) return true;

        for (let c = 0; c < sorties.length; c++) {
            const source = entrees[c] || entrees[0];
            if (source) sorties[c].set(source);
        }

        if (this.piste) {
            this.mesure.ajouter(entrees);

            if (currentTime - this.dernierEnvoi > 1) {
                this.dernierEnvoi = currentTime;
                const lufs = this.mesure.lufs();
                if (lufs !== null) {
                    this.port.postMessage({ type: 'sonie', piste: this.piste, lufs, blocs: this.mesure.nbBlocs });
                }
            }
        }

        return true;
    }
}

registerProcessor('sonie-processor', SonieProcessor);
