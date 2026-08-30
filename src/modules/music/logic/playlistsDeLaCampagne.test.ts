import { describe, it, expect } from 'vitest';
import {
    classerLesPlaylists,
    playlistsVisibles,
    playlistActiveApresChangement,
    padDuRaccourci,
} from './playlistsDeLaCampagne';

/**
 * **Lier une config Music-OS à une campagne — demandé par David le 2026-08-30.**
 *
 * Ce que ces tests gardent n'est pas le tri, qui est évident, mais les trois
 * façons dont il peut faire **disparaître du travail sans le dire** :
 *
 * - les playlists d'avant n'ont pas d'étiquette et doivent rester visibles ;
 * - une campagne supprimée ne doit pas emporter ses atmosphères hors de vue ;
 * - une touche du clavier ne doit pas lancer la musique d'une autre campagne,
 *   parce que c'est le seul chemin que le filtre de l'écran ne couvre pas.
 */

const p = (id: string, campagneId?: string | null) => ({ id, campagneId });

describe('le classement des playlists', () => {
    const bibliotheque = [
        p('colonie', 'hadley'),
        p('nid', 'hadley'),
        p('tension'), // écrite avant l'étiquette : commune
        p('combat', null), // rattachement retiré à la main : commune aussi
        p('rues', 'bladerunner'),
        p('voyage', 'campagne-effacee'),
    ];

    it('sépare la campagne, les communes, les orphelines et les autres', () => {
        const classees = classerLesPlaylists(bibliotheque, 'hadley', ['hadley', 'bladerunner']);

        expect(classees.deLaCampagne.map(x => x.id)).toEqual(['colonie', 'nid']);
        expect(classees.communes.map(x => x.id)).toEqual(['tension', 'combat']);
        expect(classees.orphelines.map(x => x.id)).toEqual(['voyage']);
        expect(classees.desAutres.map(x => x.id)).toEqual(['rues']);
    });

    /**
     * *La bascule doit être indolore.* Les playlists écrites avant ce jour
     * n'ont pas de `campagneId` : si elles tombaient dans `desAutres`, David
     * ouvrirait Music-OS le lendemain de la mise à jour sur une bibliothèque
     * vide.
     */
    it('tient une playlist sans étiquette pour commune, jamais pour masquée', () => {
        const classees = classerLesPlaylists([p('ancienne')], 'hadley', ['hadley']);
        expect(classees.communes.map(x => x.id)).toEqual(['ancienne']);
        expect(classees.desAutres).toEqual([]);
    });

    /**
     * Sans la liste des campagnes vivantes, rien ne distingue une orpheline
     * d'une playlist d'une autre campagne. On ne devine pas : tout va dans
     * `desAutres`.
     */
    it('ne prétend pas repérer une orpheline quand on ne lui dit pas qui existe', () => {
        const classees = classerLesPlaylists(bibliotheque, 'hadley');
        expect(classees.orphelines).toEqual([]);
        expect(classees.desAutres.map(x => x.id)).toEqual(['rues', 'voyage']);
    });
});

describe('ce que l’écran montre', () => {
    const bibliotheque = [
        p('rues', 'bladerunner'),
        p('colonie', 'hadley'),
        p('tension'),
        p('voyage', 'campagne-effacee'),
    ];

    it('montre la campagne d’abord, puis les communes', () => {
        expect(playlistsVisibles(bibliotheque, 'hadley', ['hadley', 'bladerunner']).map(x => x.id))
            .toEqual(['colonie', 'tension', 'voyage']);
    });

    /**
     * **Une campagne supprimée ne fait pas s'évanouir ses atmosphères.**
     * Masquée, `voyage` n'apparaîtrait plus nulle part et rien n'en
     * signalerait l'existence — du travail perdu sans cause visible.
     */
    it('garde les orphelines à l’écran plutôt que dans un angle mort', () => {
        expect(playlistsVisibles(bibliotheque, 'bladerunner', ['hadley', 'bladerunner']).map(x => x.id))
            .toContain('voyage');
    });

    /**
     * *Masquer sur un critère absent, c'est cacher la bibliothèque entière.*
     * Sans campagne ouverte, l'écran vide serait indiscernable d'une perte.
     */
    it('ne masque rien tant qu’aucune campagne n’est ouverte', () => {
        expect(playlistsVisibles(bibliotheque, null, ['hadley', 'bladerunner']))
            .toHaveLength(bibliotheque.length);
    });
});

describe('la playlist sélectionnée après un changement de campagne', () => {
    const bibliotheque = [p('colonie', 'hadley'), p('rues', 'bladerunner'), p('tension')];
    const connues = ['hadley', 'bladerunner'];

    it('ne bouge pas quand la sélection reste visible', () => {
        expect(playlistActiveApresChangement(bibliotheque, 'hadley', 'tension', connues)).toBe('tension');
    });

    /**
     * Une sélection devenue invisible laisserait les pastilles d'une autre
     * campagne à l'écran, sans onglet allumé pour dire d'où elles viennent.
     */
    it('retombe sur la première visible quand la sélection est masquée', () => {
        expect(playlistActiveApresChangement(bibliotheque, 'hadley', 'rues', connues)).toBe('colonie');
    });

    it('rend null quand la campagne n’a rien à montrer', () => {
        expect(playlistActiveApresChangement([p('rues', 'bladerunner')], 'hadley', null, connues)).toBe(null);
    });
});

describe('le raccourci clavier', () => {
    const pad = (keybind: string | undefined, url: string) => ({ keybind, url });

    const bibliotheque = [
        { id: 'rues', campagneId: 'bladerunner', pads: [pad('Numpad1', 'blade.mp3')] },
        { id: 'colonie', campagneId: 'hadley', pads: [pad('Numpad1', 'colonie.mp3')] },
        { id: 'tension', pads: [pad('Numpad2', 'tension.mp3')] },
    ];
    const connues = ['hadley', 'bladerunner'];

    /**
     * **Le défaut que ce filtre existe pour empêcher.** Deux campagnes
     * attribuent naturellement `Numpad1` à leur ambiance d'ouverture. Sans
     * filtre, la première trouvée gagne — et c'est celle qu'on ne joue pas.
     * *Un jour où l'on ne rattrape rien : la musique part devant les joueurs.*
     */
    it('ne lance jamais la pastille d’une campagne qu’on ne joue pas', () => {
        expect(padDuRaccourci(bibliotheque, 'hadley', 'Numpad1', connues)?.url).toBe('colonie.mp3');
        expect(padDuRaccourci(bibliotheque, 'bladerunner', 'Numpad1', connues)?.url).toBe('blade.mp3');
    });

    it('trouve encore les communes', () => {
        expect(padDuRaccourci(bibliotheque, 'hadley', 'Numpad2', connues)?.url).toBe('tension.mp3');
    });

    /** Une pastille vide masquerait une pastille plus loin qui, elle, joue. */
    it('passe outre une pastille sans fichier', () => {
        const avecVide = [
            { id: 'colonie', campagneId: 'hadley', pads: [pad('Numpad3', '')] },
            { id: 'tension', pads: [pad('Numpad3', 'tension.mp3')] },
        ];
        expect(padDuRaccourci(avecVide, 'hadley', 'Numpad3', connues)?.url).toBe('tension.mp3');
    });

    it('rend null quand aucune playlist visible ne porte la touche', () => {
        expect(padDuRaccourci(bibliotheque, 'hadley', 'Numpad9', connues)).toBe(null);
    });
});
