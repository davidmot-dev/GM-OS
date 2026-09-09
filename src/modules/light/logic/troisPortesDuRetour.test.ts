import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hueEngine } from '../HueEngine';
import { useLightStore } from '../useLightStore';
import { useJournalStore } from '../../journal/useJournalStore';
import type { JournalEvent } from '../../journal/types';

/** La signature d'`addEvent`, pour que l'espion soit typé comme lui. */
type EcritureAuJournal = (evenement: Omit<JournalEvent, 'timestamp' | 'id'>) => void;

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

/**
 * **Le journal disait quand une ambiance commençait, jamais quand elle
 * s'arrêtait.** `applyScene` consigne le geste du meneur depuis la revue des 36
 * émetteurs ; les deux arrêts n'écrivaient rien. *À la relecture d'après-séance,
 * toutes les lumières de la soirée avaient l'air d'être restées allumées.*
 *
 * La règle est celle d'`applyScene`, et elle vaut plus que la ligne qu'elle
 * produit : **on consigne ce que le meneur a voulu, pas ce que l'application a
 * enchaîné.** Un journal qui double ses lignes se relit comme un journal qui
 * ment sur le nombre de gestes.
 *
 * L'écriture est remplacée par un espion : le vrai `addEvent` se tait sans
 * séance ouverte, et *ce qu'on veut éprouver ici est la décision d'écrire, pas
 * la présence d'un journal.*
 */
describe('ce que l’arrêt écrit au journal', () => {
    let ecrire: ReturnType<typeof vi.fn<EcritureAuJournal>>;

    beforeEach(() => {
        ecrire = vi.fn<EcritureAuJournal>();
        useJournalStore.setState({ addEvent: ecrire });
    });

    it('écrit une ligne quand le meneur arrête la scène', async () => {
        useLightStore.getState().setDefaultScene('SCENE_01');
        useLightStore.getState().setActiveScene('SCENE_02');

        await hueEngine.revenirALEclairageNormal();

        expect(ecrire).toHaveBeenCalledTimes(1);
        expect(ecrire.mock.calls[0][0].title).toContain('arrêt de la scène');
    });

    /** *Une seule ligne, quelle que soit la fin* — même quand l'arrêt éteint. */
    it('n’en écrit qu’une quand l’arrêt finit par éteindre', async () => {
        useLightStore.getState().setActiveScene('SCENE_02');

        await hueEngine.revenirALEclairageNormal();

        expect(ecrire).toHaveBeenCalledTimes(1);
    });

    it('écrit une ligne pour l’extinction d’urgence', async () => {
        await hueEngine.extinguishAll();

        expect(ecrire).toHaveBeenCalledTimes(1);
        expect(ecrire.mock.calls[0][0].title).toContain('extinction');
    });

    /**
     * ⛔ La moitié qui compte : *la musique dit déjà qu'elle s'arrête, sa
     * lumière n'a pas à le redire.*
     */
    it('ne dit rien quand c’est l’application qui enchaîne', async () => {
        useLightStore.getState().setDefaultScene('SCENE_01');
        useLightStore.getState().setActiveScene('SCENE_02');

        await hueEngine.revenirALEclairageNormal(true);
        await hueEngine.revertToManualScene();
        await hueEngine.applyScene(null, true);

        expect(ecrire).not.toHaveBeenCalled();
    });
});
