import { describe, it, expect } from 'vitest';
import { TABLE_SHADOWRUN_VIDE, operationTableShadowrun } from './tableDeShadowrun';
import { OPPOSITION_SHADOWRUN, comparerShadowrun, moyenneSecondRole } from './oppositionDeShadowrun';
import { impactVehiculeShadowrun, prendreControleShadowrun, seuilsVehiculeShadowrun, PROFIL_RIGGER_VIDE, type VehiculeShadowrun } from './riggingDeShadowrun';
import { reserveDeShadowrun, resoudreShadowrun } from './shadowrun';
import { preparerLeJet } from '../DescripteurDeJet';

const v: VehiculeShadowrun = { id: 'v', nom: 'Moustique', structure: 4, blindage: 2, autopilote: 6, maniabilite: 4, vitesse: 3,
    moniteur: { legeres: 0, graves: 0, incapacitantes: 0 }, debride: false };
describe('SR-A4 : ressources natives et reçus', () => {
    it('4 en planification, flashback 2 → 2 ; un seul débit après sérialisation du reçu', () => {
        const op = { id: 'flash', type: 'flashback' as const, cout: 2, source: 'collective' as const, description: 'Le badge a été copié.' };
        const un = operationTableShadowrun(TABLE_SHADOWRUN_VIDE, 4, 0, 3, op);
        expect([un.planification, un.anarchy]).toEqual([2, 3]);
        const deux = operationTableShadowrun(JSON.parse(JSON.stringify(un.table)), un.planification, 0, 3, op);
        expect(deux.appliquee).toBe(false); expect(deux.planification).toBe(2);
    });
    it('paiement personnel sans priorité à la réserve collective ; refus sans débit si insuffisant', () => {
        const op = { id: 'f', type: 'flashback' as const, cout: 4, source: 'personnelle' as const, description: 'Plan' };
        expect(operationTableShadowrun(TABLE_SHADOWRUN_VIDE, 10, 0, 3, op).appliquee).toBe(false);
        const r = operationTableShadowrun(TABLE_SHADOWRUN_VIDE, 10, 0, 5, op);
        expect([r.planification, r.anarchy]).toEqual([10, 1]);
    });
    it('6 succès en temps limité donnent 3 points ; pas d’achat de dés', () => {
        expect(operationTableShadowrun(TABLE_SHADOWRUN_VIDE, 0, 0, 0, { id: 'j', type: 'preparation', succes: 6, tempsLimite: true }).planification).toBe(3);
    });
    it('menace +1 par utilisation, même si le coût vaut 4 ; désastre seulement sur dépassement et confirmation', () => {
        const t = { ...TABLE_SHADOWRUN_VIDE, totale: true };
        const r = operationTableShadowrun(t, 5, 1, 5, { id: 'f', type: 'flashback', cout: 4, source: 'collective', description: 'Plan' });
        expect([r.planification, r.menace]).toEqual([1, 2]);
        expect(operationTableShadowrun(r.table, 1, 2, 5, { id: 'd', type: 'desastre' }).menace).toBe(0);
        expect(operationTableShadowrun(t, 2, 2, 5, { id: 'd', type: 'desastre' }).appliquee).toBe(false);
        expect(operationTableShadowrun(TABLE_SHADOWRUN_VIDE, 0, 3, 0, { id: 'd', type: 'desastre' }).appliquee).toBe(false);
    });
});
describe('SR-A5 : oppositions et rôles', () => {
    it('4 contre 4 ne donne aucun vainqueur ; le départage explicite suit l’initiateur', () => {
        const o = { ...OPPOSITION_SHADOWRUN, succes: 4 };
        expect(comparerShadowrun(4, o)).toMatchObject({ reussi: false, egalite: true, nets: 0 });
        expect(comparerShadowrun(4, { ...o, vainqueurNecessaire: true })).toMatchObject({ reussi: true, egalite: false });
        expect(comparerShadowrun(4, { ...o, vainqueurNecessaire: true, initiateur: 'adversaire' }).reussi).toBe(false);
    });
    it('le tir touche à égalité et une défense seule en mêlée aussi ; mêlée simultanée non départagée', () => {
        const o = { ...OPPOSITION_SHADOWRUN, succes: 4 };
        expect(comparerShadowrun(4, { ...o, epreuve: 'tir' }).reussi).toBe(true);
        expect(comparerShadowrun(4, { ...o, epreuve: 'melee', defenseSeule: true }).reussi).toBe(true);
        expect(comparerShadowrun(4, { ...o, epreuve: 'melee' }).egalite).toBe(true);
    });
    it('la table des seconds rôles est respectée à chaque borne ; 9 dés RR 1 → 5', () => {
        for (let rr = 0; rr <= 3; rr++) for (const [bas, haut, base] of [[2, 4, 2], [5, 7, 3], [8, 10, 4], [11, 13, 5], [14, 16, 6]])
            for (const n of [bas, haut]) expect(moyenneSecondRole(n, rr)).toBe(base + rr);
        expect(moyenneSecondRole(9, 1)).toBe(5);
    });
    it('le moteur et son journal ne déclarent pas une égalité gagnée ; la relance peut garder l’opposition', () => {
        const r = resoudreShadowrun({ normaux: [6, 6, 6, 6] }, { valeurDuSucces: 5, rr: 0, annules: 0 }, 4, undefined, { ...OPPOSITION_SHADOWRUN, succes: 4 });
        expect(r.tagSuccess).toBeUndefined(); expect(r.degre).toBeUndefined(); expect(r.shadowrun.libelle).toContain('Égalité');
    });
    it('l’avantage adverse s’inverse au PJ sans modifier la réserve', () => {
        const r = reserveDeShadowrun(8, {}, { situationAdverse: 1 });
        expect([r.des, r.valeurDuSucces]).toEqual([8, 6]);
    });
});
describe('SR-A6 : véhicule et rigger', () => {
    const profil = { ...PROFIL_RIGGER_VIDE, ind: true, ccv: true, ccr: true };
    it('applique le tableau choisi par David : 6/10/14, seuil à dépasser', () => {
        expect(seuilsVehiculeShadowrun(v)).toEqual({ legere: 6, grave: 10, incapacitante: 14 });
        expect(impactVehiculeShadowrun(v, 6).cochee).toBeUndefined();
        expect(impactVehiculeShadowrun(v, 10).cochee).toBe('legere');
        expect(impactVehiculeShadowrun(v, 11).cochee).toBe('grave');
    });
    it('troisième légère : case grave et une légère mentale létale au rigger hot-sim ; manuel sans biofeedback', () => {
        const drone = { ...v, moniteur: { legeres: 2, graves: 0, incapacitantes: 0 }, controle: { mode: 'plongee' as const, personnageId: 'p', connexion: 'hot' as const } };
        expect(impactVehiculeShadowrun(drone, 7)).toMatchObject({ cochee: 'grave', biofeedback: { gravite: 'legere', nature: 'letal', personnageId: 'p' } });
        expect(impactVehiculeShadowrun({ ...drone, controle: { ...drone.controle, mode: 'manuel' } }, 15).biofeedback).toBeUndefined();
    });
    it('une incapacitante cold-sim provoque une grave étourdissante ; aucune nouvelle blessure si moniteur plein', () => {
        const drone = { ...v, controle: { mode: 'plongee' as const, personnageId: 'p', connexion: 'cold' as const } };
        const un = impactVehiculeShadowrun(drone, 15);
        expect(un.biofeedback).toMatchObject({ gravite: 'grave', nature: 'etourdissant' });
        expect(impactVehiculeShadowrun(un.vehicule, 15).biofeedback).toBeUndefined();
    });
    it('priorité, premier ordre de même niveau et équipement nécessaire', () => {
        const plonge = prendreControleShadowrun(v, [v], profil, 'p', 'plongee', 'hot').vehicule;
        expect(prendreControleShadowrun(plonge, [plonge], profil, 'autre', 'plongee', 'cold').refus).toContain('première commande');
        expect(prendreControleShadowrun(plonge, [plonge], profil, 'autre', 'manuel', 'cold').refus).toBeTruthy();
        expect(prendreControleShadowrun(v, [v], PROFIL_RIGGER_VIDE, 'p', 'plongee', 'cold').refus).toContain('CCV');
        const autonome = { ...v, controle: { mode: 'autonome' as const, personnageId: 'p', connexion: 'cold' as const } };
        expect(prendreControleShadowrun(autonome, [autonome], profil, 'autre', 'autonome', 'cold').vehicule.controle?.personnageId).toBe('autre');
    });
    it('un changement par narration, plongée unique et capacité de CCR', () => {
        const un = prendreControleShadowrun(v, [v], profil, 'p', 'plongee', 'cold');
        expect(prendreControleShadowrun(un.vehicule, [un.vehicule], un.profil, 'p', 'manuel', 'cold').refus).toContain('narration');
        expect(prendreControleShadowrun({ ...v, id: 'v2' }, [un.vehicule], profil, 'p', 'plongee', 'cold').refus).toContain('seule plongée');
        const capitaine = prendreControleShadowrun(v, [v], { ...profil, capacite: 2 }, 'p', 'capitaine', 'cold');
        const deux = prendreControleShadowrun({ ...v, id: 'v2' }, [capitaine.vehicule], capitaine.profil, 'p', 'capitaine', 'cold');
        expect(deux.refus).toBeUndefined();
        expect(prendreControleShadowrun({ ...v, id: 'v3' }, [capitaine.vehicule, deux.vehicule], deux.profil, 'p', 'capitaine', 'cold').refus).toContain('Capacité');
    });
    it('Autopilote seul et risque faible imposé ; ne subit pas la blessure grave personnelle du rigger', () => {
        const d = { sens: 'superieur-ou-egal' as const, reserve: { base: 0, max: 16, faces: 6, composantes: [] },
            shadowrun: { rigging: { resistance: 'tableau-blessures' as const }, blessures: { legeres: 'l', graves: 'g', incapacitantes: 'i' } } };
        const j = preparerLeJet(d, { g: 1 }, { champs: {}, shadowrun: { desDeRisque: 6, rigging: { vehicule: v, personnageId: 'p', pilotage: true } } });
        expect([j.shadowrun?.des, j.shadowrun?.risque, j.shadowrun?.valeurDuSucces]).toEqual([6, 1, 5]);
    });
});
