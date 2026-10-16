/** Autorité LCARS : identité fournie par l'hôte, mutations sur copie. */
import { POSTES, NIVEAUX, STATUTS, EN_ATTENTE } from './postes.mjs';
import { validerEtat as validerV1 } from './heritage-v1.mjs';
const copier = v => JSON.parse(JSON.stringify(v));
const exiger = (ok, message = 'Données LCARS invalides.') => { if (!ok) throw new Error(message); };
const objet = v => !!v && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const champs = (v, noms) => objet(v) && Object.keys(v).length === noms.length && noms.every(n => Object.hasOwn(v, n));
const texte = (v, max, vide = false) => typeof v === 'string' && v.length <= max && (vide || !!v.trim());
const id = v => texte(v, 128) && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
const entier = v => Number.isSafeInteger(v) && v >= 0;
const poste = v => typeof v === 'string' && Object.hasOwn(POSTES, v);
const listePostes = v => Array.isArray(v) && v.length <= 7 && v.every(poste) && new Set(v).size === v.length;
const destinations = v => Array.isArray(v) && v.length > 0 && (v.length === 1 && v[0] === 'equipage' || listePostes(v));
const visiblePour = (p, v) => v.includes('equipage') || v.some(s => p.postes.includes(s));
const capacite = (liste, max) => exiger(liste.length < max, 'Capacité atteinte. Archive les demandes résolues ou retire des éléments.');
const fichiers = { image: ['image/png', 'image/jpeg', 'image/webp'], audio: ['audio/mpeg', 'audio/ogg', 'audio/wav'], video: ['video/mp4', 'video/webm'] };
export function validerMedia(v) {
  if (v === null) return;
  exiger(champs(v, ['type', 'nom', 'source']) && Object.hasOwn(fichiers, v.type) && texte(v.nom, 120));
  exiger(typeof v.source === 'string' && v.source.length <= 6 * 1024 * 1024 && fichiers[v.type].some(mime => v.source.startsWith(`data:${mime};base64,`))
    && /^data:[a-z0-9/]+;base64,[A-Za-z0-9+/]+={0,2}$/.test(v.source), 'Média refusé : PNG/JPEG/WebP, MP3/OGG/WAV, MP4/WebM uniquement (4 Mo par fichier).');
  const base64 = v.source.slice(v.source.indexOf(',') + 1);
  exiger(Math.floor(base64.length * 3 / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0) <= 4 * 1024 * 1024, 'Média supérieur à 4 Mo.');
}
export function creerEtat() {
  return { version: 2, revision: 0, vaisseau: { nom: 'USS ASTERIA', immatriculation: 'NCC-78126' }, situation: 'Reconnaissance de la station silencieuse.',
    alerte: { niveau: 'normal', texte: '', fin: null, sequence: 0 }, effetsActifs: false, diffusionSonore: null,
    officiers: [], cibles: [], demandes: [], publications: [], ordres: [], prereglages: [] };
}
export function validerEtat(e) {
  exiger(champs(e, ['version', 'revision', 'vaisseau', 'situation', 'alerte', 'effetsActifs', 'diffusionSonore', 'officiers', 'cibles', 'demandes', 'publications', 'ordres', 'prereglages']));
  exiger(e.version === 2 && entier(e.revision) && e.revision < Number.MAX_SAFE_INTEGER && JSON.stringify(e).length <= 16 * 1024 * 1024, 'État LCARS invalide ou supérieur à 16 Mo.');
  exiger(champs(e.vaisseau, ['nom', 'immatriculation']) && texte(e.vaisseau.nom, 80) && texte(e.vaisseau.immatriculation, 40) && texte(e.situation, 2000, true));
  exiger(champs(e.alerte, ['niveau', 'texte', 'fin', 'sequence']) && NIVEAUX.includes(e.alerte.niveau) && texte(e.alerte.texte, 1000, true)
    && (e.alerte.fin === null || entier(e.alerte.fin)) && entier(e.alerte.sequence) && typeof e.effetsActifs === 'boolean' && (e.diffusionSonore === null || id(e.diffusionSonore)));
  for (const [nom, max] of [['officiers', 16], ['cibles', 64], ['demandes', 256], ['publications', 256], ['ordres', 128], ['prereglages', 24]])
    exiger(Array.isArray(e[nom]) && e[nom].length <= max && e[nom].every(v => objet(v) && id(v.id)) && new Set(e[nom].map(v => v.id)).size === e[nom].length);
  for (const p of e.officiers) {
    exiger(champs(p, ['id', 'nom', 'postes', 'affectation', 'scan']) && texte(p.nom, 80) && listePostes(p.postes) && entier(p.affectation));
    exiger(p.scan === null || champs(p.scan, ['id', 'at', 'duree', 'poste']) && id(p.scan.id) && entier(p.scan.at) && p.scan.duree === 2600 && p.postes.includes(p.scan.poste) && e.effetsActifs);
  }
  for (const c of e.cibles) exiger(champs(c, ['id', 'poste', 'libelle', 'description', 'etat', 'rapportPrepare', 'visible']) && poste(c.poste)
    && POSTES[c.poste].etats.includes(c.etat) && texte(c.libelle, 100) && texte(c.description, 2000, true) && texte(c.rapportPrepare, 4000, true) && typeof c.visible === 'boolean');
  for (const d of e.demandes) {
    const p = e.officiers.find(p => p.id === d.personnageId);
    exiger(champs(d, ['id', 'personnageId', 'affectation', 'poste', 'cibleId', 'cibleLibelle', 'action', 'question', 'statut', 'at', 'rapport', 'resolutionAt', 'partageAutorise', 'media'])
      && p && entier(d.affectation) && poste(d.poste) && Object.hasOwn(POSTES[d.poste].actions, d.action) && id(d.cibleId) && texte(d.cibleLibelle, 100)
      && texte(d.question, 1000, true) && Object.hasOwn(STATUTS, d.statut) && entier(d.at) && texte(d.rapport, 4000, true) && typeof d.partageAutorise === 'boolean');
    exiger(EN_ATTENTE.includes(d.statut) ? d.resolutionAt === null && d.rapport === '' && !d.partageAutorise && d.media === null && p.postes.includes(d.poste) && e.cibles.some(c => c.id === d.cibleId && c.poste === d.poste)
      : entier(d.resolutionAt) && (d.statut === 'annulee' ? d.rapport === '' && d.media === null && !d.partageAutorise : texte(d.rapport, 4000)));
    validerMedia(d.media);
  }
  exiger(e.demandes.filter(d => EN_ATTENTE.includes(d.statut)).length <= 32);
  for (const p of e.officiers) if (p.scan) exiger(e.demandes.some(d => d.id === p.scan.id && d.personnageId === p.id && d.poste === p.scan.poste && EN_ATTENTE.includes(d.statut)));
  for (const r of e.publications) {
    exiger(champs(r, ['id', 'titre', 'texte', 'destinataires', 'sourceId', 'auteur', 'at', 'media']) && texte(r.titre, 100) && texte(r.texte, 4000)
      && destinations(r.destinataires) && (r.sourceId === null || id(r.sourceId)) && texte(r.auteur, 80) && entier(r.at)); validerMedia(r.media);
  }
  exiger(new Set(e.publications.filter(p => p.sourceId).map(p => p.sourceId)).size === e.publications.filter(p => p.sourceId).length);
  for (const o of e.ordres) {
    exiger(champs(o, ['id', 'auteurId', 'auteur', 'destinataires', 'texte', 'at', 'accuses']) && e.officiers.some(p => p.id === o.auteurId)
      && texte(o.auteur, 80) && destinations(o.destinataires) && texte(o.texte, 1000) && entier(o.at) && Array.isArray(o.accuses) && o.accuses.length <= 16 && new Set(o.accuses.map(a => a.personnageId)).size === o.accuses.length);
    for (const a of o.accuses) exiger(champs(a, ['personnageId', 'nom', 'at']) && e.officiers.some(p => p.id === a.personnageId) && texte(a.nom, 80) && entier(a.at));
  }
  for (const p of e.prereglages) {
    exiger(champs(p, ['id', 'nom', 'situation', 'niveau', 'texte', 'cibles']) && texte(p.nom, 80) && texte(p.situation, 2000, true) && NIVEAUX.includes(p.niveau) && texte(p.texte, 1000, true)
      && Array.isArray(p.cibles) && p.cibles.length <= 64 && new Set(p.cibles.map(c => c.id)).size === p.cibles.length);
    for (const c of p.cibles) exiger(champs(c, ['id', 'poste', 'etat', 'visible']) && id(c.id) && poste(c.poste) && POSTES[c.poste].etats.includes(c.etat) && typeof c.visible === 'boolean');
  }
}
export function migrerEtat(donnees, versionDonnees) {
  if (versionDonnees === 2) { validerEtat(donnees); return copier(donnees); }
  exiger(versionDonnees === 1, 'Version LCARS non prise en charge.'); validerV1(donnees);
  const e = creerEtat(), v = copier(donnees);
  Object.assign(e, { revision: v.revision, vaisseau: v.vaisseau, situation: v.situation }); e.alerte.niveau = v.alerte;
  e.officiers = v.officiers.map(p => ({ id: p.id, nom: p.nom, postes: p.science ? ['science'] : [], affectation: p.affectation, scan: null }));
  e.cibles = v.contacts.map(c => ({ id: c.id, poste: 'science', libelle: c.libelle, description: c.description, rapportPrepare: c.rapportPrepare, visible: c.revele, etat: 'inconnu' }));
  e.demandes = v.demandes.map(d => ({ id: d.id, personnageId: d.personnageId, affectation: d.affectation, poste: 'science', cibleId: d.contactId, cibleLibelle: d.contactLibelle,
    action: d.intention, question: d.question, statut: d.statut, at: d.at, rapport: d.rapport, resolutionAt: d.resolutionAt, partageAutorise: d.partageAutorise, media: null }));
  e.publications = v.partages.map(p => ({ id: p.id, titre: p.contactLibelle, texte: p.rapport, destinataires: ['equipage'], sourceId: p.sourceId, auteur: v.officiers.find(o => o.id === p.par).nom, at: p.at, media: null }));
  validerEtat(e); return e;
}
export function arreterEffets(etat) {
  validerEtat(etat); const e = copier(etat); e.effetsActifs = false; e.diffusionSonore = null; e.alerte.fin = null; for (const p of e.officiers) p.scan = null; return e;
}
export function appliquerCommande(etat, commande, contexte) {
  validerEtat(etat); exiger(champs(commande, ['id', 'charge']) && objet(commande.charge), 'Commande LCARS invalide.');
  exiger(contexte?.role === 'mj' || contexte?.role === 'joueur' && id(contexte.personnageId), 'Lecteur LCARS invalide.');
  const e = copier(etat), c = commande.charge, mj = contexte.role === 'mj', at = Date.now(), p = e.officiers.find(p => p.id === contexte.personnageId);
  const numero = prefixe => `${prefixe}-${e.revision + 1}`;
  const droit = s => exiger(!mj && p?.postes.includes(s) && c.affectation === p.affectation, 'Console fermée ou réaffectée.');
  const couper = () => { e.effetsActifs = false; e.diffusionSonore = null; e.alerte.fin = null; for (const o of e.officiers) o.scan = null; };
  switch (commande.id) {
    case 'preparer-officier': {
      exiger(mj && champs(c, ['personnageId', 'nom', 'postes']) && id(c.personnageId) && texte(c.nom, 80) && listePostes(c.postes));
      let o = e.officiers.find(o => o.id === c.personnageId);
      if (!o) { capacite(e.officiers, 16); o = { id: c.personnageId, nom: c.nom.trim(), postes: [], affectation: 0, scan: null }; e.officiers.push(o); }
      if ([...o.postes].sort().join() !== [...c.postes].sort().join()) {
        o.affectation++; o.scan = null;
        for (const d of e.demandes.filter(d => d.personnageId === o.id && EN_ATTENTE.includes(d.statut) && !c.postes.includes(d.poste))) { d.statut = 'annulee'; d.resolutionAt = at; }
      }
      o.nom = c.nom.trim(); o.postes = [...c.postes]; break;
    }
    case 'configurer-vaisseau':
      exiger(mj && champs(c, ['nom', 'immatriculation', 'situation']) && texte(c.nom, 80) && texte(c.immatriculation, 40) && texte(c.situation, 2000, true));
      e.vaisseau = { nom: c.nom.trim(), immatriculation: c.immatriculation.trim() }; e.situation = c.situation.trim(); break;
    case 'preparer-cible': {
      exiger(mj && champs(c, ['cibleId', 'poste', 'libelle', 'description', 'rapportPrepare', 'visible', 'etat']) && id(c.cibleId) && poste(c.poste)
        && texte(c.libelle, 100) && texte(c.description, 2000, true) && texte(c.rapportPrepare, 4000, true) && typeof c.visible === 'boolean' && POSTES[c.poste].etats.includes(c.etat));
      let cible = e.cibles.find(v => v.id === c.cibleId); exiger(!cible || cible.poste === c.poste, 'Le poste d’une cible existante ne peut pas être modifié.');
      if (!cible) { capacite(e.cibles, 64); cible = { id: c.cibleId }; e.cibles.push(cible); }
      Object.assign(cible, { poste: c.poste, libelle: c.libelle.trim(), description: c.description.trim(), rapportPrepare: c.rapportPrepare.trim(), visible: c.visible, etat: c.etat }); break;
    }
    case 'supprimer-cible': {
      exiger(mj && champs(c, ['cibleId']) && e.cibles.some(v => v.id === c.cibleId));
      for (const d of e.demandes.filter(d => d.cibleId === c.cibleId && EN_ATTENTE.includes(d.statut))) {
        d.statut = 'annulee'; d.resolutionAt = at; const o = e.officiers.find(p => p.id === d.personnageId); if (o.scan?.id === d.id) o.scan = null;
      }
      e.cibles = e.cibles.filter(v => v.id !== c.cibleId); break;
    }
    case 'demander-intervention': {
      exiger(champs(c, ['poste', 'cibleId', 'action', 'question', 'affectation']) && poste(c.poste) && Object.hasOwn(POSTES[c.poste].actions, c.action) && texte(c.question, 1000, true)); droit(c.poste);
      const cible = e.cibles.find(v => v.id === c.cibleId && v.poste === c.poste && v.visible); exiger(cible, 'Cible indisponible.');
      if (c.poste === 'communications' && c.action === 'transmettre') exiger(texte(c.question, 1000), 'Écris le message à transmettre.');
      exiger(!e.demandes.some(d => d.personnageId === p.id && d.cibleId === cible.id && d.action === c.action && EN_ATTENTE.includes(d.statut)), 'Cette intervention attend déjà le MJ.');
      capacite(e.demandes, 256); capacite(e.demandes.filter(d => EN_ATTENTE.includes(d.statut)), 32);
      const demandeId = numero('demande'); e.demandes.push({ id: demandeId, personnageId: p.id, affectation: p.affectation, poste: c.poste, cibleId: cible.id, cibleLibelle: cible.libelle,
        action: c.action, question: c.question.trim(), statut: 'attente', at, rapport: '', resolutionAt: null, partageAutorise: false, media: null });
      p.scan = { id: demandeId, at, duree: 2600, poste: c.poste }; e.effetsActifs = true; break;
    }
    case 'qualifier-demande': {
      exiger(mj && champs(c, ['demandeId', 'statut']) && EN_ATTENTE.includes(c.statut)); const d = e.demandes.find(d => d.id === c.demandeId && EN_ATTENTE.includes(d.statut)); exiger(d, 'Demande non disponible.'); d.statut = c.statut; break;
    }
    case 'resoudre-demande': {
      exiger(mj && champs(c, ['demandeId', 'texte', 'partageAutorise', 'acceptee', 'media', 'nouvelEtat']) && texte(c.texte, 4000) && typeof c.partageAutorise === 'boolean' && typeof c.acceptee === 'boolean'); validerMedia(c.media);
      const d = e.demandes.find(d => d.id === c.demandeId && EN_ATTENTE.includes(d.statut)); exiger(d, 'Demande absente ou déjà traitée.');
      exiger(c.nouvelEtat === null || c.acceptee && POSTES[d.poste].etats.includes(c.nouvelEtat), 'État résultant invalide.');
      Object.assign(d, { statut: c.acceptee ? 'traitee' : 'refusee', rapport: c.texte.trim(), resolutionAt: at, partageAutorise: c.acceptee && c.partageAutorise, media: c.media });
      if (c.nouvelEtat !== null) e.cibles.find(v => v.id === d.cibleId).etat = c.nouvelEtat;
      const auteur = e.officiers.find(p => p.id === d.personnageId); if (auteur.scan?.id === d.id) auteur.scan = null; break;
    }
    case 'annuler-demande': {
      exiger(champs(c, ['demandeId', 'affectation'])); const d = e.demandes.find(d => d.id === c.demandeId && d.personnageId === p?.id && EN_ATTENTE.includes(d.statut)); exiger(d, 'Demande non disponible.'); droit(d.poste);
      d.statut = 'annulee'; d.resolutionAt = at; if (p.scan?.id === d.id) p.scan = null; break;
    }
    case 'partager-rapport': {
      exiger(champs(c, ['demandeId', 'affectation'])); const d = e.demandes.find(d => d.id === c.demandeId && d.personnageId === p?.id && d.statut === 'traitee' && d.partageAutorise); exiger(d, 'Rapport non partageable.'); droit(d.poste);
      exiger(!e.publications.some(r => r.sourceId === d.id), 'Rapport déjà partagé.'); capacite(e.publications, 256);
      e.publications.push({ id: numero('publication'), titre: d.cibleLibelle, texte: d.rapport, destinataires: ['equipage'], sourceId: d.id, auteur: p.nom, at, media: d.media }); break;
    }
    case 'publier-rapport':
      exiger(mj && champs(c, ['titre', 'texte', 'destinataires', 'media']) && texte(c.titre, 100) && texte(c.texte, 4000) && destinations(c.destinataires)); validerMedia(c.media); capacite(e.publications, 256);
      e.publications.push({ id: numero('publication'), titre: c.titre.trim(), texte: c.texte.trim(), destinataires: c.destinataires, sourceId: null, auteur: 'Contrôle de mission', at, media: c.media }); break;
    case 'retirer-publication': {
      exiger(mj && champs(c, ['publicationId'])); const rapport = e.publications.find(r => r.id === c.publicationId); exiger(rapport, 'Rapport absent.');
      const source = e.demandes.find(d => d.id === rapport.sourceId); if (source) source.partageAutorise = false;
      e.publications = e.publications.filter(r => r.id !== c.publicationId); break;
    }
    case 'donner-ordre':
      exiger(champs(c, ['texte', 'destinataires', 'affectation']) && texte(c.texte, 1000) && destinations(c.destinataires)); droit('commandement'); capacite(e.ordres, 128);
      e.ordres.push({ id: numero('ordre'), auteurId: p.id, auteur: p.nom, destinataires: c.destinataires, texte: c.texte.trim(), at, accuses: [] }); break;
    case 'accuser-ordre': {
      exiger(!mj && p && champs(c, ['ordreId', 'affectation']) && c.affectation === p.affectation);
      const o = e.ordres.find(o => o.id === c.ordreId && visiblePour(p, o.destinataires)); exiger(o, 'Ordre non disponible.'); exiger(!o.accuses.some(a => a.personnageId === p.id), 'Ordre déjà lu.');
      o.accuses.push({ personnageId: p.id, nom: p.nom, at }); break;
    }
    case 'changer-alerte':
      exiger(mj && champs(c, ['niveau', 'texte', 'secondes']) && NIVEAUX.includes(c.niveau) && texte(c.texte, 1000, true) && (c.secondes === null || entier(c.secondes) && c.secondes >= 1 && c.secondes <= 3600));
      e.alerte = { niveau: c.niveau, texte: c.texte.trim(), fin: c.secondes === null ? null : at + c.secondes * 1000, sequence: e.alerte.sequence + 1 }; e.effetsActifs = true; break;
    case 'choisir-diffusion':
      exiger((mj || p) && champs(c, ['actif']) && typeof c.actif === 'boolean' && id(contexte.appareilId));
      if (c.actif) e.diffusionSonore = contexte.appareilId; else if (e.diffusionSonore === contexte.appareilId) e.diffusionSonore = null; break;
    case 'couper-effets': exiger(mj && champs(c, [])); couper(); break;
    case 'enregistrer-prereglage': {
      exiger(mj && champs(c, ['prereglageId', 'nom']) && id(c.prereglageId) && texte(c.nom, 80)); let preset = e.prereglages.find(p => p.id === c.prereglageId);
      if (!preset) { capacite(e.prereglages, 24); preset = { id: c.prereglageId }; e.prereglages.push(preset); }
      Object.assign(preset, { nom: c.nom.trim(), situation: e.situation, niveau: e.alerte.niveau, texte: e.alerte.texte, cibles: e.cibles.map(v => ({ id: v.id, poste: v.poste, etat: v.etat, visible: v.visible })) }); break;
    }
    case 'charger-prereglage': {
      exiger(mj && champs(c, ['prereglageId'])); const preset = e.prereglages.find(p => p.id === c.prereglageId); exiger(preset, 'Préréglage absent.');
      couper(); e.situation = preset.situation; e.alerte = { niveau: preset.niveau, texte: preset.texte, fin: null, sequence: e.alerte.sequence + 1 };
      for (const v of preset.cibles) { const cible = e.cibles.find(c => c.id === v.id && c.poste === v.poste); if (cible) Object.assign(cible, { etat: v.etat, visible: v.visible }); } break;
    }
    case 'supprimer-prereglage': exiger(mj && champs(c, ['prereglageId']) && e.prereglages.some(p => p.id === c.prereglageId)); e.prereglages = e.prereglages.filter(p => p.id !== c.prereglageId); break;
    case 'archiver-demandes': exiger(mj && champs(c, [])); e.demandes = e.demandes.filter(d => EN_ATTENTE.includes(d.statut)); break;
    default: throw new Error('Commande inconnue ou interdite.');
  }
  e.revision++; validerEtat(e); return e;
}
export function vuePour(etat, lecteur) {
  validerEtat(etat);
  if (lecteur?.role === 'mj') return { ...copier(etat), role: 'mj', diffusionAutorisee: etat.diffusionSonore === lecteur.appareilId };
  exiger(lecteur?.role === 'joueur' && id(lecteur.personnageId), 'Lecteur invalide.'); const p = etat.officiers.find(p => p.id === lecteur.personnageId); exiger(p, 'Officier non préparé.');
  return copier({ role: 'joueur', revision: etat.revision, vaisseau: etat.vaisseau, situation: etat.situation, alerte: etat.alerte,
    effetsActifs: etat.effetsActifs, diffusionAutorisee: etat.diffusionSonore === lecteur.appareilId, officier: p,
    cibles: etat.cibles.filter(c => p.postes.includes(c.poste) && c.visible).map(({ id, poste, libelle, description, etat }) => ({ id, poste, libelle, description, etat })),
    demandes: etat.demandes.filter(d => d.personnageId === p.id && p.postes.includes(d.poste)), publications: etat.publications.filter(r => visiblePour(p, r.destinataires)),
    ordres: etat.ordres.filter(o => visiblePour(p, o.destinataires) || p.postes.includes('commandement') && o.auteurId === p.id) });
}
