import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const dossier = new URL('.', import.meta.url);
const comportement = await readFile(new URL('j2-comportements.js', dossier), 'utf8');
await mkdir(new URL('assets/', dossier), { recursive: true });
await writeFile(new URL('assets/plan-station-varn.png', dossier), await readFile(new URL('../../../../e2e/donnees/plan-station-varn.png', dossier)));
const donnees = {
  archives: { titre: 'Le café encore chaud', description: "Le départ date de moins d'une heure.", modal: 'clue-modal', vide: 'Aucune archive disponible', compteur: 2 },
  pnj: { titre: 'Superviseur Hale', description: "Répond trop vite aux questions qu'on ne lui a pas posées.", modal: 'profile-modal', vide: 'Aucun sujet identifié / En attente de transmission par le MJ', compteur: 1 },
  lieux: { titre: 'Station Varn', description: 'Le pont C, entre le sas et le relais.', modal: 'modal-lieu-viewer', vide: "Territoires inconnus / Aucun lieu n'a encore été marqué comme visité par le Maître de Jeu.", compteur: 1 }
};
const destinations = ['Direct', 'Archives', 'PNJ', 'Lieux', 'Inventaire', 'Cartes', 'Fiche', 'Notes', 'Messages', 'Quitter'];
const silhouette = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3a4 4 0 100 8 4 4 0 000-8z"/><path d="M5 21v-2a6 6 0 0112 0v2"/></svg>';
const icones = { archives: '▤', pnj: silhouette, lieux: '⌖' };
function messagerie(d, paysage) {
  const volet = d.createElement('aside');
  volet.id = 'messagerie-j2'; volet.className = `j2-messagerie hidden ${paysage ? 'j2-paysage' : ''}`;
  volet.setAttribute('aria-label', 'Messagerie');
  volet.innerHTML = `<div class="j2-chat-titre"><div><h2>Messagerie</h2><p id="canal-j2">Canal Direct MJ</p></div><button aria-label="Fermer la messagerie" onclick="fermerMessagerie()">Fermer</button></div>
    <div class="j2-destinataire"><button id="choisir-destinataire" aria-label="Choisir le destinataire" aria-expanded="false" onclick="ouvrirDestinataires()">À : <span id="nom-destinataire">Maître du Jeu</span> <span aria-hidden="true">⌄</span></button>
    <div id="destinataires-j2" class="hidden">${Object.entries({GM:'Maître du Jeu',all:'Tous les Joueurs',idris:'Idris Koa',sora:'Sora Adebayo'}).map(([id,nom]) => `<button onclick="choisirDestinataire('${id}')">${nom}</button>`).join('')}</div></div>
    <div id="conversation-j2" aria-live="polite"></div>
    <div class="j2-saisie"><textarea id="message-saisi" aria-label="Entrer un message" title="Entrer un message" placeholder="Message à Maître du Jeu..." rows="2"></textarea><button id="envoyer-message" aria-label="Envoyer le message" onclick="envoyerMessage()" disabled>Envoyer</button><p id="confidentialite-j2">Seul Maître du Jeu pourra lire ce message.</p></div>`;
  return volet;
}
for (const fichier of process.argv.slice(2)) {
  const [nom, format] = fichier.split('-'); const paysage = format === 'paysage';
  const dom = new JSDOM(await readFile(new URL(`${fichier}-original.html`, dossier), 'utf8'));
  const d = dom.window.document;
  // La géométrie du cadre est réparée ; en-tête, télémétrie et cartes gardent le dessin exporté.
  const header = d.querySelector('header');
  if (!header) throw new Error(`En-tête absent : ${fichier}`);
  let telemetrie = header.nextElementSibling;
  if (!telemetrie || !telemetrie.textContent.includes('3/8')) {
    // Certains exports réunissent les deux bandes dans un même header.
    telemetrie = null;
  }
  let principal = d.querySelector('main');
  if (principal?.contains(header)) {
    const titre = principal.querySelector('h1');
    let contenu = titre;
    while (contenu.parentElement !== principal) contenu = contenu.parentElement;
    principal = contenu;
  }
  if (!principal) throw new Error(`Contenu absent : ${fichier}`);
  const main = d.createElement('main'); main.id = 'contenu-j2';
  main.className = principal.className;
  main.innerHTML = principal.innerHTML;
  for (const node of main.querySelectorAll('script,nav,footer,[role="dialog"]')) node.remove();
  const shell = d.createElement('div'); shell.id = 'cadre-j2'; shell.className = paysage ? 'paysage' : 'telephone';
  shell.append(header);
  if (telemetrie) shell.append(telemetrie);
  shell.append(main);
  const footer = d.createElement('footer'); footer.id = 'navigation-j2';
  for (const ligne of paysage ? [destinations.slice(0,6),destinations.slice(6)] : [destinations.slice(0,3),destinations.slice(3,6),destinations.slice(6)]) {
    const rangee = d.createElement('div'); rangee.className = 'j2-rangee'; rangee.style.gridTemplateColumns = `repeat(${ligne.length}, minmax(0,1fr))`;
    for (const destination of ligne) {
      const btn = d.createElement('button'); btn.textContent = destination; btn.type = 'button';
      if (destination.toLowerCase() === (['messages','notifications'].includes(nom) ? 'direct' : nom)) { btn.className = 'j2-actif'; btn.setAttribute('aria-current','page'); }
      if (destination === 'Quitter') { btn.setAttribute('onclick','quitterSession()'); btn.className = 'j2-quitter'; }
      if (destination === 'Messages') { btn.id = 'destination-messages'; if (['messages','notifications'].includes(nom)) btn.setAttribute('onclick','ouvrirMessagerie()'); }
      rangee.append(btn);
    }
    footer.append(rangee);
  }
  shell.append(footer);
  const config = donnees[nom];
  if (config) {
    if (paysage && nom === 'pnj') {
      const carte = main.querySelector('.col-span-4 > div');
      if (!carte?.textContent.includes('Superviseur Hale')) throw new Error('Profil paysage absent');
      carte.setAttribute('role','button');
      const titre = main.firstElementChild;
      titre.lastElementChild.remove(); // Faux COMM-LINK / INDEX.
      main.replaceChildren(titre,carte);
    }
    if (paysage && nom === 'lieux') {
      const carte = main.querySelector('section.col-span-8');
      if (!carte) throw new Error('Lieu paysage absent');
      carte.setAttribute('role','button');
      carte.innerHTML = '<h2 class="font-orbitron font-bold text-xl">Station Varn</h2><span class="text-primary text-sm">battlemap</span><p>Le pont C, entre le sas et le relais.</p><img class="j2-plan" src="assets/plan-station-varn.png" alt="Plan de Station Varn"/>';
      main.replaceChildren(main.firstElementChild,carte);
    }
    let cartes = [...main.querySelectorAll('[onclick],[role="button"],button')].filter(e => ['Le café encore chaud','La signature unique','Superviseur Hale','Station Varn'].some(t => e.textContent.includes(t)));
    cartes = cartes.filter(c => !cartes.some(autre => autre !== c && autre.contains(c)));
    if (cartes.length !== config.compteur) throw new Error(`${fichier}: ${cartes.length} cartes, attendu ${config.compteur}`);
    const liste = d.createElement('div'); liste.setAttribute('data-liste-j2',''); liste.className = `j2-liste ${nom === 'archives' && paysage ? 'j2-deux-colonnes' : ''}`;
    for (const [i, carte] of cartes.entries()) {
      carte.setAttribute('role','button'); carte.setAttribute('tabindex','0'); carte.setAttribute('onclick',`ouvrirDetail(${i})`);
      carte.setAttribute('onkeydown',`if(event.key==='Enter'||event.key===' '){event.preventDefault();ouvrirDetail(${i})}`);
      carte.classList.add('j2-carte');
      for (const enfant of carte.querySelectorAll('[onclick]')) enfant.removeAttribute('onclick');
      if (nom === 'archives') {
        const titre = carte.querySelector('h2,h3');
        const icone = carte.querySelector('svg,.material-symbols-outlined');
        const text = i ? 'Tout le registre est signé « Hale », même les nuits où il dormait.' : "Le départ date de moins d'une heure.";
        const description = d.createElement('p'); description.textContent=text; description.className='font-body-md text-body-md text-on-surface-variant';
        const texte = d.createElement('div'); texte.className = 'j2-texte-archive'; texte.append(titre,description);
        carte.replaceChildren(...(icone?[icone]:[]),texte);
        carte.classList.add('j2-archive');
      }
      if (nom === 'pnj' && paysage) {
        carte.innerHTML = `<div class="flex items-center gap-4"><div class="j2-neutre" aria-hidden="true">${silhouette}</div><div><h2 class="font-orbitron text-xl font-bold">Superviseur Hale</h2><p class="text-primary text-sm">neutral</p></div></div>`;
      }
      if (nom === 'lieux' && !paysage) {
        const image = d.createElement('img'); image.src = 'assets/plan-station-varn.png'; image.alt = 'Plan de Station Varn'; image.className = 'j2-plan';
        const emplacement = [...carte.querySelectorAll('div')].find(n => n.className.includes('h-[180px]') || n.textContent.includes('Plan de Station Varn'));
        if (emplacement) emplacement.replaceWith(image); else carte.append(image);
      }
      liste.append(carte);
    }
    // État vide conditionnel : jamais juxtaposé à une liste remplie.
    const parasites = [...main.querySelectorAll('p,div,span')].filter(n => n.textContent.trim().startsWith('Territoires inconnus') || n.textContent.trim().startsWith('Aucun autre sujet') || n.textContent.trim() === 'Aucune archive disponible');
    for (const n of parasites.reverse()) if (!n.contains(main.querySelector('h1'))) n.remove();
    for (const n of [...main.querySelectorAll('span,div,p')].reverse()) {
      if (/SYS\.SYNC|BUFFER LOCAL|REGISTRE CENTRAL TEST/.test(n.textContent) && !n.contains(main.querySelector('h1'))) n.remove();
    }
    main.append(liste);
    if (nom === 'archives') {
      const metadata = [...main.querySelectorAll('span')].find(n => n.textContent.includes('REGISTRE LOCAL // ID:'));
      metadata?.parentElement.remove();
      const paquets = [...main.querySelectorAll('span')].find(n => n.textContent.includes('PACKETS :'));
      paquets?.parentElement.parentElement.remove();
    }
    // Les anciens conteneurs de cartes sont vides après leur déplacement.
    for (const n of [...main.querySelectorAll('div')].reverse()) {
      if (!n.children.length && !n.textContent.trim()) n.remove();
    }
    const badge = [...main.querySelectorAll('span,div')].reverse().find(n => /^\s*[12]\s+(FRAGMENTS|PROFILS|LIEUX)/i.test(n.textContent));
    if (badge) badge.innerHTML = badge.innerHTML.replace(/([12])(\s+)/, '<span id="compteur-j2">$1</span>$2');
    else { const compteur = d.createElement('span'); compteur.id='compteur-j2'; compteur.textContent=String(config.compteur); main.prepend(compteur); }
    const vide = d.createElement('p'); vide.id = 'vide-j2'; vide.className = 'hidden j2-vide'; vide.textContent = config.vide; main.append(vide);
    const detail = d.createElement('div'); detail.id='detail-j2'; detail.className='j2-detail hidden';
    detail.setAttribute('role','dialog'); detail.setAttribute('aria-modal','true'); detail.setAttribute('aria-label',config.titre);
    detail.setAttribute('onclick', 'if(event.target===this)fermerDetail()');
    const media = nom === 'lieux' ? '<img src="assets/plan-station-varn.png" alt="Plan de Station Varn" class="j2-plan"/>' : `<div class="j2-neutre" aria-hidden="true">${icones[nom]}</div>`;
    const complement = nom === 'archives' ? 'Archives Sécurisées · Preuve immatérielle' : nom === 'pnj' ? 'Identité Non Documentée' : 'Lieu Visité · battlemap';
    const sousTitre = nom === 'pnj' ? 'neutral · Profil Civil / Neutre' : nom === 'lieux' ? 'Exploration Documentée' : '';
    detail.innerHTML = `<section class="j2-detail-panneau"><div class="j2-detail-entete"><span>${complement}</span><button onclick="fermerDetail()" aria-label="${nom==='archives'?"Fermer l'indice":'Fermer'}">Fermer</button></div><div class="j2-detail-corps ${paysage?'j2-deux-colonnes':''}">${media}<div><h2>${config.titre}</h2><p class="j2-sous-titre">${sousTitre}</p><p data-description>${config.description}</p><p class="j2-note">${nom==='archives'?'Session History | GM-OS Legacy':nom==='pnj'?'Archives du Nexus':'Atlas du Nexus'}</p></div></div></section>`;
    shell.append(detail);
  } else {
    main.innerHTML = '<h1 class="j2-titre-campagne">Le Silence de Varn</h1><div class="j2-projection" aria-label="Surface de projection"></div><section class="j2-chroniques"><h2>Chroniques de séance</h2><p>Aucun résumé public.</p></section>';
    shell.append(messagerie(d, paysage));
    if (nom === 'notifications') {
      const toast = d.createElement('button'); toast.id='nouveau-message'; toast.className='j2-toast';
      toast.setAttribute('onclick','ouvrirMessagerie()'); toast.setAttribute('aria-label','Ouvrir le nouveau message');
      toast.innerHTML = '<strong>Nouveau Message</strong><span>Maître du Jeu (Maître du Jeu)</span>'; shell.append(toast);
      const badge = d.createElement('span'); badge.id='badge-non-lu'; badge.textContent='1'; d.getElementById('destination-messages')?.append(badge);
      // Le bouton Messages est encore dans le shell détaché du document.
      if (!badge.parentElement) footer.querySelector('#destination-messages').append(badge);
      const alerte = d.createElement('section'); alerte.id='alerte-j2'; alerte.className='j2-alerte hidden';
      alerte.innerHTML = '<div class="j2-alerte-entete"><span>RECU DE : Maître du Jeu</span><button aria-label="Fermer la notification" onclick="document.getElementById(\'alerte-j2\').classList.add(\'hidden\')">Fermer</button></div><h2>Protocole du relais</h2><p>Gardez le sas fermé pendant la transmission.</p><span class="j2-note">NEXUS-COMM v5.2</span>'; shell.append(alerte);
    }
  }
  d.body.replaceChildren(shell); d.body.className=''; d.body.dataset.ecran=nom;
  for (const script of d.querySelectorAll('body script')) script.remove();
  for (const n of header.querySelectorAll('span,div,h1')) {
    if (n.textContent.includes('GM-OS // JOUEUR') && ![...n.children].some(e=>e.textContent.includes('GM-OS'))) n.innerHTML=n.innerHTML.replace('GM-OS // JOUEUR','GM-OS');
    if (n.children.length) continue;
    if (config && n.textContent.includes('OPÉRATION EN COURS')) n.remove();
    if (n.textContent.includes('ARCHIVE LOCALE VALIDÉE')) n.remove();
    if (n.textContent.trim()==='TABLE') { const parent=n.parentElement; n.remove(); if(!parent.textContent.trim())parent.remove(); }
    if (n.textContent.trim()==='HORLOGE SYNC') n.textContent='HORLOGE';
    if (n.textContent.trim()==='Dimanche 4 oct. 2026') n.textContent='Dimanche 4 octobre 2026';
    if (n.textContent.includes('CONFINEMENT PARTIEL')) n.textContent='Alerte de la station';
  }
  for (const n of shell.querySelectorAll('span,div')) {
    if (n.children.length) continue;
    if (n.textContent.trim()==='TABLE' || n.textContent.trim()==='SYS //') { const parent=n.parentElement; n.remove(); if(!parent.textContent.trim())parent.remove(); }
    if(nom==='notifications' && n.textContent.trim()==='13:24:50')n.textContent='23:38:05';
    if(n.textContent.trim()==='HORLOGE TABLE :')n.textContent='HORLOGE :';
  }
  const mode = header.querySelector('button');
  if (!mode) throw new Error(`Bouton mode absent : ${fichier}`);
  mode.id='bouton-mode-j2'; mode.setAttribute('onclick','basculerQualite()');
  mode.innerHTML='<span id="mode-j2">MODE PERFORMANCE</span>';
  const style = d.createElement('link'); style.rel='stylesheet'; style.href='j2.css'; d.head.append(style);
  const script = d.createElement('script'); script.textContent=comportement; d.body.append(script);
  const police = d.createElement('link'); police.rel='stylesheet'; police.href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Orbitron:wght@600;700;800&display=swap'; d.head.append(police);
  let html=dom.serialize().replaceAll('maximum-scale=1.0, user-scalable=no','viewport-fit=cover').replaceAll('truncate','break-words').replaceAll('Palier 3 enclenché','Alerte de la station');
  await writeFile(new URL(`${fichier}.html`,dossier),html);
}
