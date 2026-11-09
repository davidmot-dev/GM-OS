import {test,expect,chromium,type Page} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {lancerGmOs,attendreLHydratation,ouvrirLeModule,ongletDeLaFiche,presenterLaTablette} from './lancerGmOs';
import {PORT_FICHES_PAR_DEFAUT} from '../electron/portsDeGmOs';
import type {useSessionOSStore} from '../src/modules/session/useSessionOSStore';
import type {useDiceStore} from '../src/stores/useDiceStore';
type Fenetre=Window&{useSessionOSStore:typeof useSessionOSStore;useDiceStore:typeof useDiceStore;hasardRecetteTorg?:()=>number};
const SORTIE=path.resolve('output/campagnes-tests/torg'),C='recette-torg-aube-campagne-balises',P='recette-torg-aube-',NOM='01-Les-Balises-de-l-Aube.gmos';
const hash=(f:string)=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');

test('Torg : une campagne native, trois Hub et restauration locale sans perte de fiction',async()=>{
    test.setTimeout(600_000);fs.mkdirSync(path.join(SORTIE,'captures'),{recursive:true});
    const g=await lancerGmOs({preparerLeProfil:profil=>{
        fs.mkdirSync(path.join(profil,'corpus/fiches'),{recursive:true});fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html',path.join(profil,'corpus/fiches/Character_Sheet_Manager.html'));
        for(const d of ['theme','fiche'])fs.cpSync(path.resolve('docs/systems/torg',d),path.join(profil,'corpus/systems/torg',d),{recursive:true});
    }});
    const f=g.fenetre;f.setDefaultTimeout(20_000);
    const fuites=new Set<string>();let touches=0,jets=0,depenses=0,fiches=0;
    const relever=(v:unknown,p='')=>{if(typeof v==='string'&&v.includes('SECRET_MJ_TORG_AUBE'))fuites.add(p);else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))relever(x,p?p+'.'+k:k);};
    const photo=async(page:Page,nom:string)=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(SORTIE,'captures',nom+'.jpg'),type:'jpeg',quality:85,animations:'disabled',scale:'css'});};
    const perso=(id:string)=>f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!,id);
    const vue=async(code:string)=>{await f.keyboard.press('Escape');await expect(f.getByRole('dialog',{name:'Scène en cours',exact:true})).not.toBeVisible();await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(code=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState(),id='recette-torg-aube-pj-'+code.toLowerCase(),p=s.players.find(p=>p.characters.some(c=>c.id===id))!;s.setSelectedPlayer(p.id);s.setSelectedCharacter(id);s.setCurrentView('players');},code);await ongletDeLaFiche(f,'Formulaire');};
    const preexistants=['Thomas D.','Marie C.','Lucas R.'].map((realName,i)=>({id:`p-${i+1}`,realName,avatarUrl:`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text x="10" y="28">${i+1}</text></svg>`)}`,isOnline:false,characters:[{id:'sentinelle-pj-'+i,name:'Ancien PJ fictif '+i,campaignId:'sentinelle',templateId:'generic',hp:7,maxHp:10,sheetData:{hp:7,note:'ANCIEN PJ À CONSERVER'},playerNotes:'NE PAS ÉCRASER'}]}));
    const verifierLesExistants=async()=>expect(await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().players.map(p=>({id:p.id,realName:p.realName,avatarUrl:p.avatarUrl,characters:p.characters.filter(c=>c.campaignId==='sentinelle')})))).toEqual(preexistants.map(p=>({id:p.id,realName:p.realName,avatarUrl:p.avatarUrl,characters:p.characters})));
    try{
        await attendreLHydratation(g);await f.setViewportSize({width:1440,height:1100});await ouvrirLeModule(g,'Tableau de Bord');
        await f.evaluate(players=>(window as unknown as Fenetre).useSessionOSStore.setState({campaigns:[{id:'sentinelle',name:'SENTINELLE — fiction fictive à conserver',system:'generic',activeLocationIds:[]}],players,entities:[],sessions:[],actes:[],scenes:[],atlasMaps:[],clues:[],rencontres:[],wikiEntries:[],timelineEvents:[],activeCampaignId:null,customGameDrivers:[],customSheetTemplates:[],decks:[],deckStates:{},currentView:'library'}),preexistants);
        const importer=async(fichier:string,campagne=false)=>{
            await g.application.evaluate(({dialog},cible)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[cible]});},fichier);
            await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('library'));
            await f.getByRole('button',{name:/Importer un bundle Nexus/i}).click();
            if(campagne){
                await f.locator('#nexus-import-tel-quel').click();
                await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().activeCampaignId),{timeout:60_000}).toBe(C);
                const fermer=f.locator('#nexus-bilan-fermer');if(await fermer.isVisible())await fermer.click();
            }else{await expect(f.locator('#nexus-bilan-fermer')).toBeVisible({timeout:60_000});await f.locator('#nexus-bilan-fermer').click();}
        };
        console.info('TORG : import du vrai pilote et préparation d’un état de paquet sentinelle.');
        await importer(path.resolve('Export Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver'));
        const avantPaquets=await f.evaluate(()=>{const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState(),d=s.decks.find(d=>d.role==='destin')!;const etat={deckId:d.id,currentCardIndex:null,remainingIndices:[2,3,4,5],discardedIndices:[],enMain:[{index:1,porteur:'sentinelle-pj-0',face:'revelee' as const}]};w.useSessionOSStore.setState({deckStates:{...s.deckStates,[d.id]:etat}});return {deckId:d.id,etat,definitions:s.decks};});
        console.info('TORG : import natif de l’unique campagne.');await importer(path.join(SORTIE,NOM),true);
        await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().activeCampaignId)).toBe(C);
        await verifierLesExistants();
        const inventaire=await f.evaluate(campagne=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();return {campagnes:s.campaigns.map(c=>c.id),pj:s.players.flatMap(p=>p.characters).filter(c=>c.campaignId===campagne).length,pnj:s.entities.filter(e=>e.campaignId===campagne).length,scenes:s.scenes.filter(e=>e.campaignId===campagne).length,seances:s.sessions.filter(e=>e.campaignId===campagne).length,paquets:s.decks,etat:s.deckStates};},C);
        expect(inventaire.campagnes).toEqual(['sentinelle',C]);expect(inventaire.pj).toBe(9);expect(inventaire.pnj).toBe(16);expect(inventaire.scenes).toBe(42);expect(inventaire.seances).toBe(12);
        expect(inventaire.paquets).toEqual(avantPaquets.definitions);expect(inventaire.etat[avantPaquets.deckId]).toEqual(avantPaquets.etat);
        await photo(f,'01-campagne-importee');
        await f.evaluate(()=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState(),principal=s.players[0].characters.find(c=>c.id==='recette-torg-aube-pj-salome')!;
            s.updateCharacter('p-1',principal.id,{sheetData:{...principal.sheetData,xp:17},playerNotes:'TEMOIN_FICTION_AUBE_A_CONSERVER'});
            s.modifierScene('recette-torg-aube-scene-01-1',{notesDuMeneur:'TEMOIN_SCENE_AUBE_A_CONSERVER'});
            (window as unknown as Fenetre).useSessionOSStore.setState({sessions:s.sessions.map(se=>se.campaignId==='recette-torg-aube-campagne-balises'&&se.number===1?{...se,status:'active',sessionEntityIds:['recette-torg-aube-pj-jet','recette-torg-aube-pj-atout','recette-torg-aube-pj-sante']}:se)});
            s.ouvrirLaScene('recette-torg-aube-atelier-portabilite');s.setCurrentView('trame');
        });
        await expect(f.getByText('ATELIERS DE RECETTE — hors fiction',{exact:true}).first()).toBeVisible();await photo(f,'02-ateliers-dans-la-trame');
        expect((await f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire())).modules).toHaveLength(0);
        const cibles=await Promise.all(['jet','atout','sante'].map(code=>perso(P+'pj-'+code)));
        const navigateur=await chromium.launch({channel:'msedge',args:['--mute-audio']});
        try{for(const[i,largeur]of [360,768,1180].entries()){
            console.info('TORG : vrai Hub tactile',largeur);const pc=cibles[i],contexte=await navigateur.newContext({viewport:{width:largeur,height:1024},isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
            try{
                await presenterLaTablette(contexte,'recette-torg-aube-'+i);
                await contexte.route('**/*',route=>{const u=new URL(route.request().url());if(['about:','blob:','data:'].includes(u.protocol))return route.continue();if(u.hostname!=='127.0.0.1')return route.abort();if(u.port===String(PORT_FICHES_PAR_DEFAUT)){u.port=String(g.ports.fiches);return route.continue({url:u.href});}return [String(g.ports.fiches),String(g.ports.sync)].includes(u.port)?route.continue():route.abort();});
                const hub=await contexte.newPage();hub.setDefaultTimeout(20_000);hub.on('websocket',ws=>ws.on('framereceived',trame=>{try{relever(JSON.parse(String(trame.payload)));}catch{/* trame non JSON */}}));
                await hub.goto(`http://127.0.0.1:${g.ports.sync}/?window=tablet&sync=${g.ports.sync}`);
                await hub.getByRole('button',{name:pc.name,exact:false}).tap();await expect(hub.getByText('Connecté',{exact:true})).toBeVisible();expect(await hub.evaluate(()=>!!window.appBridge)).toBe(false);expect(await hub.evaluate(()=>navigator.maxTouchPoints)).toBeGreaterThan(0);
                await hub.evaluate(()=>{const w=window as unknown as {touchesRecette:number};w.touchesRecette=0;document.addEventListener('touchstart',()=>w.touchesRecette++,true);});
                await hub.getByTitle('Fiche Personnage',{exact:true}).tap();await ongletDeLaFiche(hub,'Lancer un test');
                const p=hub.locator('[data-panneau-de-jet]').first();await p.locator('select').nth(0).selectOption('dexterite');await p.locator('select').nth(1).selectOption('esquive');
                const hasard=async(valeur:number,action:()=>Promise<void>)=>{
                    await hub.evaluate(valeur=>{const w=window as unknown as Fenetre;w.hasardRecetteTorg??=Math.random;const origine=w.hasardRecetteTorg;Math.random=()=>new Error().stack?.includes('.roll (')?valeur:origine();},valeur);
                    try{await action();}finally{await hub.evaluate(()=>{const w=window as unknown as Fenetre;if(w.hasardRecetteTorg)Math.random=w.hasardRecetteTorg;});}
                };
                const avant=await f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length);await hasard(.6,()=>p.getByRole('button',{name:'Lancer',exact:true}).tap());
                await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length)).toBeGreaterThan(avant);jets++;
                await hasard(.1,()=>p.getByRole('button',{name:/Dépenser une Possibilité/}).tap());await expect.poll(async()=>(await perso(pc.id)).sheetData.possibilites).toBe(Number(pc.sheetData.possibilites)-1);depenses++;
                await ongletDeLaFiche(hub,'Ma fiche');const html=hub.frameLocator('iframe:visible');await expect(html.locator('[data-key="identity.name"]')).toHaveValue(pc.name,{timeout:60_000});
                await html.locator('[data-key="defenses.dodge"]').tap();await html.locator('[data-key="defenses.dodge"]').fill(String(12+i));const sauver=html.getByRole('button',{name:/Sauvegarder/});if(await sauver.isVisible())await sauver.tap();
                await expect.poll(async()=>(await perso(pc.id)).sheetData.esquive_def).toBe(12+i);fiches++;
                await photo(hub,`03-fiche-joueur-${i+1}-${largeur}`);expect(await hub.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
                await hub.getByTitle('Fermer la fiche',{exact:true}).tap();touches+=await hub.evaluate(()=>(window as unknown as {touchesRecette:number}).touchesRecette);
            }finally{await contexte.close();}
        }}finally{await navigateur.close();}
        console.info('TORG : remise en état manuelle locale depuis le vrai formulaire.');
        await vue('SANTE');
        const choc=f.getByLabel(/^Choc(?: Actuel)?$/).first(),blessures=f.getByLabel('Blessures',{exact:true}).first(),poss=f.getByLabel('Possibilités',{exact:true}).first();
        await choc.fill('4');await blessures.fill('2');await f.getByRole('button',{name:'Sauvegarder',exact:true}).click();
        await expect.poll(async()=>(await perso(P+'pj-sante')).sheetData).toMatchObject({choc:4,blessures:2});
        await choc.fill('8');await blessures.fill('1');await poss.fill('1');await f.getByRole('button',{name:'Sauvegarder',exact:true}).click();
        await expect.poll(async()=>(await perso(P+'pj-sante')).sheetData).toMatchObject({choc:8,blessures:1,possibilites:1,torg_etats_ko:false});await photo(f,'04-atelier-restaure');
        await f.reload();await attendreLHydratation(g);await verifierLesExistants();
        expect((await perso(P+'pj-salome')).sheetData.xp).toBe(17);expect((await perso(P+'pj-salome')).playerNotes).toBe('TEMOIN_FICTION_AUBE_A_CONSERVER');
        expect(await f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().scenes.find(s=>s.id===id)!.notesDuMeneur,P+'scene-01-1')).toBe('TEMOIN_SCENE_AUBE_A_CONSERVER');
        expect((await perso(P+'pj-sante')).sheetData).toMatchObject({choc:8,blessures:1,possibilites:1,torg_etats_ko:false});
        expect(((await perso(P+'pj-sante')).healthSystem!.data.boxes as {filled:boolean}[]).filter(b=>b.filled)).toHaveLength(1);
        for(const[i,pc]of cibles.entries())expect((await perso(pc.id)).sheetData.esquive_def).toBe(12+i);
        expect(await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.length)).toBe(2);
        expect(await f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().deckStates[id],avantPaquets.deckId)).toEqual(avantPaquets.etat);
        const rapport={reussi:fuites.size===0,importNatif:true,uneSeuleCampagneAjoutee:true,reload:true,joueursExistantsConserves:true,anciensPJConserves:3,paquetsEtMainsPreserves:true,pjDuLot:9,seances:12,scenes:42,ficheHTML:true,fichesRecuesMJ:fiches,jetsRecusParMJ:jets,depensesRecuesMJ:depenses,touchesRecues:touches,tablettes:[360,768,1180],appareilPhysique:false,modulesSpecifiques:0,restaurationLocale:true,temoinsFictionEtPrincipalConserves:true,
            archives:[{fichier:NOM,sha256:hash(path.join(SORTIE,NOM))}],sourceE2ESHA256:hash('e2e/campagneDeRecetteTorg.spec.ts'),secretsNonDiffuses:fuites.size===0,anomalies:[...fuites].map(chemin=>({cas:'GM-05',chemin,attendu:'secret absent des trames joueur',observe:'marqueur privé fictif reçu'}))};
        fs.writeFileSync(path.join(SORTIE,'verification-electron.json'),JSON.stringify(rapport,null,2)+'\n');expect(jets).toBe(3);expect(fiches).toBe(3);expect(touches).toBeGreaterThan(9);expect.soft(fuites.size,'GM-05 : conserver les chemins de fuite dans le rapport').toBe(0);
    }catch(erreur){await f.screenshot({path:path.join(SORTIE,'captures/diagnostic-echec.jpg'),type:'jpeg'});throw erreur;}
    finally{await g.fermer();}
});
