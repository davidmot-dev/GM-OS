import { describe, it, expect, vi } from 'vitest';
import { ServiceDesModules } from './service';
import type { ContexteDesModules, CommandeDeModule, SauvegardeDesModules } from '../../src/modules/modulesDuJeu/protocole';
import type { VueLcarsMJ, VueLcarsJoueur } from '../../outils/star-trek/lcars/moteur.mjs';
import { creerFiction } from '../../outils/star-trek/lcars/fiction.mjs';
import { exporterConfiguration } from '../../outils/star-trek/lcars/configuration.mjs';
import { POSTES } from '../../outils/star-trek/lcars/postes.mjs';
const copier = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const contexte: ContexteDesModules = { campagneId: 'a', seanceId: 's', pilote: { id: 'custom-trek', name: 'Star Trek', corpusId: 'star-trek', modulesDuJeu: [{ id: 'star-trek-lcars' }] }, personnages: [{ id: 'alice', nom: 'Alice' }, { id: 'bob', nom: 'Bob' }] };
async function preparer(initial: unknown = null) {
    let disque = initial;
    const stockage = { lire: vi.fn(async () => copier(disque)), ecrire: vi.fn(async (v: unknown) => { disque = copier(v); }) };
    const service = new ServiceDesModules(stockage, vi.fn()); await service.changerContexte(contexte);
    const mj = async () => (await service.vueMJ()).modules[0].vue as VueLcarsMJ;
    const pj = async (id = 'alice') => (await service.vueJoueur(id, 'tablette-' + id)).modules[0]?.vue as VueLcarsJoueur | undefined;
    const commande = async (id: string, charge: unknown, personnageId?: string) => service.commander({ requeteId: crypto.randomUUID(), campagneId: (await service.vueMJ()).campagneId!, contexte: (await service.vueMJ()).contexte, moduleId: 'star-trek-lcars', commande: { id, charge } }, personnageId ? { role: 'joueur', personnageId, appareilId: 'tablette-' + personnageId } : { role: 'mj', appareilId: 'poste-mj' });
    const autoriser = async (personnages = ['alice', 'bob']) => service.autoriser({ campagneId: (await service.vueMJ()).campagneId!, contexte: (await service.vueMJ()).contexte, moduleId: 'star-trek-lcars', personnages });
    const affecter = (id: string, postes: string[]) => commande('preparer-officier', { personnageId: id, nom: 'Nom injecté', postes });
    const cible = () => commande('preparer-cible', { cibleId: 'signal', poste: 'science', libelle: 'Signal', description: 'Un écho', rapportPrepare: 'SECRET PRÉPARÉ', visible: true, etat: 'inconnu' });
    const demander = async () => commande('demander-intervention', { poste: 'science', cibleId: 'signal', action: 'scan', question: 'QUESTION ALICE', affectation: (await pj())!.officier.affectation }, 'alice');
    return { service, stockage, disque: () => disque as SauvegardeDesModules, mj, pj, commande, autoriser, affecter, cible, demander };
}
describe('LCARS natif : équipage, droits et persistance', () => {
    it('fait passer les 19 actions des sept postes par la même autorité native', async () => {
        const t = await preparer();
        await t.commande('importer-preparation', { configuration: exporterConfiguration(creerFiction()) });
        await t.affecter('alice', Object.keys(POSTES)); await t.autoriser(['alice']);
        const affectation = (await t.pj())!.officier.affectation;
        for (const [poste, p] of Object.entries(POSTES)) for (const action of Object.keys(p.actions)) {
            const cibleId = (await t.mj()).cibles.find(c => c.poste === poste && c.visible)!.id;
            await t.commande('demander-intervention', { poste, cibleId, action, question: 'Intention à arbitrer', affectation }, 'alice');
        }
        expect((await t.mj()).demandes).toHaveLength(19); expect((await t.mj()).demandes.every(d => d.personnageId === 'alice' && d.statut === 'attente')).toBe(true);
    });
    it('part d’une préparation neutre et expose le roster seulement au MJ', async () => {
        const t = await preparer(); expect((await t.mj()).vaisseau.nom).toBe('Vaisseau à configurer');
        expect((await t.mj()).officiers).toEqual([]); expect((await t.mj()).personnages).toEqual(contexte.personnages);
        expect((await t.mj()).cibles).toEqual([]); expect(await t.pj()).toBeUndefined();
    });
    it('prépare hors séance, vérifie le personnage et ne laisse pas le nom de la charge faire autorité', async () => {
        const t = await preparer(); await t.service.changerContexte({ ...contexte, seanceId: null });
        await t.affecter('alice', ['science', 'medecine']); expect((await t.mj()).officiers[0].nom).toBe('Alice');
        await expect(t.affecter('fictif', ['science'])).rejects.toThrow(/absent/);
        await expect(t.autoriser(['alice'])).rejects.toThrow(/séance/); expect(await t.pj()).toBeUndefined();
    });
    it('ouvrir et renommer préservent les postes et leur époque ; un accès seul ne crée aucun poste', async () => {
        const t = await preparer(); await t.affecter('alice', ['science']); const avant = (await t.mj()).officiers[0].affectation;
        await t.autoriser(); await t.autoriser(); expect((await t.pj())!.officier.affectation).toBe(avant);
        expect((await t.pj('bob'))!.officier.postes).toEqual([]); expect(await t.pj('bob')).not.toHaveProperty('personnages');
        await t.service.changerContexte({ ...contexte, personnages: [{ id: 'alice', nom: 'Alice renommée' }, contexte.personnages[1]] });
        expect((await t.pj())!.officier.nom).toBe('Alice renommée'); expect((await t.pj())!.officier.postes).toEqual(['science']); expect((await t.pj())!.officier.affectation).toBe(avant);
    });
    it('cloisonne les demandes et rapports puis partage seulement le résultat autorisé', async () => {
        const t = await preparer(); await t.affecter('alice', ['science']); await t.affecter('bob', ['commandement']); await t.cible(); await t.autoriser(); await t.demander();
        expect(JSON.stringify(await t.pj())).not.toContain('SECRET PRÉPARÉ'); expect(JSON.stringify(await t.pj('bob'))).not.toContain('QUESTION ALICE');
        const demandeId = (await t.mj()).demandes[0].id;
        await t.commande('resoudre-demande', { demandeId, texte: 'RÉSULTAT PRIVÉ', partageAutorise: true, acceptee: true, media: null, nouvelEtat: 'identifie' });
        expect(JSON.stringify(await t.pj('bob'))).not.toContain('RÉSULTAT PRIVÉ');
        await t.commande('partager-rapport', { demandeId, affectation: (await t.pj())!.officier.affectation }, 'alice');
        expect(JSON.stringify(await t.pj('bob'))).toContain('RÉSULTAT PRIVÉ'); expect(JSON.stringify(await t.pj('bob'))).not.toContain('QUESTION ALICE');
    });
    it('révoque un poste sans annuler les autres et refuse une époque périmée', async () => {
        const t = await preparer(); await t.affecter('alice', ['science', 'medecine']); await t.cible(); await t.autoriser(); await t.demander();
        const epoque = (await t.pj())!.officier.affectation, ouvertureBob = (await t.service.vueJoueur('bob', 'b')).modules[0].ouverture;
        await t.affecter('alice', ['medecine']); expect((await t.pj())!.officier.postes).toEqual(['medecine']); expect((await t.mj()).demandes[0].statut).toBe('annulee');
        await expect(t.commande('demander-intervention', { poste: 'science', cibleId: 'signal', action: 'scan', question: '', affectation: epoque }, 'alice')).rejects.toThrow();
        await t.autoriser(['bob']); expect(await t.pj()).toBeUndefined(); expect((await t.service.vueJoueur('bob', 'b')).modules[0].ouverture).toBe(ouvertureBob);
    });
    it('sortir un personnage conserve ses auteurs et retire ses affectations même avant réouverture', async () => {
        const t = await preparer(); await t.affecter('alice', ['science']); await t.cible(); await t.autoriser(); await t.demander();
        await t.service.changerContexte({ ...contexte, personnages: [contexte.personnages[1]] });
        expect((await t.mj()).officiers[0].postes).toEqual([]); expect((await t.mj()).demandes[0].personnageId).toBe('alice');
        expect((await t.mj()).demandes[0].statut).toBe('annulee'); await expect(t.affecter('alice', ['science'])).rejects.toThrow();
        await t.service.changerContexte(contexte); await t.autoriser(['alice']); expect((await t.pj())!.officier.postes).toEqual([]);
    });
    it('limite à 16 les officiers sans ouvrir partiellement une liste trop grande', async () => {
        const t = await preparer(); const personnages = Array.from({ length: 17 }, (_, i) => ({ id: `p-${i}`, nom: `Officier ${i}` }));
        await t.service.changerContexte({ ...contexte, personnages });
        await expect(t.autoriser(personnages.map(p => p.id))).rejects.toThrow(/Capacité/);
        expect((await t.mj()).officiers).toHaveLength(0); expect((await t.service.vueMJ()).modules[0].acces).toEqual([]);
    });
    it('restaure les historiques et deux campagnes sans reprendre les effets ni les droits', async () => {
        const t = await preparer(); await t.affecter('alice', ['science']); await t.cible(); await t.autoriser(); await t.demander();
        await t.commande('changer-alerte', { niveau: 'rouge', texte: 'Évacuation', secondes: 60 });
        const sauvegarde = copier(t.disque()), reprise = await preparer(sauvegarde);
        expect((await reprise.mj()).demandes).toHaveLength(1); expect((await reprise.mj()).effetsActifs).toBe(false); expect((await reprise.mj()).alerte.fin).toBeNull(); expect(await reprise.pj()).toBeUndefined();
        await reprise.service.changerContexte({ ...contexte, campagneId: 'b' }); expect((await reprise.mj()).cibles).toEqual([]);
        await reprise.commande('configurer-vaisseau', { nom: 'USS B', immatriculation: 'B', situation: '' });
        await reprise.service.changerContexte(contexte); expect((await reprise.mj()).cibles).toHaveLength(1); expect((await reprise.mj()).vaisseau.nom).not.toBe('USS B');
        await reprise.service.importer(sauvegarde); expect((await reprise.mj()).demandes).toHaveLength(1); expect(await reprise.pj()).toBeUndefined();
    });
    it('importe seulement la préparation, efface les échanges courants et ferme les accès après écriture', async () => {
        const t = await preparer(); await t.affecter('alice', ['science']); await t.cible(); await t.autoriser(); await t.demander();
        const configuration = exporterConfiguration(creerFiction()); const avant = copier(t.disque());
        t.stockage.ecrire.mockRejectedValueOnce(new Error('Disque plein'));
        await expect(t.commande('importer-preparation', { configuration })).rejects.toThrow(); expect(t.disque()).toEqual(avant); expect(await t.pj()).toBeDefined();
        await t.commande('importer-preparation', { configuration }); const v = await t.mj();
        expect(v.vaisseau.nom).toBe('USS ASTERIA'); expect(v.cibles).toHaveLength(13); expect(v.prereglages).toHaveLength(3);
        expect(v.officiers).toEqual([]); expect(v.demandes).toEqual([]); expect(v.ordres).toEqual([]); expect(v.publications).toEqual([]); expect(v.effetsActifs).toBe(false); expect(await t.pj()).toBeUndefined();
        expect(JSON.stringify(v)).not.toContain('pj-tlen');
    });
    it('préserve une version future connue sans exécution, et refuse une copie courante corrompue', async () => {
        const sauvegarde = { version: 1, campagnes: { a: { 'star-trek-lcars': { versionDonnees: 99, donnees: { secret: 'À CONSERVER' } } } } };
        const t = await preparer(sauvegarde); expect((await t.service.vueMJ()).modules).toEqual([]); expect((await t.service.vueMJ()).indisponibles?.[0].raison).toContain('plus récente');
        expect((await t.service.vueMJ()).sauvegarde).toEqual(sauvegarde);
        await t.service.importer(sauvegarde as SauvegardeDesModules); expect(t.disque()).toEqual(sauvegarde);
        const corrompu = await preparer({ version: 1, campagnes: { a: { 'star-trek-lcars': { versionDonnees: 2, donnees: {} } } } });
        expect((await corrompu.service.vueMJ()).erreur).toContain('illisible'); expect(corrompu.stockage.ecrire).not.toHaveBeenCalled();
    });
    it('refuse une commande déconnectée, un média invalide ou une auto-désignation sonore joueur', async () => {
        const t = await preparer(); await t.autoriser(['alice']);
        await expect(t.commande('choisir-diffusion', { actif: true }, 'alice')).rejects.toThrow(/pupitre/);
        await expect(t.commande('publier-rapport', { titre: 'T', texte: 'T', destinataires: ['equipage'], media: { type: 'image' } })).rejects.toThrow();
        const commande: CommandeDeModule = { id: 'configurer-vaisseau', charge: { nom: 'Refusé', immatriculation: 'R', situation: '' } };
        await expect(t.service.commander({ requeteId: 'x', campagneId: 'a', contexte: (await t.service.vueMJ()).contexte, moduleId: 'star-trek-lcars', commande }, { role: 'mj', appareilId: 'poste-mj' }, () => false)).rejects.toThrow();
    });
});
