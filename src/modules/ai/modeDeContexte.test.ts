import { describe, it, expect } from 'vitest';
import { contexteAllegeParDefaut, libelleDuMode, modeDeContexte } from './modeDeContexte';

/**
 * Ce que ces tests protègent : **le mode se voit et se renverse — axes F.1,
 * F.2 et F.5.**
 *
 * *« Si la Forge se comporte différemment parce qu'une session est ouverte,
 * c'est la Forge qui doit le dire, avec le moyen de passer outre. Sinon on
 * recrée l'action à distance qu'on cherche à éviter. »*
 */

const T0 = 1_000_000_000_000;
const enCours = { status: 'active' };
const enPause = { status: 'active', pausedAt: T0 };

describe('le défaut', () => {
    it('allège en partie : le meneur attend, ses joueurs avec lui', () => {
        expect(contexteAllegeParDefaut([enCours])).toBe(true);
    });

    it('garde le contexte complet en préparation', () => {
        expect(contexteAllegeParDefaut([])).toBe(false);
        expect(contexteAllegeParDefaut([{ status: 'done' }])).toBe(false);
    });

    /** La pause le remet à « non », comme elle lève les plafonds — axe G. */
    it('revient au contexte complet pendant la pause', () => {
        expect(contexteAllegeParDefaut([enPause])).toBe(false);
    });
});

describe('la surcharge du meneur', () => {
    /**
     * **Une surcharge qui ne se distingue pas du défaut ne peut plus revenir au
     * défaut** : `undefined` veut dire « suis le moment », et c'est un troisième
     * état, pas un `false` déguisé.
     */
    it('l’emporte sur le moment, dans les deux sens', () => {
        expect(modeDeContexte([enCours], false).allege).toBe(false);
        expect(modeDeContexte([], true).allege).toBe(true);
    });

    it('rend la main au moment quand elle n’a rien dit', () => {
        expect(modeDeContexte([enCours], undefined).allege).toBe(true);
        expect(modeDeContexte([], undefined).allege).toBe(false);
    });

    it('dit quand c’est la séance qui a décidé, et quand ce n’est plus elle', () => {
        expect(modeDeContexte([enCours]).imposeParLaSeance).toBe(true);
        expect(modeDeContexte([enCours], false).imposeParLaSeance).toBe(false);
        expect(modeDeContexte([]).imposeParLaSeance).toBe(false);
    });
});

describe('ce que l’écran affiche', () => {
    /** Le libellé porte la RAISON, pas seulement l'état. */
    it('nomme la séance quand c’est elle qui allège', () => {
        expect(libelleDuMode(true, 'partie')).toBe('Contexte allégé — séance ouverte');
    });

    it('signale un contexte complet tenu malgré la séance', () => {
        expect(libelleDuMode(false, 'partie')).toBe('Contexte complet — malgré la séance');
    });

    it('reste sobre hors séance', () => {
        expect(libelleDuMode(false, 'preparation')).toBe('Contexte complet');
        expect(libelleDuMode(true, 'preparation')).toBe('Contexte allégé');
    });
});
