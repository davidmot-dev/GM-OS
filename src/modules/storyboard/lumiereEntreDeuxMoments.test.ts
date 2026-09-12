import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStoryboardStore, type StoryboardMoment } from './useStoryboardStore';

/**
 * **Le branchement, et pas seulement la règle.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE À CÔTÉ DE `lumiereDuMoment.test.ts`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Celui-là garde la **décision** — quand faut-il rentrer au Home. Celui-ci garde
 * qu'elle est **appelée**, et que `triggerMoment` retient bien ce que le moment
 * a posé.
 *
 * ⛔ **La distinction a coûté deux défauts dans la même journée**, le
 * 2026-09-12 : un magasin dont l'écriture et la lecture n'employaient plus la
 * même clé, et une adresse composée avec le mauvais champ. *Dans les deux cas la
 * mécanique était juste et personne ne l'appelait correctement.*
 */

const hueEngine = {
    applyScene: vi.fn(),
    revenirALEclairageNormal: vi.fn(),
};

const moment = (id: string, lightSceneId?: string): StoryboardMoment => ({
    id, name: `Moment ${id}`, description: '', color: '#fff', icon: 'zap',
    campaignId: 'c-1', lightSceneId,
});

beforeEach(() => {
    vi.clearAllMocks();
    (window as never as { hueEngine: typeof hueEngine }).hueEngine = hueEngine;

    useStoryboardStore.setState({
        moments: [
            moment('avec-lumiere', 'scene-rouge'),
            moment('sans-lumiere'),
            moment('autre-lumiere', 'scene-bleue'),
        ],
        activeMomentId: null,
        lumiereDuMoment: null,
        sonsDuMoment: null,
        cibleDeLImageDuMoment: null,
        imageAvantLeMoment: null,
    });
});

afterEach(() => {
    delete (window as never as { hueEngine?: unknown }).hueEngine;
});

describe('la lumière d’un moment à l’autre', () => {
    it('un moment avec lumière applique sa scène, et on retient laquelle', async () => {
        await useStoryboardStore.getState().triggerMoment('avec-lumiere');

        expect(hueEngine.applyScene).toHaveBeenCalledWith('scene-rouge', true);
        expect(useStoryboardStore.getState().lumiereDuMoment).toBe('scene-rouge');
    });

    /*
      ⛔ **LE DÉFAUT QUE DAVID A DÉCRIT.** Avant le 13/09, la scène du moment
      précédent restait sur la pièce pendant toute la séquence suivante.
    */
    it('le moment suivant, sans lumière, ramène la pièce à son éclairage normal', async () => {
        await useStoryboardStore.getState().triggerMoment('avec-lumiere');
        hueEngine.revenirALEclairageNormal.mockClear();

        await useStoryboardStore.getState().triggerMoment('sans-lumiere');

        expect(
            hueEngine.revenirALEclairageNormal,
            'la scène du moment précédent est restée allumée',
        ).toHaveBeenCalled();
        expect(useStoryboardStore.getState().lumiereDuMoment).toBeNull();
    });

    /*
      ⭐ **La garde du réglage manuel.** Aucune séquence n'a posé de lumière :
      le meneur a choisi son éclairage lui-même, et un moment muet sur le sujet
      n'a rien à y faire.
    */
    it('un moment sans lumière ne touche à rien si la séquence n’avait rien posé', async () => {
        await useStoryboardStore.getState().triggerMoment('sans-lumiere');

        expect(
            hueEngine.revenirALEclairageNormal,
            'le réglage manuel du meneur a été écrasé',
        ).not.toHaveBeenCalled();
        expect(hueEngine.applyScene).not.toHaveBeenCalled();
    });

    /* Deux moments qui déclarent chacun leur scène : pas de détour par le Home,
       qui ferait clignoter la pièce entre les deux. */
    it('d’une scène à une autre, on ne passe pas par le Home', async () => {
        await useStoryboardStore.getState().triggerMoment('avec-lumiere');
        hueEngine.revenirALEclairageNormal.mockClear();

        await useStoryboardStore.getState().triggerMoment('autre-lumiere');

        expect(hueEngine.revenirALEclairageNormal).not.toHaveBeenCalled();
        expect(hueEngine.applyScene).toHaveBeenLastCalledWith('scene-bleue', true);
        expect(useStoryboardStore.getState().lumiereDuMoment).toBe('scene-bleue');
    });
});

describe('⭐ arrêter une séquence', () => {
    it('ramène la lumière au Home', async () => {
        await useStoryboardStore.getState().triggerMoment('avec-lumiere');
        hueEngine.revenirALEclairageNormal.mockClear();

        useStoryboardStore.getState().arreterLeMoment();

        expect(hueEngine.revenirALEclairageNormal).toHaveBeenCalled();
        expect(useStoryboardStore.getState().lumiereDuMoment).toBeNull();
    });

    it('mais ne touche pas à un éclairage que la séquence n’avait pas posé', () => {
        useStoryboardStore.getState().arreterLeMoment();

        expect(hueEngine.revenirALEclairageNormal).not.toHaveBeenCalled();
    });

    /*
      ⚠️ **Jamais `applyScene` à l'arrêt.** Refermer une séquence ne doit pas en
      rallumer une : c'est le Home, ou rien.
    */
    it('et n’applique jamais de scène en se refermant', async () => {
        await useStoryboardStore.getState().triggerMoment('avec-lumiere');
        hueEngine.applyScene.mockClear();

        useStoryboardStore.getState().arreterLeMoment();

        expect(hueEngine.applyScene).not.toHaveBeenCalled();
    });
});

describe('sans pont lumineux', () => {
    /*
      Light-OS peut ne pas être chargé : le moment doit se jouer quand même, et
      le dire — *ce qui accompagne ne fait jamais tomber ce qui est demandé.*
    */
    it('le moment se joue quand même, et rien ne lève', async () => {
        delete (window as never as { hueEngine?: unknown }).hueEngine;

        await expect(useStoryboardStore.getState().triggerMoment('avec-lumiere'))
            .resolves.toBeUndefined();
    });
});
