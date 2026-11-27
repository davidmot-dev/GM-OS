import { describe, expect, it } from 'vitest';
import { alignerLaFicheDeTraveller, excedentVers, physiqueDeTravellerSelonLeJeu, type RegleDuPhysiqueDeTraveller } from './physiqueDeTraveller';

const REGLE: RegleDuPhysiqueDeTraveller = {
    mecanique: 'traveller', endurance: 'endurance', force: 'force', dexterite: 'dexterite', excedent: 'excedent_degats',
    md: { endurance: 'endurance_md', force: 'force_md', dexterite: 'dexterite_md' },
};
const STATS = [
    { fieldId: 'sante_physique', isMainHP: true, max: 'endurance_max + force_max + dexterite_max' },
    { fieldId: 'endurance', max: 'endurance_max' },
    { fieldId: 'force', max: 'force_max' },
    { fieldId: 'dexterite', max: 'dexterite_max' },
];
const voyageur = (maj: Record<string, unknown> = {}) => ({
    endurance: 7, force: 6, dexterite: 8, endurance_max: 7, force_max: 6, dexterite_max: 8, sante_physique: 21, excedent_degats: 'Force', ...maj,
});

describe('Traveller — la porte des dégâts (p. 74, 76, 79-81)', () => {
    it('10 dégâts : END 7 → 0, puis 3 sur la FOR ; la santé principale perd 10, les MD suivent', () => {
        const r = physiqueDeTravellerSelonLeJeu(REGLE, voyageur(), { value: 10 }, STATS)!;
        expect(r.fiche).toMatchObject({ endurance: 0, force: 3, dexterite: 8, endurance_md: -3, force_md: -1, dexterite_md: 0 });
        expect(r.impact).toMatchObject({ value: 10, isRecovery: false });
        expect(r.texte).toBe('10 dégâts : END 7 → 0 (MD −3), FOR 6 → 3 (MD −1).');
    });

    it('l’excédent va à la DEX quand la fiche le choisit', () => {
        const r = physiqueDeTravellerSelonLeJeu(REGLE, voyageur({ excedent_degats: 'Dextérité' }), { value: 10 }, STATS)!;
        expect(r.fiche).toMatchObject({ force: 6, dexterite: 5 });
        expect([excedentVers('DEX'), excedentVers('dexterite'), excedentVers(''), excedentVers(undefined)]).toEqual(['dexterite', 'dexterite', 'force', 'force']);
    });

    it('FOR à 0 : inconscient ; les trois à 0 : tué', () => {
        expect(physiqueDeTravellerSelonLeJeu(REGLE, voyageur(), { value: 13 }, STATS)!.texte).toContain('inconscient');
        const mort = physiqueDeTravellerSelonLeJeu(REGLE, voyageur(), { value: 40 }, STATS)!;
        expect(mort.impact.value).toBe(21);
        expect(mort.texte).toContain('tué');
    });

    it('une arme incapacitante ne touche que l’END, et neutralise pour l’excédent en rounds (p. 76)', () => {
        const r = physiqueDeTravellerSelonLeJeu(REGLE, voyageur(), { value: 10, type: 'Incapacitante' }, STATS)!;
        expect(r.fiche).toMatchObject({ endurance: 0, force: 6, dexterite: 8 });
        expect(r.impact.value).toBe(7);
        expect(r.texte).toContain('neutralisé 3 rounds');
    });

    it('un soin se répartit équitablement, sans dépasser les valeurs d’avant les blessures (p. 79)', () => {
        const r = physiqueDeTravellerSelonLeJeu(REGLE, voyageur({ endurance: 0, force: 3, sante_physique: 11 }), { value: 5, isRecovery: true }, STATS)!;
        expect(r.fiche).toMatchObject({ endurance: 3, force: 5, dexterite: 8 });
        expect(r.impact).toMatchObject({ value: 5, isRecovery: true });
    });

    it('la santé principale rejoint les caractéristiques corrigées à la main', () => {
        // L'END a été relevée à 7 sur la fiche, la jauge disait encore 11 : elle se réaligne.
        const r = physiqueDeTravellerSelonLeJeu(REGLE, voyageur({ sante_physique: 11 }), { value: 2 }, STATS)!;
        expect(r.impact).toMatchObject({ value: 8, isRecovery: true });
    });

    it('une créature n’a que ses PdV : la règle se retire (p. 81)', () => {
        expect(physiqueDeTravellerSelonLeJeu(REGLE, { sante_physique: 28 }, { value: 5 }, STATS)).toBeNull();
        expect(physiqueDeTravellerSelonLeJeu(undefined, voyageur(), { value: 5 }, STATS)).toBeNull();
    });
});

describe('Traveller — la fiche recalculée à l’enregistrement', () => {
    const pilote = {
        jet: { traveller: { md: { intellect: 'intellect_md', dexterite: 'dexterite_md' } } },
        combat: { physiqueTraveller: { ...REGLE, maximum: { endurance: 'endurance_max', force: 'force_max', dexterite: 'dexterite_max' } }, statsToTrack: STATS },
    };

    it('les MD suivent les niveaux, le total physique suit END + FOR + DEX', () => {
        const maj = alignerLaFicheDeTraveller(pilote, voyageur({ dexterite: 9, dexterite_max: 9, intellect: 4, intellect_md: 0, dexterite_md: 0, endurance_md: 0, force_md: 0 }));
        expect(maj).toEqual({ intellect_md: -1, dexterite_md: 1, sante_physique: 22 });
    });

    it('un niveau saisi au-dessus de son « sans blessure » le relève ; un blessé reste en deçà', () => {
        expect(alignerLaFicheDeTraveller(pilote, voyageur({ force: 9, sante_physique: 24, force_md: 1, dexterite_md: 0, endurance_md: 0 }))).toEqual({ force_max: 9 });
        expect(alignerLaFicheDeTraveller(pilote, voyageur({ force: 2, sante_physique: 17, force_md: -2, dexterite_md: 0, endurance_md: 0 }))).toEqual({});
    });

    it('un autre jeu n’est pas touché', () => {
        expect(alignerLaFicheDeTraveller({ combat: {} }, { force: 9 })).toEqual({});
    });
});
