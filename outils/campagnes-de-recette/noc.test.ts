import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import AdmZip from 'adm-zip';
import { createHash } from 'node:crypto';
import { describe, it, expect, vi } from 'vitest';
import type { NexusCampaignState, NexusManifest } from '../../src/modules/system/archive/nexus.types';
import { nexusService } from '../../src/modules/system/archive/NexusService';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';
import { ressourcesDeLaTable, reservesDuGroupe } from '../../src/modules/table/reservesDuGroupe';
import { contactsDeCabale, depenserLesFaveurs, rechargerLesFaveurs } from '../../src/modules/table/faveursDeCabale';
import { calmeNocturne, debordementNocturne } from '../../src/modules/table/entraideNocturne';
import { malusDePeril } from '../../src/modules/dice/systemes/nocturne';
import { lireDuJson } from '../../src/modules/tables/logic/collageDUneTable';
vi.stubGlobal('Uint8Array', Object.getPrototypeOf(Buffer.prototype).constructor);
const dossier = 'output/campagnes-tests/noc';
const noms = ['01-Le-neuvieme-timbre', '02-Seuils-et-Sequelles', '03-Repos-Auras-et-Cabale'];
const toutes = noms.map(n => {
    const z = new AdmZip(path.join(dossier, n + '.gmos'));
    return { z, s: JSON.parse(z.readAsText('state.json')) as NexusCampaignState, m: JSON.parse(z.readAsText('manifest.json')) as NexusManifest };
});
const pilote = toutes[0].s.requiredDriverData![0];

describe('campagnes de recette NOC réellement livrées', () => {
    for (const [i, { s, m, z }] of toutes.entries()) {
        it(`${noms[i]} : manifeste valide et 39 médias embarqués intègres`, () => {
            expect(nexusService.validateManifest(m)).toEqual([]); expect(m.campaignId).toBe(s.campaign.id);
            expect(m.assetMap).toHaveLength(39);
            for (const a of m.assetMap) {
                expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);
                const b = z.readFile(a.relativePath)!;
                expect(b.length).toBe(a.sizeBytes); expect(createHash('sha256').update(b).digest('hex')).toBe(a.checksum);
                if (a.mimeType === 'audio/wav') expect(b.toString('ascii', 8, 12)).toBe('WAVE');
                else expect(b.toString('utf8')).not.toMatch(/<script|<foreignObject|<image|href=/);
            }
            const medias = new Set(m.assetMap.map(a => a.originalRef));
            for (const r of nexusService.collectAssetPaths(s)) if (!r.startsWith('data:')) expect(medias.has(r), r).toBe(true);
            // Le lien documentaire déjà présent sur le pilote n'est pas une dépendance média.
            const urls = nexusService.scanForRemoteUrls(s);
            expect(urls.filter(u => u !== pilote.defaultNotebookUrl)).toEqual([]);
        });
        it(`${noms[i]} : liens, pilote et santé NOC cohérents, sans PV inventés`, () => {
            const pj = s.players.flatMap(p => p.characters), pc = new Set(pj.map(c => c.id));
            const npc = new Set(s.entities.map(e => e.id)), lieux = new Set(s.atlasMaps.map(l => l.id));
            const sc = new Set(s.scenes!.map(x => x.id)), ac = new Set(s.actes!.map(x => x.id)), cl = new Set(s.clues.map(x => x.id)), mo = new Set(s.moments!.map(x => x.id));
            for (const c of [...pj, ...s.entities]) {
                expect(c.campaignId).toBe(s.campaign.id); expect(c.hp).toBeUndefined(); expect(c.maxHp).toBeUndefined();
                expect(c.healthSystem!.type).toBe('boxes');
                const boxes = c.healthSystem!.data.boxes as { filled: boolean }[];
                expect(boxes).toHaveLength(10); expect(boxes.filter(b => b.filled)).toHaveLength(Number(c.sheetData!.blessures));
                expect(c.sheetData!.hp).toBeUndefined(); expect(c.sheetData!.endurance).toBeUndefined();
                for (const r of c.relations ?? []) expect((r.targetType === 'pc' ? pc : npc).has(r.targetId)).toBe(true);
            }
            for (const scene of s.scenes!) {
                expect(ac.has(scene.acteId)).toBe(true); expect(lieux.has(scene.lieuId!)).toBe(true);
                for (const id of scene.personnagesIds!) expect(pc.has(id)).toBe(true);
                for (const id of scene.entiteIds) expect(npc.has(id)).toBe(true);
                for (const id of scene.indiceIds) expect(cl.has(id)).toBe(true);
                for (const e of scene.enchainements!) expect(sc.has(e.vers)).toBe(true);
                if (scene.momentDeStoryboardId) expect(mo.has(scene.momentDeStoryboardId)).toBe(true);
            }
            for (const c of s.clues) { expect(npc.has(c.ownerId!)).toBe(true); expect(lieux.has(c.locationId!)).toBe(true); }
            for (const e of s.timelineEvents) expect(Number.isFinite(Date.parse(e.date))).toBe(true);
            for (const r of s.rencontres!) { expect(sc.has(r.sceneId!)).toBe(true); for (const l of r.lignes) if (l.genre === 'entite') expect(npc.has(l.entiteId)).toBe(true); }
            expect(controlerLePilote(s.requiredDriverData![0], s.requiredTemplateData![0])).toEqual([]);
        });
    }
    it('réutilise p-1/p-2/p-3 et garde 18 PJ et trois campagnes distincts', () => {
        expect(toutes.map(t => t.s.players.flatMap(p => p.characters).length)).toEqual([3, 12, 3]);
        for (const { s } of toutes) expect(s.players.map(p => [p.id, p.realName])).toEqual([['p-1', 'Thomas D.'], ['p-2', 'Marie C.'], ['p-3', 'Lucas R.']]);
        const ids = toutes.flatMap(t => [t.s.campaign.id, ...t.s.players.flatMap(p => p.characters.map(c => c.id))]);
        expect(new Set(ids).size).toBe(21);
    });
    it('chaque Cabale est complète et ses Atouts produisent les vraies réserves de groupe', () => {
        const correspondance = JSON.parse(fs.readFileSync('docs/systems/noc/fiche/correspondance-groupe.json', 'utf8')) as { champs: { gmos: string }[] };
        for (const { s } of toutes) {
            const f = s.campaign.groupe!.sheetData;
            expect(f['identity.name']).toBe('Les Veilleurs du Palier');
            for (const c of correspondance.champs) expect(f).toHaveProperty([c.gmos]);
            const reserves = reservesDuGroupe(pilote, s.campaign);
            expect(reserves.find(r => r.id === 'groupe:assets.technical.clean_room')!.depart).toBe(0);
            expect(reserves.find(r => r.id === 'groupe:domains.technical')!.depart).toBe(3);
            for (const r of ressourcesDeLaTable(pilote, s.campaign)) expect(s.reservesDeTable![r.id]).toBeGreaterThanOrEqual(0);
            expect(contactsDeCabale(f).map(c => c.nom)).toEqual(['Nora Kelm', 'Vassil Dorn', 'Mina Sel']);
        }
    });
    it('les Contacts permettent une faveur 5 exacte et la recharge du laboratoire épuisé', () => {
        const f = toutes[0].s.campaign.groupe!.sheetData;
        expect(contactsDeCabale(f).map(c => c.points)).toEqual([2, 1, 2]);
        expect(depenserLesFaveurs(f, [0, 1], 5)).toBeNull();
        const maj = depenserLesFaveurs(f, [0, 1, 2], 5)!;
        expect(contactsDeCabale({ ...f, ...maj }).map(c => c.points)).toEqual([0, 0, 0]);
        const vide = toutes[2].s.campaign.groupe!.sheetData;
        expect(contactsDeCabale({ ...vide, ...rechargerLesFaveurs(vide) }).map(c => c.points)).toEqual([2, 2, 2]);
    });
    it('les douze états sont placés avant les seuils 5/8/10 des quatre périls', () => {
        const pcs = toutes[1].s.players.flatMap(p => p.characters);
        for (const [i, champ] of ['blessures', 'trauma', 'traque', 'noirceur'].entries()) for (const [j, n] of [4, 7, 9].entries()) {
            const pc = pcs.find(c => c.name.startsWith(`S${String(i * 3 + j + 1).padStart(2, '0')} `))!;
            expect(pc.sheetData[champ]).toBe(n); expect(pc.sheetData[`sequelles_${champ}`]).toBe(0);
            const avant = malusDePeril(pilote.jet!.destin!.peril!, pc.sheetData);
            const apres = malusDePeril(pilote.jet!.destin!.peril!, { ...pc.sheetData, [champ]: n + 1 });
            if (n === 4 || n === 7) expect(apres.etats.length).toBeGreaterThan(avant.etats.length);
        }
    });
    it('le laboratoire entraide exige la répartition du Soupçon et refuse la Lumière réutilisée', () => {
        const pcs = toutes[2].s.players.flatMap(p => p.characters), hs = pcs.map(c => ({ id: c.id, nom: c.name, valeurs: c.sheetData }));
        const repos = calmeNocturne(pilote.gestesDesHeros!.momentDeCalme!, hs, {}, s => s);
        expect(repos.erreurs.length).toBeGreaterThan(0); expect(repos.collectif).toBe(true);
        const e3 = pcs.find(c => c.name.startsWith('E03'))!;
        expect(repos.amputations[e3.id]).toBeLessThanOrEqual(6);
        const source = pcs.find(c => c.name.startsWith('E02'))!;
        const effet = debordementNocturne(pilote.gestesDesHeros!.effetsDuDebordement!.effets, { intervention: 1 }, hs, { lumiere: { [source.id]: { [hs[0].id]: 2, [source.id]: 2 } } }, s => s);
        expect(effet.erreurs.length).toBeGreaterThan(0);
    });
    it('copie et Rejouer gardent la Cabale et remappent les références de fiction', () => {
        const s = toutes[0].s; let i = 0;
        const clone = nexusService.applyResolutionToState(s, { strategy: 'clone' }, true, p => `${p}-noc-${++i}`);
        expect(clone.campaign.id).not.toBe(s.campaign.id); expect(clone.campaign.groupe!.sheetData).toEqual(s.campaign.groupe!.sheetData);
        expect(clone.scenes!.every(sc => sc.campaignId === clone.campaign.id)).toBe(true);
        const r = nexusService.applyResolutionToState(s, { strategy: 'rejouer' });
        expect(r.sessions).toEqual([]); expect(r.players.flatMap(p => p.characters.map(c => c.sheetData))).toEqual(s.players.flatMap(p => p.characters.map(c => c.sheetData)));
    });
    it('les trois tables originales sont acceptées par le lecteur de Table-OS', () => {
        for (const nom of fs.readdirSync(path.join(dossier, 'tables-a-importer'))) {
            const l = lireDuJson(fs.readFileSync(path.join(dossier, 'tables-a-importer', nom), 'utf8'))!;
            expect(l.ignorees).toEqual([]); expect(l.entrees.map(e => [e.min, e.max])).toEqual([1, 2, 3, 4, 5, 6].map(i => [i, i]));
        }
    });
    it('62 cas manuels et leurs résultats vierges sont livrés', () => {
        const cs = JSON.parse(fs.readFileSync(path.join(dossier, 'cas-de-recette.json'), 'utf8')) as { id: string; precondition: string; action: string; attendu: string }[];
        expect(cs).toHaveLength(62); expect(new Set(cs.map(c => c.id)).size).toBe(62);
        expect(cs.every(c => c.precondition && c.action && c.attendu)).toBe(true);
        expect(fs.readFileSync(path.join(dossier, 'resultats.csv'), 'utf8').split(/\r?\n/).filter(l => l.endsWith(';"NON TESTÉ";"";""'))).toHaveLength(62);
    });
});
