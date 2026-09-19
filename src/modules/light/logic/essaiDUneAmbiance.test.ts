import { describe, it, expect, beforeEach } from 'vitest';
import { hueEngine } from '../HueEngine';
import { useLightStore } from '../useLightStore';

/**
 * **Essayer une ambiance sur les lampes, sans l'enregistrer.**
 *
 * Le dernier reste de l'IA qui compose : le contournement livré le 19/09 était
 * « Enregistrer puis Jouer », qui **occupait une case du râtelier pour regarder
 * une ambiance qu'on allait peut-être refuser**.
 *
 * ⛔ **Ce fichier existe surtout pour une raison.** Il y avait déjà trois
 * portes du retour (`troisPortesDuRetour.test.ts`), et toutes les trois visent
 * une *scène* : sans scène jouée ni éclairage normal désigné, **elles
 * éteignent**. Or on essaie une ambiance en **préparant** une séance, pièce
 * allumée. *Une des trois aurait plongé le salon dans le noir, et le geste
 * s'appelle « Revenir ».*
 *
 * Les essais tournent en statut `mock` : aucune requête ne part, mais la visée
 * est celle du vrai chemin.
 */

const PIECE = {
    '1': { id: '1', name: 'Salon', type: 'Extended color light', state: { on: true, bri: 200 } },
    '2': { id: '2', name: 'Bureau', type: 'Extended color light', state: { on: true, bri: 180 } },
};

/** L'ambiance composée : sombre et rouge, rien à voir avec la pièce d'avant. */
const AMBIANCE = {
    '1': { on: true, bri: 40, xy: [0.6, 0.3] as [number, number], effect: 'none' },
    '2': { on: false, bri: 1, effect: 'none' },
};

const etatDe = (id: string) => useLightStore.getState().lights[id].state;

beforeEach(async () => {
    useLightStore.getState().reset();
    await useLightStore.getState().setConnection('mock');
    useLightStore.getState().setLights(structuredClone(PIECE));
    hueEngine.oublierLEssai();
});

describe('l’essai lui-même', () => {
    it('pose l’ambiance sur les lampes', async () => {
        await hueEngine.essayerUneAmbiance(AMBIANCE);

        expect(etatDe('1').bri).toBe(40);
        expect(etatDe('2').on).toBe(false);
    });

    /** ⛔ C'est tout l'intérêt : rien ne part dans le râtelier. */
    it('n’écrit AUCUNE tuile', async () => {
        await hueEngine.essayerUneAmbiance(AMBIANCE);

        const portent = Object.values(useLightStore.getState().scenes)
            .filter(s => Object.keys(s.lightStates).length > 0);
        expect(portent, 'une case du râtelier a été occupée par un essai').toHaveLength(0);
    });

    /** Un essai n'est pas un geste de table : aucune tuile ne « joue ». */
    it('ne désigne aucune scène active', async () => {
        await hueEngine.essayerUneAmbiance(AMBIANCE);

        expect(useLightStore.getState().activeSceneId).toBeNull();
    });

    it('s’annonce tant qu’il occupe la pièce', async () => {
        expect(hueEngine.essaiEnCours).toBe(false);
        await hueEngine.essayerUneAmbiance(AMBIANCE);
        expect(hueEngine.essaiEnCours).toBe(true);
    });
});

describe('rendre la pièce', () => {
    /**
     * ⛔ **Le défaut que ce test interdit, et il est le motif du fichier.**
     * `revenirALEclairageNormal` et `revertToManualScene` tombent toutes deux
     * sur `extinguishAll` quand aucune scène n'est désignée. Employer l'une
     * d'elles ici aurait **éteint la pièce** un dimanche après-midi.
     */
    it('rallume ce qui était allumé, même sans aucune scène', async () => {
        await hueEngine.essayerUneAmbiance(AMBIANCE);
        await hueEngine.rendreLaPieceApresLEssai();

        expect(etatDe('1').bri, 'la pièce n’a pas retrouvé sa brillance').toBe(200);
        expect(etatDe('2').on, 'la pièce est restée éteinte après un essai').toBe(true);
        expect(etatDe('2').bri).toBe(180);
    });

    /** La scène porte les effets ; le miroir ne porterait qu'une image figée. */
    it('rejoue la scène qui jouait', async () => {
        useLightStore.getState().saveSceneSnapshot('SCENE_02', structuredClone(PIECE));
        await hueEngine.applyScene('SCENE_02');

        await hueEngine.essayerUneAmbiance(AMBIANCE);
        expect(useLightStore.getState().activeSceneId).toBe('SCENE_02');

        await hueEngine.rendreLaPieceApresLEssai();

        expect(useLightStore.getState().activeSceneId).toBe('SCENE_02');
        expect(etatDe('1').bri).toBe(200);
    });

    /**
     * ⭐ Enchaîner « Une autre » trois fois doit rendre la pièce **d'avant la
     * première**, jamais celle de l'essai précédent.
     */
    it('revient avant le PREMIER essai, pas avant le dernier', async () => {
        await hueEngine.essayerUneAmbiance(AMBIANCE);
        await hueEngine.essayerUneAmbiance({
            '1': { on: true, bri: 90, effect: 'none' },
            '2': { on: true, bri: 90, effect: 'none' },
        });

        await hueEngine.rendreLaPieceApresLEssai();

        expect(etatDe('1').bri).toBe(200);
        expect(etatDe('2').bri).toBe(180);
    });

    it('ne fait rien quand aucun essai ne tourne', async () => {
        await hueEngine.rendreLaPieceApresLEssai();

        expect(etatDe('1').bri).toBe(200);
    });

    /** L'ambiance enregistrée est une tuile : la pièce garde ce qu'elle montre. */
    it('n’a plus rien à rendre après un enregistrement', async () => {
        await hueEngine.essayerUneAmbiance(AMBIANCE);
        hueEngine.oublierLEssai();

        await hueEngine.rendreLaPieceApresLEssai();

        expect(hueEngine.essaiEnCours).toBe(false);
        expect(etatDe('1').bri, 'la pièce est revenue sur une ambiance enregistrée').toBe(40);
    });
});
