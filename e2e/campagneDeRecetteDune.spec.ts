import { test, expect, chromium, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import { PORT_FICHES_PAR_DEFAUT } from '../electron/portsDeGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useDiceStore } from '../src/stores/useDiceStore';
import type { VueDesModulesMJ } from '../src/modules/modulesDuJeu/protocole';
import type { ConflitDune } from '../src/modules/dice/systemes/conflitsDeDune';
import type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';
type FenetreRecette = Window & { useSessionOSStore: typeof useSessionOSStore; useDiceStore: typeof useDiceStore; useRessourcesDeTableStore: typeof useRessourcesDeTableStore };
const SORTIE = path.resolve('output/campagnes-tests/dune');
const C = 'recette-dune-campagne-nereide';
const captures = path.join(SORTIE, 'captures');

test('les trois archives Dune, la Maison et le plateau fonctionnent sur trois Hub', async () => {
    test.setTimeout(240_000);
    fs.mkdirSync(captures, { recursive: true });
    const gmos = await lancerGmOs({ preparerLeProfil: profil => {
        fs.mkdirSync(path.join(profil, 'corpus', 'fiches'), { recursive: true });
        fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html', path.join(profil, 'corpus', 'fiches', 'Character_Sheet_Manager.html'));
        fs.cpSync('docs/systems/dune/fiche', path.join(profil, 'corpus', 'systems', 'dune', 'fiche'), { recursive: true });
    } });
    const f = gmos.fenetre;
    f.setDefaultTimeout(15_000);
    const fuites = new Set<string>();
    const releverSecrets = (valeur: unknown, chemin = '') => {
        if (typeof valeur === 'string' && valeur.includes('SECRET_MJ_DUNE_RECETTE')) fuites.add(chemin);
        else if (valeur && typeof valeur === 'object') for (const [cle, v] of Object.entries(valeur)) releverSecrets(v, chemin ? `${chemin}.${cle}` : cle);
    };
    const image = async (p: Page, nom: string) => p.screenshot({ path: path.join(captures, nom + '.jpg'), type: 'jpeg', quality: 80, animations: 'disabled', scale: 'css' });
    const vueModules = async (): Promise<VueDesModulesMJ> => f.evaluate(() => window.appBridge!.modulesDuJeu!.lire());
    const lireModule = async <T,>(moduleId: string): Promise<T> => (await vueModules()).sauvegarde!.campagnes[C][moduleId].donnees as T;
    const commander = async (moduleId: string, id: string, charge: unknown) => {
        const vue = await vueModules();
        expect(await f.evaluate(({ vue, moduleId, id, charge }) => window.appBridge!.modulesDuJeu!.commander({ campagneId: vue.campagneId!, contexte: vue.contexte,
            requeteId: crypto.randomUUID(), moduleId, commande: { id, charge } }), { vue, moduleId, id, charge })).toEqual({ ok: true });
    };
    try {
        await attendreLHydratation(gmos);
        await ouvrirLeModule(gmos, 'Tableau de Bord');
        // Profils et anciens PJ fictifs : mêmes identifiants que l'export fourni par David.
        // Le vrai export RDD ne quitte pas le dépôt et n'est jamais injecté dans les essais.
        const preexistants = ['Thomas D.', 'Marie C.', 'Lucas R.'].map((realName, i) => ({
            id: `p-${i + 1}`, realName, avatarUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text x="8" y="28">${i + 1}</text></svg>`)}`, isOnline: false,
            characters: [{ id: `recette-sentinelle-pj-${i + 1}`, name: `Ancien PJ fictif ${i + 1}`, classRace: 'Sentinelle', campaignId: 'recette-sentinelle', templateId: 'generic',
                hp: 7, maxHp: 10, sheetData: { hp: 7, note: 'ANCIEN PJ À CONSERVER' }, playerNotes: 'NE PAS ÉCRASER' }],
        }));
        await f.evaluate(players => (window as unknown as FenetreRecette).useSessionOSStore.setState({
            campaigns: [{ id: 'recette-sentinelle', name: 'SENTINELLE — ne pas modifier', system: 'generic', activeLocationIds: [] }],
            players, entities: [], sessions: [], actes: [], scenes: [], atlasMaps: [], clues: [], rencontres: [], activeCampaignId: null, currentView: 'library',
        }), preexistants);
        const verifierLesExistants = async () => {
            const existants = await f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().players.map(p => ({
                id: p.id, realName: p.realName, avatarUrl: p.avatarUrl, characters: p.characters.filter(c => c.campaignId === 'recette-sentinelle'),
            })));
            expect(existants).toEqual(preexistants.map(p => ({ id: p.id, realName: p.realName, avatarUrl: p.avatarUrl, characters: p.characters })));
        };
        const importer = async (fichier: string, campagne: string, remplacer = false) => {
            await gmos.application.evaluate(({ dialog }, cible) => {
                dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [cible] });
            }, path.join(SORTIE, fichier));
            await f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().setCurrentView('library'));
            await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
            await f.locator(remplacer ? '#nexus-conflict-replace' : '#nexus-import-tel-quel').click();
            await expect.poll(() => f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().activeCampaignId), { timeout: 45_000 }).toBe(campagne);
            const fermer = f.locator('#nexus-bilan-fermer');
            if (await fermer.isVisible()) await fermer.click();
        };
        await importer('01-Le-Sceau-de-Nereide.gmos', C);
        await expect(f.getByText('RECETTE DUNE — Le Sceau de Néréide').first()).toBeVisible();
        await image(f, '01-campagne-importee');
        await importer('02-Principes-Defaite-et-Progression.gmos', 'recette-dune-principes-campagne-nereide');
        await importer('03-Conflits-et-Maison.gmos', 'recette-dune-conflits-campagne-nereide');
        const inventaire = await f.evaluate(() => {
            const s = (window as unknown as FenetreRecette).useSessionOSStore.getState();
            return { campagnes: s.campaigns.map(c => c.id), joueurs: s.players.map(p => ({ id: p.id, nom: p.realName, personnages: p.characters.filter(c => c.campaignId !== 'recette-sentinelle').length })),
                pnj: s.entities.length, lieux: s.atlasMaps.length, scenes: s.scenes.length, indices: s.clues.length };
        });
        expect(inventaire.campagnes).toHaveLength(4); expect(inventaire.campagnes).toContain('recette-sentinelle');
        expect(inventaire.joueurs.map(p => p.id)).toEqual(['p-1', 'p-2', 'p-3']);
        expect(inventaire.joueurs.map(p => p.nom)).toEqual(['Thomas D.', 'Marie C.', 'Lucas R.']);
        expect(inventaire.joueurs.reduce((n, p) => n + p.personnages, 0)).toBe(15);
        await verifierLesExistants();
        expect(inventaire.pnj).toBe(36); expect(inventaire.lieux).toBe(24); expect(inventaire.scenes).toBe(48); expect(inventaire.indices).toBe(36);
        await f.evaluate(campagne => {
            const s=(window as unknown as FenetreRecette).useSessionOSStore.getState(),c=s.players[0].characters.find(c=>c.campaignId===campagne)!;
            s.updateCharacter(s.players[0].id,c.id,{playerNotes:'TRACE ENQUÊTE À CONSERVER'});
            const p=s.players.find(p=>p.characters.some(c=>c.name.startsWith('P02')))!;
            s.updateCharacter(p.id,p.characters.find(c=>c.name.startsWith('P02'))!.id,{playerNotes:'LABO À EFFACER'});
        },C);
        await importer('02-Principes-Defaite-et-Progression.gmos','recette-dune-principes-campagne-nereide',true);
        const LAB='recette-dune-conflits-campagne-nereide';
        await f.evaluate(campagne=>{const s=(window as unknown as FenetreRecette).useSessionOSStore.getState(),c=s.campaigns.find(c=>c.id===campagne)!;s.updateCampaign(campagne,{groupe:{...c.groupe,sheetData:{...c.groupe!.sheetData,'house.name':'LABO À EFFACER'}}});},LAB);
        await importer('03-Conflits-et-Maison.gmos',LAB,true);
        expect(await f.evaluate(campagne=>(window as unknown as FenetreRecette).useSessionOSStore.getState().campaigns.find(c=>c.id===campagne)!.groupe!.sheetData['house.name'],LAB)).toBe('Maison Vaëlan');
        await f.evaluate(campagne=>{
            const store=(window as unknown as FenetreRecette).useSessionOSStore,s=store.getState();s.setActiveCampaign(campagne);s.setCurrentView('modules-du-jeu');
            store.setState({sessions:s.sessions.map(se=>se.campaignId===campagne&&se.number===1?{...se,status:'active' as const}:se)});
        },C);
        await expect.poll(async()=>(await vueModules()).campagneId).toBe(C);
        expect(Object.keys((await vueModules()).sauvegarde!.campagnes).filter(id=>id.startsWith('recette-dune-'))).toHaveLength(3);
        const lire=()=>lireModule<ConflitDune>('dune-conflits');
        const pcs=await f.evaluate(campagne=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.map(p=>p.characters.find(c=>c.campaignId===campagne)!),C);
        expect((await lire()).maison).toMatchObject({nom:'Maison Vaëlan',type:1});
        const vue=await vueModules();
        expect(await f.evaluate(({vue,ids})=>window.appBridge!.modulesDuJeu!.autoriser({campagneId:vue.campagneId!,contexte:vue.contexte,moduleId:'dune-conflits',personnages:ids}),{vue,ids:pcs.map(c=>c.id)})).toEqual({ok:true});
        await f.getByRole('button',{name:'Ouvrir le pupitre',exact:true}).click();
        const pupitre=f.locator('[data-plateau-dune]');await expect(pupitre).toContainText('Maison Vaëlan');
        await f.getByText('Maison et début de séance',{exact:true}).click();
        await f.getByLabel('Joueurs présents',{exact:true}).fill('3');
        await f.getByRole('button',{name:'Début de séance : fixer la Menace à 3',exact:true}).click();
        await expect.poll(()=>f.evaluate(campagne=>(window as unknown as FenetreRecette).useRessourcesDeTableStore.getState().reserves[campagne].menace,C)).toBe(3);
        await image(f,'02-plateau-mj');
        let modulesPrives=true,jets=0,maisons=0;
        const navigateur=await chromium.launch({channel:'msedge',args:['--mute-audio']});
        try{
            for(const [i,largeur]of [360,768,1180].entries()){
                const pc=pcs[i],contexte=await navigateur.newContext({viewport:{width:largeur,height:1000},isMobile:true,hasTouch:true,serviceWorkers:'block',locale:'fr-FR'});
                await contexte.route('**/*',route=>{const u=new URL(route.request().url());if(['blob:','data:'].includes(u.protocol))return route.continue();if(u.hostname!=='127.0.0.1')return route.abort();if(u.port===String(PORT_FICHES_PAR_DEFAUT)){u.port=String(gmos.ports.fiches);return route.continue({url:u.href});}return [String(gmos.ports.fiches),String(gmos.ports.sync)].includes(u.port)?route.continue():route.abort();});
                await contexte.addInitScript(i=>localStorage.setItem('gmos-tablet-uuid',`recette-dune-${i}`),i);
                const tablette=await contexte.newPage();tablette.setDefaultTimeout(15_000);let desirAutorise=i>0;
                tablette.on('websocket',ws=>ws.on('framereceived',trame=>{try{const t=String(trame.payload);releverSecrets(JSON.parse(t));if(/SECRET_MODULE_DUNE|SECRET_ZONE_DUNE|SECRET_ATOUT_DUNE/.test(t)||(!desirAutorise&&t.includes('SECRET_DESIR_NALIA')))modulesPrives=false;}catch{/* trame non JSON */}}));
                await tablette.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
                await tablette.getByRole('button',{name:new RegExp(pc.name)}).click();await expect(tablette.getByText('Connecté',{exact:true})).toBeVisible();
                await tablette.getByTitle('Fiche Personnage',{exact:true}).click();await ongletDeLaFiche(tablette,'Lancer un test');
                const panneau=tablette.locator('[data-panneau-de-jet]').first();await panneau.locator('select').nth(0).selectOption('analyse');await panneau.locator('select').nth(1).selectOption('devotion');
                const avant=await f.evaluate(()=>(window as unknown as FenetreRecette).useDiceStore.getState().history.length);
                await panneau.getByRole('button',{name:'Lancer',exact:true}).click();
                await panneau.getByRole('button',{name:'Terminer le test et conserver le reliquat',exact:true}).click();
                await expect.poll(()=>f.evaluate(()=>(window as unknown as FenetreRecette).useDiceStore.getState().history.length)).toBeGreaterThan(avant);jets++;
                await ongletDeLaFiche(tablette,'Ma fiche');
                const html=tablette.frameLocator('iframe:visible');await expect(html.locator('[data-key="identity.name"]')).toHaveValue(pc.name,{timeout:30_000});
                await expect(html.locator('[data-key="drives.duty.statement"]')).toHaveValue((pc.sheetData._gmos_dune as {maximes:Record<string,string>}).maximes.devotion);
                await html.locator('[data-key="resources.advancement"]').fill(String(i+1));await html.locator('[data-key="resources.advancement"]').blur();
                await expect.poll(()=>f.evaluate(({id})=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!.sheetData.progression,{id:pc.id})).toBe(i+1);
                await image(tablette,`03-fiche-joueur-${i+1}-${largeur}`);
                await ongletDeLaFiche(tablette,'Maison');await expect(tablette.frameLocator('iframe:visible').locator('[data-key="house.name"]')).toHaveValue('Maison Vaëlan');maisons++;
                await expect(tablette.frameLocator('iframe:visible').locator('[data-key="house.type"]')).toHaveValue('Mineure');
                await expect(tablette.frameLocator('iframe:visible').locator('[data-key="house.enemies.0.hatred"]')).toHaveValue('2');
                await image(tablette,`04-maison-joueur-${i+1}-${largeur}`);
                await tablette.getByTitle('Fermer la fiche',{exact:true}).click();
                await tablette.getByRole('navigation',{name:'Navigation Hub'}).getByRole('button',{name:'Modules du jeu',exact:true}).click();
                await tablette.getByRole('button',{name:'Ouvrir Dune : conflits et Maison',exact:true}).click();
                const plateau=tablette.locator('[data-plateau-dune]');await expect(plateau).toBeVisible();await expect(plateau).toContainText('à découvrir');await expect(plateau).not.toContainText('Réserve cachée');
                if(i===0){
                    const zone=(await lire()).zones.find(z=>z.id.endsWith('-nalia'))!;
                    await commander('dune-conflits','desir',{zoneId:zone.id,reussi:true,analyse:6});await expect(plateau).not.toContainText('SECRET_DESIR_NALIA');
                    desirAutorise=true;await commander('dune-conflits','desir',{zoneId:zone.id,reussi:true,analyse:6});await expect(plateau).toContainText('SECRET_DESIR_NALIA');
                    const atout=(await lire()).atouts.find(a=>a.id.endsWith('-analyse'))!;await commander('dune-conflits','deplacer',{atoutId:atout.id,zoneId:zone.id});
                }
                expect(await tablette.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await image(tablette,`05-plateau-joueur-${i+1}-${largeur}`);await contexte.close();
            }
        }finally{await navigateur.close();}
        expect(modulesPrives).toBe(true);expect(jets).toBe(3);expect(maisons).toBe(3);
        await f.evaluate(campagne=>(window as unknown as FenetreRecette).useSessionOSStore.setState(s=>({sessions:s.sessions.map(se=>se.campaignId===campagne?{...se,status:'planned' as const}:se)})),C);
        await expect.poll(async()=>(await vueModules()).modules.every(m=>m.acces.length===0)).toBe(true);
        await f.reload();await attendreLHydratation(gmos);await verifierLesExistants();
        await expect.poll(()=>f.evaluate(()=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).length)).toBe(18);
        expect(await f.evaluate(campagne=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players[0].characters.find(c=>c.campaignId===campagne)!.playerNotes,C)).toBe('TRACE ENQUÊTE À CONSERVER');
        expect((await lire()).zones.find(z=>z.id.endsWith('-nalia'))).toMatchObject({desirRevele:true,decouverte:8});
        expect((await lire()).atouts.find(a=>a.id.endsWith('-analyse'))!.zone).toMatch(/-nalia$/);
        expect(await f.evaluate(ids=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).filter(c=>ids.includes(c.id)).map(c=>c.sheetData.progression),pcs.map(c=>c.id))).toEqual([1,2,3]);
        fs.writeFileSync(path.join(SORTIE,'verification-electron.json'),JSON.stringify({reussi:fuites.size===0,importNatif:true,remplacementIsole:true,reload:true,joueursExistantsConserves:true,anciensPJConserves:3,joueurs:inventaire.joueurs,ficheHTML:true,maisonHTML:maisons,progressionsTablettes:3,jetsRecusParMJ:jets,tablettes:[360,768,1180],modulesImportes:3,modulesPrives,desirRevele:true,atoutDeplace:true,menaceMaison:true,
            archives:['01-Le-Sceau-de-Nereide.gmos','02-Principes-Defaite-et-Progression.gmos','03-Conflits-et-Maison.gmos'].map(fichier=>({fichier,sha256:createHash('sha256').update(fs.readFileSync(path.join(SORTIE,fichier))).digest('hex')})),secretsNonDiffuses:fuites.size===0,anomalies:[...fuites].map(chemin=>({cas:'GM-05',chemin,attendu:'secret absent des trames joueur',observe:'marqueur secret présent'}))},null,2));
        expect.soft(fuites.size,'GM-05 : secrets de séance reçus ; voir verification-electron.json').toBe(0);
    }finally{await gmos.fermer();}
});
