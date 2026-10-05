import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const dossier = new URL('.', import.meta.url);
const navigateur = await chromium.launch({channel:'msedge',headless:true});
const controles = [];
const ecrans = process.argv.slice(2).length ? process.argv.slice(2) : ['archives','pnj','lieux','messages','notifications'];
const mesurer = page => page.evaluate(() => {
  const cibles = [...document.querySelectorAll('button,a,[role="button"],select,textarea')].map(e => {
    const r=e.getBoundingClientRect(); return {texte:e.getAttribute('aria-label')||e.innerText,largeur:r.width,hauteur:r.height};
  }).filter(c=>c.largeur>0&&c.hauteur>0);
  return {largeurPage:document.documentElement.scrollWidth,largeurEcran:innerWidth,texte:document.body.innerText,cibles,petitesCibles:cibles.filter(c=>c.largeur<44||c.hauteur<44)};
});
try {
  for (const nom of ecrans) for (const format of ['telephone','paysage']) {
    const fichier=`${nom}-${format}.html`;
    try { await readFile(new URL(fichier,dossier)); } catch(e) {if(e.code==='ENOENT')continue;throw e;}
    for (const [largeur,hauteur] of format==='paysage'?[[1180,820]]:[[390,844],[360,800],[820,1180]]) {
      const page = await navigateur.newPage({viewport:{width:largeur,height:hauteur},deviceScaleFactor:1});
      // Captures déterministes sans supprimer les délais réels du prototype.
      await page.clock.install(); await page.clock.pauseAt(new Date());
      const erreurs=[],ressourcesEnEchec=[];
      page.on('pageerror',e=>erreurs.push(e.message));
      page.on('requestfailed',r=>ressourcesEnEchec.push({url:r.url(),raison:r.failure()?.errorText}));
      const url=new URL(fichier,dossier).href;
      const ouvrir=async suffixe=>{await page.goto(url+(suffixe||''),{waitUntil:'networkidle',timeout:60000});await page.evaluate(()=>document.fonts.ready);};
      await ouvrir();
      const cle=`${nom}-${format}-${largeur}`;
      const capture=async etat=>page.screenshot({path:fileURLToPath(new URL(`rendus/${cle}${etat?'-'+etat:''}.png`,dossier))});
      await mkdir(new URL('rendus/',dossier),{recursive:true});
      const releve=await mesurer(page);
      await capture();
      if(nom==='messages')await page.getByRole('button',{name:'Fermer la messagerie',exact:true}).click();
      const mode=page.locator('#bouton-mode-j2');await mode.click();
      const qualiteApres=(await mode.innerText()).includes('QUALITÉ');await mode.click();
      let confirmationRecue=false;page.once('dialog',async d=>{confirmationRecue=d.type()==='confirm';await d.dismiss();});
      await page.locator('footer').getByRole('button',{name:'Quitter',exact:true}).click();
      const navigation=[];
      for (const destination of ['Direct','Archives','PNJ','Lieux','Inventaire','Cartes','Fiche','Notes','Messages','Quitter']) {
        const b=await page.locator('footer').getByRole('button',{name:new RegExp('^'+destination)}).boundingBox();
        if(!b||b.x<0||b.x+b.width>largeur+1||b.y+b.height>hauteur+1)throw new Error(`${cle}: navigation masquée ${destination}`);
        navigation.push({destination,rectangle:b});
      }
      releve.gestesNavigation={qualiteApres,confirmationRecue,navigation};
      if(!qualiteApres||!confirmationRecue)throw new Error(`${cle}: navigation incorrecte`);
      if(['archives','pnj','lieux'].includes(nom)) {
        const titres=nom==='archives'?['Le café encore chaud','La signature unique']:nom==='pnj'?['Superviseur Hale']:['Station Varn'];
        const descriptions=nom==='archives'?["Le départ date de moins d'une heure.",'Tout le registre est signé « Hale », même les nuits où il dormait.']:nom==='pnj'?["Répond trop vite aux questions qu'on ne lui a pas posées."]:['Le pont C, entre le sas et le relais.'];
        const gestes=[];
        for(const [i,titre] of titres.entries()) {
          const carte=page.locator('[data-liste-j2]').getByRole('button',{name:new RegExp(titre)});
          await carte.scrollIntoViewIfNeeded();await carte.click();
          const detail=page.getByRole('dialog',{name:titre,exact:true});
          const ouvert=await detail.isVisible();
          if(!(await detail.getByText(descriptions[i],{exact:true}).isVisible()))throw new Error(`${cle}: description absente`);
          const mesures=await mesurer(page);if(mesures.petitesCibles.length)throw new Error(`${cle}: fermeture trop petite`);
          await capture(i?'detail-2':'detail');
          await detail.getByRole('button',{name:nom==='archives'?"Fermer l'indice":'Fermer',exact:true}).click();
          const fermeParBouton=await detail.isHidden();
          await carte.click();await page.keyboard.press('Escape');const fermeParEchap=await detail.isHidden();
          gestes.push({titre,ouvert,fermeParBouton,fermeParEchap});
          if(!ouvert||!fermeParBouton||!fermeParEchap)throw new Error(`${cle}: détail incorrect`);
        }
        const texte=await page.locator('main').innerText();
        const sansSecrets=!['La date corrigee','La pièce manquante','Ancre-7','gmSecretInfo','Il a réécrit le registre lui-même'].some(t=>texte.includes(t));
        if(!sansSecrets)throw new Error(`${cle}: contenu non partagé`);
        if(nom==='lieux'){
          const images=await page.locator('img').evaluateAll(images=>images.map(i=>({src:i.getAttribute('src'),chargee:i.complete&&i.naturalWidth>0})));
          if(images.some(i=>i.src!=='assets/plan-station-varn.png'||!i.chargee))throw new Error(`${cle}: plan incorrect`);
        }
        await ouvrir('?etat=vide');
        const vide=await page.locator('#vide-j2').isVisible()&&await page.locator('[data-liste-j2]').isHidden();
        await capture('vide');
        releve.gestesConsultation={gestes,sansSecrets,vide};if(!vide)throw new Error(`${cle}: état vide incorrect`);
      } else {
        if(nom==='messages')await page.locator('#destination-messages').click();
        if(nom==='notifications') {
          const toast=page.locator('#nouveau-message');const t=await toast.boundingBox();const pied=await page.locator('footer').boundingBox();
          if(!t||t.y+t.height>pied.y)throw new Error(`${cle}: notification masquée`);
          await toast.click();
          const ouvert=await page.locator('#messagerie-j2').isVisible();
          const lu=await page.locator('#badge-non-lu').isHidden();
          const messageRecu=await page.getByText('Le sas vient de se fermer.',{exact:true}).isVisible();
          await capture('conversation');
          releve.gestesNotification={ouvert,lu,messageRecu};if(!ouvert||!lu||!messageRecu)throw new Error(`${cle}: notification incorrecte`);
        }
        const panneau=page.locator('#messagerie-j2');
        const videDesactive=await page.locator('#envoyer-message').isDisabled();
        await page.locator('#message-saisi').fill('   ');const espacesDesactives=await page.locator('#envoyer-message').isDisabled();
        await page.locator('#message-saisi').fill('Message de contrôle <texte>');await page.locator('#envoyer-message').click();
        const envoiBouton=await page.getByText('Message de contrôle <texte>',{exact:true}).isVisible()&&await page.locator('#message-saisi').inputValue()==='';
        await page.locator('#choisir-destinataire').click();
        const destinataires=await page.locator('#destinataires-j2 button').allTextContents();
        await capture('destinataires');
        await page.locator('#destinataires-j2').getByRole('button',{name:'Tous les Joueurs',exact:true}).click();
        const generalVide=await page.getByText('Message de contrôle <texte>',{exact:true}).count()===0
          &&await page.getByText('Tout le monde pourra lire ce message.',{exact:true}).isVisible();
        await page.locator('#message-saisi').fill('Ligne 1');await page.locator('#message-saisi').press('Shift+Enter');await page.locator('#message-saisi').press('A');
        const sautDeLigne=(await page.locator('#message-saisi').inputValue()).includes('\n');
        await page.locator('#message-saisi').press('Enter');
        const envoiEnter=await page.locator('#message-saisi').inputValue()===''&&await page.locator('#conversation-j2 .message-ligne').count()===1;
        await page.locator('#choisir-destinataire').click();await page.locator('#destinataires-j2').getByRole('button',{name:'Idris Koa',exact:true}).click();
        const priveVide=await page.locator('#conversation-j2 .message-ligne').count()===0;
        await page.locator('#message-saisi').fill('Message privé de contrôle');await page.locator('#envoyer-message').click();
        await capture('prive');
        await page.locator('#choisir-destinataire').click();await page.locator('#destinataires-j2').getByRole('button',{name:'Maître du Jeu',exact:true}).click();
        const conversationsSeparees=await page.getByText('Message privé de contrôle',{exact:true}).count()===0&&await page.getByText('Message de contrôle <texte>',{exact:true}).isVisible();
        const mesures=await mesurer(page);if(mesures.petitesCibles.length)throw new Error(`${cle}: commande messagerie trop petite`);
        await panneau.getByRole('button',{name:'Fermer la messagerie',exact:true}).click();const ferme=await panneau.isHidden();
        await page.locator('#destination-messages').click();const rouvert=await panneau.isVisible();
        releve.gestesMessagerie={videDesactive,espacesDesactives,envoiBouton,destinataires,generalVide,sautDeLigne,envoiEnter,priveVide,conversationsSeparees,ferme,rouvert};
        if(![videDesactive,espacesDesactives,envoiBouton,generalVide,sautDeLigne,envoiEnter,priveVide,conversationsSeparees,ferme,rouvert].every(Boolean)
          ||destinataires.join('/')!=='Maître du Jeu/Tous les Joueurs/Idris Koa/Sora Adebayo')throw new Error(`${cle}: messagerie incorrecte`);
        if(nom==='notifications') {
          await ouvrir();await page.clock.runFor(5000);const toastExpire=await page.locator('#nouveau-message').isHidden();
          const badgePersiste=await page.locator('#badge-non-lu').isVisible();
          await ouvrir('?etat=alerte');await capture('alerte');
          await page.clock.runFor(8000);const alerteExpire=await page.locator('#alerte-j2').isHidden();
          await ouvrir('?etat=alerte');await page.getByRole('button',{name:'Fermer la notification',exact:true}).click();const alerteFermee=await page.locator('#alerte-j2').isHidden();
          Object.assign(releve.gestesNotification,{toastExpire,badgePersiste,alerteExpire,alerteFermee});
          if(!toastExpire||!badgePersiste||!alerteExpire||!alerteFermee)throw new Error(`${cle}: délais ou fermeture des notifications incorrects`);
        }
      }
      if(releve.largeurPage>largeur||releve.petitesCibles.length||erreurs.length||ressourcesEnEchec.length)throw new Error(`${cle}: ${JSON.stringify({petitesCibles:releve.petitesCibles,erreurs,ressourcesEnEchec})}`);
      controles.push({fichier,largeur,hauteur,erreurs,ressourcesEnEchec,...releve});await page.close();console.log(`${cle}: 0 débordement, 0 erreur JS, cibles ≥44, gestes vérifiés.`);
    }
  }
} finally {await navigateur.close();}
const precedents=JSON.parse(await readFile(new URL('controles.json',dossier),'utf8'));
const cles=new Set(controles.map(c=>`${c.fichier}/${c.largeur}`));
await writeFile(new URL('controles.json',dossier),JSON.stringify([...precedents.filter(c=>!cles.has(`${c.fichier}/${c.largeur}`)),...controles],null,2));
