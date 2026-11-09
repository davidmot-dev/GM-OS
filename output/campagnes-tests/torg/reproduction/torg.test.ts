import fs from 'node:fs';
import path from 'node:path';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import AdmZip from 'adm-zip';
import {describe,it,expect,vi,afterAll,afterEach} from 'vitest';
import {nexusService} from '../../src/modules/system/archive/NexusService';
import type {NexusCampaignState,NexusManifest} from '../../src/modules/system/archive/nexus.types';
import {modulesDuPilote} from '../../src/modules/modulesDuJeu/catalogue';
import {casesAligneesSurLaFiche} from '../../src/modules/session/logic/HealthInterpreter';
import {impactDeTorg} from '../../src/modules/combat/logic/impactDeTorg';
import {useSessionOSStore} from '../../src/modules/session/useSessionOSStore';
import {resoudreTorg,lancerLaPossibilite,lancerUneChaine} from '../../src/modules/dice/systemes/torg';
import {possedeAtoutTorg,refusEtatTorg} from '../../src/modules/dice/systemes/torgPersonnage';
import {poserEnReserve,reprendreLesReserves,completerLesMains,momentCritique} from '../../src/modules/session/logic/cartesDuDestin';
import {echangerLesCartesTorg} from '../../src/modules/session/logic/echangesDeTorg';
import {lireLaCorrespondance,versLaFiche} from '../../src/modules/fiches/correspondanceDeFiche';
import type {DeckSessionState} from '../../src/types/deck.types';
vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
const dir='output/campagnes-tests/torg',nom='01-Les-Balises-de-l-Aube.gmos';
const z=new AdmZip(path.join(dir,nom)),s=JSON.parse(z.readAsText('state.json')) as NexusCampaignState,m=JSON.parse(z.readAsText('manifest.json')) as NexusManifest;
const pilote=s.requiredDriverData![0],fiche=s.requiredTemplateData![0],pcs=s.players.flatMap(p=>p.characters);
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const pj=(code:string)=>pcs.find(c=>c.id.endsWith('-'+code.toLowerCase()))!;
const initial=useSessionOSStore.getState();afterEach(()=>{useSessionOSStore.setState(initial,true);vi.restoreAllMocks();});
afterAll(()=>fs.writeFileSync(path.join(dir,'verification-contexte.json'),JSON.stringify({archives:[{fichier:nom,sha256:hash(fs.readFileSync(path.join(dir,nom)))}],assertions:'torg.test.ts ; résultat global dans verification-archives.json'},null,2)+'\n'));

describe('la campagne Torg réellement livrée',()=>{
    it('une seule archive, manifeste Nexus et date de cette création',()=>{
        expect(fs.readdirSync(dir).filter(n=>n.endsWith('.gmos'))).toEqual([nom]);expect(nexusService.validateManifest(m)).toEqual([]);
        expect(m.campaignId).toBe(s.campaign.id);expect(m.exportedAt).toBe('2026-11-08T12:00:00.000Z');expect(m.assetMap).toHaveLength(45);
        expect(s.deckManifests).toBeUndefined();expect(s.deckSessionStates).toBeUndefined();
    });
    it('médias embarqués et aucune référence au disque personnel',()=>{
        const refs=new Set(m.assetMap.map(a=>a.originalRef));
        for(const a of m.assetMap){expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);const b=z.readFile(a.relativePath)!;expect(b.length).toBe(a.sizeBytes);expect(hash(b)).toBe(a.checksum);if(a.mimeType==='image/svg+xml')expect(b.toString('utf8')).not.toMatch(/<script|<foreignObject|<image|href=/);}
        for(const r of nexusService.collectAssetPaths(s))if(!r.startsWith('data:'))expect(refs.has(r),r).toBe(true);
        // Le pilote réel conserve son lien NotebookLM facultatif ; aucun média
        // distant n'est requis. Ne pas modifier une règle pour effacer ce réglage.
        expect(nexusService.scanForRemoteUrls(s)).toEqual([pilote.defaultNotebookUrl]);
        expect(pilote.defaultNotebookUrl).toMatch(/^https:\/\/notebooklm\.google\.com\/notebook\//);
    });
    it('les vrais joueurs, trois nouveaux principaux et six personnages hors fiction',()=>{
        expect(s.players.map(p=>[p.id,p.realName])).toEqual([['p-1','Thomas D.'],['p-2','Marie C.'],['p-3','Lucas R.']]);
        expect(pcs).toHaveLength(9);expect(new Set(pcs.map(c=>c.id)).size).toBe(9);expect(pcs.filter(c=>c.name.startsWith('[RECETTE]'))).toHaveLength(6);
        expect(s.players.every(p=>p.avatarUrl===''&&p.characters.length===3)).toBe(true);expect(pcs.every(c=>c.campaignId===s.campaign.id)).toBe(true);
    });
    it('tous les liens de fiction restent cohérents',()=>{
        const ids=(a:{id:string}[])=>new Set(a.map(x=>x.id)),pc=ids(pcs),npc=ids(s.entities),lieux=ids(s.atlasMaps),sc=ids(s.scenes!),actes=ids(s.actes!),cl=ids(s.clues);
        for(const x of s.scenes!){expect(x.campaignId).toBe(s.campaign.id);expect(actes.has(x.acteId)).toBe(true);expect(lieux.has(x.lieuId!)).toBe(true);for(const id of x.personnagesIds!)expect(pc.has(id)).toBe(true);for(const id of x.entiteIds)expect(npc.has(id)).toBe(true);for(const id of x.indiceIds)expect(cl.has(id)).toBe(true);for(const e of x.enchainements!)expect(sc.has(e.vers)).toBe(true);for(const c of x.cosms??[])expect(pilote.cosms!.some(p=>p.id===c)).toBe(true);}
        for(const c of s.clues){expect(lieux.has(c.locationId!)).toBe(true);expect(npc.has(c.ownerId!)).toBe(true);}
        for(const p of pcs)for(const r of p.relations??[])expect(npc.has(r.targetId)).toBe(true);
        for(const a of s.atlasMaps)for(const l of a.linkedEntities??[]){if(l.entityId)expect(npc.has(l.entityId)).toBe(true);if(l.mapId)expect(lieux.has(l.mapId)).toBe(true);}
        for(const r of s.rencontres??[]){expect(sc.has(r.sceneId!)).toBe(true);for(const l of r.lignes)if(l.genre==='entite')expect(npc.has(l.entiteId)).toBe(true);}
    });
    it('douze préparations jouables, quatre actes et trois fins ouvertes',()=>{
        expect(s.sessions).toHaveLength(12);expect(s.actes).toHaveLength(5);expect(s.scenes).toHaveLength(42);
        for(const se of s.sessions){expect(se.status).toBe('planned');expect(se.scenesPrevuesIds).toHaveLength(3);expect(se.sessionEntityIds).toHaveLength(3);for(const rubrique of ['Pression :','Réactions :','Issues :','Transition :'])expect(se.gmSecrets).toContain(rubrique);for(const id of se.scenesPrevuesIds!)expect(s.scenes!.some(x=>x.id===id)).toBe(true);}
        const lecture=fs.readFileSync(path.join(dir,'CAMPAGNE-DU-MENEUR.md'),'utf8');expect(lecture).toContain('Fin A');expect(lecture).toContain('Fin B');expect(lecture).toContain('Fin C');expect(lecture).toContain('plusieurs moyens');
    });
    it('les ateliers sont atteignables sans protagonistes ou liens obligatoires de fiction',()=>{
        const ateliers=s.scenes!.filter(x=>x.acteId.endsWith('-recette')),histoire=s.scenes!.filter(x=>!x.acteId.endsWith('-recette'));
        expect(ateliers).toHaveLength(6);expect(histoire).toHaveLength(36);
        const recette=new Set(pcs.filter(c=>c.name.startsWith('[RECETTE]')).map(c=>c.id));
        for(const x of ateliers){expect(x.importance).toBe('optionnelle');for(const id of x.personnagesIds!)expect(recette.has(id)).toBe(true);}
        for(const x of histoire){for(const id of x.personnagesIds!)expect(recette.has(id)).toBe(false);expect(x.enchainements!.every(e=>!ateliers.some(a=>a.id===e.vers))).toBe(true);}
        expect(histoire.filter(x=>x.enchainements!.length>1).length).toBeGreaterThan(12);
    });
    it('le pilote exact, les 80 types et les cases proviennent du moteur',()=>{
        expect(pilote.id).toBe('custom-1774618478256');expect(pilote.version).toBe('2.0.0');expect(fiche.id).toBe('tpl-1774618478258');
        const champs=fiche.sections.flatMap(x=>x.fields);expect(champs).toHaveLength(80);
        for(const c of [...pcs,...s.entities]){for(const[k,v]of Object.entries(c.sheetData??{})){const f=champs.find(x=>x.id===k);expect(f,k).toBeDefined();expect(typeof v).toBe(f!.type==='checkbox'?'boolean':f!.type==='number'?'number':'string');}}
        for(const c of pcs){expect(c.healthSystem).toEqual(casesAligneesSurLaFiche(undefined,pilote.combat,c.sheetData));expect(c.healthSystem!.data.boxes).toHaveLength(4);}
        expect(s.entities.find(e=>e.name.startsWith('[RECETTE] Laquais'))!.healthSystem!.data.boxes).toHaveLength(1);
    });
    it('un texte libre n’active aucun Atout, les cas sont explicites',()=>{
        expect(possedeAtoutTorg(pilote.torg,pj('NU').sheetData!,'ingenieux')).toBe(false);
        for(const atout of ['ingenieux','populaire','occultiste','chefNaturel','conscienceEnvironnementale','aspectEffrayant'] as const)expect(possedeAtoutTorg(pilote.torg,pj('ATOUT').sheetData!,atout)).toBe(true);
        expect(refusEtatTorg(pilote.torg,pj('ZERO').sheetData!)).toContain('KO');expect(refusEtatTorg(pilote.torg,pj('DECO').sheetData!,true)).toContain('déconnecté');expect(refusEtatTorg(pilote.torg,pj('DECO').sheetData!,false)).toBeUndefined();
    });
    it('les vrais jets lisent les valeurs de JET et gardent les deux types de critique distincts',()=>{
        const v=pj('JET').sheetData!,niveau=Number(v.dexterite)+Number(v.esquive),malus=Number(v.blessures);
        expect(resoudreTorg(niveau,10,{premier:[10,7]},{malus})).toMatchObject({totalDuDe:17,bonus:4,totalDAction:14,nom:'Succès Simple'});
        expect(resoudreTorg(niveau,10,{premier:[10,7],possibilite:[10]},{malus})).toMatchObject({totalDAction:19,nom:'Succès Supérieur'});
        expect(resoudreTorg(niveau,10,{premier:[1],possibilite:[30]},{malus})).toMatchObject({degre:'echec-total'});
        expect(resoudreTorg(niveau,10,{premier:[3],possibilite:[20]},{malus,plageCritique:4})).toMatchObject({echecCritique:true,nom:'Succès Supérieur'});
        expect(lancerLaPossibilite(()=>3)).toEqual([10]);expect(lancerUneChaine(()=>20,false)).toEqual([20]);
    });
    it.each([[4,0,0],[5,0,1],[10,0,2],[15,1,2],[20,2,4]])('SANTE : le vrai coup %i applique la table sans confondre cases et dommages',(montant,bles,choc)=>{
        const c=pj('SANTE'),v={...c.sheetData,choc:0};const r=impactDeTorg(pilote,v,c.healthSystem,montant);expect(r.fiche).toMatchObject({blessures:1+bles,choc});
    });
    it('SANTE déclenche le KO au dépassement, pas à l’égalité',()=>{
        const c=pj('SANTE');const egal=impactDeTorg(pilote,c.sheetData!,c.healthSystem,5);expect(egal.fiche).toMatchObject({choc:9});expect(egal.ko).toBe(false);
        const plus=impactDeTorg(pilote,c.sheetData!,c.healthSystem,11);expect(plus.fiche).toMatchObject({choc:9,torg_etats_ko:true});expect(plus.ko).toBe(true);
    });
    it('un coup transféré prend la Résistance du laquais livré',()=>{
        const laquais=s.entities.find(e=>e.id.endsWith('-laquais'))!,vilain=s.entities.find(e=>e.id.endsWith('-vilain'))!;
        const r=impactDeTorg(pilote,laquais.sheetData!,laquais.healthSystem,17);expect(r.fiche).toMatchObject({blessures:1,choc:2});expect(vilain.sheetData!.blessures).toBe(0);expect(vilain.sheetData!.torg_capacites_sbires).toBe(true);expect(laquais.sheetData!.torg_capacites_sbires).toBe(false);
    });
    it('réserve et échange réels, conservation et manque explicite du sous-ensemble Destin',()=>{
        const a=pj('JET').id,b=pj('ATOUT').id;
        const d:DeckSessionState={deckId:'torg-test-fonction-pure',currentCardIndex:null,remainingIndices:[3,4,5],discardedIndices:[],enMain:[{index:1,porteur:a,face:'revelee'},{index:2,porteur:b,face:'revelee'}],torgEnRounds:true};
        expect(echangerLesCartesTorg(d,1,2,a,b).refus).toContain('Réserves');const reserve=poserEnReserve(poserEnReserve(d,1),2),e=echangerLesCartesTorg(reserve,1,2,a,b);
        expect(e.refus).toBeUndefined();expect(e.etat.enMain?.find(c=>c.index===1)?.porteur).toBe(b);expect(e.etat.enMain?.find(c=>c.index===2)?.porteur).toBe(a);
        expect(reprendreLesReserves(e.etat).reprises).toBe(2);const mc=momentCritique(d,a);expect(momentCritique(mc.etat,a).refus).toContain('déjà');
        const bilan=completerLesMains(d,[a,b,pj('SANTE').id],4,x=>x);expect(bilan.manquantes).toBe(7);expect(bilan.etat.enMain).toHaveLength(5);
    });
    it('les dix vraies faces Destin laissent deux cartes manquantes à trois héros et vingt-six à neuf',()=>{
        const faces=fs.readdirSync('public/assets/decks/torg/destin').filter(n=>/^card_\d{2}\.jpg$/.test(n)).sort();
        expect(faces).toEqual(Array.from({length:10},(_,i)=>`card_${String(i+1).padStart(2,'0')}.jpg`));
        const etat:DeckSessionState={deckId:'destin-images-disponibles',currentCardIndex:null,remainingIndices:faces.map((_,i)=>i+1),discardedIndices:[],enMain:[]};
        expect(completerLesMains(etat,[pj('JET').id,pj('ATOUT').id,pj('SANTE').id],4,x=>x).manquantes).toBe(2);
        expect(completerLesMains(etat,pcs.map(p=>p.id),4,x=>x).manquantes).toBe(26);
        const dep=new AdmZip('Export Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver');
        const paquets=JSON.parse(dep.readAsText('state.json')).paquets as {role:string;cardCount:number}[];
        expect(paquets.find(p=>p.role==='destin')?.cardCount).toBe(5);
    });
    it('la vraie correspondance relie les valeurs des fiches et aucun module étranger n’est ajouté',()=>{
        const table=lireLaCorrespondance(fs.readFileSync('docs/systems/torg/fiche/correspondance.json','utf8'))!;
        for(const c of [pj('JET'),pj('SANTE'),pcs.find(c=>c.id.endsWith('-salome'))!]){const v=versLaFiche({sheetData:c.sheetData},table);expect(v['identity.name']).toBe(c.name);expect(v['tracks.shock']).toBe(c.sheetData!.choc);expect(v['tracks.wounds']).toBe(c.sheetData!.blessures);}
        expect(modulesDuPilote(pilote,'systems/torg').modules).toHaveLength(0);expect(s.modulesDuJeu).toEqual({});
    });
    it('le geste collectif du magasin vise les neuf PJ, même si trois seulement jouent la séance',()=>{
        useSessionOSStore.setState({campaigns:[s.campaign],activeCampaignId:s.campaign.id,customGameDrivers:[pilote],players:s.players,sessions:s.sessions,scenes:s.scenes,
            decks:[{id:'indices-synthetiques-test',name:'Indices de fonction pure, aucun paquet livré',systemId:pilote.id,folderPath:'assets/test',role:'destin',cardCount:36,format:'poker',orientation:'portrait',useDiscard:true}],
            deckStates:{'indices-synthetiques-test':{deckId:'indices-synthetiques-test',currentCardIndex:null,remainingIndices:Array.from({length:36},(_,i)=>i+1),discardedIndices:[],enMain:[]}},
        });
        useSessionOSStore.getState().completerLesMainsDuDestin('indices-synthetiques-test');
        const cartes=useSessionOSStore.getState().deckStates['indices-synthetiques-test'].enMain!;
        expect(cartes).toHaveLength(36);expect(new Set(cartes.map(c=>c.porteur)).size).toBe(9);
        for(const p of pcs)expect(cartes.filter(c=>c.porteur===p.id)).toHaveLength(4);
    });
    it('63 cas humains, repères et matrice, aucune recette de David prévalidée',()=>{
        const cs=JSON.parse(fs.readFileSync(path.join(dir,'cas-de-recette.json'),'utf8')) as {id:string;archive:string;mecanique:string;source:string;repere:{acteId:string;sceneId:string;personnageId:string}}[];
        const matrice=JSON.parse(fs.readFileSync(path.join(dir,'matrice-couverture.json'),'utf8')) as {casIds:string[]}[];
        expect(cs).toHaveLength(63);expect(new Set(cs.map(c=>c.id)).size).toBe(63);expect(matrice.flatMap(x=>x.casIds).sort()).toEqual(cs.map(c=>c.id).sort());
        for(const c of cs){expect(c.archive).toBe(nom);expect(c.source).toBeTruthy();const scene=s.scenes!.find(x=>x.id===c.repere.sceneId)!;expect(scene.acteId).toBe(c.repere.acteId);expect(pcs.some(p=>p.id===c.repere.personnageId)).toBe(true);if(c.mecanique!=='import')expect(scene.personnagesIds).toContain(c.repere.personnageId);}
        expect(fs.readFileSync(path.join(dir,'resultats.csv'),'utf8').split(/\r?\n/).filter(l=>l.endsWith(';"NON TESTÉ";"";""'))).toHaveLength(63);
        expect(fs.readFileSync(path.join(dir,'ETATS-DE-REFERENCE.md'),'utf8')).toContain('Nexus Remplacer');
    });
    it('les sources et le pilote correspondent à leurs empreintes',()=>{
        const pr=JSON.parse(fs.readFileSync(path.join(dir,'provenance.json'),'utf8'));expect(pr.sourcesRegles).toHaveLength(3);
        for(const a of [...pr.sourcesRegles,...pr.sourcesTechniques,...pr.sourcesVisuelles,...pr.sourcesGenerateur])expect(hash(fs.readFileSync(a.fichier))).toBe(a.sha256);
        expect(hash(fs.readFileSync(pr.pilote.source))).toBe(pr.pilote.sha256);expect(hash(fs.readFileSync(path.join(dir,'Torg-Eternity-2.0.0.gmos-driver')))).toBe(pr.pilote.sha256);
    });
});
