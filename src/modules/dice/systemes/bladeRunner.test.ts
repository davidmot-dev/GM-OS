import { describe, it, expect } from 'vitest';
import {
    CLE_BLADE_RUNNER, DUREES, ajouterLaBlessure, desDeCritique, ecrireLeSuivi, estEchue, forcerBR, guerir, lancerBR,
    lireLaBlessure, lireLeSuivi, poigneeBR, sauvegarder, secourir, soigner, stabiliser, type SuiviBR,
} from './bladeRunner';

/**
 * Blade Runner, livre de base français (p. 71–76) — la mort, la stabilisation,
 * la guérison et les secours, tels que le pilote fini les suit (2026-10-24).
 */
const PLAIE = { title: 'Plaie au ventre', effect: 'Mortel : Oui (Limite : Quart). Durée de guérison : Une semaine. Les jets de MOBILITÉ rouvrent la plaie.' };
const BASSIN = { title: 'Fracture du bassin', effect: 'Mortel : Oui (Limite : Round). Durée de guérison : Un mois. Vous ne pouvez pas vous tenir debout et devez ramper pour vous déplacer.' };
const COEUR = { title: 'Cœur transpercé', effect: 'Mortel : Oui. Mort instantanée.' };
const NEZ = { title: 'Nez cassé', effect: "Mortel : Non. Durée de guérison : Une semaine. Désavantage aux jets d'OBSERVATION." };
const CERVICALE = { title: 'Fracture cervicale', effect: 'Mortel : Oui (Limite : Quart). Durée de guérison : Permanent. Vous ne pouvez plus bouger.' };

const vide: SuiviBR = { blessures: [] };

describe('les tables de blessures critiques, lues (p. 73)', () => {
    it('mortelle, limite et durée sortent du texte de la table', () => {
        expect(lireLaBlessure(PLAIE, 'b1', { table: 'Perforant', de: 5 })).toMatchObject({
            titre: 'Plaie au ventre', table: 'Perforant', de: 5, mortelle: true, limite: 'quart', guerison: 'semaine',
            etat: 'menace', effet: 'Les jets de MOBILITÉ rouvrent la plaie.',
        });
        expect(lireLaBlessure(BASSIN, 'b2')).toMatchObject({ limite: 'round', guerison: 'mois', etat: 'menace' });
        expect(lireLaBlessure(NEZ, 'b3')).toMatchObject({ mortelle: false, etat: 'a-soigner', effet: "Désavantage aux jets d'OBSERVATION." });
    });

    it('« Mort instantanée » : pas de sauvegarde', () => {
        expect(lireLaBlessure(COEUR, 'b4').etat).toBe('fatale');
    });
});

describe('mort et stabilisation (p. 72)', () => {
    it('une sauvegarde ratée tue ; réussie, on tient jusqu’à la prochaine limite', () => {
        const s = ajouterLaBlessure(vide, lireLaBlessure(PLAIE, 'b1'));
        expect(sauvegarder(s, 'b1', true).blessures[0]).toMatchObject({ etat: 'menace', survies: 1 });
        expect(sauvegarder(s, 'b1', false).blessures[0].etat).toBe('fatale');
    });

    it('stabiliser fait passer un Round à un Quart, puis met hors de danger', () => {
        let s = ajouterLaBlessure(vide, lireLaBlessure(BASSIN, 'b2'));
        s = stabiliser(s, 'b2', true);
        expect(s.blessures[0]).toMatchObject({ etat: 'menace', limite: 'quart' });
        s = stabiliser(s, 'b2', true);
        expect(s.blessures[0].etat).toBe('a-soigner');
        // Ratée : rien ne change, on retente après la sauvegarde.
        const raté = stabiliser(ajouterLaBlessure(vide, lireLaBlessure(BASSIN, 'b2')), 'b2', false);
        expect(raté.blessures[0]).toMatchObject({ etat: 'menace', limite: 'round' });
    });
});

describe('guérison des critiques (p. 72)', () => {
    it('soignée : l’effet dure jusqu’à l’échéance, une semaine ou un mois d’horloge', () => {
        const s = soigner(ajouterLaBlessure(vide, lireLaBlessure(NEZ, 'b3')), 'b3', true, 1000);
        expect(s.blessures[0]).toMatchObject({ etat: 'en-guerison', echeance: 1000 + DUREES.semaine });
        expect(estEchue(s.blessures[0], 1000 + DUREES.semaine - 1)).toBe(false);
        expect(estEchue(s.blessures[0], 1000 + DUREES.semaine)).toBe(true);
        expect(guerir(s, 'b3').blessures[0].etat).toBe('guerie');
    });

    it('des soins ratés rendent la blessure permanente ; une durée « permanente » est incurable', () => {
        expect(soigner(ajouterLaBlessure(vide, lireLaBlessure(NEZ, 'b3')), 'b3', false).blessures[0].etat).toBe('permanente');
        const cervicale = stabiliser(ajouterLaBlessure(vide, lireLaBlessure(CERVICALE, 'b5')), 'b5', true);
        expect(soigner(cervicale, 'b5', true, 0).blessures[0].etat).toBe('permanente');
    });

    it('une blessure mortelle ne se soigne qu’une fois stabilisée', () => {
        const s = ajouterLaBlessure(vide, lireLaBlessure(PLAIE, 'b1'));
        expect(soigner(s, 'b1', true, 0)).toBe(s);
    });
});

describe('ce que la fiche garde', () => {
    it('le suivi s’écrit sous sa clé, et le champ texte se réécrit sans les blessures guéries', () => {
        let s = ajouterLaBlessure(vide, lireLaBlessure(PLAIE, 'b1', { table: 'Perforant' }));
        s = ajouterLaBlessure(s, { ...lireLaBlessure(NEZ, 'b3'), etat: 'guerie' });
        const maj = ecrireLeSuivi({ blessures: 'blessuresCritiques' }, s);
        expect(maj[CLE_BLADE_RUNNER]).toBe(s);
        expect(maj.blessuresCritiques).toBe('Plaie au ventre (Perforant) — mortelle, sauvegarde chaque Quart : Les jets de MOBILITÉ rouvrent la plaie.');
        expect(lireLeSuivi(maj).blessures).toHaveLength(2);
        expect(lireLeSuivi({}).blessures).toEqual([]);
    });

    it('les lignes tapées à la main survivent ; celles du suivi se remplacent', () => {
        const regle = { blessures: 'blessuresCritiques' };
        const premier = ecrireLeSuivi(regle, ajouterLaBlessure(vide, lireLaBlessure(PLAIE, 'b1')), { blessuresCritiques: 'Œil lacéré (écrit en séance)' });
        expect(premier.blessuresCritiques).toBe('Œil lacéré (écrit en séance)\nPlaie au ventre — mortelle, sauvegarde chaque Quart : Les jets de MOBILITÉ rouvrent la plaie.');
        const apres = ecrireLeSuivi(regle, stabiliser(lireLeSuivi(premier), 'b1', true), premier);
        expect(apres.blessuresCritiques).toBe('Œil lacéré (écrit en séance)\nPlaie au ventre — à soigner : Les jets de MOBILITÉ rouvrent la plaie.');
    });
});

describe('les jets du suivi', () => {
    it('deux dés de la fiche, l’avantage du matériel ; six une réussite, dix deux', () => {
        const poignee = poigneeBR([{ label: 'Intelligence', niveau: 'B' }, { label: 'Assistance médicale', niveau: 'D' }], 'avantage');
        expect(poignee.map(d => d.faces)).toEqual([10, 6, 6]);
        const valeurs = [10, 1, 6];
        const jet = lancerBR(poignee, () => valeurs.shift()!);
        expect(jet).toMatchObject({ reussites: 3, uns: 1 });
    });

    it('forcer garde les réussites et les 1, relance le reste', () => {
        const valeurs = [7];
        const force = forcerBR({ des: [{ faces: 10, val: 3, label: 'V' }, { faces: 8, val: 1, label: 'E' }], reussites: 0, uns: 1 }, () => valeurs.shift()!);
        expect(force.des.map(d => d.val)).toEqual([7, 1]);
        expect(force).toMatchObject({ reussites: 1, uns: 1 });
    });

    it('les secours ne relèvent qu’un Brisé, d’autant de points que de réussites', () => {
        expect(secourir(0, 8, 2)).toBe(2);
        expect(secourir(0, 1, 2)).toBe(1);
        expect(secourir(3, 8, 2)).toBeNull();
        expect(secourir(0, 8, 0)).toBeNull();
    });

    it('critiques aggravés : trois réussites au tir, deux dés de critique (exemple p. 85)', () => {
        expect(desDeCritique(2)).toBe(1);
        expect(desDeCritique(3)).toBe(2);
    });
});
