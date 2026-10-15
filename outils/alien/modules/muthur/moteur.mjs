/** Adaptateur v1 : une seule logique de terminal, celle du prototype autonome. */
import '../../video-alerte.js';
import '../../core.js';
const coeur = globalThis.AlienCore;
const copie = valeur => JSON.parse(JSON.stringify(valeur));
const objet = valeur => valeur !== null && typeof valeur === 'object'
  && [Object.prototype, null].includes(Object.getPrototypeOf(valeur));
const exiger = condition => { if (!condition) throw new Error('Données MU/TH/UR invalides.'); };
const chaine = (valeur, max, vide = true) => typeof valeur === 'string' && valeur.length <= max && (vide || valeur.trim().length > 0);
const entier = valeur => Number.isSafeInteger(valeur) && valeur >= 0;
const date = valeur => Number.isFinite(valeur) && valeur >= 0;
const reserves = new Set([...Object.getOwnPropertyNames(Object.prototype), 'prototype']);
const identite = valeur => typeof valeur === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(valeur) && !reserves.has(valeur);
const acces = ['crew', 'code', 'admin'];

function forme(valeur, requis, facultatifs = []) {
  exiger(objet(valeur));
  exiger(requis.every(cle => Object.hasOwn(valeur, cle)));
  exiger(Object.keys(valeur).every(cle => requis.includes(cle) || facultatifs.includes(cle)));
}

export function validerEtat(etat) {
  forme(etat, ['version', 'system', 'revision', 'config', 'documents', 'players', 'countdown', 'protocoles', 'portes', 'autodestruction', 'diffusionAlarme']);
  exiger(etat.version === 2 && etat.system === 'alien' && entier(etat.revision));
  forme(etat.config, ['vessel', 'status', 'adminPassword', 'crt', 'glitches']);
  exiger(chaine(etat.config.vessel, 64) && chaine(etat.config.status, 2000)
    && chaine(etat.config.adminPassword, 120, false) && typeof etat.config.crt === 'boolean' && typeof etat.config.glitches === 'boolean');
  exiger(Array.isArray(etat.documents) && etat.documents.length <= 256);
  const dossiers = new Set();
  for (const dossier of etat.documents) {
    forme(dossier, ['id', 'title', 'access', 'code', 'body']);
    exiger(identite(dossier.id) && !dossiers.has(dossier.id) && chaine(dossier.title, 80)
      && acces.includes(dossier.access) && chaine(dossier.code, 120) && chaine(dossier.body, 10000));
    dossiers.add(dossier.id);
  }
  exiger(objet(etat.players) && Object.keys(etat.players).length <= 256);
  for (const [id, joueur] of Object.entries(etat.players)) {
    forme(joueur, ['id', 'name', 'access', 'unlocked', 'messages', 'request', 'cue']);
    exiger(identite(id) && joueur.id === id && chaine(joueur.name, 40, false) && acces.includes(joueur.access));
    exiger(Array.isArray(joueur.unlocked) && joueur.unlocked.every(cle => dossiers.has(cle))
      && new Set(joueur.unlocked).size === joueur.unlocked.length);
    exiger(Array.isArray(joueur.messages) && joueur.messages.length <= 200);
    const messages = new Set();
    for (const message of joueur.messages) {
      forme(message, ['id', 'kind', 'content', 'at']);
      exiger(identite(message.id) && !messages.has(message.id) && ['input', 'system', 'success', 'error', 'mother'].includes(message.kind)
        && chaine(message.content, 10000) && date(message.at));
      messages.add(message.id);
    }
    if (joueur.request !== null) {
      forme(joueur.request, ['id', 'type', 'at']);
      exiger(identite(joueur.request.id) && ['message', 'hack'].includes(joueur.request.type) && date(joueur.request.at));
    }
    if (joueur.cue !== null) {
      forme(joueur.cue, ['id', 'type', 'success', 'at', 'duration']);
      exiger(identite(joueur.cue.id) && joueur.cue.type === 'hack' && typeof joueur.cue.success === 'boolean'
        && date(joueur.cue.at) && date(joueur.cue.duration) && joueur.cue.duration <= 7000);
    }
  }
  if (etat.countdown !== null) {
    forme(etat.countdown, ['endAt']); exiger(date(etat.countdown.endAt));
  }
  exiger(['inconnues', 'ouvertes', 'fermees'].includes(etat.portes));
  exiger(etat.diffusionAlarme === null || identite(etat.diffusionAlarme));
  if (etat.autodestruction !== null) {
    forme(etat.autodestruction, ['id', 'startedAt', 'message']);
    exiger(identite(etat.autodestruction.id) && date(etat.autodestruction.startedAt)
      && chaine(etat.autodestruction.message, 4000, false) && etat.countdown !== null
      && etat.countdown.endAt >= etat.autodestruction.startedAt);
  }
  exiger(Array.isArray(etat.protocoles) && etat.protocoles.length <= 64);
  const idsProtocoles = new Set(), codes = new Set(etat.documents.filter(d => d.access === 'code' && d.code).map(d => d.code));
  for (const protocole of etat.protocoles) {
    validerProtocole(protocole);
    exiger(!idsProtocoles.has(protocole.id) && !codes.has(protocole.code));
    idsProtocoles.add(protocole.id); codes.add(protocole.code);
  }
}

function validerProtocole(protocole) {
  forme(protocole, ['id', 'nom', 'code', 'message', 'effet', 'minutes', 'actif', 'portee']);
  exiger(typeof protocole.id === 'string' && /^[a-z][a-z0-9-]{0,79}$/.test(protocole.id)
    && chaine(protocole.nom, 80, false) && chaine(protocole.code, 120, false) && protocole.code === protocole.code.trim()
    && chaine(protocole.message, 4000, false) && ['message', 'ouvrir-portes', 'fermer-portes', 'autodestruction', 'annuler-autodestruction'].includes(protocole.effet)
    && Number.isFinite(protocole.minutes) && protocole.minutes >= 0.1 && protocole.minutes <= 60
    && typeof protocole.actif === 'boolean' && ['operateur', 'equipage'].includes(protocole.portee));
}

function sansRadar(etat) {
  const { tracker: _radar, ...terminal } = etat;
  return terminal;
}

function moteurDe(etat) {
  return coeur.créer({ ...etat, tracker: coeur.initial().tracker });
}

export function creerEtat() {
  return sansRadar(coeur.initial());
}

/** Accepte aussi l'état v1 du prototype, en retirant uniquement son radar. */
export function migrerEtat(donnees, versionDonnees) {
  if (![1, 2].includes(versionDonnees)) throw new Error('Version de données MU/TH/UR non prise en charge.');
  exiger(objet(donnees));
  let terminal = sansRadar(donnees);
  exiger(terminal.version === versionDonnees);
  if (versionDonnees === 1) {
    forme(terminal, ['version', 'system', 'revision', 'config', 'documents', 'players', 'countdown']);
    terminal = { ...terminal, version: 2, protocoles: [], portes: 'inconnues', autodestruction: null, diffusionAlarme: null };
  }
  validerEtat(terminal);
  const resultat = arreterEffets(terminal);
  // Le prototype antérieur au 15/10 gardait l'alias ORDERS en clair dans le fil.
  for (const joueur of Object.values(resultat.players)) for (const message of joueur.messages) {
    const secret = message.kind === 'input' && message.content.match(/^(LOGIN|CODE|ORDERS)\s/i);
    if (secret) message.content = secret[1].toUpperCase() + ' ••••••••';
  }
  return resultat;
}

export function arreterEffets(etat) {
  validerEtat(etat);
  const resultat = copie(etat);
  resultat.countdown = null;
  resultat.autodestruction = null; resultat.diffusionAlarme = null;
  for (const joueur of Object.values(resultat.players)) joueur.cue = null;
  return resultat;
}

function verifierLecteur(lecteur) {
  if (lecteur?.role !== 'mj' && lecteur?.role !== 'joueur') throw new Error('Lecteur MU/TH/UR refusé.');
  if (lecteur.role === 'joueur' && !identite(lecteur.personnageId)) throw new Error('Personnage MU/TH/UR requis.');
}

export function vuePour(etat, lecteur) {
  validerEtat(etat); verifierLecteur(lecteur);
  const moteur = moteurDe(etat);
  if (lecteur.role === 'mj') {
    const { tracker: _radar, ...vue } = moteur.snapshot('gm', '', lecteur.appareilId);
    return vue;
  }
  // L'ouverture ne mute pas la sauvegarde. La première commande inscrit le PJ.
  if (!Object.hasOwn(etat.players, lecteur.personnageId)) moteur.inscrire(lecteur.personnageId, 'Opérateur');
  const { tracker: _radar, ...vue } = moteur.snapshot('player', lecteur.personnageId, lecteur.appareilId);
  vue.revision = etat.revision;
  return vue;
}

export function appliquerCommande(etat, commande, contexte) {
  validerEtat(etat); verifierLecteur(contexte);
  forme(commande, ['id', 'charge']); exiger(typeof commande.id === 'string');
  const charge = commande.charge, moteur = moteurDe(etat);
  const mj = contexte.role === 'mj';
  if (!mj && !['saisir', 'choisir-diffusion'].includes(commande.id)) throw new Error('Commande réservée au meneur.');
  const cibler = () => { exiger(identite(charge.personnageId)); return charge.personnageId; };
  let action;
  if (commande.id === 'choisir-diffusion') {
    forme(charge, ['actif']); exiger(typeof charge.actif === 'boolean' && identite(contexte.appareilId));
    if (!mj && !Object.hasOwn(etat.players, contexte.personnageId)) moteur.inscrire(contexte.personnageId, 'Opérateur');
    moteur.agir(mj ? 'gm' : 'player', contexte.personnageId, { type: 'diffusion', actif: charge.actif }, { appareilId: contexte.appareilId });
  } else if (commande.id === 'saisir') {
    forme(charge, mj ? ['texte', 'personnageId'] : ['texte']);
    exiger(chaine(charge.texte, 2000, false));
    const id = mj ? cibler() : contexte.personnageId;
    if (!Object.hasOwn(etat.players, id)) moteur.inscrire(id, 'Opérateur');
    moteur.agir('player', id, { type: 'command', text: charge.texte });
  } else if (commande.id === 'preparer-operateur') {
    forme(charge, ['personnageId', 'nom']); const id = cibler();
    exiger(chaine(charge.nom, 40, false));
    moteur.inscrire(id, charge.nom);
    const candidat = sansRadar(moteur.sauvegarde());
    candidat.players[id].name = charge.nom;
    candidat.revision = etat.revision + 1;
    validerEtat(candidat); return candidat;
  } else if (commande.id === 'configurer') {
    forme(charge, [], ['vaisseau', 'statut', 'motDePasse', 'crt', 'parasites']);
    const config = {};
    for (const [entree, sortie, max] of [['vaisseau', 'vessel', 64], ['statut', 'status', 2000], ['motDePasse', 'adminPassword', 120]]) {
      if (Object.hasOwn(charge, entree)) { exiger(chaine(charge[entree], max, entree !== 'motDePasse')); config[sortie] = entree === 'motDePasse' ? charge[entree].trim() : charge[entree]; }
    }
    for (const [entree, sortie] of [['crt', 'crt'], ['parasites', 'glitches']]) {
      if (Object.hasOwn(charge, entree)) { exiger(typeof charge[entree] === 'boolean'); config[sortie] = charge[entree]; }
    }
    action = { type: 'config', config };
  } else if (commande.id === 'creer-dossier') {
    forme(charge, ['dossierId', 'titre', 'contenu', 'acces', 'code']);
    exiger(identite(charge.dossierId) && chaine(charge.titre, 80, false)
      && chaine(charge.contenu, 10000) && chaine(charge.code, 120)
      && ['equipage', 'code', 'administrateur'].includes(charge.acces));
    action = { type: 'creer-document', document: {
      id: charge.dossierId, title: charge.titre, body: charge.contenu,
      access: { equipage: 'crew', code: 'code', administrateur: 'admin' }[charge.acces], code: charge.code,
    } };
  } else if (commande.id === 'modifier-dossier') {
    forme(charge, ['dossierId'], ['titre', 'contenu', 'acces', 'code']);
    exiger(identite(charge.dossierId)); const document = {};
    for (const [entree, sortie, max] of [['titre', 'title', 80], ['contenu', 'body', 10000], ['code', 'code', 120]]) {
      if (Object.hasOwn(charge, entree)) { exiger(chaine(charge[entree], max)); document[sortie] = entree === 'code' ? charge[entree].trim() : charge[entree]; }
    }
    if (Object.hasOwn(charge, 'acces')) { exiger(['equipage', 'code', 'administrateur'].includes(charge.acces)); document.access = { equipage: 'crew', code: 'code', administrateur: 'admin' }[charge.acces]; }
    action = { type: 'document', id: charge.dossierId, document };
  } else if (commande.id === 'enregistrer-protocole') {
    forme(charge, ['protocole']); validerProtocole(charge.protocole);
    action = { type: 'protocole', protocole: charge.protocole };
  } else if (commande.id === 'supprimer-protocole') {
    forme(charge, ['protocoleId']); exiger(identite(charge.protocoleId));
    action = { type: 'supprimer-protocole', id: charge.protocoleId };
  } else if (commande.id === 'repondre') {
    forme(charge, ['personnageId', 'texte']); exiger(chaine(charge.texte, 10000, false));
    action = { type: 'reply', playerId: cibler(), text: charge.texte };
  } else if (commande.id === 'arbitrer-piratage') {
    forme(charge, ['personnageId', 'reussite']); exiger(typeof charge.reussite === 'boolean');
    action = { type: 'hack', playerId: cibler(), success: charge.reussite };
  } else if (commande.id === 'revoquer') {
    forme(charge, ['personnageId']); action = { type: 'revoke', playerId: cibler() };
  } else if (commande.id === 'compte-a-rebours') {
    forme(charge, ['minutes']); exiger(charge.minutes === null || (Number.isFinite(charge.minutes) && charge.minutes >= 0.1 && charge.minutes <= 60));
    action = { type: 'countdown', minutes: charge.minutes };
  } else if (commande.id === 'reinitialiser') {
    forme(charge, []); action = { type: 'reset' };
  } else throw new Error('Commande MU/TH/UR inconnue.');
  if (action) moteur.agir('gm', '', action);
  const resultat = sansRadar(moteur.sauvegarde());
  resultat.revision = etat.revision + 1;
  validerEtat(resultat);
  return resultat;
}
