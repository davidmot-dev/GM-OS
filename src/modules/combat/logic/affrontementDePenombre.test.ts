import { describe, expect, it } from 'vitest';
import {
    CLE_AFFRONTEMENT_PENOMBRE, adversiteDe, apresLaChute, dissonanceRestante, lireLActionAdverse, lireLeSuiviDAffrontement,
    perteDeLActionAdverse, profilDeLAdversaire,
} from './affrontementDePenombre';
import type { BestiaireDuJeu } from '../../../types/drivers';

/** Les affrontements de Pénombre (registre § 267, T17, 22/11/2026), sur les adversaires du livre. */
const BESTIAIRE = {
    colonnes: [
        { id: 'adversite', libelle: 'Adversité', nature: 'nombre' },
        { id: 'resilience', libelle: 'Résilience', nature: 'nombre', champ: 'conscience_max' },
        { id: 'dissonance', libelle: 'Dissonance', nature: 'nombre' },
    ],
    creatures: [
        { id: 'antrustion', nom: 'Antrustion, contre-accord de Mortencre', valeurs: { adversite: 3, resilience: 15, dissonance: 1 }, particularites: [
            'Dissonance nuit',
            'Lame colophane: 1 Éminence grise perd 3 jetons conscience',
            'Estoc et pizzicato: toutes perdent 1 jeton conscience et 1 succès sur leur prochaine action',
            "Touche d'ébène (dissonance): toutes perdent 2 jetons conscience, 1 succès sur leur prochaine action",
        ] },
        { id: 'mandigo', nom: 'Mandigo, vieil obscurantiste enragé', valeurs: { adversite: 4, resilience: 20 }, particularites: [] },
        { id: 'sans-resilience', nom: 'Sans résilience', valeurs: { adversite: 2 } },
    ],
} as unknown as BestiaireDuJeu;
const pilote = { bestiaire: BESTIAIRE };
const de = (creatureId: string) => ({ origineDuLivre: { creatureId } });

describe('le profil d’un adversaire du livre (p. 40-43)', () => {
    it('Antrustion : adversité 3, résilience 15, un jeton de dissonance, ses actions adverses (p. 41)', () => {
        const p = profilDeLAdversaire(pilote, de('antrustion'));
        expect(p).toMatchObject({ adversite: 3, resilience: 15, dissonance: 1, depuisLeLivre: true });
        expect(p.actions.map(a => a.nom)).toEqual(['Lame colophane', 'Estoc et pizzicato', "Touche d'ébène (dissonance)"]);
    });
    it('Mandigo : 4 et 20, pas de dissonance (p. 364) ; sans résilience écrite, 5 × l’adversité (p. 41)', () => {
        expect(profilDeLAdversaire(pilote, de('mandigo'))).toMatchObject({ adversite: 4, resilience: 20, dissonance: 0 });
        expect(profilDeLAdversaire(pilote, de('sans-resilience')).resilience).toBe(10);
    });
    it('un adversaire fabriqué : tout est à saisir', () => {
        const p = profilDeLAdversaire(pilote, {});
        expect(p).toEqual({ adversite: null, resilience: null, dissonance: 0, actions: [], depuisLeLivre: false });
        expect(adversiteDe(p, { adversite: 2 })).toBe(2);
        expect(adversiteDe(p, {})).toBeNull();
    });
    it('le suivi se lit sur la fiche du combattant', () => {
        expect(lireLeSuiviDAffrontement({ [CLE_AFFRONTEMENT_PENOMBRE]: { dissonance: 0, opera: true } })).toEqual({ dissonance: 0, opera: true });
        expect(lireLeSuiviDAffrontement({})).toEqual({});
    });
});

describe('l’action adverse (p. 42, 44)', () => {
    it('par défaut : l’adversité à une cible, sa moitié arrondie au supérieur à toutes ; une défense en annule', () => {
        expect(perteDeLActionAdverse(3, false)).toBe(3);
        expect(perteDeLActionAdverse(3, true)).toBe(2);
        expect(perteDeLActionAdverse(4, true)).toBe(2);
        expect(perteDeLActionAdverse(3, false, 2)).toBe(1);
        expect(perteDeLActionAdverse(3, false, 5)).toBe(0);
    });
    it('l’effet chiffré d’une action se lit', () => {
        expect(lireLActionAdverse('1 Éminence grise perd 3 jetons conscience')).toEqual({ perte: 3, toutes: false });
        expect(lireLActionAdverse('toutes perdent 1 jeton conscience et 1 succès')).toEqual({ perte: 1, toutes: true });
        expect(lireLActionAdverse('Toutes les cibles perdent leur tour suivant')).toEqual({ toutes: true });
        expect(lireLActionAdverse('les Éminences grises perdent chacune 4 jetons')).toEqual({ perte: 4, toutes: false });
    });
});

describe('la dissonance et l’opéra harmonique (p. 43, 45)', () => {
    const antrustion = profilDeLAdversaire(pilote, de('antrustion'));
    it('à 0 de résilience, un jeton de dissonance : action de dissonance ; sans jeton, vaincu', () => {
        expect(apresLaChute(4, antrustion, {})).toBe('debout');
        expect(apresLaChute(0, antrustion, {})).toBe('dissonance');
        expect(apresLaChute(0, antrustion, { dissonance: 0 })).toBe('vaincu');
    });
    it('un opéra réussi annule la dissonance', () => {
        expect(dissonanceRestante(antrustion, { opera: true })).toBe(0);
        expect(apresLaChute(0, antrustion, { opera: true })).toBe('vaincu');
        expect(dissonanceRestante(antrustion, {})).toBe(1);
    });
});
