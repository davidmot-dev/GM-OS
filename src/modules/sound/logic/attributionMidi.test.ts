import { describe, it, expect } from 'vitest';
import { canalDuStatut, libelleMidi, padPourLaNote } from './attributionMidi';

/*
  Le 11/10, première séance jouée : en banque B, un pad du Pocket Pad déclenchait
  la pastille de la banque A. La banque change de CANAL en gardant les mêmes notes.
*/
describe('attributionMidi — les banques du contrôleur', () => {
    it('lit le canal de l’octet de statut, de 1 à 16', () => {
        expect(canalDuStatut(0x90)).toBe(1);
        expect(canalDuStatut(0x91)).toBe(2);
        expect(canalDuStatut(0x9f)).toBe(16);
    });

    it('la même note sur deux canaux déclenche deux pastilles différentes', () => {
        const pads = [
            { id: 'A', midiMapping: 36, midiChannel: 1 },
            { id: 'B', midiMapping: 36, midiChannel: 2 },
        ];
        expect(padPourLaNote(pads, 36, 1)?.id).toBe('A');
        expect(padPourLaNote(pads, 36, 2)?.id, 'la banque B retombe sur la banque A').toBe('B');
        expect(padPourLaNote(pads, 36, 3), 'un canal non appris ne doit rien déclencher').toBeUndefined();
    });

    it('une attribution d’avant, sans canal, répond à tous les canaux', () => {
        const pads = [{ id: 'ancien', midiMapping: 36 }];
        expect(padPourLaNote(pads, 36, 1)?.id).toBe('ancien');
        expect(padPourLaNote(pads, 36, 9)?.id).toBe('ancien');
    });

    it('⛔ une attribution exacte passe devant une attribution sans canal', () => {
        /* L'ancienne est rangée la première : l'ordre ne doit pas décider. */
        const pads = [
            { id: 'ancien', midiMapping: 36, midiChannel: null },
            { id: 'banqueB', midiMapping: 36, midiChannel: 2 },
        ];
        expect(padPourLaNote(pads, 36, 2)?.id).toBe('banqueB');
        expect(padPourLaNote(pads, 36, 1)?.id).toBe('ancien');
    });

    it('écrit le canal seulement quand il est appris', () => {
        expect(libelleMidi(36)).toBe('#36');
        expect(libelleMidi(36, null)).toBe('#36');
        expect(libelleMidi(36, 2)).toBe('#36 · c2');
        expect(libelleMidi(0), 'la note 0 est une vraie note').toBe('#0');
    });
});
