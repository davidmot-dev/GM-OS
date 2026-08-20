import { describe, it, expect } from 'vitest';
import {
    preparerLaRevue, lEnsembleCure, ceQuiResteAReviser, natureDe, sceneEcartee,
} from './curation';
import type { JournalEvent } from './types';
import type { Acte, Scene } from '../../types/trame.types';

/**
 * **Ce que ces tests protègent : la revue de fin de séance, scène par scène.**
 *
 * Étape 6 du § 8, l'étape 1 des deux du § 4.1 — décision de David du
 * 2026-08-08 : *« ne pas résumer directement tous les éléments »*. Ce que le
 * modèle doit garantir tient en trois phrases :
 *
 * - on relit dans l'ordre de la trame, jamais dans celui du fil ;
 * - ce que personne n'a su ranger est rendu au meneur, jamais perdu ;
 * - une scène mise de côté sort de la chronique, et de rien d'autre.
 */

const acte = (id: string, ordre: number): Acte => ({
    id, campaignId: 'c-1', ordre, titre: `Acte ${ordre}`, resume: '',
});

const scene = (id: string, acteId: string, ordre: number, sur: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c-1', acteId, ordre, titre: `Scène ${id}`, resume: '',
    origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 0, ...sur,
});

let horloge = 0;
const evt = (sur: Partial<JournalEvent> = {}): JournalEvent => ({
    id: `e-${++horloge}`, timestamp: horloge, type: 'NOTE', title: `E${horloge}`,
    content: '', ...sur,
});

const ACTES = [acte('a-2', 2), acte('a-1', 1)];
const SCENES = [
    scene('s-b', 'a-1', 2), scene('s-a', 'a-1', 1), scene('s-c', 'a-2', 1),
];

describe('le plan de travail de la revue', () => {
    it('range les scènes dans l\'ordre de la trame, pas dans celui du fil', () => {
        // Le journal empile du plus récent au plus ancien : suivre son ordre
        // demanderait de relire la séance à l'envers.
        const revue = preparerLaRevue(
            [evt({ sceneId: 's-c' }), evt({ sceneId: 's-b' }), evt({ sceneId: 's-a' })],
            SCENES, ACTES, 'c-1',
        );

        expect(revue.scenes.map(s => s.scene.id)).toEqual(['s-a', 's-b', 's-c']);
    });

    it('remet les événements d\'une scène dans l\'ordre des faits', () => {
        const tard = evt({ sceneId: 's-a', title: 'après' });
        const tot = { ...evt({ sceneId: 's-a', title: 'avant' }), timestamp: 0 };

        const revue = preparerLaRevue([tard, tot], SCENES, ACTES, 'c-1');

        expect(revue.scenes[0].recit.map(e => e.title)).toEqual(['avant', 'après']);
    });

    it('sépare ce qui raconte de ce qui est mécanique', () => {
        const revue = preparerLaRevue([
            evt({ sceneId: 's-a', type: 'NOTE', title: 'un indice' }),
            evt({ sceneId: 's-a', type: 'COMBAT', title: 'initiative' }),
        ], SCENES, ACTES, 'c-1');

        expect(revue.scenes[0].recit.map(e => e.title)).toEqual(['un indice']);
        expect(revue.scenes[0].traces.map(e => e.title)).toEqual(['initiative']);
    });

    it('respecte la nature qu\'un émetteur déclare', () => {
        // Le récit de fin de combat est du récit sous un type mécanique.
        const revue = preparerLaRevue(
            [evt({ sceneId: 's-a', type: 'COMBAT', nature: 'chronique', title: 'le récit' })],
            SCENES, ACTES, 'c-1',
        );
        expect(revue.scenes[0].recit.map(e => e.title)).toEqual(['le récit']);
    });

    it('n\'inscrit pas une scène que rien n\'a touchée', () => {
        // Une scène ouverte puis quittée sans que rien ne s'y écrive ferait une
        // ligne vide de plus à chaque séance.
        const revue = preparerLaRevue([evt({ sceneId: 's-a' })], SCENES, ACTES, 'c-1');
        expect(revue.scenes.map(s => s.scene.id)).toEqual(['s-a']);
    });

    it('dit qu\'il n\'y a rien à revoir quand il n\'y a rien', () => {
        expect(preparerLaRevue([], SCENES, ACTES, 'c-1').vide).toBe(true);
    });
});

describe('ce que personne n\'a su ranger', () => {
    it('est rendu au meneur, et non perdu', () => {
        // Deux scènes ouvertes en même temps : le rattachement automatique
        // s'abstient plutôt que de deviner, et la revue est le seul moment où
        // le meneur peut trancher sans pression de temps.
        const revue = preparerLaRevue(
            [evt({ title: 'orphelin' }), evt({ sceneId: 's-a' })], SCENES, ACTES, 'c-1',
        );

        expect(revue.sansScene.map(e => e.title)).toEqual(['orphelin']);
        expect(revue.vide).toBe(false);
    });

    it('récupère aussi les événements d\'une scène disparue', () => {
        // Sans cela ils seraient rattachés à un identifiant qui ne désigne plus
        // rien, et disparaîtraient du plan de travail sans un mot.
        const revue = preparerLaRevue(
            [evt({ sceneId: 's-effacee', title: 'veuf' })], SCENES, ACTES, 'c-1',
        );

        expect(revue.sansScene.map(e => e.title)).toEqual(['veuf']);
        expect(revue.scenes).toHaveLength(0);
    });
});

describe('l\'ensemble curé, entrée du résumé', () => {
    it('écarte les scènes mises de côté, sans toucher à leurs données', () => {
        const scenes = [scene('s-a', 'a-1', 1), scene('s-b', 'a-1', 2, { ecarteeDeLaChronique: true })];
        const revue = preparerLaRevue(
            [evt({ sceneId: 's-a', title: 'gardé' }), evt({ sceneId: 's-b', title: 'écarté' })],
            scenes, ACTES, 'c-1',
        );

        const cure = lEnsembleCure(revue);
        expect(cure.parScene.map(s => s.scene.id)).toEqual(['s-a']);
        // La scène écartée reste dans la revue : on n'efface rien.
        expect(revue.scenes.map(s => s.scene.id)).toEqual(['s-a', 's-b']);
        expect(sceneEcartee(revue.scenes[1].scene)).toBe(true);
    });

    it('écarte les traces, et garde la structure par scène', () => {
        // Un modèle qui reçoit une chronologie plate doit deviner la structure,
        // et il la devine mal.
        const revue = preparerLaRevue([
            evt({ sceneId: 's-a', type: 'NOTE', title: 'récit' }),
            evt({ sceneId: 's-a', type: 'AUDIO', title: 'musique' }),
        ], SCENES, ACTES, 'c-1');

        const cure = lEnsembleCure(revue);
        expect(cure.parScene).toHaveLength(1);
        expect(cure.parScene[0].recit.map(e => e.title)).toEqual(['récit']);
    });

    it('emporte les orphelins qui racontent, et laisse leurs traces', () => {
        // Ils ont eu lieu : les écarter faute d'avoir été rangés perdrait de la
        // séance pour une raison purement technique.
        const revue = preparerLaRevue([
            evt({ type: 'NOTE', title: 'un indice sans scène' }),
            evt({ type: 'SYSTEM', title: 'une trace sans scène' }),
        ], SCENES, ACTES, 'c-1');

        expect(lEnsembleCure(revue).horsScene.map(e => e.title))
            .toEqual(['un indice sans scène']);
    });

    it('ne retient pas une scène dont il ne reste rien à raconter', () => {
        const revue = preparerLaRevue(
            [evt({ sceneId: 's-a', type: 'AUDIO' })], SCENES, ACTES, 'c-1',
        );
        expect(lEnsembleCure(revue).parScene).toHaveLength(0);
    });
});

describe('l\'état de la revue', () => {
    it('compte les scènes, les écartées, ce qui reste à ranger et le récit', () => {
        const scenes = [scene('s-a', 'a-1', 1), scene('s-b', 'a-1', 2, { ecarteeDeLaChronique: true })];
        const revue = preparerLaRevue([
            evt({ sceneId: 's-a', type: 'NOTE' }),
            evt({ sceneId: 's-a', type: 'COMBAT' }),
            evt({ sceneId: 's-b', type: 'NOTE' }),
            evt({ type: 'NOTE', title: 'orphelin' }),
        ], scenes, ACTES, 'c-1');

        expect(ceQuiResteAReviser(revue)).toEqual({
            scenes: 2, ecartees: 1, aRanger: 1,
            // Le récit de la scène écartée ne compte pas ; l'orphelin, si.
            recit: 2,
        });
    });
});

describe('la nature lue par la revue', () => {
    it('est celle du type quand l\'émetteur ne la déclare pas', () => {
        expect(natureDe(evt({ type: 'NOTE' }))).toBe('chronique');
        expect(natureDe(evt({ type: 'SYSTEM' }))).toBe('trace');
    });
});
