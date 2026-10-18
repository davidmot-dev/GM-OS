import { describe, expect, it, vi } from 'vitest';
import * as tmr from '../../outils/reve-de-dragon/tmr/moteur.mjs';
import { CASES, distance, libelleCase, voisines } from '../../outils/reve-de-dragon/tmr/carte.mjs';
import { validerLeManifeste } from '../../outils/modules-du-jeu/contrat.mjs';
import manifeste from '../../outils/reve-de-dragon/tmr/manifeste.json';
import { ServiceDesModules } from './service';
import { modulesDuPilote } from '../../src/modules/modulesDuJeu/catalogue';
import type { ContexteDesModules, SauvegardeDesModules } from '../../src/modules/modulesDuJeu/protocole';

const contexte: ContexteDesModules = { campagneId: 'a', seanceId: 's', pilote: { id: 'custom-rdd', name: 'Rêve de Dragon', corpusId: 'reves de dragons', modulesDuJeu: [{ id: 'rdd-tmr' }] }, personnages: [{ id: 'alice', nom: 'Alice' }, { id: 'bob', nom: 'Bob' }] };
const mj = { role: 'mj' as const, appareilId: 'poste-mj' };
const copier = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
async function preparer(disque: unknown = null) {
    const stockage = { lire: vi.fn(async () => copier(disque)), ecrire: vi.fn(async (s: unknown) => { disque = copier(s); }) };
    const service = new ServiceDesModules(stockage, vi.fn()); await service.changerContexte(contexte);
    const lire = async () => (await service.vueMJ()).modules[0].vue as tmr.VueTMRMJ;
    const voyageur = async () => (await lire()).voyageurs.find(v => v.id === 'alice')!;
    const cmd = async (id: string, charge: unknown, joueur?: string) => service.commander({ requeteId: crypto.randomUUID(), campagneId: 'a', contexte: (await service.vueMJ()).contexte, moduleId: 'rdd-tmr', commande: { id, charge } }, joueur ? { role: 'joueur', personnageId: joueur, appareilId: joueur } : mj);
    const autoriser = async (personnages = ['alice', 'bob']) => service.autoriser({ campagneId: 'a', contexte: (await service.vueMJ()).contexte, moduleId: 'rdd-tmr', personnages });
    const proposer = async (action = 'monter', cible = 'G4', operationId = crypto.randomUUID()) => cmd('proposer', { operationId, etape: (await voyageur()).etape, action, cible, rythme: 'normal' }, 'alice');
    const valider = async () => cmd('arbitrer', { personnageId: 'alice', operationId: (await voyageur()).demande!.operationId, accepter: true, ficheTraitee: true, compteRendu: 'Résolu à la table' });
    return { service, stockage, disque: () => disque as SauvegardeDesModules, lire, voyageur, cmd, autoriser, proposer, valider };
}
describe('TMR : carte et contrat', () => {
    it('garde les 189 cases, les trois repères du livre et six voisines sans sortie de carte', () => {
        expect(CASES).toHaveLength(189); expect(new Set(CASES.map(c => c.id)).size).toBe(189);
        expect(libelleCase('G4')).toContain('BLANC'); expect(libelleCase('J4')).toContain('ENCRE'); expect(libelleCase('D13')).toContain('SORDIDE');
        expect(voisines('G4').sort()).toEqual(['F3', 'F4', 'G3', 'G5', 'H3', 'H4']);
        for (const c of CASES) for (const id of voisines(c.id)) { expect(distance(id, c.id)).toBe(1); expect(voisines(id)).toContain(c.id); }
        expect(voisines('M15')).not.toContain('M16'); expect(() => distance('B15', 'G4')).toThrow();
    });
    it('accepte le manifeste et les corpus historiques avec espaces, seulement sur référence explicite', () => {
        expect(validerLeManifeste(manifeste)).toEqual([]);
        expect(modulesDuPilote(contexte.pilote).modules[0].disponibilite).toBe('pret');
        expect(modulesDuPilote(contexte.pilote, 'systems/reves de dragons').modules[0].disponibilite).toBe('pret');
        expect(modulesDuPilote({ ...contexte.pilote!, modulesDuJeu: undefined }).modules).toEqual([]);
        expect(modulesDuPilote({ ...contexte.pilote!, corpusId: 'alien' }).modules[0].disponibilite).toBe('incompatible');
    });
    it('annonce les coûts sourcés sans créer de réserve de rêve ni de fatigue', () => {
        const d: tmr.DemandeTMR = { action: 'monter', cible: 'G4', rythme: 'normal', etape: 0, operationId: 'op' };
        expect(tmr.consequences(d)).toEqual({ reve: 1, fatigue: 1, rencontre: true, humide: false });
        expect(tmr.consequences({ ...d, rythme: 'accelere' }).reve).toBe(2);
        expect(tmr.consequences({ ...d, action: 'rester', cible: 'F8' })).toMatchObject({ reve: 0, fatigue: 1, humide: true });
        expect(tmr.consequences({ ...d, action: 'descendre' })).toEqual({ reve: 0, fatigue: 0, rencontre: false, humide: false });
        expect(tmr.creerEtat()).toEqual({ version: 2, voyageurs: [] });
    });
});
describe('TMR : autorité, secrets et reprise', () => {
    it('engage une intention privée sans déplacer puis acquitte seulement depuis le raccord natif', async () => {
        const t = await preparer(); await t.cmd('positionner', { personnageId: 'alice', cible: 'G4', etape: 0 }); await t.autoriser(); await t.proposer();
        const demande = (await t.voyageur()).demande!;
        await t.cmd('engager-trajet', { personnageId: 'alice', operationId: demande.operationId, transactionId: 'tx', empreinte: 'EMPREINTE PRIVÉE', compteRendu: 'Validé par le MJ' });
        expect(await t.voyageur()).toMatchObject({ present: false, ecriture: { id: 'tx', interrompue: false } });
        expect(JSON.stringify(await t.service.vueJoueur('alice', 'a'))).not.toContain('EMPREINTE PRIVÉE');
        await expect(t.cmd('annuler', { operationId: demande.operationId }, 'alice')).rejects.toThrow(/écriture/);
        await expect(t.valider()).rejects.toThrow(/écriture/);
        await expect(t.cmd('terminer-ecriture', { personnageId: 'alice' })).rejects.toThrow();
        const accuse = { campagneId: 'a', moduleId: 'rdd-tmr', contexte: (await t.service.vueMJ()).contexte, personnageId: 'alice', transactionId: 'tx', appliquee: true, sortieForcee: false, detail: 'Reçu relu' };
        t.stockage.ecrire.mockRejectedValueOnce(new Error('Disque plein'));
        await expect(t.service.acquitterFiche(accuse)).rejects.toThrow(); expect((await t.voyageur()).present).toBe(false);
        await t.service.acquitterFiche(accuse); expect(await t.voyageur()).toMatchObject({ present: true, ecriture: null });
        await expect(t.service.acquitterFiche(accuse)).rejects.toThrow(/déjà traitée/); expect((await t.voyageur()).journal).toHaveLength(1);
    });
    it('migre la première tranche et préserve une écriture engagée lors de la coupure', async () => {
        const ancien = { version: 1, voyageurs: [] }; expect(tmr.migrerEtat(ancien, 1)).toEqual({ version: 2, voyageurs: [] }); expect(ancien.version).toBe(1);
        const t = await preparer(); await t.cmd('positionner', { personnageId: 'alice', cible: 'G4', etape: 0 }); await t.autoriser(); await t.proposer();
        await t.cmd('engager-trajet', { personnageId: 'alice', operationId: (await t.voyageur()).demande!.operationId, transactionId: 'tx', empreinte: 'preuve', compteRendu: '' });
        const reprise = await preparer(t.disque()); expect(await reprise.voyageur()).toMatchObject({ present: false, demande: null, ecriture: { id: 'tx', interrompue: true } });
    });
    it('positionne explicitement et arbitre un trajet sans aucune écriture pendant la demande', async () => {
        const t = await preparer(); await t.cmd('positionner', { personnageId: 'alice', cible: 'G4', etape: 0 }); await t.autoriser();
        await t.proposer(); expect(await t.voyageur()).toMatchObject({ position: 'G4', present: false, etape: 1 });
        await expect(t.cmd('arbitrer', { personnageId: 'alice', operationId: (await t.voyageur()).demande!.operationId, accepter: true, ficheTraitee: false, compteRendu: '' })).rejects.toThrow(/Confirme/);
        await t.valider(); expect(await t.voyageur()).toMatchObject({ position: 'G4', present: true, etape: 2 });
        await t.proposer('avancer', 'H4'); await t.valider(); expect((await t.voyageur()).position).toBe('H4');
    });
    it('refuse les trajets non voisins, les identités injectées et le changement de rythme en route', async () => {
        const t = await preparer(); await t.cmd('positionner', { personnageId: 'alice', cible: 'G4', etape: 0 }); await t.autoriser(); await t.proposer(); await t.valider();
        await expect(t.proposer('avancer', 'D13')).rejects.toThrow(/voisine/);
        const d = { operationId: 'x', etape: 2, action: 'avancer', cible: 'H4', rythme: 'normal' };
        await expect(t.cmd('proposer', { ...d, personnageId: 'bob' }, 'alice')).rejects.toThrow();
        await expect(t.cmd('proposer', { ...d, rythme: 'accelere' }, 'alice')).rejects.toThrow(/rythme/);
        await expect(t.cmd('positionner', { personnageId: 'alice', cible: 'J4', etape: 2 }, 'alice')).rejects.toThrow();
    });
    it('refuse une intention périmée, déduplique une demande et ne valide jamais deux fois', async () => {
        const t = await preparer(); await t.cmd('positionner', { personnageId: 'alice', cible: 'G4', etape: 0 }); await t.autoriser();
        const d = { operationId: 'meme', etape: 1, action: 'monter', cible: 'G4', rythme: 'normal' };
        await t.cmd('proposer', d, 'alice'); await t.cmd('proposer', d, 'alice'); await t.valider();
        const avant = copier(t.disque()); await expect(t.cmd('proposer', d, 'alice')).rejects.toThrow();
        await expect(t.cmd('arbitrer', { personnageId: 'alice', operationId: 'meme', accepter: true, ficheTraitee: true, compteRendu: '' })).rejects.toThrow();
        expect(t.disque()).toEqual(avant); expect((await t.voyageur()).journal).toHaveLength(1);
    });
    it('garde la préparation MJ et les réserves de chacun hors des autres projections', async () => {
        const t = await preparer(); await t.cmd('positionner', { personnageId: 'alice', cible: 'G4', etape: 0 }); await t.autoriser();
        await t.cmd('preparer-rencontre', { personnageId: 'alice', texte: 'SECRET MJ' });
        await t.cmd('noter', { personnageId: 'alice', note: { id: 'sort', type: 'reserve', nom: 'SORT ALICE', caseId: 'J4', texte: 'Texte réservé' } });
        const a = JSON.stringify(await t.service.vueJoueur('alice', 'a')), b = JSON.stringify(await t.service.vueJoueur('bob', 'b'));
        expect(a).toContain('SORT ALICE'); expect(a).not.toContain('SECRET MJ'); expect(b).not.toContain('SORT ALICE'); expect(b).not.toContain('SECRET MJ');
    });
    it('bloque le déplacement pendant la rencontre publiée et permet de quitter', async () => {
        const t = await preparer(); await t.cmd('positionner', { personnageId: 'alice', cible: 'G4', etape: 0 }); await t.autoriser(); await t.proposer(); await t.valider();
        await t.cmd('publier-rencontre', { personnageId: 'alice', texte: 'Passeur, force 5' });
        await expect(t.proposer('avancer', 'H4')).rejects.toThrow(/rencontre/); await t.proposer('descendre'); await t.valider();
        expect((await t.voyageur()).rencontre).toBe('Passeur, force 5'); expect((await t.voyageur()).present).toBe(false);
    });
    it('conserve les positions si le disque refuse, sans acquitter le trajet', async () => {
        const t = await preparer(); await t.cmd('positionner', { personnageId: 'alice', cible: 'G4', etape: 0 }); await t.autoriser(); await t.proposer(); await t.valider(); await t.proposer('avancer', 'H4');
        const avant = copier(t.disque()); t.stockage.ecrire.mockRejectedValueOnce(new Error('Disque plein'));
        await expect(t.valider()).rejects.toThrow(/Écriture/); expect(t.disque()).toEqual(avant); expect((await t.voyageur()).position).toBe('G4');
        expect((await t.voyageur()).demande?.cible).toBe('H4'); await t.valider(); expect((await t.voyageur()).position).toBe('H4');
    });
    it('restaure les positions et notes, arrête le voyage sans coût et ferme les accès', async () => {
        const t = await preparer(); await t.cmd('positionner', { personnageId: 'alice', cible: 'G4', etape: 0 }); await t.autoriser(); await t.proposer(); await t.valider();
        await t.proposer('avancer', 'H4'); const reprise = await preparer(t.disque());
        expect(await reprise.voyageur()).toMatchObject({ position: 'G4', present: false, demande: null });
        expect((await reprise.service.vueJoueur('alice', 'a')).modules).toEqual([]);
        const e = tmr.arreterEffets((t.disque().campagnes.a['rdd-tmr'].donnees)); expect(tmr.arreterEffets(e)).toEqual(e);
        await reprise.service.importer(t.disque()); expect((await reprise.service.vueJoueur('alice', 'a')).modules).toEqual([]);
    });
    it('retire Alice sans perturber Bob et refuse le contexte révoqué', async () => {
        const t = await preparer(); await t.autoriser(); const bob = await t.service.vueJoueur('bob', 'b'); await t.autoriser(['bob']);
        expect((await t.service.vueJoueur('alice', 'a')).modules).toEqual([]); expect((await t.service.vueJoueur('bob', 'b')).modules[0].ouverture).toBe(bob.modules[0].ouverture);
        await expect(t.proposer()).rejects.toThrow();
    });
    it('préserve une version future et refuse les états corrompus sans écriture', async () => {
        const sauvegarde = { version: 1, campagnes: { a: { 'rdd-tmr': { versionDonnees: 99, donnees: { secret: 'Conservé' } } } } };
        const t = await preparer(sauvegarde); expect((await t.service.vueMJ()).indisponibles).toHaveLength(1); expect(t.disque()).toEqual(sauvegarde);
        const faux = await preparer({ version: 1, campagnes: { a: { 'rdd-tmr': { versionDonnees: 1, donnees: {} } } } });
        expect((await faux.service.vueMJ()).erreur).toContain('illisible'); expect(faux.stockage.ecrire).not.toHaveBeenCalled();
        expect(() => tmr.migrerEtat({}, 2)).toThrow();
    });
});
