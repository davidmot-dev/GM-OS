import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { construireLaSauvegarde, SessionService } from '../../store/SessionService';
import { useModulesDuJeuMJ, importerLesModules } from './magasins';
import { validateSession } from '../../types/schemas';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { nexusService } from '../system/archive/NexusService';
import { creerEtat } from '../../../outils/alien/modules/muthur/moteur.mjs';
import type { SauvegardeDesModules, PontDesModules } from './protocole';
import { creerEtat as creerLcars } from '../../../outils/star-trek/lcars/natif.mjs';

const original = window.appBridge;
const sauvegarde: SauvegardeDesModules = { version: 1, campagnes: { 'camp-a': { 'alien-muthur': { versionDonnees: 4, donnees: creerEtat() } }, 'camp-b': { futur: { versionDonnees: 9, donnees: { code: 'GARDER' } } } } };
beforeEach(() => { useModulesDuJeuMJ.setState({ vue: null, sauvegarde: undefined, erreur: null }); });
afterEach(() => { window.appBridge = original; useModulesDuJeuMJ.setState({ sauvegarde: undefined, vue: null }); });
describe('les modules privés dans les sauvegardes et archives', () => {
    it('inclut LCARS dans le fichier complet et l’archive ciblée, séparé du flux public', () => {
        const lcars = { versionDonnees: 2, donnees: creerLcars() };
        lcars.donnees.situation = 'PRÉPARATION PRIVÉE LCARS';
        useModulesDuJeuMJ.setState({ sauvegarde: { version: 1, campagnes: { 'camp-a': { 'star-trek-lcars': lcars } } } });
        useSessionOSStore.setState({ campaigns: [{ id: 'camp-a', name: 'Démo', system: 'star-trek', activeLocationIds: [] }] });
        expect(validateSession(construireLaSauvegarde()).modules.modulesDuJeu?.campagnes['camp-a']['star-trek-lcars']).toEqual(lcars);
        const archive = nexusService.scrapeCampaignData('camp-a');
        expect(archive.modulesDuJeu?.['star-trek-lcars']).toEqual(lcars);
        expect(archive.campaign).not.toHaveProperty('modulesDuJeu');
    });
    it('n’ajoute aucun défaut à une ancienne sauvegarde', () => {
        expect(construireLaSauvegarde().modules).not.toHaveProperty('modulesDuJeu');
        expect(validateSession({ modules: {} }).modules).not.toHaveProperty('modulesDuJeu');
    });
    it('inclut les instances versionnées dans le fichier complet, séparées des campagnes partagées', () => {
        useModulesDuJeuMJ.setState({ sauvegarde });
        const fichier = validateSession(construireLaSauvegarde());
        expect(fichier.modules.modulesDuJeu).toEqual(sauvegarde);
        expect(fichier.modules.sessionOS).not.toHaveProperty('modulesDuJeu');
    });
    it('un refus du stockage privé bloque la restauration avant toute mutation de campagne', async () => {
        const importer = vi.fn(async () => ({ ok: false as const, erreur: 'Disque indisponible' }));
        window.appBridge = { ...original, modulesDuJeu: { importer } as unknown as PontDesModules } as Window['appBridge'];
        const avant = useSessionOSStore.getState().campaigns;
        await expect(SessionService.distributeData(validateSession({ modules: { modulesDuJeu: sauvegarde, sessionOS: { campaigns: [] } } }))).rejects.toThrow(/Disque/);
        expect(useSessionOSStore.getState().campaigns).toBe(avant);
    });
    it('restaure via le seul pont MJ et actualise le miroir de sauvegarde', async () => {
        const importer = vi.fn(async () => ({ ok: true as const }));
        window.appBridge = { ...original, modulesDuJeu: { importer, lire: async () => ({ campagneId: 'camp-a', contexte: 2, revision: 3, modules: [], sauvegarde }) } as unknown as PontDesModules } as Window['appBridge'];
        await importerLesModules(sauvegarde);
        expect(importer).toHaveBeenCalledWith(sauvegarde);
        expect(useModulesDuJeuMJ.getState().sauvegarde).toEqual(sauvegarde);
    });
    it('refuse un format invalide sans fabriquer une préparation vide', () => {
        expect(() => validateSession({ modules: { modulesDuJeu: { version: 999, campagnes: {} } } })).toThrow();
        expect(() => validateSession({ modules: { modulesDuJeu: { version: 1, campagnes: { toString: {} } } } })).toThrow();
    });
    it('exporte seulement les instances de la campagne, sans les traiter comme des médias', () => {
        useModulesDuJeuMJ.setState({ sauvegarde });
        useSessionOSStore.setState({ campaigns: [{ id: 'camp-a', name: 'Démo', system: 'alien', activeLocationIds: [] }] });
        const archive = nexusService.scrapeCampaignData('camp-a');
        expect(archive.modulesDuJeu).toEqual(sauvegarde.campagnes['camp-a']);
        expect(JSON.stringify(archive.modulesDuJeu)).not.toContain('GARDER');
        expect(archive.campaign).not.toHaveProperty('modulesDuJeu');
        const moduleAvecUrl = { versionDonnees: 99, donnees: { code: 'https://example.com/secret' } };
        archive.modulesDuJeu = { futur: moduleAvecUrl };
        expect(nexusService.scanForRemoteUrls(archive)).not.toContain('https://example.com/secret');
        const clone = nexusService.applyResolutionToState(archive, { strategy: 'clone' });
        expect(clone.campaign.id).not.toBe(archive.campaign.id);
        expect(clone.modulesDuJeu).toEqual(archive.modulesDuJeu);
    });
});
