import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import AdmZip from 'adm-zip';
import { describe, it, expect, vi } from 'vitest';
import { nexusService } from '../../src/modules/system/archive/NexusService';
import type { NexusCampaignState, NexusManifest } from '../../src/modules/system/archive/nexus.types';
import { validerSauvegardeDesModules } from '../../src/modules/modulesDuJeu/protocole';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';
import { lireFicheDeVoyageur } from '../../src/modules/session/logic/ficheDeVoyageur';
import { lireSanteVoyageur, projeterSanteVoyageur } from '../../src/modules/session/logic/santeDuVoyageur';
import { lireDuJson } from '../../src/modules/tables/logic/collageDUneTable';
import { rencontreDuD100, NOM_DES_TERRES } from '../../src/modules/dice/systemes/hautReve';
import { proposerCoutTMR } from '../../src/modules/session/logic/ressourcesDesTMR';
import { proposerRencontre } from '../../src/modules/session/logic/hautReveDuVoyageur';
import { appliquerOperationDeVoyageur } from '../../src/modules/session/logic/operationsDeVoyageur';
import * as tmr from '../reve-de-dragon/tmr/moteur.mjs';
import { CASES, caseDe, distance } from '../reve-de-dragon/tmr/carte.mjs';
vi.stubGlobal('Uint8Array', Object.getPrototypeOf(Buffer.prototype).constructor);
const dossier='output/campagnes-tests/reve-de-dragon',noms=['01-Le-Moulin-des-heures-oubliees','02-Corps-Repos-et-Progression','03-Haut-Reve-et-TMR'];
const toutes=noms.map(n=>{const z=new AdmZip(path.join(dossier,n+'.gmos'));return {z,s:JSON.parse(z.readAsText('state.json')) as NexusCampaignState,m:JSON.parse(z.readAsText('manifest.json')) as NexusManifest};});
const etat=(s:NexusCampaignState)=>s.modulesDuJeu!['rdd-tmr'].donnees as tmr.EtatTMR;
describe('archives Rêve de Dragon livrées',()=>{
    for(const [i,{s,m,z}]of toutes.entries()){
        it(`${noms[i]} : manifeste, médias et références embarquées intègres`,()=>{
            expect(nexusService.validateManifest(m)).toEqual([]);expect(m.campaignId).toBe(s.campaign.id);expect(m.assetMap).toHaveLength(39);
            for(const a of m.assetMap){const b=z.readFile(a.relativePath)!;expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);expect(b.length).toBe(a.sizeBytes);expect(createHash('sha256').update(b).digest('hex')).toBe(a.checksum);if(a.mimeType==='audio/wav')expect(b.toString('ascii',8,12)).toBe('WAVE');else expect(b.toString('utf8')).not.toMatch(/<script|<foreignObject|<image|href=/);}
            const refs=new Set(m.assetMap.map(a=>a.originalRef));for(const r of nexusService.collectAssetPaths(s))if(!r.startsWith('data:'))expect(refs.has(r),r).toBe(true);
            expect(nexusService.scanForRemoteUrls(s).filter(u=>u!==s.requiredDriverData![0].defaultNotebookUrl)).toEqual([]);
        });
        it(`${noms[i]} : fiches recalculées, santé réelle et fiction liée`,()=>{
            const pj=s.players.flatMap(p=>p.characters),pc=new Set(pj.map(c=>c.id)),npc=new Set(s.entities.map(e=>e.id)),lieux=new Set(s.atlasMaps.map(l=>l.id)),sc=new Set(s.scenes!.map(x=>x.id)),ac=new Set(s.actes!.map(x=>x.id)),cl=new Set(s.clues.map(x=>x.id)),mo=new Set(s.moments!.map(x=>x.id));
            for(const c of [...pj,...s.entities]){const d=c.sheetData!;expect(c.campaignId).toBe(s.campaign.id);expect(lireFicheDeVoyageur(s.requiredTemplateData![0],d).changements).toEqual([]);expect(c.hp).toBe(d.vie);expect(c.maxHp).toBe(d.vie_max);expect(c.healthSystem).toEqual(projeterSanteVoyageur(d));expect(lireSanteVoyageur(d)).not.toBeNull();for(const r of c.relations??[])expect((r.targetType==='pc'?pc:npc).has(r.targetId)).toBe(true);}
            for(const x of s.scenes!){expect(ac.has(x.acteId)).toBe(true);expect(lieux.has(x.lieuId!)).toBe(true);for(const id of x.personnagesIds!)expect(pc.has(id)).toBe(true);for(const id of x.entiteIds)expect(npc.has(id)).toBe(true);for(const id of x.indiceIds)expect(cl.has(id)).toBe(true);for(const e of x.enchainements!)expect(sc.has(e.vers)).toBe(true);if(x.momentDeStoryboardId)expect(mo.has(x.momentDeStoryboardId)).toBe(true);}
            for(const c of s.clues){expect(lieux.has(c.locationId!)).toBe(true);expect(npc.has(c.ownerId!)).toBe(true);}for(const t of s.timelineEvents)expect(Number.isFinite(Date.parse(t.date))).toBe(true);
            expect(controlerLePilote(s.requiredDriverData![0],s.requiredTemplateData![0])).toEqual([]);
        });
        it(`${noms[i]} : TMR valides, préparées et sans voyage démarré`,()=>{
            validerSauvegardeDesModules({version:1,campagnes:{[s.campaign.id]:s.modulesDuJeu}});const e=etat(s);tmr.validerEtat(e);
            expect(s.requiredDriverData![0].modulesDuJeu).toContainEqual({id:'rdd-tmr'});
            const pcs=s.players.flatMap(p=>p.characters);expect(e.voyageurs.map(v=>v.id).sort()).toEqual(pcs.map(c=>c.id).sort());
            for(const v of e.voyageurs){expect(caseDe(v.position!)).toBeTruthy();expect(v).toMatchObject({present:false,demande:null,ecriture:null,rencontre:'',notes:[]});expect(v.preparation).toContain('SECRET_MODULE_RDD');}
        });
    }
    it('réutilise p-1/p-2/p-3 pour quinze nouveaux personnages',()=>{
        expect(toutes.map(t=>t.s.players.flatMap(p=>p.characters).length)).toEqual([3,9,3]);for(const {s}of toutes)expect(s.players.map(p=>[p.id,p.realName])).toEqual([['p-1','Thomas D.'],['p-2','Marie C.'],['p-3','Lucas R.']]);
        expect(new Set(toutes.flatMap(t=>t.s.players.flatMap(p=>p.characters.map(c=>c.id)))).size).toBe(15);
        expect(toutes[0].s.players.map(p=>p.characters[0].sheetData.reve_pts)).toEqual([12,12,12]);
    });
    it('les blessures et le coma du laboratoire sont réels et ne déclarent pas de mort',()=>{
        const pcs=toutes[1].s.players.flatMap(p=>p.characters);for(const [code,gravite]of [['B03','legere'],['B04','grave'],['B05','critique']]){const c=pcs.find(c=>c.name.startsWith(code))!;expect(lireSanteVoyageur(c.sheetData)!.blessures[0].gravite).toBe(gravite);}
        const c=pcs.find(c=>c.name.startsWith('B05'))!;expect(c.healthSystem!.state).toBe('critical');expect(c.healthSystem!.data.rdd).toMatchObject({coma:true,mort:false});
        expect(pcs.find(c=>c.name.startsWith('B02'))!.healthSystem!.data.rdd).toMatchObject({inconscient:true,mort:false});
    });
    it('le laboratoire conserve rêve insuffisant, refoulement et rêve supérieur au seuil',()=>{
        const pcs=toutes[2].s.players.flatMap(p=>p.characters);expect(pcs.find(c=>c.name.startsWith('T01'))!.sheetData.reve_pts).toBe(1);expect(pcs.find(c=>c.name.startsWith('T02'))!.sheetData.__rddHautReve231).toMatchObject({refoulement:2,actifs:[]});expect(pcs.find(c=>c.name.startsWith('T03'))!.sheetData.reve_pts).toBe(20);
    });
    it('les 14 tables Table-OS couvrent les 1400 tirages du moteur sans trou',()=>{
        expect(fs.readdirSync(path.join(dossier,'tables-a-importer'))).toHaveLength(14);
        for(const genre of Object.keys(NOM_DES_TERRES) as (keyof typeof NOM_DES_TERRES)[]){const lu=lireDuJson(fs.readFileSync(path.join(dossier,'tables-a-importer',`TMR-${genre}.json`),'utf8'))!;expect(lu.ignorees).toEqual([]);for(let n=1;n<=100;n++){const hits=lu.entrees.filter(e=>e.min<=n&&n<=e.max);expect(hits).toHaveLength(1);expect(hits[0].title).toBe(rencontreDuD100(genre,n).nom);expect(hits[0].description).toContain(rencontreDuD100(genre,n).force);}}
    });
    it('carte officielle et trajet G4/H4 sont ceux du module',()=>{
        expect(CASES).toHaveLength(189);expect(distance('G4','H4')).toBe(1);expect(toutes[0].s.players.map(p=>etat(toutes[0].s).voyageurs.find(v=>v.id===p.characters[0].id)!.position)).toEqual(['G4','J4','D13']);
        expect(createHash('sha256').update(fs.readFileSync('outils/reve-de-dragon/tmr/images/carte-officielle.jpg')).digest('hex')).toBe('59403e4c090105079b9c07d7fdba3ce4e23bed57c7430390e5689348f1df76dd');
    });
    it('chaque projection TMR contient seulement le demi-rêve du lecteur et masque la préparation',()=>{
        const e=etat(toutes[0].s);for(const v of e.voyageurs){const vu=tmr.vuePour(e,{role:'joueur',personnageId:v.id}) as tmr.VueTMRJoueur;expect(vu.voyageur.id).toBe(v.id);expect(JSON.stringify(vu)).not.toContain('SECRET_MODULE_RDD');for(const autre of e.voyageurs.filter(x=>x.id!==v.id))expect(JSON.stringify(vu)).not.toContain(autre.id);}
    });
    it('la montée proposée coûte 1 rêve/1 fatigue et les préconditions sont satisfaites',()=>{
        const c=toutes[0].s.players[0].characters[0],v=etat(toutes[0].s).voyageurs[0],d={operationId:'essai',etape:v.etape,action:'monter' as const,cible:v.position!,rythme:'normal' as const};const p=proposerCoutTMR(c,d);
        expect(p.maj).toMatchObject({reve_pts:11,fatigue:1});
    });
    it('Cloner remappe les voyageurs du module vers les PJ clonés',()=>{
        let n=0;const s=nexusService.applyResolutionToState(toutes[0].s,{strategy:'clone'},true,p=>`${p}-copie-${++n}`),pcs=s.players.flatMap(p=>p.characters.map(c=>c.id));expect(etat(s).voyageurs.map(v=>v.id).sort()).toEqual(pcs.sort());tmr.validerEtat(etat(s));
    });
    it('le Messager de la table peut être laissé passer sans coût supplémentaire de rêve',()=>{
        const d=toutes[0].s.players[0].characters[0].sheetData;const p=proposerRencontre(d,{genre:'sanctuaire',d100:25,force:4,choix:'laisser'},'recette-messager');const apres=appliquerOperationDeVoyageur(d,p)!;expect(apres.reve_pts).toBe(12);expect(appliquerOperationDeVoyageur(apres,p)).toBeNull();
    });
    it('livre 69 essais non validés et un parcours TMR explicite',()=>{
        const cs=JSON.parse(fs.readFileSync(path.join(dossier,'cas-de-recette.json'),'utf8'));expect(cs).toHaveLength(69);expect(new Set(cs.map((c:{id:string})=>c.id)).size).toBe(69);expect(fs.readFileSync(path.join(dossier,'resultats.csv'),'utf8').split(/\r?\n/).filter(l=>l.endsWith(';"NON TESTÉ";"";""'))).toHaveLength(69);expect(fs.readFileSync(path.join(dossier,'PARCOURS-TMR.md'),'utf8')).toContain('Rêve 12 → 11');
    });
});
