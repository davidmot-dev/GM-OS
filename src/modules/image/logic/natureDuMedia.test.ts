import { describe, it, expect } from 'vitest';
import { natureDuMedia } from './natureDuMedia';

/**
 * **Le Hub doit être informé de ce qu'il reçoit — il ne peut pas le déduire.**
 *
 * Trouvé par David le 2026-09-05 : *« la vidéo ne se lance pas sur le Player
 * Hub »*. Le Hub reçoit une adresse **déjà résolue**, sans extension, parce
 * qu'une tablette ne peut pas lire la base du meneur. Voir [[natureDuMedia]].
 */

const bibliotheque = [
    { id: 'm-1', name: 'ruelle.jpg', type: 'image' },
    { id: 'm-2', name: 'pluie-neon.mp4', type: 'video' },
    { id: 'm-3', name: 'note.pdf', type: 'document' },
];

describe('la nature de ce qu’on projette', () => {
    it('croit le Media Hub, qui a classé le fichier à l’import', () => {
        expect(natureDuMedia('m-1', bibliotheque)).toBe('image');
        expect(natureDuMedia('m-2', bibliotheque)).toBe('video');
    });

    it('reconnaît un marqueur YouTube avant tout le reste', () => {
        /* Il ne désigne aucun fichier : le chercher dans la bibliothèque ne
           rendrait jamais rien. */
        expect(natureDuMedia('__youtube__dQw4w9WgXcQ', bibliotheque)).toBe('youtube');
        expect(natureDuMedia('__youtube__dQw4w9WgXcQ@90', bibliotheque)).toBe('youtube');
    });

    it('retombe sur le nom pour un chemin jamais passé par le Hub', () => {
        expect(natureDuMedia('D:/films/intro.mp4', bibliotheque)).toBe('video');
        expect(natureDuMedia('D:/images/plan.png', bibliotheque)).toBe('image');
    });

    it('traite comme une image ce qu’il ne sait pas classer', () => {
        /*
          **Le repli est l'image, et non la vidéo.** Une image affichée à tort
          montre une première trame figée ; une vidéo affichée à tort ne montre
          rien du tout. *Entre deux erreurs, on prend celle qui laisse voir
          quelque chose.*
        */
        expect(natureDuMedia('m-3', bibliotheque)).toBe('image');
        expect(natureDuMedia('quelque-chose-sans-extension', bibliotheque)).toBe('image');
    });

    it('ne confond pas un autre marqueur avec YouTube', () => {
        expect(natureDuMedia('__whiteboard__', bibliotheque)).toBe('image');
        expect(natureDuMedia('__tactical_map__', bibliotheque)).toBe('image');
    });
});
