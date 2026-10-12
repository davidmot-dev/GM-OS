import { describe, it, expect } from 'vitest';
import {
    adversairesDeLaRencontre, combattantDeLEntite, pjsCandidats, sceneDeLInvocation,
    type ContexteDInvocation,
} from './invocationDeRencontre';
import type { RencontrePreparee } from '../../../types/rencontres.types';
import type { Entity } from '../../../types/entity.types';
import type { GabaritDAdversaire } from '../useBestiaireStore';

const champs: ContexteDInvocation['champs'] = [
    { id: 'force', label: 'Force', type: 'number', defaultValue: 5, max: 10 },
    { id: 'agilite', label: 'Agilité', type: 'number', defaultValue: 5, max: 10 },
];

const gabarit: GabaritDAdversaire = {
    id: 'g-pillard', jeuId: 'jeu', nom: 'Pillard', archetypeId: 'brute', rangId: 'pietaille',
    sheetData: { force: 9 }, notes: 'Frappe le plus faible.', creeLe: 1,
};

const luv = { id: 'pnj-luv', name: 'Luv', role: 'boss', initiative: 3, hp: 12, maxHp: 12, avatar: '',
    roleplayingNotes: '', gmSecretInfo: 'Réplicante.' } as Entity;

const ctx = (surcharge: Partial<ContexteDInvocation> = {}): ContexteDInvocation => ({
    champs, typeDeSante: 'hp', gabarits: [gabarit], entites: [luv],
    repartitionDe: () => ({ favorises: ['force'], negliges: [] }), graine: 42, ...surcharge,
});

const rencontre = (lignes: RencontrePreparee['lignes']): RencontrePreparee =>
    ({ id: 'r', campaignId: 'c-1', nom: 'La patrouille', lignes, creeeLe: 1 });

describe('adversairesDeLaRencontre — fabriqués à neuf', () => {
    it('fabrique N exemplaires d’un gabarit, numérotés, et le gabarit passe par-dessus le tirage', () => {
        const { combattants, avertissements } = adversairesDeLaRencontre(rencontre([
            { genre: 'gabarit', gabaritId: 'g-pillard', nombre: 3, nom: 'Pillard', archetypeId: 'brute', rangId: 'pietaille' },
        ]), ctx());
        expect(avertissements).toEqual([]);
        expect(combattants.map(c => c.name)).toEqual(['Pillard 1', 'Pillard 2', 'Pillard 3']);
        expect(combattants.every(c => c.sheetData?.force === 9)).toBe(true);
        expect(combattants[0].roleplayingNotes).toBe('Frappe le plus faible.');
        expect(combattants[0].faction).toBe('enemy');
        expect(combattants[0].init, 'l’initiative ne se tire pas à l’invocation').toBe(0);
    });

    it('⚠️ un gabarit absent de cette machine retombe sur son archétype, et le dit', () => {
        const { combattants, avertissements } = adversairesDeLaRencontre(rencontre([
            { genre: 'gabarit', gabaritId: 'inconnu', nombre: 2, nom: 'Agent de Wallace', archetypeId: 'tireur', rangId: 'aguerri' },
        ]), ctx({ gabarits: [] }));
        expect(combattants.map(c => c.name)).toEqual(['Agent de Wallace 1', 'Agent de Wallace 2']);
        expect(combattants[0].origineFabriquee).toEqual({ archetypeId: 'tireur', rangId: 'aguerri' });
        expect(avertissements).toHaveLength(1);
    });

    it('envoie un PNJ de la campagne tel qu’il est, et saute un PNJ disparu en le disant', () => {
        const { combattants, avertissements } = adversairesDeLaRencontre(rencontre([
            { genre: 'entite', entiteId: 'pnj-luv' },
            { genre: 'entite', entiteId: 'pnj-efface' },
        ]), ctx());
        expect(combattants.map(c => c.name)).toEqual(['Luv']);
        expect(combattants[0].sourceEntityId).toBe('pnj-luv');
        expect(avertissements).toHaveLength(1);
    });

    it('le camp de la ligne passe devant le rôle du PNJ', () => {
        expect(combattantDeLEntite(luv).faction).toBe('enemy');
        expect(combattantDeLEntite(luv, 'ally').faction).toBe('ally');
    });

    it('deux invocations fabriquent des exemplaires neufs — une rencontre est un modèle', () => {
        const r = rencontre([{ genre: 'archetype', archetypeId: 'brute', rangId: 'pietaille', nombre: 1 }]);
        const a = adversairesDeLaRencontre(r, ctx({ graine: 1 })).combattants;
        const b = adversairesDeLaRencontre(r, ctx({ graine: 1 })).combattants;
        expect(a[0]).not.toBe(b[0]);
        expect(a[0]).toEqual(b[0]);
    });
});

describe('sceneDeLInvocation — où la rencontre se joue', () => {
    it('sa scène, sinon celle du combat, sinon la seule scène en cours', () => {
        expect(sceneDeLInvocation({ sceneId: 'sc-r' }, 'sc-combat', ['sc-1'])).toBe('sc-r');
        expect(sceneDeLInvocation({}, 'sc-combat', ['sc-1'])).toBe('sc-combat');
        expect(sceneDeLInvocation({}, null, ['sc-1'])).toBe('sc-1');
    });

    it('plusieurs scènes en cours et rien de rattaché : on ne choisit pas à la place du meneur', () => {
        expect(sceneDeLInvocation({}, null, ['sc-1', 'sc-2'])).toBeNull();
        expect(sceneDeLInvocation({}, null, [])).toBeNull();
    });
});

describe('pjsCandidats — « Qui entre ? »', () => {
    const persos = [
        { id: 'ripley', name: 'Ripley', campaignId: 'c-1' },
        { id: 'dallas', name: 'Dallas', campaignId: 'c-1' },
        { id: 'ailleurs', name: 'Ailleurs', campaignId: 'c-2' },
    ];

    it('les PJ de la campagne, cochés d’avance quand la scène les déclare présents', () => {
        const c = pjsCandidats(persos, 'c-1', ['ripley'], ['dallas']);
        expect(c.map(p => p.id)).toEqual(['ripley', 'dallas']);
        expect(c.find(p => p.id === 'ripley')?.present).toBe(true);
        expect(c.find(p => p.id === 'dallas')?.present).toBe(false);
        expect(c.find(p => p.id === 'dallas')?.dejaEngage).toBe(true);
    });

    it('une rencontre libre sans scène ne coche personne', () => {
        expect(pjsCandidats(persos, 'c-1', [], []).some(p => p.present)).toBe(false);
    });
});
