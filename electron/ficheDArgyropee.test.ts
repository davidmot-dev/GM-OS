import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { lireLaCorrespondance, versLaFiche, verifierLaCorrespondance } from '../src/modules/fiches/correspondanceDeFiche';
import { rapprocher } from '../src/modules/fiches/rapprochementDeLaFiche';

/**
 * **La fiche d'Argyropée, raccordée au pilote 2.1.0** — 2026-11-08, à la demande de David
 * (« finir le pilote »). Sur les vrais fichiers du dépôt : la fiche livrée, sa correspondance
 * et l'export corrigé. L'export vit dans `Export Dirvers/corriges/`, que David vide après
 * réimport : sans lui, les essais du pilote sont SAUTÉS — un essai sauté n'est pas passé ;
 * `node outils/argyropee/finir_argyropee.mjs` le refabrique depuis l'export de David.
 */
const RACINE = path.resolve(__dirname, '..');
const FICHE = 'docs/fiches/Argyropée/argyropee-fiche-interactive.html';
const PILOTE = path.join(RACINE, 'Export Dirvers/corriges/Argyropee-2.1.0.gmos-driver');
const correspondance = lireLaCorrespondance(
    fs.readFileSync(path.join(RACINE, 'docs/systems/argyropee/fiche/correspondance.json'), 'utf8'), 'correspondance.json')!;
const manifeste = JSON.parse(fs.readFileSync(path.join(RACINE, FICHE), 'utf8')
    .match(/<script\b[^>]*\bid="character-sheet-template"[^>]*>([\s\S]*?)<\/script>/)![1]).template as
    { id: string; pages: { fields: { key: string }[] }[] };
const clesDeLaFiche = [...new Set(manifeste.pages.flatMap(p => p.fields.map(f => f.key)))];
const etat = fs.existsSync(PILOTE) ? JSON.parse(new AdmZip(PILOTE).readAsText('state.json')) : null;

describe('la fiche d’Argyropée', () => {
    it('chaque clé de la fiche est reliée, une fois', () => {
        expect(correspondance.gabaritDeLaFiche).toBe(manifeste.id);
        const reliees = correspondance.champs.map(c => c.fiche);
        expect(new Set(reliees).size).toBe(reliees.length);
        expect([...reliees].sort()).toEqual([...clesDeLaFiche].sort());
    });

    it('les valeurs vont et reviennent telles quelles', () => {
        const sheetData = { nom: 'Vanille', serrurerie: 3, metier1_nom: 'Malandrin', metier1_bonus: 2, panache: 14, arme1_degats: '1d4' };
        expect(versLaFiche({ sheetData }, correspondance)).toMatchObject({
            'identity.name': 'Vanille', 'skills.locksmithing.level': 3, 'careers.0.name': 'Malandrin', 'careers.0.bonus': 2,
            'tracks.panache': 14, 'weapons.0.damage': '1d4',
        });
        const r = rapprocher({ 'skills.detection.level': 4, 'careers.1.name': 'Apothicaire' }, { sheetData }, correspondance);
        expect(r.aEcrire).toMatchObject({ detection: 4, metier2_nom: 'Apothicaire' });
    });
});

describe.skipIf(!etat)('le pilote Argyropée 2.1.0 et sa fiche', () => {
    const champsDuPilote: string[] = etat?.sheetTemplate.sections.flatMap((s: { fields: { id: string }[] }) => s.fields.map(f => f.id)) ?? [];

    it('chaque champ relié existe dans le pilote, et la table se vérifie sans erreur', () => {
        expect(correspondance.champs.filter(c => !champsDuPilote.includes(c.gmos))).toEqual([]);
        const constats = verifierLaCorrespondance(correspondance, new Set(clesDeLaFiche), new Set(champsDuPilote));
        expect(constats.filter(c => c.gravite === 'erreur')).toEqual([]);
    });

    it('le pilote additionne un d10 à la compétence, et ne compte plus de réussites par dé (p. 44)', () => {
        const jet = etat.gameDriver.jet;
        expect(jet.argyropee.panache).toBe('panache');
        expect(jet.argyropee.metiers).toHaveLength(5);
        expect(jet).not.toHaveProperty('difficulte');
        expect(jet).not.toHaveProperty('critique');
        expect(jet).not.toHaveProperty('complication');
        expect(jet.reserve).toEqual({ base: 1, max: 1, faces: 10 });
        expect(etat.gameDriver.combat.initiativeFormula).toBe('1d10 + agilite + detection + bonus_initiative');
    });

    it('garde l’identifiant du pilote et de sa fiche', () => {
        expect(etat.gameDriver.id).toBe('custom-1794176660508');
        expect(etat.sheetTemplate.id).toBe('tpl-1794176660508');
        expect(etat.gameDriver.version).toBe('2.1.0');
    });
});
