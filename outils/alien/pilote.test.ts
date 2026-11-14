import fs from 'node:fs';
import AdmZip from 'adm-zip';
import { describe, it, expect } from 'vitest';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';

/**
 * **Le pilote Alien 1.10.0 (A12, Colonial Marines, 14/11/2026)**, produit par
 * `ameliorer-pilote-a12-colonial-marines.mjs` depuis l'export de référence 1.9.0 du 11/11.
 * Il n'ajoute qu'une section à la fiche ; tout le reste doit être identique à l'export.
 *   npx vitest run --config outils/pilotes.vitest.config.mts --maxWorkers=4 outils/alien
 */
const reference = 'Export Dirvers/Alien_driver_gmos_1793655035463.gmos-driver';
const corrige = 'Export Dirvers/corriges/Alien-1.10.0.gmos-driver';
for (const f of [reference, corrige]) if (!fs.existsSync(f)) throw new Error(`Pilote absent : ${f}`);
const lire = (f: string) => JSON.parse(new AdmZip(f).getEntry('state.json')!.getData().toString('utf8'));

describe('pilote Alien 1.10.0 — Colonial Marines', () => {
    const avant = lire(reference), apres = lire(corrige);

    it("n'ajoute aucun constat de la Forge et garde les identifiants", () => {
        // La 1.9.0 porte déjà des avertissements sur le catalogue (« Puissance 9 », « 1 ou 2 » dans
        // une colonne de nombres) : A12 n'y touche pas. On exige qu'il n'en ajoute aucun.
        const constats = controlerLePilote(apres.gameDriver, apres.sheetTemplate);
        expect(constats).toEqual(controlerLePilote(avant.gameDriver, avant.sheetTemplate));
        expect(constats.filter(c => c.gravite !== 'avertissement')).toEqual([]);
        expect(constats.every(c => c.ou.startsWith('catalogue.'))).toBe(true);
        expect(apres.gameDriver.version).toBe('1.10.0');
        expect([apres.gameDriver.id, apres.gameDriver.templateId, apres.sheetTemplate.id])
            .toEqual([avant.gameDriver.id, avant.gameDriver.templateId, avant.sheetTemplate.id]);
        const ids = apres.sheetTemplate.sections.flatMap((s: { fields: { id: string }[] }) => s.fields.map(f => f.id));
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("n'ajoute que la section des Marines coloniaux", () => {
        expect({ ...apres.gameDriver, version: '1.9.0' }).toEqual(avant.gameDriver);
        expect(apres.bestiaire).toEqual(avant.bestiaire);
        const sections = apres.sheetTemplate.sections;
        expect(sections.slice(0, -1)).toEqual(avant.sheetTemplate.sections);
        const ajout = sections.at(-1);
        expect(ajout.id).toBe('marines_coloniaux');
        expect(ajout.fields.map((f: { id: string }) => f.id))
            .toEqual(['specialite_militaire', 'statut_marine', 'grade', 'evenements_de_terrain']);
        const sm = ajout.fields[0].options;
        expect(sm).toHaveLength(10);
        expect(sm).toContain('Mitrailleur (opérateur smartgun)');
        expect(ajout.fields[1].options).toEqual(['Engagé', 'Sous-officier', "Pilote ou chef d'équipage"]);
    });
});
