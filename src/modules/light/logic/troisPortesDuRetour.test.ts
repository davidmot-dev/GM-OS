import { describe, it, expect, beforeEach } from 'vitest';
import { hueEngine } from '../HueEngine';
import { useLightStore } from '../useLightStore';

/**
 * **Trois gestes ramènent la pièce au repos, et ils ne visent pas la même
 * chose.** Ce fichier les tient chacun à sa place, parce qu'ils se ressemblent
 * assez pour être confondus au premier coup d'œil sur le code :
 *
 * | Geste | Vise |
 * | :--- | :--- |
 * | Retour automatique (fin d'un son, d'une piste, d'un flash) | la dernière scène choisie, puis l'éclairage normal |
 * | Stop All de la barre du haut | l'éclairage normal **directement** |
 * | Extinction d'urgence (bouton rouge) | rien : elle éteint |
 *
 * *Le Stop All ne passe pas par la dernière scène choisie, et c'est voulu : on
 * ne veut pas retomber sur la scène d'alerte qui jouait il y a trois secondes.*
 *
 * Les essais tournent en statut `mock` : le moteur y court-circuite toute
 * requête réseau, mais **la logique de visée, elle, est bien celle du vrai
 * chemin**.
 */

const LAMPE = { '1': { id: '1', name: 'L1', type: 'Color', state: { on: true, bri: 200 } } };

beforeEach(async () => {
    useLightStore.getState().reset();
    await useLightStore.getState().setConnection('mock');
    useLightStore.getState().setLights(LAMPE);
    useLightStore.getState().saveSceneSnapshot('SCENE_01', LAMPE); // l'éclairage normal
    useLightStore.getState().saveSceneSnapshot('SCENE_02', LAMPE); // une scène de jeu
});

describe('le Stop All', () => {
    it('ramène l’éclairage normal quand il est désigné', async () => {
        useLightStore.getState().setDefaultScene('SCENE_01');

        await hueEngine.revenirALEclairageNormal();

        expect(useLightStore.getState().activeSceneId).toBe('SCENE_01');
    });

    /**
     * *On ne retombe pas sur la scène d'alerte qui jouait il y a trois
     * secondes.* Le Stop All vise l'éclairage normal, pas la dernière scène.
     */
    it('ignore la dernière scène choisie à la main', async () => {
        useLightStore.getState().setDefaultScene('SCENE_01');
        useLightStore.getState().setActiveScene('SCENE_02'); // choisie par le meneur

        await hueEngine.revenirALEclairageNormal();

        expect(useLightStore.getState().activeSceneId).toBe('SCENE_01');
    });

    /** Sans éclairage normal désigné, rien ne change par rapport à avant. */
    it('éteint quand aucun éclairage normal n’est désigné', async () => {
        useLightStore.getState().setActiveScene('SCENE_02');

        await hueEngine.revenirALEclairageNormal();

        expect(useLightStore.getState().activeSceneId).toBeNull();
        expect(useLightStore.getState().lights['1'].state.on).toBe(false);
    });
});

describe('le retour automatique d’un module', () => {
    /**
     * ⛔ **Le défaut réparé le 2026-09-07.** Une soirée où aucune scène n'avait
     * été cliquée finissait dans le noir à la fin du premier pad sonore.
     */
    it('prend l’éclairage normal quand aucune scène n’a été choisie', async () => {
        useLightStore.getState().setDefaultScene('SCENE_01');

        await hueEngine.revertToManualScene();

        expect(useLightStore.getState().activeSceneId).toBe('SCENE_01');
    });

    it('préfère la scène que le meneur avait choisie', async () => {
        useLightStore.getState().setDefaultScene('SCENE_01');
        useLightStore.getState().setActiveScene('SCENE_02');

        await hueEngine.revertToManualScene();

        expect(useLightStore.getState().activeSceneId).toBe('SCENE_02');
    });

    it('éteint quand il n’y a ni scène choisie ni éclairage normal', async () => {
        await hueEngine.revertToManualScene();

        expect(useLightStore.getState().activeSceneId).toBeNull();
    });
});

describe('l’extinction d’urgence', () => {
    /**
     * **Elle éteint, éclairage normal ou pas.** *Un bouton nommé « extinction »
     * doit éteindre, sinon il ne reste aucune porte vers le noir* — et il en
     * faut une pour finir la soirée.
     */
    it('éteint même quand un éclairage normal est désigné', async () => {
        useLightStore.getState().setDefaultScene('SCENE_01');
        useLightStore.getState().setActiveScene('SCENE_02');

        await hueEngine.extinguishAll();

        expect(useLightStore.getState().activeSceneId).toBeNull();
        expect(useLightStore.getState().lights['1'].state.on).toBe(false);
    });
});
