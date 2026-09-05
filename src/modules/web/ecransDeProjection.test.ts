import { describe, it, expect } from 'vitest';
import { ecransDeProjection, ecransOccupes } from './ecransDeProjection';
import type { DisplayInfo } from '../image/types';

/**
 * **Choisir l'écran depuis Web-OS.**
 *
 * Demandé par David le 2026-09-05 : *« quand je lance une vidéo YouTube, je veux
 * pouvoir choisir la sortie »*. Le bouton nommait l'écran réglé dans **Image-OS**
 * sans laisser en changer — voir [[ecransDeProjection]].
 */

const ecran = (id: string): DisplayInfo => ({
    id, label: `Écran ${id}`, bounds: { x: 0, y: 0, width: 1920, height: 1080 },
});

const libelleDe = (id: string) => (id === 'hub' ? 'Player Hub' : `Écran ${id}`);

describe('les écrans proposés', () => {
    it('met le Player Hub en tête, avant le matériel', () => {
        /* Il est le seul qui existe sans matériel branché : une liste qui
           commence par ce qui peut manquer commence parfois par rien. */
        const liste = ecransDeProjection([ecran('m1'), ecran('m2')], {}, null, libelleDe);
        expect(liste.map((e) => e.id)).toEqual(['hub', 'm1', 'm2']);
    });

    it('propose le Hub même quand aucun moniteur n’est détecté', () => {
        expect(ecransDeProjection([], {}, null, libelleDe)).toHaveLength(1);
    });

    it('dit où le média est à l’antenne', () => {
        const liste = ecransDeProjection(
            [ecran('m1'), ecran('m2')],
            { hub: null, m1: '__youtube__dQw4w9WgXcQ', m2: 'm-42' },
            '__youtube__dQw4w9WgXcQ',
            libelleDe,
        );
        expect(liste.find((e) => e.id === 'm1')!.aLAntenne).toBe(true);
        // Un autre média occupe m2 : ce n'est pas le nôtre.
        expect(liste.find((e) => e.id === 'm2')!.aLAntenne).toBe(false);
        expect(liste.find((e) => e.id === 'hub')!.aLAntenne).toBe(false);
    });

    it('ne se croit nulle part quand il n’y a pas de marqueur', () => {
        /* Un lien ordinaire n'est pas projetable ; sans cette garde, un écran
           vide (`null`) correspondrait à un marqueur `null`. */
        const liste = ecransDeProjection([ecran('m1')], { m1: null }, null, libelleDe);
        expect(liste.every((e) => !e.aLAntenne)).toBe(true);
    });

    it('sait lister les écrans à couper', () => {
        const liste = ecransDeProjection(
            [ecran('m1'), ecran('m2')],
            { hub: '__youtube__abc12345678', m2: '__youtube__abc12345678' },
            '__youtube__abc12345678',
            libelleDe,
        );
        expect(ecransOccupes(liste).map((e) => e.id)).toEqual(['hub', 'm2']);
    });
});
