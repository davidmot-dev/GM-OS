import { describe, it, expect } from 'vitest';
import { rencontreDuPlateau } from './rencontreDuPlateau';
import { adversairesDeLaRencontre, type ContexteDInvocation } from './invocationDeRencontre';
import type { Combatant } from '../types';
import type { GabaritDAdversaire } from '../useBestiaireStore';
import type { Entity } from '../../../types/entity.types';

const c = (name: string, extra: Partial<Combatant> = {}): Combatant => ({
    id: name, name, init: 7, isPlayer: false, faction: 'enemy', statuses: [], ...extra,
});
const fabrique = (name: string, archetypeId = 'brute', rangId = 'pietaille', extra: Partial<Combatant> = {}) =>
    c(name, { origineFabriquee: { archetypeId, rangId }, ...extra });

const gabarit: GabaritDAdversaire = {
    id: 'g-pillard', jeuId: 'jeu', nom: 'Pillard', archetypeId: 'brute', rangId: 'pietaille',
    sheetData: {}, creeLe: 1,
};

describe('rencontreDuPlateau — garder le plateau comme modèle', () => {
    it('ne garde pas les PJ : ils entrent à l’invocation, cochés', () => {
        const { lignes } = rencontreDuPlateau([c('Ripley', { isPlayer: true, faction: 'player', sourcePlayerId: 'ripley' })], []);
        expect(lignes).toEqual([]);
    });

    it('regroupe les exemplaires numérotés d’un même adversaire en une ligne', () => {
        const { lignes } = rencontreDuPlateau(
            [fabrique('Goule 1'), fabrique('Goule 2'), fabrique('Goule 3'), fabrique('Tireur', 'tireur', 'aguerri')], []);
        expect(lignes).toEqual([
            { genre: 'archetype', archetypeId: 'brute', rangId: 'pietaille', nombre: 3, nom: 'Goule', faction: 'enemy' },
            { genre: 'archetype', archetypeId: 'tireur', rangId: 'aguerri', nombre: 1, nom: 'Tireur', faction: 'enemy' },
        ]);
    });

    it('désigne le gabarit du bestiaire du même nom et du même archétype', () => {
        const { lignes } = rencontreDuPlateau([fabrique('Pillard 1'), fabrique('Pillard 2')], [gabarit]);
        expect(lignes).toEqual([{
            genre: 'gabarit', gabaritId: 'g-pillard', nombre: 2, faction: 'enemy',
            nom: 'Pillard', archetypeId: 'brute', rangId: 'pietaille',
        }]);
    });

    it('un PNJ reste un renvoi vers sa fiche, une seule fois, avec son camp', () => {
        const { lignes } = rencontreDuPlateau([
            c('Luv', { sourceEntityId: 'pnj-luv', faction: 'neutral' }),
            c('Luv (bis)', { sourceEntityId: 'pnj-luv' }),
        ], []);
        expect(lignes).toEqual([{ genre: 'entite', entiteId: 'pnj-luv', faction: 'neutral' }]);
    });

    it('deux camps différents ne se fondent pas en une ligne', () => {
        const { lignes } = rencontreDuPlateau([fabrique('Garde 1'), fabrique('Garde 2', 'brute', 'pietaille', { faction: 'ally' })], []);
        expect(lignes.map(l => l.faction)).toEqual(['enemy', 'ally']);
    });

    it('dit qu’un combattant ajouté à la main sera refabriqué en adversaire quelconque', () => {
        const { lignes, avertissements } = rencontreDuPlateau([c('Rôdeur')], []);
        expect(lignes).toEqual([{ genre: 'archetype', archetypeId: 'quelconque', rangId: 'pietaille', nombre: 1, nom: 'Rôdeur', faction: 'enemy' }]);
        expect(avertissements.some(a => a.includes('Rôdeur'))).toBe(true);
    });

    it('aller-retour : garder puis invoquer redonne les mêmes adversaires', () => {
        const luv = { id: 'pnj-luv', name: 'Luv', role: 'boss', initiative: 0, hp: 9, maxHp: 9, avatar: '',
            roleplayingNotes: '', gmSecretInfo: '' } as Entity;
        const plateau = [
            fabrique('Pillard 1'), fabrique('Pillard 2'),
            c('Luv', { sourceEntityId: 'pnj-luv' }),
            c('Ripley', { isPlayer: true, faction: 'player' }),
        ];
        const { lignes } = rencontreDuPlateau(plateau, [gabarit]);
        const ctx: ContexteDInvocation = {
            champs: [], typeDeSante: 'hp', gabarits: [gabarit], entites: [luv],
            repartitionDe: () => ({ favorises: [], negliges: [] }), graine: 3,
        };
        const { combattants } = adversairesDeLaRencontre({ id: 'r', campaignId: 'c-1', nom: 'R', lignes, creeeLe: 1 }, ctx);
        expect(combattants.map(x => x.name).sort()).toEqual(['Luv', 'Pillard 1', 'Pillard 2']);
    });
});
