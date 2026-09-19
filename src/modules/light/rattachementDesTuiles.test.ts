import { describe, it, expect, beforeEach } from 'vitest';
import { useLightStore } from './useLightStore';
import { tuilesVisibles } from './logic/tuilesDeLaCampagne';

/**
 * Ce que ces tests protègent : **rattacher une tuile ne doit jamais faire
 * perdre une case à un râtelier.**
 *
 * Depuis le 2026-09-19, **chaque campagne a ses dix-huit cases**, plus le pot
 * commun — ce qui n'a pas d'étiquette sert partout. D'où les deux règles
 * d'ici :
 *
 * - une tuile naît **commune**, et une capture ne la rattache pas — sans quoi
 *   une « Taverne » disparaîtrait des autres campagnes sans que personne ne
 *   l'ait demandé ;
 * - ⭐ **effacer une tuile lui laisse son rattachement.** C'est l'inverse de la
 *   règle du matin même, quand les cases étaient partagées : une case vide
 *   rattachée est désormais *la case libre de cette campagne*, et la rendre au
 *   pot commun la ferait quitter la grille où elle vient d'apparaître. *Une
 *   règle juste peut s'inverser quand ce qu'elle protégeait change de forme.*
 */

const LAMPE = { '1': { id: '1', name: 'L1', type: 'Color', state: { on: true, bri: 200 } } };

beforeEach(() => {
    useLightStore.getState().reset();
});

describe('le rattachement d’une tuile', () => {
    it('est absent tant qu’on ne l’a pas demandé', () => {
        useLightStore.getState().saveSceneSnapshot('SCENE_01', LAMPE);

        expect(
            useLightStore.getState().scenes.SCENE_01.campagneId ?? null,
            'une capture a rattaché la tuile toute seule',
        ).toBeNull();
    });

    it('se pose et se retire', () => {
        const { assignerLaTuile } = useLightStore.getState();

        assignerLaTuile('SCENE_01', 'camp-a');
        expect(useLightStore.getState().scenes.SCENE_01.campagneId).toBe('camp-a');

        assignerLaTuile('SCENE_01', null);
        expect(useLightStore.getState().scenes.SCENE_01.campagneId).toBeNull();
    });

    it('ne fabrique pas une tuile qui n’existe pas', () => {
        useLightStore.getState().assignerLaTuile('SCENE_99', 'camp-a');

        expect(useLightStore.getState().scenes.SCENE_99).toBeUndefined();
    });

    /**
     * ⭐ **Cette règle s'est inversée le 2026-09-19, et c'est voulu.**
     *
     * Tant que les dix-huit cases étaient *partagées*, effacer devait rendre la
     * case au pot commun : une case vide rattachée ailleurs aurait été un
     * emplacement de capture invisible, et le râtelier unique aurait perdu une
     * case.
     *
     * Depuis que **chaque campagne a son râtelier**, c'est l'inverse : une case
     * vide rattachée est exactement la case libre de cette campagne. La rendre
     * au pot commun la ferait **quitter la grille où elle vient d'apparaître**,
     * sous les yeux du meneur qui vient de l'effacer.
     *
     * *Une règle juste peut s'inverser quand ce qu'elle protégeait change de
     * forme.*
     */
    it('reste quand on efface la tuile', () => {
        const magasin = useLightStore.getState();
        magasin.saveSceneSnapshot('SCENE_01', LAMPE);
        magasin.assignerLaTuile('SCENE_01', 'camp-a');

        magasin.clearScene('SCENE_01');

        expect(useLightStore.getState().scenes.SCENE_01.campagneId).toBe('camp-a');
    });

    it('et la case reste offerte à la campagne qui la tient', () => {
        const magasin = useLightStore.getState();
        magasin.saveSceneSnapshot('SCENE_01', LAMPE);
        magasin.assignerLaTuile('SCENE_01', 'camp-a');
        magasin.clearScene('SCENE_01');

        const vues = tuilesVisibles(
            Object.values(useLightStore.getState().scenes),
            'camp-a',
            ['camp-a', 'camp-b'],
        ).map(t => t.id);

        expect(vues, 'la case libre a quitté la grille où elle vient d’apparaître').toContain('SCENE_01');
    });

    it('sans revenir dans celle des autres', () => {
        const magasin = useLightStore.getState();
        magasin.saveSceneSnapshot('SCENE_01', LAMPE);
        magasin.assignerLaTuile('SCENE_01', 'camp-a');
        magasin.clearScene('SCENE_01');

        const vues = tuilesVisibles(
            Object.values(useLightStore.getState().scenes),
            'camp-b',
            ['camp-a', 'camp-b'],
        ).map(t => t.id);

        expect(vues).not.toContain('SCENE_01');
    });

    /**
     * **Le râtelier ne rétrécit jamais pour qui n'a rien rattaché.** C'est ce
     * qui rend la bascule indolore : les dix-huit tuiles d'avant ce champ n'ont
     * pas d'étiquette, donc aucune ne disparaît le jour de la mise à jour.
     */
    it('laisse les dix-huit cases en place tant que rien n’est rattaché', () => {
        const vues = tuilesVisibles(
            Object.values(useLightStore.getState().scenes),
            'camp-a',
            ['camp-a'],
        );

        expect(vues).toHaveLength(18);
    });

    it('n’en retire qu’une quand une seule est rattachée ailleurs', () => {
        const magasin = useLightStore.getState();
        magasin.saveSceneSnapshot('SCENE_05', LAMPE);
        magasin.assignerLaTuile('SCENE_05', 'camp-b');

        const vues = tuilesVisibles(
            Object.values(useLightStore.getState().scenes),
            'camp-a',
            ['camp-a', 'camp-b'],
        );

        expect(vues).toHaveLength(17);
    });
});
