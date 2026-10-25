import { describe, it, expect } from 'vitest';
import { creerConflitDune, commanderConflitDune, vueConflitDune, migrerConflitDune } from '../../src/modules/dice/systemes/conflitsDeDune';
import { validerLeManifeste } from '../../outils/modules-du-jeu/contrat.mjs';
import manifeste from '../../outils/dune/conflits/manifeste.json';
const MJ = { role: 'mj' as const }, PJ = { role: 'joueur' as const };
describe('plateau Dune', () => {
    it('manifeste, reprise et commandes réservées au MJ', () => {
        expect(validerLeManifeste(manifeste)).toEqual([]);
        expect(migrerConflitDune(creerConflitDune(), 1)).toEqual(creerConflitDune());
        expect(() => commanderConflitDune(creerConflitDune(), { id: 'scene', charge: { nom: 'a' } }, PJ)).toThrow('meneur');
        expect(() => migrerConflitDune({}, 1)).toThrow();
    });
    it('aucun désir, atout ou lien secret ne traverse vers la tablette', () => {
        let e = commanderConflitDune(creerConflitDune(), { id: 'zone', charge: { id: 'salon', nom: 'Salon', visible: true, desir: 'SECRET-POLITIQUE', discipline: 6 } }, MJ);
        e = commanderConflitDune(e, { id: 'zone', charge: { id: 'cache', nom: 'SECRET-LIEU', visible: false } }, MJ);
        e = commanderConflitDune(e, { id: 'lier', charge: { zoneId: 'salon', autreId: 'cache' } }, MJ);
        e = commanderConflitDune(e, { id: 'atout', charge: { id: 'arme', nom: 'SECRET-ARME', visible: false } }, MJ);
        const texte = JSON.stringify(vueConflitDune(e, PJ));
        expect(texte).not.toContain('SECRET'); expect(vueConflitDune(e, PJ).zones[0].liens).toEqual([]);
        e = commanderConflitDune(e, { id: 'desir', charge: { zoneId: 'salon', reussi: true, analyse: 8 } }, MJ);
        expect(vueConflitDune(e, PJ).zones[0].desir).toBe('SECRET-POLITIQUE');
    });
    it('déplace seulement sur une liaison, neutralise le tangible, détruit l’intangible, expire les temporaires', () => {
        let e = creerConflitDune();
        for (const id of ['a', 'b']) e = commanderConflitDune(e, { id: 'zone', charge: { id, nom: id } }, MJ);
        e = commanderConflitDune(e, { id: 'atout', charge: { id: 'lame', nom: 'Lame', zone: 'a', tangible: true, permanent: true } }, MJ);
        expect(() => commanderConflitDune(e, { id: 'deplacer', charge: { atoutId: 'lame', zoneId: 'b' } }, MJ)).toThrow('Reliez');
        e = commanderConflitDune(e, { id: 'lier', charge: { zoneId: 'a', autreId: 'b' } }, MJ);
        e = commanderConflitDune(e, { id: 'deplacer', charge: { atoutId: 'lame', zoneId: 'b' } }, MJ);
        expect(e.atouts[0].zone).toBe('b');
        e = commanderConflitDune(e, { id: 'neutraliser', charge: { atoutId: 'lame' } }, MJ); expect(e.atouts[0].neutralise).toBe(true);
        e = commanderConflitDune(e, { id: 'atout', charge: { id: 'rumeur', nom: 'Rumeur' } }, MJ);
        e = commanderConflitDune(e, { id: 'scene', charge: { nom: 'Nuit' } }, MJ);
        expect(e.atouts.map(a => [a.id, a.neutralise])).toEqual([['lame', false]]);
    });
});
