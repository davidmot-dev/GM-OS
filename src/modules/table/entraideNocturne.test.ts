import { describe, expect, it } from 'vitest';
import { calmeNocturne, debordementNocturne } from './entraideNocturne';
import type { HerosDeLaTable } from './gestesDesHeros';
import type { GestesDesHeros } from '../../types/drivers';
const h = (id: string, valeurs: Record<string, unknown>): HerosDeLaTable => ({ id, joueurId: 'j', nom: id, valeurs });
const geste: NonNullable<GestesDesHeros['momentDeCalme']> = { heros: [
    { champ: 'espoir', delta: 1, plus: 'extase', max: { champ: 'ferveur', fois: 2, plus: 3, plafond: 10 } },
    { champ: 'trauma', delta: -1, plancher: 'sequelles_trauma' }], leve: ['fatigue'],
    amputation: { champ: 'soupcon', label: 'Soupçon', seuils: [{ aPartirDe: 5, points: 2 }, { aPartirDe: 8, points: 4 }] } };
const effet = [{ id: 'intervention', label: 'Intervention', heros: [{ champ: 'noirceur', delta: 2, resistance: 'lumiere', max: 10 }] }];
describe('entraide de NOC, livre p. 220, 232–234 et 248', () => {
    it('donne l’Extase à un allié sans la garder aussi pour soi, sous son propre plafond', () => {
        const r = calmeNocturne(geste, [h('A', { extase: 3, espoir: 0, ferveur: 4 }), h('B', { espoir: 4, ferveur: 1 })], { extase: { A: { B: 3 } } }, x => x);
        expect(r.erreurs).toEqual([]); expect(r.changements[0].maj.espoir).toBe(1); expect(r.changements[1].maj.espoir).toBe(5);
    });
    it('refuse les points dupliqués et les bénéficiaires absents', () => {
        const r = calmeNocturne(geste, [h('A', { extase: 2 })], { extase: { A: { A: 3, disparu: 1 } } }, x => x);
        expect(r.erreurs.length).toBeGreaterThan(0);
    });
    it('répartit le Soupçon seulement sur des récupérations effectives, sans dépasser les séquelles', () => {
        const r = calmeNocturne(geste, [h('A', { espoir: 0, extase: 1, ferveur: 1, soupcon: 5, trauma: 3, sequelles_trauma: 2 })], { amputation: { A: { espoir: 1, trauma: 1 } } }, x => x);
        expect(r.erreurs).toEqual([]); expect(r.changements[0].maj).toEqual({ espoir: 1, trauma: 3 });
        expect(r.recuperations.A).toEqual({ espoir: 2, trauma: 1 });
    });
    it('ne fait jamais perdre davantage que ce qui aurait été récupéré', () => {
        const r = calmeNocturne(geste, [h('A', { espoir: 5, ferveur: 1, soupcon: 8, trauma: 1, sequelles_trauma: 1 })], {}, x => x);
        expect(r.amputations.A).toBe(0); expect(r.erreurs).toEqual([]); expect(r.changements[0].maj).toEqual({});
    });
    it('un repos partiel ne diminue pas le Fiel collectif et n’écrit pas les absents', () => {
        const r = calmeNocturne(geste, [h('A', {}), h('B', {})], { participants: ['A'] }, x => x);
        expect(r.collectif).toBe(false); expect(r.changements.map(c => c.herosId)).toEqual(['A']);
    });
    it('un Rouage allié ne bloque pas le repos collectif et ne reçoit que la Fatigue des effets', () => {
        const personnages = [h('A', {}), { ...h('Rouage', { espoir: 3, trauma: 1 }), allie: true }];
        expect(calmeNocturne(geste, personnages, {}, x => x).collectif).toBe(true);
        const r = debordementNocturne([...effet, { id: 'fatigue', label: 'Fatigue', heros: [{ champ: 'espoir', delta: -1 }] }],
            { intervention: 1, fatigue: 1 }, personnages, {}, x => x);
        expect(r.changements.find(c => c.herosId === 'Rouage')?.maj).toEqual({ espoir: 2 });
    });
    it('cumule les Lumières, mais une unité transférée ne protège plus son propriétaire', () => {
        const r = debordementNocturne(effet, { intervention: 2 }, [h('A', { lumiere: 2 }), h('B', { lumiere: 1 })], { lumiere: { A: { B: 2 } } }, x => x);
        expect(r.erreurs).toEqual([]); expect(r.changements[0].maj.noirceur).toBe(4); expect(r.changements[1].maj.noirceur).toBe(1);
    });
    it('n’écrit pas les personnages épargnés et garde la fragilité d’une Lumière négative', () => {
        const r = debordementNocturne(effet, { intervention: 1 }, [h('A', { lumiere: -1 }), h('B', {})], { epargnes: ['B'] }, x => x);
        expect(r.changements).toHaveLength(1); expect(r.changements[0].maj.noirceur).toBe(3);
    });
});
