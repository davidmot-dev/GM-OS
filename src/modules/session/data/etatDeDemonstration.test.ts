import { describe, it, expect } from 'vitest';
import { INITIAL_DATA, CAMPAGNES_DE_DEMONSTRATION, rienQueLaDemonstration } from './sessionMocks';

/**
 * **Reconnaître l'état d'usine.**
 *
 * Deux mécanismes en dépendent, et ils sont tous les deux des mécanismes de
 * perte s'ils se trompent : la sauvegarde automatique (qui archiverait « The
 * Eternal Quest » par-dessus les vraies sauvegardes) et la semence de
 * répétition (qui écraserait l'état du meneur).
 *
 * ⛔ **Ce que ce fichier garde avant tout :** que le critère ne soit **ni trop
 * large ni trop étroit**. La première version de la semence demandait une base
 * *vide* — une base neuve ne l'est jamais, elle porte `INITIAL_DATA` — et la
 * garde refusait donc toujours. *Une garde qui refuse tout ressemble beaucoup à
 * une garde qui marche* : rien ne la distingue d'une garde correcte tant qu'on
 * ne lui présente pas le cas qu'elle doit laisser passer.
 */

const campagne = (id: string) => ({ id });

describe('le critère reconnaît l’usine', () => {
    /* Le cas que la semence doit LAISSER PASSER — celui qui manquait. */
    it('l’état d’usine complet est reconnu', () => {
        expect(rienQueLaDemonstration(INITIAL_DATA.campaigns)).toBe(true);
    });

    it('une base neuve n’est pas vide — c’est tout le piège', () => {
        expect(INITIAL_DATA.campaigns.length).toBeGreaterThan(0);
    });

    /*
      Dérivé, pas recopié : si quelqu'un ajoute une campagne de démonstration,
      le critère la connaît sans qu'on y touche.
    */
    it('les identifiants viennent de `INITIAL_DATA`', () => {
        for (const c of INITIAL_DATA.campaigns) {
            expect(CAMPAGNES_DE_DEMONSTRATION.has(c.id)).toBe(true);
        }
    });

    it('une liste vide est traitée comme l’usine', () => {
        expect(rienQueLaDemonstration([])).toBe(true);
    });
});

describe('le critère reconnaît le meneur', () => {
    it('une campagne du meneur ferme la porte', () => {
        expect(rienQueLaDemonstration([campagne('camp-hadley-hope')])).toBe(false);
    });

    /*
      ⚠️ Le cas mixte est celui qui coûte cher : le meneur a créé sa campagne
      sans supprimer les deux de démonstration. Son état doit être protégé
      quand même.
    */
    it('une seule campagne du meneur au milieu de l’usine suffit', () => {
        expect(rienQueLaDemonstration([
            ...INITIAL_DATA.campaigns,
            campagne('camp-du-meneur'),
        ])).toBe(false);
    });
});

/*
  Les sources en texte brut, par le glob de Vite : `node:fs` n'est pas
  disponible dans le projet `renderer` — mêmes raisons que dans
  `clesEmployees.test.ts`.
*/
const SOURCES = import.meta.glob<string>(
    ['../logic/SessionBackupManager.ts', '../../../hooks/useSemence.ts'],
    { eager: true, query: '?raw', import: 'default' },
);

const source = (fin: string): string => {
    const cle = Object.keys(SOURCES).find(k => k.endsWith(fin));
    if (!cle) throw new Error(`Source introuvable : ${fin} (vu : ${Object.keys(SOURCES).join(', ')})`);
    return SOURCES[cle];
};

describe('le critère est réellement partagé', () => {
    /*
      ⛔ **Une liste recopiée ne vieillit pas avec sa source.** Elle vivait en dur
      dans le gardien de la sauvegarde ; ce contrôle empêche qu'une troisième
      copie apparaisse.
    */
    it('la sauvegarde automatique ne redéfinit plus la liste', () => {
        const manager = source('SessionBackupManager.ts');
        expect(manager).toContain('rienQueLaDemonstration(campagnes)');
        expect(manager, 'la liste est revenue en dur').not.toMatch(/new Set\(\[\s*'c-1'/);
    });

    it('la semence passe par le même critère, et non par un décompte', () => {
        const semence = source('useSemence.ts');
        expect(semence).toContain('rienQueLaDemonstration(campagnes)');
        expect(
            semence,
            'le décompte refusait toujours : une base neuve porte deux campagnes',
        ).not.toMatch(/campagnes\.length\s*>\s*0/);
    });
});
