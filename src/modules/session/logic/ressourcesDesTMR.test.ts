import { describe, expect, it } from 'vitest';
import { appliquerCoutTMR, proposerCoutTMR } from './ressourcesDesTMR';
import { CLE_RECUS_TMR, conserverRecusDesTMR, recusDesTMR } from './recusDesTMR';
import type { DemandeTMR, EcritureTMR } from '../../../../outils/reve-de-dragon/tmr/moteur.mjs';
import { consequences } from '../../../../outils/reve-de-dragon/tmr/moteur.mjs';
const demande: DemandeTMR = { action: 'monter', cible: 'G4', rythme: 'normal', operationId: 'demande', etape: 1 };
export const ficheTMR = () => ({ templateId: 'rdd', sheetData: { reve_pts: 12, reve_seuil: 4, fatigue: 0, endurance: 24, endurance_max: 24, vie: 12, vie_max: 12, __rddReprise231: 1, __rddFatigue231: 1, notes: 'Conservées' } as Record<string, unknown> });
export const ecritureTMR = (): EcritureTMR => ({ id: 'transaction', demande, empreinte: proposerCoutTMR(ficheTMR(), demande).empreinte, compteRendu: '', interrompue: false });
describe('ressources TMR : une seule fiche, règles communes', () => {
    it('contrôle le barème affiché par le module contre les coûts calculés par GM-OS', () => {
        for (const action of ['monter', 'avancer', 'rester', 'descendre'] as const) for (const rythme of ['normal', 'accelere'] as const) {
            const d = { ...demande, action, rythme }, p = proposerCoutTMR(ficheTMR(), d), affichage = consequences(d);
            expect({ reve: p.reveAvant - p.reveApres, fatigue: p.fatigueApres - p.fatigueAvant }).toEqual({ reve: affichage.reve, fatigue: affichage.fatigue });
        }
    });
    it('calcule la montée normale/accélérée et les cases sans plafonner le rêve au seuil', () => {
        expect(proposerCoutTMR(ficheTMR(), demande)).toMatchObject({ reveAvant: 12, reveApres: 11, fatigueApres: 1, sortieForcee: false });
        expect(proposerCoutTMR(ficheTMR(), { ...demande, rythme: 'accelere' }).reveApres).toBe(10);
        expect(proposerCoutTMR(ficheTMR(), { ...demande, action: 'avancer' })).toMatchObject({ reveApres: 12, fatigueApres: 1 });
        expect(proposerCoutTMR(ficheTMR(), { ...demande, action: 'descendre' })).toMatchObject({ reveApres: 12, fatigueApres: 0 });
    });
    it('garde données hors modèle et reçu immuable, sans repayer même après une correction manuelle', () => {
        const f = ficheTMR(), op = ecritureTMR(), original = structuredClone(f);
        const a = appliquerCoutTMR(f, op, 'campagne', 'pj');
        expect(f).toEqual(original); expect(a.donnees).toMatchObject({ reve_pts: 11, fatigue: 1, notes: 'Conservées' });
        const b = appliquerCoutTMR({ ...f, sheetData: { ...a.donnees, reve_pts: 20 } }, op, 'campagne', 'pj');
        expect(b.nouvelle).toBe(false); expect(b.donnees.reve_pts).toBe(20); expect(recusDesTMR(b.donnees)).toHaveLength(1);
        const ancienBrouillon = conserverRecusDesTMR(a.donnees, f.sheetData); expect(recusDesTMR(ancienBrouillon)).toEqual([a.recu]);
        expect(() => appliquerCoutTMR({ ...f, sheetData: a.donnees }, op, 'autre-campagne', 'pj')).toThrow(/autre opération/);
    });
    it('refuse un aperçu périmé, une écriture interrompue et les prérequis absents sans mutation', () => {
        const f = ficheTMR(), op = ecritureTMR(); f.sheetData.reve_pts = 10;
        expect(() => appliquerCoutTMR(f, op, 'c', 'p')).toThrow(/changé/); expect(f.sheetData.reve_pts).toBe(10);
        expect(() => appliquerCoutTMR(ficheTMR(), { ...op, interrompue: true }, 'c', 'p')).toThrow(/interrompu/);
        f.sheetData.__rddFatigue231 = 0; expect(() => proposerCoutTMR(f, demande)).toThrow(/R1/);
        f.sheetData.__rddFatigue231 = 1; f.sheetData.reve_pts = 0; expect(() => proposerCoutTMR(f, demande)).toThrow(/concentrer/);
        f.sheetData.reve_pts = 1; expect(() => proposerCoutTMR(f, { ...demande, rythme: 'accelere' })).toThrow(/insuffisants/);
    });
    it('prévoit la sortie à zéro rêve ou fatigue pleine et refuse une nouvelle concentration', () => {
        const f = ficheTMR(); f.sheetData.reve_pts = 1;
        expect(proposerCoutTMR(f, demande)).toMatchObject({ reveApres: 0, sortieForcee: true, detail: expect.stringContaining('endormi') });
        f.sheetData.reve_pts = 10; f.sheetData.fatigue = 47;
        expect(proposerCoutTMR(f, demande)).toMatchObject({ fatigueApres: 48, sortieForcee: true });
        f.sheetData.fatigue = 48; expect(() => proposerCoutTMR(f, demande)).toThrow(/concentrer/);
    });
    it('refuse de remplacer ou de dupliquer un reçu et ne tronque aucune preuve', () => {
        const a = appliquerCoutTMR(ficheTMR(), ecritureTMR(), 'c', 'p');
        expect(() => conserverRecusDesTMR(a.donnees, { [CLE_RECUS_TMR]: [{ ...a.recu, detail: 'Réécrit' }] })).toThrow(/remplacé/);
        expect(() => recusDesTMR({ [CLE_RECUS_TMR]: [a.recu, a.recu] })).toThrow(/illisibles/);
    });
});
