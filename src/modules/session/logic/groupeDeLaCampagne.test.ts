import { describe, it, expect } from 'vitest';
import {
    GROUPE_VIERGE, idDuGroupe, nomDuGroupe, groupePourLHote, appliquerAuGroupe, lierLeGroupe,
} from './groupeDeLaCampagne';
import { rapprocher } from '../../fiches/rapprochementDeLaFiche';
import { versLaFiche, cheminDeLaCorrespondance, type CorrespondanceDeFiche } from '../../fiches/correspondanceDeFiche';

/**
 * La Cabale de NOC — `docs/systems/noc/fiche/correspondance-groupe.json`, dont
 * on reprend ici la forme : chaque clé de la fiche garde son nom côté GM-OS.
 */
const CABALE: CorrespondanceDeFiche = {
    version: 1,
    gabaritDeLaFiche: 'noc-cabale',
    champs: [
        { gmos: 'identity.name', fiche: 'identity.name' },
        { gmos: 'domains.action', fiche: 'domains.action' },
        { gmos: 'assets.action.armory', fiche: 'assets.action.armory' },
        { gmos: 'tracks.espoir', fiche: 'tracks.espoir' },
    ],
    absents: [{ fiche: 'identity.symbol', pourquoi: 'image' }],
};

describe('le nom du groupe — celui que sa fiche porte', () => {
    it('sans fiche remplie, le mot du jeu', () => {
        expect(nomDuGroupe(undefined, CABALE, 'Cabale')).toBe('Cabale');
        expect(nomDuGroupe({ sheetData: { 'identity.name': '  ' } }, CABALE, 'Cabale')).toBe('Cabale');
    });

    it('le Nom écrit sur la feuille, quand il y en a un', () => {
        expect(nomDuGroupe({ sheetData: { 'identity.name': ' Rue Krev ' } }, CABALE, 'Cabale')).toBe('Rue Krev');
    });

    it('sans table, on ne devine pas où est le nom', () => {
        expect(nomDuGroupe({ sheetData: { 'identity.name': 'Rue Krev' } }, null, 'Cabale')).toBe('Cabale');
    });

    it('la Maison de Dune porte le sien sur « house.name » (2026-10-25)', () => {
        const maison: CorrespondanceDeFiche = { version: 1, gabaritDeLaFiche: 'dune-maison-fr', champs: [{ gmos: 'house.name', fiche: 'house.name' }] };
        expect(nomDuGroupe({ sheetData: { 'house.name': 'Molay' } }, maison, 'Maison')).toBe('Molay');
        expect(nomDuGroupe({ sheetData: {} }, maison, 'Maison')).toBe('Maison');
    });
});

describe('ce que l’hôte des fiches reçoit', () => {
    it('une identité distincte de tout personnage, et les valeurs de la campagne', () => {
        const hote = groupePourLHote({ id: 'c1' }, { ficheId: 'f9', sheetData: { 'domains.action': 2 }, donneesModifieesLe: 5 }, 'Rue Krev');
        expect(hote).toEqual({
            id: idDuGroupe('c1'),
            name: 'Rue Krev',
            ficheId: 'f9',
            donneesModifieesLe: 5,
            sheetData: { 'domains.action': 2 },
        });
        expect(hote.id).toBe('groupe:c1');
    });

    it('une campagne qui n’a pas encore de groupe en reçoit un vierge', () => {
        expect(groupePourLHote({ id: 'c1' }, undefined, 'Cabale').sheetData).toEqual(GROUPE_VIERGE.sheetData);
    });
});

describe('la fiche fait foi — ses valeurs redescendent sur la campagne', () => {
    it('ce que la fiche impose s’ajoute, et l’horodatage suit', () => {
        const apres = appliquerAuGroupe(
            { ficheId: 'f9', sheetData: { 'domains.action': 1, 'tracks.espoir': 4 } },
            { aEcrire: { 'domains.action': 2 } },
            1234,
        );
        expect(apres).toEqual({
            ficheId: 'f9',
            sheetData: { 'domains.action': 2, 'tracks.espoir': 4 },
            donneesModifieesLe: 1234,
        });
    });

    it('lier garde les valeurs déjà connues', () => {
        expect(lierLeGroupe({ sheetData: { 'tracks.espoir': 3 } }, 'f1')).toEqual({ ficheId: 'f1', sheetData: { 'tracks.espoir': 3 } });
        expect(lierLeGroupe(undefined, 'f1')).toEqual({ ficheId: 'f1', sheetData: {} });
    });

    it('la mécanique des personnages s’applique telle quelle, dans les deux sens', () => {
        // La feuille saisie remonte…
        const releve = rapprocher(
            { 'identity.name': 'Rue Krev', 'domains.action': 3, 'assets.action.armory': -1, 'tracks.espoir': 6 },
            { sheetData: {} },
            CABALE,
        );
        const groupe = appliquerAuGroupe(undefined, releve, 1);
        expect(groupe.sheetData).toEqual({
            'identity.name': 'Rue Krev', 'domains.action': 3, 'assets.action.armory': -1, 'tracks.espoir': 6,
        });
        // … et redescend à l'identique dans une fiche neuve.
        expect(versLaFiche({ sheetData: groupe.sheetData }, CABALE)).toMatchObject({
            'domains.action': 3, 'assets.action.armory': -1, 'tracks.espoir': 6,
        });
    });
});

describe('la table du groupe a son fichier', () => {
    it('à côté de celle des personnages', () => {
        expect(cheminDeLaCorrespondance('systems/noc', 'correspondance-groupe.json'))
            .toBe('systems/noc/fiche/correspondance-groupe.json');
        expect(cheminDeLaCorrespondance('systems/noc')).toBe('systems/noc/fiche/correspondance.json');
    });
});
