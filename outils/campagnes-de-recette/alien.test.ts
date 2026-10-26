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
import { lireLaPaniqueAlien } from '../../src/modules/dice/systemes/paniqueAlien';
import { lireDuJson } from '../../src/modules/tables/logic/collageDUneTable';
import * as maman from '../alien/modules/muthur/moteur.mjs';
import * as radar from '../alien/modules/detecteur/moteur.mjs';
import * as spatial from '../alien/modules/combat-spatial/moteur.mjs';
vi.stubGlobal('Uint8Array', Object.getPrototypeOf(Buffer.prototype).constructor);
const dossier = 'output/campagnes-tests/alien';
const noms = ['01-La-derniere-releve', '02-Corps-Panique-et-Survie', '03-M314-Terminal-et-Vaisseaux'];
const toutes = noms.map(n => { const z = new AdmZip(path.join(dossier,n+'.gmos')); return {z,s:JSON.parse(z.readAsText('state.json')) as NexusCampaignState,m:JSON.parse(z.readAsText('manifest.json')) as NexusManifest}; });
const moduleDe = (s: NexusCampaignState, id: string) => s.modulesDuJeu![id].donnees;
describe('lot de recette ALIEN effectivement livré',()=>{
    for (const [i,{s,m,z}] of toutes.entries()) {
        it(`${noms[i]} : manifeste valide, 39 médias présents et intègres`,()=>{
            expect(nexusService.validateManifest(m)).toEqual([]);expect(m.campaignId).toBe(s.campaign.id);expect(m.assetMap).toHaveLength(39);
            for(const a of m.assetMap){const b=z.readFile(a.relativePath)!;expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);expect(b.length).toBe(a.sizeBytes);expect(createHash('sha256').update(b).digest('hex')).toBe(a.checksum);
                if(a.mimeType==='audio/wav')expect(b.toString('ascii',8,12)).toBe('WAVE');else expect(b.toString('utf8')).not.toMatch(/<script|<foreignObject|<image|href=/);}
            const refs=new Set(m.assetMap.map(a=>a.originalRef));for(const r of nexusService.collectAssetPaths(s))if(!r.startsWith('data:'))expect(refs.has(r),r).toBe(true);
            expect(nexusService.scanForRemoteUrls(s).filter(u=>u!==s.requiredDriverData![0].defaultNotebookUrl)).toEqual([]);
        });
        it(`${noms[i]} : santé et références de la fiction cohérentes`,()=>{
            const pj=s.players.flatMap(p=>p.characters),pc=new Set(pj.map(c=>c.id)),npc=new Set(s.entities.map(e=>e.id)),lieux=new Set(s.atlasMaps.map(l=>l.id)),sc=new Set(s.scenes!.map(x=>x.id)),ac=new Set(s.actes!.map(x=>x.id)),cl=new Set(s.clues.map(x=>x.id)),mo=new Set(s.moments!.map(x=>x.id));
            for(const c of [...pj,...s.entities]){expect(c.campaignId).toBe(s.campaign.id);expect(c.hp).toBe(c.sheetData!.sante);expect(c.maxHp).toBe(c.sheetData!.force);expect(c.healthSystem!.data.current).toBe(c.hp);expect(c.healthSystem!.data.max).toBe(c.maxHp);if(c.hp===0)expect(c.healthSystem!.state).toBe('critical');for(const r of c.relations??[])expect((r.targetType==='pc'?pc:npc).has(r.targetId)).toBe(true);}
            for(const x of s.scenes!){expect(ac.has(x.acteId)).toBe(true);expect(lieux.has(x.lieuId!)).toBe(true);for(const id of x.personnagesIds!)expect(pc.has(id)).toBe(true);for(const id of x.entiteIds)expect(npc.has(id)).toBe(true);for(const id of x.indiceIds)expect(cl.has(id)).toBe(true);for(const e of x.enchainements!)expect(sc.has(e.vers)).toBe(true);if(x.momentDeStoryboardId)expect(mo.has(x.momentDeStoryboardId)).toBe(true);}
            for(const c of s.clues){expect(lieux.has(c.locationId!)).toBe(true);expect(npc.has(c.ownerId!)).toBe(true);}for(const t of s.timelineEvents)expect(Number.isFinite(Date.parse(t.date))).toBe(true);
            expect(controlerLePilote(s.requiredDriverData![0],s.requiredTemplateData![0])).toEqual([]);
        });
        it(`${noms[i]} : trois modules valides avec postes, porteur et opérateurs rattachés aux PJ locaux`,()=>{
            validerSauvegardeDesModules({version:1,campagnes:{[s.campaign.id]:s.modulesDuJeu}});
            const m=moduleDe(s,'alien-muthur') as maman.EtatMuthur,d=moduleDe(s,'alien-detecteur') as radar.EtatDetecteur,v=moduleDe(s,'alien-combat-spatial') as spatial.EtatCombatSpatial;
            maman.validerEtat(m);radar.validerEtat(d);spatial.validerEtat(v);
            const ids=new Set(s.players.flatMap(p=>p.characters.map(c=>c.id)));
            expect(Object.keys(m.players)).toHaveLength(3);for(const id of Object.keys(m.players))expect(ids.has(id)).toBe(true);
            expect(m.actes.map(a=>a.objectifs.length)).toEqual([3,3,3]);expect(m.actes.every(a=>a.objectifs.every(o=>!o.remis)&&a.dossiers.every(d=>!d.publie))).toBe(true);
            expect(m.countdown).toBeNull();expect(m.autodestruction).toBeNull();expect(d.tracker.power).toBe(false);expect(d.discret.dernierScan).toBeNull();expect(d.discret.zones).toHaveLength(8);expect(d.discret.pions).toHaveLength(7);expect(ids.has(d.discret.porteurId)).toBe(true);
            expect(v.vaisseaux).toHaveLength(2);for(const p of Object.values(v.vaisseaux[0].postes))if(p.personnageId)expect(ids.has(p.personnageId)).toBe(true);
        });
    }
    it('réutilise les trois joueurs existants et distingue quinze nouveaux PJ',()=>{
        expect(toutes.map(t=>t.s.players.flatMap(p=>p.characters).length)).toEqual([3,9,3]);
        for(const {s}of toutes)expect(s.players.map(p=>[p.id,p.realName])).toEqual([['p-1','Thomas D.'],['p-2','Marie C.'],['p-3','Lucas R.']]);
        const ids=toutes.flatMap(t=>t.s.players.flatMap(p=>p.characters.map(c=>c.id)));expect(new Set(ids).size).toBe(15);
    });
    it('les Paniques 7/10/13 sont de vrais états du moteur et le synthétique reste sans Stress',()=>{
        const pcs=toutes[1].s.players.flatMap(p=>p.characters);
        for(const [code,n]of [['B01',7],['B02',10],['B03',13]] as const){const c=pcs.find(c=>c.name.startsWith(code))!;expect(lireLaPaniqueAlien(c.sheetData).effet!.total).toBe(n);expect(c.sheetData.panique_en_cours).toBe(n);}
        expect(lireLaPaniqueAlien(pcs.find(c=>c.name.startsWith('B03'))!.sheetData).traumaEnAttente).toBe(true);
        const synth=pcs.find(c=>c.name.startsWith('B04'))!;expect(synth.sheetData.androide).toBe(true);expect(synth.sheetData.niveau_de_stress).toBe(0);
    });
    it('MU/TH/UR cache le dossier admin et les objectifs puis remet le bon objectif à un seul opérateur',()=>{
        let m=structuredClone(moduleDe(toutes[0].s,'alien-muthur')) as maman.EtatMuthur;const ids=Object.keys(m.players);
        const joueur={role:'joueur' as const,personnageId:ids[0]};
        expect(JSON.stringify(maman.vuePour(m,joueur))).not.toContain('SECRET_MODULE_ALIEN');
        expect(JSON.stringify(maman.vuePour(m,joueur))).not.toContain(m.actes[0].objectifs[1].texte);
        const charge={scenario:m.actes[0].scenario,acte:1,personnageId:ids[0]};
        m=maman.appliquerCommande(m,{id:'remettre-objectif-acte',charge},{role:'mj'});
        expect(JSON.stringify(maman.vuePour(m,joueur))).toContain(m.actes[0].objectifs[0].texte);
        expect(JSON.stringify(maman.vuePour(m,{role:'joueur',personnageId:ids[1]}))).not.toContain(m.actes[0].objectifs[0].texte);
        expect(()=>maman.appliquerCommande(m,{id:'remettre-objectif-acte',charge},{role:'mj'})).toThrow();
    });
    it('le parcours M314 livré donne Gaine, Coursive puis Mess sans identités privées ni second scan',()=>{
        let d=structuredClone(moduleDe(toutes[0].s,'alien-detecteur')) as radar.EtatDetecteur;
        const cmd=(id:radar.CommandeDetecteur['id'],charge:unknown)=>{d=radar.appliquerCommande(d,{id,charge} as radar.CommandeDetecteur,{role:'mj'});};
        vi.spyOn(Math,'random').mockReturnValue(0.5);
        try{
            const prefixe='recette-alien',creature=`${prefixe}-pion-creature`,samir=toutes[0].s.players[2].characters[0].id;
            cmd('deplacer-discret',{pionId:creature,zoneId:`${prefixe}-zone-gaine`,tour:1});cmd('scanner-discret',{tour:1});
            expect(d.discret.dernierScan!.echos.map(e=>[e.zone,e.nombre])).toEqual([['Gaine de maintenance',1]]);
            expect(()=>cmd('scanner-discret',{tour:1})).toThrow();
            const vu=radar.vuePour(d,{role:'joueur',personnageId:d.discret.porteurId});expect(vu.discret).toBeUndefined();expect(JSON.stringify(vu)).not.toContain('SECRET_MODULE_ALIEN');
            cmd('tour-discret',{tour:1});cmd('deplacer-discret',{pionId:samir,zoneId:`${prefixe}-zone-coursive`,tour:2});cmd('scanner-discret',{tour:2});expect(d.discret.dernierScan!.echos.map(e=>e.zone)).toEqual(['Coursive A']);
            cmd('tour-discret',{tour:2});cmd('deplacer-discret',{pionId:creature,zoneId:`${prefixe}-zone-labo`,tour:3});cmd('deplacer-discret',{pionId:creature,zoneId:`${prefixe}-zone-mess`,tour:3});cmd('scanner-discret',{tour:3});expect(d.discret.dernierScan!.echos.map(e=>e.zone)).toEqual(['Mess']);
        }finally{vi.restoreAllMocks();}
    });
    it('le laboratoire spatial est engagé et armé, le Vautour non identifié reste un contact',()=>{
        const s=moduleDe(toutes[2].s,'alien-combat-spatial') as spatial.EtatCombatSpatial;
        expect(s.combat).toMatchObject({tour:1,phase:1,etape:'ordres',distance:8});expect(s.vaisseaux.every(v=>v.armes.length===3)).toBe(true);
        const vu=spatial.vuePour(s,{role:'joueur',personnageId:toutes[2].s.players[0].characters[0].id});
        expect(JSON.stringify(vu)).not.toContain('Équipage du Vautour');expect(vu.vaisseaux.find(v=>v.camp==='adverse')!.nom).toBe('Contact non identifié');
    });
    it('Cloner remappe aussi opérateurs, porteur et postes des modules',()=>{
        const s=toutes[0].s;let n=0;const c=nexusService.applyResolutionToState(s,{strategy:'clone'},true,p=>`${p}-copie-${++n}`);
        const ids=new Set(c.players.flatMap(p=>p.characters.map(c=>c.id))),m=moduleDe(c,'alien-muthur') as maman.EtatMuthur,d=moduleDe(c,'alien-detecteur') as radar.EtatDetecteur,v=moduleDe(c,'alien-combat-spatial') as spatial.EtatCombatSpatial;
        for(const id of Object.keys(m.players))expect(ids.has(id)).toBe(true);expect(ids.has(d.discret.porteurId)).toBe(true);for(const p of Object.values(v.vaisseaux[0].postes))if(p.personnageId)expect(ids.has(p.personnageId)).toBe(true);
    });
    it('les trois tables originales sont lisibles par Table-OS',()=>{
        for(const nom of fs.readdirSync(path.join(dossier,'tables-a-importer'))){const lu=lireDuJson(fs.readFileSync(path.join(dossier,'tables-a-importer',nom),'utf8'))!;expect(lu.ignorees).toEqual([]);expect(lu.entrees.map(e=>[e.min,e.max])).toEqual([1,2,3,4,5,6].map(n=>[n,n]));}
    });
    it('le cahier contient 74 essais encore non cochés',()=>{
        const cs=JSON.parse(fs.readFileSync(path.join(dossier,'cas-de-recette.json'),'utf8')) as {id:string;precondition:string;action:string;attendu:string}[];
        expect(cs).toHaveLength(74);expect(new Set(cs.map(c=>c.id)).size).toBe(74);expect(cs.every(c=>c.precondition&&c.action&&c.attendu)).toBe(true);
        expect(fs.readFileSync(path.join(dossier,'resultats.csv'),'utf8').split(/\r?\n/).filter(l=>l.endsWith(';"NON TESTÉ";"";""'))).toHaveLength(74);
    });
});
