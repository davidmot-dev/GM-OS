import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useJournalStore } from './useJournalStore';
import { laSceneOuLEvenementSeRange } from './sceneCourante';
import { leRecitCureDuJournal } from './recitCure';
import type { Acte, Scene } from '../../types/trame.types';

/**
 * **Le chemin complet de la curation, celui que les tests de logique ne voient
 * pas** : un événement émis en séance, rangé tout seul dans la scène ouverte, et
 * un résumé qui obéit vraiment à ce que le meneur a mis de côté.
 *
 * Étapes 6 et 7 du § 8 du plan du 2026-08-08. Le prérequis est le § 9 : *« le
 * rattachement doit être automatique, jamais manuel — c'est ce qui rend le
 * regroupement possible après coup »*. Il ne l'était que pour le combat, et
 * **29 des 36 émetteurs ne portaient aucune scène**.
 */

const acte = (id: string, ordre: number): Acte => ({
    id, campaignId: 'c-1', ordre, titre: `Acte ${ordre}`, resume: '',
});

const scene = (id: string, ordre: number, sur: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c-1', acteId: 'a-1', ordre, titre: `Scène ${id}`, resume: '',
    origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 0, ...sur,
});

/** Une scène ouverte, au sens du parcours réel : un passage sans fin. */
const ouverte = (id: string, ordre: number, sur: Partial<Scene> = {}) =>
    scene(id, ordre, { passages: [{ debut: 1 }], ...sur });

const poserLaTrame = (scenes: Scene[]) => {
    (window as unknown as { useSessionOSStore: { getState: () => unknown } }).useSessionOSStore = {
        getState: () => ({ scenes, actes: [acte('a-1', 1)], activeCampaignId: 'c-1' }),
    };
};

const journal = () => useJournalStore.getState();
const leJournal = () => journal().journals.find(j => j.id === journal().activeJournalId!)!;

beforeEach(() => {
    journal().clearJournal();
    poserLaTrame([]);
    journal().startJournal({ id: 'c-1', nom: 'Hadley Hope' }, 'Séance 1');
});

afterEach(() => {
    delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;
});

describe('le rattachement automatique', () => {
    it('range l\'événement dans la seule scène ouverte', () => {
        poserLaTrame([ouverte('s-a', 1), scene('s-b', 2)]);

        journal().addEvent({ type: 'NOTE', title: 'Un indice', content: 'x' });

        expect(leJournal().events[0].sceneId).toBe('s-a');
    });

    it('ne devine pas quand le groupe s\'est séparé', () => {
        // Deux scènes ouvertes : un événement rangé dans la mauvaise fausserait
        // le résumé sans jamais se signaler. On s'abstient, et la revue le rend
        // au meneur.
        poserLaTrame([ouverte('s-a', 1), ouverte('s-b', 2)]);

        journal().addEvent({ type: 'NOTE', title: 'Un indice', content: 'x' });

        expect(leJournal().events[0].sceneId).toBeUndefined();
    });

    it('laisse la main à l\'émetteur qui sait', () => {
        // Le combat connaît sa scène mieux que la trame ne la devine : il peut
        // écrire dans une scène qui n'est pas celle qui est ouverte.
        poserLaTrame([ouverte('s-a', 1), scene('s-b', 2)]);

        journal().addEvent({ type: 'COMBAT', title: 'Impact', content: 'x', sceneId: 's-b' });

        expect(leJournal().events[0].sceneId).toBe('s-b');
    });

    it('n\'empêche pas d\'écrire quand il n\'y a pas de trame', () => {
        // Un événement sans scène vaut mieux qu'un événement perdu.
        delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;

        journal().addEvent({ type: 'NOTE', title: 'Un indice', content: 'x' });

        expect(leJournal().events[0].title).toBe('Un indice');
        expect(leJournal().events[0].sceneId).toBeUndefined();
    });
});

describe('la scène où un événement se range', () => {
    it('est la seule ouverte, et rien d\'autre', () => {
        const actes = [acte('a-1', 1)];
        expect(laSceneOuLEvenementSeRange([ouverte('s-a', 1)], actes, 'c-1')).toBe('s-a');
        // Prévue, en pause, terminée : aucune n'est « en cours ».
        expect(laSceneOuLEvenementSeRange([scene('s-a', 1)], actes, 'c-1')).toBeUndefined();
        expect(laSceneOuLEvenementSeRange(
            [scene('s-a', 1, { passages: [{ debut: 1, fin: 2 }] })], actes, 'c-1',
        )).toBeUndefined();
    });

    it('n\'est rien sans campagne', () => {
        expect(laSceneOuLEvenementSeRange([ouverte('s-a', 1)], [acte('a-1', 1)], null))
            .toBeUndefined();
    });
});

describe('le résumé n\'écoute que l\'ensemble curé', () => {
    it('laisse une scène mise de côté hors du résumé', () => {
        poserLaTrame([ouverte('s-a', 1)]);
        journal().addEvent({ type: 'NOTE', title: 'Retenu', content: 'x' });

        expect(leRecitCureDuJournal(leJournal()).map(e => e.title)).toContain('Retenu');

        // Le meneur la met de côté à la revue.
        poserLaTrame([ouverte('s-a', 1, { ecarteeDeLaChronique: true })]);

        expect(leRecitCureDuJournal(leJournal()).map(e => e.title)).not.toContain('Retenu');
    });

    it('rend les scènes dans l\'ordre de l\'histoire, pas dans celui du fil', () => {
        // Le fil empile du plus récent au plus ancien ; un modèle qui reçoit une
        // chronologie plate doit deviner la structure, et il la devine mal.
        poserLaTrame([ouverte('s-a', 1), scene('s-b', 2)]);
        journal().addEvent({ type: 'NOTE', title: 'dans la scène 1', content: 'x' });
        journal().addEvent({ type: 'NOTE', title: 'dans la scène 2', content: 'x', sceneId: 's-b' });

        const titres = leRecitCureDuJournal(leJournal()).map(e => e.title);
        expect(titres.indexOf('dans la scène 1')).toBeLessThan(titres.indexOf('dans la scène 2'));
    });

    it('emporte les orphelins qui racontent, en fin de marche', () => {
        poserLaTrame([ouverte('s-a', 1)]);
        journal().addEvent({ type: 'NOTE', title: 'rangé', content: 'x' });
        poserLaTrame([ouverte('s-a', 1), ouverte('s-b', 2)]);
        journal().addEvent({ type: 'NOTE', title: 'orphelin', content: 'x' });

        const titres = leRecitCureDuJournal(leJournal()).map(e => e.title);
        expect(titres).toContain('orphelin');
        expect(titres.indexOf('rangé')).toBeLessThan(titres.indexOf('orphelin'));
    });

    it('se comporte comme le simple tri par nature quand il n\'y a pas de trame', () => {
        // Le cas dégradé EST le bon comportement : c'est pourquoi il n'y a pas
        // de repli à écrire.
        delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;
        journal().addEvent({ type: 'NOTE', title: 'raconte', content: 'x' });
        journal().addEvent({ type: 'AUDIO', title: 'trace', content: 'x' });

        const titres = leRecitCureDuJournal(leJournal()).map(e => e.title);
        expect(titres).toContain('raconte');
        expect(titres).not.toContain('trace');
    });

    it('range un journal dans la trame de SA campagne, pas de celle qui est ouverte', () => {
        // Un journal relu des semaines plus tard : ses scènes ne sont pas dans
        // la campagne ouverte entre-temps, tout deviendrait orphelin.
        poserLaTrame([ouverte('s-a', 1)]);
        journal().addEvent({ type: 'NOTE', title: 'à sa place', content: 'x' });

        const archive = { ...leJournal(), campaignId: 'c-1' };
        (window as unknown as { useSessionOSStore: { getState: () => unknown } }).useSessionOSStore = {
            getState: () => ({
                scenes: [ouverte('s-a', 1)], actes: [acte('a-1', 1)],
                activeCampaignId: 'c-AUTRE',
            }),
        };

        expect(leRecitCureDuJournal(archive).map(e => e.title)).toContain('à sa place');
    });
});
