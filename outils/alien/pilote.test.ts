import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import AdmZip from 'adm-zip';
import { describe, it, expect } from 'vitest';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';

/**
 * **Le pilote Alien 1.10.0 (A12, Colonial Marines, 14/11/2026)**, produit par
 * `ameliorer-pilote-a12-colonial-marines.mjs` depuis l'export de référence 1.9.0 du 11/11.
 * Il n'ajoute qu'une section à la fiche ; tout le reste doit être identique à l'export.
 *   npx vitest run --config outils/pilotes.vitest.config.mts --maxWorkers=4 outils/alien
 */
/*
  La référence est lue dans git, au commit qui l'a fixée (`cab150d1`, 11/11/2026) : GM-OS réexporte le
  pilote sous le même nom, et David l'a fait le 15/11 avec la 1.11.0 — le fichier de travail n'est plus
  la 1.9.0 dont A12 est parti.
*/
const reference = 'Export Dirvers/Alien_driver_gmos_1793655035463.gmos-driver';
const referenceFigee = execFileSync('git', ['show', `cab150d1:${reference}`], { maxBuffer: 1 << 28 });
const corrige = 'Export Dirvers/corriges/Alien-1.10.0.gmos-driver';
if (!fs.existsSync(corrige)) throw new Error(`Pilote absent : ${corrige}`);
const lire = (f: string | Buffer) => JSON.parse(new AdmZip(f).getEntry('state.json')!.getData().toString('utf8'));

describe('pilote Alien 1.10.0 — Colonial Marines', () => {
    const avant = lire(referenceFigee), apres = lire(corrige);

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

/**
 * **Le pilote Alien 1.11.0 (A13, Building Better Worlds, 15/11/2026)**, produit par
 * `ameliorer-pilote-a13-building-better-worlds.mjs` depuis la 1.10.0 : deux carrières, 53 objets au
 * catalogue. Les 23 tables du supplément vont dans Table-OS, contrôlées par `tablesDuDepot.test.ts`.
 */
const a13 = 'Export Dirvers/corriges/Alien-1.11.0.gmos-driver';
if (!fs.existsSync(a13)) throw new Error(`Pilote absent : ${a13}`);
type Objet = { nom: string; source?: { livre?: string }; effets?: unknown[] };

describe('pilote Alien 1.11.0 — Building Better Worlds', () => {
    const avant = lire(corrige), apres = lire(a13);

    it("n'ajoute que des avertissements du catalogue et garde les identifiants", () => {
        const deja = new Set(controlerLePilote(avant.gameDriver, avant.sheetTemplate).map(c => JSON.stringify(c)));
        const nouveaux = controlerLePilote(apres.gameDriver, apres.sheetTemplate).filter(c => !deja.has(JSON.stringify(c)));
        expect(nouveaux.filter(c => c.gravite !== 'avertissement' || !c.ou.startsWith('catalogue.'))).toEqual([]);
        expect(apres.gameDriver.version).toBe('1.11.0');
        expect([apres.gameDriver.id, apres.gameDriver.templateId, apres.sheetTemplate.id])
            .toEqual([avant.gameDriver.id, avant.gameDriver.templateId, avant.sheetTemplate.id]);
    });

    it('ajoute Prospecteur et Artiste, et rien d’autre à la fiche', () => {
        const options = (t: typeof avant) => t.sheetTemplate.sections.flatMap((s: { fields: { id: string; options?: string[] }[] }) => s.fields)
            .find((f: { id: string }) => f.id === 'type_personnage').options;
        expect(options(apres)).toEqual([...options(avant), 'Prospecteur', 'Artiste']);
        const sansCarriere = (t: typeof avant) => JSON.stringify(t.sheetTemplate).replace(/"Prospecteur",\s*"Artiste"/, '').replace(/,\s*\]/g, ']');
        expect(JSON.parse(sansCarriere(apres))).toEqual(JSON.parse(sansCarriere(avant)));
        expect(apres.bestiaire).toEqual(avant.bestiaire);
    });

    it('verse 53 objets du supplément au catalogue sans toucher aux autres', () => {
        expect({ ...apres.gameDriver, version: '1.10.0', catalogue: null }).toEqual({ ...avant.gameDriver, catalogue: null });
        const objets: Objet[] = apres.gameDriver.catalogue.objets;
        expect(objets.slice(0, avant.gameDriver.catalogue.objets.length)).toEqual(avant.gameDriver.catalogue.objets);
        const ajoutes = objets.slice(avant.gameDriver.catalogue.objets.length);
        expect(ajoutes).toHaveLength(53);
        expect(ajoutes.every(o => o.source?.livre === 'Building Better Worlds')).toBe(true);
        expect(apres.gameDriver.catalogue.colonnes).toEqual(avant.gameDriver.catalogue.colonnes);
        // Les deux effets qui visent les autres, pas le porteur, sont retirés.
        for (const nom of ['LAG Laser Attunement Guide', 'Omni-Tech SDDG Sonic Deterrent Defense Grid']) {
            expect(ajoutes.find(o => o.nom === nom)?.effets).toBeUndefined();
        }
    });

    it('a ses 23 tables dans Table-OS', () => {
        const tables = fs.readdirSync('databases/tables/Alien').filter(f => f.startsWith('bbw_'));
        expect(tables).toHaveLength(23);
    });
});
