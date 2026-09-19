import { describe, it, expect } from 'vitest';
import { fusionnerUnInstantane, fusionnerUnInstantaneIndexe } from './fusionDInstantane';
import { tuilesApresInstantane } from '../modules/light/logic/instantaneDeSeance';
import { atmospheresApresInstantane } from '../modules/sound/logic/instantaneDeSeance';
import { playlistsApresInstantane } from '../modules/music/logic/instantaneDeSeance';
import { pistesApresInstantane } from '../modules/ambient/logic/instantaneDeSeance';
import type { LightScene } from '../modules/light/useLightStore';

/**
 * Ce que ces tests protègent : **restaurer l'ambiance d'une séance ne fait
 * jamais disparaître du travail.**
 *
 * ⛔ Les **quatre** modules d'ambiance faisaient la même chose, et personne ne
 * l'avait vu : `set({ scenes })`, `set({ atmospheres })`, `set({ playlists })`,
 * `set({ tracks })`. Un instantané est une photo prise à un moment ; le rejouer
 * six mois plus tard effaçait tout ce qui avait été rangé depuis. Le bouton
 * promet « restaurer l'état complet » et le meneur confirme — *mais il consent
 * à retrouver une ambiance, pas à perdre celles qu'il a écrites entre-temps.*
 *
 * ⭐ Quatre copies d'un même geste, écrites séparément, avec toutes le même
 * trou. La règle s'écrit désormais **une fois** ; chaque module n'apporte que
 * son idée de ce qu'est un travail.
 */

const chose = (id: string, travail: boolean, proprietaire?: string | null) =>
    ({ id, travail, proprietaire });

const REGLES = {
    cle: (c: { id: string }) => c.id,
    porteDuTravail: (c: { travail: boolean }) => c.travail,
    memeProprietaire: (
        a: { proprietaire?: string | null },
        v: { proprietaire?: string | null },
    ) => (a.proprietaire ?? null) === (v.proprietaire ?? null),
};

describe('fusionner un instantané', () => {
    it('prend ce qui arrive quand la place est vide', () => {
        const apres = fusionnerUnInstantane([chose('a', false)], [chose('a', true)], REGLES);

        expect(apres[0].travail).toBe(true);
    });

    /** ⛔ Le cas qui détruisait : la case a été remplie après la photo. */
    it('garde le travail que l’instantané ne connaît pas', () => {
        const apres = fusionnerUnInstantane([chose('a', true)], [chose('a', false)], REGLES);

        expect(apres[0].travail, 'un instantané vide a écrasé du travail').toBe(true);
    });

    it('remplace un travail par le travail du même propriétaire', () => {
        const actuelles = [{ ...chose('a', true, 'camp-a'), marque: 'aujourd_hui' }];
        const venues = [{ ...chose('a', true, 'camp-a'), marque: 'instantane' }];

        expect(fusionnerUnInstantane(actuelles, venues, REGLES)[0].marque).toBe('instantane');
    });

    /** ⛔ Le cas né du rattachement aux campagnes. */
    it('refuse d’écraser le travail d’un autre propriétaire', () => {
        const actuelles = [{ ...chose('a', true, 'camp-b'), marque: 'aujourd_hui' }];
        const venues = [{ ...chose('a', true, 'camp-a'), marque: 'instantane' }];

        expect(
            fusionnerUnInstantane(actuelles, venues, REGLES)[0].marque,
            'une séance d’une campagne a effacé le travail d’une autre',
        ).toBe('aujourd_hui');
    });

    it('sans règle de propriétaire, tout appartient à tout le monde', () => {
        const actuelles = [{ id: 'a', travail: true, marque: 'aujourd_hui' }];
        const venues = [{ id: 'a', travail: true, marque: 'instantane' }];

        const apres = fusionnerUnInstantane(actuelles, venues, {
            cle: c => c.id, porteDuTravail: c => c.travail,
        });

        expect(apres[0].marque).toBe('instantane');
    });

    it('ne supprime jamais ce que l’instantané ne mentionne pas', () => {
        const apres = fusionnerUnInstantane([chose('a', true), chose('b', true)], [chose('a', true)], REGLES);

        expect(apres.map(c => c.id)).toEqual(['a', 'b']);
    });

    it('ajoute à la suite ce que l’instantané apporte en plus', () => {
        const apres = fusionnerUnInstantane([chose('a', true)], [chose('z', true)], REGLES);

        expect(apres.map(c => c.id), 'l’ordre sous les yeux du meneur a changé').toEqual(['a', 'z']);
    });

    it('ne touche à rien quand l’instantané ne porte pas cette collection', () => {
        expect(fusionnerUnInstantane([chose('a', true)], undefined, REGLES)).toHaveLength(1);
        expect(fusionnerUnInstantane([chose('a', true)], null, REGLES)).toHaveLength(1);
    });

    describe('la variante indexée — les dix-huit cases de Light-OS', () => {
        const regles = {
            porteDuTravail: (c: { travail: boolean }) => c.travail,
            memeProprietaire: REGLES.memeProprietaire,
        };

        it('garde une case remplie depuis la photo', () => {
            const apres = fusionnerUnInstantaneIndexe(
                { SCENE_01: chose('x', true) }, { SCENE_01: chose('x', false) }, regles,
            );

            expect(apres.SCENE_01.travail).toBe(true);
        });

        it('n’efface pas une case absente de l’instantané', () => {
            const apres = fusionnerUnInstantaneIndexe(
                { SCENE_01: chose('x', true), SCENE_02: chose('y', true) },
                { SCENE_01: chose('x', true) },
                regles,
            );

            expect(Object.keys(apres)).toHaveLength(2);
        });

        it('refuse d’écraser la case d’une autre campagne', () => {
            const apres = fusionnerUnInstantaneIndexe(
                { SCENE_01: { ...chose('x', true, 'camp-b'), marque: 'aujourd_hui' } },
                { SCENE_01: { ...chose('x', true, 'camp-a'), marque: 'instantane' } },
                regles,
            );

            expect(apres.SCENE_01.marque).toBe('aujourd_hui');
        });
    });
});

/**
 * Chaque module n'apporte qu'une chose : **son idée de ce qu'est un travail**.
 * C'est le seul endroit où un filtre recopié aurait pu se tromper module par
 * module, donc le seul qui mérite un essai chacun.
 */
describe('ce que chaque module appelle un travail', () => {
    it('Light-OS : une tuile qui tient l’état d’une lampe', () => {
        const socle = { id: 'SCENE_01', name: 'Taverne', icon: 'local_bar', color: '#f59e0b' };
        const pleine: LightScene = { ...socle, lightStates: { '1': { on: true, bri: 200 } } };
        const vide: LightScene = { ...socle, lightStates: {} };

        expect(tuilesApresInstantane({ SCENE_01: pleine }, { SCENE_01: vide }).SCENE_01.lightStates)
            .not.toEqual({});
    });

    it('Sound-OS : une atmosphère dont un pad tient un fichier', () => {
        type Atmo = { id: string; pads: Record<string, { filePath: string | null }> };
        const pleine: Atmo = { id: 'a', pads: { PAD_01: { filePath: 'C:/sons/pluie.wav' } } };
        const muette: Atmo = { id: 'a', pads: { PAD_01: { filePath: null } } };

        expect(atmospheresApresInstantane([pleine], [muette])[0].pads.PAD_01.filePath)
            .toBe('C:/sons/pluie.wav');
    });

    it('Music-OS : une playlist dont une pastille tient une URL', () => {
        const pleine = { id: 'p', pads: [{ url: 'C:/musiques/theme.mp3' }] };
        const vide = { id: 'p', pads: [{ url: '' }] };

        expect(playlistsApresInstantane([pleine], [vide])[0].pads[0].url)
            .toBe('C:/musiques/theme.mp3');
    });

    it('Music-OS : et sa campagne le protège', () => {
        const mienne = { id: 'p', campagneId: 'camp-b', pads: [{ url: 'a.mp3' }] };
        const venue = { id: 'p', campagneId: 'camp-a', pads: [{ url: 'b.mp3' }] };

        expect(playlistsApresInstantane([mienne], [venue])[0].pads[0].url).toBe('a.mp3');
    });

    it('Ambient-OS : une piste qui a une URL', () => {
        const pleine = { id: 'track-0', url: 'C:/ambiances/foret.ogg' };
        const vide = { id: 'track-0', url: '' };

        expect(pistesApresInstantane([pleine], [vide])[0].url).toBe('C:/ambiances/foret.ogg');
    });
});
