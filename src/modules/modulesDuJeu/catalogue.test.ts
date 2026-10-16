import { describe, it, expect } from 'vitest';
import { modulesDuPilote, validerLesReferences } from './catalogue';
import { SessionOSModuleSchema } from '../../types/schemas';
import { enrichirLePilote } from '../forge/rules/enrichirLePilote';
import { controlerLePilote } from '../forge/rules/controlesDuPilote';
import type { GameDriver } from '../../types/drivers';

const alien = { id: 'custom-123456', name: 'ALIEN, le jeu de rôle' };

describe('modules du pilote', () => {
    it('propose LCARS seulement sur référence explicite et corpus Star Trek, y compris personnalisé', () => {
        const pilote = { id: 'custom-sta', name: 'Mon vaisseau', corpusId: 'star-trek' };
        expect(modulesDuPilote(pilote).modules).toEqual([]);
        expect(modulesDuPilote({ ...pilote, modulesDuJeu: [] }).modules).toEqual([]);
        expect(modulesDuPilote({ ...pilote, modulesDuJeu: [{ id: 'star-trek-lcars' }] }).modules[0].disponibilite).toBe('pret');
        expect(modulesDuPilote({ id: 'alien', name: 'Alien', modulesDuJeu: [{ id: 'star-trek-lcars' }] }).modules[0].disponibilite).toBe('incompatible');
        expect(SessionOSModuleSchema.parse({ customGameDrivers: [{ ...pilote, modulesDuJeu: [{ id: 'star-trek-lcars' }] }] }).customGameDrivers?.[0].modulesDuJeu).toEqual([{ id: 'star-trek-lcars' }]);
    });
    it('retrouve Alien derrière un identifiant de pilote forgé', () => {
        const resultat = modulesDuPilote(alien);
        expect(resultat.corpusId).toBe('alien');
        expect(resultat.implicite).toBe(true);
        expect(resultat.references.map(r => r.id)).toEqual(['alien-muthur', 'alien-detecteur']);
        expect(resultat.modules.map(m => m.disponibilite)).toEqual(['pret', 'pret']);
    });
    it('respecte une désactivation explicite', () => {
        expect(modulesDuPilote({ ...alien, modulesDuJeu: [] }).references).toEqual([]);
        expect(modulesDuPilote({ ...alien, modulesDuJeu: [] }).implicite).toBe(false);
    });
    it('résout le corpus explicite et le chemin de campagne avant le nom', () => {
        expect(modulesDuPilote({ ...alien, corpusId: 'dune' }).references).toEqual([]);
        expect(modulesDuPilote({ ...alien, corpusId: 'alien' }, 'systems/dune').references).toEqual([]);
        expect(modulesDuPilote({ id: 'custom-2', name: 'Mon jeu', ragPath: 'systems/alien' }).references).toHaveLength(2);
    });
    it('ne propose rien aux autres anciens pilotes ni sans pilote', () => {
        expect(modulesDuPilote({ id: 'dune', name: 'Dune' }).references).toEqual([]);
        expect(modulesDuPilote(null).references).toEqual([]);
    });
    it('préserve le libellé et les modules inconnus sans les rendre disponibles', () => {
        const refs = [{ id: 'futur-module', libelle: 'Mon outil' }, { id: 'alien-muthur', libelle: 'MÈRE' }];
        const resultat = modulesDuPilote({ ...alien, modulesDuJeu: refs });
        expect(resultat.references).toEqual(refs);
        expect(resultat.modules.map(m => [m.libelle, m.disponibilite])).toEqual([['Mon outil', 'inconnu'], ['MÈRE', 'pret']]);
    });
    it('signale une référence incompatible sans la supprimer', () => {
        const resultat = modulesDuPilote({ id: 'dune', name: 'Dune', modulesDuJeu: [{ id: 'alien-muthur' }] });
        expect(resultat.references).toHaveLength(1);
        expect(resultat.modules[0].disponibilite).toBe('incompatible');
    });
    it.each([null, [{ id: 'alien-muthur', code: 'SECRET' }], [{ id: 'https://example.com/x.js' }], [{ id: 'a' }, { id: 'a' }]].map(refs => ({ refs })))('refuse une déclaration malformée : $refs', ({ refs }) => {
        expect(validerLesReferences(refs).length).toBeGreaterThan(0);
        expect(modulesDuPilote({ ...alien, modulesDuJeu: refs as GameDriver['modulesDuJeu'] }).references).toEqual([]);
    });
});

describe('conservation du choix', () => {
    it('ne fabrique ni pilotes ni sélection en relisant une vieille sauvegarde', () => {
        expect(SessionOSModuleSchema.parse({})).not.toHaveProperty('customGameDrivers');
        const lu = SessionOSModuleSchema.parse({ customGameDrivers: [alien] });
        expect(lu.customGameDrivers?.[0]).toEqual(alien);
        expect(lu.customGameDrivers?.[0]).not.toHaveProperty('modulesDuJeu');
    });
    it.each([[], [{ id: 'futur-module', libelle: 'Outil conservé' }]].map(modulesDuJeu => ({ modulesDuJeu })))('conserve une sélection $modulesDuJeu à la restauration', ({ modulesDuJeu }) => {
        const pilote = { ...alien, modulesDuJeu, autreChamp: { intact: true } };
        expect(SessionOSModuleSchema.parse({ customGameDrivers: [pilote] }).customGameDrivers).toEqual([pilote]);
    });
    it('refuse une sauvegarde qui cacherait des paramètres privés dans une référence', () => {
        expect(() => SessionOSModuleSchema.parse({ customGameDrivers: [{ ...alien, modulesDuJeu: [{ id: 'alien-muthur', config: { code: 'SECRET' } }] }] })).toThrow();
    });
    it('la Forge conserve un refus de modules même face à une dérivation', () => {
        const driver = { ...alien, modulesDuJeu: [] } as unknown as GameDriver;
        const resultat = enrichirLePilote({ driver }, { driver: { modulesDuJeu: [{ id: 'alien-muthur' }] } });
        expect(resultat.driver.modulesDuJeu).toEqual([]);
        expect(resultat.journal.conserves).toContain('modulesDuJeu');
    });
    it('la Forge peut compléter un pilote sans déclaration par un choix vide', () => {
        const resultat = enrichirLePilote({ driver: alien as GameDriver }, { driver: { modulesDuJeu: [] } });
        expect(resultat.driver.modulesDuJeu).toEqual([]);
        expect(resultat.journal.remplis).toContain('modulesDuJeu');
    });
    it('les contrôles de la Forge distinguent erreur de format et module absent', () => {
        const inconnus = controlerLePilote({ ...alien, modulesDuJeu: [{ id: 'futur-module' }] }, {});
        expect(inconnus.filter(c => c.ou === 'modulesDuJeu').map(c => c.gravite)).toEqual(['avertissement']);
        const invalides = controlerLePilote({ ...alien, modulesDuJeu: null } as unknown as GameDriver, {});
        expect(invalides.filter(c => c.ou === 'modulesDuJeu').map(c => c.gravite)).toEqual(['erreur']);
    });
});
