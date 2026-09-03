import { describe, it, expect } from 'vitest';
import { Transposeur } from '../../../../public/audio/transposition.js';

/**
 * **La transposition, éprouvée au banc.**
 *
 * *Chantier demandé par David le 2026-09-03.* Le défaut de l'ancien algorithme
 * n'était pas une opinion : ses deux têtes de lecture n'étaient **jamais
 * alignées** et se sommaient sous un fondu calculé en amplitude. Mesuré, cela
 * donnait **39 à 57 % d'ondulation du niveau** sur un signal de voix, et
 * **1,7 dB perdus** au passage.
 *
 * Une ondulation se mesure : on transpose un signal tenu, on découpe la sortie
 * en fenêtres de 20 ms, et on regarde **de combien le niveau bouge**.
 *
 * ⛔ **Mais pas avec une sinusoïde.** Premier jet de ces tests : l'ancien
 * algorithme les passait tous. Une sinusoïde retardée reste la même sinusoïde,
 * donc ses deux têtes de lecture restent corrélées et le défaut ne se réveille
 * pas — 3 % d'ondulation seulement. Sur une **voyelle** (fondamentale plus douze
 * harmoniques), le même algorithme ondule de **50 %**. *Une sonde qui ne réveille
 * pas le défaut ne prouve rien, et un test tout vert peut n'être qu'une sonde mal
 * choisie.*
 *
 * Les sinusoïdes restent employées ici, mais pour ce qu'elles savent dire : la
 * **hauteur** du résultat.
 */

const SR = 48000;

/** Une sinusoïde de `duree` secondes. */
function sinus(frequence: number, duree: number): Float32Array {
    const n = Math.round(SR * duree);
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = Math.sin(2 * Math.PI * frequence * i / SR);
    return x;
}

/**
 * Une « voyelle » : une fondamentale et douze harmoniques, phases décalées.
 *
 * C'est le signal minimal qui réveille le défaut de l'ancien algorithme, et il
 * ressemble à ce que le module traite réellement — une voix tenue.
 */
function voyelle(fondamentale: number, duree: number): Float32Array {
    const n = Math.round(SR * duree);
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        let v = 0;
        for (let h = 1; h <= 12; h++) v += Math.sin(2 * Math.PI * fondamentale * h * i / SR + h) / h;
        x[i] = v * 0.25;
    }
    return x;
}

/** Le niveau RMS global d'un signal. */
function rms(signal: Float32Array): number {
    let somme = 0;
    for (let i = 0; i < signal.length; i++) somme += signal[i] * signal[i];
    return Math.sqrt(somme / signal.length);
}

/** Passe le signal dans le transposeur, par blocs de 128 comme un worklet. */
function transposer(entree: Float32Array, demiTons: number): Float32Array {
    const transposeur = new Transposeur();
    const ratio = Math.pow(2, demiTons / 12);
    const sortie = new Float32Array(entree.length);
    const bloc = 128;
    const tamponE = new Float32Array(bloc);
    const tamponS = new Float32Array(bloc);

    for (let debut = 0; debut + bloc <= entree.length; debut += bloc) {
        tamponE.set(entree.subarray(debut, debut + bloc));
        transposeur.traiter(tamponE, tamponS, ratio);
        sortie.set(tamponS, debut);
    }
    return sortie;
}

/**
 * L'énergie du signal à une fréquence donnée (Goertzel).
 *
 * Moins cher qu'une FFT et suffisant : on ne cherche pas un spectre, on compare
 * trois candidats.
 */
function energieA(signal: Float32Array, frequence: number): number {
    const w = 2 * Math.PI * frequence / SR;
    const coeff = 2 * Math.cos(w);
    let s1 = 0;
    let s2 = 0;
    for (let i = 0; i < signal.length; i++) {
        const s = signal[i] + coeff * s1 - s2;
        s2 = s1;
        s1 = s;
    }
    return Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2) / signal.length;
}

/** Les niveaux RMS par fenêtres de 20 ms. */
function niveauxParFenetre(signal: Float32Array): number[] {
    const taille = Math.round(SR * 0.02);
    const niveaux: number[] = [];
    for (let debut = 0; debut + taille <= signal.length; debut += taille) {
        let somme = 0;
        for (let i = debut; i < debut + taille; i++) somme += signal[i] * signal[i];
        niveaux.push(Math.sqrt(somme / taille));
    }
    return niveaux;
}

describe('Transposeur', () => {
    it('rend l’entrée telle quelle à l’unisson, sans un échantillon de retard', () => {
        /*
          C'est le défaut le plus visible de l'ancien : à pitch = 0, il rendait
          l'entrée avec 85 ms de retard, parce que les têtes de lecture ne
          bougeaient plus et que le fondu se figeait sur la plus lointaine.
        */
        const entree = sinus(440, 0.2);
        const sortie = transposer(entree, 0);
        for (let i = 0; i < 4096; i++) {
            expect(sortie[i]).toBeCloseTo(entree[i], 6);
        }
    });

    it('monte d’une octave : 440 Hz devient 880 Hz', () => {
        const sortie = transposer(sinus(440, 1.0), 12).subarray(SR / 2);
        const a440 = energieA(sortie, 440);
        const a880 = energieA(sortie, 880);
        expect(a880).toBeGreaterThan(a440 * 4);
    });

    it('descend d’une octave : 440 Hz devient 220 Hz', () => {
        const sortie = transposer(sinus(440, 1.0), -12).subarray(SR / 2);
        const a440 = energieA(sortie, 440);
        const a220 = energieA(sortie, 220);
        expect(a220).toBeGreaterThan(a440 * 4);
    });

    it.each([-8, -5, 4])('n’ondule pas sur une voyelle tenue (%i demi-tons)', (demiTons) => {
        /*
          Le test qui porte le chantier. Seuil à 30 % : l'ancien algorithme
          mesurait 39 à 57 % sur ce même signal, celui-ci reste sous 25 %.
        */
        const entree = voyelle(120, 2.0);
        const sortie = transposer(entree, demiTons).subarray(SR / 2);
        const niveaux = niveauxParFenetre(sortie);
        const moyenne = niveaux.reduce((a, b) => a + b, 0) / niveaux.length;
        const ondulation = (Math.max(...niveaux) - Math.min(...niveaux)) / moyenne;

        expect(ondulation).toBeLessThan(0.30);
    });

    it('rend le niveau qu’il reçoit, sans le perdre au passage', () => {
        /*
          L'ancien perdait 1,7 dB (0,181 pour 0,221) : ses deux têtes décorrélées
          s'additionnaient en puissance sous un fondu calculé en amplitude. Un
          module d'effet ne doit pas être un atténuateur silencieux.
        */
        const entree = voyelle(120, 2.0);
        const sortie = transposer(entree, -5).subarray(SR / 2);
        const attendu = rms(entree.subarray(SR / 2));
        expect(rms(sortie)).toBeGreaterThan(attendu * 0.9);
        expect(rms(sortie)).toBeLessThan(attendu * 1.1);
    });

    it('ne fabrique aucun saut d’échantillon aux recollages', () => {
        /*
          Une couture mal placée s'entend comme un clic, et un clic se mesure :
          c'est un écart entre deux échantillons voisins bien plus grand que la
          pente du signal.
        */
        const entree = voyelle(120, 2.0);
        let penteEntree = 0;
        for (let i = 1; i < entree.length; i++) {
            penteEntree = Math.max(penteEntree, Math.abs(entree[i] - entree[i - 1]));
        }

        const sortie = transposer(entree, -8).subarray(SR / 2);
        let ecartMax = 0;
        for (let i = 1; i < sortie.length; i++) {
            ecartMax = Math.max(ecartMax, Math.abs(sortie[i] - sortie[i - 1]));
        }
        /* Une transposition vers le grave ne peut que RALENTIR les pentes. */
        expect(ecartMax).toBeLessThan(penteEntree * 1.5);
    });

    it('reste borné quel que soit le ratio', () => {
        for (const demiTons of [-12, -8, -5, -1, 1, 4, 7, 12]) {
            const sortie = transposer(sinus(300, 0.5), demiTons);
            const max = sortie.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
            expect(max).toBeLessThanOrEqual(1.05);
        }
    });

    it('revient au direct quand la transposition est annulée', () => {
        const transposeur = new Transposeur();
        const entree = sinus(440, 0.5);
        const sortie = new Float32Array(entree.length);
        const bloc = 128;
        const tamponE = new Float32Array(bloc);
        const tamponS = new Float32Array(bloc);

        /* Une moitié transposée, une moitié à l'unisson. */
        for (let debut = 0; debut + bloc <= entree.length; debut += bloc) {
            tamponE.set(entree.subarray(debut, debut + bloc));
            const ratio = debut < entree.length / 2 ? Math.pow(2, -5 / 12) : 1;
            transposeur.traiter(tamponE, tamponS, ratio);
            sortie.set(tamponS, debut);
        }

        /* Passé la rampe (~43 ms), la sortie doit redevenir l'entrée. */
        const debutDuDirect = Math.round(entree.length / 2 + SR * 0.06);
        for (let i = debutDuDirect; i < debutDuDirect + 2048; i++) {
            expect(sortie[i]).toBeCloseTo(entree[i], 5);
        }
    });
});
