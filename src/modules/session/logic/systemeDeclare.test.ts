import { describe, it, expect } from 'vitest';
import { inscrireLesSystemes } from './systemeDeclare';
import type { GameDriver } from '../../../types/drivers';
import type { Player } from '../store/types';

/**
 * Ce que ces tests protègent : **on n'inscrit un jeu que là où un seul pilote
 * peut le revendiquer**.
 *
 * Le rattrapage par gabarit fonctionne à l'exécution ; l'inscrire dans le
 * personnage le rend stable. Mais une inscription fausse est bien pire qu'une
 * absence : l'absence se rattrape à chaque lecture, l'inscription fait
 * autorité et ne se corrige plus toute seule.
 */

const pilote = (id: string, name: string, templateId: string) =>
    ({ id, name, emoji: '🎲', templateId } as unknown as GameDriver);

const BLADE = pilote('custom-blade', 'Blade Runner: Le Jeu de Rôle', 'tpl-blade');
const ALIEN = pilote('custom-alien', 'ALIEN, le jeu de rôle', 'tpl-alien');

const joueurAvec = (persos: Array<Record<string, unknown>>): Player[] => ([{
    id: 'p-1', name: 'Joueur',
    characters: persos.map((c, i) => ({ id: `pj-${i}`, name: `Perso ${i}`, ...c })),
} as unknown as Player]);

const persoDe = (r: { players: Player[] }, i = 0) =>
    r.players[0].characters[i] as unknown as { systemId?: string };

describe('inscrire le jeu que le personnage ne déclarait pas', () => {
    it('un seul pilote réclame le gabarit : on inscrit', () => {
        const resultat = inscrireLesSystemes(joueurAvec([{ templateId: 'tpl-blade' }]), [BLADE, ALIEN]);

        expect(persoDe(resultat).systemId).toBe('custom-blade');
        expect(resultat.inscrits).toEqual([
            { personnage: 'Perso 0', systemId: 'custom-blade', piloteNom: 'Blade Runner: Le Jeu de Rôle' },
        ]);
    });

    it('la charge réelle du 2026-08-15 : quatre inscrits, trois laissés tels quels', () => {
        /**
         * Relevé dans l'état persisté de David, et non écrit pour la
         * circonstance. Quatre de ses personnages partagent le gabarit de Blade
         * Runner, qu'un seul pilote réclame. Trois portent `generic`, que
         * **aucun** pilote ne réclame : leur jeu est une question ouverte, pas
         * un trou à combler.
         */
        const resultat = inscrireLesSystemes(joueurAvec([
            { name: 'Willem Novak', templateId: 'tpl-blade' },
            { name: 'Fenna', templateId: 'tpl-blade' },
            { name: 'Oelsen Bakker', templateId: 'tpl-blade' },
            { name: 'Percival', templateId: 'tpl-blade' },
            { name: 'Aldric le Paladin', templateId: 'generic' },
            { name: 'Elowen la Druide', templateId: 'generic' },
            { name: 'Balder le Barbare', templateId: 'generic' },
        ]), [BLADE, ALIEN]);

        expect(resultat.inscrits.map(i => i.personnage)).toEqual([
            'Willem Novak', 'Fenna', 'Oelsen Bakker', 'Percival',
        ]);
        expect(persoDe(resultat, 4).systemId, 'generic n\'appartient à aucun jeu').toBeUndefined();
    });
});

describe('ce que l\'inscription refuse de faire', () => {
    it('n\'écrase jamais un jeu déjà déclaré', () => {
        const resultat = inscrireLesSystemes(
            joueurAvec([{ systemId: 'custom-alien', templateId: 'tpl-blade' }]),
            [BLADE, ALIEN],
        );

        expect(persoDe(resultat).systemId, 'le personnage fait autorité sur lui-même').toBe('custom-alien');
        expect(resultat.inscrits).toEqual([]);
    });

    it('ne tranche pas quand deux pilotes réclament le même gabarit', () => {
        const jumeau = pilote('custom-autre', 'Un autre jeu', 'tpl-blade');
        const resultat = inscrireLesSystemes(joueurAvec([{ templateId: 'tpl-blade' }]), [BLADE, jumeau]);

        expect(persoDe(resultat).systemId).toBeUndefined();
        expect(resultat.inscrits).toEqual([]);
    });

    it('ne déduit rien d\'un gabarit que personne ne réclame', () => {
        const resultat = inscrireLesSystemes(joueurAvec([{ templateId: 'generic' }]), [BLADE]);
        expect(resultat.inscrits).toEqual([]);
    });

    it('n\'invente rien pour un personnage sans gabarit', () => {
        // La campagne n'est délibérément pas consultée : elle suit le présent,
        // et la figer rendrait faux ce qui n'était qu'approximatif.
        const resultat = inscrireLesSystemes(
            joueurAvec([{ campaignId: 'c-blade' }]),
            [BLADE],
        );
        expect(resultat.inscrits).toEqual([]);
    });

    it('rend le tableau d\'origine quand il n\'y a rien à faire', () => {
        const players = joueurAvec([{ systemId: 'custom-alien', templateId: 'tpl-alien' }]);
        const resultat = inscrireLesSystemes(players, [ALIEN]);

        expect(resultat.players, 'même référence : pas de rendu inutile').toBe(players);
    });

    it('est idempotente', () => {
        const premier = inscrireLesSystemes(joueurAvec([{ templateId: 'tpl-alien' }]), [ALIEN]);
        const second = inscrireLesSystemes(premier.players, [ALIEN]);

        expect(premier.inscrits).toHaveLength(1);
        expect(second.inscrits).toEqual([]);
    });
});
