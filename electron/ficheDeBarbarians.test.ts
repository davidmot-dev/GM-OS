import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { lireLaCorrespondance, versLaFiche, verifierLaCorrespondance } from '../src/modules/fiches/correspondanceDeFiche';
import { rapprocher } from '../src/modules/fiches/rapprochementDeLaFiche';

/**
 * **La fiche de Barbarians of Lemuria, raccordée au pilote 2.0.0** — 2026-10-27, à la
 * demande de David (« finir le pilote »). Sur les vrais fichiers du dépôt : la fiche
 * livrée, sa correspondance et l'export corrigé.
 */
const RACINE = path.resolve(__dirname, '..');
const FICHE = 'docs/fiches/Barbarian of Lemuria/barbarian-of-lemuria-fiche-interactive.html';
const correspondance = lireLaCorrespondance(
    fs.readFileSync(path.join(RACINE, 'docs/systems/barbarian/fiche/correspondance.json'), 'utf8'), 'correspondance.json')!;
const manifeste = JSON.parse(fs.readFileSync(path.join(RACINE, FICHE), 'utf8')
    .match(/<script\b[^>]*\bid="character-sheet-template"[^>]*>([\s\S]*?)<\/script>/)![1]).template as
    { id: string; pages: { fields: { key: string }[] }[] };
const clesDeLaFiche = manifeste.pages.flatMap(p => p.fields.map(f => f.key));
const etat = JSON.parse(new AdmZip(path.join(RACINE, 'Export Dirvers/corriges/BOL_driver_gmos_2.0.0.gmos-driver')).readAsText('state.json'));
const champsDuPilote: string[] = etat.sheetTemplate.sections.flatMap((s: { fields: { id: string }[] }) => s.fields.map(f => f.id));

describe('la fiche de Barbarians of Lemuria', () => {
    it('chaque clé de la fiche est reliée, sauf le portrait qui reste sur la fiche', () => {
        expect(correspondance.gabaritDeLaFiche).toBe(manifeste.id);
        const reliees = correspondance.champs.map(c => c.fiche);
        expect([...reliees, 'identity.portrait'].sort()).toEqual([...clesDeLaFiche].sort());
    });

    it('chaque champ relié existe dans le pilote 2.0.0, et la table se vérifie sans erreur', () => {
        expect(correspondance.champs.filter(c => !champsDuPilote.includes(c.gmos))).toEqual([]);
        const constats = verifierLaCorrespondance(correspondance, new Set(clesDeLaFiche), new Set(champsDuPilote));
        expect(constats.filter(c => c.gravite === 'erreur')).toEqual([]);
    });

    it('les valeurs vont et reviennent telles quelles, négatives comprises (p. 12)', () => {
        const sheetData = { nom: 'Krongar', vigueur: 3, agilite: -1, carriere1_nom: 'Barbare', carriere1: 2, arme1_degats: 'd6B+3', vitalite: -2 };
        expect(versLaFiche({ sheetData }, correspondance)).toMatchObject({
            'identity.name': 'Krongar', 'attributes.strength': 3, 'attributes.agility': -1,
            'careers.0.name': 'Barbare', 'careers.0.rank': 2, 'weapons.0.damage': 'd6B+3', 'resources.vitality': -2,
        });
        const r = rapprocher({ 'combat.defense': 2, 'careers.1.name': 'Voleur' }, { sheetData }, correspondance);
        expect(r.aEcrire).toMatchObject({ defense: 2, carriere2_nom: 'Voleur' });
    });

    it('le pilote 2.0.0 additionne les dés contre 9 et ne compte plus de réussites par dé', () => {
        const jet = etat.gameDriver.jet;
        expect(jet.barbarians).toEqual({ heroisme: 'points_heroisme', cible: 9 });
        expect(jet).not.toHaveProperty('difficulte');
        expect(jet).not.toHaveProperty('modificateurDuSeuil');
        expect(jet.seuil.map((c: { id: string }) => c.id)).toEqual(['attribut', 'action']);
    });
});
