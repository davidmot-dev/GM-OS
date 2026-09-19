import { describe, it, expect, beforeEach } from 'vitest';
import { construireLaSauvegarde } from './SessionService';
import { useSoundStore } from '../modules/sound/useSoundStore';
import { atmosphereOuPointer, atmospheresQuiPortentUnSon } from '../modules/sound/logic/padPorteUnSon';
import { validateSession } from '../types/schemas';

/**
 * **Sound-OS entre dans la sauvegarde — trouvé absent le 2026-09-19.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI MANQUAIT, ET DEPUIS QUAND
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Light-OS et Sound-OS manquaient **tous les deux**, côte à côte, depuis
 * toujours. Une atmosphère, ce sont seize pads avec leur chemin de fichier,
 * leur titre, leur volume, leur couleur, leur note MIDI, leur touche de clavier
 * et leur scène lumineuse liée — des heures de rangement qui ne vivaient que
 * dans le `localStorage`.
 *
 * ⭐ **Sixième fois.** `entities`/`clues`/`sessions`, Music-OS, Map-OS,
 * Image-OS, Light-OS, et maintenant lui. Le commentaire de `SessionService` le
 * disait déjà : *« une liste de ce qu'on sauvegarde, recopiée à la main, oublie
 * toujours quelque chose »*.
 *
 * ⚠️ Ce fichier garde **le principe** : *« qui écrit une donnée que personne ne
 * ramasse ? »*
 */

const atmosphereDEssai = {
    id: 'atm-1',
    name: 'Le port de nuit',
    pads: {
        PAD_01: {
            id: 'PAD_01',
            title: 'Mouettes',
            filePath: 'C:/sons/mouettes.wav',
            volume: 0.8,
            color: 'var(--electric-violet)',
            midiMapping: 36,
            keyMapping: 'KeyA',
            /* Ce pad joue au moment où la sauvegarde part. */
            isActive: true,
            linkedLightSceneId: 'SCENE_07',
        },
        PAD_02: {
            id: 'PAD_02',
            title: '',
            filePath: null,
            volume: 1,
            color: 'var(--electric-violet)',
            midiMapping: null,
            keyMapping: null,
            isActive: false,
            linkedLightSceneId: null,
        },
    },
};

describe('les pads sonores entrent dans la sauvegarde', () => {
    beforeEach(() => {
        useSoundStore.setState({
            atmospheres: [atmosphereDEssai] as never,
            activeAtmosphereId: 'atm-1',
        });
    });

    it('la sauvegarde porte un module `sound`', () => {
        expect(
            construireLaSauvegarde().modules.sound,
            'le module sound est absent de la sauvegarde',
        ).toBeDefined();
    });

    /*
      ⛔ Porter un module vide ne vaudrait rien. C'est le CONTENU qu'on protège —
      et un pad sans son fichier n'est plus un pad, c'est une case colorée.
    */
    it('avec le chemin du fichier, la note MIDI, la touche et la lumière liée', () => {
        const pad = construireLaSauvegarde().modules.sound!.atmospheres[0].pads.PAD_01;

        expect(pad.filePath, 'le chemin du son est perdu').toBe('C:/sons/mouettes.wav');
        expect(pad.midiMapping).toBe(36);
        expect(pad.keyMapping).toBe('KeyA');
        expect(pad.linkedLightSceneId, 'le lien vers la tuile lumineuse est perdu').toBe('SCENE_07');
        expect(pad.volume).toBe(0.8);
    });

    /**
     * ⚠️ **Ce qui joue décrit la soirée, pas la préparation.** Sauvegarder
     * `isActive` rendrait, six mois plus tard, une grille de pads allumés dont
     * aucun son ne sort. Même frontière que les projections d'Image-OS.
     */
    it('mais au repos : aucun pad ne revient allumé', () => {
        const { sound } = construireLaSauvegarde().modules;

        expect(sound!.atmospheres[0].pads.PAD_01.isActive, 'un pad revient allumé et muet').toBe(false);
    });

    it('sans toucher au magasin, qui joue toujours', () => {
        construireLaSauvegarde();

        expect(
            useSoundStore.getState().atmospheres[0].pads.PAD_01.isActive,
            'la sauvegarde a arrêté un pad en passant',
        ).toBe(true);
    });

    /**
     * ⚠️ **La sauvegarde doit rester lisible par le chemin qui la relit.** Un
     * module ajouté à la récolte mais absent du schéma serait écrit, puis jeté
     * silencieusement — `modules` n'est PAS `.passthrough()`.
     */
    it('et le schéma la laisse traverser', () => {
        const relue = validateSession(construireLaSauvegarde());
        const sound = (relue.modules as { sound?: { atmospheres?: unknown[] } }).sound;

        expect(
            sound?.atmospheres,
            'les atmosphères ont été jetées à la validation — `modules` n’est pas passthrough',
        ).toHaveLength(1);
    });

    /**
     * ⛔ **Le contrôle qui se croit posé et ne refuse rien — deuxième fois du
     * jour.**
     *
     * `atmospheres` n'est jamais vide : le magasin naît avec « Exploration » et
     * ses seize pads muets, et `removeAtmosphere` la recrée dès qu'on supprime
     * la dernière. Un `?.length` vaudrait donc au moins 1 dans une base neuve,
     * et laisserait un magasin vierge effacer des mois de rangement.
     */
    describe('ce qui distingue une atmosphère pleine d’une atmosphère neuve', () => {
        it('un magasin neuf a son atmosphère par défaut, et elle ne porte rien', () => {
            useSoundStore.getState().reset();
            const { atmospheres } = construireLaSauvegarde().modules.sound!;

            expect(atmospheres.length, 'la liste n’est jamais vide').toBeGreaterThan(0);
            expect(
                atmospheresQuiPortentUnSon(atmospheres),
                'un magasin neuf ne doit pouvoir remplacer personne',
            ).toHaveLength(0);
        });

        it('un seul pad avec un fichier suffit à la rendre pleine', () => {
            const { atmospheres } = construireLaSauvegarde().modules.sound!;

            expect(atmospheresQuiPortentUnSon(atmospheres)).toHaveLength(1);
        });

        it('un pad titré mais sans fichier ne compte pas', () => {
            useSoundStore.setState({
                atmospheres: [{
                    id: 'atm-2',
                    name: 'Vide',
                    pads: { PAD_01: { ...atmosphereDEssai.pads.PAD_01, filePath: null } },
                }] as never,
            });

            expect(atmospheresQuiPortentUnSon(construireLaSauvegarde().modules.sound!.atmospheres))
                .toHaveLength(0);
        });

        it('une sauvegarde d’avant ce jour n’a pas de clé `sound` du tout', () => {
            expect(atmospheresQuiPortentUnSon(undefined)).toHaveLength(0);
        });
    });

    /**
     * ⛔ **Restaurer peut rendre tous les gestes muets, sans rien casser à
     * l'écran.** Les neuf actions de pad filtrent par
     * `a.id === activeAtmosphereId`. Si la restauration amène d'autres
     * atmosphères et que l'identifiant actif ne désigne plus rien, régler un
     * volume ou déclencher un pad ne fait **rien** — et `SoundDashboard`
     * retombe sur la première atmosphère, donc *la grille a l'air normale.*
     */
    describe('sur quelle atmosphère pointer après une restauration', () => {
        it('garde celle qui jouait si elle est toujours là', () => {
            expect(atmosphereOuPointer([{ id: 'a' }, { id: 'b' }], 'b')).toBe('b');
        });

        it('retombe sur la première quand elle a disparu', () => {
            expect(atmosphereOuPointer([{ id: 'a' }, { id: 'b' }], 'disparue')).toBe('a');
        });

        it('retombe sur la première quand aucune n’était active', () => {
            expect(atmosphereOuPointer([{ id: 'a' }], null)).toBe('a');
        });

        it('rend `null` s’il n’y a nulle part où pointer', () => {
            expect(atmosphereOuPointer([], 'a')).toBeNull();
        });
    });
});
