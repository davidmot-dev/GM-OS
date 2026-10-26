import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import AdmZip from 'adm-zip';
import { describe, it, expect, vi } from 'vitest';
import { Buffer } from 'node:buffer';
import { nexusService } from '../../src/modules/system/archive/NexusService';
import { modulesDuPilote } from '../../src/modules/modulesDuJeu/catalogue';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';
import { lireCH, modificateursCH, avancerCH, appliquerPertesCH, recupererCH } from '../../src/modules/dice/systemes/cthulhuHack';
import type { NexusCampaignState, NexusManifest } from '../../src/modules/system/archive/nexus.types';
import { lireDuJson } from '../../src/modules/tables/logic/collageDUneTable';

// AdmZip exige l'Uint8Array du même contexte que les Buffer lus par node:fs.
vi.stubGlobal('Uint8Array', Object.getPrototypeOf(Buffer.prototype).constructor);
const dossier = 'output/campagnes-tests/cthulhu-hack';
const noms = ['01-Port-Lenoir', '02-Hors-Jeu-et-limites', '03-Chocs-et-Folies'];
const lire = (nom: string) => {
    const zip = new AdmZip(path.join(dossier, nom + '.gmos'));
    return { zip, s: JSON.parse(zip.readAsText('state.json')) as NexusCampaignState, m: JSON.parse(zip.readAsText('manifest.json')) as NexusManifest };
};
const toutes = noms.map(lire);
const regle = toutes[0].s.requiredDriverData![0].jet!.cthulhuHack!;

describe('campagnes de recette Cthulhu Hack réellement livrées', () => {
    for (const [i, { s, m, zip }] of toutes.entries()) {
        it(`${noms[i]} : manifeste et 38 médias intègres, sans réseau ni fichier absent`, () => {
            expect(nexusService.validateManifest(m)).toEqual([]);
            expect(m.campaignId).toBe(s.campaign.id);
            expect(m.assetMap).toHaveLength(38);
            for (const a of m.assetMap) {
                expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);
                const b = zip.readFile(a.relativePath)!;
                expect(b).toBeTruthy(); expect(b.length).toBe(a.sizeBytes);
                expect(createHash('sha256').update(b).digest('hex')).toBe(a.checksum);
                if (a.mimeType === 'audio/wav') { expect(b.toString('ascii', 0, 4)).toBe('RIFF'); expect(b.toString('ascii', 8, 12)).toBe('WAVE'); }
                else { expect(b.toString('utf8')).toContain('<svg'); expect(b.toString('utf8')).not.toMatch(/<script|<foreignObject|<image|href=/); }
            }
            // Le lien documentaire NotebookLM déjà porté par le pilote n'est pas un média.
            expect(nexusService.scanForRemoteUrls(s)).toEqual([s.requiredDriverData![0].defaultNotebookUrl]);
            const refs = nexusService.collectAssetPaths(s);
            const embarques = new Set(m.assetMap.map(a => a.originalRef));
            for (const r of refs) if (!r.startsWith('data:')) expect(embarques.has(r), r).toBe(true);
        });
        it(`${noms[i]} : tous les liens internes aboutissent, santé et pilote concordent`, () => {
            const personnages = s.players.flatMap(p => p.characters), pjIds = new Set(personnages.map(c => c.id));
            const pnjIds = new Set(s.entities.map(e => e.id)), lieux = new Set(s.atlasMaps.map(l => l.id));
            const scenes = new Set(s.scenes!.map(x => x.id)), actes = new Set(s.actes!.map(x => x.id)), indices = new Set(s.clues.map(x => x.id));
            const moments = new Set(s.moments!.map(x => x.id));
            for (const c of personnages) {
                expect(c.campaignId).toBe(s.campaign.id); expect(c.templateId).toBe(s.requiredTemplateData![0].id); expect(c.systemId).toBe(s.campaign.system);
                expect(c.hp).toBe(c.sheetData.hp); expect(c.healthSystem!.data.current).toBe(c.hp); expect(c.maxHp).toBe(c.healthSystem!.data.max);
            }
            const idLocaux = [s.campaign.id, ...pjIds, ...pnjIds, ...lieux, ...scenes, ...actes, ...indices, ...moments];
            expect(new Set(idLocaux).size).toBe(idLocaux.length);
            for (const sc of s.scenes!) {
                expect(sc.campaignId).toBe(s.campaign.id); expect(actes.has(sc.acteId)).toBe(true); expect(lieux.has(sc.lieuId!)).toBe(true);
                for (const id of sc.entiteIds) expect(pnjIds.has(id)).toBe(true);
                for (const id of sc.personnagesIds!) expect(pjIds.has(id)).toBe(true);
                for (const id of sc.indiceIds) expect(indices.has(id)).toBe(true);
                for (const lien of sc.enchainements!) expect(scenes.has(lien.vers)).toBe(true);
                if (sc.momentDeStoryboardId) expect(moments.has(sc.momentDeStoryboardId)).toBe(true);
            }
            for (const e of [...personnages, ...s.entities]) for (const r of e.relations ?? []) expect((r.targetType === 'pc' ? pjIds : pnjIds).has(r.targetId)).toBe(true);
            for (const c of s.clues) { expect(lieux.has(c.locationId!)).toBe(true); expect(pnjIds.has(c.ownerId!)).toBe(true); }
            for (const r of s.rencontres!) { expect(scenes.has(r.sceneId!)).toBe(true); for (const l of r.lignes) if (l.genre === 'entite') expect(pnjIds.has(l.entiteId)).toBe(true); }
            expect(controlerLePilote(s.requiredDriverData![0], s.requiredTemplateData![0])).toEqual([]);
            expect(modulesDuPilote(s.requiredDriverData![0]).modules).toEqual([]);
        });
    }
    it('les laboratoires partagent seulement les trois joueurs et le pilote, pas leurs personnages', () => {
        const ids = toutes[0].s.players.map(p => p.id);
        expect(toutes.map(x => x.s.players.flatMap(p => p.characters).length)).toEqual([3, 15, 12]);
        for (const { s } of toutes) {
            expect(s.players.map(p => p.id)).toEqual(ids);
            expect(s.players.map(p => p.realName)).toEqual(['Thomas D.', 'Marie C.', 'Lucas R.']);
        }
        const pj = toutes.flatMap(x => x.s.players.flatMap(p => p.characters.map(c => c.id)));
        expect(new Set(pj).size).toBe(30);
    });
    it('les trois archives se rattachent aux joueurs existants relevés dans l’export RDD', () => {
        const inventaire = JSON.parse(fs.readFileSync(path.join(dossier, 'inventaire.json'), 'utf8'));
        expect(inventaire.rattachement.source).toBe('Export Dirvers/RDD_campagne_gmos_1792944586235.gmos');
        for (const { s } of toutes) {
            expect(s.players.map(p => [p.id, p.realName])).toEqual([
                ['p-1', 'Thomas D.'], ['p-2', 'Marie C.'], ['p-3', 'Lucas R.'],
            ]);
            expect(s.players.flatMap(p => p.characters).every(c => c.id.startsWith('recette-ch-'))).toBe(true);
        }
    });
    it('Hors Jeu : les pertes invalides sont refusées, les pertes et récupérations valides ne doublent pas', () => {
        const pj = toutes[1].s.players.flatMap(p => p.characters);
        const f = structuredClone(pj.find(c => c.name.startsWith('HJ02'))!.sheetData);
        const c = lireCH(f).consequences[0];
        expect(() => appliquerPertesCH(regle, f, c.id, { force: 6 })).toThrow();
        const applique = appliquerPertesCH(regle, f, c.id, { force: 3, sagesse: 3 });
        expect(applique.force).toBe(Number(f.force) - 3);
        expect(() => appliquerPertesCH(regle, applique, c.id, { force: 3, sagesse: 3 })).toThrow();
        const vivant = recupererCH(regle, applique, c.id, 3, 12, true);
        expect(vivant.hp).toBe(3); expect(() => recupererCH(regle, vivant, c.id, 3, 12, true)).toThrow();
        const mort = pj.find(c => c.name.startsWith('HJ01'))!;
        expect(lireCH(mort.sheetData).mort).toBe(true); expect(mort.healthSystem!.state).toBe('dead');
        expect(modificateursCH(regle, mort.sheetData, 'force').indisponible).toBe(true);
    });
    it('douze effets réellement préparés : intensité, échéances et double borne sont exploitables', () => {
        const pj = toutes[2].s.players.flatMap(p => p.characters);
        expect(new Set(pj.map(c => lireCH(c.sheetData).effets[0].nom)).size).toBe(12);
        const tremble = pj.find(c => c.name.startsWith('C1'))!.sheetData;
        expect(modificateursCH(regle, tremble, 'force').malus).toBe(2);
        expect(modificateursCH(regle, avancerCH(tremble, 'moment', 1, 'm1'), 'force').malus).toBe(1);
        expect(modificateursCH(regle, avancerCH(tremble, 'moment', 2, 'm2'), 'force').malus).toBe(0);
        const evanoui = pj.find(c => c.name.startsWith('F2'))!.sheetData;
        const temps = avancerCH(evanoui, 'minute', 2, 't1');
        expect(modificateursCH(regle, temps, 'sagesse').indisponible).toBe(true);
        expect(modificateursCH(regle, avancerCH(temps, 'scene', 1, 's1'), 'sagesse').indisponible).toBe(false);
    });
    it('la copie et Rejouer suivent le vrai code Nexus, sans conserver des renvois à l’original', () => {
        const s = toutes[0].s;
        let n = 0;
        const copie = nexusService.applyResolutionToState(s, { strategy: 'clone' }, true, p => `${p}-recette-${++n}`);
        expect(copie.campaign.id).not.toBe(s.campaign.id);
        expect(copie.scenes!.every(sc => sc.campaignId === copie.campaign.id)).toBe(true);
        expect(copie.scenes!.find(sc => sc.momentDeStoryboardId)!.momentDeStoryboardId).toBe(copie.moments![0].id);
        expect(copie.players.flatMap(p => p.characters).every(c => c.campaignId === copie.campaign.id)).toBe(true);
        const reprise = nexusService.applyResolutionToState(s, { strategy: 'rejouer' });
        expect(reprise.sessions).toEqual([]); expect(reprise.clues.every(c => !c.isRevealed)).toBe(true);
        expect(reprise.players.flatMap(p => p.characters.map(c => c.sheetData))).toEqual(s.players.flatMap(p => p.characters.map(c => c.sheetData)));
    });
    it('les trois tables originales entrent dans le lecteur réel de Table-OS', () => {
        for (const nom of fs.readdirSync(path.join(dossier, 'tables-a-importer'))) {
            const lecture = lireDuJson(fs.readFileSync(path.join(dossier, 'tables-a-importer', nom), 'utf8'))!;
            expect(lecture).toBeTruthy(); expect(lecture.ignorees).toEqual([]);
            expect(lecture.entrees.map(e => [e.min, e.max])).toEqual([1, 2, 3, 4, 5, 6].map(n => [n, n]));
            expect(lecture.nom).toContain('RECETTE Port-Lenoir');
            if (nom.includes('objets')) expect(lecture.entrees.every(e => e.butin?.length === 1)).toBe(true);
        }
    });
    it('le cahier livre 59 cas non cochés, avec préconditions et résultats attendus', () => {
        const cas = JSON.parse(fs.readFileSync(path.join(dossier, 'cas-de-recette.json'), 'utf8')) as { id: string; precondition: string; action: string; attendu: string }[];
        expect(cas).toHaveLength(59); expect(new Set(cas.map(c => c.id)).size).toBe(59);
        expect(cas.every(c => c.precondition && c.action && c.attendu)).toBe(true);
        expect(fs.readFileSync(path.join(dossier, 'resultats.csv'), 'utf8').split(/\r?\n/).filter(l => l.endsWith(';"NON TESTÉ";"";""'))).toHaveLength(59);
    });
});
