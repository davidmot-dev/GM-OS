import { describe, it, expect } from 'vitest';
import { caseLibreDuRatelier } from './caseLibreDuRatelier';
import type { LightScene } from '../useLightStore';

/**
 * Ce que ces tests protègent : **une ambiance composée par l'IA se range chez
 * elle, ou ne se range pas.**
 *
 * ⛔ **Jamais dans le pot commun.** Une ambiance écrite pour *cette* scène de
 * *cette* campagne y mangerait une case que le meneur garde pour ses ambiances
 * génériques — celles qui servent dans les trois campagnes. Il peut toujours la
 * rendre commune d'un clic ensuite : *c'est son geste, pas une décision de
 * l'IA.*
 */

const tuile = (id: string, campagneId: string | null, pleine = false): LightScene => ({
    id, name: id, icon: 'wb_incandescent', color: '#334155',
    lightStates: pleine ? { '1': { on: true, bri: 200 } } : {},
    campagneId,
});

const enRecord = (tuiles: LightScene[]) => Object.fromEntries(tuiles.map(t => [t.id, t]));

describe('où ranger une ambiance composée', () => {
    it('dans la première case libre du râtelier de la campagne', () => {
        const scenes = enRecord([
            tuile('SCENE_camp-a_01', 'camp-a', true),
            tuile('SCENE_camp-a_02', 'camp-a'),
            tuile('SCENE_camp-a_03', 'camp-a'),
        ]);

        expect(caseLibreDuRatelier(scenes, 'camp-a')).toBe('SCENE_camp-a_02');
    });

    it('jamais dans une case du pot commun', () => {
        const scenes = enRecord([
            tuile('SCENE_01', null),
            tuile('SCENE_camp-a_01', 'camp-a', true),
        ]);

        expect(
            caseLibreDuRatelier(scenes, 'camp-a'),
            'l’IA a pris une case de la bibliothèque partagée',
        ).toBeNull();
    });

    it('jamais dans celle d’une autre campagne', () => {
        const scenes = enRecord([tuile('SCENE_camp-b_01', 'camp-b')]);

        expect(caseLibreDuRatelier(scenes, 'camp-a')).toBeNull();
    });

    /**
     * ⚠️ Sans campagne ouverte il n'y a pas de râtelier à soi, et remplir une
     * case commune ferait entrer dans la bibliothèque partagée quelque chose
     * qui ne lui appartient pas.
     */
    it('nulle part quand aucune campagne n’est ouverte', () => {
        expect(caseLibreDuRatelier(enRecord([tuile('SCENE_01', null)]), null)).toBeNull();
    });

    /** L'écran doit le **dire** : un bouton qui n'écrit rien sans expliquer passe pour une panne. */
    it('rend null quand le râtelier est plein, pour que l’écran puisse le dire', () => {
        const scenes = enRecord([
            tuile('SCENE_camp-a_01', 'camp-a', true),
            tuile('SCENE_camp-a_02', 'camp-a', true),
        ]);

        expect(caseLibreDuRatelier(scenes, 'camp-a')).toBeNull();
    });
});
