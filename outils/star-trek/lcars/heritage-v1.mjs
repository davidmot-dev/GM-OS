/** Moteur LCARS sans disque, réseau ou dépendance à GM-OS. L'hôte fournit l'identité. */
const copier = v => JSON.parse(JSON.stringify(v));
const exiger = (ok, message = 'Données LCARS invalides.') => { if (!ok) throw new Error(message); };
const objet = v => !!v && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const champs = (v, noms) => objet(v) && Object.keys(v).length === noms.length && noms.every(n => Object.hasOwn(v, n));
const texte = (v, max, vide = false) => typeof v === 'string' && v.length <= max && (vide || !!v.trim());
const id = v => texte(v, 128) && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
const entier = v => Number.isSafeInteger(v) && v >= 0;
const unique = liste => new Set(liste.map(v => v.id)).size === liste.length;
const niveaux = ['normal', 'jaune', 'rouge'];
const statuts = ['attente', 'traitee', 'annulee'];
const intentions = ['scan', 'analyse'];

export function creerEtat() {
  return { version: 1, revision: 0, vaisseau: { nom: 'USS ASTERIA', immatriculation: 'NCC-78126' },
    situation: 'Reconnaissance du secteur. En attente des observations scientifiques.',
    alerte: 'normal', effetsActifs: false, officiers: [], contacts: [], demandes: [], partages: [] };
}

export function validerEtat(e) {
  exiger(champs(e, ['version', 'revision', 'vaisseau', 'situation', 'alerte', 'effetsActifs', 'officiers', 'contacts', 'demandes', 'partages']));
  exiger(e.version === 1 && entier(e.revision) && e.revision < Number.MAX_SAFE_INTEGER);
  exiger(champs(e.vaisseau, ['nom', 'immatriculation']) && texte(e.vaisseau.nom, 80) && texte(e.vaisseau.immatriculation, 40));
  exiger(texte(e.situation, 1000, true) && niveaux.includes(e.alerte) && typeof e.effetsActifs === 'boolean');
  for (const [nom, max] of [['officiers', 16], ['contacts', 32], ['demandes', 128], ['partages', 128]]) {
    exiger(Array.isArray(e[nom]) && e[nom].length <= max && e[nom].every(v => objet(v) && id(v.id)) && unique(e[nom]));
  }
  for (const p of e.officiers) {
    exiger(champs(p, ['id', 'nom', 'science', 'affectation', 'scan']) && texte(p.nom, 80) && typeof p.science === 'boolean' && entier(p.affectation));
    exiger(p.scan === null || (champs(p.scan, ['id', 'at', 'duree']) && id(p.scan.id) && entier(p.scan.at) && p.scan.duree === 2600 && p.science && e.effetsActifs));
  }
  for (const c of e.contacts) exiger(champs(c, ['id', 'libelle', 'description', 'rapportPrepare', 'revele']) && texte(c.libelle, 100)
    && texte(c.description, 1000, true) && texte(c.rapportPrepare, 4000, true) && typeof c.revele === 'boolean');
  for (const d of e.demandes) {
    const officier = e.officiers.find(p => p.id === d.personnageId);
    exiger(champs(d, ['id', 'personnageId', 'affectation', 'contactId', 'contactLibelle', 'intention', 'question', 'statut', 'at', 'rapport', 'resolutionAt', 'partageAutorise'])
      && officier && entier(d.affectation) && e.contacts.some(c => c.id === d.contactId) && texte(d.contactLibelle, 100)
      && intentions.includes(d.intention) && texte(d.question, 500, true) && statuts.includes(d.statut) && entier(d.at)
      && texte(d.rapport, 4000, true) && typeof d.partageAutorise === 'boolean');
    exiger(d.statut === 'attente' ? d.resolutionAt === null && d.rapport === '' && !d.partageAutorise && officier.science && officier.affectation === d.affectation
      : entier(d.resolutionAt) && (d.statut === 'traitee' ? texte(d.rapport, 4000) : d.rapport === '' && !d.partageAutorise));
  }
  exiger(e.demandes.filter(d => d.statut === 'attente').length <= 32);
  for (const p of e.partages) {
    const source = e.demandes.find(d => d.id === p.sourceId);
    exiger(champs(p, ['id', 'sourceId', 'par', 'contactLibelle', 'rapport', 'at']) && source?.statut === 'traitee' && source.partageAutorise
      && p.par === source.personnageId && p.contactLibelle === source.contactLibelle && p.rapport === source.rapport && entier(p.at));
  }
  exiger(new Set(e.partages.map(p => p.sourceId)).size === e.partages.length);
  for (const p of e.officiers) if (p.scan) exiger(e.demandes.some(d => d.id === p.scan.id && d.personnageId === p.id && d.statut === 'attente'));
}

export function migrerEtat(donnees, versionDonnees) {
  exiger(versionDonnees === 1, 'Version LCARS non prise en charge.');
  validerEtat(donnees); return copier(donnees);
}

export function arreterEffets(etat) {
  validerEtat(etat);
  const suivant = copier(etat); suivant.effetsActifs = false;
  for (const p of suivant.officiers) p.scan = null;
  return suivant;
}

export function appliquerCommande(etat, commande, contexte) {
  validerEtat(etat);
  exiger(champs(commande, ['id', 'charge']) && objet(commande.charge), 'Commande LCARS invalide.');
  exiger(contexte?.role === 'mj' || (contexte?.role === 'joueur' && id(contexte.personnageId)), 'Lecteur LCARS invalide.');
  const e = copier(etat), c = commande.charge, mj = contexte.role === 'mj', at = Date.now();
  const officier = e.officiers.find(p => p.id === contexte.personnageId);
  const science = () => exiger(officier?.science && c.affectation === officier.affectation, 'Console Science fermée ou réaffectée.');
  const reserve = (liste, max) => exiger(liste.length < max, 'Capacité du prototype atteinte. Recommence la fiction de test.');
  switch (commande.id) {
    case 'preparer-officier': {
      exiger(mj && champs(c, ['personnageId', 'nom', 'science']) && id(c.personnageId) && texte(c.nom, 80) && typeof c.science === 'boolean');
      let p = e.officiers.find(o => o.id === c.personnageId);
      if (!p) { reserve(e.officiers, 16); p = { id: c.personnageId, nom: c.nom, science: c.science, affectation: 1, scan: null }; e.officiers.push(p); }
      if (p.science !== c.science) {
        p.affectation++; p.scan = null;
        for (const d of e.demandes.filter(d => d.personnageId === p.id && d.statut === 'attente')) { d.statut = 'annulee'; d.resolutionAt = at; }
      }
      p.nom = c.nom; p.science = c.science; break;
    }
    case 'configurer-vaisseau':
      exiger(mj && champs(c, ['nom', 'immatriculation', 'situation']) && texte(c.nom, 80) && texte(c.immatriculation, 40) && texte(c.situation, 1000, true));
      e.vaisseau = { nom: c.nom.trim(), immatriculation: c.immatriculation.trim() }; e.situation = c.situation.trim(); break;
    case 'preparer-contact': {
      exiger(mj && champs(c, ['contactId', 'libelle', 'description', 'rapportPrepare', 'revele']) && id(c.contactId) && texte(c.libelle, 100)
        && texte(c.description, 1000, true) && texte(c.rapportPrepare, 4000, true) && typeof c.revele === 'boolean');
      let contact = e.contacts.find(v => v.id === c.contactId);
      if (!contact) { reserve(e.contacts, 32); contact = { id: c.contactId }; e.contacts.push(contact); }
      Object.assign(contact, { libelle: c.libelle.trim(), description: c.description.trim(), rapportPrepare: c.rapportPrepare.trim(), revele: c.revele }); break;
    }
    case 'demander-scan': {
      exiger(!mj && champs(c, ['contactId', 'intention', 'question', 'affectation']) && intentions.includes(c.intention) && texte(c.question, 500, true)); science();
      const contact = e.contacts.find(v => v.id === c.contactId && v.revele);
      exiger(contact, 'Contact indisponible.');
      exiger(!e.demandes.some(d => d.personnageId === officier.id && d.contactId === contact.id && d.intention === c.intention && d.statut === 'attente'), 'Cette analyse attend déjà le MJ.');
      reserve(e.demandes, 128); reserve(e.demandes.filter(d => d.statut === 'attente'), 32);
      const identifiant = `demande-${e.revision + 1}`;
      e.demandes.push({ id: identifiant, personnageId: officier.id, affectation: officier.affectation, contactId: contact.id,
        contactLibelle: contact.libelle, intention: c.intention, question: c.question.trim(), statut: 'attente', at, rapport: '', resolutionAt: null, partageAutorise: false });
      officier.scan = { id: identifiant, at, duree: 2600 }; e.effetsActifs = true; break;
    }
    case 'resoudre-demande': {
      exiger(mj && champs(c, ['demandeId', 'texte', 'partageAutorise']) && texte(c.texte, 4000) && typeof c.partageAutorise === 'boolean');
      const demande = e.demandes.find(d => d.id === c.demandeId && d.statut === 'attente'); exiger(demande, 'Demande absente ou déjà traitée.');
      Object.assign(demande, { statut: 'traitee', rapport: c.texte.trim(), resolutionAt: at, partageAutorise: c.partageAutorise });
      const auteur = e.officiers.find(p => p.id === demande.personnageId);
      if (auteur.scan?.id === demande.id) auteur.scan = null;
      break;
    }
    case 'partager-rapport': {
      exiger(!mj && champs(c, ['demandeId', 'affectation'])); science();
      const demande = e.demandes.find(d => d.id === c.demandeId && d.personnageId === officier.id && d.statut === 'traitee' && d.partageAutorise);
      exiger(demande, 'Ce rapport ne peut pas être partagé.');
      exiger(!e.partages.some(p => p.sourceId === demande.id), 'Rapport déjà transmis à l’équipage.'); reserve(e.partages, 128);
      e.partages.push({ id: `partage-${e.revision + 1}`, sourceId: demande.id, par: officier.id, contactLibelle: demande.contactLibelle, rapport: demande.rapport, at }); break;
    }
    case 'changer-alerte':
      exiger(mj && champs(c, ['niveau']) && niveaux.includes(c.niveau)); e.alerte = c.niveau; e.effetsActifs = true; break;
    case 'couper-effets':
      exiger(mj && champs(c, [])); e.effetsActifs = false; for (const p of e.officiers) p.scan = null; break;
    default: throw new Error('Commande inconnue ou interdite.');
  }
  e.revision++; validerEtat(e); return e;
}

export function vuePour(etat, lecteur) {
  validerEtat(etat);
  if (lecteur?.role === 'mj') return { ...copier(etat), role: 'mj' };
  exiger(lecteur?.role === 'joueur' && id(lecteur.personnageId), 'Lecteur LCARS invalide.');
  const p = etat.officiers.find(o => o.id === lecteur.personnageId); exiger(p, 'Officier non préparé.');
  return copier({ role: 'joueur', revision: etat.revision, vaisseau: etat.vaisseau, situation: etat.situation, alerte: etat.alerte,
    effetsActifs: etat.effetsActifs, officier: p,
    contacts: p.science ? etat.contacts.filter(c => c.revele).map(({ id, libelle, description }) => ({ id, libelle, description })) : [],
    demandes: p.science ? etat.demandes.filter(d => d.personnageId === p.id) : [], partages: etat.partages });
}
