import fs from 'node:fs';
fs.mkdirSync('output/clips/crimes/pilote',{recursive:true});
fs.copyFileSync('scratch/recette-pilotes/Crime_driver_gmos_complet.gmos-driver','output/clips/crimes/pilote/Crime_driver_gmos_complet.gmos-driver');
const modele=fs.readFileSync('e2e/clipNephilim.spec.ts','utf8');
let tete=modele.slice(0,modele.indexOf("test('les mécanismes"));
tete=tete.replaceAll('Nephilim','Crimes').replaceAll('NEPHILIM','CRIMES').replaceAll('nephilim','crimes').replaceAll('05/11/2026','06/11/2026');
tete=tete.replace('output/campagnes-tests/crimes/Crimes-2.0.0.gmos-driver','output/clips/crimes/pilote/Crime_driver_gmos_complet.gmos-driver').replace('clip-aster','clip-leonce');
tete=tete.replace("import type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';", "import type { useCombatStore } from '../src/modules/combat/useCombatStore';");
tete=tete.replace('useRessourcesDeTableStore: typeof useRessourcesDeTableStore','useCombatStore: typeof useCombatStore');
tete=tete.replace('palette or et indigo','palette cuivre et encre').replaceAll('#e8c780','#daa47b').replaceAll('#31244e','#302121').replaceAll('#c7b9e7','#d4bbb0');
tete=tete.replace('async chapitre(texte: string) {','async chapitre(texte: string) {\n        await this.legende(\'\', \'\', 0);');
const corps=String.raw`
test('les mécanismes particuliers de Crimes, en clip', async () => {
    test.setTimeout(720_000);
    expect(fs.existsSync(PILOTE)).toBe(true);
    fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()), brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-crimes-'));
    if (!path.resolve(brut).startsWith(racineTemp+path.sep)) throw new Error('Profil inattendu.');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    expect(source.gameDriver.jet.garde.psychologie).toBeTruthy(); expect(source.gameDriver.enquete).toBeTruthy();
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')), s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Le billet de la verrière',system:source.gameDriver.id,activeLocationIds:[]}];
    s.activeCampaignId=CAMPAGNE; s.customGameDrivers=[source.gameDriver]; s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    s.players=[{id:JOUEUR,realName:'Joueur fictif',isOnline:false,characters:[{id:PERSO,name:'Léonce Varin',campaignId:CAMPAGNE,
        systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:0,maxHp:0,sheetData:{...valeurs,
            physique:5,mental:4,social:3,sport:2,combat:2,pratique:1,specialties_sport_climbing:true,
            fatigue_physique:0,epuisement_physique:0,blessures_physique:0,fatigue_mental:0,epuisement_mental:0,blessures_mental:0,
            fatigue_social:0,epuisement_social:0,blessures_social:0,depassement_de_la_scene:0,
            angoisse:2,nevrose:2,seuil_nevrose:7,psychose:2,base_psychose:2,inclinaison_psychotique:'Paranoïa',
            limier:1,compteur_limier:1,fouineur:0,compteur_fouineur:0,contacts_0_name:'Adèle, archiviste',contacts_0_rating:3,
            contacts_0_influence:2,contacts_0_appels:0,fortune:2,fortune_piste:9,munitions:6,points_de_developpement:6,
            psychology_emotivity:'Oui',psychology_activity:'Oui',psychology_reactivity:'Secondaire',sexe_age:'Homme, 34 ans'}}]}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const dossier of ['theme','fiche']) {const entree=path.resolve('docs/systems/crime',dossier);if(fs.existsSync(entree))fs.cpSync(entree,path.join(profil,'corpus/systems/crime',dossier),{recursive:true});}
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];
    f.setDefaultTimeout(15_000);let ouverture=0,fin=0,reussi=false;
    const personnage=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().players.find(p=>p.id==='clip-joueur-crimes')!.characters[0]);
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string)=>f.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85});
    const vue=async(v:'players'|'cockpit'|'library')=>{await f.evaluate(v=>(window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView(v),v);if(v==='players')await ongletDeLaFiche(f,'Lancer un test');};
    try {
        await attendreLHydratation(g);const fenetre=await g.application.browserWindow(f);
        await fenetre.evaluate((w,t)=>{w.unmaximize();w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');
        await f.evaluate(()=>{const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState();s.setActiveCampaign('clip-crimes');s.setSelectedPlayer('clip-joueur-crimes');s.setSelectedCharacter('clip-leonce');s.setCurrentView('players');
            s.addClue({campaignId:'clip-crimes',title:'Le billet de la verrière',content:'Une livraison fut déplacée à minuit. Indice fictif de démonstration.',isRevealed:false,seuilsDEnquete:[{style:'limier',points:3}],gainsDEnquete:[{style:'limier',points:1}]} as never);
            s.addEntity({id:'clip-surineur',name:'Le surineur',type:'npc',role:'hostile',status:'alive',avatar:'',hp:0,maxHp:0,ac:0,speed:0,initiative:0,description:'Adversaire fictif',roleplayingNotes:'',gmSecretInfo:'',linkedMapIds:[],campaignId:'clip-crimes',sheetData:{physique:5,fatigue_physique:0,epuisement_physique:0,blessures_physique:0}} as never);
            const e=w.useSessionOSStore.getState().entities.find(x=>x.name==='Le surineur')!;w.useCombatStore.getState().clearCombatants();
            w.useCombatStore.getState().addCombatant({name:e.name,init:0,isPlayer:false,sourceEntityId:e.id,faction:'enemy',statuses:[]});
        });
        await ongletDeLaFiche(f,'Lancer un test');await f.evaluate(installerLaScene);
        const panneau=f.locator('[data-panneau-de-jet]').first(),principal=panneau.locator('select').nth(0),competence=panneau.locator('select').nth(1);
        const resultat=panneau.getByRole('region',{name:'Résultat',exact:true});
        const jeter=async(faces:number[])=>{await r.des(faces.map(n=>(n-.5)/10));await r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true}));await r.rendreLeHasard();await r.montrer(resultat,1000);};
        await r.carte('');ouverture=Date.now();
        await r.titre('Crimes · les mécanismes du jeu',['Une affaire fictive dans GM-OS','Dés gardés · Dépassement · Atteintes · Psychologie · Enquête','Profil jetable, vrais gestes — dés préparés, légendes sans voix.']);

        await chapitre('1 · Potentiel GARDE Compétence');
        await r.choisir(principal,'physique');await r.choisir(competence,'sport');
        await r.legende('Physique 5 donne cinq d10 ; Sport 2 permet d’en garder deux.','Seuil 8 si compétent, 9 sans compétence, 7 avec une spécialisation appropriée.',3000);
        await r.montrer(panneau.locator('[data-garde]'),3000);await jeter([1,3,4,9,10]);
        await expect(resultat).toContainText('Réussite mitigée');
        await r.legende('Tous les 1 sont gardés d’office : ici, 1 et 10.','Une réussite et un 1 donnent une réussite mitigée. Les autres dés sont écartés.',3000);await photo('01-garde');
        await r.choisir(panneau.getByRole('combobox',{name:/Spécialisation/}),{label:'Escalade'});
        await expect(panneau.locator('[data-garde]')).toContainText('spécialisé (Escalade)');
        await jeter([3,4,5,8,10]);
        await r.legende('La garde se choisit : on peut accepter un échec volontaire.','Les 1 restent imposés. Deux dés écartés remplacent ici les deux réussites gardées.',3000);
        await r.cliquer(panneau.locator('[data-de-de-la-garde="0"]'));await r.cliquer(panneau.locator('[data-de-de-la-garde="1"]'));
        await expect(resultat).toContainText('Échec');await r.cliquer(panneau.getByRole('button',{name:'Consigner cette garde',exact:true}));await photo('02-garde-choisie');
        await r.choisir(panneau.getByRole('combobox',{name:/Spécialisation/}),'');

        await chapitre('2 · Se dépasser : le succès a un prix');
        await r.cocher(panneau.locator('[data-depassement]'));
        await r.legende('Le dépassement s’annonce avant les dés.','Une passion, une conviction ou la situation de combat le justifie à la table.',2800);
        await jeter([1,9,10,8,5]);await r.cliquer(panneau.locator('[data-se-depasser="1"]'));
        await expect.poll(async()=>(await personnage()).sheetData.fatigue_physique).toBe(1);
        await expect(panneau.locator('[data-depassement]')).toBeDisabled();
        await r.legende('Une réussite écartée entre dans la garde, contre une fatigue.','Deux réussites dépassent le 1 : réussite. Un seul dépassement par scène.',3300);await r.montrer(resultat,2800);await photo('03-depassement');

        await chapitre('3 · Atteintes et récupération');await r.carte('atteintes-crimes');
        const atteintes=f.locator('[data-atteintes-du-potentiel="physique"]');
        await r.cliquer(atteintes.getByRole('button',{name:'+ Épuisement',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.fatigue_physique).toBe(0);
        await r.cliquer(atteintes.getByRole('button',{name:'+ Blessure',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.epuisement_physique).toBe(0);
        await r.legende('L’atteinte la plus grave remplace une marque moindre.','L’épuisement remplace la fatigue ; la blessure remplace l’épuisement. La base reste 5.',3000);
        await r.cliquer(atteintes.getByRole('button',{name:'+ Épuisement',exact:true}));await r.cliquer(atteintes.getByRole('button',{name:'+ Fatigue',exact:true}));
        await expect(panneau).toContainText('− 3 (atteintes)');await r.montrer(atteintes,3000);await photo('04-atteintes');
        await vue('cockpit');await r.cliquer(f.getByRole('button',{name:/Bonne nuit/}));
        const nuit=f.locator('[data-gestes-des-heros="bonneNuit"]');
        await r.legende('Bonne nuit montre les changements avant de les écrire.','La fatigue et une croix d’épuisement disparaissent. La blessure reste.',3200);await r.montrer(nuit,3000);await photo('05-bonne-nuit');
        await r.cliquer(nuit.getByRole('button',{name:'Appliquer',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.epuisement_physique).toBe(0);
        await expect.poll(async()=>(await personnage()).sheetData.fatigue_physique).toBe(0);
        await expect.poll(async()=>(await personnage()).sheetData.blessures_physique).toBe(1);
        await vue('players');await r.carte('atteintes-crimes');
        await r.legende('Les soins demandent une décision du meneur.','Pour la suite de cette démonstration, le meneur accorde le soin de cette blessure.',2600);
        await r.cliquer(atteintes.getByRole('button',{name:'Soigner',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.blessures_physique).toBe(0);

        await chapitre('4 · Angoisse, Névrose et Psychose');await r.carte('psychologie-crimes');
        const psy=f.locator('[data-psychologie]');
        await r.cliquer(psy.locator('[data-jauge="angoisse"]').getByRole('button',{name:'+1',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.angoisse).toBe(3);
        await expect.poll(async()=>(await personnage()).sheetData.nevrose).toBe(3);
        await r.legende('Une ambiance angoissante fait monter Angoisse et Névrose ensemble.','Les seuils rappellent leurs effets ; l’état de folie se choisit selon l’inclinaison.',3000);
        await r.choisir(psy.locator('[data-intensite]'),'1');await r.des([.15,.25,.35,.45]);
        await r.cliquer(psy.getByRole('button',{name:'Lancer le test psychotique',exact:true}));await r.rendreLeHasard();
        await expect(psy.locator('[data-issue-psychotique]')).toContainText('État de folie');
        await r.cliquer(psy.getByRole('button',{name:'Noter +1 Psychose',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.psychose).toBe(3);
        await r.legende('Test psychotique : Mental actuel GARDE 1, seuil Psychose + Angoisse.','Ici l’échec propose +1 Psychose. Le meneur choisit et décrit l’état de folie.',3300);await r.montrer(psy,3000);await photo('06-psychologie');

        await chapitre('5 · Dossier d’enquête : découvrir, révéler, partager');await r.carte('');
        await r.choisir(principal,'mental');await r.choisir(competence,'pratique');await jeter([9,5,4,3]);
        await r.legende('Si la routine a fait avancer l’enquête, le meneur attribue ses points.','Les points d’un style se cumulent ; ils ne sont pas dépensés pour obtenir un indice.',3000);
        await r.cliquer(panneau.locator('[data-point-d-enquete="limier"]'));
        await expect.poll(async()=>(await personnage()).sheetData.compteur_limier).toBe(2);
        await vue('library');await r.cliquer(f.locator('div.flex-col.overflow-hidden.rounded-xl',{hasText:'Le billet de la verrière'}).getByRole('button',{name:/Modifier/}).first());
        await r.cliquer(f.getByRole('button',{name:/Indices$/}).first());
        const dossier=f.locator('[data-dossier-d-enquete]');
        await r.cliquer(dossier.getByRole('button',{name:'Un point de plus : Léonce Varin, Limier',exact:true}));
        await expect(dossier.locator('[data-indices-a-portee]')).toContainText('Limier 3/3');
        await r.legende('Limier 3 atteint le seuil : le billet devient « à portée ».','L’outil alerte ; il ne révèle pas l’indice de lui-même.',3000);await r.montrer(dossier.locator('[data-indices-a-portee]'),2800);await photo('07-indice-a-portee');
        await r.cliquer(dossier.getByRole('button',{name:'Révéler à Léonce Varin',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.compteur_limier).toBe(4);
        const indice=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().clues.find(c=>c.title==='Le billet de la verrière')!);
        expect((await indice()).isRevealed).toBe(false);expect((await indice()).connuDe).toEqual([PERSO]);
        await r.legende('Révélé à Léonce seul, l’indice reste privé ; son gain ajoute +1 Limier.','Quand il le raconte aux autres : « Partager à la table ». L’origine reste connue.',3400);
        await r.montrer(dossier.locator('[data-indices-prives]'),3000);await photo('08-indice-prive');
        await r.cliquer(dossier.getByRole('button',{name:'Partager à la table',exact:true}));expect((await indice()).isRevealed).toBe(true);
        await r.taper(dossier.locator('[data-nouvelle-hypothese]'),'La livraison dissimule un rendez-vous.');
        await r.cliquer(dossier.locator('[data-hypotheses]').getByRole('button',{name:'Noter',exact:true}));
        await r.legende('Le dossier garde aussi les hypothèses de la table.','On peut les écarter ou les rouvrir ; leur vérité reste une affaire de récit.',2800);await r.montrer(dossier.locator('[data-hypotheses]'),2800);await photo('09-hypothese');
        await r.cliquer(f.getByRole('button',{name:'Fermer la fenêtre',exact:true}));await vue('players');

        await chapitre('6 · Combat : arme, opposition, protection et munitions');await r.carte('');
        await r.choisir(principal,'physique');await r.choisir(competence,'combat');
        const attaque=panneau.locator('[data-attaque-de-crimes]');await r.choisir(attaque.locator('select').first(),'canne-epee');
        await r.choisir(attaque.locator('[data-cible]'),{label:'Le surineur'});await r.taper(attaque.locator('[data-protection]'),'2');
        await r.legende('Canne-épée : Physique de l’attaquant + bonus d’arme.','Deux réussites, cible Physique 5, protection 2 : 2 + (5 + 2) − 5 − 2 = 2 blessures.',3300);
        await jeter([10,9,5,4,3]);await expect(resultat).toContainText('Touché : 2 blessures');
        await r.cliquer(panneau.locator('[data-infliger]'));
        await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().entities.find(e=>e.name==='Le surineur')!.sheetData!.blessures_physique)).toBe(2);
        await r.montrer(resultat,3200);await photo('10-attaque');
        await r.choisir(attaque.locator('select').first(),'protector');await r.taper(attaque.locator('[data-distance]'),'20');
        await r.legende('Avec le revolver Protector, 20 mètres dépassent sa portée utile de 15.','Une réussite est retirée ; au-delà de 30 mètres, le tir serait impossible.',3000);
        await jeter([10,9,5,4,3]);
        await r.cliquer(resultat.getByRole('button',{name:'−1 munition',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.munitions).toBe(5);
        await r.cliquer(resultat.getByRole('button',{name:'Recharger',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.munitions).toBe(10);
        await r.legende('Les munitions se retirent et se rechargent explicitement.','Les manœuvres sont proposées au même endroit ; l’initiative narrative reste au meneur.',3000);await r.montrer(resultat,2800);await photo('11-munitions');

        await chapitre('7 · Contacts et fortune');await r.carte('contacts-fortune-crimes');
        const contacts=f.locator('[data-contacts-et-fortune]'),contact=contacts.locator('[data-contact="Adèle, archiviste"]');
        await r.cliquer(contact.getByRole('button',{name:'Appel −1',exact:true}));await expect(contact).toContainText('loyauté 2/3');
        await expect.poll(async()=>(await personnage()).sheetData.contacts_0_rating).toBe(3);
        await r.legende('Un appel réduit la loyauté actuelle pour ce scénario.','La base reste 3. Les contacts sont gérés par le meneur seul.',3000);await r.montrer(contact,2800);await photo('12-contact');
        await r.cliquer(contacts.getByRole('button',{name:'Fin du scénario : loyautés restaurées',exact:true}));await expect(contact).toContainText('loyauté 3/3');
        await r.cliquer(contacts.getByRole('button',{name:'Achat conséquent −1',exact:true}));
        await r.cliquer(contacts.getByRole('button',{name:'Rétribution +1',exact:true}));await r.cliquer(contacts.getByRole('button',{name:'Rétribution +1',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.fortune).toBe(3);
        await expect.poll(async()=>(await personnage()).sheetData.fortune_piste).toBe(5);
        await r.legende('La jauge de fortune à 10 fait monter le niveau, puis repart à 5.','Seuil 10 : choix de David pour ce pilote. Le livre ne chiffre pas ce seuil.',3300);await r.montrer(contacts.locator('[data-fortune]'),3000);await photo('13-fortune');

        await chapitre('8 · Tempérament, création et développement');await r.carte('creation-crimes');
        const creation=f.locator('[data-creation]');await expect(creation).toContainText('Passionné');
        await r.legende('Les trois choix de Jung déterminent le tempérament.','La carte vérifie les budgets de création et les conditions des spécialisations.',3000);await r.montrer(creation.locator('[data-regles-de-creation]'),3000);
        await r.choisir(creation.locator('[data-amelioration]'),'mental');
        await r.legende('Le développement annonce son coût avant de modifier la fiche.','Mental 4 → 5 coûte cinq points ; la progression doit être justifiée dans l’histoire.',3200);
        await r.cliquer(creation.getByRole('button',{name:'Dépenser',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.mental).toBe(5);
        await expect.poll(async()=>(await personnage()).sheetData.points_de_developpement).toBe(1);
        await r.montrer(creation,3000);await photo('14-developpement');
        await r.titre('L’enquête peut continuer',['Composer le test, choisir sa garde, puis confirmer les suites.',
            'Dossier d’enquête : révéler à un enquêteur, partager quand il en parle.',
            'Les circonstances, les états de folie et les choix de récit restent au meneur.'],6500);
        reussi=true;fin=Date.now();
    } catch(erreur) {await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});throw erreur;}
    finally {
        const video=f.video();await g.fermer();const fichierVideo=await video?.path();
        if(reussi&&fichierVideo){
            const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/exporter_clip.mjs',fichierVideo,SORTIE,'crimes-mecanismes',String((fin-ouverture)/1000)],{encoding:'utf8'}));
            fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:(fin-ouverture)/1000,chapitres,exportVideo,
                assertions:['1 imposé et réussite mitigée','spécialisation Escalade','garde choisie en échec et consignée','dépassement : fatigue 1 et blocage par scène',
                    'atteinte grave remplace la moindre','Bonne nuit conserve la blessure','soin explicite','Angoisse et Névrose +1','test psychotique et Psychose +1',
                    'gain Limier 1 → 2 puis seuil 3','indice privé puis partagé, gain Limier 4','hypothèse notée','2 blessures à la cible','munitions 6 → 5 → 10',
                    'contact 2/3, base conservée, restauration','fortune niveau 3 et jauge 5','Mental 4 → 5 et développement 6 → 1']},null,2));
        }
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');
    }
});
`;
fs.writeFileSync('e2e/clipCrimes.spec.ts',tete+corps);
