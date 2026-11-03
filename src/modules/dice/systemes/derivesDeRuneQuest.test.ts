import { describe, it, expect } from 'vitest';
import {
    apportDeLaCaracteristique, appliquerLesDerives, bonusAuxDegats, calculerLesDerives, colonneDesLocalisations,
    degatsDeCombatSpirituel, encMaximum, modificateurDeCategorie, modificateurDePvParLaTai, modificateurDePvParLePou,
    pointsDeVie, pointsDeVieDeLaZone, rangDActionDeDex, rangDActionDeTai, vitesseDeGuerison,
    type Caracteristique, type RegleDesDerives,
} from './derivesDeRuneQuest';

/** RQ-A5, 03/11/2026 : les tables du livre de base (p. 55-59) et Vasana, le cas témoin du livre. */
const VASANA: Record<Caracteristique, number> = { for: 16, con: 12, tai: 10, dex: 11, int: 15, pou: 15, cha: 19 };

const REGLE: RegleDesDerives = {
    caracteristiques: { for: 'for', con: 'con', tai: 'tai', dex: 'dex', int: 'int', pou: 'pou', cha: 'cha' },
    pvMax: 'pv_max', pv: 'points_de_vie', pmMax: 'pm_max', pm: 'points_de_magie', bonusAuxDegats: 'bonus_degats',
    degatsSpirituels: 'degats_spirituels', vitesseGuerison: 'vitesse_guerison', encMax: 'enc_max', raDex: 'ra_dex', raTai: 'ra_tai',
    zones: { 'jambe-droite': 'pv_jambe_droite', 'jambe-gauche': 'pv_jambe_gauche', abdomen: 'pv_abdomen', poitrine: 'pv_poitrine',
        'bras-droit': 'pv_bras_droit', 'bras-gauche': 'pv_bras_gauche', tete: 'pv_tete' },
    modificateurs: { agilite: 'mod_agilite', communication: 'mod_communication', connaissances: 'mod_connaissances', magie: 'mod_magie',
        manipulation: 'mod_manipulation', perception: 'mod_perception', discretion: 'mod_discretion' },
    modificateursDArmes: [{ champ: 'mod_armes_melee', libelle: 'Armes de mêlée' }],
};

describe('les tables des attributs (p. 55-57)', () => {
    it('modifie les PV par la TAI et le POU', () => {
        expect([1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25, 28, 29].map(modificateurDePvParLaTai))
            .toEqual([-2, -2, -1, -1, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5]);
        expect([1, 4, 5, 16, 17, 20, 21, 24, 25, 28, 29].map(modificateurDePvParLePou))
            .toEqual([-1, -1, 0, 0, 1, 1, 2, 2, 3, 3, 4]);
        expect(pointsDeVie(12, 10, 15)).toBe(12); // Vasana, p. 55
    });

    it('répartit les PV des zones selon les PV totaux', () => {
        expect([6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22].map(colonneDesLocalisations)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6]);
        // Vasana, 12 PV : 4 par jambe, 4 à l'abdomen, 5 à la poitrine, 3 par bras, 4 à la tête (p. 55).
        expect(['jambe-droite', 'abdomen', 'poitrine', 'bras-gauche', 'tete'].map(z => pointsDeVieDeLaZone(z as never, 12))).toEqual([4, 4, 5, 3, 4]);
        expect(pointsDeVieDeLaZone('poitrine', 6)).toBe(3);
        expect(pointsDeVieDeLaZone('bras-droit', 21)).toBe(6);
        expect(pointsDeVieDeLaZone('tete', 22)).toBe(8); // une colonne de plus tous les 3
    });

    it('lit le bonus aux dégâts et les dégâts spirituels, au-delà de la table compris', () => {
        expect([12, 13, 24, 25, 26, 32, 33, 40, 41, 56, 57, 72, 73].map(s => bonusAuxDegats(s).texte))
            .toEqual(['−1D4', '—', '—', '+1D4', '+1D4', '+1D4', '+1D6', '+1D6', '+2D6', '+2D6', '+3D6', '+3D6', '+4D6']);
        expect([12, 13, 25, 33, 34, 41, 56, 57, 73].map(s => degatsDeCombatSpirituel(s).texte))
            .toEqual(['1D3', '1D6', '1D6+1', '1D6+3', '1D6+3', '2D6+3', '2D6+3', '3D6+4', '4D6+5']);
    });

    it('lit la guérison, l’ENC et les rangs d’action', () => {
        expect([6, 7, 12, 13, 18, 19, 24, 25].map(vitesseDeGuerison)).toEqual([1, 2, 2, 3, 3, 4, 4, 5]);
        expect(encMaximum(16, 12).valeur).toBe(14); // Vasana, p. 56
        expect(encMaximum(12, 16).valeur).toBe(12); // plafonnée à la FOR, p. 56
        expect(encMaximum(15, 12)).toEqual({ valeur: 14, moyenne: 13.5 });
        expect([5, 6, 8, 9, 12, 13, 15, 16, 18, 19].map(rangDActionDeDex)).toEqual([5, 4, 4, 3, 3, 2, 2, 1, 1, 0]);
        expect([6, 7, 14, 15, 21, 22].map(rangDActionDeTai)).toEqual([3, 2, 2, 1, 1, 0]);
    });
});

describe('les modificateurs de catégorie (p. 57-59)', () => {
    it('lit une ligne de table, « tous les +4 » compris', () => {
        const forte = [-10, -5, 0, 5, 10, 5] as const;
        expect([1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25].map(v => apportDeLaCaracteristique(v, forte)))
            .toEqual([-10, -10, -5, -5, 0, 0, 5, 5, 10, 10, 15, 15, 20]);
    });

    it('retrouve les modificateurs de Vasana que le livre calcule', () => {
        expect(modificateurDeCategorie('agilite', VASANA).valeur).toBe(0);
        expect(modificateurDeCategorie('communication', VASANA).valeur).toBe(10);
        expect(modificateurDeCategorie('connaissances', VASANA).valeur).toBe(5);
        expect(modificateurDeCategorie('manipulation', VASANA).valeur).toBe(5);
        expect(modificateurDeCategorie('perception', VASANA).valeur).toBe(5);
        expect(modificateurDeCategorie('magie', VASANA).valeur).toBe(10);
        expect(modificateurDeCategorie('communication', VASANA).detail).toBe('INT 15 · POU 15 · CHA 19 +10 %');
    });

    it('fait jouer la TAI à rebours en Discrétion', () => {
        expect(modificateurDeCategorie('discretion', { ...VASANA, tai: 18, dex: 10, int: 10, pou: 10 }).valeur).toBe(-10);
        expect(modificateurDeCategorie('discretion', { ...VASANA, tai: 4, dex: 10, int: 10, pou: 18 }).valeur).toBe(5);
    });
});

describe('le calcul sur la fiche et son application', () => {
    const fiche = {
        ...VASANA, pv_max: 12, points_de_vie: 9, pm_max: 10, points_de_magie: 6, bonus_degats: '+1D4', degats_spirituels: '',
        vitesse_guerison: 2, enc_max: 10, ra_dex: 3, ra_tai: 2, pv_jambe_droite: 4, pv_jambe_gauche: 4, pv_abdomen: 4, pv_poitrine: 5,
        pv_bras_droit: 3, pv_bras_gauche: 3, pv_tete: 4, degats_tete: 2, mod_communication: 0, mod_armes_melee: 0,
    };

    it('dit ce qui diffère, ligne à ligne, avec la page', () => {
        const d = calculerLesDerives(REGLE, fiche);
        const ligne = (cle: string) => d.lignes.find(l => l.cle === cle)!;
        expect(ligne('pv-max')).toMatchObject({ calcule: 12, identique: true, detail: 'CON 12 · TAI 10 → — · POU 15 → — (p. 55)' });
        expect(ligne('pm-max')).toMatchObject({ surLaFiche: '10', calcule: 15, identique: false });
        expect(ligne('bonus-degats')).toMatchObject({ calcule: '+1D4', identique: true });
        expect(ligne('degats-spirituels')).toMatchObject({ surLaFiche: '—', calcule: '1D6+3', identique: false });
        expect(ligne('enc-max')).toMatchObject({ calcule: 14, identique: false });
        expect(ligne('zone-poitrine')).toMatchObject({ calcule: 5, identique: true });
        expect(ligne('categorie-communication')).toMatchObject({ calcule: 10, identique: false });
        expect(ligne('categorie-communication').note).toMatch(/ne sont pas modifiées.*\+10 %/);
        expect(ligne('armes-mod_armes_melee')).toMatchObject({ libelle: 'Armes de mêlée (Manipulation)', calcule: 5 });
    });

    it('accepte « — » et un vide comme l’absence de bonus aux dégâts', () => {
        const d = calculerLesDerives(REGLE, { ...fiche, for: 10, tai: 10, bonus_degats: '—' });
        expect(d.lignes.find(l => l.cle === 'bonus-degats')).toMatchObject({ calcule: '—', identique: true });
        const vide = calculerLesDerives(REGLE, { ...fiche, for: 10, tai: 10, bonus_degats: '' });
        expect(vide.lignes.find(l => l.cle === 'bonus-degats')!.identique).toBe(true);
    });

    it('ne calcule rien s’il manque une caractéristique', () => {
        const d = calculerLesDerives(REGLE, { ...fiche, cha: '' });
        expect(d).toEqual({ manquantes: ['cha'], lignes: [] });
    });

    it('garde les blessures quand un maximum change, et ne touche pas aux dégâts des zones', () => {
        const plusFort = { ...fiche, con: 14 }; // 14 PV : 3 perdus sur 12 en laissent 11 sur 14
        const d = calculerLesDerives(REGLE, plusFort);
        const maj = appliquerLesDerives(REGLE, plusFort, d, d.lignes.map(l => l.cle));
        expect(maj.pv_max).toBe(14);
        expect(maj.points_de_vie).toBe(11);
        expect(maj.pm_max).toBe(15);
        expect(maj.points_de_magie).toBe(11); // 4 PM dépensés sur 10, restent dépensés sur 15
        expect(maj.pv_poitrine).toBe(6);
        expect(maj).not.toHaveProperty('degats_tete');
        expect(maj).not.toHaveProperty('bonus_degats'); // identique : rien à écrire
    });

    it('n’écrit que les lignes choisies, et une jauge ne passe pas sous 0', () => {
        const affaibli = { ...fiche, con: 6, points_de_vie: 2 }; // 12 → 6 PV, 10 perdus : 0, pas −4
        const d = calculerLesDerives(REGLE, affaibli);
        expect(appliquerLesDerives(REGLE, affaibli, d, ['pv-max'])).toEqual({ pv_max: 6, points_de_vie: 0 });
    });
});
