import fs from 'node:fs';
import path from 'node:path';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import AdmZip from 'adm-zip';
import {describe,it,expect,vi} from 'vitest';
import {nexusService} from '../../src/modules/system/archive/NexusService';
import type {NexusCampaignState,NexusManifest} from '../../src/modules/system/archive/nexus.types';
import {controlerLePilote} from '../../src/modules/forge/rules/controlesDuPilote';
import {jetDeNephilim,malusDesConsequences,etatDesChutes,miseEnJeuPossible,optionsDEncaissement,bonusDuLieu,testDeStase,coutDeLExperience} from '../../src/modules/dice/systemes/nephilimRegles';
import {cibleDeNephilim} from '../../src/modules/dice/systemes/nephilim';
import {consommationsDuJet} from '../../src/modules/dice/consommationAuJet';
import {modulesDuPilote} from '../../src/modules/modulesDuJeu/catalogue';
import {lireDuJson} from '../../src/modules/tables/logic/collageDUneTable';
vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
const dossier='output/campagnes-tests/nephilim',noms=['01-Le-Meridien-de-verre','02-Sante-Chutes-et-Stase','03-Arts-et-Ressources'];
const toutes=noms.map(n=>{const z=new AdmZip(path.join(dossier,n+'.gmos'));return {z,s:JSON.parse(z.readAsText('state.json')) as NexusCampaignState,m:JSON.parse(z.readAsText('manifest.json')) as NexusManifest};});
const pilot=toutes[0].s.requiredDriverData![0],fiche=toutes[0].s.requiredTemplateData![0],regle=pilot.jet!.nephilim!;
const pcs=(i:number)=>toutes[i].s.players.flatMap(p=>p.characters);
const d=(code:string)=>pcs(code.startsWith('S')?1:2).find(c=>c.name.startsWith(code))!.sheetData;
const jet=(v:Record<string,unknown>,vecu:string,approche:string,autres:Record<string,string>={},choix={})=>jetDeNephilim(regle,v,{vecu,approche,...autres},choix,Number(v[vecu]),fiche.sections);
describe('lot Nephilim livré',()=>{
    for(const [i,{s,m,z}]of toutes.entries()){
        it(`${noms[i]} : manifeste, médias et références intègres`,()=>{
            expect(nexusService.validateManifest(m)).toEqual([]);expect(m.campaignId).toBe(s.campaign.id);expect(m.assetMap).toHaveLength(39);
            for(const a of m.assetMap){const b=z.readFile(a.relativePath)!;expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);expect(b.length).toBe(a.sizeBytes);expect(createHash('sha256').update(b).digest('hex')).toBe(a.checksum);if(a.mimeType==='audio/wav')expect(b.toString('ascii',8,12)).toBe('WAVE');else expect(b.toString('utf8')).not.toMatch(/<script|<foreignObject|<image|href=/);}
            const refs=new Set(m.assetMap.map(a=>a.originalRef));for(const r of nexusService.collectAssetPaths(s))if(!r.startsWith('data:'))expect(refs.has(r),r).toBe(true);expect(nexusService.scanForRemoteUrls(s).filter(u=>u!==s.requiredDriverData![0].defaultNotebookUrl)).toEqual([]);
        });
        it(`${noms[i]} : santé native et références de fiction valides`,()=>{
            const pj=s.players.flatMap(p=>p.characters),pc=new Set(pj.map(c=>c.id)),npc=new Set(s.entities.map(e=>e.id)),lieux=new Set(s.atlasMaps.map(l=>l.id)),sc=new Set(s.scenes!.map(x=>x.id)),ac=new Set(s.actes!.map(x=>x.id)),cl=new Set(s.clues.map(x=>x.id)),mo=new Set(s.moments!.map(x=>x.id));
            for(const c of [...pj,...s.entities]){expect(c.campaignId).toBe(s.campaign.id);expect(c.healthSystem!.type).toBe('boxes');expect(c.hp).toBeUndefined();expect(c.maxHp).toBeUndefined();for(const r of c.relations??[])expect((r.targetType==='pc'?pc:npc).has(r.targetId)).toBe(true);}
            for(const x of s.scenes!){expect(ac.has(x.acteId)).toBe(true);expect(lieux.has(x.lieuId!)).toBe(true);for(const id of x.personnagesIds!)expect(pc.has(id)).toBe(true);for(const id of x.entiteIds)expect(npc.has(id)).toBe(true);for(const id of x.indiceIds)expect(cl.has(id)).toBe(true);for(const e of x.enchainements!)expect(sc.has(e.vers)).toBe(true);if(x.momentDeStoryboardId)expect(mo.has(x.momentDeStoryboardId)).toBe(true);}for(const c of s.clues){expect(lieux.has(c.locationId!)).toBe(true);expect(npc.has(c.ownerId!)).toBe(true);}
            expect(controlerLePilote(s.requiredDriverData![0],s.requiredTemplateData![0])).toEqual([]);
        });
        it(noms[i]+' : valeurs typées, sans module incompatible',()=>{
            expect(modulesDuPilote(s.requiredDriverData![0]).modules).toEqual([]);expect(s.modulesDuJeu).toBeUndefined();
            const champs=new Map(fiche.sections.flatMap(s=>s.fields).map(f=>[f.id,f]));
            for(const c of [...s.players.flatMap(p=>p.characters),...s.entities])for(const [k,v]of Object.entries(c.sheetData!)){
                expect(champs.has(k),k).toBe(true);const f=champs.get(k)!;
                if(v!==''&&v!==undefined){if(['number','gauge','formula'].includes(f.type))expect(Number.isFinite(Number(v)),k).toBe(true);if(f.type==='checkbox')expect(typeof v,k).toBe('boolean');if(f.type==='select'&&f.options?.length)expect(f.options,k).toContain(v);}
            }
        });
    }
    it('quinze nouveaux PJ pour les trois joueurs existants',()=>{expect(toutes.map(t=>t.s.players.flatMap(p=>p.characters).length)).toEqual([3,9,3]);for(const {s}of toutes)expect(s.players.map(p=>[p.id,p.realName])).toEqual([['p-1','Thomas D.'],['p-2','Marie C.'],['p-3','Lucas R.']]);expect(new Set(toutes.flatMap(t=>t.s.players.flatMap(p=>p.characters.map(c=>c.id)))).size).toBe(15);});
    it('les trois Arts et leurs pouvoirs fictifs sont identifiés',()=>{const v=pcs(0).map(c=>c.sheetData);expect(v.map(x=>x.ka_dominant)).toEqual(['Feu','Eau','Terre']);expect(v[0].magic_spells_0_name).toContain('RECETTE');expect(v[1].kabbalah_invocations_0_name).toContain('RECETTE');expect(v[2].alchemy_formulas_0_name).toContain('RECETTE');expect(v[2].alchemy_materia_water).toBe(8);expect(v[2].alchemy_materia_water_max).toBe(8);});
    it('les Vécus passés portent une époque du référentiel',()=>{const refs=JSON.parse(fs.readFileSync('docs/systems/nephilim/vecus/index.json','utf8')).entrees;for(const c of pcs(0))for(const i of [0,1]){const v=c.sheetData,r=refs.find((r:{nom:string})=>r.nom===v['pastlives_'+i+'_name']);expect(r).toBeDefined();expect(v['incarnations_'+i+'_era']).toBe(r.details['Époque']);}});
    it('huit contextes et six réserves se règlent dans les bornes du pilote',()=>{const cs=JSON.parse(fs.readFileSync(path.join(dossier,'CONTEXTE-DES-LIEUX.json'),'utf8'));expect(cs).toHaveLength(8);for(const c of cs)expect(toutes[0].s.atlasMaps.some(l=>l.id===c.lieuId)).toBe(true);for(const {s}of toutes){expect(Object.keys(s.reservesDeTable!)).toHaveLength(6);expect(s.reservesDeTable!.jaugeDeTraque).toBeLessThan(s.reservesDeTable!.seuilRK);expect(s.reservesDeTable!.seuilRK).toBeGreaterThanOrEqual(2);expect(s.reservesDeTable!.seuilRK).toBeLessThanOrEqual(9);}});
    it('le HTML fournit sept pages et une correspondance Nephilim',()=>{const h=fs.readFileSync('docs/fiches/Nephilim/nephilim-legende-interactive.html','utf8');const t=JSON.parse(h.match(/<script[^>]*id=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/)![1]).template;expect(t.pages).toHaveLength(7);const champs=t.pages.flatMap((p:{fields:{key:string}[]})=>p.fields);for(const k of ['identity.name','simulacrum.name','resources.sapience'])expect(champs.some((f:{key:string})=>f.key===k)).toBe(true);});
    it('les conséquences retirent le Vécu avant le Ka',()=>{expect(malusDesConsequences(regle,d('S01'))).toEqual({physique:2,magique:0});expect(jet(d('S01'),'pastlives_0_degree','ka_water',{}, {actionPhysique:true}).vecu).toBe(2);expect(malusDesConsequences(regle,d('S02'))).toEqual({physique:0,magique:4});expect(jet(d('S02'),'occult_kabbalah_hod','ka_water').vecu).toBe(0);});
    for(const [code,vecu,approche,autres]of [['S03','occult_magic_first','ka_fire',{sort:'magic_spells_0_degree'}],['S04','occult_magic_first','ka_fire',{}],['S05','occult_alchemy_black','alchemy_constructs_retort_earth',{formule:'alchemy_formulas_0_degree'}],['S06','occult_kabbalah_hod','ka_water',{}]] as const)it(code+' : interdit du Khaïba réellement affiché',()=>expect(jet(d(code),vecu,approche,autres).avertissements.join(' ')).toContain('Khaïba'));
    it('les alertes 8/10 ne suppriment pas les personnages',()=>{expect(etatDesChutes(regle,d('S07')).alerte).toContain('8');expect(etatDesChutes(regle,d('S08')).alerte).toContain('10');expect(pcs(1)).toHaveLength(9);expect(miseEnJeuPossible(3,Boolean(d('S09').falls_khaiba_misenjeu)).possible).toBe(false);});
    it('le sacrifice exige cinq Sapiences',()=>expect(jet(d('A01'),'occult_magic_first','ka_fire',{sort:'magic_spells_0_degree'},{sacrifice:true}).sacrifice).toMatchObject({possible:false,retenu:false}));
    it('un construct blanc refuse une œuvre rouge',()=>expect(jet(d('A03'),'occult_alchemy_red','alchemy_constructs_retort_moon',{formule:'alchemy_formulas_0_degree'}).avertissements.join(' ')).toContain('supérieure'));
    it('la transmutation consomme les vraies Materiae Primae et conserve sur critique',()=>{const v=pcs(0)[2].sheetData,r={formule:'alchemy_formulas_0_degree'};expect(consommationsDuJet(pilot.jet!.consommation,r,v,'reussite-normale')).toMatchObject([{champ:'alchemy_materia_water',avant:8,apres:6,quantite:2,manque:0}]);expect(consommationsDuJet(pilot.jet!.consommation,r,v,'reussite-particuliere')).toMatchObject([{conservee:true}]);expect(consommationsDuJet(pilot.jet!.consommation,r,d('A03'),'echec-normal')).toMatchObject([{champ:'alchemy_materia_moon',avant:1,apres:0,quantite:4,manque:3}]);});
    it('Nexus, stase et progression utilisent les moteurs existants',()=>{expect(bonusDuLieu('Feu',6).total).toBe(3);expect(cibleDeNephilim(4,4).chances).toBe(80);expect(testDeStase(4,22).reussi).toBe(true);expect(testDeStase(4,99).reussi).toBe(false);expect(coutDeLExperience(6)).toBe(10);expect(optionsDEncaissement(regle.sante!.physique!,pcs(0)[0].sheetData,3,2).length).toBeGreaterThan(0);});
    it('le clone ne garde aucun lien de personnage vers la campagne source',()=>{let n=0;const s=nexusService.applyResolutionToState(toutes[0].s,{strategy:'clone'},true,p=>p+'-clone-'+(++n));expect(s.campaign.id).not.toBe(toutes[0].s.campaign.id);for(const p of s.players)for(const c of p.characters)expect(c.campaignId).toBe(s.campaign.id);});
    it('trois tables originales et 70 cas encore vierges',()=>{for(const n of fs.readdirSync(path.join(dossier,'tables-a-importer'))){const t=lireDuJson(fs.readFileSync(path.join(dossier,'tables-a-importer',n),'utf8'))!;expect(t.ignorees).toEqual([]);expect(t.entrees.map(e=>[e.min,e.max])).toEqual([1,2,3,4,5,6].map(n=>[n,n]));}const cs=JSON.parse(fs.readFileSync(path.join(dossier,'cas-de-recette.json'),'utf8'));expect(cs).toHaveLength(70);expect(new Set(cs.map((c:{id:string})=>c.id)).size).toBe(70);expect(fs.readFileSync(path.join(dossier,'resultats.csv'),'utf8').split(/\r?\n/).filter(l=>l.endsWith(';"NON TESTÉ";"";""'))).toHaveLength(70);});
});
