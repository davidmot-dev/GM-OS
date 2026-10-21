import { describe, expect, it } from 'vitest';
import { avancerLeTempsAlien, combatAlienVierge, demanderUnCritique } from './combatAlien';
import { ajouterUneAvarie, commencerUneIntervention, consommerLActionPerdue, immuniteSynthetique, lireLeSynthetique, systemeArrete, terminerUneIntervention } from './synthetiquesAlien';
import { preparerLeJet, type DescripteurDeJet } from '../DescripteurDeJet';

const entrees = Array.from({ length: 6 }, (_, n) => ({ min: n + 1, max: n + 1, title: `Avarie ${n + 1}`, description: '', effect: `Effet ${n + 1}` }));
const avarie = (code: number) => ajouterUneAvarie(demanderUnCritique(combatAlienVierge(), 'a'), 'a', code, entrees);
const reprise = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
describe('Alien A4 — synthétiques, livre français p. 111', () => {
    it('ignore le Stress résiduel au moteur, sans modifier la fiche', () => {
        const fiche = { androide: '1', stress: 8 };
        const jet = { sens: 'superieur-ou-egal', reserve: { base: 3, secondaire: { base: 8 } }, panique: { faces: 6, suites: { mecanique: 'alien', stress: 'stress', androide: 'androide' } } } as DescripteurDeJet;
        expect(preparerLeJet(jet, fiche, { champs: {} }).desSecondaires).toBe(0);
        expect(preparerLeJet(jet, { androide: false }, { champs: {} }).desSecondaires).toBe(8);
        expect(fiche.stress).toBe(8);
    });
    it('aggrave seulement la même blessure que la précédente et traite chaque demande une fois', () => {
        let s = avarie(4);
        s = ajouterUneAvarie(demanderUnCritique(reprise(s), 'b'), 'b', 4, entrees);
        expect(lireLeSynthetique(s).avaries.map(v => v.code)).toEqual([4, 5]);
        expect(ajouterUneAvarie(s, 'b', 6, entrees)).toBe(s);
        s = ajouterUneAvarie(demanderUnCritique(s, 'c'), 'c', 4, entrees);
        expect(lireLeSynthetique(s).avaries.map(v => v.code)).toEqual([4, 5, 4]);
        const demandes = demanderUnCritique(demanderUnCritique(s, 'd'), 'e');
        expect(ajouterUneAvarie(demandes, 'e', 3, entrees)).toBe(demandes);
    });
    it('conserve la demande si la table est indisponible, et acquitte la perte d’action sans supprimer l’avarie', () => {
        const s = demanderUnCritique(combatAlienVierge(), 'a');
        expect(ajouterUneAvarie(s, 'a', 1, [])).toBe(s);
        const a = consommerLActionPerdue(avarie(1), 'a');
        expect(lireLeSynthetique(reprise(a)).avaries[0]).toMatchObject({ code: 1, actionPerdue: true });
    });
    it('permet les actions avec les avaries 1–5 ; seul 6 arrête le système, sans mort humaine', () => {
        for (let code = 1; code <= 6; code++) {
            expect(systemeArrete(avarie(code))).toBe(code === 6);
            expect(avarie(code).mort).toBe(false);
        }
    });
    it('répare après un Quart et un Comtech réussi, sans guérison passive ni double application', () => {
        let s = commencerUneIntervention(avarie(3), 'rep', 'reparer', false);
        expect(terminerUneIntervention(s, 'rep', 1)).toBe(s);
        s = avancerLeTempsAlien(s, 'jour'); expect(lireLeSynthetique(s).avaries).toHaveLength(1);
        s = avancerLeTempsAlien(s, 'quart');
        const fin = terminerUneIntervention(reprise(s), 'rep', 1);
        expect(lireLeSynthetique(fin)).toMatchObject({ avaries: [], interventionsTraitees: ['rep'] });
        expect(terminerUneIntervention(fin, 'rep', 1)).toBe(fin);
    });
    it('exige énergie, Tour et Comtech pour réactiver, puis un Quart et un autre Comtech pour réparer', () => {
        let s = avarie(6);
        expect(commencerUneIntervention(s, 'rep', 'reparer', true)).toBe(s);
        expect(commencerUneIntervention(s, 'on', 'reactiver', false)).toBe(s);
        s = commencerUneIntervention(s, 'on', 'reactiver', true);
        expect(terminerUneIntervention(s, 'on', 1, 'Trauma')).toBe(s);
        s = avancerLeTempsAlien(s, 'tour');
        expect(terminerUneIntervention(s, 'on', 1)).toBe(s);
        s = terminerUneIntervention(s, 'on', 1, 'Mémoire fragmentée');
        expect(lireLeSynthetique(s)).toMatchObject({ arret: true, reactive: true, traumatismes: ['Mémoire fragmentée'] });
        s = commencerUneIntervention(reprise(s), 'rep', 'reparer', false);
        s = terminerUneIntervention(avancerLeTempsAlien(s, 'quart'), 'rep', 1);
        expect(lireLeSynthetique(s)).toMatchObject({ arret: false, avaries: [], traumatismes: ['Mémoire fragmentée'] });
    });
    it('un échec consomme l’intervention ; une critique en attente doit être résolue avant la fin du travail', () => {
        let s = commencerUneIntervention(avarie(3), 'rep', 'reparer', false);
        s = terminerUneIntervention(avancerLeTempsAlien(s, 'quart'), 'rep', 0);
        expect(lireLeSynthetique(s).avaries).toHaveLength(1);
        expect(commencerUneIntervention(s, 'rep', 'reparer', false)).toBe(s);
        s = commencerUneIntervention(s, 'autre', 'reparer', false);
        s = demanderUnCritique(s, 'coup');
        expect(terminerUneIntervention(avancerLeTempsAlien(s, 'quart'), 'autre', 1)).toMatchObject({ critiques: ['coup'] });
        s = ajouterUneAvarie(s, 'coup', 2, entrees);
        expect(lireLeSynthetique(s).intervention?.id).toBe('autre');
    });
    it('n’étend pas les immunités au feu, à l’acide, aux radiations ni à toutes les infections aliens', () => {
        for (const origine of ['vide', 'froid', 'maladie']) expect(immuniteSynthetique(origine)).toBe(true);
        for (const origine of ['feu', 'acide', 'radiations', 'pathogene']) expect(immuniteSynthetique(origine)).toBe(false);
    });
});
