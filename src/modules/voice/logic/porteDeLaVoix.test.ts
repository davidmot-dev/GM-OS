import { describe, it, expect } from 'vitest';
import {
    duckingSuivant, MAINTIEN_MS, MARGE_DE_FERMETURE_DB, niveauRMS, porteSuivante,
    PORTE_FERMEE, DUCKING_INACTIF, type EtatDeLaPorte, type MesureDeLaPorte,
} from './porteDeLaVoix';

/**
 * **La porte du micro, éprouvée sur des suites de mesures.**
 *
 * *Défaut de David, le 2026-09-03 : « le son se coupe ».* Un broutage ne se
 * prouve pas sur une mesure isolée — il se compte sur une phrase. D'où la forme
 * de ces tests : on rejoue une suite de niveaux et on regarde **combien de fois
 * l'état change**.
 */

const MESURE: MesureDeLaPorte = {
    db: -20, seuilDb: -50, micro: true, armee: true, maintenantMs: 0,
};

/** Rejoue une suite de niveaux, une mesure toutes les 33 ms, et rend les états. */
function rejouer(niveaux: number[], depart: EtatDeLaPorte = PORTE_FERMEE): EtatDeLaPorte[] {
    let etat = depart;
    const suite: EtatDeLaPorte[] = [];
    niveaux.forEach((db, i) => {
        etat = porteSuivante(etat, { ...MESURE, db, maintenantMs: i * 33 });
        suite.push(etat);
    });
    return suite;
}

describe('porteSuivante', () => {
    it('ouvre dès que la voix passe le seuil', () => {
        const [avant, apres] = rejouer([-60, -20]);
        expect(avant.ouverte).toBe(false);
        expect(apres.ouverte).toBe(true);
    });

    it('ne referme pas dans la bande d’hystérésis', () => {
        /*
          Un souffle qui flotte juste sous le seuil d'ouverture : l'ancienne
          règle fermait, celle-ci tient.
        */
        const suite = rejouer([-20, -52, -53, -52]);
        expect(suite.every(e => e.ouverte)).toBe(true);
    });

    it('ne s’ouvre PAS depuis le silence sur un niveau de la bande d’hystérésis', () => {
        /* L'hystérésis ne décide de rien : elle conserve, dans les deux sens. */
        const suite = rejouer([-53, -53]);
        expect(suite.every(e => e.ouverte)).toBe(false);
    });

    it('tient pendant le maintien, puis ferme', () => {
        const seuilBas = -50 - MARGE_DE_FERMETURE_DB - 1;
        let etat: EtatDeLaPorte = porteSuivante(PORTE_FERMEE, { ...MESURE, db: -20, maintenantMs: 0 });
        expect(etat.ouverte).toBe(true);

        etat = porteSuivante(etat, { ...MESURE, db: seuilBas, maintenantMs: MAINTIEN_MS - 20 });
        expect(etat.ouverte).toBe(true);

        etat = porteSuivante(etat, { ...MESURE, db: seuilBas, maintenantMs: MAINTIEN_MS + 20 });
        expect(etat.ouverte).toBe(false);
    });

    it('ne broute pas sur une phrase ordinaire — un seul changement d’état', () => {
        /*
          Une phrase : deux mots, un creux de 66 ms entre eux, puis le silence.
          Le creux passe SOUS le seuil de fermeture — c'est exactement ce qui
          coupait des mots avant l'hystérésis et le maintien.
        */
        /* La queue de silence dépasse le maintien : 9 mesures × 33 ms > 250 ms. */
        const phrase = [-60, -18, -20, -70, -19, -17, -20, -70, -70, -70, -70, -70, -70, -70, -70, -70];
        const suite = rejouer(phrase);
        const changements = suite.filter((e, i) => i > 0 && e.ouverte !== suite[i - 1].ouverte).length;
        expect(changements).toBe(2); // une ouverture, une fermeture — pas quatre
        expect(suite[4].ouverte).toBe(true); // le second mot n'attend pas une réouverture
        expect(suite[suite.length - 1].ouverte).toBe(false);
    });

    it('ferme quand le micro est coupé, sans consommer le maintien', () => {
        const ouverte = porteSuivante(PORTE_FERMEE, { ...MESURE, db: -20, maintenantMs: 1000 });
        const coupe = porteSuivante(ouverte, { ...MESURE, micro: false, maintenantMs: 1033 });
        expect(coupe.ouverte).toBe(false);
        expect(coupe.derniereVoixMs).toBe(ouverte.derniereVoixMs);
    });

    it('tient la porte ouverte tant que le modèle entend une voix', () => {
        /*
          Une fin de phrase soufflée sous le seuil de fermeture : le niveau dit
          « silence », RNNoise dit « parole ». C'est la parole qui gagne.
        */
        let etat = porteSuivante(PORTE_FERMEE, { ...MESURE, db: -20, maintenantMs: 0 });
        for (let i = 1; i <= 30; i++) {
            etat = porteSuivante(etat, { ...MESURE, db: -80, voix: true, maintenantMs: i * 33 });
        }
        expect(etat.ouverte).toBe(true);

        /* Et dès que le modèle lâche, le maintien reprend son cours. */
        etat = porteSuivante(etat, { ...MESURE, db: -80, voix: false, maintenantMs: 31 * 33 + MAINTIEN_MS });
        expect(etat.ouverte).toBe(false);
    });

    it('n’OUVRE PAS sur la seule parole du modèle — il ne peut que tenir', () => {
        /*
          La garde qui compte : un modèle qui se trompe sur un bruit de fond
          ouvrirait le micro tout seul, et le meneur n'aurait plus de moyen de se
          taire.
        */
        const etat = porteSuivante(PORTE_FERMEE, { ...MESURE, db: -80, voix: true, maintenantMs: 0 });
        expect(etat.ouverte).toBe(false);
    });

    it('laisse tout passer quand la porte est désarmée, même dans le silence', () => {
        const etat = porteSuivante(PORTE_FERMEE, { ...MESURE, db: -90, armee: false, maintenantMs: 0 });
        expect(etat.ouverte).toBe(true);
    });
});

describe('duckingSuivant', () => {
    const MESURE_DUCK = { db: -20, seuilDb: -40, relacheMs: 800, actif: true, maintenantMs: 0 };

    it('baisse l’ambiance dès que la voix passe le seuil', () => {
        expect(duckingSuivant(DUCKING_INACTIF, MESURE_DUCK).duck).toBe(true);
    });

    it('tient l’ambiance basse pendant tout le relâchement', () => {
        const parle = duckingSuivant(DUCKING_INACTIF, MESURE_DUCK);
        const silence = duckingSuivant(parle, { ...MESURE_DUCK, db: -70, maintenantMs: 700 });
        expect(silence.duck).toBe(true);
    });

    it('rend l’ambiance passé le relâchement', () => {
        const parle = duckingSuivant(DUCKING_INACTIF, MESURE_DUCK);
        const rendu = duckingSuivant(parle, { ...MESURE_DUCK, db: -70, maintenantMs: 900 });
        expect(rendu.duck).toBe(false);
    });

    it('rattrape un retard d’un coup au lieu de rester baissé', () => {
        /*
          Le cas de la fenêtre réduite : la boucle s'arrête cinq secondes. Un
          `setTimeout` de 800 ms aurait laissé l'ambiance basse tout ce temps ;
          ici la mesure suivante voit que le relâchement est passé.
        */
        const parle = duckingSuivant(DUCKING_INACTIF, MESURE_DUCK);
        const reveil = duckingSuivant(parle, { ...MESURE_DUCK, db: -70, maintenantMs: 5000 });
        expect(reveil.duck).toBe(false);
    });

    it('rend l’ambiance dès que le ducking est désactivé', () => {
        const parle = duckingSuivant(DUCKING_INACTIF, MESURE_DUCK);
        expect(duckingSuivant(parle, { ...MESURE_DUCK, actif: false }).duck).toBe(false);
    });
});

describe('niveauRMS', () => {
    it('rend un plancher fini sur le silence, jamais -Infinity', () => {
        const { rms, db } = niveauRMS(new Float32Array(128));
        expect(rms).toBe(0);
        expect(Number.isFinite(db)).toBe(true);
    });

    it('distingue deux niveaux que huit bits confondaient', () => {
        /*
          -45 dB et -70 dB : sous `getByteTimeDomainData`, les deux tenaient dans
          le même pas de quantification. C'est la mesure qui rendait le seuil de
          porte imprévisible.
        */
        const a = new Float32Array(256).fill(10 ** (-45 / 20));
        const b = new Float32Array(256).fill(10 ** (-70 / 20));
        expect(niveauRMS(a).db).toBeCloseTo(-45, 1);
        expect(niveauRMS(b).db).toBeCloseTo(-70, 1);
    });
});
