import { describe, it, expect, vi } from 'vitest';
import { ServiceDesModules } from './service';
import { creerEtat } from '../../outils/alien/modules/muthur/moteur.mjs';
import type { VueMuthurMJ, VueMuthurJoueur } from '../../outils/alien/modules/muthur/moteur.mjs';
import type { ContexteDesModules, CommandeDeModule, SauvegardeDesModules } from '../../src/modules/modulesDuJeu/protocole';

const copier = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const contexte: ContexteDesModules = { campagneId: 'campagne-a', seanceId: 'seance-a', pilote: { id: 'custom-1', name: 'Alien' }, personnages: [{ id: 'alice', nom: 'Alice' }, { id: 'bob', nom: 'Bob' }] };
async function preparer(initial: unknown = null) {
    let disque = initial;
    const stockage = { lire: vi.fn(async () => copier(disque)), ecrire: vi.fn(async (v: unknown) => { disque = copier(v); }) };
    const service = new ServiceDesModules(stockage, vi.fn());
    await service.changerContexte(contexte);
    const autoriser = async (personnages: string[]) => service.autoriser({ campagneId: 'campagne-a', contexte: (await service.vueMJ()).contexte, moduleId: 'alien-muthur', personnages });
    const commander = async (commande: CommandeDeModule, personnageId?: string) => service.commander({ requeteId: 'r1', campagneId: 'campagne-a', contexte: (await service.vueMJ()).contexte, moduleId: 'alien-muthur', commande },
        personnageId ? { role: 'joueur', personnageId, appareilId: 'tablette-' + personnageId } : { role: 'mj', appareilId: 'poste-mj' });
    return { service, stockage, disque: () => disque, autoriser, commander };
}
describe('hôte privé des modules', () => {
    it('date chaque projection sans inscrire cette horloge dans la sauvegarde', async () => {
        const { service, disque } = await preparer();
        const temps = vi.spyOn(Date, 'now');
        try {
            temps.mockReturnValue(100_000);
            expect((await service.vueJoueur('alice', 'a')).instantServeur).toBe(100_000);
            temps.mockReturnValue(106_000);
            expect((await service.vueJoueur('alice', 'a')).instantServeur).toBe(106_000);
            expect(JSON.stringify(disque())).not.toContain('instantServeur');
        } finally { temps.mockRestore(); }
    });
    it('ne montre aucune carte sans ouverture explicite, même pour un ancien pilote Alien', async () => {
        const { service } = await preparer();
        expect((await service.vueMJ()).modules).toHaveLength(2);
        expect((await service.vueJoueur('alice', 'a')).modules).toEqual([]);
        expect((await service.vueJoueur(null, 'a')).modules).toEqual([]);
    });
    it('remet à chaque PJ seulement son dialogue et ses dossiers autorisés', async () => {
        const { service, autoriser, commander } = await preparer();
        await autoriser(['alice', 'bob']);
        await commander({ id: 'saisir', charge: { texte: 'Bonjour MÈRE' } }, 'alice');
        await commander({ id: 'repondre', charge: { personnageId: 'alice', texte: 'MESSAGE SECRET ALICE' } });
        const alice = await service.vueJoueur('alice', 'a'), bob = await service.vueJoueur('bob', 'b');
        expect(JSON.stringify(alice)).toContain('MESSAGE SECRET ALICE');
        expect(JSON.stringify(bob)).not.toContain('MESSAGE SECRET ALICE');
        expect(JSON.stringify(alice)).not.toContain('adminPassword');
        expect(JSON.stringify(alice)).not.toContain('protocoles');
        expect((alice.modules[0].vue as VueMuthurJoueur).player.id).toBe('alice');
    });
    it('refuse commandes MJ, autre PJ, module non autorisé et autre campagne', async () => {
        const { service, autoriser, commander } = await preparer();
        await autoriser(['alice']);
        await expect(commander({ id: 'configurer', charge: { motDePasse: 'PIRATE' } }, 'alice')).rejects.toThrow();
        await expect(commander({ id: 'saisir', charge: { texte: 'HELP', personnageId: 'bob' } }, 'alice')).rejects.toThrow();
        await expect(commander({ id: 'saisir', charge: { texte: 'HELP' } }, 'bob')).rejects.toThrow();
        await expect(service.commander({ requeteId: 'x', campagneId: 'autre', moduleId: 'alien-muthur', contexte: (await service.vueMJ()).contexte, commande: { id: 'saisir', charge: { texte: 'HELP' } } }, { role: 'joueur', personnageId: 'alice', appareilId: 'a' })).rejects.toThrow();
    });
    it('retirer un accès ferme la carte et refuse une commande de son ancien contexte', async () => {
        const { service, autoriser } = await preparer();
        await autoriser(['alice']);
        const ancienne = await service.vueMJ();
        await autoriser([]);
        expect((await service.vueJoueur('alice', 'a')).modules).toEqual([]);
        await expect(service.commander({ requeteId: 'ancien', campagneId: 'campagne-a', contexte: ancienne.contexte, moduleId: 'alien-muthur', commande: { id: 'saisir', charge: { texte: 'HELP' } } }, { role: 'joueur', personnageId: 'alice', appareilId: 'a' })).rejects.toThrow();
    });
    it.each(['seance', 'campagne', 'pilote'])('ferme les accès et arrête les effets au changement de %s', async type => {
        const { service, autoriser, commander } = await preparer();
        await autoriser(['alice']);
        await commander({ id: 'compte-a-rebours', charge: { minutes: 10 } });
        const suivant = { ...contexte, ...(type === 'seance' ? { seanceId: null } : type === 'campagne' ? { campagneId: 'campagne-b' } : { pilote: { ...contexte.pilote!, modulesDuJeu: [] } }) };
        await service.changerContexte(suivant);
        expect((await service.vueJoueur('alice', 'a')).modules).toEqual([]);
        await service.changerContexte(contexte);
        expect(((await service.vueMJ()).modules[0].vue as VueMuthurMJ).countdown).toBeNull();
    });
    it('ne permet pas d’ouvrir un accès hors séance ni vers un PJ absent de la campagne', async () => {
        const { service, autoriser } = await preparer();
        await expect(autoriser(['etranger'])).rejects.toThrow();
        await service.changerContexte({ ...contexte, seanceId: null });
        await expect(autoriser(['alice'])).rejects.toThrow(/séance/);
    });
    it('un redémarrage conserve les codes et dialogues, ferme les droits et arrête les effets', async () => {
        const { service, autoriser, commander, disque } = await preparer();
        await autoriser(['alice']);
        await commander({ id: 'configurer', charge: { motDePasse: '0042' } });
        await commander({ id: 'compte-a-rebours', charge: { minutes: 10 } });
        const reprise = await preparer(disque());
        const mj = (await reprise.service.vueMJ()).modules[0].vue as VueMuthurMJ;
        expect(mj.config.adminPassword).toBe('0042'); expect(mj.countdown).toBeNull();
        expect(mj.diffusionAlarme).toBeNull();
        expect((await reprise.service.vueJoueur('alice', 'a')).modules).toEqual([]);
        expect((await service.vueMJ()).modules[0].acces).toEqual(['alice']);
    });
    it('une écriture échouée garde les données précédentes et n’accorde aucun nouveau droit', async () => {
        const { service, stockage, autoriser, commander, disque } = await preparer();
        await commander({ id: 'configurer', charge: { motDePasse: 'AVANT' } });
        const avant = copier(disque());
        stockage.ecrire.mockRejectedValueOnce(new Error('Disque plein'));
        await expect(commander({ id: 'configurer', charge: { motDePasse: 'APRES' } })).rejects.toThrow(/précédentes/);
        expect(disque()).toEqual(avant);
        expect((await service.vueMJ()).erreur).toMatch(/Écriture/);
        expect(((await service.vueMJ()).modules[0].vue as VueMuthurMJ).config.adminPassword).toBe('AVANT');
        stockage.ecrire.mockRejectedValueOnce(new Error('Disque plein'));
        await expect(autoriser(['alice'])).rejects.toThrow();
        expect((await service.vueJoueur('alice', 'a')).modules).toEqual([]);
    });
    it('une écriture réussie permet de reprendre après un disque temporairement indisponible', async () => {
        const { service, stockage, commander } = await preparer();
        stockage.ecrire.mockRejectedValueOnce(new Error('Disque plein'));
        await expect(commander({ id: 'configurer', charge: { motDePasse: 'NOUVEAU' } })).rejects.toThrow();
        expect((await service.vueMJ()).erreur).toMatch(/Écriture/);
        await commander({ id: 'configurer', charge: { motDePasse: 'NOUVEAU' } });
        expect((await service.vueMJ()).erreur).toBeUndefined();
    });
    it('un retrait coupe les droits même lorsque sa sauvegarde échoue', async () => {
        const { service, stockage, autoriser } = await preparer();
        await autoriser(['alice']);
        stockage.ecrire.mockRejectedValueOnce(new Error('Disque plein'));
        await expect(autoriser([])).rejects.toThrow();
        expect((await service.vueJoueur('alice', 'a')).modules).toEqual([]);
    });
    it('conserve un fichier illisible sans écriture ni retour silencieux aux exemples', async () => {
        const { service, stockage, commander } = await preparer({ version: 999 });
        expect((await service.vueMJ()).erreur).toMatch(/illisible/);
        expect((await service.vueMJ()).sauvegarde).toBeUndefined();
        await expect(commander({ id: 'configurer', charge: { motDePasse: 'X' } })).rejects.toThrow();
        expect(stockage.ecrire).not.toHaveBeenCalled();
    });
    it('conserve les modules inconnus et les autres campagnes lors d’un import', async () => {
        const original: SauvegardeDesModules = { version: 1, campagnes: { 'campagne-b': { 'module-futur': { versionDonnees: 12, donnees: { texte: 'CONSERVER' } } } } };
        const { service, autoriser } = await preparer(original);
        await autoriser(['alice']);
        await service.importer({ version: 1, campagnes: { 'campagne-a': { 'alien-muthur': { versionDonnees: 4, donnees: creerEtat() } } } });
        expect((await service.vueMJ()).sauvegarde?.campagnes['campagne-b']).toEqual(original.campagnes['campagne-b']);
        expect((await service.vueJoueur('alice', 'a')).modules).toEqual([]);
    });
    it('refuse un import corrompu sans toucher aux données ni aux accès existants', async () => {
        const { service, autoriser } = await preparer();
        await autoriser(['alice']);
        const avant = await service.vueMJ();
        await expect(service.importer({ version: 1, campagnes: { 'campagne-a': { 'alien-muthur': { versionDonnees: 2, donnees: {} } } } })).rejects.toThrow();
        expect(await service.vueMJ()).toEqual(avant);
    });
    it('la diffusion vise un seul appareil autorisé et se transfère sans relancer l’alerte', async () => {
        const { service, autoriser } = await preparer();
        await autoriser(['alice', 'bob']);
        const demande = { campagneId: 'campagne-a', moduleId: 'alien-muthur', contexte: (await service.vueMJ()).contexte };
        await service.choisirDiffusion(demande, { id: 'a', personnageId: 'alice' });
        expect(((await service.vueJoueur('alice', 'a')).modules[0].vue as VueMuthurJoueur).diffusionAutorisee).toBe(true);
        expect(((await service.vueJoueur('bob', 'b')).modules[0].vue as VueMuthurJoueur).diffusionAutorisee).toBe(false);
        await service.choisirDiffusion(demande, { id: 'b', personnageId: 'bob' });
        expect(((await service.vueJoueur('alice', 'a')).modules[0].vue as VueMuthurJoueur).diffusionAutorisee).toBe(false);
        await expect(service.choisirDiffusion(demande, { id: 'inconnu', personnageId: 'etranger' })).rejects.toThrow();
    });
});
