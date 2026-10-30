import { test, expect, chromium, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import { PORT_FICHES_PAR_DEFAUT } from '../electron/portsDeGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useDiceStore } from '../src/stores/useDiceStore';
type FenetreRecette = Window & { useSessionOSStore: typeof useSessionOSStore; useDiceStore: typeof useDiceStore };
const SORTIE = path.resolve('output/campagnes-tests/runequest');
const C = 'recette-rq-campagne-bornes';
const captures = path.join(SORTIE, 'captures');

test('les trois archives RuneQuest et les fiches fonctionnent sur trois Hub', async () => {
    test.setTimeout(240_000);
    fs.mkdirSync(captures, { recursive: true });
    const gmos = await lancerGmOs({ preparerLeProfil: profil => {
        fs.mkdirSync(path.join(profil, 'corpus', 'fiches'), { recursive: true });
        fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html', path.join(profil, 'corpus', 'fiches', 'Character_Sheet_Manager.html'));
        fs.cpSync('docs/systems/runequest/fiche', path.join(profil, 'corpus', 'systems', 'runequest', 'fiche'), { recursive: true });
    } });
    const f = gmos.fenetre;
    f.on('console', message => { if (message.type() === 'error') console.error('[RuneQuest renderer]', message.text()); });
    f.on('pageerror', erreur => console.error('[RuneQuest page]', erreur.message));
    f.setDefaultTimeout(15_000);
    const fuites = new Set<string>();
    const releverSecrets = (valeur: unknown, chemin = '') => {
        if (typeof valeur === 'string' && valeur.includes('SECRET_MJ_RQ_RECETTE')) fuites.add(chemin);
        else if (valeur && typeof valeur === 'object') for (const [cle, v] of Object.entries(valeur)) releverSecrets(v, chemin ? `${chemin}.${cle}` : cle);
    };
    const image = async (p: Page, nom: string) => p.screenshot({ path: path.join(captures, nom + '.jpg'), type: 'jpeg', quality: 80, animations: 'disabled', scale: 'css' });
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
        await importer('01-Les-Bornes-du-gue.gmos', C);
        await expect(f.getByText('RECETTE RUNEQUEST — Les Bornes du gué').first()).toBeVisible();
        await image(f, '01-campagne-importee');
        await importer('02-Aptitudes-Combat-et-Sante.gmos', 'recette-rq-corps-campagne-bornes');
        await importer('03-Runes-Passions-et-Magie.gmos', 'recette-rq-runes-campagne-bornes');
        const inventaire = await f.evaluate(() => {
            const s = (window as unknown as FenetreRecette).useSessionOSStore.getState();
            return { campagnes: s.campaigns.map(c => c.id), joueurs: s.players.map(p => ({ id: p.id, nom: p.realName, personnages: p.characters.filter(c => c.campaignId !== 'recette-sentinelle').length })),
                pnj: s.entities.length, lieux: s.atlasMaps.length, scenes: s.scenes.length, indices: s.clues.length };
        });
        expect(inventaire.campagnes).toHaveLength(4); expect(inventaire.campagnes).toContain('recette-sentinelle');
        expect(inventaire.joueurs.map(p => p.id)).toEqual(['p-1', 'p-2', 'p-3']);
        expect(inventaire.joueurs.map(p => p.nom)).toEqual(['Thomas D.', 'Marie C.', 'Lucas R.']);
        expect(inventaire.joueurs.reduce((n, p) => n + p.personnages, 0)).toBe(21);
        await verifierLesExistants();
        expect(inventaire.pnj).toBe(36); expect(inventaire.lieux).toBe(24); expect(inventaire.scenes).toBe(48); expect(inventaire.indices).toBe(36);
        await f.evaluate(campagne=>{const s=(window as unknown as FenetreRecette).useSessionOSStore.getState();const c=s.players[0].characters.find(c=>c.campaignId===campagne)!;s.updateCharacter(s.players[0].id,c.id,{playerNotes:'TRACE ENQUÊTE À CONSERVER'});const p=s.players.find(p=>p.characters.some(c=>c.name.startsWith('C02')))!;s.updateCharacter(p.id,p.characters.find(c=>c.name.startsWith('C02'))!.id,{playerNotes:'LABO À EFFACER'});},C);
        await importer('02-Aptitudes-Combat-et-Sante.gmos','recette-rq-corps-campagne-bornes',true);
        expect(await f.evaluate(()=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.name.startsWith('C02'))!.playerNotes)).not.toBe('LABO À EFFACER');
        await f.evaluate(campagne=>{const st=(window as unknown as FenetreRecette).useSessionOSStore,s=st.getState();s.setActiveCampaign(campagne);s.setCurrentView('trame');st.setState({sessions:s.sessions.map(se=>se.campaignId===campagne&&se.number===1?{...se,status:'active' as const}:se)});},C);
        const pcs=await f.evaluate(campagne=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.map(p=>p.characters.find(c=>c.campaignId===campagne)!),C);
        expect((await f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire())).modules).toHaveLength(0);
        let jets=0,pm=0,localisations=0;const navigateur=await chromium.launch({channel:'msedge',args:['--mute-audio']});
        try{for(const [i,largeur]of [360,768,1180].entries()){
            const pc=pcs[i],contexte=await navigateur.newContext({viewport:{width:largeur,height:1000},isMobile:true,hasTouch:true,serviceWorkers:'block',locale:'fr-FR'});
            await contexte.route('**/*',route=>{const u=new URL(route.request().url());if(['blob:','data:'].includes(u.protocol))return route.continue();if(u.hostname!=='127.0.0.1')return route.abort();if(u.port===String(PORT_FICHES_PAR_DEFAUT)){u.port=String(gmos.ports.fiches);return route.continue({url:u.href});}return [String(gmos.ports.fiches),String(gmos.ports.sync)].includes(u.port)?route.continue():route.abort();});
            await contexte.addInitScript(i=>localStorage.setItem('gmos-tablet-uuid','recette-runequest-'+i),i);
            const tablette=await contexte.newPage();tablette.setDefaultTimeout(15_000);
            tablette.on('websocket',ws=>ws.on('framereceived',trame=>{try{releverSecrets(JSON.parse(String(trame.payload)));}catch{/* non JSON */}}));
            await tablette.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
            await tablette.getByRole('button',{name:new RegExp(pc.name)}).click();await expect(tablette.getByText('Connecté',{exact:true})).toBeVisible();
            await tablette.getByTitle('Fiche Personnage',{exact:true}).click();await ongletDeLaFiche(tablette,'Lancer un test');
            const panneau=tablette.locator('[data-panneau-de-jet]').first();await panneau.locator('select').nth(0).selectOption('arme1');await expect(panneau.locator('[data-preparation-runequest]')).toBeVisible();
            const avant=await f.evaluate(()=>(window as unknown as FenetreRecette).useDiceStore.getState().history.length);await panneau.getByRole('button',{name:'Lancer',exact:true}).click();
            await expect.poll(()=>f.evaluate(()=>(window as unknown as FenetreRecette).useDiceStore.getState().history.length)).toBeGreaterThan(avant);jets++;await panneau.getByRole('button',{name:'Localiser le coup (1D20)',exact:true}).click();await expect(panneau.locator('[data-localisation-runequest]')).toContainText('PV sur la fiche');localisations++;
            await ongletDeLaFiche(tablette,'Ma fiche');const html=tablette.frameLocator('iframe:visible');
            await expect(html.locator('[data-key="identity.name"]')).toHaveValue(pc.name,{timeout:30_000});await expect(html.locator('[data-key="attributes.strength"]')).toHaveValue(String(pc.sheetData.for));
            await expect(html.locator('[data-key="weapons.melee.0.name"]')).toHaveValue(String(pc.sheetData.arme1_nom));
            await expect(html.locator('[data-key="weapons.melee.0.chance"]')).toHaveValue(String(pc.sheetData.arme1));
            await html.locator(`[data-key="magic.current"][data-value="${8+i}"]`).click();
            await expect.poll(()=>f.evaluate(id=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!.sheetData.points_de_magie,pc.id)).toBe(8+i);pm++;
            await image(tablette,`03-fiche-joueur-${i+1}-${largeur}`);
            expect(await tablette.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await tablette.getByTitle('Fermer la fiche',{exact:true}).click();await contexte.close();
        }}finally{await navigateur.close();}
        expect(jets).toBe(3);expect(pm).toBe(3);
        await f.reload();await attendreLHydratation(gmos);await verifierLesExistants();
        await expect.poll(()=>f.evaluate(()=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).length)).toBe(24);
        expect(await f.evaluate(campagne=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players[0].characters.find(c=>c.campaignId===campagne)!.playerNotes,C)).toBe('TRACE ENQUÊTE À CONSERVER');
        expect(await f.evaluate(ids=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).filter(c=>ids.includes(c.id)).map(c=>c.sheetData.points_de_magie),pcs.map(c=>c.id))).toEqual([8,9,10]);
        fs.writeFileSync(path.join(SORTIE,'verification-electron.json'),JSON.stringify({reussi:fuites.size===0,importNatif:true,remplacementIsole:true,reload:true,joueursExistantsConserves:true,anciensPJConserves:3,joueurs:inventaire.joueurs,ficheHTML:true,pmTablettes:pm,localisationsTablettes:localisations,jetsRecusParMJ:jets,tablettes:[360,768,1180],modulesSpecifiques:0,
        archives:['01-Les-Bornes-du-gue.gmos','02-Aptitudes-Combat-et-Sante.gmos','03-Runes-Passions-et-Magie.gmos'].map(fichier=>({fichier,sha256:createHash('sha256').update(fs.readFileSync(path.join(SORTIE,fichier))).digest('hex')})),secretsNonDiffuses:fuites.size===0,anomalies:[...fuites].map(chemin=>({cas:'GM-05',chemin,attendu:'secret absent des trames joueur',observe:'marqueur secret présent'}))},null,2));
        expect.soft(fuites.size,'GM-05 : secrets de séance reçus ; voir verification-electron.json').toBe(0);
    }finally{await gmos.fermer();}
});
