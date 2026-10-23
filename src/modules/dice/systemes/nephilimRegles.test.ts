import { describe, expect, it } from 'vitest';
import {
    bonusDuLieu, coutDeLExperience, degreDuKaDominant, degresVisibles, dureeDeGuerison, elementDuChamp, etatDesChutes, issueDuPacte, jetDeNephilim,
    malusDesConsequences, miseEnJeuPossible, opposer, optionsDEncaissement, palierDeChute, testDeStase, type RegleDeNephilim,
} from './nephilimRegles';

/** **Finir Nephilim** — les règles du Livre 0 et de l'errata V1.3 (23/10/2026). */
const piste = (prefixe: string) => ({
    cases: [
        { champ: `${prefixe}_case_1`, valeur: 1 }, { champ: `${prefixe}_case_2`, valeur: 2 }, { champ: `${prefixe}_case_3`, valeur: 3 },
        { champ: `${prefixe}_case_bonus_1`, valeur: 1, kaTerre: 5 }, { champ: `${prefixe}_case_bonus_2`, valeur: 1, kaTerre: 10 },
    ],
    consequences: [
        { champ: `${prefixe}_minor`, label: 'Mineure', absorbe: 2 },
        { champ: `${prefixe}_serious`, label: 'Sérieuse', absorbe: 4 },
        { champ: `${prefixe}_severe`, label: 'Grave', absorbe: 6 },
    ],
});
const regle: RegleDeNephilim = {
    composantes: { vecu: 'vecu', approche: 'approche', formule: 'formule', sort: 'sort' },
    arts: { magie: ['arts_magie'], kabbale: ['arts_kabbale'], alchimie: ['arts_alchimie'] },
    vecusPasses: ['les_vecus'], vecuContemporain: 'simulacrum_experience_degree',
    kaDominant: { choix: 'ka_dominant', degre: 'ka_dominant_degre' }, kaTerre: 'ka_earth',
    sapience: 'resources_sapience', stase: 'stasis_degree',
    chutes: { khaiba: 'falls_khaiba', ombre: 'falls_shadow', narcose: 'falls_narcosis', forme: 'falls_khaiba_form' },
    metamorphe: { degre: 'identity_metamorph_degree', visibles: 'identity_metamorph_visible', permanentes: ['metamorphoses_0_permanent', 'metamorphoses_1_permanent'] },
    sante: { physique: piste('phys'), magique: piste('mag') },
};
const sections = [
    { id: 'les_vecus', fields: [{ id: 'vecu_templier' }, { id: 'simulacrum_experience_degree' }] },
    { id: 'arts_magie', fields: [{ id: 'occult_magic_low' }] },
    { id: 'arts_kabbale', fields: [{ id: 'occult_kabbalah_hod' }] },
    { id: 'arts_alchimie', fields: [{ id: 'occult_alchemy_black' }] },
    { id: 'le_pentacle', fields: [{ id: 'ka_fire' }, { id: 'ka_water' }, { id: 'ka_earth' }] },
    { id: 'magie_sorts', fields: [{ id: 'magic_spells_0_degree' }, { id: 'magic_spells_0_element' }] },
    { id: 'alchimie_formules', fields: [{ id: 'alchemy_formulas_0_degree' }, { id: 'alchemy_formulas_0_element' }] },
];
const fiche = { ka_dominant: 'Feu', ka_fire: 5, ka_water: 2, ka_earth: 4, resources_sapience: 6, identity_metamorph_degree: 3, vecu_templier: 4, occult_magic_low: 4 };

describe('les éléments, les lieux et les conjonctions (p. 111, 160)', () => {
    it('lit l’élément d’un champ de Ka par son suffixe', () => {
        expect(elementDuChamp('ka_fire')).toBe('Feu');
        expect(elementDuChamp('alchemy_constructs_retort_moon')).toBe('Lune');
        expect(elementDuChamp('vecu_templier')).toBeUndefined();
    });
    it('Plexus +1 au Ka du lieu et −1 aux opposés ; Nexus +3 ; rien sans Ka au jet', () => {
        expect(bonusDuLieu('Feu', 1).total).toBe(1);
        expect(bonusDuLieu('Eau', 1).total).toBe(-1);
        expect(bonusDuLieu('Air', 1).total).toBe(0);
        expect(bonusDuLieu('Terre', 6).total).toBe(3);
        expect(bonusDuLieu(undefined, 6).total).toBe(0);
    });
    it('conjonction simple +1 sans malus ; grande conjonction +N et −N aux opposés', () => {
        expect(bonusDuLieu('Air', 0, 2, 1).total).toBe(1);
        expect(bonusDuLieu('Lune', 0, 2, 1).total).toBe(0);
        expect(bonusDuLieu('Air', 0, 2, 4).total).toBe(4);
        expect(bonusDuLieu('Terre', 0, 2, 4).total).toBe(-4);
        expect(bonusDuLieu('Feu', 1, 1, 3).details).toEqual(['Plexus de Feu +1', 'Grande conjonction de Feu +3']);
    });
});

describe('N1 · les Conséquences au jet (p. 137-138)', () => {
    const blesse = { ...fiche, phys_serious: true, mag_minor: true };
    it('cumule les malus cochés, par piste', () => {
        expect(malusDesConsequences(regle, { ...blesse, phys_minor: true })).toEqual({ physique: 6, magique: 2 });
    });
    it('retire le malus physique au Vécu (minimum 0), puis l’approche s’ajoute', () => {
        const j = jetDeNephilim(regle, blesse, { vecu: 'vecu_templier', approche: 'ka_fire' }, { actionPhysique: true }, 4, sections);
        expect(j.vecu).toBe(0);
        expect(j.remarques.join(' ')).toMatch(/chaque approche coûte un degré de dommages magiques/);
    });
    it('le malus magique va seul aux Arts occultes ; le physique attend qu’on dise l’action physique', () => {
        expect(jetDeNephilim(regle, blesse, { vecu: 'occult_magic_low', approche: 'ka_fire' }, {}, 4, sections).vecu).toBe(2);
        const vecu = jetDeNephilim(regle, blesse, { vecu: 'vecu_templier' }, {}, 4, sections);
        expect(vecu.vecu).toBe(4);
        expect(vecu.remarques.join(' ')).toMatch(/à retirer si l’action est physique/);
    });
});

describe('N3 · les Chutes (p. 148-152)', () => {
    it('range les degrés en paliers', () => {
        expect([0, 1, 4, 5, 7, 8, 9, 10].map(palierDeChute)).toEqual([0, 1, 1, 2, 2, 3, 3, 4]);
    });
    it('dit l’effet du palier selon la forme du Khaïba, et alerte dès 8', () => {
        const e = etatDesChutes(regle, { falls_khaiba: 6, falls_khaiba_form: 'Nanisme', falls_shadow: 8 });
        expect(e.chutes[0]).toMatchObject({ label: 'Khaïba (Nanisme)', palier: 2, effet: 'Plus aucun sort de Magie de degré 5 ou plus.' });
        expect(e.alerte).toMatch(/confie son Nephilim au MJ/);
    });
    it('interdit au jet le sort de degré 5 en Nanisme 5-7, la Magie du Ka dominant en Gigantisme', () => {
        const nain = { ...fiche, falls_khaiba: 5, falls_khaiba_form: 'Nanisme', magic_spells_0_degree: 5 };
        expect(jetDeNephilim(regle, nain, { vecu: 'occult_magic_low', approche: 'ka_fire', sort: 'magic_spells_0_degree' }, {}, 4, sections).avertissements[0]).toMatch(/Nanisme/);
        const geant = { ...fiche, falls_khaiba: 7, falls_khaiba_form: 'Gigantisme' };
        expect(jetDeNephilim(regle, geant, { vecu: 'occult_magic_low', approche: 'ka_fire' }, {}, 4, sections).avertissements[0]).toMatch(/Gigantisme/);
        expect(jetDeNephilim(regle, geant, { vecu: 'occult_magic_low', approche: 'ka_water' }, {}, 4, sections).avertissements).toEqual([]);
    });
    it('interdit la formule du Ka dominant en forme éthérale', () => {
        const ether = { ...fiche, falls_khaiba: 5, falls_khaiba_form: 'Forme éthérale', alchemy_formulas_0_element: 'Feu' };
        expect(jetDeNephilim(regle, ether, { vecu: 'occult_alchemy_black', formule: 'alchemy_formulas_0_degree' }, {}, 4, sections).avertissements[0]).toMatch(/éthérale/);
    });
    it('met en jeu une Chute de 1 à 4, une fois par séance, pour autant de PS', () => {
        expect(miseEnJeuPossible(3, false)).toEqual({ possible: true, sapience: 3 });
        expect(miseEnJeuPossible(5, false).possible).toBe(false);
        expect(miseEnJeuPossible(2, true).raison).toMatch(/Déjà/);
    });
});

describe('N6 · la Sapience (p. 118-119, 155, 183)', () => {
    it('l’Effet Mnémos en tant que Vécu remplace le degré, au plus celui du Vécu passé', () => {
        const j = jetDeNephilim(regle, fiche, { vecu: 'vecu_templier' }, { mnemosVecu: 9 }, 4, sections);
        expect(j.vecu).toBe(4);
        expect(j.couts.sapience).toBe(4);
        expect(j.mnemos).toEqual({ possible: true, max: 4, degres: 4 });
        expect(jetDeNephilim(regle, fiche, { vecu: 'simulacrum_experience_degree' }, { mnemosVecu: 2 }, 4, sections).mnemos).toBeUndefined();
    });
    it('le Sacrifice coûte 5 PS et ne dépasse pas l’Art', () => {
        const fort = jetDeNephilim(regle, { ...fiche, magic_spells_0_degree: 3 }, { vecu: 'occult_magic_low', approche: 'ka_fire', sort: 'magic_spells_0_degree' }, { sacrifice: true }, 4, sections);
        expect(fort.sacrifice).toEqual({ possible: true, retenu: true });
        expect(fort.couts.sapience).toBe(5);
        const trop = jetDeNephilim(regle, { ...fiche, magic_spells_0_degree: 6 }, { vecu: 'occult_magic_low', sort: 'magic_spells_0_degree' }, { sacrifice: true }, 4, sections);
        expect(trop.sacrifice?.possible).toBe(false);
    });
    it('refuse de lancer ce que la Sapience ne paie pas', () => {
        expect(jetDeNephilim(regle, { ...fiche, resources_sapience: 2 }, { vecu: 'vecu_templier' }, { mnemosVecu: 3, impressionner: true }, 4, sections).couts.sapience).toBe(2);
    });
    it('suit la table de l’expérience : la valeur visée, puis 10, 15, 20, 30, 50, 100 ; le Ka ×10 et 100 de plus au-delà de 10', () => {
        expect([2, 5, 6, 7, 8, 9, 10, 11, 14].map(c => coutDeLExperience(c))).toEqual([2, 5, 10, 15, 20, 30, 50, 100, 100]);
        expect([2, 10, 11, 12, 14].map(c => coutDeLExperience(c, true))).toEqual([20, 100, 200, 300, 500]);
    });
});

describe('N7 · l’Alchimie (p. 216-220 ; errata p. 217)', () => {
    const alchimie: RegleDeNephilim = { ...regle,
        alchimie: { oeuvres: { occult_alchemy_black: 1, occult_alchemy_white: 2 }, assemblage: { alchemy_constructs_retort: 'alchemy_constructs_retort_assembly' },
            secondElement: { remplacer: '_degree$', par: '_element2' } } };
    const s = [...sections, { id: 'arts_alchimie', fields: [{ id: 'occult_alchemy_black' }, { id: 'occult_alchemy_white' }] }];
    const labo = { ...fiche, alchemy_constructs_retort_water: 4, alchemy_constructs_retort_moon: 2, alchemy_formulas_0_element: 'Eau', alchemy_formulas_0_element2: 'Lune' };
    it('l’Œuvre au blanc prend le Ka le moins développé du construct', () => {
        const j = jetDeNephilim(alchimie, labo, { vecu: 'occult_alchemy_black', approche: 'alchemy_constructs_retort_water', formule: 'alchemy_formulas_0_degree' }, {}, 5, s);
        expect(j.bonus).toBe(-2);
        expect(j.remarques.join(' ')).toMatch(/Ka-Lune du construct \(2\)/);
    });
    it('refuse une Œuvre au-dessus de l’assemblage du construct', () => {
        const j = jetDeNephilim(alchimie, { ...labo, alchemy_constructs_retort_assembly: 'Œuvre au noir' },
            { vecu: 'occult_alchemy_white', approche: 'alchemy_constructs_retort_water' }, {}, 3, s);
        expect(j.avertissements[0]).toMatch(/assemblé pour l’Œuvre au noir/);
        expect(jetDeNephilim(alchimie, labo, { vecu: 'occult_alchemy_white', approche: 'alchemy_constructs_retort_water' }, {}, 3, s).remarques.join(' ')).toMatch(/pas noté/);
    });
});

describe('N9 · le métamorphe et le Seuil RK (p. 112-113 ; errata p. 146)', () => {
    it('compte les métamorphoses cochées « permanente » parmi les degrés visibles', () => {
        expect(degresVisibles(regle, { metamorphoses_0_permanent: true, metamorphoses_1_permanent: false, identity_metamorph_visible: 1 })).toBe(2);
        const j = jetDeNephilim(regle, { ...fiche, metamorphoses_0_permanent: true, metamorphoses_1_permanent: true }, { vecu: 'vecu_templier', approche: 'ka_fire' }, { metamorphe: 3 }, 4, sections);
        expect(j.metamorphe).toEqual({ possible: 1, exprimes: 1 });
    });
    it('exprime le métamorphe sur une approche du Ka dominant, sans ses degrés visibles', () => {
        const j = jetDeNephilim(regle, { ...fiche, identity_metamorph_visible: 1 }, { vecu: 'vecu_templier', approche: 'ka_fire' }, { metamorphe: 5 }, 4, sections);
        expect(j.metamorphe).toEqual({ possible: 2, exprimes: 2 });
        expect(j.bonus).toBe(2);
        expect(jetDeNephilim(regle, fiche, { vecu: 'vecu_templier', approche: 'ka_water' }, { metamorphe: 2 }, 4, sections).metamorphe).toBeUndefined();
    });
    it('compte approche, métamorphe, visibles, Khaïba et Narcose au-delà de 4 contre le Seuil RK', () => {
        const j = jetDeNephilim(regle, { ...fiche, identity_metamorph_visible: 1, falls_khaiba: 5, falls_narcosis: 4 }, { vecu: 'vecu_templier', approche: 'ka_fire' }, { metamorphe: 1, seuilRK: 9 }, 4, sections);
        expect(j.rk).toEqual({ valeur: 12, seuil: 9, depasse: true, detail: 'approche 5 + métamorphe 1 + visible 1 + Khaïba 5' });
    });
    it('Impressionner : +2 et un jeton de Traque', () => {
        const j = jetDeNephilim(regle, fiche, { vecu: 'vecu_templier' }, { impressionner: true }, 4, sections);
        expect([j.bonus, j.couts.traque]).toEqual([2, 1]);
    });
});

describe('N4 · les actions opposées et le pacte (p. 123, 198)', () => {
    it('suit la table : succès contre échec, l’actif ; échec contre maladresse, l’actif ; deux échecs, personne', () => {
        expect(opposer({ degres: 8, tirage: 42 }, { degres: 4, tirage: 73 }).vainqueur).toBe('attaquant');
        expect(opposer({ degres: 3, tirage: 47 }, { degres: 4, tirage: 77 }).vainqueur).toBe('attaquant');
        expect(opposer({ degres: 3, tirage: 47 }, { degres: 4, tirage: 58 }).vainqueur).toBe('aucun');
        expect(opposer({ degres: 3, tirage: 33 }, { degres: 4, tirage: 77 }).vainqueur).toBe('aucun');
        expect(opposer({ degres: 8, tirage: 42 }, { degres: 9, tirage: 66 }).vainqueur).toBe('defenseur');
    });
    it('deux succès : la plus haute marge, les degrés au-delà de dix comptés (errata p. 123)', () => {
        expect(opposer({ degres: 12, tirage: 53 }, { degres: 9, tirage: 68 }).vainqueur).toBe('attaquant');
        expect(opposer({ degres: 8, tirage: 41 }, { degres: 8, tirage: 47 }).vainqueur).toBe('defenseur');
    });
    it('le pacte refusé coûte le degré de l’invocation ; une maladresse bannit', () => {
        expect(issueDuPacte(opposer({ degres: 4, tirage: 62 }, { degres: 5, tirage: 31 }), 5)).toMatchObject({ noue: false, dommages: 5 });
        expect(issueDuPacte(opposer({ degres: 4, tirage: 77 }, { degres: 5, tirage: 31 }), 5).texte).toMatch(/banni/);
        expect(issueDuPacte(opposer({ degres: 7, tirage: 21 }, { degres: 5, tirage: 62 }), 5).noue).toBe(true);
    });
});

describe('N2 · encaisser les dommages (p. 136-139)', () => {
    const p = piste('phys');
    it('une case libre de valeur suffisante, la plus petite ; ou des Conséquences, le reste dans une case', () => {
        expect(optionsDEncaissement(p, {}, 4, 2).map(o => o.texte)).toEqual(['Cocher la case de 2', 'Conséquence mineure', 'Conséquence sérieuse', 'Conséquence grave']);
        expect(optionsDEncaissement(p, { phys_case_2: true }, 4, 2)[0].cocher).toEqual(['phys_case_3']);
    });
    it('13 degrés sans case de cette valeur : il faut des Conséquences ; plus rien, hors de combat', () => {
        const textes = optionsDEncaissement(p, {}, 4, 13).map(o => o.texte);
        expect(textes).toContain('Conséquence sérieuse et grave, et la case de 3');
        expect(optionsDEncaissement(p, { phys_case_1: true, phys_case_2: true, phys_case_3: true, phys_minor: true }, 4, 13)).toEqual([]);
    });
    it('les cases de bonus s’ouvrent avec le Ka-Terre (5 et 10)', () => {
        const pleines = { phys_case_1: true, phys_case_2: true, phys_case_3: true };
        expect(optionsDEncaissement(p, pleines, 4, 1).map(o => o.cocher[0])).not.toContain('phys_case_bonus_1');
        expect(optionsDEncaissement(p, pleines, 5, 1)[0].cocher).toEqual(['phys_case_bonus_1']);
    });
    it('guérit en 11 − Ka-Terre, jours à mois pour le physique, heures à semaines pour le magique', () => {
        expect(dureeDeGuerison(2, 'grave', false)).toBe('9 mois');
        expect(dureeDeGuerison(4, 'serieuse', true)).toBe('7 jours');
        expect(dureeDeGuerison(12, 'mineure', false)).toBe('1 jours');
    });
});

describe('N5 · le degré du Ka dominant, plafond de la stase', () => {
    it('lit le Ka du Pentacle de l’élément choisi, ou à défaut le champ calculé', () => {
        const r = { ...regle, pentacle: { Feu: 'ka_fire', Eau: 'ka_water' } };
        expect(degreDuKaDominant(r, { ka_dominant: 'Feu', ka_fire: 5, ka_dominant_degre: 0 })).toBe(5);
        expect(degreDuKaDominant(regle, { ka_dominant: 'Feu', ka_dominant_degre: 6 })).toBe(6);
        expect(degreDuKaDominant(r, { ka_dominant: 'Eau', ka_water: 3 })).toBe(3);
        expect(degreDuKaDominant(r, { ka_fire: 5 })).toBeUndefined();
    });
});

describe('N5 · le test de stase (p. 139)', () => {
    it('le Ka actuel de la stase, sans autre modificateur', () => {
        expect(testDeStase(3, 25)).toMatchObject({ chances: 30, reussi: true });
        expect(testDeStase(3, 44).reussi).toBe(false);
        expect(testDeStase(3, 100).degre).toBe('echec-total');
    });
});
