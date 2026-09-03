import { describe, it, expect } from 'vitest';
import {
    coefficientsK, gainDeNormalisation, MesureDeSonie,
} from '../../../../public/audio/sonie.js';

/**
 * **La mesure de sonie, éprouvée contre la norme elle-même.**
 *
 * *Chantier demandé par David le 2026-09-03.*
 *
 * Une mesure de niveau est le genre de code qui peut être **faux de 3 dB sans
 * que rien ne le dise** : les morceaux seraient tous alignés, mais alignés à
 * côté, et incomparables à ceux de n'importe quel autre outil. D'où la forme de
 * ces tests — on ne vérifie pas « ça marche », on vérifie **des valeurs que la
 * norme publie** et **des invariants qu'aucune implémentation correcte ne peut
 * violer** : +6 dB rendent +6 LUFS, un canal de plus en rend +3,01.
 */

const SR = 48000;

/** Les coefficients publiés par ITU-R BS.1770 pour 48 kHz. */
const TABLE_48K = {
    etage1: {
        b0: 1.53512485958697, b1: -2.69169618940638, b2: 1.19839281085285,
        a1: -1.69065929318241, a2: 0.73248077421585,
    },
    etage2: { b0: 1, b1: -2, b2: 1, a1: -1.99004745483398, a2: 0.99007225036621 },
};

/** Mesure une sinusoïde tenue. */
function mesurerSinus(frequence: number, amplitude: number, secondes: number, canaux = 2): number {
    const mesure = new MesureDeSonie(SR, canaux);
    const total = Math.round(SR * secondes);
    const bloc = 1024;
    for (let i = 0; i + bloc <= total; i += bloc) {
        const trames: Float32Array[] = [];
        for (let c = 0; c < canaux; c++) {
            const a = new Float32Array(bloc);
            for (let j = 0; j < bloc; j++) a[j] = Math.sin(2 * Math.PI * frequence * (i + j) / SR) * amplitude;
            trames.push(a);
        }
        mesure.ajouter(trames);
    }
    const lufs = mesure.lufs();
    expect(lufs).not.toBeNull();
    return lufs as number;
}

describe('coefficientsK', () => {
    it('reproduit la table de la norme à 48 kHz, au bit près', () => {
        /*
          ⛔ Première tentative avec la forme classique des filtres audio
          (sinus/cosinus) : 1,5293 au lieu de 1,5351. Invisible à l'oreille,
          mais la mesure n'aurait plus été comparable à celle d'un autre outil.
          La transformation bilinéaire en `tan` retombe exactement dessus.
        */
        const calcules = coefficientsK(48000);
        for (const etage of ['etage1', 'etage2'] as const) {
            for (const cle of ['b0', 'b1', 'b2', 'a1', 'a2'] as const) {
                expect(calcules[etage][cle]).toBeCloseTo(TABLE_48K[etage][cle], 10);
            }
        }
    });

    it('suit le taux d’échantillonnage au lieu de recopier la table', () => {
        /*
          Une carte son à 44,1 kHz existe, et Music-OS n'impose pas son taux.
          Recopier les coefficients de 48 kHz décalerait les deux filtres de 9 %.
        */
        const a = coefficientsK(44100);
        const b = coefficientsK(48000);
        expect(a.etage1.b0).not.toBeCloseTo(b.etage1.b0, 4);
        expect(a.etage2.a1).not.toBeCloseTo(b.etage2.a1, 4);
    });
});

describe('MesureDeSonie', () => {
    it('mesure −20 LUFS sur la référence de la norme (1 kHz, −20 dBFS, stéréo)', () => {
        expect(mesurerSinus(1000, 0.1, 3)).toBeCloseTo(-20, 0);
    });

    it('rend +6 LUFS quand on double l’amplitude', () => {
        const bas = mesurerSinus(1000, 0.1, 3);
        const haut = mesurerSinus(1000, 0.2, 3);
        expect(haut - bas).toBeCloseTo(6.02, 1);
    });

    it('rend +3,01 LUFS pour un canal identique de plus', () => {
        /* Les deux canaux s'additionnent en puissance : c'est la somme, pas la moyenne. */
        const mono = mesurerSinus(1000, 0.1, 3, 1);
        const stereo = mesurerSinus(1000, 0.1, 3, 2);
        expect(stereo - mono).toBeCloseTo(3.01, 1);
    });

    it('pondère comme l’oreille : le grave compte moins, l’aigu davantage', () => {
        const grave = mesurerSinus(40, 0.1, 3);
        const median = mesurerSinus(1000, 0.1, 3);
        const aigu = mesurerSinus(5000, 0.1, 3);
        expect(grave).toBeLessThan(median - 4);
        expect(aigu).toBeGreaterThan(median + 2);
    });

    it('⭐ ignore un long silence en tête — la porte qui évite un +10 dB absurde', () => {
        /*
          Le cas qui décide de l'utilité de tout ce module : un morceau qui
          commence par dix secondes de silence. Sans les portes de la norme, sa
          moyenne serait ridicule et on le pousserait de plusieurs décibels.
        */
        const bloc = 1024;
        const silencieux = new MesureDeSonie(SR, 2);
        const franc = new MesureDeSonie(SR, 2);
        const silence = [new Float32Array(bloc), new Float32Array(bloc)];

        for (let i = 0; i < Math.round(SR * 10 / bloc); i++) silencieux.ajouter(silence);

        for (const mesure of [silencieux, franc]) {
            for (let i = 0; i < Math.round(SR * 5 / bloc); i++) {
                const trames: Float32Array[] = [];
                for (let c = 0; c < 2; c++) {
                    const a = new Float32Array(bloc);
                    for (let j = 0; j < bloc; j++) a[j] = Math.sin(2 * Math.PI * 1000 * (i * bloc + j) / SR) * 0.1;
                    trames.push(a);
                }
                mesure.ajouter(trames);
            }
        }

        const avecSilence = silencieux.lufs() as number;
        const sansSilence = franc.lufs() as number;
        expect(Math.abs(avecSilence - sansSilence)).toBeLessThan(0.5);
    });

    it('refuse de conclure sur trop peu de matière', () => {
        /*
          Un morceau qu'on vient de lancer n'a pas de sonie : mieux vaut le dire
          que rendre un nombre qu'on appliquerait. *Une mesure prématurée est
          pire qu'une mesure absente — elle a l'air d'une mesure.*
        */
        const mesure = new MesureDeSonie(SR, 2);
        const bloc = 1024;
        for (let i = 0; i < 10; i++) {
            mesure.ajouter([new Float32Array(bloc).fill(0.1), new Float32Array(bloc).fill(0.1)]);
        }
        expect(mesure.lufs()).toBeNull();
    });

    it('ne conclut pas sur du silence, même long', () => {
        const mesure = new MesureDeSonie(SR, 2);
        const bloc = 1024;
        for (let i = 0; i < Math.round(SR * 5 / bloc); i++) {
            mesure.ajouter([new Float32Array(bloc), new Float32Array(bloc)]);
        }
        expect(mesure.lufs()).toBeNull();
    });
});

describe('gainDeNormalisation', () => {
    it('remonte un morceau trop bas vers la cible', () => {
        expect(20 * Math.log10(gainDeNormalisation(-24, -18))).toBeCloseTo(6, 5);
    });

    it('baisse un morceau trop fort', () => {
        expect(20 * Math.log10(gainDeNormalisation(-12, -18))).toBeCloseTo(-6, 5);
    });

    it('⭐ renonce au-delà de la limite, au lieu de remonter un bruit de fond', () => {
        /*
          Une prise d'ambiance à −45 LUFS demanderait +27 dB : on remonterait son
          souffle avec, et le moindre transitoire saturerait. *Une correction
          automatique doit avoir le droit de renoncer.*
        */
        expect(20 * Math.log10(gainDeNormalisation(-45, -18, 12))).toBeCloseTo(12, 5);
        expect(20 * Math.log10(gainDeNormalisation(-2, -18, 12))).toBeCloseTo(-12, 5);
    });

    it('ne touche à rien quand la sonie est inconnue', () => {
        expect(gainDeNormalisation(null)).toBe(1);
        expect(gainDeNormalisation(undefined)).toBe(1);
        expect(gainDeNormalisation(NaN)).toBe(1);
    });
});
