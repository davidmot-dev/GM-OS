import { describe, it, expect } from 'vitest';
import { CLE_AVANTAGES_COC, acheterAvantageCoc, avancerAvantagesCoc, bonusAvantageCoc, lireAvantagesCoc, preparerAvantageCoc } from './avantagesDeCoc';
import { CLE_PSYCHISME_COC, avancerPsychismeCoc, blocagePsychismeCoc, confirmerChocCoc, lancerChocCoc, lirePsychismeCoc, malusDefensePsychismeCoc, parametresChocCoc } from './psychismeDeCoc';
import { capacitesDisponiblesCoc } from './voiesDeCoc';
import { CHOIX_DE_COC, lancerCoc, preparerCoc, type RegleDeCoc } from './coc';
import { encaissementSelonLeJeu } from '../../combat/logic/encaissementDeCoc';

const regle: RegleDeCoc = { heroisme: true, psychisme: true, volonte: 'volonte', sante: 'sante', evolution: { champ: 'evolution', modele: 'modele' }, physiques: ['agilite', 'attaque_au_contact'], attaques: ['attaque_au_contact'],
    voies: { emplacements: [{ nom: 'voie', reference: 'reference', rangs: ['r1', 'r2', 'r3', 'r4', 'r5'] }] } };
const base = { modele: 'Héros', evolution: 13, volonte: 2, agilite: 2, sante: 0 };
const achat = (f: Record<string, unknown>, dest: Parameters<typeof acheterAvantageCoc>[3], cout = 1, id = 'achat') => {
    const r = acheterAvantageCoc(f, 'evolution', 'modele', dest, cout, id); if ('refus' in r) throw new Error(r.refus); return { ...f, ...r.maj };
};
describe('COC-A4 : une destination, un débit, une expiration', () => {
    it('13 Héros : DEF+5 pour1, aucun changement au test déjà lancé ; refus du rejeu et du Blues', () => {
        const avant = preparerCoc(regle, CHOIX_DE_COC, { valeur: 2, champ: 'volonte' }, base), jet = lancerCoc(avant, () => 10);
        const f = achat(base, 'defense');
        expect(f.evolution).toBe(12); expect(bonusAvantageCoc(f, 'defense')).toBe(5);
        expect(preparerCoc(regle, CHOIX_DE_COC, { valeur: 2, champ: 'volonte' }, f).total).toBe(avant.total);
        expect(jet.coc.resultat).toBe(12);
        expect(acheterAvantageCoc(f, 'evolution', 'modele', 'defense', 1, 'achat')).toHaveProperty('refus');
        expect(preparerAvantageCoc('Blues', 13, 'defense', 1)).toHaveProperty('refus');
    });
    it('les bonus de palier doublent pour deux, jamais mouvement ou Légende', () => {
        expect(preparerAvantageCoc('Héros', 13, 'initiative', 2)).toMatchObject({ bonus: 10, apres: 11 });
        expect(preparerAvantageCoc('Héros', 3, 'dm-infliges', 2, '3d6')).toMatchObject({ bonus: 2, apres: 1 });
        expect(preparerAvantageCoc('Héros', 13, 'mouvement', 2)).toHaveProperty('refus');
        expect(preparerAvantageCoc('Héros', 9, 'mouvement', 1)).toHaveProperty('refus');
        expect(preparerAvantageCoc('Héros', 20, 'legende', 2)).toHaveProperty('refus');
    });
    it('Légende : suite complète, protection contre une source, actions une fois, expiration à son prochain tour', () => {
        let f = achat({ ...base, evolution: 20 }, 'legende');
        expect(f.evolution).toBe(19);
        for (const dest of ['test', 'initiative', 'defense', 'dm-infliges', 'dm-subis'] as const) expect(bonusAvantageCoc(f, dest)).toBe(10);
        f = { ...f, [CLE_AVANTAGES_COC]: avancerAvantagesCoc(f, 'dm-subis', 'coup') };
        expect(bonusAvantageCoc(f, 'dm-subis')).toBe(0); expect(bonusAvantageCoc(f, 'defense')).toBe(10);
        f = { ...f, [CLE_AVANTAGES_COC]: avancerAvantagesCoc(f, 'mouvement', 'move') };
        expect(lireAvantagesCoc(f).actifs[0].mouvement).toBe(0);
        expect(avancerAvantagesCoc(f, 'round', 'r').actifs).toHaveLength(1);
        expect(avancerAvantagesCoc(f, 'debut-tour', 't').actifs).toHaveLength(0);
    });
    it('initiative : garde le bonus jusqu’au prochain tirage, mouvement jusqu’à la fin du round', () => {
        const f = achat(base, 'initiative');
        expect(avancerAvantagesCoc(f, 'debut-tour', 't').actifs).toHaveLength(1);
        expect(avancerAvantagesCoc(f, 'initiative', 'i').actifs).toHaveLength(0);
        expect(avancerAvantagesCoc(achat(base, 'mouvement'), 'round', 'r').actifs).toHaveLength(0);
    });
    it('une source de15DM : héros5 puis RD2 =>8 ; reçu persistant, soin sans consommation', () => {
        const f = achat({ ...base, rd: 2 }, 'dm-subis'), r = { mecanique: 'coc' as const, sante: 'sante', rd: 'rd', suivi: true, heroisme: true };
        const coup = encaissementSelonLeJeu(r, f, { value: 15, coc: { id: 'coup' } })!;
        expect(coup.impact.value).toBe(8);
        const apres = JSON.parse(JSON.stringify({ ...f, ...coup.fiche, sante: 8 }));
        expect(bonusAvantageCoc(apres, 'dm-subis')).toBe(0);
        expect(encaissementSelonLeJeu(r, apres, { value: 15, coc: { id: 'coup' } })?.impact.value).toBe(0);
        expect(encaissementSelonLeJeu(r, f, { value: 3, isRecovery: true })).toBeNull();
    });
});
describe('COC-A5 : événement, choc, séquelle et échelle distincts', () => {
    it('table77 et adaptation60 : rangs1/2/3, difficultés et plages', () => {
        expect([1, 2, 3].map(n => parametresChocCoc(n))).toEqual([{ difficulte: 10, echecJusqua: 1, nombreD6: 1 }, { difficulte: 15, echecJusqua: 3, nombreD6: 2 }, { difficulte: 20, echecJusqua: 6, nombreD6: 3 }]);
        expect([1, 2, 3].map(n => parametresChocCoc(n, '3d6').echecJusqua)).toEqual([3, 4, 6]);
    });
    it('rang2 : naturel3 critique échoué ; choc confirmé, séquelle seulement proposée, Blues conservé', () => {
        const f = { ...base, modele: 'Blues', evolution: 7 }, jet = lancerChocCoc(regle, f, 2, 0, [], () => 3);
        expect(jet.jet.coc.bilan).toBe('echec-critique');
        const r = confirmerChocCoc(f, 'Salle inquiétante', 2, jet.jet.coc.bilan, 'Tétanisé', 7, 'evt', 0);
        if ('refus' in r) throw new Error(r.refus);
        const apres = { ...f, [CLE_PSYCHISME_COC]: r.apres };
        expect(apres.evolution).toBe(7); expect(apres.modele).toBe('Blues');
        expect(r.apres.choc?.reste).toBe(7); expect(r.apres.demandes).toHaveLength(1); expect(r.apres.sequelles).toHaveLength(0);
        expect(blocagePsychismeCoc(apres, true)).toContain('Immobilisé'); expect(blocagePsychismeCoc(apres, false)).toBeUndefined();
        expect(confirmerChocCoc(apres, 'Salle inquiétante', 2, 'echec', 'Brisé', 2, 'evt', 0)).toHaveProperty('refus');
        expect(avancerPsychismeCoc(apres, 'round1').choc?.reste).toBe(6);
    });
    it('critique réussi : +5 à la prochaine VOL d’événement, consommé une seule fois à sa confirmation', () => {
        const r = confirmerChocCoc(base, 'Choc1', 1, 'reussite-critique', 'Brisé', 1, 'a', 0);
        if ('refus' in r) throw new Error(r.refus);
        const f = { ...base, [CLE_PSYCHISME_COC]: r.apres }, prochain = lancerChocCoc(regle, f, 1, 0, [], () => 8);
        expect(prochain.jet.coc.resultat).toBe(15); expect(prochain.bonusConsomme).toBe(5);
        const fin = confirmerChocCoc(f, 'Choc2', 1, 'reussite', 'Brisé', 1, 'b', 5);
        if ('refus' in fin) throw new Error(fin.refus);
        expect(fin.apres.bonusProchaineVol).toBe(0);
    });
    it('Enragé physique+3 et DEF−5 ; Paniqué sans fuite bloque ; un rechargement ne compte pas de round', () => {
        const r = confirmerChocCoc(base, 'Menace', 1, 'echec', 'Enragé', 3, 'c', 0);
        if ('refus' in r) throw new Error(r.refus);
        const f = { ...base, [CLE_PSYCHISME_COC]: r.apres };
        expect(preparerCoc(regle, CHOIX_DE_COC, { valeur: 2, champ: 'agilite' }, f).total).toBe(5);
        expect(preparerCoc(regle, CHOIX_DE_COC, { valeur: 2, champ: 'volonte' }, f).total).toBe(2);
        expect(malusDefensePsychismeCoc(f)).toBe(5); expect(lirePsychismeCoc(JSON.parse(JSON.stringify(f))).choc?.reste).toBe(3);
        const p = confirmerChocCoc(base, 'Menace', 1, 'echec', 'Paniqué', 2, 'p', 0, 'd20', true);
        if ('refus' in p) throw new Error(p.refus);
        expect(blocagePsychismeCoc({ [CLE_PSYCHISME_COC]: p.apres }, false)).toContain('inconscient');
    });
});
describe('COC-A6 : des capacités nommées, acquises et contextuelles', () => {
    it('aucun effet implicite ; Furtif explicitement coché ajoute5 à AGI, pas à VOL, et se convertit à3 au3d6', () => {
        const f = { ...base, reference: 'furtivite', r1: true };
        const prep = (champ: string, selection: string[], des?: '3d6') => preparerCoc({ ...regle, des }, { ...CHOIX_DE_COC, capacites: selection }, { valeur: 2, champ }, f);
        expect(prep('agilite', []).total).toBe(2); expect(prep('agilite', ['0:furtif']).total).toBe(7);
        expect(prep('volonte', ['0:furtif']).total).toBe(2); expect(prep('agilite', ['0:furtif'], '3d6').total).toBe(5);
        expect(capacitesDisponiblesCoc(regle, { ...f, reference: '' }, 'agilite')).toEqual([]);
        expect(capacitesDisponiblesCoc(regle, { ...f, r1: false, r2: true }, 'perception')).toEqual([]);
    });
    it('bonus par rang au5e : +5 au d20, +3 au3d6 ; spécialité : dé bonus contextuel', () => {
        const f = { ...base, reference: 'investigation', r1: true, r2: true, r3: true, r4: true, r5: true };
        expect(capacitesDisponiblesCoc({ ...regle, des: '3d6' }, f, 'intelligence').find(c => c.id === 'fin-limier')?.bonus).toBe(3);
        const prep = preparerCoc(regle, { ...CHOIX_DE_COC, capacites: ['0:fin-limier', '0:specialiste'] }, { valeur: 2, champ: 'intelligence' }, f);
        expect(prep.total).toBe(7); expect(prep.solde).toBe(1);
        const compense = preparerCoc(regle, { ...CHOIX_DE_COC, malus: 1, capacites: ['0:specialiste'] }, { valeur: 2, champ: 'intelligence' }, f);
        expect(compense.solde).toBe(0);
    });
    it('une même Voie déclarée deux fois ne double pas son bonus', () => {
        const r = { ...regle, voies: { emplacements: [...regle.voies!.emplacements, { nom: 'v2', reference: 'ref2', rangs: ['r21'] }] } };
        expect(capacitesDisponiblesCoc(r, { reference: 'furtivite', ref2: 'furtivite', r1: true, r21: true }, 'agilite')).toEqual([]);
    });
});
