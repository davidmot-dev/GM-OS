# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: campagneDeRecetteShadowrun.spec.ts >> les trois archives Shadowrun et les fiches fonctionnent sur trois Hub
- Location: e2e\campagneDeRecetteShadowrun.spec.ts:14:1

# Error details

```
Error: GM-05 : secrets de séance reçus ; voir verification-electron.json

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 12
```

# Test source

```ts
  21  |         fs.cpSync('docs/systems/shadowrun-anarchy/fiche', path.join(profil, 'corpus', 'systems', 'shadowrun-anarchy', 'fiche'), { recursive: true });
  22  |     } });
  23  |     const f = gmos.fenetre;
  24  |     f.on('console', message => { if (message.type() === 'error') console.error('[Shadowrun renderer]', message.text()); });
  25  |     f.on('pageerror', erreur => console.error('[Shadowrun page]', erreur.message));
  26  |     f.setDefaultTimeout(15_000);
  27  |     const fuites = new Set<string>();
  28  |     const releverSecrets = (valeur: unknown, chemin = '') => {
  29  |         if (typeof valeur === 'string' && valeur.includes('SECRET_MJ_SHADOWRUN_RECETTE')) fuites.add(chemin);
  30  |         else if (valeur && typeof valeur === 'object') for (const [cle, v] of Object.entries(valeur)) releverSecrets(v, chemin ? `${chemin}.${cle}` : cle);
  31  |     };
  32  |     const image = async (p: Page, nom: string) => p.screenshot({ path: path.join(captures, nom + '.jpg'), type: 'jpeg', quality: 80, animations: 'disabled', scale: 'css' });
  33  |     try {
  34  |         console.info("[Shadowrun étape] hydratation");await attendreLHydratation(gmos);
  35  |         await ouvrirLeModule(gmos, 'Tableau de Bord');
  36  |         // Profils et anciens PJ fictifs : mêmes identifiants que l'export fourni par David.
  37  |         // Le vrai export RDD ne quitte pas le dépôt et n'est jamais injecté dans les essais.
  38  |         const preexistants = ['Thomas D.', 'Marie C.', 'Lucas R.'].map((realName, i) => ({
  39  |             id: `p-${i + 1}`, realName, avatarUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text x="8" y="28">${i + 1}</text></svg>`)}`, isOnline: false,
  40  |             characters: [{ id: `recette-sentinelle-pj-${i + 1}`, name: `Ancien PJ fictif ${i + 1}`, classRace: 'Sentinelle', campaignId: 'recette-sentinelle', templateId: 'generic',
  41  |                 hp: 7, maxHp: 10, sheetData: { hp: 7, note: 'ANCIEN PJ À CONSERVER' }, playerNotes: 'NE PAS ÉCRASER' }],
  42  |         }));
  43  |         await f.evaluate(players => (window as unknown as FenetreRecette).useSessionOSStore.setState({
  44  |             campaigns: [{ id: 'recette-sentinelle', name: 'SENTINELLE — ne pas modifier', system: 'generic', activeLocationIds: [] }],
  45  |             players, entities: [], sessions: [], actes: [], scenes: [], atlasMaps: [], clues: [], rencontres: [], activeCampaignId: null, currentView: 'library',
  46  |         }), preexistants);
  47  |         const verifierLesExistants = async () => {
  48  |             const existants = await f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().players.map(p => ({
  49  |                 id: p.id, realName: p.realName, avatarUrl: p.avatarUrl, characters: p.characters.filter(c => c.campaignId === 'recette-sentinelle'),
  50  |             })));
  51  |             expect(existants).toEqual(preexistants.map(p => ({ id: p.id, realName: p.realName, avatarUrl: p.avatarUrl, characters: p.characters })));
  52  |         };
  53  |         const importer = async (fichier: string, campagne: string, remplacer = false) => {
  54  |             await gmos.application.evaluate(({ dialog }, cible) => {
  55  |                 dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [cible] });
  56  |             }, path.join(SORTIE, fichier));
  57  |             await f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().setCurrentView('library'));
  58  |             await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
  59  |             await f.locator(remplacer ? '#nexus-conflict-replace' : '#nexus-import-tel-quel').click();
  60  |             await expect.poll(() => f.evaluate(() => (window as unknown as FenetreRecette).useSessionOSStore.getState().activeCampaignId), { timeout: 45_000 }).toBe(campagne);
  61  |             const fermer = f.locator('#nexus-bilan-fermer');
  62  |             if (await fermer.isVisible()) await fermer.click();
  63  |         };
  64  |         console.info('[Shadowrun étape] import 01');await importer('01-La-Derniere-Couleur.gmos', C);
  65  |         await expect(f.getByText('RECETTE SHADOWRUN ANARCHY — La Dernière Couleur').first()).toBeVisible();
  66  |         await image(f, '01-campagne-importee');
  67  |         console.info('[Shadowrun étape] import 02');await importer('02-Moniteur-et-Seuils.gmos', 'recette-shadowrun-sante-campagne-couleur');
  68  |         console.info('[Shadowrun étape] import 03');await importer('03-Risque-Anarchy-et-Matrice.gmos', 'recette-shadowrun-risques-campagne-couleur');
  69  |         const inventaire = await f.evaluate(() => {
  70  |             const s = (window as unknown as FenetreRecette).useSessionOSStore.getState();
  71  |             return { campagnes: s.campaigns.map(c => c.id), joueurs: s.players.map(p => ({ id: p.id, nom: p.realName, personnages: p.characters.filter(c => c.campaignId !== 'recette-sentinelle').length })),
  72  |                 pnj: s.entities.length, lieux: s.atlasMaps.length, scenes: s.scenes.length, indices: s.clues.length };
  73  |         });
  74  |         expect(inventaire.campagnes).toHaveLength(4); expect(inventaire.campagnes).toContain('recette-sentinelle');
  75  |         expect(inventaire.joueurs.map(p => p.id)).toEqual(['p-1', 'p-2', 'p-3']);
  76  |         expect(inventaire.joueurs.map(p => p.nom)).toEqual(['Thomas D.', 'Marie C.', 'Lucas R.']);
  77  |         expect(inventaire.joueurs.reduce((n, p) => n + p.personnages, 0)).toBe(22);
  78  |         await verifierLesExistants();
  79  |         expect(inventaire.pnj).toBe(27); expect(inventaire.lieux).toBe(18); expect(inventaire.scenes).toBe(36); expect(inventaire.indices).toBe(27);
  80  |         await f.evaluate(campagne=>{const s=(window as unknown as FenetreRecette).useSessionOSStore.getState();const c=s.players[0].characters.find(c=>c.campaignId===campagne)!;s.updateCharacter(s.players[0].id,c.id,{playerNotes:'TRACE ENQUÊTE À CONSERVER'});const p=s.players.find(p=>p.characters.some(c=>c.name.startsWith('S02')))!;s.updateCharacter(p.id,p.characters.find(c=>c.name.startsWith('S02'))!.id,{playerNotes:'LABO À EFFACER'});},C);
  81  |         await importer('02-Moniteur-et-Seuils.gmos','recette-shadowrun-sante-campagne-couleur',true);
  82  |         expect(await f.evaluate(()=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.name.startsWith('S02'))!.playerNotes)).not.toBe('LABO À EFFACER');
  83  |         await f.evaluate(campagne=>{const st=(window as unknown as FenetreRecette).useSessionOSStore,s=st.getState();s.setActiveCampaign(campagne);s.setCurrentView('trame');st.setState({sessions:s.sessions.map(se=>se.campaignId===campagne&&se.number===1?{...se,status:'active' as const}:se)});},C);
  84  |         const pcs=await f.evaluate(campagne=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.map(p=>p.characters.find(c=>c.campaignId===campagne)!),C);
  85  |         expect((await f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire())).modules).toHaveLength(0);
  86  |         let jets=0,ego=0;const navigateur=await chromium.launch({channel:'msedge',args:['--mute-audio']});
  87  |         try{for(const [i,largeur]of [360,768,1180].entries()){
  88  |             console.info('[Shadowrun étape] Hub',largeur);const pc=pcs[i],contexte=await navigateur.newContext({viewport:{width:largeur,height:1000},isMobile:true,hasTouch:true,serviceWorkers:'block',locale:'fr-FR'});
  89  |             await contexte.route('**/*',route=>{const u=new URL(route.request().url());if(['blob:','data:'].includes(u.protocol))return route.continue();if(u.hostname!=='127.0.0.1')return route.abort();if(u.port===String(PORT_FICHES_PAR_DEFAUT)){u.port=String(gmos.ports.fiches);return route.continue({url:u.href});}return [String(gmos.ports.fiches),String(gmos.ports.sync)].includes(u.port)?route.continue():route.abort();});
  90  |             await contexte.addInitScript(i=>localStorage.setItem('gmos-tablet-uuid','recette-shadowrun-'+i),i);
  91  |             const tablette=await contexte.newPage();tablette.setDefaultTimeout(15_000);
  92  |             tablette.on('websocket',ws=>ws.on('framereceived',trame=>{try{releverSecrets(JSON.parse(String(trame.payload)));}catch{/* non JSON */}}));
  93  |             await tablette.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
  94  |             await tablette.getByRole('button',{name:new RegExp(pc.name)}).click();await expect(tablette.getByText('Connecté',{exact:true})).toBeVisible();
  95  |             await tablette.getByTitle('Fiche Personnage',{exact:true}).click();await ongletDeLaFiche(tablette,'Lancer un test');
  96  |             const panneau=tablette.locator('[data-panneau-de-jet]').first();
  97  |             await panneau.locator('select').nth(0).selectOption('competence_1');await panneau.locator('select').nth(1).selectOption('logique');
  98  |             await expect(panneau.locator('[data-preparation-shadowrun]')).toBeVisible();
  99  |             await panneau.getByLabel('Dés de risque',{exact:true}).fill('0');await panneau.getByLabel('Réduction du risque',{exact:true}).selectOption('0');
  100 |             await panneau.getByRole('checkbox',{name:/1 point d.Anarchy : avantage/}).check();
  101 |             const avant=await f.evaluate(()=>(window as unknown as FenetreRecette).useDiceStore.getState().history.length);await panneau.getByRole('button',{name:'Lancer',exact:true}).click();
  102 |             await expect.poll(()=>f.evaluate(()=>(window as unknown as FenetreRecette).useDiceStore.getState().history.length)).toBeGreaterThan(avant);jets++;
  103 |             await expect(panneau.locator('[data-suites-shadowrun]')).toBeVisible();
  104 |             await expect.poll(()=>f.evaluate(id=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!.sheetData.anarchy,pc.id)).toBe(Number(pc.sheetData.anarchy)-1);
  105 |             await ongletDeLaFiche(tablette,'Ma fiche');const html=tablette.frameLocator('iframe:visible');
  106 |             await expect(html.locator('[data-key="identity.name"]')).toHaveValue(pc.name,{timeout:30_000});
  107 |             await expect(html.locator('[data-key="attributes.agility"]')).toHaveValue(String(pc.sheetData.agilite));
  108 |             await html.locator('[data-key="attributes.logic"]').fill(String(3+i));
  109 |             const sauvegarder=html.getByRole('button',{name:/Sauvegarder/});if(await sauvegarder.isVisible())await sauvegarder.click();
  110 |             await expect.poll(()=>f.evaluate(id=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!.sheetData.logique,pc.id)).toBe(3+i);ego++;
  111 |             await image(tablette,`03-fiche-joueur-${i+1}-${largeur}`);
  112 |             expect(await tablette.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await tablette.getByTitle('Fermer la fiche',{exact:true}).click();await contexte.close();
  113 |         }}finally{await navigateur.close();}
  114 |         expect(jets).toBe(3);expect(ego).toBe(3);
  115 |         await f.reload();await attendreLHydratation(gmos);await verifierLesExistants();
  116 |         await expect.poll(()=>f.evaluate(()=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).length)).toBe(25);
  117 |         expect(await f.evaluate(campagne=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players[0].characters.find(c=>c.campaignId===campagne)!.playerNotes,C)).toBe('TRACE ENQUÊTE À CONSERVER');
  118 |         expect(await f.evaluate(ids=>(window as unknown as FenetreRecette).useSessionOSStore.getState().players.flatMap(p=>p.characters).filter(c=>ids.includes(c.id)).map(c=>c.sheetData.logique),pcs.map(c=>c.id))).toEqual([3,4,5]);
  119 |         fs.writeFileSync(path.join(SORTIE,'verification-electron.json'),JSON.stringify({reussi:fuites.size===0,importNatif:true,remplacementIsole:true,reload:true,joueursExistantsConserves:true,anciensPJConserves:3,joueurs:inventaire.joueurs,ficheHTML:true,fichesSauvegardees:ego,jetsRecusParMJ:jets,tablettes:[360,768,1180],modulesSpecifiques:0,
  120 |         archives:['01-La-Derniere-Couleur.gmos','02-Moniteur-et-Seuils.gmos','03-Risque-Anarchy-et-Matrice.gmos'].map(fichier=>({fichier,sha256:createHash('sha256').update(fs.readFileSync(path.join(SORTIE,fichier))).digest('hex')})),secretsNonDiffuses:fuites.size===0,anomalies:[...fuites].map(chemin=>({cas:'GM-05',chemin,attendu:'secret absent des trames joueur',observe:'marqueur secret présent'}))},null,2));
> 121 |         expect.soft(fuites.size,'GM-05 : secrets de séance reçus ; voir verification-electron.json').toBe(0);
      |                                                                                                      ^ Error: GM-05 : secrets de séance reçus ; voir verification-electron.json
  122 |     }finally{await gmos.fermer();}
  123 | });
  124 | 
```