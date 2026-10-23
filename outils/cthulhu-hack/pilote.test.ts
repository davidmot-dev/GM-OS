import fs from 'node:fs';
import AdmZip from 'adm-zip';
import { describe,it,expect } from 'vitest';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';
const fichier='Export Dirvers/corriges/CH_driver_gmos_2026-10-23.gmos-driver';
describe.skipIf(!fs.existsSync(fichier))('export Cthulhu Hack 1.1.0 fourni à David',()=>{
    it('ne produit aucun constat de la Forge et préserve tous les identifiants',()=>{
        const x=JSON.parse(new AdmZip(fichier).getEntry('state.json')!.getData().toString('utf8'));
        expect(controlerLePilote(x.gameDriver,x.sheetTemplate)).toEqual([]);
        expect(x.gameDriver.id).toBe('custom-1774643419710');expect(x.sheetTemplate.id).toBe('tpl-1774643419711');
        const ids=x.sheetTemplate.sections.flatMap((s:{fields:{id:string}[]})=>s.fields.map(f=>f.id));expect(new Set(ids).size).toBe(ids.length);
    });
});
