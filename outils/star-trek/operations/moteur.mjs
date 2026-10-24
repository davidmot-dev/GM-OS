/**
 * **Opérations de Star Trek Adventures** (deuxième édition) — 23/10/2026, Claude
 * Code, à la demande de David (« on va faire toute les améliorations de Star
 * Trek »). Livre de Base français ; pages imprimées.
 *
 * Ce que la table partage : les vaisseaux (le sien et ceux d'en face) et la
 * bataille spatiale (p. 178–191, 294–313), les tâches étendues, les conséquences
 * étendues et les défis (p. 268–273, 329–333). Les jets eux-mêmes se lancent au
 * panneau de jet, sur la fiche du personnage : ce module applique ce qu'ils
 * produisent — les dégâts aux Boucliers et les brèches, l'impact sur une jauge
 * d'effort — et le garde pour toute la table.
 *
 * Les dés du module (système touché, secousse, noyau de distorsion) se lancent
 * au poste du meneur ; un essai peut les fixer (`charge.des`).
 */

const copier = v => JSON.parse(JSON.stringify(v));
const exiger = (condition, message = 'Données des opérations invalides.') => { if (!condition) throw new Error(message); };
const objet = v => v !== null && typeof v === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const entier = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;
const texte = (v, max = 80) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const ident = v => typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(v);
const d20 = () => 1 + Math.floor(Math.random() * 20);

function forme(valeur, requis, facultatifs = []) {
  exiger(objet(valeur) && requis.every(c => Object.hasOwn(valeur, c)) && Object.keys(valeur).every(c => requis.includes(c) || facultatifs.includes(c)));
}

export const SYSTEMES = ['communications', 'ordinateurs', 'moteurs', 'detecteurs', 'structure', 'armement'];
export const LIBELLES_DES_SYSTEMES = { communications: 'Communications', ordinateurs: 'Ordinateurs', moteurs: 'Moteurs', detecteurs: 'Détecteurs', structure: 'Structure', armement: 'Armement' };
export const FONCTIONS = ['commandement', 'navigation', 'ingenierie', 'securite', 'medecine', 'science'];
export const LIBELLES_DES_FONCTIONS = { commandement: 'Commandement', navigation: 'Navigation', ingenierie: 'Ingénierie', securite: 'Sécurité', medecine: 'Médecine', science: 'Science' };
const CAMPS = ['joueurs', 'adverse'];
const TYPES_D_ARME = ['energie', 'torpille'];
const PORTEES = ['courte', 'moyenne', 'longue'];
export const QUALITES = ['Brouilleur', 'Calibrage', 'Destructeur', 'Dispersion', 'Drainant', 'Encombrant', 'Perforant', 'Persistant', 'Polyvalent', 'Puissant', 'Ralentissant', 'Rendement élevé', 'Sapeur', 'Zone d’effet'];

/** La qualité d'équipage d'un vaisseau non-joueur : l'attribut et la fonction de ses tâches (p. 296). */
export const QUALITES_D_EQUIPAGE = {
  moyen: { label: 'Moyen', attribut: 8, fonction: 1 },
  competent: { label: 'Compétent', attribut: 9, fonction: 2 },
  talentueux: { label: 'Talentueux', attribut: 10, fonction: 3 },
  exceptionnel: { label: 'Exceptionnel', attribut: 11, fonction: 4 },
};

// ——— Les valeurs dérivées (p. 185, 226) ———

/** Structure et Résistance : 6 ou moins +0, 7–8 +1, 9–10 +2, 11–12 +3, 13+ +4 (p. 185) ; même échelle pour l'Armement et les dégâts (p. 226). */
export const bonusDeLEchelle = valeur => valeur <= 6 ? 0 : valeur <= 8 ? 1 : valeur <= 10 ? 2 : valeur <= 12 ? 3 : 4;
/** La Résistance : la moitié de l'Envergure arrondie au supérieur, plus le bonus de Structure (p. 185). */
export const resistanceDe = v => Math.ceil(v.envergure / 2) + bonusDeLEchelle(v.systemes.structure) + v.bonusResistance;
/** Les Boucliers : Structure + Envergure + Sécurité, et leurs modificateurs (p. 185, 306) ; à zéro quand ils sont abaissés. */
export const bouclierMaxDe = v => v.bouclierLeves ? Math.max(0, v.systemes.structure + v.envergure + v.fonctions.securite + v.bonusBoucliers) : 0;
/** Les dégâts d'une arme : sa valeur de base plus le bonus d'Armement (p. 226). */
export const degatsDeLArme = (v, a) => a.degats + bonusDeLEchelle(v.systemes.armement);
/** Les brèches d'un système, intensités comprises. */
export const brechesDu = (v, systeme) => v.breches.filter(b => b.systeme === systeme).reduce((s, b) => s + b.intensite, 0);
export const brechesTotales = v => v.breches.reduce((s, b) => s + b.intensite, 0);
/** Un système est détruit quand ses brèches atteignent la moitié de l'Envergure : les tâches qu'il aide échouent (p. 311). */
export const systemeDetruit = (v, systeme) => brechesDu(v, systeme) >= v.envergure / 2;
/** Dégâts critiques : plus de brèches que l'Envergure ; la suivante détruit le vaisseau (p. 311). */
export const degatsCritiques = v => brechesTotales(v) > v.envergure;

/** La Table aléatoire des systèmes touchés (p. 307). */
export function systemeTouche(de) {
  return de <= 1 ? 'communications' : de === 2 ? 'ordinateurs' : de <= 6 ? 'moteurs' : de <= 9 ? 'detecteurs' : de <= 17 ? 'structure' : 'armement';
}
/** Secoué : conséquences de dégâts mineurs (p. 308). Les PNJ choisissent toujours la position de sécurité. */
export const SECOUSSES = {
  securite: 'Position de sécurité ! Au prochain tour, ni le vaisseau ni personne à bord ne fait d’action majeure.',
  energie: 'Fuite d’énergie ! Les réserves d’énergie sont inutilisables ; récupérer de l’énergie : difficulté +1 la prochaine fois.',
  victimes: 'Victimes et dégâts mineurs : le vaisseau subit une complication.',
};
export function secousseDuDe(de) { return de <= 6 ? 'securite' : de <= 12 ? 'energie' : de <= 18 ? 'victimes' : null; }

// ——— Validation ———

function validerArme(a) {
  forme(a, ['id', 'nom', 'type', 'degats', 'portee', 'qualites']);
  exiger(ident(a.id) && texte(a.nom) && TYPES_D_ARME.includes(a.type) && entier(a.degats, 0, 40) && PORTEES.includes(a.portee)
    && Array.isArray(a.qualites) && a.qualites.length <= 8 && a.qualites.every(q => texte(q, 40)));
}
function validerVaisseau(v) {
  forme(v, ['id', 'nom', 'camp', 'envergure', 'systemes', 'fonctions', 'bonusResistance', 'bonusBoucliers', 'qualiteEquipage',
    'boucliers', 'bouclierLeves', 'armementEngage', 'energie', 'secoue', 'armes', 'breches', 'detruit', 'noyau']);
  exiger(ident(v.id) && texte(v.nom) && CAMPS.includes(v.camp) && entier(v.envergure, 1, 20)
    && entier(v.bonusResistance, -5, 10) && entier(v.bonusBoucliers, -20, 40) && entier(v.boucliers, 0, 999)
    && ['bouclierLeves', 'armementEngage', 'energie', 'detruit'].every(c => typeof v[c] === 'boolean')
    && (v.qualiteEquipage === null || Object.hasOwn(QUALITES_D_EQUIPAGE, v.qualiteEquipage))
    && (v.secoue === null || Object.hasOwn(SECOUSSES, v.secoue))
    && [null, 'instable', 'stabilise', 'ejecte'].includes(v.noyau));
  forme(v.systemes, SYSTEMES); exiger(SYSTEMES.every(s => entier(v.systemes[s], 0, 20)));
  forme(v.fonctions, FONCTIONS); exiger(FONCTIONS.every(f => entier(v.fonctions[f], 0, 5)));
  exiger(Array.isArray(v.armes) && v.armes.length <= 12); v.armes.forEach(validerArme);
  exiger(Array.isArray(v.breches) && v.breches.length <= 64);
  for (const b of v.breches) { forme(b, ['id', 'systeme', 'intensite', 'colmatee']); exiger(ident(b.id) && SYSTEMES.includes(b.systeme) && entier(b.intensite, 1, 9) && typeof b.colmatee === 'boolean'); }
}
function validerTache(t) {
  forme(t, ['id', 'nom', 'genre', 'jauge', 'coches', 'difficulte', 'obstacle', 'impact', 'avancees', 'visible']);
  exiger(ident(t.id) && texte(t.nom) && ['etendue', 'consequence'].includes(t.genre) && entier(t.jauge, 1, 99) && entier(t.coches, 0, t.jauge)
    && entier(t.difficulte, 0, 9) && entier(t.obstacle, 0, 9) && entier(t.impact, 0, 9) && typeof t.visible === 'boolean'
    && Array.isArray(t.avancees) && t.avancees.length <= 8 && t.avancees.every(a => entier(a, 1, t.jauge)));
}
function validerDefi(d) {
  forme(d, ['id', 'nom', 'taches', 'intervalles', 'visible']);
  exiger(ident(d.id) && texte(d.nom) && typeof d.visible === 'boolean' && Array.isArray(d.taches) && d.taches.length <= 16);
  for (const t of d.taches) { forme(t, ['id', 'nom', 'faite']); exiger(ident(t.id) && texte(t.nom) && typeof t.faite === 'boolean'); }
  exiger(d.intervalles === null || (objet(d.intervalles) && entier(d.intervalles.total, 1, 99) && entier(d.intervalles.restants, 0, 99)));
}
export function validerEtat(etat) {
  forme(etat, ['version', 'system', 'revision', 'vaisseaux', 'taches', 'defis', 'journal']);
  exiger(etat.version === 1 && etat.system === 'star-trek' && entier(etat.revision, 0, Number.MAX_SAFE_INTEGER));
  exiger(Array.isArray(etat.vaisseaux) && etat.vaisseaux.length <= 24); etat.vaisseaux.forEach(validerVaisseau);
  exiger(new Set(etat.vaisseaux.map(v => v.id)).size === etat.vaisseaux.length);
  exiger(Array.isArray(etat.taches) && etat.taches.length <= 24); etat.taches.forEach(validerTache);
  exiger(Array.isArray(etat.defis) && etat.defis.length <= 16); etat.defis.forEach(validerDefi);
  exiger(Array.isArray(etat.journal) && etat.journal.length <= 200 && etat.journal.every(l => typeof l === 'string' && l.length <= 400));
}

export function creerEtat() {
  return { version: 1, system: 'star-trek', revision: 0, vaisseaux: [], taches: [], defis: [], journal: [] };
}
export function migrerEtat(donnees, versionDonnees) {
  if (versionDonnees !== 1) throw new Error('Version des opérations non prise en charge.');
  validerEtat(donnees);
  return copier(donnees);
}
/** Rien ne sonne ni ne clignote : il n'y a pas d'effet à arrêter. */
export function arreterEffets(etat) { validerEtat(etat); return copier(etat); }

// ——— La bataille spatiale ———

const noter = (etat, ligne) => { etat.journal.push(ligne.slice(0, 400)); if (etat.journal.length > 200) etat.journal.splice(0, etat.journal.length - 200); };
const vaisseauDe = (etat, id) => { const v = etat.vaisseaux.find(x => x.id === id); exiger(v, 'Vaisseau introuvable.'); return v; };
let suivant = 0;
const nouvelId = prefixe => `${prefixe}-${Date.now().toString(36)}-${(suivant++).toString(36)}`;

/** Une brèche de plus sur un système ; la suivante, au-delà des dégâts critiques, détruit le vaisseau (p. 311). */
function ajouterUneBreche(v, systeme, lignes) {
  if (degatsCritiques(v)) { v.detruit = true; lignes.push(`${v.nom} est détruit.`); return; }
  v.breches.push({ id: nouvelId('breche'), systeme, intensite: 1, colmatee: false });
  lignes.push(`Brèche : ${LIBELLES_DES_SYSTEMES[systeme]}${systemeDetruit(v, systeme) ? ' — système détruit, les tâches qu’il aide échouent' : ''}.`);
  if (degatsCritiques(v)) {
    lignes.push(`Dégâts critiques : ${v.nom} ne fonctionne plus ; une brèche de plus le détruit.`);
    if (systemeDetruit(v, 'moteurs') && !v.noyau) { v.noyau = 'instable'; lignes.push('Brèche imminente du noyau de distorsion ! Un d20 à la fin de chaque round contre l’Ingénierie du vaisseau.'); }
  }
}

/**
 * **Appliquer les dégâts d'une attaque réussie** (p. 309) : la Résistance retire
 * un point par point (Perforant l'ignore), chaque complication en retire un, jamais
 * sous 1 ; les Boucliers encaissent ; sous la moitié, secoué ; sous le quart, déjà
 * secoué par ce coup, une brèche ; à zéro, désactivés et une brèche. Déjà à zéro :
 * une brèche. — *Lecture retenue : les trois seuils se cumulent dans l'ordre du livre.*
 */
function appliquerLesDegats(etat, v, degats, options, des, lignes) {
  const resistance = options.perforant ? 0 : resistanceDe(v);
  const net = Math.max(1, degats - options.complications - resistance);
  const max = bouclierMaxDe(v);
  const systeme = options.systeme ?? systemeTouche(des.systeme());
  let breches = 0;
  if (v.boucliers <= 0 || max === 0) {
    breches = 1;
    lignes.push(`${v.nom} : ${net} dégât(s), Boucliers déjà à 0.`);
  } else {
    const avant = v.boucliers, apres = Math.max(0, avant - net);
    v.boucliers = apres;
    lignes.push(`${v.nom} : ${degats} dégâts${resistance ? ` − ${resistance} de Résistance` : options.perforant ? ' (Perforant)' : ''}${options.complications ? ` − ${options.complications} complication(s)` : ''} → ${net} ; Boucliers ${avant} → ${apres} / ${max}.`);
    let secoueParCeCoup = false;
    if (apres < max / 2 && !options.drainant) {
      secoueParCeCoup = true;
      const de = v.camp === 'adverse' ? 1 : (() => { let d; do d = des.secousse(); while (secousseDuDe(d) === null); return d; })();
      v.secoue = secousseDuDe(de);
      if (v.secoue === 'energie') v.energie = false;
      lignes.push(`Secoué — ${SECOUSSES[v.secoue]}`);
    }
    if (apres < max / 4 && secoueParCeCoup) breches++;
    if (apres === 0) { breches++; lignes.push('Boucliers désactivés.'); }
  }
  if (breches > 0 && options.rendementEleve) breches++;
  for (let i = 0; i < breches; i++) ajouterUneBreche(v, systeme, lignes);
  return { net, breches, systeme };
}

function attaquer(etat, c, des) {
  forme(c, ['cibleId', 'degats'], ['attaquantId', 'armeId', 'plus', 'complications', 'systeme', 'devastatrice', 'perforant', 'rendementEleve', 'drainant', 'des']);
  const v = vaisseauDe(etat, c.cibleId);
  exiger(!v.detruit, 'Ce vaisseau est déjà détruit.');
  exiger(entier(c.degats, 0, 60) && (c.plus === undefined || entier(c.plus, 0, 20)) && (c.complications === undefined || entier(c.complications, 0, 10))
    && (c.systeme === undefined || SYSTEMES.includes(c.systeme)));
  const attaquant = c.attaquantId ? vaisseauDe(etat, c.attaquantId) : null;
  const arme = attaquant && c.armeId ? attaquant.armes.find(a => a.id === c.armeId) : null;
  const qualites = new Set(arme?.qualites ?? []);
  const options = {
    complications: c.complications ?? 0, systeme: c.systeme,
    perforant: c.perforant ?? qualites.has('Perforant'), rendementEleve: c.rendementEleve ?? qualites.has('Rendement élevé'),
    drainant: c.drainant ?? qualites.has('Drainant'),
  };
  const degats = c.degats + (c.plus ?? 0);
  const lignes = [`${attaquant ? `${attaquant.nom}${arme ? ` (${arme.nom})` : ''}` : 'Une attaque'} →`];
  const premier = appliquerLesDegats(etat, v, degats, options, des, lignes);
  if (c.devastatrice && !v.detruit) {
    // L'attaque dévastatrice : un autre système, la moitié des dégâts arrondie au supérieur (p. 307).
    let autre; do autre = systemeTouche(des.systeme()); while (autre === premier.systeme);
    lignes.push('Attaque dévastatrice :');
    appliquerLesDegats(etat, v, Math.ceil(premier.net / 2) + (options.perforant ? 0 : resistanceDe(v)) + options.complications,
      { ...options, systeme: autre, rendementEleve: false }, des, lignes);
  }
  if (qualites.has('Sapeur') && v.energie) { v.energie = false; lignes.push('Sapeur : la cible perd ses réserves d’énergie.'); }
  noter(etat, lignes.join(' '));
}

const desDeLaCharge = c => {
  const fixes = Array.isArray(c?.des) ? [...c.des] : [];
  exiger(fixes.every(d => entier(d, 1, 20)) && fixes.length <= 20);
  const tirer = () => fixes.length ? fixes.shift() : d20();
  return { systeme: tirer, secousse: tirer, noyau: tirer };
};

// ——— Les tâches étendues et les défis ———

/**
 * **L'impact sur une tâche étendue** (p. 271) : la fonction utilisée (ou celle du
 * vaisseau qui aidait), moins l'obstacle, jamais sous 1 ; +1 par effort
 * supplémentaire (2 Impulsion), −1 par complication. Une conséquence étendue
 * reçoit sa valeur d'impact, +1 par point de Menace, trois au plus (p. 331).
 */
export function impactDe(t, c) {
  if (t.genre === 'consequence') return Math.max(0, t.impact + Math.min(3, c.menace ?? 0));
  const base = Math.max(1, (c.fonction ?? 0) - t.obstacle);
  return Math.max(0, base + (c.efforts ?? 0) + (c.bonus ?? 0) - (c.complications ?? 0));
}
/** Les avancées par défaut : à la moitié, puis à mi-chemin du reste, arrondies au supérieur (p. 272, 308). */
export const avanceesParDefaut = jauge => { const a = Math.ceil(jauge / 2); return [...new Set([a, a + Math.ceil((jauge - a) / 2)])].filter(x => x >= 1 && x <= jauge); };

// ——— Commandes ———

export function appliquerCommande(etat, commande, lecteur) {
  validerEtat(etat);
  exiger(lecteur?.role === 'mj', 'Commande réservée au meneur.');
  forme(commande, ['id', 'charge']);
  const c = commande.charge ?? {};
  const s = copier(etat);
  const des = desDeLaCharge(c);
  switch (commande.id) {
    case 'vaisseau': {
      forme(c, ['vaisseau']);
      const entree = c.vaisseau;
      const existant = s.vaisseaux.find(v => v.id === entree?.id);
      const v = { boucliers: 0, bouclierLeves: true, armementEngage: false, energie: true, secoue: null, breches: [], detruit: false, noyau: null,
        ...(existant ?? {}), ...entree };
      if (!existant) { validerVaisseau({ ...v, boucliers: 0 }); v.boucliers = bouclierMaxDe(v); }
      else v.boucliers = Math.min(v.boucliers, bouclierMaxDe(v));
      validerVaisseau(v);
      if (existant) s.vaisseaux[s.vaisseaux.indexOf(existant)] = v; else { exiger(s.vaisseaux.length < 24, 'Vingt-quatre vaisseaux au plus.'); s.vaisseaux.push(v); }
      break;
    }
    case 'supprimer-vaisseau': forme(c, ['vaisseauId']); s.vaisseaux = s.vaisseaux.filter(v => v.id !== c.vaisseauId); break;
    case 'etat-vaisseau': {
      forme(c, ['vaisseauId'], ['bouclierLeves', 'armementEngage', 'energie', 'boucliers', 'secoue', 'noyau', 'detruit']);
      const v = vaisseauDe(s, c.vaisseauId);
      for (const k of ['bouclierLeves', 'armementEngage', 'energie', 'secoue', 'noyau', 'detruit']) if (Object.hasOwn(c, k)) v[k] = c[k];
      if (Object.hasOwn(c, 'boucliers')) { exiger(entier(c.boucliers, 0, 999)); v.boucliers = c.boucliers; }
      // Relevés, ils reprennent leur valeur de la scène ; abaissés, leur maximum vaut 0 (p. 305).
      v.boucliers = Math.min(v.boucliers, Math.max(0, v.systemes.structure + v.envergure + v.fonctions.securite + v.bonusBoucliers));
      validerVaisseau(v);
      break;
    }
    case 'attaque': attaquer(s, c, des); break;
    case 'recharger-boucliers': {
      // Recharger les Boucliers (p. 303) : réserves d'énergie, Ingénierie du personnage + 1, +2 par Impulsion.
      forme(c, ['vaisseauId', 'ingenierie'], ['impulsion', 'des']);
      const v = vaisseauDe(s, c.vaisseauId);
      exiger(v.energie, 'Plus de réserves d’énergie : récupérer de l’énergie d’abord.');
      exiger(entier(c.ingenierie, 0, 5) && (c.impulsion === undefined || entier(c.impulsion, 0, 10)));
      const avant = v.boucliers;
      v.boucliers = Math.min(bouclierMaxDe(v), v.boucliers + c.ingenierie + 1 + 2 * (c.impulsion ?? 0));
      v.energie = false;
      noter(s, `${v.nom} : Boucliers rechargés ${avant} → ${v.boucliers}.`);
      break;
    }
    case 'colmater': case 'reparer': {
      forme(c, ['vaisseauId', 'brecheId']);
      const v = vaisseauDe(s, c.vaisseauId);
      const b = v.breches.find(x => x.id === c.brecheId); exiger(b, 'Brèche introuvable.');
      if (commande.id === 'colmater') { b.colmatee = true; noter(s, `${v.nom} : brèche colmatée (${LIBELLES_DES_SYSTEMES[b.systeme]}) — ses pénalités s’annulent.`); }
      else { v.breches = v.breches.filter(x => x !== b); noter(s, `${v.nom} : brèche réparée (${LIBELLES_DES_SYSTEMES[b.systeme]}).`); }
      break;
    }
    case 'noyau': {
      // La fin d'un round, noyau instable : 1d20 supérieur à l'Ingénierie du vaisseau, il explose (p. 311).
      forme(c, ['vaisseauId'], ['des']);
      const v = vaisseauDe(s, c.vaisseauId);
      exiger(v.noyau === 'instable' || v.noyau === 'ejecte', 'Le noyau n’est pas instable.');
      const de = des.noyau();
      if (de > v.fonctions.ingenierie) {
        if (v.noyau === 'instable') v.detruit = true;
        v.noyau = null;
        noter(s, `${v.nom} : noyau ${de} contre ${v.fonctions.ingenierie} — il explose${v.detruit ? ', le vaisseau est détruit' : ' (éjecté)'} : ${v.envergure + 1} dégâts Perforants à portée courte.`);
      } else noter(s, `${v.nom} : noyau ${de} contre ${v.fonctions.ingenierie}, il tient encore ce round.`);
      break;
    }
    case 'nouvelle-scene': {
      // Les Boucliers reprennent leur maximum au début d'une scène, les réserves d'énergie sont pleines (p. 185, 308).
      forme(c, []);
      for (const v of s.vaisseaux) { v.boucliers = bouclierMaxDe(v); v.energie = true; v.secoue = null; }
      noter(s, 'Nouvelle scène : Boucliers au maximum, réserves d’énergie pleines.');
      break;
    }
    case 'tache': {
      forme(c, ['tache']);
      const t = { coches: 0, avancees: avanceesParDefaut(c.tache?.jauge ?? 1), visible: true, impact: 0, obstacle: 0, difficulte: 0, ...(s.taches.find(x => x.id === c.tache?.id) ?? {}), ...c.tache };
      validerTache(t);
      const i = s.taches.findIndex(x => x.id === t.id);
      if (i >= 0) s.taches[i] = t; else { exiger(s.taches.length < 24); s.taches.push(t); }
      break;
    }
    case 'supprimer-tache': forme(c, ['tacheId']); s.taches = s.taches.filter(t => t.id !== c.tacheId); break;
    case 'impact': {
      forme(c, ['tacheId'], ['fonction', 'efforts', 'complications', 'bonus', 'menace', 'nom']);
      const t = s.taches.find(x => x.id === c.tacheId); exiger(t, 'Tâche introuvable.');
      exiger(['fonction', 'efforts', 'complications', 'bonus', 'menace'].every(k => c[k] === undefined || entier(c[k], 0, 20)));
      const avant = t.coches, impact = impactDe(t, c);
      t.coches = Math.min(t.jauge, t.coches + impact);
      const franchies = t.avancees.filter(a => a > avant && a <= t.coches);
      noter(s, `${t.nom} : ${c.nom ? `${String(c.nom).slice(0, 40)}, ` : ''}impact ${impact}, ${t.coches} / ${t.jauge}${franchies.length ? ` — ${t.genre === 'consequence' ? 'revers' : 'avancée'} atteinte` : ''}${t.coches === t.jauge ? (t.genre === 'consequence' ? ' — la conséquence éclate.' : ' — résolue.') : '.'}`);
      break;
    }
    case 'defi': {
      forme(c, ['defi']);
      const d = { taches: [], intervalles: null, visible: true, ...(s.defis.find(x => x.id === c.defi?.id) ?? {}), ...c.defi };
      validerDefi(d);
      const i = s.defis.findIndex(x => x.id === d.id);
      if (i >= 0) s.defis[i] = d; else { exiger(s.defis.length < 16); s.defis.push(d); }
      break;
    }
    case 'supprimer-defi': forme(c, ['defiId']); s.defis = s.defis.filter(d => d.id !== c.defiId); break;
    case 'defi-tache': {
      forme(c, ['defiId', 'tacheId', 'faite']);
      const d = s.defis.find(x => x.id === c.defiId); exiger(d, 'Défi introuvable.');
      const t = d.taches.find(x => x.id === c.tacheId); exiger(t && typeof c.faite === 'boolean', 'Tâche clé introuvable.');
      t.faite = c.faite;
      if (d.taches.every(x => x.faite)) noter(s, `${d.nom} : toutes les tâches clés sont accomplies, le défi est remporté.`);
      break;
    }
    case 'intervalles': {
      // Une tâche prend 2 intervalles, 1 avec 2 Impulsion, +1 par complication (p. 269, 333).
      forme(c, ['defiId', 'consommes']);
      const d = s.defis.find(x => x.id === c.defiId); exiger(d?.intervalles, 'Ce défi n’est pas chronométré.');
      exiger(entier(c.consommes, -99, 99));
      d.intervalles.restants = Math.max(0, Math.min(d.intervalles.total, d.intervalles.restants - c.consommes));
      noter(s, `${d.nom} : ${c.consommes >= 0 ? `${c.consommes} intervalle(s) consommé(s)` : `${-c.consommes} intervalle(s) gagné(s)`}, ${d.intervalles.restants} restant(s)${d.intervalles.restants === 0 ? ' — le temps est écoulé.' : '.'}`);
      break;
    }
    case 'reinitialiser': forme(c, []); return { ...creerEtat(), revision: etat.revision + 1 };
    default: throw new Error('Commande des opérations inconnue.');
  }
  s.revision = etat.revision + 1;
  validerEtat(s);
  return s;
}

// ——— Les vues ———

/** Ce que voit chacun : le meneur tout ; l'équipage son vaisseau en entier, les autres de loin. */
export function vuePour(etat, lecteur) {
  validerEtat(etat);
  exiger(lecteur?.role === 'mj' || (lecteur?.role === 'joueur' && typeof lecteur.personnageId === 'string' && lecteur.personnageId.length > 0));
  const derive = v => ({ ...copier(v), resistance: resistanceDe(v), bouclierMax: bouclierMaxDe(v), critiques: degatsCritiques(v),
    detruits: SYSTEMES.filter(sys => systemeDetruit(v, sys)), degatsDesArmes: Object.fromEntries(v.armes.map(a => [a.id, degatsDeLArme(v, a)])) });
  if (lecteur.role === 'mj') return { ...copier(etat), vaisseaux: etat.vaisseaux.map(derive) };
  return {
    version: etat.version, system: etat.system, revision: etat.revision,
    vaisseaux: etat.vaisseaux.map(v => v.camp === 'joueurs' ? derive(v) : {
      id: v.id, nom: v.nom, camp: v.camp, envergure: v.envergure, detruit: v.detruit, secoue: v.secoue !== null,
      bouclierPourcent: bouclierMaxDe(v) ? Math.round(100 * v.boucliers / bouclierMaxDe(v)) : 0, breches: brechesTotales(v),
    }),
    taches: etat.taches.filter(t => t.visible).map(copier),
    defis: etat.defis.filter(d => d.visible).map(copier),
    journal: etat.journal.slice(-20),
  };
}
