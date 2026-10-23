import { describe, it, expect, vi, afterEach } from 'vitest';
import * as radar from '../../outils/alien/modules/detecteur/moteur.mjs';
import * as maman from '../../outils/alien/modules/muthur/moteur.mjs';
import * as spatial from '../../outils/alien/modules/combat-spatial/moteur.mjs';
import { extraireConfiguration } from '../../outils/alien/modules/muthur/configuration.mjs';

/** Préréglages et remise à zéro des trois modules Alien — 23/10/2026, demande de David. */
const mj = { role: 'mj' as const }, alice = { role: 'joueur' as const, personnageId: 'alice' };
const detecter = (e: radar.EtatDetecteur, id: string, charge: unknown) => radar.appliquerCommande(e, { id, charge } as radar.CommandeDetecteur, mj);
const terminal = (e: maman.EtatMuthur, id: string, charge: unknown, qui: { role: 'mj' | 'joueur'; personnageId?: string } = mj) =>
    maman.appliquerCommande(e, { id, charge } as maman.CommandeMuthur, qui as maman.ContexteMuthur);
const combattre = (e: spatial.EtatCombatSpatial, id: string, charge: unknown, qui: { role: 'mj' | 'joueur'; personnageId?: string } = mj) =>
    spatial.appliquerCommande(e, { id, charge } as spatial.CommandeCombatSpatial, qui);
afterEach(() => vi.restoreAllMocks());

describe('détecteur : préréglage complet et exemple du relais', () => {
    it('livre l’exemple une seule fois, au passage en v4, et ne le ramène pas après suppression', () => {
        expect(radar.creerEtat().prereglages.map(p => p.id)).toEqual(['exemple-relais']);
        const v3 = { ...radar.creerEtat(), version: 3, prereglages: [{ id: 'couloir', nom: 'Couloir', reglages: { intensity: 1, volume: 2, contacts: 3, proximity: 4, noise: 5 } }] };
        const migre = radar.migrerEtat(v3, 3);
        expect(migre.prereglages.map(p => p.id)).toEqual(['couloir', 'exemple-relais']);
        expect(radar.migrerEtat(migre, 4).prereglages).toEqual(migre.prereglages);
        const sansExemple = detecter(migre, 'supprimer-prereglage', { prereglageId: 'exemple-relais' });
        expect(radar.migrerEtat(sansExemple, 4).prereglages.map(p => p.id)).toEqual(['couloir']);
    });
    it('l’exemple rappelé donne l’écho de la gaine au premier Tour, sans la vermine ni le chien hors de portée', () => {
        let e = detecter(radar.creerEtat(), 'rappeler-prereglage', { prereglageId: 'exemple-relais' });
        expect(e.discret).toMatchObject({ actif: true, tour: 1, porteurId: 'pj-rye', energie: 5, terrain: 'interieur' });
        e = detecter(e, 'deplacer-discret', { pionId: 'xeno', zoneId: 'coursive-b', tour: 1 });
        e = detecter(e, 'deplacer-discret', { pionId: 'xeno', zoneId: 'gaine', tour: 1 });
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        e = detecter(e, 'scanner-discret', { tour: 1 });
        expect(radar.vuePour(e, alice).lectureDiscrete!.echos).toEqual([{ zone: 'Gaine technique', nombre: 1, x: 0.5, y: -0.25 }]);
    });
    it('garde réglages, effets et plan sans ce qui s’est joué ; le rappel arrête le scan et repart au Tour 1', () => {
        let e = detecter(radar.creerEtat(), 'rappeler-prereglage', { prereglageId: 'exemple-relais' });
        e = detecter(e, 'configurer', { contacts: 6, crt: false });
        e = detecter(e, 'deplacer-discret', { pionId: 'pj-davis', zoneId: 'coursive-a', tour: 1 });
        vi.spyOn(Math, 'random').mockReturnValue(0);
        e = detecter(e, 'scanner-discret', { tour: 1 });
        e = detecter(e, 'tour-discret', { tour: 1 });
        e = detecter(e, 'enregistrer-prereglage', { prereglageId: 'mi-partie', nom: ' Mi-partie ' });
        const pr = e.prereglages.find(p => p.id === 'mi-partie')!;
        expect(pr.nom).toBe('Mi-partie');
        expect(pr.config).toEqual({ crt: false, glitches: true });
        expect(pr.discret).toMatchObject({ tour: 1, dernierScan: null, energie: 0 });
        expect(pr.discret!.pions.find(p => p.id === 'pj-davis')).toMatchObject({ zoneId: 'coursive-a', depense: 0 });
        e = detecter(e, 'reinitialiser', {});
        expect(e.discret).toEqual(radar.creerEtat().discret);
        expect(e.prereglages.map(p => p.id)).toEqual(['exemple-relais', 'mi-partie']);
        e = detecter(e, 'rappeler-prereglage', { prereglageId: 'mi-partie' });
        expect(e.tracker).toMatchObject({ contacts: 6, power: false });
        expect(e.config.crt).toBe(false);
        expect(e.discret.pions.find(p => p.id === 'pj-davis')!.zoneId).toBe('coursive-a');
    });
    it('un préréglage d’avant la v4 ne touche pas au plan ; la tablette ne voit aucun préréglage', () => {
        const ancien = { id: 'couloir', nom: 'Couloir', reglages: { intensity: 1, volume: 2, contacts: 3, proximity: 4, noise: 5 } };
        let e = detecter(radar.creerEtat(), 'rappeler-prereglage', { prereglageId: 'exemple-relais' });
        e = { ...e, prereglages: [...e.prereglages, ancien] };
        e = detecter(e, 'rappeler-prereglage', { prereglageId: 'couloir' });
        expect(e.tracker.contacts).toBe(3);
        expect(e.discret.zones).toHaveLength(8);
        expect(radar.vuePour(e, alice)).not.toHaveProperty('prereglages');
        expect(() => radar.appliquerCommande(e, { id: 'reinitialiser', charge: {} }, alice)).toThrow(/meneur/);
        expect(() => detecter(e, 'reinitialiser', { tout: true })).toThrow();
    });
});

describe('MU/TH/UR : préréglage de la préparation de Maman', () => {
    function prepare() {
        let e = terminal(maman.creerEtat(), 'preparer-operateur', { personnageId: 'alice', nom: 'Alice' });
        e = terminal(e, 'configurer', { vaisseau: 'USCSS CRONOS' });
        e = terminal(e, 'creer-dossier', { dossierId: 'quarantaine', titre: 'Quarantaine', contenu: 'Pont C isolé.', acces: 'code', code: '7781' });
        e = terminal(e, 'dossier-acte', { scenario: 'Destroyer', acte: 1, dossierId: 'acte-un', titre: 'Ordre spécial', contenu: 'Ramener un spécimen.', acces: 'administrateur', code: '' });
        e = terminal(e, 'objectif-acte', { scenario: 'Destroyer', acte: 1, personnageId: 'alice', texte: 'Survivre.' });
        return terminal(e, 'enregistrer-prereglage', { prereglageId: 'cronos', nom: 'Cronos' });
    }
    it('garde configuration, dossiers, protocoles et actes ; la remise à zéro garde les préréglages', () => {
        let e = prepare();
        expect(e.prereglages[0]).toMatchObject({ id: 'cronos', nom: 'Cronos', config: { vessel: 'USCSS CRONOS' } });
        expect(e.prereglages[0].documents.map(d => d.id)).toContain('quarantaine');
        e = terminal(e, 'saisir', { texte: 'CODE 7781' }, alice);
        e = terminal(e, 'reinitialiser', {});
        expect(e.config.vessel).not.toBe('USCSS CRONOS');
        expect(e.actes).toEqual([]);
        expect(e.prereglages.map(p => p.id)).toEqual(['cronos']);
        e = terminal(e, 'rappeler-prereglage', { prereglageId: 'cronos' });
        expect(e.config.vessel).toBe('USCSS CRONOS');
        expect(e.documents.map(d => d.id)).toContain('quarantaine');
        expect(e.actes[0].objectifs[0]).toMatchObject({ personnageId: 'alice', remis: false });
        expect(e.players.alice).toMatchObject({ name: 'Alice', unlocked: [], messages: [] });
    });
    it('le rappel remet à neuf ce qui s’est joué ; la tablette ne voit ni préréglage ni commande', () => {
        let e = prepare();
        e = terminal(e, 'remettre-objectif-acte', { scenario: 'Destroyer', acte: 1, personnageId: 'alice' });
        e = terminal(e, 'rappeler-prereglage', { prereglageId: 'cronos' });
        expect(e.actes[0].objectifs[0].remis).toBe(false);
        expect(e.players.alice.messages).toEqual([]);
        expect(maman.vuePour(e, mj).prereglages).toEqual([{ id: 'cronos', nom: 'Cronos' }]);
        expect(JSON.stringify(maman.vuePour(e, alice as never))).not.toContain('Cronos');
        expect(() => terminal(e, 'rappeler-prereglage', { prereglageId: 'cronos' }, alice)).toThrow(/meneur/);
        expect(() => terminal(e, 'enregistrer-prereglage', { prereglageId: 'autre', nom: 'CRONOS' })).toThrow(/nom/);
        expect(() => terminal(e, 'supprimer-prereglage', { prereglageId: 'inconnu' })).toThrow(/inconnu/);
        expect(terminal(e, 'supprimer-prereglage', { prereglageId: 'cronos' }).prereglages).toEqual([]);
    });
    it('migre une v4 sans préréglage ; le fichier de l’atelier reste le même', () => {
        const e = prepare();
        const v4: Record<string, unknown> = { ...JSON.parse(JSON.stringify(e)), version: 4 }; delete v4.prereglages;
        expect(maman.migrerEtat(v4, 4).prereglages).toEqual([]);
        expect(maman.migrerEtat(JSON.parse(JSON.stringify(e)), 5).prereglages).toEqual(e.prereglages);
        expect(Object.keys(extraireConfiguration(e))).toEqual(['format', 'version', 'config', 'documents', 'protocoles', 'actes']);
    });
});

describe('combat spatial : préréglage des vaisseaux', () => {
    const vaisseau = (e: spatial.EtatCombatSpatial, nom: string, camp: 'joueurs' | 'adverse') => combattre(e, 'vaisseau', { nom, modele: 'libre', camp,
        signature: 0, propulseurs: 0, coque: 6, protection: 4, armes: ['canon-electrique-leger'], transpondeur: true, ombilic: false });
    it('garde les vaisseaux et leurs postes ; le rappel attend la fin du combat ; la remise à zéro arrête tout', () => {
        let e = vaisseau(vaisseau(spatial.creerEtat(), 'Montero', 'joueurs'), 'Patna', 'adverse');
        const [nous, eux] = e.vaisseaux.map(v => v.id);
        e = combattre(e, 'poste', { vaisseauId: nous, poste: 'pilote', personnageId: 'alice', nom: 'Alice', base: 5, stress: 1, talent: false, synthetique: false });
        e = combattre(e, 'enregistrer-prereglage', { prereglageId: 'rencontre', nom: 'Rencontre' });
        e = combattre(e, 'demarrer-combat', { vaisseaux: [nous, eux], distance: 4, velociteJoueurs: 2, velociteAdverse: 2 });
        expect(() => combattre(e, 'rappeler-prereglage', { prereglageId: 'rencontre' })).toThrow(/Termine le combat/);
        e = combattre(e, 'reinitialiser', {});
        expect(e).toMatchObject({ vaisseaux: [], combat: null });
        expect(e.prereglages.map(p => p.nom)).toEqual(['Rencontre']);
        e = combattre(e, 'rappeler-prereglage', { prereglageId: 'rencontre' });
        expect(e.vaisseaux.map(v => v.nom)).toEqual(['Montero', 'Patna']);
        expect(e.vaisseaux[0].postes.pilote).toMatchObject({ personnageId: 'alice', base: 5 });
    });
    it('une réparation d’urgence redevient avarie dans le préréglage ; la tablette ne voit rien', () => {
        let e = vaisseau(spatial.creerEtat(), 'Montero', 'joueurs');
        e.vaisseaux[0].avaries.push({ id: 'avarie-1', gravite: 'mineure', code: 11, restants: [], etat: 'temporaire' });
        e = combattre(e, 'enregistrer-prereglage', { prereglageId: 'abime', nom: 'Abîmé' });
        expect(e.prereglages[0].vaisseaux[0].avaries[0].etat).toBe('active');
        expect(e.prereglages[0].vaisseaux[0].avaries[0].restants.length).toBeGreaterThan(0);
        expect(spatial.vuePour(e, mj).prereglages).toEqual([{ id: 'abime', nom: 'Abîmé' }]);
        expect(spatial.vuePour(e, alice)).not.toHaveProperty('prereglages');
        expect(() => combattre(e, 'reinitialiser', {}, alice)).toThrow(/meneur/);
    });
    it('migre la v1 en ajoutant une liste vide', () => {
        const v1: Record<string, unknown> = { ...spatial.creerEtat(), version: 1 }; delete v1.prereglages;
        expect(spatial.migrerEtat(v1, 1)).toMatchObject({ version: 2, prereglages: [] });
        expect(() => spatial.migrerEtat({ ...v1, version: 2 }, 2)).toThrow();
    });
});
