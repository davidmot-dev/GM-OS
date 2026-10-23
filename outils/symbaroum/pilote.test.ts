import fs from 'node:fs';
import AdmZip from 'adm-zip';
import { describe, it, expect } from 'vitest';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';

// Le pilote fini du 23/10 (`finir_symbaroum.py`) : la Forge n'y trouve rien à redire, et aucun identifiant n'a changé.
const fichier = 'Export Dirvers/corriges/Symbaroum_driver_gmos_finir.gmos-driver';
describe.skipIf(!fs.existsSync(fichier))('export Symbaroum 2.0.0 fourni à David', () => {
    it('ne produit aucun constat de la Forge et préserve les identifiants', () => {
        const x = JSON.parse(new AdmZip(fichier).getEntry('state.json')!.getData().toString('utf8'));
        expect(controlerLePilote(x.gameDriver, x.sheetTemplate)).toEqual([]);
        expect(x.gameDriver.id).toBe('custom-1792493594094');
        expect(x.gameDriver.version).toBe('2.0.0');
        expect(x.gameDriver.jet.critique).toBeUndefined();
        expect(x.gameDriver.combat.departages).toEqual(['vigilance']);
        const ids = x.sheetTemplate.sections.flatMap((s: { fields: { id: string }[] }) => s.fields.map(f => f.id));
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toHaveLength(139);
    });
});
