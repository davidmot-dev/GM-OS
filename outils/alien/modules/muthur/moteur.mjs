/** Adaptateur v1 : une seule logique de terminal, celle du prototype autonome. */
import '../../video-alerte.js';
import '../../core.js';
import { validerActes, preparerActe } from './actes.mjs';
import { COMMANDES_DE_PREREGLAGE, enregistrerPrereglage, lireCharge, prereglageDe, sansPrereglage, sommaireDesPrereglages, validerPrereglages } from '../prereglages.mjs';
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

export function validerEtat(etat, version = 5) {
  forme(etat, ['version', 'system', 'revision', 'config', 'documents', 'players', 'countdown', 'protocoles', 'portes', 'autodestruction', 'diffusionAlarme', ...(version >= 4 ? ['actes'] : []), ...(version >= 5 ? ['prereglages'] : [])]);
  if (version >= 4) validerActes(etat.actes);
  if (version >= 5) validerPrereglages(etat.prereglages, validerPreparation);
  exiger(etat.version === version && etat.system === 'alien' && entier(etat.revision));
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
    forme(joueur, ['id', 'name', 'access', 'unlocked', 'messages', 'request', 'cue', ...(version >= 3 ? ['requests'] : [])]);
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
    if (version >= 3) {
      exiger(Array.isArray(joueur.requests) && joueur.requests.length <= 128 && joueur.requests.filter(d => d.status === 'pending').length <= 32);
      const ids = new Set();
      for (const demande of joueur.requests) {
        forme(demande, ['id', 'type', 'at', 'content', 'status', 'response', 'resolvedAt']);
        exiger(identite(demande.id) && !ids.has(demande.id) && ['message', 'hack'].includes(demande.type) && date(demande.at)
          && chaine(demande.content, 2000, false) && chaine(demande.response, 10000)
          && (demande.type === 'message' ? ['pending', 'answered', 'cancelled'] : ['pending', 'accepted', 'refused', 'cancelled']).includes(demande.status)
          && (demande.status === 'pending' ? demande.resolvedAt === null && demande.response === '' : date(demande.resolvedAt)));
        ids.add(demande.id);
      }
      const attente = joueur.requests.filter(d => d.status === 'pending');
      exiger(attente.filter(d => d.type === 'hack').length <= 1);
      const prochaine = attente.find(d => d.type === 'hack') || attente[0];
      exiger(prochaine ? joueur.request?.id === prochaine.id && joueur.request.type === prochaine.type && joueur.request.at === prochaine.at : joueur.request === null);
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

/** Un préréglage v5 : la préparation de Maman, sans opérateur ni dialogue. */
function validerPreparation(contenu) {
  forme(contenu, ['config', 'documents', 'protocoles', 'actes']);
  validerEtat({ ...enrichir(coeur.initial()), ...contenu });
}
/** Les dossiers d'acte publiés le restent ; les objectifs sont à remettre. Sert aussi au fichier de l'atelier. */
export function preparationDe(etat) {
  validerEtat(etat);
  const actes = etat.actes.map(a => ({ ...a, dossiers: a.dossiers.map(d => ({ ...d, publie: etat.documents.some(doc => doc.id === d.id) })), objectifs: a.objectifs.map(o => ({ ...o, remis: false })) }));
  return copie({ config: etat.config, documents: etat.documents, protocoles: etat.protocoles, actes });
}

function sansRadar(etat) {
  const { tracker: _radar, prereglagesDetecteur: _prereglages, ...terminal } = etat;
  return terminal;
}

function moteurDe(etat) {
  const { actes: _actes, prereglages: _prereglages, ...terminal } = etat;
  return coeur.créer({ ...terminal, version: Math.min(3,terminal.version), tracker: coeur.initial().tracker });
}
const enrichir = (terminal, actes = [], prereglages = []) => ({ ...sansRadar(terminal), version:5, actes:copie(actes), prereglages:copie(prereglages) });

export function creerEtat() {
  return enrichir(coeur.initial());
}

/** Accepte aussi l'état v1 du prototype, en retirant uniquement son radar. */
export function migrerEtat(donnees, versionDonnees) {
  if (![1, 2, 3, 4, 5].includes(versionDonnees)) throw new Error('Version de données MU/TH/UR non prise en charge.');
  exiger(objet(donnees));
  let terminal = sansRadar(donnees);
  exiger(terminal.version === versionDonnees);
  if (versionDonnees === 1) {
    forme(terminal, ['version', 'system', 'revision', 'config', 'documents', 'players', 'countdown']);
    terminal = { ...terminal, version: 2, protocoles: [], portes: 'inconnues', autodestruction: null, diffusionAlarme: null };
  }
  validerEtat(terminal, terminal.version);
  if (terminal.version === 2) terminal = sansRadar(moteurDe(terminal).sauvegarde());
  const resultat = arreterEffets(enrichir(terminal,donnees.actes,donnees.prereglages));
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
    return { ...enrichir(moteur.snapshot('gm', '', lecteur.appareilId),etat.actes), prereglages: sommaireDesPrereglages(etat.prereglages) };
  }
  // L'ouverture ne mute pas la sauvegarde. La première commande inscrit le PJ.
  if (!Object.hasOwn(etat.players, lecteur.personnageId)) moteur.inscrire(lecteur.personnageId, 'Opérateur');
  const { tracker: _radar, ...vue } = moteur.snapshot('player', lecteur.personnageId, lecteur.appareilId);
  vue.revision = etat.revision;
  vue.version = 5;
  return vue;
}

export function appliquerCommande(etat, commande, contexte) {
  validerEtat(etat); verifierLecteur(contexte);
  forme(commande, ['id', 'charge']); exiger(typeof commande.id === 'string');
  const charge = commande.charge, moteur = moteurDe(etat);
  const mj = contexte.role === 'mj';
  if (!mj && !['saisir', 'choisir-diffusion'].includes(commande.id)) throw new Error('Commande réservée au meneur.');
  if (COMMANDES_DE_PREREGLAGE.includes(commande.id)) {
    const c = lireCharge(commande);
    let resultat = copie(etat);
    if (commande.id === 'enregistrer-prereglage') resultat.prereglages = enregistrerPrereglage(etat.prereglages, c, preparationDe(etat), validerPreparation);
    else if (commande.id === 'supprimer-prereglage') resultat.prereglages = sansPrereglage(etat.prereglages, c.prereglageId);
    else {
      // Rappeler, c'est remettre le terminal à neuf puis poser la préparation ; les opérateurs restent.
      const { id: _id, nom: _nom, ...preparation } = prereglageDe(etat.prereglages, c.prereglageId);
      moteur.agir('gm', '', { type: 'reset' });
      resultat = { ...enrichir(moteur.sauvegarde(), preparation.actes, etat.prereglages), config: preparation.config, documents: preparation.documents, protocoles: preparation.protocoles };
    }
    resultat.revision = etat.revision + 1; validerEtat(resultat); return resultat;
  }
  if (['dossier-acte','objectif-acte','publier-dossier-acte','remettre-objectif-acte'].includes(commande.id)) {
    const actes = preparerActe(etat.actes,commande,etat.players,
      d => { exiger(!etat.documents.some(a=>a.id===d.id)); moteur.agir('gm','',{type:'creer-document',document:{id:d.id,title:d.titre,body:d.contenu,access:{equipage:'crew',code:'code',administrateur:'admin'}[d.acces],code:d.code}}); },
      (o,a) => moteur.agir('gm','',{type:'reply',playerId:o.personnageId,text:`Objectif — ${a.scenario}, acte ${a.acte}\n${o.texte}`,requestId:null}));
    const resultat=enrichir(moteur.sauvegarde(),actes,etat.prereglages); resultat.revision=etat.revision+1; validerEtat(resultat); return resultat;
  }
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
    const candidat = enrichir(moteur.sauvegarde(),etat.actes,etat.prereglages);
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
  } else if (commande.id === 'supprimer-dossier') {
    forme(charge, ['dossierId']); exiger(identite(charge.dossierId));
    action = { type: 'supprimer-document', id: charge.dossierId };
  } else if (commande.id === 'classer-dossiers') {
    forme(charge, ['dossierIds']); exiger(Array.isArray(charge.dossierIds) && charge.dossierIds.every(identite));
    action = { type: 'classer-documents', ids: charge.dossierIds };
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
    forme(charge, ['personnageId', 'texte'], ['demandeId']); exiger(chaine(charge.texte, 10000, false));
    if (Object.hasOwn(charge, 'demandeId')) exiger(charge.demandeId === null || identite(charge.demandeId));
    action = { type: 'reply', playerId: cibler(), text: charge.texte, requestId: charge.demandeId };
  } else if (commande.id === 'arbitrer-piratage') {
    forme(charge, ['personnageId', 'reussite'], ['demandeId']); exiger(typeof charge.reussite === 'boolean');
    if (Object.hasOwn(charge, 'demandeId')) exiger(identite(charge.demandeId));
    action = { type: 'hack', playerId: cibler(), success: charge.reussite, requestId: charge.demandeId };
  } else if (commande.id === 'revoquer') {
    forme(charge, ['personnageId']); action = { type: 'revoke', playerId: cibler() };
  } else if (commande.id === 'compte-a-rebours') {
    forme(charge, ['minutes']); exiger(charge.minutes === null || (Number.isFinite(charge.minutes) && charge.minutes >= 0.1 && charge.minutes <= 60));
    action = { type: 'countdown', minutes: charge.minutes };
  } else if (commande.id === 'reinitialiser') {
    forme(charge, []); action = { type: 'reset' };
  } else throw new Error('Commande MU/TH/UR inconnue.');
  if (action) moteur.agir('gm', '', action);
  // La remise à zéro garde les préréglages : c'est d'eux qu'on repart.
  const resultat = enrichir(moteur.sauvegarde(),commande.id === 'reinitialiser' ? [] : etat.actes,etat.prereglages);
  resultat.revision = etat.revision + 1;
  validerEtat(resultat);
  return resultat;
}
