/** Livre français p. 83, 85–86 et 134 : plan privé et batterie du M314. */
const exiger = (ok, message = 'Plan discret invalide.') => { if (!ok) throw new Error(message); };
const objet = v => v && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const texte = (v, max = 80) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const id = v => typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(v) && !Object.hasOwn(Object.prototype, v) && v !== 'prototype';
const entier = (v, max) => Number.isSafeInteger(v) && v >= 0 && v <= max;
function forme(v, cles) { exiger(objet(v) && Object.keys(v).length === cles.length && cles.every(k => Object.hasOwn(v, k))); }
export function creerDiscret() {
  return { actif: false, tour: 1, terrain: 'interieur', energie: 5, zones: [], pions: [], porteurId: '', dernierScan: null };
}
export function validerDiscret(d) {
  forme(d, ['actif','tour','terrain','energie','zones','pions','porteurId','dernierScan']);
  exiger(typeof d.actif === 'boolean' && entier(d.tour, 1000000) && d.tour > 0 && ['interieur','exterieur'].includes(d.terrain) && entier(d.energie, 1000));
  exiger(Array.isArray(d.zones) && d.zones.length <= 80 && Array.isArray(d.pions) && d.pions.length <= 80);
  const zones = new Set(d.zones.map(z => z.id)), pions = new Set(d.pions.map(p => p.id));
  exiger(zones.size === d.zones.length && pions.size === d.pions.length && (d.porteurId === '' || pions.has(d.porteurId)));
  for (const z of d.zones) {
    forme(z, ['id','nom','x','y','liens']);
    exiger(id(z.id) && texte(z.nom) && ['x','y'].every(k => Number.isFinite(z[k]) && Math.abs(z[k]) <= 10000)
      && Array.isArray(z.liens) && z.liens.length <= 79 && new Set(z.liens).size === z.liens.length && z.liens.every(l => l !== z.id && zones.has(l)));
    exiger(z.liens.every(l => d.zones.find(autre => autre.id === l).liens.includes(z.id)));
  }
  for (const p of d.pions) {
    forme(p, ['id','nom','zoneId','humain','limite','depense','mobile','detectable']);
    exiger(id(p.id) && texte(p.nom) && zones.has(p.zoneId) && typeof p.humain === 'boolean'
      && entier(p.limite, 20) && p.limite > 0 && (!p.humain || p.limite === 2) && entier(p.depense, p.limite)
      && typeof p.mobile === 'boolean' && typeof p.detectable === 'boolean');
  }
  if (d.dernierScan !== null) {
    const s = d.dernierScan;
    forme(s, ['tour','avant','apres','des','echos']);
    exiger(entier(s.tour, d.tour) && s.tour > 0 && entier(s.avant, 1000) && s.avant > 0 && entier(s.apres, s.avant)
      && Array.isArray(s.des) && s.des.length === Math.min(6, s.avant) && s.des.every(v => entier(v,6) && v > 0)
      && s.apres === s.avant - s.des.filter(v => v === 1).length && Array.isArray(s.echos) && s.echos.length <= 80);
    for (const e of s.echos) {
      forme(e, ['zone','nombre','x','y']);
      exiger(texte(e.zone) && entier(e.nombre,80) && e.nombre > 0 && Number.isFinite(e.x) && Number.isFinite(e.y) && Math.hypot(e.x,e.y) <= 1.001);
    }
  }
}
function distanceEnZones(d, depart, arrivee) {
  let front = [depart]; const vus = new Set(front);
  for (let n = 0; front.length; n++) {
    if (front.includes(arrivee)) return n;
    front = front.flatMap(z => d.zones.find(a => a.id === z).liens).filter(z => { if (vus.has(z)) return false; vus.add(z); return true; });
  }
  return Infinity;
}
export function commanderDiscret(discret, commande) {
  validerDiscret(discret);
  const d = structuredClone(discret), c = commande.charge;
  if (commande.id === 'mode-discret') {
    forme(c,['actif']); exiger(typeof c.actif === 'boolean'); d.actif = c.actif;
  } else if (commande.id === 'regler-discret') {
    forme(c,['terrain','energie','porteurId']);
    exiger(['interieur','exterieur'].includes(c.terrain) && entier(c.energie,1000) && d.pions.some(p => p.id === c.porteurId));
    Object.assign(d,c);
  } else if (commande.id === 'zone-discrete') {
    forme(c,['id','nom','x','y','liens']);
    exiger(id(c.id) && texte(c.nom) && ['x','y'].every(k => Number.isFinite(c[k]) && Math.abs(c[k]) <= 10000)
      && Array.isArray(c.liens) && new Set(c.liens).size === c.liens.length && c.liens.every(l => l !== c.id && d.zones.some(z => z.id === l)));
    const index = d.zones.findIndex(z => z.id === c.id);
    if (index < 0) { exiger(d.zones.length < 80); d.zones.push(structuredClone(c)); } else d.zones[index] = structuredClone(c);
    for (const z of d.zones) if (z.id !== c.id) { z.liens = z.liens.filter(l => l !== c.id); if (c.liens.includes(z.id)) z.liens.push(c.id); }
  } else if (commande.id === 'pion-discret') {
    forme(c,['id','nom','zoneId','humain','limite','mobile','detectable']);
    const ancien = d.pions.find(p => p.id === c.id);
    // La préparation ne déplace pas un pion déjà suivi et ne rembourse pas ses pas.
    exiger(!ancien || ancien.zoneId === c.zoneId, 'Utilise Déplacer pour changer la zone d’un pion existant.');
    const pion = { ...c, depense: ancien?.depense ?? 0 };
    if (ancien) Object.assign(ancien,pion); else { exiger(d.pions.length < 80); d.pions.push(pion); }
  } else if (commande.id === 'deplacer-discret') {
    forme(c,['pionId','zoneId','tour']); exiger(d.actif && c.tour === d.tour, 'Le Tour a changé.');
    const p = d.pions.find(p => p.id === c.pionId), zone = d.zones.find(z => z.id === p?.zoneId);
    exiger(p && zone.liens.includes(c.zoneId) && p.depense < p.limite, 'Déplacement impossible : zone non reliée ou budget du Tour épuisé.');
    p.zoneId = c.zoneId; p.depense++; p.mobile = true;
  } else if (commande.id === 'examiner-discret') {
    forme(c,['pionId','tour']); exiger(d.actif && c.tour === d.tour);
    const p = d.pions.find(p => p.id === c.pionId);
    exiger(p && p.depense === 0, 'Examiner exige un Tour entier sans déplacement.'); p.depense = p.limite;
  } else if (commande.id === 'tour-discret') {
    forme(c,['tour']); exiger(d.actif && c.tour === d.tour && d.tour < 1000000, 'Le Tour a déjà été avancé.');
    d.tour++; for (const p of d.pions) { p.depense = 0; p.mobile = false; }
  } else if (commande.id === 'scanner-discret') {
    forme(c,['tour']); exiger(d.actif && c.tour === d.tour && d.dernierScan?.tour !== d.tour, 'Un seul scan par Tour.');
    const porteur = d.pions.find(p => p.id === d.porteurId), origine = d.zones.find(z => z.id === porteur?.zoneId);
    exiger(origine && d.energie > 0, 'Choisis le porteur et une batterie chargée.');
    const portee = d.terrain === 'interieur' ? 100 : 1000, echos = [];
    for (const z of d.zones) {
      const nombre = d.pions.filter(p => p.id !== porteur.id && p.zoneId === z.id && p.mobile && p.detectable).length;
      if (!nombre || Math.hypot(z.x-origine.x,z.y-origine.y) > portee || (d.terrain === 'interieur' && distanceEnZones(d,origine.id,z.id) > 4)) continue;
      echos.push({ zone:z.nom, nombre, x:(z.x-origine.x)/portee, y:(z.y-origine.y)/portee });
    }
    const avant=d.energie, des=Array.from({length:Math.min(6,avant)},()=>1+Math.floor(Math.random()*6));
    d.energie -= des.filter(v=>v===1).length;
    d.dernierScan={tour:d.tour,avant,apres:d.energie,des,echos};
  } else throw new Error('Commande de mode discret inconnue.');
  validerDiscret(d); return d;
}
/** Le plan, les identités et les pions immobiles ne quittent jamais le poste MJ. */
export function lectureDiscrete(d) {
  return { tour:d.tour, energie:d.energie, scanneTour:d.dernierScan?.tour ?? null,
    echos:structuredClone(d.dernierScan?.tour === d.tour ? d.dernierScan.echos : []) };
}
