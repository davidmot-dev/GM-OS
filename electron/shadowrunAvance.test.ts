import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import AdmZip from 'adm-zip';
// Sous-ensemble lu dans le JSON : NexusDriverState entraîne les magasins du renderer dans ce projet Node.
type ArchiveShadowrun = {
    gameDriver: { id: string; version: string; jet: { shadowrun: { derives: { seuils: { resistance: string }[] } } } };
    sheetTemplate: { id: string; sections: { fields: { id: string; max?: number }[] }[] };
};

describe('le générateur Shadowrun 2.1.0', () => {
    it('conserve les champs et identifiants, fournit un pilote sans constat et refuse les références absentes', async () => {
        // Le contrôleur est typé par le projet renderer. Le charger ici évite d’entraîner son graphe TSX
        // dans le projet Electron (sans JSX), tout en essayant la vraie fonction sur l’archive générée.
        const cheminDuControle = '../src/modules/forge/rules/controlesDuPilote.ts';
        const { controlerLePilote } = await import(cheminDuControle) as {
            controlerLePilote: (pilote: unknown, fiche: unknown) => { message: string }[];
        };
        const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-sr-a1-a3-'));
        if (!path.resolve(dossier).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('Dossier temporaire inattendu.');
        try {
            const entree = 'output/campagnes-tests/shadowrun-anarchy/Shadowrun-Anarchy-2.0.0.gmos-driver';
            const fichier = path.join(dossier, 'Shadowrun-2.1.0.gmos-driver');
            execFileSync(process.execPath, ['outils/shadowrun-anarchy/ameliorer_shadowrun.mjs', entree, fichier]);
            const ancien = JSON.parse(new AdmZip(entree).readAsText('state.json')) as ArchiveShadowrun;
            const etat = JSON.parse(new AdmZip(fichier).readAsText('state.json')) as ArchiveShadowrun;
            expect(etat.gameDriver.id).toBe(ancien.gameDriver.id);
            expect(etat.sheetTemplate!.id).toBe(ancien.sheetTemplate!.id);
            expect(etat.gameDriver.version).toBe('2.1.0');
            expect(controlerLePilote(etat.gameDriver, etat.sheetTemplate!)).toEqual([]);
            const champs = etat.sheetTemplate!.sections.flatMap(s => s.fields);
            expect(champs.find(c => c.id === 'anarchy')?.max).toBeUndefined();
            const ids = champs.map(c => c.id);
            expect(new Set(ids).size).toBe(ids.length);
            expect(ancien.sheetTemplate!.sections.flatMap(s => s.fields.map(f => f.id)).every(c => ids.includes(c))).toBe(true);
            etat.gameDriver.jet!.shadowrun!.derives!.seuils[0].resistance = 'absent';
            expect(controlerLePilote(etat.gameDriver, etat.sheetTemplate!).some(c => c.message.includes('absent'))).toBe(true);
        } finally {
            fs.rmSync(dossier, { recursive: true });
        }
    });
});
