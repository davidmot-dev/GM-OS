/** Recette des vues réelles, navigateur muet, profils fictifs et réseau bloqué. */
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { POSTES } from './postes.mjs';
import { cleSauvegarde } from './configuration.mjs';
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
function onde() {
  const b = Buffer.alloc(44 + 1600); b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24); b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(1600, 40);
  for (let n = 0; n < 800; n++) b.writeInt16LE(Math.round(Math.sin(n * Math.PI / 8) * 1000), 44 + n * 2);
  return b;
}
export async function verifierInterface({ url, sortie, parties = ['postes', 'medias', 'stockage'] }) {
  let navigateur;
  try { navigateur = await chromium.launch({ headless: true, args: ['--mute-audio'] }); }
  catch { navigateur = await chromium.launch({ channel: 'msedge', headless: true, args: ['--mute-audio'] }); }
  let captures = 0;
  const erreurs = [];
  async function ouvrir() {
    const contexte = await navigateur.newContext({ offline: true, reducedMotion: 'no-preference', viewport: { width: 1024, height: 1000 }, acceptDownloads: true });
    await contexte.route(/^https?:/, route => route.abort());
    const page = await contexte.newPage(); page.on('pageerror', e => erreurs.push(e.message));
    await page.addInitScript(() => {
      window.sondeLcars = { actifs: 0, demarres: 0, voix: [], annulations: 0 };
      const Classe = window.AudioContext || window.webkitAudioContext;
      if (Classe) window.AudioContext = class extends Classe {
        createOscillator() {
          const o = super.createOscillator(), debut = o.start.bind(o), fin = o.stop.bind(o); let actif = false;
          const retirer = () => { if (actif) { actif = false; window.sondeLcars.actifs--; } };
          o.start = (...a) => { debut(...a); actif = true; window.sondeLcars.actifs++; window.sondeLcars.demarres++; };
          o.stop = (...a) => { fin(...a); if (!a.length) retirer(); }; o.addEventListener('ended', retirer); return o;
        }
      };
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speak: p => window.sondeLcars.voix.push(p.text), cancel: () => { window.sondeLcars.annulations++; } } });
      window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    });
    await page.clock.install(); await page.goto(url);
    await expect(page.getByRole('heading', { name: 'USS ASTERIA', exact: true })).toBeVisible();
    return { page, contexte };
  }
  async function photo(page, nom, largeur = 1024) {
    await page.setViewportSize({ width: largeur, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Débordement : ${nom}`);
    await page.screenshot({ path: path.join(sortie, `${nom}.png`), fullPage: true, animations: 'disabled' }); captures++;
  }
  const vue = (p, id) => p.getByLabel('Vue de test', { exact: true }).selectOption(id === 'mj' ? id : `pj:${id}`);
  const poste = (p, id) => p.getByRole('navigation', { name: 'Consoles attribuées' }).getByRole('button', { name: POSTES[id].nom, exact: true }).click();
  const panneau = (p, nom) => p.getByRole('navigation', { name: 'Panneaux du pupitre' }).getByRole('button', { name: nom, exact: typeof nom === 'string' }).click();
  const contenu = p => p.locator('.lcars-prototype').textContent();
  async function demandeMJ(p, s, action) {
    await vue(p, 'mj'); await panneau(p, /^Demandes/); await p.getByLabel('Filtrer par poste', { exact: true }).selectOption(s);
    if (action) { const option = p.getByLabel('Demande à traiter', { exact: true }).locator('option').filter({ hasText: POSTES[s].actions[action] }).first(); await p.getByLabel('Demande à traiter', { exact: true }).selectOption(await option.getAttribute('value')); }
  }
  try {
    // Tous les postes et toutes les actions sont exercés par l'officier de test.
    if (parties.includes('postes')) {
      const { page: p, contexte } = await ouvrir();
      try {
        await vue(p, 'pj-essai');
        for (const [s, config] of Object.entries(POSTES)) {
          await poste(p, s);
          const instrument = p.locator(`.lcars-console[data-poste="${s}"]`);
          await expect(instrument).toBeVisible(); await expect(p.locator('.lcars-console')).toHaveCount(1);
          const elements = instrument.locator('.lcars-element'), premier = await p.getByLabel('Cible de l’intervention', { exact: true }).inputValue();
          if (await elements.count() > 1) {
            await elements.last().click(); await expect(elements.last()).toHaveAttribute('aria-pressed', 'true');
            assert.notEqual(await p.getByLabel('Cible de l’intervention', { exact: true }).inputValue(), premier);
            // La liste de sélection et l'instrument doivent réagir au même choix que le formulaire.
            const nom = await elements.last().locator('strong').textContent();
            await expect(instrument.getByRole('heading', { name: nom, exact: true })).toBeVisible();
            await p.getByLabel('Cible de l’intervention', { exact: true }).selectOption(premier);
            await expect(elements.first()).toHaveAttribute('aria-pressed', 'true');
          }
          await instrument.screenshot({ path: path.join(sortie, `instrument-${s}-1024.png`), animations: 'disabled' }); captures++;
          for (const action of Object.keys(config.actions)) {
            await p.getByLabel('Action proposée', { exact: true }).selectOption(action);
            await p.getByLabel(s === 'communications' ? 'Message ou demande' : 'Détails de l’intervention', { exact: true }).fill(`QUESTION PRIVÉE ${s} ${action}`);
            await p.getByRole('button', { name: 'Transmettre l’intervention', exact: true }).click();
            await expect(p.getByRole('button', { name: 'Intervention en attente', exact: true })).toBeDisabled();
          }
          await photo(p, `poste-${s}-1024`); await photo(p, `poste-${s}-390`, 390);
          await instrument.screenshot({ path: path.join(sortie, `instrument-${s}-390.png`), animations: 'disabled' }); captures++;
          await p.setViewportSize({ width: 360, height: 1000 });
          assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Débordement 360 : ${s}`);
          await photo(p, `poste-${s}-1280`, 1280);
          const impulsion = instrument.locator('.lcars-impulsion').first();
          if (await impulsion.count()) {
            await p.emulateMedia({ reducedMotion: 'reduce' });
            assert.equal(await impulsion.evaluate(e => getComputedStyle(e).animationName), 'none');
            await p.emulateMedia({ reducedMotion: 'no-preference' });
          }
          await p.setViewportSize({ width: 1024, height: 1000 });
        }
        await p.clock.fastForward(2700); await expect(p.locator('.lcars-balayage')).toHaveCount(0);
        assert.ok(!(await contenu(p)).includes('DOSSIER MÉDICAL PRIVÉ'));
        await demandeMJ(p, 'science', 'scan'); await p.getByRole('button', { name: 'Jet demandé par le MJ', exact: true }).click();
        await p.getByRole('button', { name: 'Utiliser le rapport préparé', exact: true }).click();
        await p.getByLabel('Autoriser le partage à l’équipage', { exact: true }).check();
        await p.getByLabel('Pièce jointe', { exact: true }).setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: pixel });
        await expect(p.getByText('pixel.png', { exact: true })).toBeVisible();
        await p.getByRole('button', { name: 'Transmettre le rapport privé', exact: true }).click();
        await vue(p, 'pj-mara'); assert.ok(!(await contenu(p)).includes('capsule'));
        await vue(p, 'pj-essai'); await poste(p, 'science');
        await expect(p.getByRole('log', { name: 'Mes interventions' })).toContainText('capsule');
        await expect.poll(() => p.locator('img').first().evaluate(e => e.naturalWidth)).toBe(1);
        await p.getByRole('button', { name: 'Partager à l’équipage', exact: true }).click();
        await vue(p, 'pj-mara'); await expect(p.getByRole('log', { name: 'Rapports reçus' })).toContainText('capsule'); assert.ok(!(await contenu(p)).includes('QUESTION PRIVÉE science'));
        const ordre = p.getByRole('region', { name: 'Donner un ordre' });
        await ordre.getByLabel('Texte de l’ordre', { exact: true }).fill('ORDRE TEST : vérifier le confinement.');
        await ordre.getByLabel('Tout l’équipage', { exact: true }).uncheck(); await ordre.getByLabel('Ingénierie', { exact: true }).check();
        await ordre.getByRole('button', { name: 'Transmettre l’ordre', exact: true }).click();
        await vue(p, 'pj-ilya'); await p.getByRole('button', { name: 'Accuser réception', exact: true }).click();
        await vue(p, 'pj-mara'); await expect(p.getByRole('region', { name: 'Ordres de passerelle' })).toContainText('Ilya Voss'); await photo(p, 'commandement-ordre-lu-1024');
        await demandeMJ(p, 'medecine', 'diagnostic'); await p.getByRole('button', { name: 'Utiliser le rapport préparé', exact: true }).click();
        await p.getByLabel('État résultant de la cible', { exact: true }).selectOption('stable');
        await p.getByRole('button', { name: 'Transmettre le rapport privé', exact: true }).click();
        await vue(p, 'pj-mara'); assert.ok(!(await contenu(p)).includes('DOSSIER MÉDICAL PRIVÉ'));
        await vue(p, 'pj-essai'); await poste(p, 'medecine'); await expect(p.getByRole('log', { name: 'Mes interventions' })).toContainText('DOSSIER MÉDICAL PRIVÉ');
        await photo(p, 'medecine-rapport-prive-390', 390);
        await demandeMJ(p, 'ingenierie', 'reparation'); await p.getByRole('button', { name: 'Utiliser le rapport préparé', exact: true }).click();
        await p.getByLabel('État résultant de la cible', { exact: true }).selectOption('nominal'); await p.getByRole('button', { name: 'Transmettre le rapport privé', exact: true }).click();
        await vue(p, 'pj-ilya'); await poste(p, 'ingenierie'); await expect(p.getByRole('button', { name: 'Confinement du réacteur · Nominal', exact: true })).toBeVisible();
        await vue(p, 'mj'); await panneau(p, 'Préparation');
        await p.getByLabel('Identifiant de l’élément', { exact: true }).fill('patient-test'); await p.getByLabel('Poste de l’élément', { exact: true }).selectOption('medecine');
        await p.getByLabel('Libellé visible', { exact: true }).fill('Patient de démonstration'); await p.getByLabel('Rapport préparé — privé MJ', { exact: true }).fill('SECRET DE TEST');
        await p.getByRole('button', { name: 'Créer l’élément', exact: true }).click(); await expect(p.getByRole('button', { name: 'Enregistrer l’élément', exact: true })).toBeVisible();
        await p.getByLabel('Révéler aux titulaires du poste', { exact: true }).check(); await p.getByRole('button', { name: 'Enregistrer l’élément', exact: true }).click();
        await p.getByLabel('Confirmer la suppression de cet élément', { exact: true }).check(); await p.getByRole('button', { name: 'Supprimer cet élément', exact: true }).click();
        await expect(p.getByRole('button', { name: 'Créer l’élément', exact: true })).toBeVisible();
        await panneau(p, 'Passerelle'); await p.getByLabel('Science pour T’Len', { exact: true }).uncheck();
        await vue(p, 'pj-tlen'); await expect(p.getByRole('navigation', { name: 'Consoles attribuées' }).getByRole('button', { name: 'Science', exact: true })).toHaveCount(0);
        await vue(p, 'mj'); await panneau(p, 'Préréglages'); await p.getByLabel('Nom du préréglage', { exact: true }).fill('Situation enregistrée');
        await p.getByRole('button', { name: 'Enregistrer un nouveau préréglage', exact: true }).click();
        await p.getByLabel('Préréglage de situation', { exact: true }).selectOption({ label: 'Situation enregistrée' });
        await p.getByRole('button', { name: 'Appliquer ce préréglage', exact: true }).click();
        await photo(p, 'mj-prereglages-390', 390); await p.getByRole('button', { name: 'Supprimer ce préréglage', exact: true }).click();
        await vue(p, 'pj-essai'); await poste(p, 'science');
        await p.getByLabel('Cible de l’intervention', { exact: true }).selectOption('c-03');
        await p.getByLabel('Action proposée', { exact: true }).selectOption('scan'); await p.emulateMedia({ reducedMotion: 'reduce' });
        await p.getByRole('button', { name: 'Transmettre l’intervention', exact: true }).click(); await expect(p.locator('.lcars-balayage')).toBeVisible();
        assert.equal(await p.locator('.lcars-rayon').evaluate(e => getComputedStyle(e).animationName), 'none'); await photo(p, 'mouvements-reduits-360', 360);
        await vue(p, 'mj'); await p.getByRole('button', { name: 'Arrêter les effets', exact: true }).click(); await vue(p, 'pj-essai'); await expect(p.locator('.lcars-balayage')).toHaveCount(0);
        console.log('LCARS : sept instruments distincts, sélections liées au formulaire, 19 actions, arbitrages, rapports privés, partage, ordres/accusés, CRUD, affectations, préréglages et mouvements réduits validés.');
      } finally { await contexte.close(); }
    }
    // Médias réels et graphe Web Audio, sortie muette ; voix système simulée.
    if (parties.includes('medias')) {
      const { page: p, contexte } = await ouvrir();
      try {
        await vue(p, 'mj'); await panneau(p, 'Diffusion');
        await p.getByLabel('Titre du rapport', { exact: true }).fill('Message sonore'); await p.getByLabel('Contenu du rapport', { exact: true }).fill('Essai de transmission audio.');
        await p.getByLabel('Tout l’équipage', { exact: true }).check(); await p.getByLabel('Pièce jointe', { exact: true }).setInputFiles({ name: 'signal.wav', mimeType: 'audio/wav', buffer: onde() });
        await expect(p.getByText('signal.wav', { exact: true })).toBeVisible(); await p.getByRole('button', { name: 'Publier aux destinataires choisis', exact: true }).click();
        await expect.poll(() => p.locator('audio').evaluate(e => e.readyState)).toBeGreaterThan(0);
        // Encoder sur une page sans horloge simulée : le codec travaille en temps réel.
        const encodeur = await contexte.newPage();
        const video = await encodeur.evaluate(async () => {
          const c = document.createElement('canvas'); c.width = 64; c.height = 48; document.body.append(c);
          const g = c.getContext('2d'), flux = c.captureStream(0), r = new MediaRecorder(flux, { mimeType: 'video/webm' }), morceaux = [];
          return await new Promise(resolve => {
            r.ondataavailable = e => morceaux.push(e.data); r.onstop = async () => { flux.getTracks().forEach(t => t.stop()); c.remove(); resolve([...new Uint8Array(await new Blob(morceaux).arrayBuffer())]); };
            r.start(); let n = 0; const dessiner = () => { g.fillStyle = n++ % 2 ? '#c4a6ef' : '#ffb36b'; g.fillRect(0, 0, 64, 48); flux.getVideoTracks()[0].requestFrame(); };
            dessiner(); const intervalle = setInterval(dessiner, 100); setTimeout(() => { clearInterval(intervalle); r.stop(); }, 1200);
          });
        });
        await encodeur.close();
        await fs.writeFile(path.join(sortie, 'clip-de-recette.webm'), Buffer.from(video));
        console.log(`Clip de recette : ${video.length} octets.`);
        await p.getByLabel('Titre du rapport', { exact: true }).fill('Transmission vidéo'); await p.getByLabel('Contenu du rapport', { exact: true }).fill('Rapport visuel de navigation.');
        await p.getByLabel('Tout l’équipage', { exact: true }).uncheck(); await p.getByLabel('Navigation', { exact: true }).check();
        await p.getByLabel('Pièce jointe', { exact: true }).setInputFiles({ name: 'transmission.webm', mimeType: 'video/webm', buffer: Buffer.from(video) });
        await expect(p.getByText('transmission.webm', { exact: true })).toBeVisible(); await p.getByRole('button', { name: 'Publier aux destinataires choisis', exact: true }).click();
        await vue(p, 'pj-mara'); await expect(p.locator('video')).toHaveCount(0);
        await vue(p, 'pj-ilya'); await p.locator('video').scrollIntoViewIfNeeded();
        await p.locator('video').evaluate(e => e.load());
        await expect.poll(() => p.locator('video').evaluate(e => e.videoWidth)).toBe(64); await photo(p, 'transmission-video-1024');
        await vue(p, 'mj'); await p.getByRole('button', { name: 'Activer le son', exact: true }).click();
        await p.getByRole('button', { name: 'Diffuser l’alarme ici', exact: true }).click(); await p.getByLabel('Annonces vocales', { exact: true }).check();
        await p.getByLabel('Niveau d’alerte', { exact: true }).selectOption('rouge'); await p.getByLabel('Consigne d’alerte', { exact: true }).fill('Évacuation du laboratoire.');
        await p.getByLabel('Compte à rebours en secondes (facultatif)', { exact: true }).fill('125'); await p.getByRole('button', { name: 'Publier l’alerte', exact: true }).click();
        await expect.poll(() => p.evaluate(() => window.sondeLcars.demarres)).toBeGreaterThan(0); await expect(p.getByRole('timer')).toContainText('02:');
        await photo(p, 'alerte-rouge-son-1024'); await p.clock.fastForward(65000);
        assert.ok((await p.evaluate(() => window.sondeLcars.voix)).some(v => v.includes('minute')));
        await p.getByRole('button', { name: 'Arrêter les effets', exact: true }).click();
        await expect.poll(() => p.evaluate(() => window.sondeLcars.actifs)).toBe(0); await expect(p.getByRole('timer')).toHaveCount(0);
        await vue(p, 'pj-tlen'); await p.getByRole('button', { name: 'Activer le son', exact: true }).click(); await p.getByRole('button', { name: 'Diffuser l’alarme ici', exact: true }).click();
        await vue(p, 'mj'); await expect(p.getByRole('button', { name: 'Diffuser l’alarme ici', exact: true })).toBeVisible();
        assert.equal(await p.evaluate(() => window.sondeLcars.actifs), 0);
        console.log('LCARS : image, WAV et vidéo WebM réels ; ciblage médias, diffuseur, sirène/arrêt et annonces simulées validés (sorties muettes).');
      } finally { await contexte.close(); }
    }
    // Persistance propre au profil jetable, import confirmé et erreurs de stockage.
    if (parties.includes('stockage')) {
      const { page: p, contexte } = await ouvrir();
      try {
        await vue(p, 'mj'); await p.getByLabel('Nom du vaisseau', { exact: true }).fill('USS TEST PERSISTANT'); await p.getByRole('button', { name: 'Publier la situation', exact: true }).click();
        const evenement = p.waitForEvent('download'); await p.getByRole('button', { name: 'Exporter l’atelier', exact: true }).click(); const telechargement = await evenement;
        const fichier = await fs.readFile(await telechargement.path()); assert.equal(JSON.parse(fichier).donnees.vaisseau.nom, 'USS TEST PERSISTANT');
        await p.reload(); await expect(p.getByRole('heading', { name: 'USS TEST PERSISTANT', exact: true })).toBeVisible(); await vue(p, 'mj');
        await p.getByLabel('Importer un atelier', { exact: true }).setInputFiles({ name: 'invalide.json', mimeType: 'application/json', buffer: Buffer.from('{invalide') });
        await expect(p.getByRole('alert')).toBeVisible(); await expect(p.getByRole('button', { name: 'Remplacer l’atelier', exact: true })).toHaveCount(0);
        await p.getByRole('button', { name: 'Recommencer la fiction', exact: true }).click(); await p.getByRole('button', { name: 'Garder les essais', exact: true }).click();
        await expect(p.getByRole('heading', { name: 'USS TEST PERSISTANT', exact: true })).toBeVisible();
        await p.getByLabel('Importer un atelier', { exact: true }).setInputFiles({ name: 'valide.json', mimeType: 'application/json', buffer: fichier });
        await p.getByRole('button', { name: 'Annuler l’import', exact: true }).click();
        await p.evaluate(cle => localStorage.setItem(cle, '{illisible'), cleSauvegarde); await p.reload(); await vue(p, 'mj');
        await expect(p.getByRole('status').filter({ hasText: 'Copie locale illisible' })).toBeVisible();
        await p.getByLabel('Nom du vaisseau', { exact: true }).fill('MÉMOIRE SEULE'); await p.getByRole('button', { name: 'Publier la situation', exact: true }).click();
        assert.equal(await p.evaluate(cle => localStorage.getItem(cle), cleSauvegarde), '{illisible');
        await p.getByLabel('Importer un atelier', { exact: true }).setInputFiles({ name: 'valide.json', mimeType: 'application/json', buffer: fichier });
        await p.getByRole('button', { name: 'Remplacer l’atelier', exact: true }).click(); await expect(p.getByRole('heading', { name: 'USS TEST PERSISTANT', exact: true })).toBeVisible();
        await p.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Test quota', 'QuotaExceededError'); }; });
        await p.getByRole('button', { name: 'Publier la situation', exact: true }).click(); await expect(p.getByRole('status').filter({ hasText: 'Sauvegarde locale impossible' })).toBeVisible();
        await photo(p, 'sauvegarde-import-390', 390);
        console.log('LCARS : reprise, export privé, import refusé/annulé/confirmé, copie illisible préservée et quota plein signalé validés.');
      } finally { await contexte.close(); }
    }
    assert.equal(erreurs.length, 0, erreurs.join('\n'));
    console.log(`LCARS complet : ${captures} captures hors ligne sans débordement, aucune erreur JavaScript. Aucun GM-OS ni service réseau lancé.`);
  } finally { await navigateur.close(); }
}
