import { describe, it, expect, vi } from 'vitest';
import { ServiceDesModules } from './service';
import type { EtatDetecteur } from '../../outils/alien/modules/detecteur/moteur.mjs';
import type { VueMuthurMJ } from '../../outils/alien/modules/muthur/moteur.mjs';
import type { ContexteDesModules, CommandeDeModule } from '../../src/modules/modulesDuJeu/protocole';
const contexte: ContexteDesModules = { campagneId: 'camp', seanceId: 'seance', pilote: { id: 'custom-alien', name: 'Alien' }, personnages: [{ id: 'alice', nom: 'Alice' }, { id: 'bob', nom: 'Bob' }] };
async function preparer(initial: unknown = null) {
    let disque = initial;
    const stockage = { lire: async () => disque, ecrire: vi.fn(async (v: unknown) => { disque = structuredClone(v); }) };
    const service = new ServiceDesModules(stockage, vi.fn()); await service.changerContexte(contexte);
    const demande = async () => ({ campagneId: 'camp', contexte: (await service.vueMJ()).contexte });
    const autoriser = async (moduleId: string, personnages: string[]) => service.autoriser({ ...await demande(), moduleId, personnages });
    const commander = async (commande: CommandeDeModule, moduleId = 'alien-detecteur', joueur?: string) => service.commander({ ...await demande(), requeteId: 'r', moduleId, commande }, joueur ? { role: 'joueur', personnageId: joueur, appareilId: joueur } : { role: 'mj', appareilId: 'poste-mj' });
    const radar = async () => (await service.vueMJ()).modules.find(m => m.id === 'alien-detecteur')!.vue as EtatDetecteur;
    return { service, demande, autoriser, commander, radar, stockage, disque: () => disque };
}
describe('détecteur dans l’hôte commun', () => {
    it('autorise les instruments séparément et le même scan à plusieurs PJ', async () => {
        const { service, autoriser, commander } = await preparer();
        await autoriser('alien-muthur', ['alice']); await autoriser('alien-detecteur', ['bob']);
        await commander({ id: 'scanner', charge: { actif: true } });
        expect((await service.vueJoueur('alice', 'a')).modules.map(m => m.id)).toEqual(['alien-muthur']);
        expect((await service.vueJoueur('bob', 'b')).modules.map(m => m.id)).toEqual(['alien-detecteur']);
        await autoriser('alien-detecteur', ['alice', 'bob']);
        const alice = (await service.vueJoueur('alice', 'a')).modules.find(m => m.id === 'alien-detecteur')!;
        const bob = (await service.vueJoueur('bob', 'b')).modules[0];
        expect(alice.vue).toEqual(bob.vue);
        expect(JSON.stringify(bob)).not.toMatch(/documents|players|adminPassword|protocoles/);
        await expect(commander({ id: 'scanner', charge: { actif: false } }, 'alien-detecteur', 'bob')).rejects.toThrow();
    });
    it('retirer un PJ laisse le scan aux autres ; le dernier retrait le coupe', async () => {
        const { service, autoriser, commander, radar } = await preparer();
        await autoriser('alien-detecteur', ['alice', 'bob']); await commander({ id: 'scanner', charge: { actif: true } });
        const ouvertureBob = (await service.vueJoueur('bob', 'b')).modules[0].ouverture;
        const ancienne = await service.vueMJ(); await autoriser('alien-detecteur', ['bob']);
        expect((await service.vueJoueur('alice', 'a')).modules).toEqual([]);
        expect((await radar()).tracker.power).toBe(true);
        expect((await service.vueJoueur('bob', 'b')).modules[0].ouverture).toBe(ouvertureBob);
        await expect(service.commander({ campagneId: 'camp', contexte: ancienne.contexte, requeteId: 'ancien', moduleId: 'alien-detecteur', commande: { id: 'scanner', charge: { actif: true } } }, { role: 'mj', appareilId: 'poste-mj' })).rejects.toThrow();
        await autoriser('alien-detecteur', []); expect((await radar()).tracker.power).toBe(false);
        await autoriser('alien-detecteur', ['bob']);
        expect((await service.vueJoueur('bob', 'b')).modules[0].ouverture).not.toBe(ouvertureBob);
    });
    it.each(['seance', 'campagne', 'pilote'])('coupe le radar et ses droits au changement de %s', async changement => {
        const { service, autoriser, commander, radar } = await preparer();
        await autoriser('alien-detecteur', ['alice']); await commander({ id: 'scanner', charge: { actif: true } }); await commander({ id: 'faux-echo', charge: {} });
        await service.changerContexte({ ...contexte, ...(changement === 'seance' ? { seanceId: null } : changement === 'campagne' ? { campagneId: 'autre' } : { pilote: { ...contexte.pilote!, modulesDuJeu: [{ id: 'alien-muthur' }] } }) });
        await service.changerContexte(contexte);
        expect((await radar()).tracker.power).toBe(false); expect((await radar()).tracker.anomalyUntil).toBe(0);
        expect((await service.vueJoueur('alice', 'a')).modules).toEqual([]);
    });
    it('sauvegarde les réglages ; reprise et import arrêtent les effets et ferment les droits', async () => {
        const { service, autoriser, commander, disque } = await preparer();
        await autoriser('alien-detecteur', ['alice']); await commander({ id: 'configurer', charge: { contacts: 8, proximite: 75 } }); await commander({ id: 'scanner', charge: { actif: true } });
        const reprise = await preparer(disque());
        expect((await reprise.radar()).tracker).toMatchObject({ power: false, contacts: 8, proximity: 75 });
        expect((await reprise.service.vueJoueur('alice', 'a')).modules).toEqual([]);
        await service.importer((await service.vueMJ()).sauvegarde!);
        expect((await service.vueJoueur('alice', 'a')).modules).toEqual([]);
        expect(((await service.vueMJ()).modules[1].vue as EtatDetecteur).tracker.power).toBe(false);
    });
    it('importer une autre campagne ferme aussi les effets de la table courante sans perdre ses réglages', async () => {
        const { service, autoriser, commander, radar } = await preparer();
        await autoriser('alien-detecteur', ['alice']);
        await commander({ id: 'configurer', charge: { contacts: 6 } });
        await commander({ id: 'scanner', charge: { actif: true } });
        await service.importer({ version: 1, campagnes: { autre: {} } });
        expect((await radar()).tracker).toMatchObject({ power: false, contacts: 6, anomalyUntil: 0 });
        expect((await service.vueJoueur('alice', 'a')).modules).toEqual([]);
    });
    it.each(['tous', 'detecteur'])('coupe les effets en mémoire même si le disque échoue : %s', async cible => {
        const { service, autoriser, commander, radar, stockage, demande } = await preparer();
        await autoriser('alien-muthur', ['alice']); await autoriser('alien-detecteur', ['bob']);
        await commander({ id: 'compte-a-rebours', charge: { minutes: 10 } }, 'alien-muthur');
        await commander({ id: 'scanner', charge: { actif: true } }); await commander({ id: 'faux-echo', charge: {} });
        stockage.ecrire.mockRejectedValueOnce(new Error('Disque plein'));
        await expect(cible === 'tous' ? service.toutCouper(await demande()) : autoriser('alien-detecteur', [])).rejects.toThrow();
        expect((await radar()).tracker).toMatchObject({ power: false, anomalyUntil: 0 });
        expect((await service.vueJoueur('bob', 'b')).modules).toEqual([]);
        if (cible === 'tous') {
            expect((await service.vueJoueur('alice', 'a')).modules).toEqual([]);
            expect(((await service.vueMJ()).modules[0].vue as VueMuthurMJ).countdown).toBeNull();
        } else expect((await service.vueJoueur('alice', 'a')).modules.map(m => m.id)).toEqual(['alien-muthur']);
        expect((await service.vueMJ()).erreur).toMatch(/Écriture/);
    });
});
