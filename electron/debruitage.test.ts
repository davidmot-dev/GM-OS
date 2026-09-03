import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error — module JS chargé par le navigateur, pas compilé par Vite
import { Debruiteur, TAILLE_DE_TRAME } from '../public/audio/debruitage.js';

/**
 * **Le débruitage, éprouvé sur le VRAI modèle.**
 *
 * *Chantier demandé par David le 2026-09-03.*
 *
 * Ce fichier est dans `electron/` et non dans `src/` pour la raison habituelle
 * ici : les tests du rendu tournent avec le shim `fs` de
 * `vite-plugin-electron-renderer`, qui ne sait pas lire un fichier. Or il faut
 * lire `public/audio/rnnoise.wasm` — *un test sur une imitation de modèle ne
 * prouverait rien du modèle.*
 *
 * C'est le seul chantier de la journée dont la pièce maîtresse soit un binaire
 * de 3,4 Mo écrit par quelqu'un d'autre. Ce qui se vérifie ici, c'est donc **le
 * pilotage** : l'amorçage, l'échelle, le découpage en trames — les trois choses
 * qui, mal faites, rendent un silence parfait sans le moindre message d'erreur.
 */

const RACINE = path.resolve(__dirname, '..');
const SR = 48000;

let module: WebAssembly.Module;

beforeAll(() => {
    const binaire = fs.readFileSync(path.join(RACINE, 'public', 'audio', 'rnnoise.wasm'));
    module = new WebAssembly.Module(binaire);
});

const rms = (a: Float32Array) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / (a.length || 1));

/** Fait passer un signal par blocs de 128, comme un worklet. */
function passer(signal: Float32Array) {
    const debruiteur = new Debruiteur(module);
    const sortie = new Float32Array(signal.length);
    const bloc = 128;
    const e = new Float32Array(bloc);
    const s = new Float32Array(bloc);
    let sommeVad = 0;
    let maxVad = 0;
    let trames = 0;

    for (let i = 0; i + bloc <= signal.length; i += bloc) {
        e.set(signal.subarray(i, i + bloc));
        debruiteur.traiter(e, s);
        sortie.set(s, i);
        sommeVad += debruiteur.probabiliteDeVoix;
        maxVad = Math.max(maxVad, debruiteur.probabiliteDeVoix);
        trames++;
    }
    debruiteur.detruire();
    return { sortie, vadMoyen: sommeVad / trames, vadMax: maxVad };
}

function bruitBlanc(secondes: number, amplitude = 0.1): Float32Array {
    const n = Math.round(SR * secondes);
    const x = new Float32Array(n);
    let graine = 7;
    for (let i = 0; i < n; i++) {
        graine = (graine * 1103515245 + 12345) & 0x7fffffff;
        x[i] = (graine / 0x7fffffff * 2 - 1) * amplitude;
    }
    return x;
}

/** Une voyelle synthétique, modulée — plus proche d'une voix qu'une sinusoïde. */
function voyelle(secondes: number): Float32Array {
    const n = Math.round(SR * secondes);
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        let v = 0;
        for (let h = 1; h <= 12; h++) v += Math.sin(2 * Math.PI * 130 * h * i / SR + h) / h;
        x[i] = v * 0.25 * (0.6 + 0.4 * Math.sin(2 * Math.PI * 3 * i / SR));
    }
    return x;
}

describe('Debruiteur', () => {
    it('s’amorce — et c’est ce qui manquait à ma première tentative', () => {
        /*
          ⛔ Sans `emscripten_stack_init` et `__wasm_call_ctors`, `rnnoise_create`
          part dans `__assert_fail` depuis les entrailles du modèle. Un module
          WebAssembly n'est pas prêt parce qu'il est instancié : les tables du
          réseau sont remplies par les constructeurs statiques.
        */
        const debruiteur = new Debruiteur(module);
        expect(debruiteur.etat).toBeGreaterThan(0);
        expect(debruiteur.adresse).toBeGreaterThan(0);
        debruiteur.detruire();
    });

    it('rend autant d’échantillons qu’il en reçoit, avec UNE trame de retard', () => {
        /*
          Le découpage 128 → 480 est l'endroit où l'on perd ou duplique des
          échantillons sans que rien ne le dise. La latence doit valoir une
          trame — 10 ms — et pas une de plus.
        */
        const entree = voyelle(0.5);
        const { sortie } = passer(entree);
        expect(sortie.length).toBe(entree.length);
        expect(rms(sortie.subarray(0, TAILLE_DE_TRAME))).toBe(0);
        expect(rms(sortie.subarray(TAILLE_DE_TRAME, TAILLE_DE_TRAME * 3))).toBeGreaterThan(0);
    });

    it('efface le bruit stationnaire', () => {
        /* Mesuré : −62 dB. On exige 20, pour ne pas dépendre du modèle exact. */
        const entree = bruitBlanc(2);
        const { sortie } = passer(entree);
        const avant = rms(entree.subarray(SR / 2));
        const apres = rms(sortie.subarray(SR / 2));
        expect(20 * Math.log10((apres || 1e-12) / avant)).toBeLessThan(-20);
    });

    it('distingue la voix du bruit — la probabilité que la porte peut suivre', () => {
        /*
          La valeur qui sert vraiment : le modèle rend une probabilité de voix
          par trame. Sur du bruit seul elle reste basse ; sur une voyelle plongée
          dans du bruit, elle monte franchement.
        */
        const bruit = passer(bruitBlanc(2));
        const voix = voyelle(2);
        const melange = new Float32Array(voix.length);
        const fond = bruitBlanc(2);
        for (let i = 0; i < voix.length; i++) melange[i] = voix[i] + fond[i];
        const parle = passer(melange);

        expect(bruit.vadMoyen).toBeLessThan(0.5);
        expect(parle.vadMoyen).toBeGreaterThan(0.7);
        expect(parle.vadMoyen).toBeGreaterThan(bruit.vadMoyen * 2);
    });

    it('laisse un silence silencieux, sans souffle inventé', () => {
        const { sortie } = passer(new Float32Array(SR));
        expect(rms(sortie)).toBe(0);
    });

    it('ne sature pas, et ne rend aucun NaN', () => {
        /*
          L'échelle 16 bits est le piège de RNNoise : oublier la division au
          retour rendrait des valeurs à 32 000, qui détruiraient la chaîne. Un
          `NaN` unique, lui, empoisonne définitivement tout nœud en aval.
        */
        const voix = voyelle(1);
        const fond = bruitBlanc(1, 0.3);
        const melange = new Float32Array(voix.length);
        for (let i = 0; i < voix.length; i++) melange[i] = voix[i] + fond[i];
        const { sortie } = passer(melange);
        for (let i = 0; i < sortie.length; i++) {
            expect(Number.isFinite(sortie[i])).toBe(true);
            expect(Math.abs(sortie[i])).toBeLessThanOrEqual(2);
        }
    });

    it('se détruit deux fois sans se plaindre', () => {
        const debruiteur = new Debruiteur(module);
        debruiteur.detruire();
        expect(() => debruiteur.detruire()).not.toThrow();
    });
});
