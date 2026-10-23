import { expect, it } from 'vitest';
import { ServiceDesModules } from './service';
import * as maman from '../../outils/alien/modules/muthur/moteur.mjs';
import * as radar from '../../outils/alien/modules/detecteur/moteur.mjs';
import type { CommandeDeModule, SauvegardeDesModules } from '../../src/modules/modulesDuJeu/protocole';
import type { EtatMuthur } from '../../outils/alien/modules/muthur/moteur.mjs';
import type { EtatDetecteur } from '../../outils/alien/modules/detecteur/moteur.mjs';

it('migre les campagnes existantes puis conserve dossiers, demandes et préréglages après redémarrage et export', async () => {
    const mj = { role: 'mj' as const, appareilId: 'poste' };
    const ancienTerminal = maman.appliquerCommande(maman.creerEtat(), { id: 'saisir', charge: { texte: '/M Question ancienne' } }, { role: 'joueur', personnageId: 'alice' });
    const ancienRadar = radar.creerEtat();
    const terminalV2 = JSON.parse(JSON.stringify(ancienTerminal)); terminalV2.version = 2; delete terminalV2.players.alice.requests; delete terminalV2.actes; delete terminalV2.prereglages;
    const radarV1 = JSON.parse(JSON.stringify(ancienRadar)); radarV1.version = 1; delete radarV1.prereglages; delete radarV1.discret;
    let disque: SauvegardeDesModules = { version: 1, campagnes: { campagne: {
        'alien-muthur': { versionDonnees: 2, donnees: terminalV2 },
        'alien-detecteur': { versionDonnees: 1, donnees: radarV1 },
    } } };
    const stockage = { lire: async () => structuredClone(disque), ecrire: async (v: SauvegardeDesModules) => { disque = structuredClone(v); } };
    const table = { campagneId: 'campagne', seanceId: 'seance', pilote: { id: 'alien', name: 'Alien' }, personnages: [{ id: 'alice', nom: 'Alice' }] };
    const service = new ServiceDesModules(stockage, () => {}); await service.changerContexte(table);
    const commander = async (moduleId: string, commande: CommandeDeModule) => service.commander({ requeteId: 'test', campagneId: 'campagne', contexte: (await service.vueMJ()).contexte, moduleId, commande }, mj);
    await commander('alien-muthur', { id: 'classer-dossiers', charge: { dossierIds: ['archive', 'ordre', 'navigation'] } });
    await commander('alien-muthur', { id: 'supprimer-dossier', charge: { dossierId: 'ordre' } });
    await commander('alien-muthur', { id: 'saisir', charge: { personnageId: 'alice', texte: '/M Question récente' } });
    await commander('alien-detecteur', { id: 'configurer', charge: { contacts: 8 } });
    await commander('alien-detecteur', { id: 'enregistrer-prereglage', charge: { prereglageId: 'alarme', nom: 'Alarme couloir' } });
    await commander('alien-detecteur', { id: 'scanner', charge: { actif: true } });
    const reprise = new ServiceDesModules(stockage, () => {}); await reprise.changerContexte(table);
    const sauvegarde = (await reprise.vueMJ()).sauvegarde!;
    expect(sauvegarde.campagnes.campagne['alien-muthur'].versionDonnees).toBe(5);
    const terminal = sauvegarde.campagnes.campagne['alien-muthur'].donnees as EtatMuthur;
    expect(terminal.documents.map(d => d.id)).toEqual(['archive', 'navigation']);
    expect(terminal.players.alice.requests.map(d => d.content)).toEqual(['Question ancienne', 'Question récente']);
    const detecteur = sauvegarde.campagnes.campagne['alien-detecteur'].donnees as EtatDetecteur;
    expect(detecteur.tracker.power).toBe(false); expect(detecteur.prereglages.find(p => p.id === 'alarme')!.reglages.contacts).toBe(8);
    expect((await reprise.vueJoueur('alice', 'tablette')).modules).toEqual([]);
    await reprise.importer(JSON.parse(JSON.stringify(sauvegarde)));
    expect((await reprise.vueMJ()).sauvegarde).toEqual(sauvegarde);
});
