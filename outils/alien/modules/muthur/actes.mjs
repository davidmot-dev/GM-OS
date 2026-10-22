/** Préparations de Maman : isolées du cœur et absentes de toute vue joueur. */
const exiger = (v, message = 'Préparation d’acte invalide.') => { if (!v) throw new Error(message); };
const objet = v => v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const texte = (v,max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const identite = v => typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(v) && !Object.hasOwn(Object.prototype,v) && v !== 'prototype';
function forme(v,cles) { exiger(objet(v) && Object.keys(v).length === cles.length && cles.every(k => Object.hasOwn(v,k))); }
export function validerActes(actes) {
  exiger(Array.isArray(actes) && actes.length <= 128);
  const periodes = new Set(), dossiers = new Set();
  for (const a of actes) {
    forme(a,['scenario','acte','dossiers','objectifs']);
    const cle = JSON.stringify([a.scenario,a.acte]);
    exiger(texte(a.scenario,100) && [1,2,3].includes(a.acte) && !periodes.has(cle)); periodes.add(cle);
    exiger(Array.isArray(a.dossiers) && a.dossiers.length <= 32 && Array.isArray(a.objectifs) && a.objectifs.length <= 256);
    const personnages = new Set();
    for (const d of a.dossiers) {
      forme(d,['id','titre','contenu','acces','code','publie']);
      exiger(identite(d.id) && !dossiers.has(d.id) && texte(d.titre,80) && texte(d.contenu,10000)
        && ['equipage','code','administrateur'].includes(d.acces) && typeof d.code === 'string' && d.code.length <= 120
        && (d.acces !== 'code' || d.code.trim().length > 0) && typeof d.publie === 'boolean'); dossiers.add(d.id);
    }
    for (const o of a.objectifs) {
      forme(o,['personnageId','texte','remis']);
      exiger(identite(o.personnageId) && !personnages.has(o.personnageId) && texte(o.texte,4000) && typeof o.remis === 'boolean'); personnages.add(o.personnageId);
    }
  }
}
export function preparerActe(actes, commande, joueurs, publier, remettre) {
  validerActes(actes);
  const suivant=structuredClone(actes), c=commande.charge;
  const cles = { 'dossier-acte':['scenario','acte','dossierId','titre','contenu','acces','code'],
    'objectif-acte':['scenario','acte','personnageId','texte'], 'publier-dossier-acte':['scenario','acte','dossierId'],
    'remettre-objectif-acte':['scenario','acte','personnageId'] };
  exiger(cles[commande.id]); forme(c,cles[commande.id]);
  exiger(texte(c.scenario,100) && [1,2,3].includes(c.acte));
  let periode=suivant.find(a=>a.scenario===c.scenario && a.acte===c.acte);
  if (!periode) { exiger(['dossier-acte','objectif-acte'].includes(commande.id) && suivant.length < 128); periode={scenario:c.scenario,acte:c.acte,dossiers:[],objectifs:[]}; suivant.push(periode); }
  if (commande.id === 'dossier-acte') {
    const ancien=periode.dossiers.find(d=>d.id===c.dossierId);
    exiger(!ancien?.publie, 'Ce dossier est déjà publié ; modifie-le dans Dossiers.');
    const d={id:c.dossierId,titre:c.titre,contenu:c.contenu,acces:c.acces,code:c.code,publie:false};
    if (ancien) Object.assign(ancien,d); else periode.dossiers.push(d);
  } else if (commande.id === 'objectif-acte') {
    exiger(Object.hasOwn(joueurs,c.personnageId), 'Prépare cet opérateur depuis les accès du module.');
    const ancien=periode.objectifs.find(o=>o.personnageId===c.personnageId);
    exiger(!ancien?.remis,'Cet objectif a déjà été remis.');
    const o={personnageId:c.personnageId,texte:c.texte,remis:false};
    if (ancien) Object.assign(ancien,o); else periode.objectifs.push(o);
  } else if (commande.id === 'publier-dossier-acte') {
    const d=periode.dossiers.find(d=>d.id===c.dossierId);
    exiger(d && !d.publie,'Ce dossier a déjà été publié.'); publier(d); d.publie=true;
  } else {
    const o=periode.objectifs.find(o=>o.personnageId===c.personnageId);
    exiger(o && !o.remis && Object.hasOwn(joueurs,c.personnageId),'Cet objectif est déjà remis ou son opérateur est absent.');
    remettre(o,periode); o.remis=true;
  }
  validerActes(suivant); return suivant;
}
