/** Démonstration locale avec données fictives ; aucune écoute réseau. */
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { cleSauvegardeConfiguration } from './configuration.mjs';
import { verifierSauvegarde } from './captures-sauvegarde.mjs';
import { verifierEffetsPiratage } from './captures-piratage.mjs';
import { verifierDetecteur } from '../../captures-detecteur.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const sortie = fileURLToPath(new URL('../../../../scratch/muthur-v1/', import.meta.url));
const resultat = await build({
  entryPoints: [path.join(ici, 'atelier.mjs')],
  bundle: true, write: false, format: 'iife', platform: 'browser',
  plugins: [{ name: 'video-de-demonstration', setup(construction) {
    construction.onLoad({ filter: /[\\/]medias\.mjs$/ }, () => ({ contents: 'export const videoAlerteUrl = "./nostromo-autodestruction.webm";', loader: 'js' }));
  } }],
  define: { 'process.env.NODE_ENV': '"production"' },
});
const css = await readFile(path.join(ici, 'style.css'), 'utf8');
const script = resultat.outputFiles[0].text.replaceAll('</script', '<\\/script');
const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MU/TH/UR — démonstration du module v1</title><style>
html{color-scheme:dark}body{margin:0;padding:12px;background:#111a16;color:#d9e9df;font:14px/1.5 system-ui}main{max-width:1180px;margin:auto}.atelier{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}.atelier button,.preparation button{min-height:44px;padding:8px 12px;font:inherit}.atelier span{flex:1 1 220px}.preparation{padding:12px;border:1px solid #4b8055;border-radius:6px;margin-bottom:12px;overflow-wrap:anywhere}.preparation p{margin:8px 0}.preparation .actions{display:flex;flex-wrap:wrap;gap:8px}.preparation [role=alert]{color:#ffb3a3}.preparation small{display:block;margin-top:8px;color:#b5c8bd}.preparation [hidden]{display:none}#confirmationImport{border-top:1px solid #4b8055;margin-top:12px;padding-top:8px}${css}
</style><main><div class="atelier"><span>Atelier local MU/TH/UR · préparation du MJ</span><button id="joueur">Vue joueur</button><button id="meneur">Poste meneur</button></div>
<section id="configurationAtelier" class="preparation" aria-label="Sauvegarde de la configuration" hidden>
  <strong>Préparation : réglages, dossiers et codes</strong>
  <p id="sauvegardeStatut" role="status"></p>
  <div class="actions"><button id="exporterConfiguration" type="button">Exporter la configuration</button><button id="importerConfiguration" type="button">Importer une configuration</button></div>
  <input id="fichierConfiguration" type="file" accept="application/json,.json" aria-label="Fichier de configuration MU/TH/UR" hidden>
  <small>La copie locale dépend de ce navigateur. Le fichier exporté contient les codes et le mot de passe du MJ ; gardez-le pour vous. Les dialogues et les alertes en cours ne sont pas sauvegardés.</small>
  <p id="transfertStatut" role="alert"></p>
  <section id="confirmationImport" aria-label="Import à confirmer" hidden>
    <p id="resumeImport"></p><p>Cette importation remplace les réglages, dossiers et protocoles actuels et remet la démonstration à zéro.</p>
    <div class="actions"><button id="annulerImport" type="button">Annuler l’import</button><button id="confirmerImport" type="button">Remplacer la configuration</button></div>
  </section>
</section><div id="module"></div></main><script>${script}</script></html>`;
await mkdir(sortie, { recursive: true });
await writeFile(path.join(sortie, 'apercu.html'), html, 'utf8');
await copyFile(path.resolve(ici, '../../medias/nostromo-autodestruction.webm'), path.join(sortie, 'nostromo-autodestruction.webm'));
console.log(`Démonstration autonome : ${path.join(sortie, 'apercu.html')}`);

if (process.argv.includes('--capturer')) {
  let navigateur;
  try { navigateur = await chromium.launch({ headless: true }); }
  catch { navigateur = await chromium.launch({ channel: 'msedge', headless: true }); }
  try {
    const contexte = await navigateur.newContext({ offline: true, reducedMotion: 'reduce' });
    // Chaque capture repart de données fictives, dans ce profil de test jetable seulement.
    await contexte.addInitScript(cle => localStorage.removeItem(cle), cleSauvegardeConfiguration);
    const page = await contexte.newPage();
    const erreurs = [];
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    await page.route(/^https?:/, route => route.abort());
    let captures = 0;
    for (const largeur of [360, 390, 1180]) {
      await page.setViewportSize({ width: largeur, height: 900 });
      for (const role of ['joueur', 'mj']) {
        await page.goto(pathToFileURL(path.join(sortie, 'apercu.html')).href);
        await page.getByRole('heading', { name: 'MU/TH/UR 6000', exact: true }).waitFor();
        if (role === 'mj') {
          await page.evaluate(() => window.apercuMuthur('mj'));
          await page.getByRole('heading', { name: 'MU/TH/UR · Poste meneur' }).waitFor();
        }
        for (const panneau of role === 'mj' ? ['Terminal', 'Dossiers', 'Protocoles', 'Réglages'] : ['Terminal']) {
          if (role === 'mj') await page.getByRole('button', { name: panneau, exact: true }).click();
          const deborde = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
          if (deborde) throw new Error(`Débordement : ${role}, ${panneau}, ${largeur} px.`);
          const nom = `${role}-${panneau === 'Réglages' ? 'reglages' : panneau.toLowerCase()}-${largeur}.png`;
          await page.screenshot({ path: path.join(sortie, nom), fullPage: true }); captures++;
          if (panneau === 'Réglages') {
            await page.getByRole('button', { name: 'Afficher le mot de passe administrateur', exact: true }).click();
            const motDePasse = page.getByLabel('Mot de passe administrateur', { exact: true });
            if (await motDePasse.getAttribute('type') !== 'text' || await motDePasse.inputValue() !== 'PROMETHEUS') throw new Error('Mot de passe administrateur illisible.');
            if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Débordement du mot de passe.');
            await page.screenshot({ path: path.join(sortie, `mj-mot-de-passe-visible-${largeur}.png`), fullPage: true }); captures++;
            await page.getByRole('button', { name: 'Masquer le mot de passe administrateur', exact: true }).click();
            if (await motDePasse.getAttribute('type') !== 'password') throw new Error('Mot de passe non remasqué.');
          }
          if (panneau === 'Protocoles') {
            await page.getByRole('button', { name: 'Afficher le code du protocole', exact: true }).click();
            const code = page.getByLabel('Code du protocole', { exact: true });
            if (await code.getAttribute('type') !== 'text' || await code.inputValue() !== 'PORTES-OUVRIR') throw new Error('Code du protocole illisible.');
            if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Débordement du bouton Afficher.');
            await page.screenshot({ path: path.join(sortie, `mj-code-visible-${largeur}.png`), fullPage: true }); captures++;
            await page.getByRole('button', { name: 'Masquer le code du protocole', exact: true }).click();
            if (await code.getAttribute('type') !== 'password') throw new Error('Code du protocole non remasqué.');
          }
          if (panneau === 'Dossiers') {
            await page.getByLabel('Dossier', { exact: true }).selectOption('ordre');
            await page.getByRole('button', { name: 'Afficher le code du dossier', exact: true }).click();
            if (await page.getByLabel('Code du dossier', { exact: true }).inputValue() !== '0042') throw new Error('Les zéros du code doivent rester lisibles.');
            await page.getByRole('button', { name: 'Masquer le code du dossier', exact: true }).click();
            await page.getByLabel('Dossier', { exact: true }).selectOption('');
            await page.getByRole('form', { name: 'Créer un dossier' }).waitFor();
            if (await page.getByLabel('Titre', { exact: true }).inputValue()) throw new Error('Le nouveau dossier doit être vide.');
            if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Débordement du nouveau dossier.');
            await page.screenshot({ path: path.join(sortie, `mj-nouveau-dossier-${largeur}.png`), fullPage: true }); captures++;
            await page.getByLabel('Identifiant du dossier', { exact: true }).fill('rapport-medical');
            await page.getByLabel('Titre', { exact: true }).fill('Rapport médical');
            await page.getByLabel('Protection', { exact: true }).selectOption('code');
            await page.getByLabel('Code du dossier', { exact: true }).fill('0087');
            await page.getByLabel('Contenu', { exact: true }).fill('Quarantaine maintenue.');
            await page.getByRole('button', { name: 'Créer le dossier', exact: true }).click();
            await page.getByText('Commande de lecture : READ rapport-medical', { exact: true }).waitFor();
            if (await page.getByLabel('Dossier', { exact: true }).inputValue() !== 'rapport-medical') throw new Error('Le dossier créé doit être sélectionné.');
          }
        }
        if (role === 'joueur') {
          await page.evaluate(() => window.autodestructionMuthur());
          await page.getByRole('region', { name: 'Alerte autodestruction' }).waitFor();
          await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
          const video = await page.locator('video').evaluate(element => ({ duree: element.duration, largeur: element.videoWidth, muet: element.muted, position: element.currentTime }));
          if (video.largeur !== 640 || !video.muet || Math.abs(video.duree - 775.701) > 0.1) throw new Error('Vidéo du module incorrecte.');
          if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Débordement de l’alerte.');
          await page.screenshot({ path: path.join(sortie, `autodestruction-${largeur}.png`), fullPage: true }); captures++;
        }
      }
    }
    // Les captures ordinaires réduisent les animations ; celles-ci montrent les effets demandés.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const largeur of [390, 1180]) {
      await page.setViewportSize({ width: largeur, height: 900 });
      for (const [crt, parasites] of [[true, true], [true, false], [false, true], [false, false]]) {
        await page.goto(pathToFileURL(path.join(sortie, 'apercu.html')).href);
        await page.getByRole('button', { name: 'Poste meneur', exact: true }).click();
        await page.getByRole('button', { name: 'Réglages', exact: true }).click();
        await page.getByLabel('Effet CRT', { exact: true }).setChecked(crt);
        await page.getByLabel('Parasites visuels', { exact: true }).setChecked(parasites);
        await page.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
        await page.waitForFunction(({ crt, parasites }) => {
          const module = document.querySelector('.gmos-muthur');
          return module.classList.contains('muthur-crt') === crt && module.classList.contains('muthur-parasites') === parasites;
        }, { crt, parasites });
        await page.getByRole('button', { name: 'Vue joueur', exact: true }).click();
        await page.getByRole('heading', { name: 'MU/TH/UR 6000', exact: true }).waitFor();
        const effets = await page.locator('.muthur-journal').evaluate(element => ({
          crt: getComputedStyle(element, '::before').animationName,
          parasites: getComputedStyle(element, '::after').animationName,
        }));
        if ((effets.crt !== 'none') !== crt || (effets.parasites !== 'none') !== parasites) throw new Error('Interrupteurs CRT/parasites non indépendants.');
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Débordement avec effets CRT/parasites.');
        await page.screenshot({ path: path.join(sortie, `effets-crt-${Number(crt)}-parasites-${Number(parasites)}-${largeur}.png`), fullPage: true }); captures++;
        if (crt && parasites) {
          await page.emulateMedia({ reducedMotion: 'reduce' });
          const animations = await page.locator('.muthur-journal').evaluate(element => [
            getComputedStyle(element, '::before').animationName, getComputedStyle(element, '::after').animationName,
            ...Array.from(element.querySelectorAll('.muthur-message, .muthur-demarrage'), message => getComputedStyle(message).animationName),
          ]);
          if (animations.some(nom => nom !== 'none')) throw new Error('Mouvements réduits non respectés.');
          await page.emulateMedia({ reducedMotion: 'no-preference' });
        }
      }
    }
    for (const largeur of [360, 390, 1180]) {
      const contexteAutonome = await navigateur.newContext({ offline: true, reducedMotion: 'no-preference', viewport: { width: largeur, height: 900 } });
      try {
        await contexteAutonome.route(/^https?:/, route => route.abort());
        const autonome = await contexteAutonome.newPage();
        autonome.on('pageerror', erreur => erreurs.push(erreur.message));
        await autonome.goto(pathToFileURL(path.resolve(ici, '../../index.html')).href);
        await autonome.getByRole('button', { name: 'Protocoles', exact: true }).click();
        await autonome.locator('#protocoleSelect').selectOption('autodestruction');
        await autonome.getByRole('button', { name: 'Afficher le code du protocole', exact: true }).click();
        if (await autonome.locator('#protocoleCode').getAttribute('type') !== 'text' || await autonome.locator('#protocoleCode').inputValue() !== 'OMEGA-10') throw new Error('Code du prototype illisible.');
        if (await autonome.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Débordement du code dans le prototype.');
        await autonome.screenshot({ path: path.join(sortie, `autonome-code-visible-${largeur}.png`), fullPage: true }); captures++;
        await autonome.getByRole('button', { name: 'Masquer le code du protocole', exact: true }).click();
        if (await autonome.locator('#protocoleMinutes').inputValue() !== '10') throw new Error('Durée initiale incorrecte.');
        await autonome.locator('#protocoleMessage').fill('ÉVACUATION. Rejoignez les navettes de secours.');
        await autonome.getByRole('button', { name: 'Enregistrer le protocole', exact: true }).click();
        await autonome.getByLabel('Commande du terminal', { exact: true }).fill('CODE OMEGA-10');
        await autonome.getByRole('button', { name: 'Envoyer la commande' }).click();
        await autonome.getByRole('region', { name: 'Alerte autodestruction' }).waitFor();
        await autonome.waitForFunction(() => document.querySelector('#videoAlerte').readyState >= 2);
        if (!await autonome.locator('#autoDestructionMessage').textContent().then(texte => texte.includes('navettes'))) throw new Error('Message type non conservé.');
        if (await autonome.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Débordement autonome à ${largeur} px.`);
        await autonome.screenshot({ path: path.join(sortie, `autonome-autodestruction-${largeur}.png`), fullPage: true }); captures++;
        await autonome.getByLabel('Commande du terminal', { exact: true }).fill('CODE OMEGA-STOP');
        await autonome.getByRole('button', { name: 'Envoyer la commande' }).click();
        await autonome.getByRole('region', { name: 'Alerte autodestruction' }).waitFor({ state: 'hidden' });
        await autonome.getByRole('button', { name: 'Accès', exact: true }).click();
        await autonome.getByRole('button', { name: 'Afficher le mot de passe administrateur', exact: true }).click();
        if (await autonome.locator('#adminPassword').getAttribute('type') !== 'text' || await autonome.locator('#adminPassword').inputValue() !== 'PROMETHEUS') throw new Error('Mot de passe du prototype illisible.');
        if (await autonome.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Débordement du mot de passe du prototype.');
        await autonome.screenshot({ path: path.join(sortie, `autonome-mot-de-passe-visible-${largeur}.png`), fullPage: true }); captures++;
        await autonome.getByRole('button', { name: 'Masquer le mot de passe administrateur', exact: true }).click();
        await autonome.locator('#documentSelect').selectOption('');
        await autonome.getByRole('button', { name: 'Créer le dossier', exact: true }).waitFor();
        if (await autonome.locator('#documentBody').inputValue()) throw new Error('Le nouveau dossier autonome doit être vide.');
        if (await autonome.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Débordement du formulaire de dossier autonome.');
        await autonome.screenshot({ path: path.join(sortie, `autonome-nouveau-dossier-${largeur}.png`), fullPage: true }); captures++;
        await autonome.locator('#documentId').fill('rapport-medical');
        await autonome.locator('#documentTitle').fill('Rapport médical');
        await autonome.locator('#documentAccess').selectOption('code');
        await autonome.locator('#documentCode').fill('0087');
        await autonome.locator('#documentBody').fill('Quarantaine maintenue.');
        await autonome.getByRole('button', { name: 'Créer le dossier', exact: true }).click();
        await autonome.getByText('Commande de lecture : READ rapport-medical', { exact: true }).waitFor();
        if (await autonome.locator('#documentSelect').inputValue() !== 'rapport-medical') throw new Error('Dossier autonome non sélectionné après création.');
        await autonome.getByRole('button', { name: 'Afficher le code du dossier', exact: true }).click();
        if (await autonome.locator('#documentCode').getAttribute('type') !== 'text' || await autonome.locator('#documentCode').inputValue() !== '0087') throw new Error('Code du dossier autonome illisible.');
        await autonome.locator('#documentSelect').selectOption('ordre');
        if (await autonome.locator('#documentCode').getAttribute('type') !== 'password') throw new Error('Un changement de dossier doit remasquer son code.');
      } finally { await contexteAutonome.close(); }
    }
    captures += await verifierSauvegarde({ navigateur, url: pathToFileURL(path.join(sortie, 'apercu.html')).href, sortie });
    captures += await verifierEffetsPiratage({ navigateur, url: pathToFileURL(path.join(sortie, 'apercu.html')).href,
      autonomeUrl: pathToFileURL(path.resolve(ici, '../../index.html')).href, sortie });
    captures += await verifierDetecteur({ navigateur, url: pathToFileURL(path.resolve(ici, '../../index.html')).href, sortie });
    if (erreurs.length) throw new Error(erreurs.join('\n'));
    console.log(`${captures} captures, aucun débordement horizontal ni erreur de navigateur.`);
  } finally { await navigateur.close(); }
}
