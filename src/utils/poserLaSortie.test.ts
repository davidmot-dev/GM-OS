import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * **Le routage d'un son vers la sortie voulue — l'incident du 2026-09-12.**
 *
 * ⛔ `Device 22ad7d4a… not found, falling back to default` : une ambiance visée
 * sur les enceintes du fond sortait **devant**, et rien à l'écran ne le disait.
 * Deux défauts dans une seule ligne — un identifiant périmé pris pour un
 * appareil absent, et un repli muet.
 */

const faux = vi.hoisted(() => ({
    sortieAEmployer: vi.fn(),
    getAudioLabel: vi.fn((id: string) => `libellé de ${id}`),
    gmToast: vi.fn(),
}));

vi.mock('../stores/useHardwareStore', () => ({
    useHardwareStore: {
        getState: () => ({
            sortieAEmployer: faux.sortieAEmployer,
            getAudioLabel: faux.getAudioLabel,
        }),
    },
}));
vi.mock('../stores/useToastStore', () => ({ gmToast: faux.gmToast }));

import { poserLaSortie, oublierLesAbsences } from './poserLaSortie';

let poses: string[] = [];
const appliquer = async (sinkId: string) => { poses.push(sinkId); };
const poser = (deviceId: string | null | undefined) =>
    poserLaSortie({ nom: 'MoteurDEssai', deviceId, appliquer });

beforeEach(() => {
    vi.clearAllMocks();
    poses = [];
    oublierLesAbsences();
});

describe('la sortie demandée est là', () => {
    it('rien de demandé : on pose la sortie par défaut', async () => {
        faux.sortieAEmployer.mockReturnValue({ sort: 'par-defaut' });

        expect(await poser(undefined)).toBe('par-defaut');
        expect(poses).toEqual(['']);
        expect(faux.gmToast, 'le cas normal ne dérange personne').not.toHaveBeenCalled();
    });

    it('trouvée par son identifiant : on la pose telle quelle', async () => {
        faux.sortieAEmployer.mockReturnValue({ sort: 'trouvee', deviceId: 'casque-1', par: 'identifiant' });

        expect(await poser('casque-1')).toBe('trouvee');
        expect(poses).toEqual(['casque-1']);
        expect(faux.gmToast).not.toHaveBeenCalled();
    });

    /*
      ⭐ **LE CAS RÉPARÉ.** L'enceinte a été rebranchée, son identifiant a
      changé, la signature l'a retrouvée. *Rien n'a manqué à la table : il n'y a
      donc rien à demander au meneur.*
    */
    it('retrouvée par signature : on la pose, et on ne dérange pas', async () => {
        faux.sortieAEmployer.mockReturnValue({ sort: 'trouvee', deviceId: 'neuf-999', par: 'signature' });

        expect(await poser('ancien-22ad7d4a')).toBe('retrouvee');
        expect(poses, 'le son doit partir sur la sortie RETROUVÉE').toEqual(['neuf-999']);
        expect(faux.gmToast).not.toHaveBeenCalled();
    });
});

describe('⛔ la sortie a vraiment disparu', () => {
    beforeEach(() => { faux.sortieAEmployer.mockReturnValue({ sort: 'disparue' }); });

    /* *Perdre la sortie choisie vaut mieux que perdre le son.* */
    it('on se replie sur la sortie par défaut', async () => {
        expect(await poser('debranchee')).toBe('disparue');
        expect(poses).toEqual(['']);
    });

    /*
      ⛔ **Mais on le DIT.** C'est tout ce qui manquait le 12/09 : le son
      changeait d'enceinte au milieu d'une scène, en silence.
    */
    it('et on prévient le meneur', async () => {
        await poser('debranchee');

        expect(faux.gmToast).toHaveBeenCalledTimes(1);
        expect(faux.gmToast.mock.calls[0][1]).toBe('warning');
    });

    /*
      ⭐ **Avec le nom que le meneur a donné.** « Enceintes du fond » lui parle ;
      « 22ad7d4a… » ne lui dit rien.
    */
    it('en la nommant comme lui la nomme', async () => {
        faux.getAudioLabel.mockReturnValue('Enceintes du fond');

        await poser('debranchee');

        expect(faux.gmToast.mock.calls[0][0]).toContain('Enceintes du fond');
    });

    /*
      ⚠️ Un moment de storyboard repose sa sortie à chaque déclenchement : sans
      retenue, une soirée entière de bulles pour une seule enceinte débranchée.
      *Un avertissement qui crie tout le temps ne se lit plus.*
    */
    it('une seule fois par appareil, même après dix tentatives', async () => {
        for (let i = 0; i < 10; i++) await poser('debranchee');

        expect(faux.gmToast).toHaveBeenCalledTimes(1);
        expect(poses, 'le son doit partir à chaque fois, lui').toHaveLength(10);
    });

    it('mais deux appareils absents valent deux alertes', async () => {
        await poser('debranchee-a');
        await poser('debranchee-b');

        expect(faux.gmToast).toHaveBeenCalledTimes(2);
    });

    /*
      ⭐ Et si l'enceinte revient puis repart, le meneur doit être prévenu à
      nouveau — c'est ce que `oublierLesAbsences` sert, au `devicechange`.
    */
    it('et l’oubli des absences rouvre la parole', async () => {
        await poser('debranchee');
        oublierLesAbsences();
        await poser('debranchee');

        expect(faux.gmToast).toHaveBeenCalledTimes(2);
    });
});
