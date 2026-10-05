import { chromium } from '@playwright/test';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dossier = fileURLToPath(new URL('.', import.meta.url));
const navigateur = await chromium.launch({ channel: 'msedge', headless: true });
const controles = [];
const ecransDemandes = process.argv.slice(2);
try {
  for (const fichier of (await readdir(dossier)).filter(nom => /^(accueil|direct|inventaire|cartes)-(telephone|paysage)\.html$/.test(nom)
    && (!ecransDemandes.length || ecransDemandes.includes(nom.split('-')[0]) || ecransDemandes.includes(basename(nom, '.html'))))) {
    const paysage = fichier.includes('paysage');
    for (const [largeur, hauteur] of paysage ? [[1180, 820]] : [[390, 844], [360, 800], [820, 1180]]) {
      const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: 1 });
      const erreurs = [];
      page.on('pageerror', erreur => erreurs.push(erreur.message));
      const ressourcesEnEchec = [];
      page.on('requestfailed', requete => ressourcesEnEchec.push({ url: requete.url(), raison: requete.failure()?.errorText }));
      await page.goto(pathToFileURL(resolve(dossier, fichier)).href, { waitUntil: 'networkidle', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      const releve = await page.evaluate(() => {
        const visibles = Array.from(document.querySelectorAll('button,a,[role="button"],select,input,textarea')).map(element => {
          const rectangle = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return { texte: element.innerText?.trim() || element.getAttribute('aria-label'), largeur: rectangle.width, hauteur: rectangle.height,
            visible: rectangle.width > 0 && rectangle.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' };
        }).filter(element => element.visible);
        return { largeurPage: document.documentElement.scrollWidth, largeurEcran: innerWidth,
          texte: document.body.innerText, police: getComputedStyle(document.body).fontFamily,
          fond: getComputedStyle(document.body).backgroundColor, cibles: visibles,
          petitesCibles: visibles.filter(element => element.largeur < 44 || element.hauteur < 44) };
      });
      const nom = `${basename(fichier, '.html')}-${largeur}`;
      await mkdir(join(dossier, 'rendus'), { recursive: true });
      await page.screenshot({ path: join(dossier, 'rendus', `${nom}.png`), fullPage: false });
      await page.screenshot({ path: join(dossier, 'rendus', `${nom}-complet.png`), fullPage: true });
      if (fichier.startsWith('accueil')) {
        const confirmation = page.locator('#quit-confirm-box');
        const cacheeAvant = await confirmation.isHidden();
        await page.locator('#btn-quit').click();
        const visibleApres = await confirmation.isVisible();
        const ciblesConfirmation = await confirmation.locator('button').evaluateAll(elements => elements.map(element => {
          const rectangle = element.getBoundingClientRect();
          return { texte: element.textContent.trim(), largeur: rectangle.width, hauteur: rectangle.height };
        }));
        await page.screenshot({ path: join(dossier, 'rendus', `${nom}-confirmation.png`), fullPage: false });
        await confirmation.getByRole('button', { name: 'Non', exact: true }).click();
        const cacheeApresAnnulation = await confirmation.isHidden();
        const choix = page.getByRole('button', { name: /Prendre ce personnage/i }).nth(2);
        await choix.scrollIntoViewIfNeeded();
        const troisiemeChoix = await choix.boundingBox();
        releve.gestesAccueil = { cacheeAvant, visibleApres, cacheeApresAnnulation, ciblesConfirmation, troisiemeChoix };
        if (!cacheeAvant || !visibleApres || !cacheeApresAnnulation || ciblesConfirmation.some(cible => cible.largeur < 44 || cible.hauteur < 44)) {
          throw new Error(`Confirmation incorrecte : ${nom}`);
        }
      }
      if (/^(direct|inventaire|cartes)-/.test(fichier)) {
        const destinations = ['Direct', 'Archives', 'PNJ', 'Lieux', 'Inventaire', 'Cartes', 'Fiche', 'Notes', 'Messages', 'Quitter'];
        const navigation = [];
        for (const destination of destinations) {
          const bouton = page.locator('footer').getByRole('button', { name: new RegExp(destination, 'i') });
          const rectangle = await bouton.boundingBox();
          navigation.push({ destination, rectangle });
          if (!rectangle || rectangle.x < 0 || rectangle.y < 0 || rectangle.x + rectangle.width > largeur + 1 || rectangle.y + rectangle.height > hauteur + 1) {
            throw new Error(`Destination hors écran : ${nom} / ${destination}`);
          }
        }
        const mode = page.locator('header button');
        await mode.click();
        const qualiteApres = (await mode.innerText()).includes('QUALITÉ');
        await mode.click();
        let confirmationRecue = false;
        page.once('dialog', async dialogue => { confirmationRecue = dialogue.type() === 'confirm'; await dialogue.dismiss(); });
        await page.locator('footer').getByRole('button', { name: /Quitter/i }).click();
        releve.gestesNavigation = { navigation, qualiteApres, confirmationRecue };
        if (!qualiteApres || !confirmationRecue) throw new Error(`Gestes de navigation incorrects : ${nom}`);
      }
      if (fichier.startsWith('inventaire')) {
        const donner = page.getByRole('button', { name: 'Donner', exact: true });
        await donner.scrollIntoViewIfNeeded();
        const cadreAction = await donner.boundingBox();
        const cadreNavigation = await page.locator('footer').boundingBox();
        if (cadreAction.y + cadreAction.height > cadreNavigation.y + 1) throw new Error(`Don masqué : ${nom}`);
        let jeterDemandeConfirmation = false;
        page.once('dialog', async dialogue => { jeterDemandeConfirmation = dialogue.type() === 'confirm'; await dialogue.dismiss(); });
        await page.getByRole('button', { name: 'Jeter', exact: true }).click();
        await donner.click();
        const don = page.getByRole('dialog', { name: 'Donner un objet', exact: true });
        if (!(await don.isVisible())) throw new Error(`Don absent : ${nom}`);
        const ciblesDon = await don.locator('button').evaluateAll(elements => elements.map(element => {
          const r = element.getBoundingClientRect();
          return { texte: element.innerText.trim(), largeur: r.width, hauteur: r.height, x: r.x, droite: r.right };
        }));
        if (ciblesDon.some(cible => cible.largeur < 44 || cible.hauteur < 44 || cible.x < 0 || cible.droite > largeur)) throw new Error(`Cible du don incorrecte : ${nom}`);
        await page.screenshot({ path: join(dossier, 'rendus', `${nom}-don.png`), fullPage: false });
        await don.getByRole('button', { name: 'Fermer le don', exact: true }).click();
        const fermeParBouton = await don.isHidden();
        await donner.click();
        await don.getByRole('button', { name: /Idris Koa/ }).click();
        const fermeApresChoix = await don.isHidden();
        const donnerBloque = await donner.isDisabled();
        const jeterBloque = await page.getByRole('button', { name: 'Jeter', exact: true }).isDisabled();
        const badge = await page.locator('#pending-badge').boundingBox();
        const titreObjet = await page.locator('#item-card h2,#item-card h3').boundingBox();
        const attenteSansChevauchement = badge.y >= titreObjet.y + titreObjet.height;
        await page.screenshot({ path: join(dossier, 'rendus', `${nom}-attente.png`), fullPage: false });
        releve.gestesInventaire = { cadreAction, cadreNavigation, jeterDemandeConfirmation, ciblesDon, fermeParBouton, fermeApresChoix, donnerBloque, jeterBloque, attenteSansChevauchement };
        if (!jeterDemandeConfirmation || !fermeParBouton || !fermeApresChoix || !donnerBloque || !jeterBloque || !attenteSansChevauchement) throw new Error(`Gestes du don incorrects : ${nom}`);
      }
      if (fichier.startsWith('cartes')) {
        const url = pathToFileURL(resolve(dossier, fichier)).href;
        const controlerAction = async bouton => {
          await bouton.scrollIntoViewIfNeeded();
          const r = await bouton.boundingBox();
          const pied = await page.locator('footer').boundingBox();
          if (!r || r.y < 0 || r.height < 44 || r.width < 44 || r.y + r.height > pied.y + 1) throw new Error(`Action carte masquée : ${nom}`);
          return r;
        };
        const sansDonAuRepos = await page.getByRole('combobox').count() === 0;
        const actionJouer = await controlerAction(page.getByRole('button', { name: 'Jouer Carte 2', exact: true }));
        await page.getByRole('button', { name: 'Agrandir Carte 2', exact: true }).click();
        const detail = page.getByRole('dialog', { name: 'Carte 2', exact: true });
        const detailOuvert = await detail.isVisible();
        await page.screenshot({ path: join(dossier, 'rendus', `${nom}-detail.png`) });
        await page.keyboard.press('Escape');
        const fermeParEchap = await detail.isHidden();
        await page.getByRole('button', { name: 'Agrandir Carte 2', exact: true }).click();
        await detail.getByText('Touchez pour fermer', { exact: true }).click();
        const fermeParToucher = await detail.isHidden();
        await controlerAction(page.getByRole('button', { name: 'Piocher', exact: true }));
        await page.getByRole('button', { name: 'Piocher', exact: true }).click();
        const piocheCorrecte = (await page.locator('#remainingCardsVal').innerText()) === '3'
          && await page.getByRole('button', { name: 'Jouer Carte 3', exact: true }).count() === 1;
        await page.getByRole('button', { name: 'Jouer Carte 2', exact: true }).click();
        const carteJoueeRetiree = await page.getByRole('button', { name: 'Jouer Carte 2', exact: true }).count() === 0;
        await page.goto(`${url}?etat=proposition`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const propositionAvantPaquets = await page.locator('#incoming-offer').evaluate(e => e.parentElement.firstElementChild === e);
        await controlerAction(page.getByRole('button', { name: 'Accepter', exact: true }));
        await page.screenshot({ path: join(dossier, 'rendus', `${nom}-proposition.png`) });
        await page.getByRole('button', { name: 'Refuser', exact: true }).click();
        const refusCorrect = await page.locator('#incoming-offer').count() === 0 && await page.getByRole('button', { name: 'Jouer Carte 3', exact: true }).count() === 0;
        await page.goto(`${url}?etat=proposition`, { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: 'Accepter', exact: true }).click();
        const acceptationCorrecte = await page.locator('#incoming-offer').count() === 0 && await page.getByRole('button', { name: 'Jouer Carte 3', exact: true }).count() === 1;
        await page.goto(`${url}?etat=voisin`, { waitUntil: 'networkidle' });
        const destinataires = await page.getByRole('combobox', { name: 'Donner à' }).locator('option').allTextContents();
        await page.getByRole('combobox', { name: 'Donner à' }).selectOption('Idris Koa');
        const donEnAttente = await page.getByText('Proposition en attente', { exact: true }).isVisible()
          && await page.getByRole('button', { name: 'Jouer Carte 2', exact: true }).count() === 0
          && await page.getByRole('combobox').count() === 0;
        await page.screenshot({ path: join(dossier, 'rendus', `${nom}-attente.png`) });
        await page.goto(`${url}?etat=scellee`, { waitUntil: 'networkidle' });
        const scelleeAnonyme = await page.locator('#sealed-card img,#sealed-card button,#sealed-card [onclick]').count() === 0;
        await page.locator('#sealed-card').scrollIntoViewIfNeeded();
        const scellee = await page.locator('#sealed-card').boundingBox();
        const piedScellee = await page.locator('footer').boundingBox();
        if (scellee.y + scellee.height > piedScellee.y + 1) throw new Error(`Carte sous scellé masquée : ${nom}`);
        await page.screenshot({ path: join(dossier, 'rendus', `${nom}-scellee.png`) });
        await page.goto(`${url}?etat=vide`, { waitUntil: 'networkidle' });
        const paquetVideBloque = await page.getByRole('button', { name: 'Piocher', exact: true }).isDisabled();
        const mainVide = await page.getByText('Vous ne tenez aucune carte.', { exact: true }).isVisible();
        releve.gestesCartes = { sansDonAuRepos, actionJouer, detailOuvert, fermeParEchap, fermeParToucher, piocheCorrecte, carteJoueeRetiree,
          propositionAvantPaquets, refusCorrect, acceptationCorrecte, destinataires, donEnAttente, scelleeAnonyme, paquetVideBloque, mainVide };
        if (![sansDonAuRepos, detailOuvert, fermeParEchap, fermeParToucher, piocheCorrecte, carteJoueeRetiree, propositionAvantPaquets,
          refusCorrect, acceptationCorrecte, donEnAttente, scelleeAnonyme, paquetVideBloque, mainVide].every(Boolean)
          || destinataires.join('/') !== 'Donner à/Idris Koa') throw new Error(`Gestes des cartes incorrects : ${nom}`);
      }
      if (releve.largeurPage > largeur || erreurs.length || ressourcesEnEchec.length || releve.petitesCibles.length) {
        throw new Error(`Rendu incorrect : ${nom} / ${JSON.stringify({ erreurs, ressourcesEnEchec, petitesCibles: releve.petitesCibles })}`);
      }
      controles.push({ fichier, largeur, hauteur, erreurs, ressourcesEnEchec, ...releve });
      await page.close();
      console.log(`${nom} : débordement ${releve.largeurPage - largeur}px, ${erreurs.length} erreurs JS, ${releve.petitesCibles.length} petites cibles`);
    }
  }
} finally {
  await navigateur.close();
}
let precedents = [];
try { precedents = JSON.parse(await readFile(join(dossier, 'controles.json'), 'utf8')); }
catch (erreur) { if (erreur.code !== 'ENOENT') throw erreur; }
const clesRefaites = new Set(controles.map(controle => `${controle.fichier}/${controle.largeur}`));
await writeFile(join(dossier, 'controles.json'), JSON.stringify([
  ...precedents.filter(controle => !clesRefaites.has(`${controle.fichier}/${controle.largeur}`)), ...controles,
], null, 2));
