import { describe, it, expect } from 'vitest';
import { motsDuNom, alignerSurLeVocabulaire, tagsProposes } from './tagsProposes';

/**
 * Ce que ces essais protègent : **une proposition aide, et ne salit jamais le
 * vocabulaire.**
 *
 * ⛔ Le risque propre à cette fonctionnalité : proposer `tavernes` quand la
 * bibliothèque connaît `taverne`, c'est fabriquer le doublon qu'on cherche à
 * éviter — **par automatisme, donc à grande échelle.**
 */

describe('les mots d’un nom de fichier', () => {
    it('coupe sur les tirets, les soulignés et les points', () => {
        expect(motsDuNom('taverne-nuit_pluie.jpg')).toEqual(['taverne', 'nuit', 'pluie']);
    });

    it('jette l’extension et les nombres', () => {
        expect(motsDuNom('donjon_2048x1536_03.png')).toEqual(['donjon']);
    });

    /** *Une étiquette `img` sur trois cents fichiers ne sépare rien.* */
    it('jette les mots qui ne disent rien', () => {
        expect(motsDuNom('IMG_4821.jpg')).toEqual([]);
        expect(motsDuNom('screenshot-final-copie.png')).toEqual([]);
    });

    it('jette ce qui est trop court pour désigner quoi que ce soit', () => {
        expect(motsDuNom('a-b-forêt.jpg')).toEqual(['forêt']);
    });

    /** Le premier mot d'un fichier est presque toujours son sujet. */
    it('garde l’ordre du nom et ne répète pas', () => {
        expect(motsDuNom('taverne-combat-taverne.mp3')).toEqual(['taverne', 'combat']);
    });

    it('supporte un nom qui ne dit rien du tout', () => {
        expect(motsDuNom('')).toEqual([]);
        expect(motsDuNom('.png')).toEqual([]);
    });
});

describe('l’alignement sur le vocabulaire existant', () => {
    const CONNUS = ['taverne', 'forêt', 'combat'];

    it('reprend l’étiquette connue plutôt qu’une variante', () => {
        expect(alignerSurLeVocabulaire('Tavernes', CONNUS)).toBe('taverne');
        expect(alignerSurLeVocabulaire('foret', CONNUS)).toBe('forêt');
    });

    it('rattrape une faute de frappe du nom de fichier', () => {
        expect(alignerSurLeVocabulaire('tavrne', CONNUS)).toBe('taverne');
    });

    it('garde un mot neuf tel quel', () => {
        expect(alignerSurLeVocabulaire('vaisseau', CONNUS)).toBe('vaisseau');
    });

    /** ⚠️ Un mot court se ressemble trop vite : `bois` et `boit` ne sont pas la même chose. */
    it('n’aligne pas un mot court sur un voisin', () => {
        expect(alignerSurLeVocabulaire('nef', ['net'])).toBe('nef');
    });
});

describe('les étiquettes proposées', () => {
    const CONNUS = ['taverne', 'nuit'];

    it('part du nom, puis du rangement', () => {
        const proposees = tagsProposes({
            nom: 'taverne-pluie.jpg',
            collection: 'Décors',
            campagne: 'Le secret de Milo',
            connus: CONNUS,
        });

        expect(proposees[0]).toBe('taverne');
        expect(proposees).toContain('pluie');
        expect(proposees).toContain('décors');
        expect(proposees).toContain('le secret de milo');
    });

    /** *On propose, on ne pose jamais* — donc on ne repropose pas ce qui est là. */
    it('ne propose pas ce que le média porte déjà', () => {
        const proposees = tagsProposes({
            nom: 'taverne-nuit.jpg',
            connus: CONNUS,
            deja: ['Tavernes'],
        });

        expect(proposees).not.toContain('taverne');
        expect(proposees).toContain('nuit');
    });

    it('ne propose jamais deux fois la même chose', () => {
        const proposees = tagsProposes({
            nom: 'donjon.jpg',
            collection: 'Donjons',
            connus: [],
        });

        expect(proposees).toEqual(['donjon']);
    });

    it('se borne', () => {
        const proposees = tagsProposes({
            nom: 'un-deux-trois-quatre-cinq-six-sept-huit.jpg',
        }, 3);

        expect(proposees).toHaveLength(3);
    });

    it('ne propose rien d’un fichier qui ne dit rien', () => {
        expect(tagsProposes({ nom: 'IMG_0042.jpg' })).toEqual([]);
    });
});
