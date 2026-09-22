import { describe, it, expect } from 'vitest';
import AMBIANCE from './AmbientEngine.ts?raw';
import MUSIQUE from '../music/MusicEngine.ts?raw';
import BRUITAGES from '../sound/SoundEngine.ts?raw';
import VOIX from '../voice/VoiceEngine.ts?raw';

/**
 * **Aucun moteur n'impose sa cadence à la carte son, sauf celui qui en a
 * besoin.**
 *
 * ⛔ **Trouvé le 2026-09-22.** David : *« le son qui sort d'Ambient-OS est
 * saccadé »*. Ambient-OS était le **seul des quatre** à forcer
 * `sampleRate: 48000` — et le seul à hoqueter. Il le faisait depuis le
 * 2026-03-02, **sans un mot d'explication**.
 *
 * Quand la carte tourne à 44 100 Hz — le cas courant —, imposer 48 000 oblige le
 * navigateur à ré-échantillonner **tout le flux** vers la cadence réelle du
 * matériel : une cause connue de micro-coupures périodiques.
 *
 * ⭐ **L'asymétrie était la preuve.** Music-OS porte un commentaire explicite —
 * *« Native default for stability »* — qui se lit comme une leçon déjà apprise :
 * quelqu'un a retiré cette contrainte là-bas, et n'est jamais revenu sur
 * Ambient-OS. *Quand trois modules font pareil et qu'un seul diffère, la
 * différence est la piste — surtout si c'est lui qui est en panne.*
 *
 * Aucun type n'exprime cette règle : d'où la relecture de la source.
 */

/** Ce qu'on cherche : une cadence imposée à la construction du contexte. */
const imposeUneCadence = (source: string) => /sampleRate\s*:\s*(\d|TAUX)/.test(source);

describe('la cadence du contexte audio', () => {
    it.each([
        ['Ambient-OS', AMBIANCE],
        ['Music-OS', MUSIQUE],
        ['Sound-OS', BRUITAGES],
    ])('%s laisse la carte son décider', (_nom, source) => {
        expect(imposeUneCadence(source),
            'imposer une cadence fait ré-échantillonner tout le flux, et ça s’entend').toBe(false);
    });

    /**
     * ⚠️ **Voice-OS est la seule exception, et elle est légitime** : RNNoise
     * n'existe qu'à 48 kHz. Ce qui compte, c'est qu'il **le dise** — et qu'il
     * prévienne le meneur quand la carte refuse, au lieu de dégrader en silence.
     */
    it('Voice-OS garde la sienne, et l’explique', () => {
        expect(imposeUneCadence(VOIX), 'Voice-OS a besoin de 48 kHz pour RNNoise').toBe(true);
        expect(VOIX, 'une contrainte sans avertissement dégrade en silence')
            .toContain('debruitage neuronal indisponible');
    });

    /**
     * ⭐ Le commentaire de Music-OS porte la raison de toute cette règle : on le
     * garde, parce que c'est lui qui l'explique à qui relira ce code.
     */
    it('Music-OS garde la phrase qui dit pourquoi', () => {
        expect(MUSIQUE).toContain('Native default for stability');
    });
});
