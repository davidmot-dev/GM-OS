import fs from 'node:fs';
import AdmZip from 'adm-zip';
import { describe, it, expect } from 'vitest';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';

// Le pilote fini du 31/10 (`finir_shadowrun.py`) : la Forge n'y trouve rien à redire, et aucun identifiant n'a changé.
// Depuis le 11/11/2026 : l'export de référence d'`Export Dirvers/`, versionné dans git (les corrigés
// visés jusque-là avaient été supprimés le 31/10 et l'essai sautait en silence). Absent : il échoue.
const fichier = 'Export Dirvers/SR_Anarchy_driver_gmos_1793483272825.gmos-driver';
if (!fs.existsSync(fichier)) throw new Error(`Export absent : ${fichier} — réexporter le pilote depuis GM-OS.`);
describe('export Shadowrun : Anarchy 2.0 2.2.0 fourni à David', () => {
    it('ne produit aucun constat de la Forge et préserve les identifiants', () => {
        const x = JSON.parse(new AdmZip(fichier).getEntry('state.json')!.getData().toString('utf8'));
        expect(controlerLePilote(x.gameDriver, x.sheetTemplate)).toEqual([]);
        expect(x.gameDriver.id).toBe('custom-1793480750141');
        expect(x.gameDriver.templateId).toBe('tpl-1793480750142');
        expect(x.gameDriver.version).toBe('2.2.0');
        expect(x.gameDriver.dice.successThreshold).toBe(5);
        expect(x.gameDriver.jet.seuil).toBeUndefined();
        expect(x.gameDriver.jet.reserve.cout).toBeUndefined();
        expect(x.gameDriver.combat.moniteurDEtat.mecanique).toBe('shadowrun');
        const ids = x.sheetTemplate.sections.flatMap((s: { fields: { id: string }[] }) => s.fields.map(f => f.id));
        expect(new Set(ids).size).toBe(ids.length);
        // 125 champs en 2.0.0 ; la 2.1.0 en ajoute 14 (SR-A1 à SR-A3) sans en retirer aucun.
        expect(ids).toHaveLength(139);
        for (const id of ['pseudo', 'metatype', 'essence']) expect(ids).toContain(id);
    });
});
