import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { lireLaCorrespondance, versLaFiche, SPECIALISATIONS_DE_DUNE, type CorrespondanceDeFiche } from '../src/modules/fiches/correspondanceDeFiche';
import { rapprocher } from '../src/modules/fiches/rapprochementDeLaFiche';
import { lireDune, CLE_DUNE } from '../src/modules/dice/systemes/duneRegles';
import { ecartsDuReflet, maisonDepuisLaFiche, typeDeMaison } from '../src/modules/modulesDuJeu/dune/maisonDeLaFiche';
import { creerConflitDune } from '../src/modules/dice/systemes/conflitsDeDune';

/**
 * **Les fiches PJ et Maison de Dune, raccordées** — 2026-10-25, à la demande de David
 * (« est-ce que tu peux les connecter comme il faut »). Sur les vraies tables du dépôt.
 */
const RACINE = path.resolve(__dirname, '..');
const lire = (fichier: string) => lireLaCorrespondance(fs.readFileSync(path.join(RACINE, 'docs/systems/dune/fiche', fichier), 'utf8'), fichier)!;
const PJ: CorrespondanceDeFiche = lire('correspondance.json');
const MAISON: CorrespondanceDeFiche = lire('correspondance-groupe.json');

describe('la fiche du personnage', () => {
    it('envoie les maximes du suivi et les spécialisations rangées par compétence', () => {
        const lot = versLaFiche({ sheetData: {
            char_name: 'Kara Molay', devotion: 7, combat: 6,
            [CLE_DUNE]: { ...lireDune({}), maximes: { devotion: 'Ma Maison avant tout', truth: '' } },
            specializations: 'Combat : Escrime\nCombat : Poignard\nMobilité : Pilotage\nRhétorique : Étiquette',
        } }, PJ);
        expect(lot).toMatchObject({
            'identity.name': 'Kara Molay', 'drives.duty.value': 7, 'skills.battle.value': 6,
            'drives.duty.statement': 'Ma Maison avant tout', 'drives.truth.statement': '',
            'skills.battle.focuses': 'Escrime, Poignard', 'skills.move.focuses': 'Pilotage',
            'skills.communicate.focuses': 'Étiquette', 'skills.understand.focuses': '',
        });
    });

    it('une maxime saisie sur la fiche va à son principe, sans effacer le reste du suivi', () => {
        const suivi = { ...lireDune({}), atouts: [{ id: 'a', nom: 'Krys', qualite: 1, tangible: true, permanent: true, usage: 'offensif', zone: '', neutralise: false }], maximes: { truth: 'La vérité libère' } };
        const r = rapprocher({ 'drives.duty.statement': 'Servir le Duc', 'drives.truth.statement': 'La vérité libère' },
            { sheetData: { [CLE_DUNE]: suivi } }, PJ);
        const ecrit = r.aEcrire[CLE_DUNE] as typeof suivi;
        expect(ecrit.maximes).toEqual({ truth: 'La vérité libère', devotion: 'Servir le Duc' });
        expect(ecrit.atouts).toEqual(suivi.atouts);
        expect(suivi.maximes).toEqual({ truth: 'La vérité libère' });
        expect(r.divergences).toEqual([]);
    });

    it('un PJ sans suivi reçoit un suivi partiel que le jeu complète', () => {
        const r = rapprocher({ 'drives.power.statement': "J'obtiens ce que je veux" }, { sheetData: {} }, PJ);
        const lu = lireDune(r.aEcrire);
        expect(lu.maximes).toEqual({ domination: "J'obtiens ce que je veux" });
        expect(lu.atouts).toEqual([]);
        expect(lu.version).toBe(1);
    });

    it('les spécialisations de la fiche reviennent une par ligne, sous leur compétence', () => {
        expect(SPECIALISATIONS_DE_DUNE.composer(['', 'Escrime, Poignard', '', 'Pilotage', ''])).toBe('Combat : Escrime\nCombat : Poignard\nMobilité : Pilotage');
        // L'identifiant du pilote vaut le libellé : une ligne achetée en progression (« mob : … ») se range aussi.
        expect(SPECIALISATIONS_DE_DUNE.decomposer('mob : Escalade\nrhetoric: Négociation\nSans compétence', 5))
            .toEqual(['Sans compétence', '', '', 'Escalade', 'Négociation']);
    });
});

describe('la fiche de la Maison, fiche de groupe', () => {
    const fiche = {
        'house.name': 'Molay', 'house.homeworld': 'Ix', 'house.type': 'Maison mineure', 'house.domains': 'Machines (primaire)',
        'house.roles.lord': 'Duc Ivo', 'house.roles.spymaster': 'Kara', 'house.enemies.0.name': 'Arcuri', 'house.enemies.0.type': 'Majeure', 'house.enemies.0.hatred': 'Rivalité',
    };

    it('garde chaque clé de la fiche sous son nom, et nomme la Maison par « house.name »', () => {
        expect(MAISON.champs.every(c => c.gmos === c.fiche)).toBe(true);
        expect(MAISON.champs.some(c => c.fiche === 'house.name')).toBe(true);
    });

    it('le module en tient le reflet : nom, monde, type, domaines, rôles, ennemis', () => {
        const reflet = maisonDepuisLaFiche(fiche)!;
        expect(reflet).toEqual({ nom: 'Molay', monde: 'Ix', type: 1, domaines: 'Machines (primaire)',
            roles: 'Seigneur : Duc Ivo · Maître espion : Kara', ennemis: 'Arcuri (Majeure, Rivalité)' });
        const maison = creerConflitDune().maison;
        expect(Object.keys(ecartsDuReflet(maison, reflet)).sort()).toEqual(['domaines', 'ennemis', 'monde', 'nom', 'roles']);
        expect(ecartsDuReflet({ ...maison, ...reflet }, reflet)).toEqual({});
        expect(maisonDepuisLaFiche({})).toBeNull();
    });

    it('lit le type de Maison du livre (p. 87)', () => {
        expect([typeDeMaison('Naissante'), typeDeMaison('mineure'), typeDeMaison('Majeure'), typeDeMaison('Grande Maison'), typeDeMaison('?')])
            .toEqual([0, 1, 2, 3, undefined]);
    });
});
