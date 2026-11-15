import { describe, expect, it, vi } from 'vitest';
import * as radar from '../../outils/alien/modules/detecteur/moteur.mjs';
import v4 from './fixtures/detecteur-v4.json';
import { ServiceDesModules } from './service';
import { APPAREIL_DE_TABLE, type ContexteDesModules } from '../../src/modules/modulesDuJeu/protocole';

/**
 * **L'appareil de table** (Fire HD 8, registre § 256, T9). Décisions de David du 15/11/2026 : le M314
 * d'abord (Q7) ; la table l'oriente si le meneur la désigne (Q8). Les autres modules ne la voient pas.
 * Tout passe par le vrai service et le vrai moteur du détecteur.
 */
const TABLE = APPAREIL_DE_TABLE.id;
const personnages = [{ id: 'alice', nom: 'Alice' }, { id: 'bob', nom: 'Bob' }];
const contexte: ContexteDesModules = { campagneId: 'camp', seanceId: 's', pilote: { id: 'alien', name: 'Alien' }, personnages };
const mj = { role: 'mj' as const, appareilId: 'poste-mj' };
const fire = { role: 'joueur' as const, personnageId: TABLE, appareilId: 'fire' };

/** Un M314 en mode discret, avec un porteur sur le plan : prêt à être orienté. */
function radarPret() {
    const agir = (e: radar.EtatDetecteur, id: string, charge: unknown) =>
        radar.appliquerCommande(e, { id, charge } as radar.CommandeDetecteur, { role: 'mj' }, { personnages });
    // `tour-discret` reçoit le tour en cours et passe au suivant : on est au Tour 3.
    return agir(radar.migrerEtat(v4, 4), 'tour-discret', { tour: 2 });
}

async function preparer() {
    let disque: unknown = null;
    const stockage = { lire: async () => disque, ecrire: vi.fn(async (v: unknown) => { disque = structuredClone(v); }) };
    const service = new ServiceDesModules(stockage, vi.fn());
    await service.changerContexte(contexte);
    await service.importer({ version: 1, campagnes: { camp: { 'alien-detecteur': { versionDonnees: 5, donnees: radarPret() } } } });
    const c = async () => (await service.vueMJ()).contexte;
    const autoriser = async (moduleId: string, lecteurs: string[]) => service.autoriser({ campagneId: 'camp', moduleId, contexte: await c(), personnages: lecteurs });
    const commander = async (id: string, charge: unknown, lecteur: typeof mj | typeof fire) =>
        service.commander({ requeteId: 'r', campagneId: 'camp', moduleId: 'alien-detecteur', contexte: await c(), commande: { id, charge } }, lecteur);
    return { service, autoriser, commander };
}

describe("l'appareil de table", () => {
    it('ne voit rien tant que le meneur ne lui ouvre pas un module', async () => {
        const { service } = await preparer();
        expect((await service.vueJoueur(TABLE, 'fire')).modules).toEqual([]);
    });

    it('le M314 le sert ; les autres modules d’Alien le refusent', async () => {
        const { service, autoriser } = await preparer();
        const modules = (await service.vueMJ()).modules;
        expect(modules.find(m => m.id === 'alien-detecteur')?.servirLaTable).toBe(true);
        expect(modules.filter(m => m.id !== 'alien-detecteur').every(m => !m.servirLaTable)).toBe(true);
        await expect(autoriser('alien-muthur', [TABLE])).rejects.toThrow();
        await autoriser('alien-detecteur', [TABLE]);
        const vue = await service.vueJoueur(TABLE, 'fire');
        expect(vue.modules.map(m => m.id)).toEqual(['alien-detecteur']);
    });

    it('propose « La table » au meneur parmi ceux qui orientent le M314', async () => {
        const { service } = await preparer();
        const detecteur = (await service.vueMJ()).modules.find(m => m.id === 'alien-detecteur')!;
        expect((detecteur.vue as { personnagesOrientables: unknown[] }).personnagesOrientables).toContainEqual({ id: TABLE, nom: 'La table' });
    });

    it('oriente le M314 quand le meneur la désigne, et pas avant', async () => {
        const { service, autoriser, commander } = await preparer();
        await autoriser('alien-detecteur', [TABLE]);
        await expect(commander('orienter-discret', { cap: 90, tour: 3 }, fire)).rejects.toThrow();
        await commander('attribuer-porteur', { personnageId: TABLE }, mj);
        await commander('orienter-discret', { cap: 90, tour: 3 }, fire);
        const etat = (await service.vueMJ()).sauvegarde!.campagnes.camp['alien-detecteur'].donnees as radar.EtatDetecteur;
        expect(etat.discret).toMatchObject({ cap: 90, joueurPorteurId: TABLE });
        expect((((await service.vueJoueur(TABLE, 'fire')).modules[0].vue) as { peutOrienter: boolean }).peutOrienter).toBe(true);
    });

    it('ne reçoit que les commandes ouvertes aux joueurs', async () => {
        const { autoriser, commander } = await preparer();
        await autoriser('alien-detecteur', [TABLE]);
        await expect(commander('scanner-discret', { tour: 3 }, fire)).rejects.toThrow();
        await expect(commander('attribuer-porteur', { personnageId: TABLE }, fire)).rejects.toThrow();
    });

    it('garde son accès quand la liste des personnages change, le perd au changement de séance', async () => {
        const { service, autoriser } = await preparer();
        await autoriser('alien-detecteur', [TABLE, 'alice']);
        await service.changerContexte({ ...contexte, personnages: [personnages[1]] });
        expect((await service.vueMJ()).modules.find(m => m.id === 'alien-detecteur')?.acces).toEqual([TABLE]);
        await service.changerContexte({ ...contexte, seanceId: 's2', personnages: [personnages[1]] });
        expect((await service.vueJoueur(TABLE, 'fire')).modules).toEqual([]);
    });

    it('refuse un personnage qui porterait l’identifiant de la table', async () => {
        const { service } = await preparer();
        await expect(service.changerContexte({ ...contexte, personnages: [...personnages, { id: TABLE, nom: 'Imposteur' }] }))
            .rejects.toThrow(/réservé/);
    });

    it('n’accepte aucun accusé d’écriture de fiche pour la table (C7)', async () => {
        const { service } = await preparer();
        await expect(service.acquitterFiche({ campagneId: 'camp', moduleId: 'alien-detecteur', contexte: (await service.vueMJ()).contexte,
            personnageId: TABLE, transactionId: 't1', appliquee: true, sortieForcee: false, detail: '' })).rejects.toThrow(/fiche/);
    });
});
