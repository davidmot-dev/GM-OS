import { describe, it, expect } from 'vitest';
import { gainDeLaVideo } from './gainDeLaVideo';

/**
 * Le niveau d'une vidéo projetée obéit aux mêmes maîtres que la musique.
 *
 * Voir [[gainDeLaVideo]] pour la raison : la vidéo joue dans une **autre
 * fenêtre** et ne peut pas rejoindre le bus audio ; elle reçoit donc un ordre
 * plutôt qu'un branchement.
 */
describe('gainDeLaVideo', () => {
    it('laisse la vidéo à plein quand rien ne la contraint', () => {
        expect(gainDeLaVideo({})).toBe(1);
    });

    it('suit le volume général de la table', () => {
        expect(gainDeLaVideo({ volumeGeneral: 0.5 })).toBe(0.5);
    });

    it('se tait quand le son est coupé', () => {
        // Le bouton « Couper le son » met le volume général à 0.
        expect(gainDeLaVideo({ volumeGeneral: 0 })).toBe(0);
    });

    it('se tamise en mode Focus, et pas autrement', () => {
        expect(gainDeLaVideo({ modeFocus: false, tamisageDuFocus: 0.1 })).toBe(1);
        expect(gainDeLaVideo({ modeFocus: true, tamisageDuFocus: 0.1 })).toBeCloseTo(0.1);
    });

    it('plonge quand le meneur parle', () => {
        expect(gainDeLaVideo({ laVoixParle: true, plongeeDeLaVoix: 0.3 })).toBeCloseTo(0.3);
    });

    it('cumule les contraintes au lieu de garder la dernière', () => {
        /*
          C'est le point qui compte en séance : le meneur a baissé la table à
          50 %, le Focus tamise à 20 %, et il parle. Les trois doivent se
          multiplier — sinon un module annule le travail d'un autre, et le son
          remonte au pire moment.
        */
        const gain = gainDeLaVideo({
            volumeGeneral: 0.5,
            modeFocus: true,
            tamisageDuFocus: 0.2,
            laVoixParle: true,
            plongeeDeLaVoix: 0.5,
            volumeDeLaVideo: 0.8,
        });
        expect(gain).toBeCloseTo(0.5 * 0.2 * 0.5 * 0.8);
    });

    it('garde son propre curseur, indépendant du reste', () => {
        expect(gainDeLaVideo({ volumeDeLaVideo: 0.25 })).toBe(0.25);
    });

    it('traite un réglage absurde comme « ne change rien », jamais comme un silence', () => {
        /*
          Un état relu d'une version plus ancienne, ou un module éteint, rend
          `undefined` ou `NaN`. Le repli doit être inoffensif : un silence
          inexpliqué est plus coûteux qu'un son trop fort, parce qu'on ne sait
          pas où chercher.
        */
        expect(gainDeLaVideo({ volumeGeneral: NaN })).toBe(1);
        expect(gainDeLaVideo({ volumeDeLaVideo: undefined })).toBe(1);
        expect(gainDeLaVideo({ modeFocus: true, tamisageDuFocus: NaN })).toBeCloseTo(0.1);
    });

    it('reste entre 0 et 1 même si un réglage sort de la route', () => {
        expect(gainDeLaVideo({ volumeGeneral: 4 })).toBe(1);
        expect(gainDeLaVideo({ volumeDeLaVideo: -2 })).toBe(0);
    });
});
