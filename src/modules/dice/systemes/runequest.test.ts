import { describe, it, expect } from 'vitest';
import { degreDuDe } from '../degresDeReussite';
import { preparerLeJet, type DescripteurDeJet } from '../DescripteurDeJet';
import type { SheetSection } from '../../../data/defaultSheetTemplates';
import {
    CHOIX_DE_RUNEQUEST, calculerRuneQuest, degreAdverse, echelleDeRuneQuest, issueDeLOpposition, localisationDuCoup,
    niveauDeRuneQuest, nommerLeJetDeRuneQuest, plagesDeRuneQuest,
} from './runequest';

/**
 * **La Table de résultats des aptitudes, telle qu'imprimée p. 143** (PDF 144), lue
 * ligne à ligne le 30/10/2026. Chaque ligne : plage d'aptitude, plafond du critique,
 * plafond de la spéciale, début de l'échec critique. Le module ne recopie pas ces
 * nombres ; il les retrouve par trois arrondis, et cet essai le vérifie aux deux bornes
 * de chaque ligne.
 */
const TABLE_P143: [number, number, number, number, number][] = [
    [1, 5, 1, 1, 96], [6, 7, 1, 1, 96], [8, 10, 1, 2, 96], [11, 12, 1, 2, 97], [13, 17, 1, 3, 97],
    [18, 22, 1, 4, 97], [23, 27, 1, 5, 97], [28, 29, 1, 6, 97], [30, 30, 2, 6, 97], [31, 32, 2, 6, 98],
    [33, 37, 2, 7, 98], [38, 42, 2, 8, 98], [43, 47, 2, 9, 98], [48, 49, 2, 10, 98], [50, 50, 3, 10, 98],
    [51, 52, 3, 10, 99], [53, 57, 3, 11, 99], [58, 62, 3, 12, 99], [63, 67, 3, 13, 99], [68, 69, 3, 14, 99],
    [70, 70, 4, 14, 99], [71, 72, 4, 14, 100], [73, 77, 4, 15, 100], [78, 82, 4, 16, 100], [83, 87, 4, 17, 100],
    [88, 89, 4, 18, 100], [90, 92, 5, 18, 100], [93, 95, 5, 19, 100], [96, 97, 5, 19, 100], [98, 102, 5, 20, 100],
    [103, 107, 5, 21, 100], [108, 109, 5, 22, 100], [110, 112, 6, 22, 100], [113, 117, 6, 23, 100], [118, 122, 6, 24, 100],
];

describe('la table de résultats des aptitudes (p. 143)', () => {
    it.each(TABLE_P143)('aptitude %i-%i : critique 01-%i, spéciale 01-%i, échec critique dès %i', (de, a, critique, speciale, echec) => {
        for (const v of [de, a]) {
            const e = echelleDeRuneQuest(v);
            expect([e.particuliere, e.significative, e.echecTotal], `aptitude ${v}`).toEqual([critique, speciale, echec]);
            expect(e.echecParticulier).toBeNull();
        }
    });

    it('borne la réussite à 05-95 : 1-5 réussit toujours, 96-00 échoue toujours (p. 142)', () => {
        expect(echelleDeRuneQuest(3).chances).toBe(5);
        expect(degreDuDe(4, echelleDeRuneQuest(3))).toBe('reussite-normale');
        expect(echelleDeRuneQuest(120).chances).toBe(95);
        expect(degreDuDe(97, echelleDeRuneQuest(120))).toBe('echec-normal');
        expect(degreDuDe(100, echelleDeRuneQuest(120))).toBe('echec-total');
    });

    it('rend l’exemple du livre : 02 sur 56 % est une réussite critique ; 99 et 00 des échecs critiques (p. 142)', () => {
        const e = echelleDeRuneQuest(56);
        expect(niveauDeRuneQuest(degreDuDe(2, e))).toBe('reussite-critique');
        expect(niveauDeRuneQuest(degreDuDe(11, e))).toBe('reussite-speciale');
        expect(niveauDeRuneQuest(degreDuDe(56, e))).toBe('reussite');
        expect(niveauDeRuneQuest(degreDuDe(57, e))).toBe('echec');
        expect(niveauDeRuneQuest(degreDuDe(99, e))).toBe('echec-critique');
        expect(niveauDeRuneQuest(degreDuDe(100, e))).toBe('echec-critique');
    });

    it('dit les plages comme le livre', () => {
        expect(plagesDeRuneQuest(echelleDeRuneQuest(50))).toBe('critique 01-03 · spéciale 01-10 · réussite 01-50 · échec critique 98-00');
        expect(plagesDeRuneQuest(echelleDeRuneQuest(80))).toBe('critique 01-04 · spéciale 01-16 · réussite 01-80 · échec critique 00');
    });
});

describe('le calcul des chances', () => {
    const epee = { label: 'Épée large', valeur: 65, caracteristique: false };
    const con = { label: 'CON', valeur: 13, caracteristique: true };

    it('lance une aptitude telle quelle, sans explication superflue', () => {
        const c = calculerRuneQuest(epee, CHOIX_DE_RUNEQUEST);
        expect(c.chancesModifiees).toBe(65);
        expect(c.explication).toBe('');
    });

    it('ajoute situation et augmentation, retire 25 à la nouvelle tentative (p. 142, 144)', () => {
        const c = calculerRuneQuest(epee, { ...CHOIX_DE_RUNEQUEST, modificateur: -10, augmentation: 30, nouvelleTentative: true });
        expect(c.chancesModifiees).toBe(60);
        expect(c.explication).toBe('Épée large 65 % + 30 augmentation − 10 situation − 25 nouvelle tentative = 60 %');
    });

    it('teste une caractéristique ×5 par défaut, ×0,5 arrondi (p. 141)', () => {
        expect(calculerRuneQuest(con, CHOIX_DE_RUNEQUEST).chancesModifiees).toBe(65);
        const c = calculerRuneQuest(con, { ...CHOIX_DE_RUNEQUEST, multiplicateur: 0.5 });
        expect(c.chancesModifiees).toBe(7);
        expect(c.explication).toBe('CON 13 × 0,5 = 7 %');
        expect(c.remarques[0]).toContain('6,5 %');
    });

    it('oppose deux caractéristiques sur la table de résistance (p. 145) — l’exemple du gaz : PUI 8 contre CON 11, 35 %', () => {
        const c = calculerRuneQuest({ label: 'PUI', valeur: 8, caracteristique: true }, { ...CHOIX_DE_RUNEQUEST, mode: 'resistance', passive: 11 });
        expect(c.chancesModifiees).toBe(35);
        expect(c.mode).toBe('resistance');
        const vasana = calculerRuneQuest({ label: 'POU', valeur: 15, caracteristique: true }, { ...CHOIX_DE_RUNEQUEST, mode: 'resistance', passive: 14 });
        expect(vasana.chancesModifiees).toBe(55);
    });

    it('retire l’excédent au-delà de 100 % aux deux camps (p. 144) — Kopis 120 % contre Bouclier 65 %', () => {
        const c = calculerRuneQuest({ label: 'Kopis', valeur: 120, caracteristique: false }, { ...CHOIX_DE_RUNEQUEST, adverse: 65 });
        expect(c.chancesModifiees).toBe(100);
        expect(c.adverseReduite).toBe(45);
        expect([c.echelle.particuliere, c.echelle.significative]).toEqual([5, 20]);
        const nathem = calculerRuneQuest({ label: 'Recherche', valeur: 55, caracteristique: false }, { ...CHOIX_DE_RUNEQUEST, adverse: 120 });
        expect(nathem.chancesModifiees).toBe(35);
        expect(nathem.adverseReduite).toBe(100);
    });

    it('sans opposition au-delà de 100 %, garde le surplus pour critique et spéciale (p. 144)', () => {
        const c = calculerRuneQuest({ label: 'Kopis', valeur: 120, caracteristique: false }, CHOIX_DE_RUNEQUEST);
        expect([c.echelle.chances, c.echelle.particuliere, c.echelle.significative]).toEqual([95, 6, 24]);
    });
});

describe('l’opposition (errata p. 142 et 144)', () => {
    it('donne la victoire au meilleur niveau de réussite, et l’égalité à deux niveaux égaux', () => {
        expect(issueDeLOpposition('reussite-significative', 'reussite-normale')).toBe('gagne');
        expect(issueDeLOpposition('reussite-normale', 'reussite-particuliere')).toBe('perd');
        expect(issueDeLOpposition('reussite-particuliere', 'reussite-particuliere')).toBe('egalite');
        expect(issueDeLOpposition('reussite-normale', 'echec-total')).toBe('gagne');
        expect(issueDeLOpposition('echec-normal', 'echec-total')).toBe('deux-perdants');
    });

    it('lit le dé adverse sur son aptitude', () => {
        expect(degreAdverse(94, 90)).toBe('echec-normal');
        expect(degreAdverse(12, 75)).toBe('reussite-significative');
    });
});

describe('le résultat nommé', () => {
    it('dit le niveau du livre et les plages', () => {
        const e = echelleDeRuneQuest(65);
        const brut = { total: 3, rolls: [{ val: 3, sides: 100 }], modifier: 0, degre: degreDuDe(3, e), tagSuccess: true, totalDisplay: '3 vs 65' };
        const jet = nommerLeJetDeRuneQuest(brut, e);
        expect(jet.runequest.libelle).toBe('Réussite critique');
        expect(jet.totalDisplay).toBe('Réussite critique — 03 contre 65 % (critique 01-03 · spéciale 01-13 · réussite 01-65 · échec critique 99-00)');
    });
});

describe('preparerLeJet, sur un pilote RuneQuest', () => {
    const descripteur: DescripteurDeJet = {
        seuil: [{ id: 'aptitude', label: 'Aptitude', sectionId: 'competences', sectionsSupplementaires: ['caracteristiques'] }],
        reserve: { base: 1, max: 1, faces: 100 },
        sens: 'sous-ou-egal',
        runequest: { caracteristiques: ['for', 'con'] },
    };
    const sections = [
        { id: 'caracteristiques', label: 'Caractéristiques', fields: [{ id: 'for', label: 'FOR', type: 'number' }, { id: 'con', label: 'CON', type: 'number' }] },
        { id: 'competences', label: 'Compétences', fields: [{ id: 'epee_large', label: 'Épée large', type: 'number' }] },
    ] as unknown as SheetSection[];

    it('pose l’échelle du livre sur une compétence modifiée', () => {
        const jet = preparerLeJet(descripteur, { epee_large: 65 }, { champs: { aptitude: 'epee_large' }, runequest: { modificateur: -15 } }, sections);
        expect(jet.seuil).toBe(50);
        expect(jet.echelle).toMatchObject({ chances: 50, particuliere: 3, significative: 10, echecTotal: 98 });
        expect(jet.explicationDuSeuil).toBe('Épée large 65 % − 15 situation = 50 %');
        expect(jet.avertissements).toEqual([]);
    });

    it('nomme une arme par le nom saisi sur la fiche', () => {
        const avecArme = [...sections, { id: 'armes', label: 'Armes', fields: [
            { id: 'arme1_nom', label: 'Arme 1 — nom', type: 'text' },
            { id: 'arme1', label: 'Arme de mêlée 1', type: 'number', libelleSur: 'arme1_nom' },
        ] }] as unknown as SheetSection[];
        const jet = preparerLeJet({ ...descripteur, seuil: [{ ...descripteur.seuil![0], sectionsSupplementaires: ['caracteristiques', 'armes'] }] },
            { arme1_nom: 'Épée large', arme1: 65 }, { champs: { aptitude: 'arme1' }, runequest: { modificateur: 10 } }, avecArme);
        expect(jet.explicationDuSeuil).toBe('Épée large 65 % + 10 situation = 75 %');
    });

    it('teste une caractéristique ×5, et non sous sa valeur brute', () => {
        const jet = preparerLeJet(descripteur, { con: 13 }, { champs: { aptitude: 'con' } }, sections);
        expect(jet.seuil).toBe(65);
        expect(jet.runequest?.mode).toBe('caracteristique');
    });
});

describe('la localisation des coups (p. 146)', () => {
    it.each([[1, 'Jambe droite'], [4, 'Jambe droite'], [5, 'Jambe gauche'], [11, 'Abdomen'], [12, 'Poitrine'], [15, 'Bras droit'], [18, 'Bras gauche'], [19, 'Tête'], [20, 'Tête']])(
        '%i → %s', (de, label) => expect(localisationDuCoup(de).label).toBe(label));
});
