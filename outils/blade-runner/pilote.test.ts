import fs from 'node:fs';
import AdmZip from 'adm-zip';
import { describe, it, expect } from 'vitest';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';

// Le pilote fini du 24/10 (`finir_blade_runner.py`) : la Forge n'y trouve rien à redire, et aucun identifiant n'a changé.
// Depuis le 11/11/2026 : l'export de référence d'`Export Dirvers/`, versionné dans git (les corrigés
// visés jusque-là avaient été supprimés le 31/10 et l'essai sautait en silence). Absent : il échoue.
const fichier = 'Export Dirvers/Blade Runner_driver_gmos_1794393351317.gmos-driver';
if (!fs.existsSync(fichier)) throw new Error(`Export absent : ${fichier} — réexporter le pilote depuis GM-OS.`);
describe('export Blade Runner 2.0.0 fourni à David', () => {
    it('ne produit aucun constat de la Forge et préserve les identifiants', () => {
        const x = JSON.parse(new AdmZip(fichier).getEntry('state.json')!.getData().toString('utf8'));
        expect(controlerLePilote(x.gameDriver, x.sheetTemplate)).toEqual([]);
        expect(x.gameDriver.id).toBe('custom-1774725549525');
        expect(x.gameDriver.templateId).toBe('tpl-1774725549529');
        expect(x.gameDriver.version).toBe('2.0.0');
        expect(x.gameDriver.jet.bladeRunner.endurance).toEqual(['vigueur', 'endurance']);
        expect(x.gameDriver.jet.desEchelonnes.plafondDesD12).toBe(0);
        expect(x.gameDriver.lootTables.map((t: { name: string }) => t.name)).not.toContain('TEST');
        const ids = x.sheetTemplate.sections.flatMap((s: { fields: { id: string }[] }) => s.fields.map(f => f.id));
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toHaveLength(38);
    });
});
