import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import AdmZip from 'adm-zip';
type Archive = { gameDriver: { id: string; version: string; jet: { coc: { des: string; dommages: { force: string } } } }; sheetTemplate: { id: string; sections: { fields: { id: string }[] }[] } };
describe('le pilote COC 2.1.0', () => {
    it.each(['d20', 'option-3d6'])('variante %s : conservation des identifiants et champs, zéro constat, références contrôlées', async variante => {
        const module = '../src/modules/forge/rules/controlesDuPilote.ts';
        const { controlerLePilote } = await import(module) as { controlerLePilote: (p: unknown, f: unknown) => unknown[] };
        const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-coc-a123-'));
        if (!path.resolve(dossier).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('Dossier temporaire inattendu.');
        try {
            const entree = `output/campagnes-tests/coc/COC-2.0.0-${variante}.gmos-driver`, sortie = path.join(dossier, 'COC.gmos-driver');
            execFileSync(process.execPath, ['outils/coc/ameliorer_coc.mjs', entree, sortie]);
            const ancien = JSON.parse(new AdmZip(entree).readAsText('state.json')) as Archive;
            const etat = JSON.parse(new AdmZip(sortie).readAsText('state.json')) as Archive;
            expect(etat.gameDriver.id).toBe(ancien.gameDriver.id); expect(etat.sheetTemplate.id).toBe(ancien.sheetTemplate.id);
            expect(etat.gameDriver.version).toBe('2.1.0'); expect(etat.gameDriver.jet.coc.des).toBe(ancien.gameDriver.jet.coc.des);
            const ids = etat.sheetTemplate.sections.flatMap(s => s.fields.map(f => f.id));
            expect(ancien.sheetTemplate.sections.flatMap(s => s.fields.map(f => f.id)).every(id => ids.includes(id))).toBe(true);
            expect(new Set(ids).size).toBe(ids.length);
            expect(controlerLePilote(etat.gameDriver, etat.sheetTemplate)).toEqual([]);
            etat.gameDriver.jet.coc.dommages.force = 'absente';
            expect(controlerLePilote(etat.gameDriver, etat.sheetTemplate).length).toBeGreaterThan(0);
        } finally { fs.rmSync(dossier, { recursive: true, force: true }); }
    });
});

describe('le pilote COC 2.2.0, A4/A5/A6', () => {
    it.each(['d20', 'option-3d6'])('variante %s : six références explicites, ancien contenu conservé et zéro constat', async variante => {
        const module = '../src/modules/forge/rules/controlesDuPilote.ts';
        const { controlerLePilote } = await import(module) as { controlerLePilote: (p: unknown, f: unknown) => unknown[] };
        const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-coc-a456-'));
        if (!path.resolve(dossier).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('Dossier temporaire inattendu.');
        try {
            const inter = path.join(dossier, '2.1.gmos-driver'), sortie = path.join(dossier, '2.2.gmos-driver');
            execFileSync(process.execPath, ['outils/coc/ameliorer_coc.mjs', `output/campagnes-tests/coc/COC-2.0.0-${variante}.gmos-driver`, inter]);
            execFileSync(process.execPath, ['outils/coc/etendre_coc.mjs', inter, sortie]);
            type Extension = Archive & { gameDriver: { jet: { coc: { heroisme: boolean; psychisme: boolean; voies: { emplacements: { reference: string }[] } } } } };
            const ancien = JSON.parse(new AdmZip(inter).readAsText('state.json')) as Archive;
            const etat = JSON.parse(new AdmZip(sortie).readAsText('state.json')) as Extension;
            expect(etat.gameDriver.version).toBe('2.2.0'); expect(etat.gameDriver.id).toBe(ancien.gameDriver.id); expect(etat.sheetTemplate.id).toBe(ancien.sheetTemplate.id);
            expect(etat.gameDriver.jet.coc.des).toBe(ancien.gameDriver.jet.coc.des);
            expect(etat.gameDriver.jet.coc).toMatchObject({ heroisme: true, psychisme: true });
            expect(etat.gameDriver.jet.coc.voies.emplacements).toHaveLength(6);
            const champs = etat.sheetTemplate.sections.flatMap(s => s.fields);
            expect(ancien.sheetTemplate.sections.flatMap(s => s.fields).every(c => champs.some(f => JSON.stringify(f) === JSON.stringify(c)))).toBe(true);
            expect(controlerLePilote(etat.gameDriver, etat.sheetTemplate)).toEqual([]);
            etat.gameDriver.jet.coc.voies.emplacements[0].reference = 'inconnue';
            expect(controlerLePilote(etat.gameDriver, etat.sheetTemplate).length).toBeGreaterThan(0);
        } finally { fs.rmSync(dossier, { recursive: true, force: true }); }
    });
});
