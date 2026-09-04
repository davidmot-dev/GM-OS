import { describe, it, expect } from 'vitest';
import { segmentDuTableau } from './segmentDuTableau';
import type { RemoteSyncData } from './types/remote.types';

/**
 * **Le meneur envoie le tableau en entier.**
 *
 * Défaut trouvé le 2026-09-05 : le segment portait quatre des sept champs
 * déclarés. Les trois absents — outil, couleur, épaisseur — restaient à leur
 * valeur de départ sur la tablette, et le canevas les recopiait dans chaque
 * tracé émis. *Tout ce qui partait d'une tablette était un crayon blanc
 * d'épaisseur 3, et la gomme dessinait au lieu d'effacer.*
 *
 * ⭐ **La vraie garde est le type de retour** : retirer un champ de la fonction
 * fait échouer `tsc -b` avec `TS2741`, vérifié en dégradant le code. Ces tests
 * ne gardent que ce que le type ne peut pas dire — que les valeurs sont
 * **recopiées** et non inventées.
 */

const MAGASIN: RemoteSyncData['whiteboard'] = {
    paths: [{ id: 'p1', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], color: '#ef4444', width: 8, tool: 'brush' }],
    activePath: null,
    laserPointer: { x: 0.5, y: 0.5 },
    backgroundMode: 'light',
    currentTool: 'eraser',
    currentColor: '#ef4444',
    currentWidth: 8,
};

describe('le segment du tableau', () => {
    it('porte les sept champs déclarés', () => {
        expect(Object.keys(segmentDuTableau(MAGASIN)).sort()).toEqual([
            'activePath', 'backgroundMode', 'currentColor', 'currentTool',
            'currentWidth', 'laserPointer', 'paths',
        ]);
    });

    it('recopie les trois champs qui manquaient — outil, couleur, épaisseur', () => {
        const segment = segmentDuTableau(MAGASIN);

        expect(segment.currentTool).toBe('eraser');
        expect(segment.currentColor).toBe('#ef4444');
        expect(segment.currentWidth).toBe(8);
    });

    it('ne change rien à ce qui passait déjà', () => {
        const segment = segmentDuTableau(MAGASIN);

        expect(segment.paths).toBe(MAGASIN.paths);
        expect(segment.laserPointer).toBe(MAGASIN.laserPointer);
        expect(segment.backgroundMode).toBe('light');
    });

    it('supporte un tableau vierge', () => {
        const vierge: RemoteSyncData['whiteboard'] = {
            paths: [], activePath: null, laserPointer: null,
            backgroundMode: 'dark', currentTool: 'brush', currentColor: '#ffffff', currentWidth: 3,
        };

        expect(segmentDuTableau(vierge)).toEqual(vierge);
    });
});
