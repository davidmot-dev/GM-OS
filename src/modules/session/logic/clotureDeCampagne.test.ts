import { describe, it, expect } from 'vitest';
import { laTrameALaCloture, ceQueLaClotureVaFaire, etatDeLaScene, closeSansAvoirEteJouee } from './trame';
import type { Acte, Scene } from '../../../types/trame.types';

/**
 * **Ce que ces tests protègent : clôturer une campagne range sa trame, et
 * n'efface rien.**
 *
 * Deux décisions de David du 2026-08-20, dont la dernière des trois questions
 * laissées ouvertes au § 10 du plan du 2026-08-08 :
 *
 * - *« une scène prévue jamais jouée devient annulée quand la campagne se
 *   termine »* — la trame est donc un plan glissant tant que la campagne vit, et
 *   un registre une fois qu'elle est close ;
 * - une scène **jouée** sans avoir été terminée devient **terminée**, pas
 *   annulée : elle a été jouée, et la distinction doit survivre à l'archivage.
 *
 * **Rien de neuf dans le modèle**, et c'est ce que ces tests vérifient d'abord :
 * une scène annulée est une scène `termineeLe` sans passage, ce que
 * `closeSansAvoirEteJouee` sait déjà nommer et que tous les écrans savent déjà
 * rendre barrée *et* grisée.
 */

const acte = (id: string, sur: Partial<Acte> = {}): Acte => ({
    id, campaignId: 'c-1', ordre: 1, titre: `Acte ${id}`, resume: '', ...sur,
});

const scene = (id: string, sur: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c-1', acteId: 'a-1', ordre: 1, titre: `Scène ${id}`, resume: '',
    origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 0, ...sur,
});

const jamaisJouee = (id: string) => scene(id);
const enPause = (id: string) => scene(id, { passages: [{ debut: 1, fin: 2 }] });
const enCours = (id: string) => scene(id, { passages: [{ debut: 1 }] });
const dejaTerminee = (id: string, quand: number) =>
    scene(id, { passages: [{ debut: 1, fin: 2 }], termineeLe: quand });

const ACTES = [acte('a-1')];

describe('la trame à la clôture', () => {
    it('annule les scènes prévues jamais jouées', () => {
        // La décision de David : elles deviennent annulées, et pas avant.
        const { scenes, annulees } = laTrameALaCloture([jamaisJouee('s-1')], ACTES, 'c-1', 999);

        expect(annulees).toBe(1);
        expect(etatDeLaScene(scenes[0])).toBe('terminee');
        // Annulée se lit sur les données, sans second champ : c'est l'absence de
        // passage qui la porte.
        expect(closeSansAvoirEteJouee(scenes[0])).toBe(true);
    });

    it('termine les scènes jouées sans les annuler', () => {
        const { scenes, terminees, annulees } = laTrameALaCloture(
            [enPause('s-1'), enCours('s-2')], ACTES, 'c-1', 999,
        );

        expect(terminees).toBe(2);
        expect(annulees).toBe(0);
        for (const s of scenes) {
            expect(etatDeLaScene(s)).toBe('terminee');
            // Elles ont été jouées : elles se barrent, sans le grisé des annulées.
            expect(closeSansAvoirEteJouee(s)).toBe(false);
        }
    });

    it('ferme le passage d\'une scène qu\'on clôt pendant qu\'elle tourne', () => {
        // Sans cela, une scène close garderait un passage ouvert pour toujours.
        const { scenes } = laTrameALaCloture([enCours('s-1')], ACTES, 'c-1', 999);
        expect(scenes[0].passages?.[0].fin).toBe(999);
    });

    it('ne réécrit pas la date d\'une scène déjà terminée', () => {
        // Sinon la clôture remplacerait la date où le meneur l'a close par la
        // sienne, et ferait mentir la chronologie au moment de l'archiver.
        const { scenes, terminees, annulees } = laTrameALaCloture(
            [dejaTerminee('s-1', 42)], ACTES, 'c-1', 999,
        );

        expect(scenes[0].termineeLe).toBe(42);
        expect(terminees + annulees).toBe(0);
    });

    it('achève les actes de la campagne', () => {
        // Un acte encore ouvert dans une campagne close se relit mal.
        const { actes } = laTrameALaCloture([], [acte('a-1'), acte('a-2')], 'c-1', 999);
        expect(actes.every(a => a.acheve)).toBe(true);
    });

    it('ne touche à rien d\'une autre campagne', () => {
        const etrangere = scene('s-x', { campaignId: 'c-2', acteId: 'a-9' });
        const { scenes, actes, annulees } = laTrameALaCloture(
            [etrangere], [acte('a-1'), acte('a-9', { campaignId: 'c-2' })], 'c-1', 999,
        );

        expect(scenes[0].termineeLe).toBeUndefined();
        expect(annulees).toBe(0);
        expect(actes.find(a => a.id === 'a-9')!.acheve).toBeUndefined();
    });

    it('rattrape une scène dont le lien de campagne a divergé de son acte', () => {
        // La redondance `campaignId` / `acteId` est voulue, mais elle peut
        // diverger. À la clôture, laisser une telle scène ouverte la rendrait
        // orpheline d'une campagne close — on la range par son acte.
        const divergente = scene('s-1', { campaignId: 'AUTRE', acteId: 'a-1' });
        const { annulees } = laTrameALaCloture([divergente], ACTES, 'c-1', 999);
        expect(annulees).toBe(1);
    });
});

describe('ce que la clôture va faire, annoncé avant', () => {
    it('compte séparément les annulées, les terminées et les actes ouverts', () => {
        // Le nombre s'annonce AVANT : clôturer une campagne est le geste le plus
        // large de l'application, il ne doit pas se prendre à l'aveugle.
        const prevu = ceQueLaClotureVaFaire(
            [jamaisJouee('s-1'), jamaisJouee('s-2'), enPause('s-3'), dejaTerminee('s-4', 42)],
            [acte('a-1'), acte('a-2', { acheve: true })],
            'c-1',
        );

        expect(prevu.annulees.map(s => s.id)).toEqual(['s-1', 's-2']);
        expect(prevu.terminees.map(s => s.id)).toEqual(['s-3']);
        expect(prevu.actesOuverts).toBe(1);
    });

    it('annonce exactement ce que la clôture fait ensuite', () => {
        // Une annonce qui diverge de l'acte est pire qu'une absence d'annonce.
        const scenes = [jamaisJouee('s-1'), enPause('s-2'), dejaTerminee('s-3', 42)];
        const prevu = ceQueLaClotureVaFaire(scenes, ACTES, 'c-1');
        const fait = laTrameALaCloture(scenes, ACTES, 'c-1', 999);

        expect(prevu.annulees.length).toBe(fait.annulees);
        expect(prevu.terminees.length).toBe(fait.terminees);
    });
});
