import { describe, it, expect } from 'vitest';
import {
    volumesDuMoment, FONDU_PAR_DEFAUT_MS, FONDU_MAXIMUM_MS,
} from './volumesDuMoment';

/**
 * Ce que ces essais protègent : **un moment dose les trois sources, et
 * « couper » ne se confond jamais avec « ne rien changer ».**
 *
 * ⛔ C'est le piège central de cette fonctionnalité, et il ne se produit qu'à
 * **une seule valeur**. Tout le code de ce dépôt range ses champs facultatifs
 * avec `valeur || undefined` — ce qui transforme un volume de **0** en
 * « ne touche à rien ». Le moment ferait alors l'inverse exact de ce qu'on lui
 * demande : la musique continuerait à plein volume sur le silence voulu.
 */

describe('les volumes déclarés', () => {
    it('ne rend rien quand le moment ne dose rien', () => {
        expect(volumesDuMoment({})).toEqual([]);
        expect(volumesDuMoment(null)).toEqual([]);
    });

    it('rend les trois sources dans l’ordre', () => {
        const reglages = volumesDuMoment({
            musicVolume: 0.3, ambientVolume: 0.8, soundVolume: 1,
        });

        expect(reglages.map(r => r.source)).toEqual(['music', 'ambient', 'sound']);
    });

    it('laisse où elle est une source dont le moment ne dit rien', () => {
        const reglages = volumesDuMoment({ musicVolume: 0.5 });

        expect(reglages).toHaveLength(1);
        expect(reglages[0].source).toBe('music');
    });

    /**
     * ⛔ **Le défaut qu'aucune relecture ne voit**, parce qu'il ne se produit
     * qu'à zéro. *Couper est une intention ; ne rien dire en est une autre.*
     */
    it('GARDE un volume à zéro — couper n’est pas se taire', () => {
        const reglages = volumesDuMoment({ musicVolume: 0 });

        expect(reglages, 'un « coupe la musique » a été lu comme « ne touche à rien »')
            .toHaveLength(1);
        expect(reglages[0].volume).toBe(0);
    });

    it('borne un volume hors plage', () => {
        expect(volumesDuMoment({ musicVolume: 4 })[0].volume).toBe(1);
        expect(volumesDuMoment({ musicVolume: -2 })[0].volume).toBe(0);
    });

    it('ignore ce qui n’est pas un nombre', () => {
        expect(volumesDuMoment({ musicVolume: Number.NaN })).toEqual([]);
        expect(volumesDuMoment({ musicVolume: '0.5' as never })).toEqual([]);
    });
});

describe('le fondu', () => {
    /** *Un saut de niveau s'entend comme une fausse manœuvre.* */
    it('vaut une seconde et demie quand le moment n’en demande pas', () => {
        expect(volumesDuMoment({ soundVolume: 0.2 })[0].fonduMs).toBe(FONDU_PAR_DEFAUT_MS);
    });

    it('est celui du moment quand il en porte un', () => {
        expect(volumesDuMoment({ soundVolume: 0.2, soundVolumeFondu: 4000 })[0].fonduMs)
            .toBe(4000);
    });

    /** Zéro est licite ici : couper net sur un moment de silence. */
    it('accepte zéro — un coup sec est parfois le geste', () => {
        expect(volumesDuMoment({ soundVolume: 0, soundVolumeFondu: 0 })[0].fonduMs).toBe(0);
    });

    it('est borné : au-delà d’une demi-minute ce n’est plus un fondu', () => {
        expect(volumesDuMoment({ musicVolume: 1, musicVolumeFondu: 999999 })[0].fonduMs)
            .toBe(FONDU_MAXIMUM_MS);
        expect(volumesDuMoment({ musicVolume: 1, musicVolumeFondu: -50 })[0].fonduMs).toBe(0);
    });

    it('appartient à sa source, et à elle seule', () => {
        const reglages = volumesDuMoment({
            musicVolume: 0.4, musicVolumeFondu: 6000,
            soundVolume: 0.9,
        });

        expect(reglages.find(r => r.source === 'music')!.fonduMs).toBe(6000);
        expect(
            reglages.find(r => r.source === 'sound')!.fonduMs,
            'le fondu de la musique a débordé sur les bruitages',
        ).toBe(FONDU_PAR_DEFAUT_MS);
    });
});
