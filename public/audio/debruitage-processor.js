import { Debruiteur, TAILLE_DE_TRAME } from './debruitage.js';

/**
 * **Le nœud de débruitage, sur le fil audio.**
 *
 * *Chantier du 2026-09-03.* Il se place **avant tout le reste** de la chaîne :
 * avant le coupe-bas, donc avant le détecteur qui décide de la porte, du ducking
 * et de la lumière. *Ce qui décide doit décider sur le signal propre.*
 *
 * Trois choix qui méritent leur ligne :
 *
 * - **Le module wasm arrive déjà compilé**, par `processorOptions`. Un worklet
 *   ne peut ni `fetch` ni attendre : c'est la fenêtre qui télécharge et compile,
 *   et le processeur n'a plus qu'à instancier — ce qui est synchrone.
 * - **Un échec ne fait pas taire le micro.** Si l'instanciation rate, le nœud
 *   devient un fil droit et le dit par son port. *Un débruiteur en panne doit
 *   laisser passer la voix, pas la retenir.*
 * - **L'interrupteur passe par un message**, pas par un remontage de la chaîne :
 *   couper le débruitage en pleine partie ne doit pas coûter un blanc.
 */
class DebruitageProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();

        this.debruiteur = null;
        this.actif = options?.processorOptions?.actif !== false;

        try {
            this.debruiteur = new Debruiteur(options.processorOptions.module);
            this.port.postMessage({ type: 'pret', trame: TAILLE_DE_TRAME });
        } catch (erreur) {
            this.port.postMessage({ type: 'echec', message: String(erreur && erreur.message || erreur) });
        }

        this.port.onmessage = (evenement) => {
            const message = evenement.data;
            if (message && message.type === 'actif') this.actif = !!message.valeur;
        };

        /** Quand la dernière probabilité de voix a été envoyée, en secondes. */
        this.dernierEnvoi = 0;
    }

    process(inputs, outputs) {
        const entrees = inputs[0];
        const sorties = outputs[0];
        if (!entrees || !entrees[0] || !sorties || !sorties[0]) return true;

        const entree = entrees[0];
        const premiere = sorties[0];

        if (this.actif && this.debruiteur) {
            this.debruiteur.traiter(entree, premiere);

            /*
              La probabilité de voix part vers la fenêtre **dix fois par
              seconde**. Le modèle en produit cent : les envoyer toutes
              saturerait le port pour une valeur qui sert à tenir une porte, pas
              à dessiner une courbe.
            */
            if (currentTime - this.dernierEnvoi > 0.1) {
                this.dernierEnvoi = currentTime;
                this.port.postMessage({ type: 'voix', valeur: this.debruiteur.probabiliteDeVoix });
            }
        } else {
            premiere.set(entree);
        }

        /* Mono en entrée, mais on remplit ce qu'on nous donne. */
        for (let canal = 1; canal < sorties.length; canal++) sorties[canal].set(premiere);

        return true;
    }
}

registerProcessor('debruitage-processor', DebruitageProcessor);
