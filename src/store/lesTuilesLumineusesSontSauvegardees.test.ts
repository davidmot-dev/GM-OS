import { describe, it, expect, beforeEach } from 'vitest';
import { construireLaSauvegarde } from './SessionService';
import { useLightStore } from '../modules/light/useLightStore';
import { tuilesQuiPortentUnEtat } from '../modules/light/logic/tuilePorteUnEtat';
import { validateSession } from '../types/schemas';

/**
 * **Light-OS entre dans la sauvegarde — trouvé absent le 2026-09-19.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI MANQUAIT, ET DEPUIS QUAND
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `construireLaSauvegarde` collectait **douze** magasins. Ni Light-OS ni
 * Sound-OS n'en faisaient partie : les dix-huit tuiles du meneur — l'état de
 * chaque lampe, un nom, une icône, une touche, une vitesse, une intensité — ne
 * vivaient que dans le `localStorage`. La sauvegarde automatique qui a tout
 * ramené le 2026-09-11 ne les aurait pas ramenées.
 *
 * ⭐ **C'est la cinquième fois, et le code le disait déjà deux fois.**
 * `SessionService` porte les cicatrices précédentes en commentaire :
 * `entities`/`clues`/`sessions`, puis Music-OS, puis Map-OS, puis Image-OS —
 * avec la conclusion écrite noir sur blanc : *« une liste de ce qu'on
 * sauvegarde, recopiée à la main, oublie toujours quelque chose »*. Elle
 * l'oubliait encore.
 *
 * ⚠️ Ce fichier ne garde pas « les tuiles sont là » comme un détail : il garde
 * **le principe**. La question qui trouve ces oublis n'est pas *« qu'est-ce qui
 * est sauvegardé ? »* mais **« qui écrit une donnée que personne ne ramasse ? »**
 */

const LAMPE = { '1': { on: true, bri: 200, xy: [0.4, 0.4] as [number, number], effect: 'none' } };

const ambianceDEssai = {
    id: 'v-1',
    nom: 'Torche mourante',
    source: 'torche',
    force: 50,
};

describe('les tuiles lumineuses entrent dans la sauvegarde', () => {
    beforeEach(() => {
        useLightStore.getState().reset();
        useLightStore.getState().saveSceneSnapshot('SCENE_01', {
            '1': { id: '1', name: 'Lustre', type: 'Color', state: LAMPE['1'] },
        });
        useLightStore.getState().updateSceneMetadata('SCENE_01', 'Taverne', 'local_bar', '#f59e0b');
        useLightStore.setState({ variantes: [ambianceDEssai] as never, defaultSceneId: 'SCENE_01' });
    });

    it('la sauvegarde porte un module `light`', () => {
        const sauvegarde = construireLaSauvegarde();

        expect(
            sauvegarde.modules.light,
            'le module light est absent de la sauvegarde',
        ).toBeDefined();
    });

    /*
      ⛔ Porter un module vide ne vaudrait rien. C'est le CONTENU qu'on protège —
      et une tuile sans l'état de ses lampes n'est plus une ambiance, c'est un
      nom.
    */
    it('avec l’état des lampes, et ce qui identifie la tuile', () => {
        const { light } = construireLaSauvegarde().modules;
        const tuile = light!.scenes['SCENE_01'];

        expect(tuile.lightStates['1'], 'l’état de la lampe est vide').toBeDefined();
        expect(tuile.lightStates['1'].bri).toBe(200);
        expect(tuile.name).toBe('Taverne');
        expect(tuile.icon).toBe('local_bar');
    });

    /**
     * ⚠️ **Ce qui est référencé part avec ce qui référence.** Une tuile peut
     * porter `variante:<id>` comme effet : sans les ambiances, la sauvegarde
     * ramènerait des tuiles dont les effets désignent des ambiances disparues.
     */
    it('les ambiances du meneur voyagent avec elles', () => {
        const { light } = construireLaSauvegarde().modules;

        expect(light!.variantes, 'les ambiances ne sont pas sauvegardées').toHaveLength(1);
        expect(light!.variantes[0].id).toBe('v-1');
    });

    it('et l’éclairage normal, qui désigne l’une des tuiles', () => {
        expect(construireLaSauvegarde().modules.light!.defaultSceneId).toBe('SCENE_01');
    });

    /**
     * ⚠️ **La sauvegarde doit rester lisible par le chemin qui la relit.** Un
     * module ajouté à la récolte mais absent du schéma serait écrit, puis jeté
     * silencieusement à la relecture — le piège de `modules` qui n'est PAS
     * `.passthrough()`, déjà payé par Music-OS puis par Image-OS.
     */
    it('et le schéma la laisse traverser', () => {
        const relue = validateSession(construireLaSauvegarde());
        const light = (relue.modules as {
            light?: { scenes?: Record<string, unknown>; variantes?: unknown[] };
        }).light;

        expect(
            light?.scenes?.['SCENE_01'],
            'les tuiles ont été jetées à la validation — `modules` n’est pas passthrough',
        ).toBeDefined();
        expect(light?.variantes, 'les ambiances ont été jetées à la validation').toHaveLength(1);
    });

    /**
     * ⛔ **Le contrôle qui se croit posé et ne refuse rien.**
     *
     * Les dix-huit tuiles existent toujours, même neuves. Le `?.length` qui
     * protège les playlists de Music-OS et les gabarits du bestiaire —
     * *« un instantané vide n'en remplace jamais un plein »* — vaudrait ici
     * **18 dans tous les cas**, et laisserait un râtelier neuf écraser une
     * soirée de captures à la restauration.
     */
    describe('ce qui distingue un râtelier plein d’un râtelier neuf', () => {
        it('un râtelier neuf a ses dix-huit tuiles et ne porte rien', () => {
            useLightStore.getState().reset();
            const { scenes } = construireLaSauvegarde().modules.light!;

            expect(Object.keys(scenes), 'les dix-huit existent toujours').toHaveLength(18);
            expect(
                tuilesQuiPortentUnEtat(scenes),
                'un râtelier neuf ne doit pouvoir remplacer personne',
            ).toHaveLength(0);
        });

        it('une seule tuile capturée suffit à le rendre plein', () => {
            const { scenes } = construireLaSauvegarde().modules.light!;

            expect(tuilesQuiPortentUnEtat(scenes)).toHaveLength(1);
        });

        it('une sauvegarde d’avant ce jour n’a pas de clé `light` du tout', () => {
            expect(tuilesQuiPortentUnEtat(undefined)).toHaveLength(0);
        });
    });
});
