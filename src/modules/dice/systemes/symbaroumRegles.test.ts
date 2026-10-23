import { describe, it, expect } from 'vitest';
import {
    CLE_SYMBAROUM, ajouterALaFormule, commencerLAgonie, controleDeCreation, critiqueDuJet, decomposer, degatsNets,
    douleurAtteinte, ecartsDesDerivees, ecrireLaBourse, encaisser, etatDeLaCorruption, grievementTouche, jourDeVoyage,
    joursPourLaDistance, kilometresParJour, lancerLaFormule, lireLaFormule, lireSymbaroum, mouvementDeBourse,
    noterUnStigmate, rangSuivant, sansCritiqueDeBase, soigner, testDeMort, unJourPasse, valeurFixe, valeursDerivees,
    type RegleDeSymbaroum,
} from './symbaroumRegles';

/** Les pages citées sont celles du Livre de Base imprimé (audit S0–S9 du 20/10). */
const REGLE: RegleDeSymbaroum = {
    attributs: ['agilite', 'astuce', 'discretion', 'force', 'persuasion', 'precision', 'vigilance', 'volonte'],
    force: 'force', volonte: 'volonte', agilite: 'agilite',
    endurance: { courante: 'endurance_actuelle', maximum: 'endurance' },
    douleur: 'resistance_douleur', seuilDeCorruption: 'seuil_corruption',
    corruption: { temporaire: 'corruption_temporaire', permanente: 'corruption_permanente' },
};

describe('les valeurs dérivées (S2, p. 164, 179)', () => {
    it('Force 7 donne une Endurance de 10 et une douleur de 4', () => {
        const d = valeursDerivees(REGLE, { force: 7, volonte: 11, agilite: 13 });
        expect(d).toEqual({ enduranceMax: 10, douleur: 4, seuilDeCorruption: 6, defenseDeBase: 13 });
    });
    it('Force 11 : Endurance 11, douleur 6 (Hargne, p. 164)', () => {
        expect(valeursDerivees(REGLE, { force: 11 })).toMatchObject({ enduranceMax: 11, douleur: 6 });
    });
    it('les écarts se montrent sans rien imposer', () => {
        const e = ecartsDesDerivees(REGLE, { force: 7, volonte: 10, endurance: 10, resistance_douleur: 0, seuil_corruption: 5 });
        expect(e).toEqual([{ champ: 'resistance_douleur', label: 'Résistance à la douleur', fiche: 0, calcul: 4 }]);
    });
});

describe('les formules de dégâts (S5)', () => {
    it('lit la tête d’une case et ignore la suite', () => {
        expect(lireLaFormule('1D8 (Précise)')).toEqual({ des: [{ nombre: 1, faces: 8 }], constante: 0, texte: '1D8' });
        expect(lireLaFormule('1d6+1d4+1')?.texte).toBe('1D6+1D4+1');
        expect(lireLaFormule('4')).toEqual({ des: [], constante: 4, texte: '4' });
        expect(lireLaFormule('Bâton')).toBeNull();
        expect(lireLaFormule('')).toBeNull();
    });
    it('l’Avantage ajoute 1D4 sans second d20', () => {
        const f = ajouterALaFormule(lireLaFormule('1D8'), '1d4')!;
        const faces = [6, 3];
        expect(lancerLaFormule(f, () => faces.shift()!)).toMatchObject({ total: 9, detail: '6 (D8) + 3 (D4)' });
    });
    it('la valeur fixe d’un PNJ est la moitié du plus haut : 1D8 vaut 4 (p. 178)', () => {
        expect(valeurFixe(lireLaFormule('1D8'))).toBe(4);
        expect(valeurFixe(lireLaFormule('1D6+1D4'))).toBe(5);
    });
    it('un coup arrêté par l’armure ne fait pas mal ; plusieurs petits coups ne s’additionnent pas (p. 164)', () => {
        expect(degatsNets(3, 5)).toBe(0);
        expect(douleurAtteinte(0, 6)).toBe(false);
        expect(douleurAtteinte(4, 6) || douleurAtteinte(2, 6)).toBe(false);
        expect(douleurAtteinte(6, 6)).toBe(true);
    });
    it('les dégâts critiques optionnels exigent de DÉPASSER la douleur (p. 183)', () => {
        expect(grievementTouche(6, 6)).toBe(false);
        expect(grievementTouche(7, 6)).toBe(true);
    });
    it('à zéro, un PJ est mourant ; avec la Mort subite et la douleur, mort (p. 164, 183)', () => {
        expect(encaisser(5, 8, { douleur: 6 })).toEqual({ apres: 0, douleur: true, etat: 'mourant' });
        expect(encaisser(5, 8, { douleur: 6, mortSubite: true }).etat).toBe('mort');
        expect(encaisser(5, 5, { douleur: 6, mortSubite: true }).etat).toBe('mourant');
        expect(encaisser(11, 6, { douleur: 6 })).toEqual({ apres: 5, douleur: true, etat: 'debout' });
    });
});

describe('le Test de mort (S2, p. 164)', () => {
    const mourant = { ...commencerLAgonie({}) };
    it('un 2–10 ne supprime pas les prochains tests', () => {
        const r = testDeMort(mourant, 3, 'a');
        expect(r.issue).toBe('tombe');
        expect(lireSymbaroum(r.valeurs).agonie).toEqual({ tests: 1, echecs: 0 });
    });
    it('trois résultats de 11 à 19 tuent', () => {
        let v: Record<string, unknown> = mourant;
        for (const [i, de] of [13, 5, 15].entries()) v = { ...v, ...testDeMort(v, de, `t${i}`).valeurs };
        const fin = testDeMort(v, 19, 'fin');
        expect(fin.issue).toBe('mort');
        expect(lireSymbaroum(fin.valeurs).mort).toBe(true);
    });
    it('un 1 réveille avec 1D4 d’Endurance ; un 20 tue', () => {
        const reveil = testDeMort(mourant, 1, 'r', 3);
        expect(reveil).toMatchObject({ issue: 'reveil', endurance: 3 });
        expect(lireSymbaroum(reveil.valeurs).agonie).toBeUndefined();
        expect(testDeMort(mourant, 20, 'm').issue).toBe('mort');
    });
    it('un même test ne s’écrit pas deux fois', () => {
        const v = { ...mourant, ...testDeMort(mourant, 12, 'x').valeurs };
        expect(testDeMort(v, 12, 'x').issue).toBe('deja');
    });
    it('les soins arrêtent l’agonie', () => {
        expect(lireSymbaroum(soigner(mourant, 1)).agonie).toBeUndefined();
    });
});

describe('la Corruption (S4, p. 179–180)', () => {
    it('Volonté 11 : seuil 6, Abomination à 11, pas à 12', () => {
        const v = { volonte: 11, corruption_temporaire: 4, corruption_permanente: 7 };
        const e = etatDeLaCorruption(REGLE, v);
        expect(e).toMatchObject({ seuil: 6, total: 11, marque: true, marquePermanente: true, abomination: true });
        expect(etatDeLaCorruption(REGLE, { ...v, corruption_temporaire: 3 }).abomination).toBe(false);
    });
    it('l’Ombre de la Corruption domine dès qu’elle égale Volonté − Corruption', () => {
        expect(etatDeLaCorruption(REGLE, { volonte: 10, corruption_temporaire: 5 }).corruptionDomine).toBe(true);
        expect(etatDeLaCorruption(REGLE, { volonte: 10, corruption_temporaire: 4 }).corruptionDomine).toBe(false);
    });
    it('un Stigmate temporaire guérit après une journée ; le permanent reste', () => {
        let v: Record<string, unknown> = {};
        v = { ...v, ...noterUnStigmate(v, 'Des yeux qui brillent dans le noir', false) };
        v = { ...v, ...noterUnStigmate(v, 'Une haleine qui sent le soufre', true) };
        v = { ...v, ...unJourPasse(v) };
        expect(lireSymbaroum(v).stigmates.map(s => s.texte)).toEqual(['Une haleine qui sent le soufre']);
        expect(v[CLE_SYMBAROUM]).toBeTruthy();
    });
});

describe('les critiques optionnels (S8, p. 184)', () => {
    it('rien sans l’option, rien sur un simple test', () => {
        expect(critiqueDuJet(1, 'attaque', {})).toBeNull();
        expect(critiqueDuJet(1, 'test', { attaquesParfaites: true })).toBeNull();
    });
    it('les quatre effets du livre', () => {
        const o = { attaquesParfaites: true };
        expect(critiqueDuJet(1, 'attaque', o)).toMatchObject({ degats: '1d6' });
        expect(critiqueDuJet(20, 'attaque', o)?.texte).toMatch(/Attaque gratuite/);
        expect(critiqueDuJet(1, 'defense', o)?.texte).toMatch(/Défense parfaite/);
        expect(critiqueDuJet(20, 'defense', o)).toMatchObject({ degats: '3' });
    });
    it('limiter : le second jet confirme', () => {
        const o = { attaquesParfaites: true, limiterLesCritiques: true };
        expect(critiqueDuJet(1, 'attaque', o)?.aConfirmer).toBe(true);
        expect(critiqueDuJet(1, 'attaque', o, { de: 15, seuil: 12 })?.degats).toBeUndefined();
        expect(critiqueDuJet(1, 'attaque', o, { de: 8, seuil: 12 })?.degats).toBe('1d6');
    });
    it('la mention de critique du moteur s’efface', () => {
        const r = sansCritiqueDeBase({ totalDisplay: '1 / 12 — réussite critique', rolls: [{ isCritMax: true }] });
        expect(r).toEqual({ totalDisplay: '1 / 12', rolls: [{ isCritMax: false, isCritMin: false }] });
    });
});

describe('création et progression (S7, p. 77–79, 166)', () => {
    it('80 points, de 5 à 15, un seul 15', () => {
        const ok = { agilite: 15, astuce: 13, discretion: 10, force: 10, persuasion: 7, precision: 9, vigilance: 11, volonte: 5 };
        expect(controleDeCreation(REGLE, ok).conforme).toBe(true);
        expect(controleDeCreation(REGLE, { ...ok, volonte: 15, astuce: 3 }).constats).toEqual([
            'Hors de 5 à 15 : astuce.', '2 Attributs à 15 : un seul permis.',
        ]);
        expect(controleDeCreation(REGLE, {}).constats[0]).toBe('Somme des Attributs : 0 (80 à la création).');
    });
    it('10, puis 20, puis 30 ; pas au-delà de Maître', () => {
        expect(rangSuivant('')).toEqual({ rang: 'Novice', cout: 10 });
        expect(rangSuivant('Novice')).toEqual({ rang: 'Adepte', cout: 20 });
        expect(rangSuivant('Adepte')).toEqual({ rang: 'Maître', cout: 30 });
        expect(rangSuivant('Maître')).toBeNull();
    });
});

describe('monnaie et voyages (S9, p. 190)', () => {
    it('1 thaler = 10 shillings = 100 ortegs', () => {
        expect(decomposer(5.37)).toEqual({ thalers: 5, shillings: 3, ortegs: 7, totalEnOrtegs: 537 });
        expect(ecrireLaBourse(5.37)).toBe('5 thalers, 3 shillings, 7 ortegs');
        expect(ecrireLaBourse(0)).toBe('0 thaler');
    });
    it('on ne paie pas ce qu’on n’a pas', () => {
        expect(mouvementDeBourse(1, { shillings: -12 })).toBeNull();
        expect(mouvementDeBourse(1, { shillings: -3, ortegs: -5 })).toBe(0.65);
    });
    it('le Tableau 26', () => {
        expect(kilometresParJour('marche', 'normale', 'davokarSombre')).toBe(10);
        expect(kilometresParJour('cheval', 'ereintante', 'ambria')).toBe(70);
        expect(joursPourLaDistance(45, 'marche', 'forcee', 'davokarClair')).toBe(2);
    });
    it('un jour éreintant : −1, test de Force, 1D6 de plus si raté, 20 l’accident', () => {
        expect(jourDeVoyage('ereintante', 10, { d20: 8, d6: 4 }).perte).toBe(1);
        expect(jourDeVoyage('ereintante', 10, { d20: 14, d6: 4 }).perte).toBe(5);
        expect(jourDeVoyage('ereintante', 10, { d20: 20, d6: 4 }).accident).toBe(true);
        expect(jourDeVoyage('forcee', 10, { d20: 1, d6: 1 }).guerison).toBe(0);
        expect(jourDeVoyage('normale', 10, { d20: 1, d6: 1 }).guerison).toBe(1);
    });
});
