/**
 * **Le combat spatial d'ALIEN** — livre de base français, p. 188-201 ; errata 2021.
 * 23/10/2026, Claude Code, à la demande de David (« je voudrais aussi finir Alien
 * aujourd'hui » ; périmètre « complet »).
 *
 * Deux camps, une distance commune en zones, une vélocité d'approche par camp.
 * Un Tour compte quatre phases — senseurs, pilote (déplacement compris), artilleur,
 * ingénieur. Chaque vaisseau donne un ordre en secret, puis tout se résout dans
 * l'ordre d'initiative. Les dés se lancent ici, au poste de Maman : la tablette
 * déclare, elle ne lance jamais elle-même.
 *
 * Les dés suivent la règle déjà tenue par le panneau de jet d'Alien (A2) : un
 * malus retire d'abord des dés de base, puis des dés de stress. Le Stress des
 * postes est la copie du combat : chaque hausse se dit au journal, à reporter sur
 * la fiche.
 */
import {
  ACTIONS, ARMES, AVARIES_MAJEURES, AVARIES_MINEURES, AVARIE_DU_POSTE, LIBELLES_DES_PORTEES, MODELES, MODIFICATEUR_DE_PORTEE,
  PANIQUE_SPATIALE, PORTEES, POSTES, POSTE_DE_LA_PHASE, avarieDeLaTable, porteeDeLaDistance,
} from './catalogue.mjs';
import { COMMANDES_DE_PREREGLAGE, enregistrerPrereglage, lireCharge, prereglageDe, sansPrereglage, sommaireDesPrereglages, validerPrereglages } from '../prereglages.mjs';

const copier = v => JSON.parse(JSON.stringify(v));
const exiger = (condition, message = 'Données du combat spatial invalides.') => { if (!condition) throw new Error(message); };
const objet = v => v !== null && typeof v === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const entier = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;
const texte = (v, max = 80) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const ident = v => typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(v);
const d6 = () => 1 + Math.floor(Math.random() * 6);
// Les identifiants ne puisent pas dans le hasard des dés : un essai peut fixer chaque jet.
const nouvelId = prefixe => `${prefixe}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
const CAMPS = ['joueurs', 'adverse'];
const COMPETENCES = ['MACHINES LOURDES', 'COMTECH'];

function forme(valeur, requis, facultatifs = []) {
  exiger(objet(valeur) && requis.every(c => Object.hasOwn(valeur, c)) && Object.keys(valeur).every(c => requis.includes(c) || facultatifs.includes(c)));
}

// ——— Validation ———

function validerPoste(p) {
  forme(p, ['personnageId', 'nom', 'base', 'stress', 'talent', 'synthetique']);
  exiger(typeof p.personnageId === 'string' && p.personnageId.length <= 128 && typeof p.nom === 'string' && p.nom.length <= 80
    && entier(p.base, 0, 20) && entier(p.stress, 0, 20) && typeof p.talent === 'boolean' && typeof p.synthetique === 'boolean');
}
function validerVaisseau(v) {
  forme(v, ['id', 'nom', 'modele', 'camp', 'signature', 'propulseurs', 'coque', 'protection', 'degats', 'armes', 'transpondeur',
    'ombilic', 'senseursCoupes', 'moteursCoupes', 'avaries', 'horsService', 'detruit', 'postes']);
  exiger(ident(v.id) && texte(v.nom) && typeof v.modele === 'string' && CAMPS.includes(v.camp)
    && entier(v.signature, -5, 5) && entier(v.propulseurs, -5, 5) && entier(v.coque, 1, 99) && entier(v.protection, 0, 30)
    && entier(v.degats, 0, 999) && ['transpondeur', 'ombilic', 'senseursCoupes', 'moteursCoupes', 'horsService', 'detruit'].every(c => typeof v[c] === 'boolean'));
  exiger(Array.isArray(v.armes) && v.armes.length <= 16);
  for (const a of v.armes) {
    forme(a, ['id', 'arme', 'munitions']);
    exiger(ident(a.id) && ARMES.some(x => x.id === a.arme) && (a.munitions === null || entier(a.munitions, 0, 999)));
  }
  exiger(Array.isArray(v.avaries) && v.avaries.length <= 64);
  for (const a of v.avaries) {
    forme(a, ['id', 'gravite', 'code', 'restants', 'etat'], ['armeId']);
    exiger(ident(a.id) && ['mineure', 'majeure'].includes(a.gravite) && entier(a.code, 2, 66) && ['active', 'temporaire'].includes(a.etat)
      && Array.isArray(a.restants) && a.restants.every(c => COMPETENCES.includes(c)) && (a.armeId === undefined || ident(a.armeId)));
  }
  forme(v.postes, POSTES);
  POSTES.forEach(p => validerPoste(v.postes[p]));
}
function validerCombat(c) {
  forme(c, ['tour', 'phase', 'etape', 'engages', 'distance', 'distanceDebutTour', 'croise', 'velocites', 'initiative', 'ordres', 'resolus',
    'verrous', 'dejaVerrouilles', 'faireLeMort', 'evasion', 'rallumeSenseurs', 'rallumeMoteurs', 'rallumage', 'amarres', 'sas',
    'surcharges', 'actionsPerdues', 'enAttente', 'journal']);
  exiger(entier(c.tour, 1, 9999) && entier(c.phase, 1, 4) && ['ordres', 'resolution'].includes(c.etape) && Array.isArray(c.engages)
    && c.engages.every(ident) && entier(c.distance, 0, 99) && entier(c.distanceDebutTour, 0, 99) && typeof c.croise === 'boolean');
  forme(c.velocites, CAMPS); exiger(CAMPS.every(k => entier(c.velocites[k], 0, 20)));
  for (const cle of ['initiative', 'ordres', 'verrous', 'dejaVerrouilles', 'faireLeMort', 'evasion', 'rallumeSenseurs', 'rallumeMoteurs', 'rallumage', 'surcharges', 'actionsPerdues']) exiger(objet(c[cle]));
  exiger(Array.isArray(c.resolus) && Array.isArray(c.amarres) && Array.isArray(c.sas) && Array.isArray(c.journal) && c.journal.length <= 400);
  exiger(c.enAttente === null || objet(c.enAttente));
}
function validerFlotte(vaisseaux) {
  exiger(Array.isArray(vaisseaux) && vaisseaux.length <= 24);
  vaisseaux.forEach(validerVaisseau);
  exiger(new Set(vaisseaux.map(v => v.id)).size === vaisseaux.length);
}
/** v2 : un préréglage garde les vaisseaux et leurs équipages, sans combat. */
function validerPreparation(contenu) { forme(contenu, ['vaisseaux']); validerFlotte(contenu.vaisseaux); }
export function validerEtat(etat, version = 2) {
  forme(etat, ['version', 'system', 'revision', 'vaisseaux', 'combat', ...(version >= 2 ? ['prereglages'] : [])]);
  exiger(etat.version === version && etat.system === 'alien' && Number.isSafeInteger(etat.revision) && etat.revision >= 0);
  validerFlotte(etat.vaisseaux);
  if (version >= 2) validerPrereglages(etat.prereglages, validerPreparation);
  if (etat.combat !== null) validerCombat(etat.combat);
}
export function creerEtat() { return { version: 2, system: 'alien', revision: 0, vaisseaux: [], combat: null, prereglages: [] }; }
export function migrerEtat(donnees, version) {
  exiger([1, 2].includes(version), 'Version du combat spatial non prise en charge.');
  validerEtat(donnees, version); return { ...copier(donnees), version: 2, prereglages: copier(donnees.prereglages ?? []) };
}
/** Rien ne tourne seul : ni minuterie, ni son. Le combat en cours est conservé. */
export function arreterEffets(etat) { validerEtat(etat); return copier(etat); }

// ——— Les dés ———

/** La réserve après modificateurs : un malus mange les dés de base, puis les dés de stress (A2). */
export function composerLaReserve(base, stress, modificateur) {
  const modifie = base + modificateur;
  return { base: Math.max(0, modifie), stress: Math.max(0, stress + Math.min(0, modifie)) };
}
const succesDe = jet => [...jet.base, ...jet.stress].filter(d => d === 6).length;
const paniqueDe = jet => jet.stress.includes(1);
function lancer(base, stress) { return { base: Array.from({ length: base }, d6), stress: Array.from({ length: stress }, d6) }; }
const direLesDes = jet => `[${jet.base.join(' ')}]${jet.stress.length ? ` stress [${jet.stress.join(' ')}]` : ''}`;
const signe = n => (n >= 0 ? `+${n}` : `−${-n}`);

// ——— Lectures ———

const vaisseau = (etat, id) => { const v = etat.vaisseaux.find(x => x.id === id); exiger(v, 'Vaisseau inconnu.'); return v; };
const armeDu = a => ARMES.find(x => x.id === a.arme);
const actives = (v, effet) => v.avaries.filter(a => a.etat === 'active' && avarieDuCode(a).effet === effet);
const avarieDuCode = a => avarieDeLaTable(a.gravite === 'mineure' ? AVARIES_MINEURES : AVARIES_MAJEURES, a.code);
export const signatureEffective = v => v.signature - (v.senseursCoupes ? 1 : 0) - (v.moteursCoupes ? 2 : 0);
export const propulseursEffectifs = v => v.propulseurs - 2 * actives(v, 'propulseurs-2').length;
const peutPiloter = v => !v.detruit && !v.horsService && !v.moteursCoupes && actives(v, 'sans-pilote').length === 0;
const senseursHS = v => v.senseursCoupes || actives(v, 'sans-senseurs').length > 0;
const modInstruments = v => (actives(v, 'instruments-1').length ? -1 : 0);
export function porteeDuCombat(c) { return porteeDeLaDistance(c.distance); }
const indexDePortee = p => PORTEES.indexOf(p);
const ennemis = (etat, v) => etat.combat.engages.map(id => vaisseau(etat, id)).filter(x => x.camp !== v.camp && !x.detruit);
const estPJ = p => p.personnageId !== '' && !p.synthetique;
const cible = (etat, v, id) => {
  const t = vaisseau(etat, id);
  exiger(etat.combat.engages.includes(id) && t.camp !== v.camp && !t.detruit, 'Cible invalide.');
  return t;
};
/** Un vaisseau se vise s'il est verrouillé ce Tour, ou si son transpondeur parle (p. 190). */
const visable = (etat, v, t) => (etat.combat.verrous[v.id] ?? []).includes(t.id) || (t.transpondeur && etat.combat.distance <= 8);

/** L'ordre de résolution : la carte d'initiative la plus basse d'abord (p. 190). */
export function ordreDInitiative(etat) {
  const c = etat.combat;
  return c.engages.filter(id => !vaisseau(etat, id).detruit).sort((a, b) => c.initiative[a] - c.initiative[b]);
}
export function prochainAResoudre(etat) {
  const c = etat.combat;
  return c.etape === 'resolution' ? ordreDInitiative(etat).find(id => !c.resolus.includes(id)) ?? null : null;
}

// ——— Le journal ———

function noter(etat, ligne, prive = false) {
  const c = etat.combat;
  c.journal.push({ tour: c.tour, phase: c.phase, texte: ligne, prive });
  if (c.journal.length > 400) c.journal.splice(0, c.journal.length - 400);
}

// ——— Un test de poste ———

/** Les modificateurs d'une action, dits ligne par ligne. */
function modificateurs(etat, v, ordre) {
  const c = etat.combat, m = [];
  const portee = porteeDuCombat(c);
  if (ordre.action === 'verrouiller') {
    const t = vaisseau(etat, ordre.cibleId);
    m.push({ libelle: `portée ${LIBELLES_DES_PORTEES[portee]}`, valeur: MODIFICATEUR_DE_PORTEE[portee] });
    if (signatureEffective(t)) m.push({ libelle: 'Signature de la cible', valeur: signatureEffective(t) });
    if (actives(v, 'senseurs-2').length) m.push({ libelle: 'senseurs défectueux', valeur: -2 });
  }
  if (ordre.action === 'faire-le-mort' && actives(v, 'senseurs-2').length) m.push({ libelle: 'senseurs défectueux', valeur: -2 });
  if (['accelerer', 'decelerer', 'evasion', 'eperonner', 'amarrer'].includes(ordre.action) && propulseursEffectifs(v))
    m.push({ libelle: 'Propulseurs', valeur: propulseursEffectifs(v) });
  if (ordre.action === 'tirer' || ordre.action === 'contremesures') {
    const a = v.armes.find(x => x.id === ordre.armeId), def = a && armeDu(a);
    if (def?.bonus) m.push({ libelle: def.nom, valeur: def.bonus });
    if (ordre.action === 'tirer') {
      m.push({ libelle: `portée ${LIBELLES_DES_PORTEES[portee]}`, valeur: MODIFICATEUR_DE_PORTEE[portee] });
      if (v.avaries.some(x => x.etat === 'active' && avarieDuCode(x).effet === 'arme-2' && x.armeId === ordre.armeId)) m.push({ libelle: 'panne d’armement', valeur: -2 });
      if (v.postes.artilleur.talent) m.push({ libelle: 'Artilleur de vaisseau', valeur: 2 });
    }
  }
  if (['reparer', 'ouvrir-sas', 'surcharger', 'arreter-surcharge'].includes(ordre.action) && v.postes.ingenieur.talent && ordre.action === 'reparer')
    m.push({ libelle: 'Mécano de vaisseau', valeur: 2 });
  if (['verrouiller', 'faire-le-mort', 'accelerer', 'decelerer', 'evasion', 'eperonner', 'amarrer', 'tirer', 'contremesures'].includes(ordre.action)
    || (ordre.action === 'reparer' && ordre.competence === 'COMTECH')) {
    if (modInstruments(v)) m.push({ libelle: 'panne d’instruments', valeur: -1 });
  }
  return m;
}

/** Jette un test du poste, sans le forcer. Les PNJ et les synthétiques n'ont pas de dés de stress. */
function jeterLePoste(v, poste, mods) {
  const p = v.postes[poste], total = mods.reduce((s, x) => s + x.valeur, 0);
  const reserve = composerLaReserve(p.base, estPJ(p) ? p.stress : 0, total);
  return { jet: lancer(reserve.base, reserve.stress), reserve, modificateur: total };
}

/** La Panique spatiale (p. 201) : D6 + Niveau de Stress ; ce qu'elle change au poste et au vaisseau. */
function paniquer(etat, v, poste) {
  const p = v.postes[poste], de = d6(), total = de + p.stress;
  const e = PANIQUE_SPATIALE.find(x => total >= x.min && total <= x.max);
  p.stress = Math.max(0, Math.min(20, p.stress + e.stress));
  noter(etat, `${p.nom || poste} panique : ${de} + ${total - de} = ${total}, ${e.nom}. ${e.texte}${e.stress ? ` Stress ${signe(e.stress)} (à reporter sur la fiche).` : ''}`);
  if (e.perdAction) etat.combat.actionsPerdues[`${v.id}:${poste}`] = true;
  if (e.avarieDuPoste && AVARIE_DU_POSTE[poste]) ajouterUneAvarie(etat, v, 'majeure', AVARIE_DU_POSTE[poste]);
}

/** Un test de réaction ou d'opposition : jeté aussitôt, sans forçage ; la Panique vaut. */
function testImmediat(etat, v, poste, ordre, raison) {
  const { jet, modificateur } = jeterLePoste(v, poste, modificateurs(etat, v, ordre));
  const s = succesDe(jet);
  noter(etat, `${v.nom}, ${raison} : ${direLesDes(jet)}${modificateur ? ` (${signe(modificateur)})` : ''} → ${s} succès.`);
  if (paniqueDe(jet) && estPJ(v.postes[poste])) paniquer(etat, v, poste);
  return s;
}

// ——— Dégâts et avaries ———

function ajouterUneAvarie(etat, v, gravite, code, profondeur = 0) {
  const table = gravite === 'mineure' ? AVARIES_MINEURES : AVARIES_MAJEURES;
  const a = avarieDeLaTable(table, code);
  const avarie = { id: nouvelId('avarie'), gravite, code, restants: [...a.reparation], etat: 'active' };
  if (a.effet === 'arme-2' || a.effet === 'arme-hs') {
    if (v.armes.length) avarie.armeId = v.armes[Math.floor(Math.random() * v.armes.length)].id;
  }
  if (a.effet !== 'chaine' && a.effet !== 'explosion') v.avaries.push(avarie);
  const arme = avarie.armeId ? ` (${armeDu(v.armes.find(x => x.id === avarie.armeId)).nom})` : '';
  noter(etat, `${v.nom} : avarie ${gravite} ${code}, ${a.nom}${arme}. ${a.texte}`);
  if (a.effet === 'transpondeur') v.transpondeur = false;
  if (a.effet === 'blesse') {
    const des = Array.from({ length: 6 }, d6), n = des.filter(d => d === 6).length;
    const equipage = POSTES.map(p => v.postes[p]).filter(p => p.nom);
    const qui = equipage.length ? equipage[Math.floor(Math.random() * equipage.length)].nom : 'un membre d’équipage';
    noter(etat, `Blessé : ${qui}, [${des.join(' ')}] → ${n} point${n > 1 ? 's' : ''} de dégâts, à infliger sur sa fiche.`);
  }
  if (a.effet === 'chaine' && profondeur < 4) {
    ajouterUneAvarie(etat, v, 'majeure', d6() + d6(), profondeur + 1);
    ajouterUneAvarie(etat, v, 'majeure', d6() + d6(), profondeur + 1);
  }
  if (a.effet === 'explosion') { v.detruit = true; v.horsService = true; noter(etat, `${v.nom} est détruit.`); }
}
const d66 = () => d6() * 10 + d6();

/**
 * Les dégâts d'une attaque (p. 197) : la coque, puis l'avarie. Le seuil mineur suit
 * la table (« 1 ou plus ») plutôt que le texte (« supérieur à 1 »), qui se
 * contredisent. Les canons à particules ne touchent pas la coque (p. 176).
 */
function infliger(etat, v, degats, particules = false) {
  if (degats < 1 || v.detruit) return;
  const moitie = Math.ceil(v.coque / 2);
  if (!particules && degats >= v.coque) {
    v.degats += degats; v.detruit = true; v.horsService = true;
    noter(etat, `${v.nom} reçoit ${degats} dégâts en une attaque, plus que sa Coque (${v.coque}) : détruit, équipage compris.`);
    return;
  }
  if (!particules) {
    v.degats += degats;
    noter(etat, `${v.nom} : ${degats} dégât${degats > 1 ? 's' : ''} de coque (${v.degats}/${v.coque}).`);
    if (v.degats >= v.coque && !v.horsService) { v.horsService = true; noter(etat, `${v.nom} est Hors service : moteurs et armes coupés, décompression explosive. Aux capsules !`); }
  }
  if (degats >= moitie) ajouterUneAvarie(etat, v, 'majeure', d6() + d6());
  else ajouterUneAvarie(etat, v, 'mineure', d66());
}

// ——— Appliquer une action ———

function appliquer(etat, attente) {
  const c = etat.combat, v = vaisseau(etat, attente.vaisseauId), o = attente.ordre;
  const s = attente.jet ? succesDe(attente.jet) : 0;
  const portee = porteeDuCombat(c);
  if (o.action === 'verrouiller') {
    const t = vaisseau(etat, o.cibleId);
    const annule = c.faireLeMort[t.id] ?? 0, net = Math.max(0, s - annule);
    if (net > 0) {
      c.verrous[v.id] = [...new Set([...(c.verrous[v.id] ?? []), t.id])];
      c.dejaVerrouilles[v.id] = [...new Set([...(c.dejaVerrouilles[v.id] ?? []), t.id])];
      noter(etat, `${v.nom} verrouille ${t.nom}${annule ? ` (${annule} succès annulé${annule > 1 ? 's' : ''} par sa ruse)` : ''}.`);
    } else noter(etat, `${v.nom} ne verrouille pas sa cible${annule && s ? ' : elle fait le mort' : ''}.`);
  } else if (o.action === 'accelerer' || o.action === 'decelerer') {
    if (s > 0) {
      const ampleur = s >= 2 && o.ampleur === 2 ? 2 : 1, avant = c.velocites[v.camp];
      c.velocites[v.camp] = Math.max(0, Math.min(20, avant + (o.action === 'accelerer' ? ampleur : -ampleur)));
      noter(etat, `${v.nom} ${o.action === 'accelerer' ? 'accélère' : 'décélère'} : vélocité ${avant} → ${c.velocites[v.camp]}.`);
    } else noter(etat, `${v.nom} manque sa manœuvre.`);
  } else if (['evasion', 'eperonner', 'amarrer'].includes(o.action)) {
    const t = vaisseau(etat, o.cibleId);
    const adverse = peutPiloter(t) ? testImmediat(etat, t, 'pilote', { action: o.action }, 'pilote adverse en opposition') : 0;
    const gagne = s > adverse;
    if (o.action === 'evasion') {
      c.evasion[v.id] = s;
      if (gagne) {
        const a = c.initiative[v.id]; c.initiative[v.id] = c.initiative[t.id]; c.initiative[t.id] = a;
        noter(etat, `${v.nom} l'emporte (${s} contre ${adverse}) : les cartes d'initiative s'échangent avec ${t.nom}.`);
      } else noter(etat, `${v.nom} ne prend pas l'avantage (${s} contre ${adverse}).`);
      if (s) noter(etat, `Ce Tour, chacun de ses ${s} succès annule un succès des tirs contre ${v.nom}.`);
    } else if (o.action === 'eperonner') {
      if (gagne) {
        noter(etat, `${v.nom} percute ${t.nom} (${s} contre ${adverse}).`);
        infliger(etat, v, Math.ceil(t.coque / 2));
        infliger(etat, t, Math.ceil(v.coque / 2) + (s - 1));
      } else noter(etat, `${t.nom} évite l'éperonnage (${s} contre ${adverse}).`);
    } else if (gagne) {
      c.amarres.push([v.id, t.id]);
      noter(etat, `${v.nom} s'amarre à ${t.nom} (${s} contre ${adverse}) : seul le plus grand pilote désormais ; l'ingénieur peut ouvrir le sas.`);
    } else noter(etat, `${t.nom} empêche l'amarrage (${s} contre ${adverse}).`);
  } else if (o.action === 'tirer') {
    const t = vaisseau(etat, o.cibleId), a = v.armes.find(x => x.id === o.armeId), def = armeDu(a);
    if (a.munitions !== null) a.munitions = Math.max(0, a.munitions - 1);
    let net = s;
    const lignes = [];
    if (c.evasion[t.id]) { net -= c.evasion[t.id]; lignes.push(`${c.evasion[t.id]} annulé${c.evasion[t.id] > 1 ? 's' : ''} par l'évasion`); }
    const cm = c.ordres[t.id];
    if (!def.particules && portee !== 'contact' && cm?.action === 'contremesures' && c.phase === 3 && t.armes.some(x => x.id === cm.armeId) && !t.horsService) {
      const r = testImmediat(etat, t, 'artilleur', cm, 'contremesures');
      if (r) { net -= r; lignes.push(`${r} annulé${r > 1 ? 's' : ''} par les contremesures`); }
    }
    net = Math.max(0, net);
    if (net < 1) { noter(etat, `${v.nom} tire (${def.nom}) et manque ${t.nom}${lignes.length ? ` : ${s} succès, ${lignes.join(', ')}` : ''}.`); }
    else {
      let degats = def.degats + (net - 1);
      if (def.particules) degats = Math.max(0, degats - indexDePortee(portee));
      const protection = def.perceArmure ? Math.ceil(t.protection / 2) : t.protection;
      const des = Array.from({ length: protection }, d6), arrete = des.filter(d => d === 6).length;
      const final = Math.max(0, degats - arrete);
      noter(etat, `${v.nom} touche ${t.nom} (${def.nom}) : ${net} succès${lignes.length ? ` après ${lignes.join(', ')}` : ''}, ${degats} dégât${degats > 1 ? 's' : ''}`
        + `${def.particules ? ' (particules, réduits par la portée)' : ''} ; Protection ${protection}${def.perceArmure ? ' (moitié, perce-armure)' : ''} [${des.join(' ')}] → ${final}.`);
      infliger(etat, t, final, !!def.particules);
    }
  } else if (o.action === 'reparer') {
    const a = v.avaries.find(x => x.id === o.avarieId);
    if (s > 0) {
      a.restants.splice(a.restants.indexOf(o.competence), 1);
      noter(etat, a.restants.length ? `${v.nom} : réparation en cours (${avarieDuCode(a).nom}), reste ${a.restants.join(', ')}.`
        : `${v.nom} : ${avarieDuCode(a).nom} réparée en urgence — elle tient un Quart, sans pièce de rechange.`);
      if (!a.restants.length) a.etat = 'temporaire';
    } else noter(etat, `${v.nom} : la réparation d'urgence échoue (${avarieDuCode(a).nom}).`);
  } else if (o.action === 'ouvrir-sas') {
    const t = vaisseau(etat, o.cibleId);
    if (s > 0) { c.sas.push([v.id, t.id]); noter(etat, `${v.nom} perce la coque de ${t.nom} : abordage possible, combat à l'échelle des personnages.`); }
    else noter(etat, `${v.nom} n'ouvre pas le sas de ${t.nom}.`);
  } else if (o.action === 'surcharger') {
    if (s > 0) { c.surcharges[v.id] = c.tour + 1; noter(etat, `${v.nom} : surcharge du réacteur, explosion à la fin du Tour ${c.tour + 1}. Aux VEU !`); }
    else noter(etat, `${v.nom} : la surcharge échoue.`);
  } else if (o.action === 'arreter-surcharge') {
    if (s > 0) { delete c.surcharges[v.id]; noter(etat, `${v.nom} : séquence d'autodestruction interrompue.`); }
    else noter(etat, `${v.nom} : la surcharge continue.`);
  }
  c.resolus.push(v.id);
  c.enAttente = null;
}

// ——— Résoudre le vaisseau dont c'est le tour ———

function resoudre(etat, vid) {
  const c = etat.combat;
  exiger(c.enAttente === null, 'Un jet attend d’être validé ou forcé.');
  exiger(prochainAResoudre(etat) === vid, 'Ce n’est pas le tour de ce vaisseau.');
  const v = vaisseau(etat, vid), poste = POSTE_DE_LA_PHASE[c.phase];
  const o = c.ordres[vid] ?? { action: 'aucune' };
  const fini = ligne => { if (ligne) noter(etat, ligne); c.resolus.push(vid); };
  if (c.actionsPerdues[`${vid}:${poste}`]) { delete c.actionsPerdues[`${vid}:${poste}`]; return fini(`${v.nom} : le poste ${poste} perd cette action (panique).`); }
  if (o.action === 'aucune') return fini(`${v.nom} : aucune action.`);
  if ((c.phase === 2 && !peutPiloter(v)) || (c.phase === 3 && v.horsService)) return fini(`${v.nom} ne peut pas agir à cette phase.`);
  if (o.action === 'rallumer-senseurs') { c.rallumeSenseurs[vid] = true; return fini(`${v.nom} rallume ses senseurs : ils reviennent à la fin du Tour.`); }
  if (o.action === 'rallumer-moteurs') {
    const r = c.rallumage[vid], n = r && r.tour === c.tour - 1 ? r.n + 1 : 1;
    c.rallumage[vid] = { tour: c.tour, n };
    if (n >= 2) c.rallumeMoteurs[vid] = true;
    return fini(n >= 2 ? `${v.nom} : moteurs rallumés à la fin du Tour.` : `${v.nom} : rallumage des moteurs, 1 action sur 2.`);
  }
  if (o.action === 'contremesures') return fini(`${v.nom} : contremesures prêtes (${armeDu(v.armes.find(x => x.id === o.armeId)).nom}).`);
  if (o.action === 'faire-le-mort') {
    if (c.faireLeMort[vid] === undefined) faireLeMort(etat, v, o);
    return fini();
  }
  if (o.action === 'verrouiller') {
    const t = cible(etat, v, o.cibleId);
    if (senseursHS(v)) return fini(`${v.nom} : senseurs hors d'usage, pas de verrouillage.`);
    if (c.distance > 8) return fini(`${t.nom} est hors de portée des senseurs.`);
    const ruse = c.ordres[t.id]?.action === 'faire-le-mort';
    if (ruse && c.faireLeMort[t.id] === undefined) faireLeMort(etat, t, c.ordres[t.id]);
    if (!ruse && (c.dejaVerrouilles[vid] ?? []).includes(t.id)) {
      c.verrous[vid] = [...new Set([...(c.verrous[vid] ?? []), t.id])];
      return fini(`${v.nom} garde ${t.nom} verrouillé, sans jet (p. 191).`);
    }
  }
  if (o.action === 'eperonner' || o.action === 'amarrer') {
    const t = cible(etat, v, o.cibleId);
    if (c.distanceDebutTour !== 0) return fini(`${v.nom} : ${t.nom} n'était pas au contact au début du Tour.`);
    if (o.action === 'amarrer' && (c.velocites.joueurs !== c.velocites.adverse || !v.ombilic || actives(v, 'sans-amarrage').length))
      return fini(`${v.nom} ne peut pas s'amarrer : il faut les mêmes vélocités d'approche et un ombilic de connexion en état.`);
  }
  if (o.action === 'evasion') cible(etat, v, o.cibleId);
  if (o.action === 'tirer') {
    const t = cible(etat, v, o.cibleId), a = v.armes.find(x => x.id === o.armeId), def = a && armeDu(a);
    exiger(def?.sorte === 'offensive', 'Arme invalide.');
    if (v.avaries.some(x => x.etat === 'active' && avarieDuCode(x).effet === 'arme-hs' && x.armeId === a.id)) return fini(`${v.nom} : ${def.nom} hors d'usage.`);
    if (a.munitions === 0) return fini(`${v.nom} : plus de munitions pour ${def.nom}.`);
    if (!visable(etat, v, t)) return fini(`${v.nom} ne peut pas viser ${t.nom} : ni verrouillé ce Tour, ni transpondeur.`);
    const portee = porteeDuCombat(c);
    if (portee === null || indexDePortee(portee) > indexDePortee(def.portee)) return fini(`${t.nom} est hors de portée de ${def.nom} (${LIBELLES_DES_PORTEES[def.portee]}).`);
  }
  if (o.action === 'reparer') {
    const a = v.avaries.find(x => x.id === o.avarieId);
    exiger(a && a.etat === 'active' && a.restants.includes(o.competence), 'Réparation impossible.');
  }
  if (o.action === 'ouvrir-sas') exiger(c.amarres.some(([x, y]) => (x === vid && y === o.cibleId) || (y === vid && x === o.cibleId)), 'Il faut d’abord s’amarrer.');
  if (o.action === 'arreter-surcharge') exiger(c.surcharges[vid] !== undefined, 'Aucune surcharge en cours.');
  // Le test du poste : la tablette le forcera peut-être avant qu'il ne s'applique.
  const mods = modificateurs(etat, v, o), { jet, modificateur } = jeterLePoste(v, poste, mods);
  const p = v.postes[poste], panique = paniqueDe(jet) && estPJ(p);
  noter(etat, `${v.nom}, ${ACTIONS[c.phase].find(x => x.id === o.action).nom} : ${direLesDes(jet)}`
    + `${mods.length ? ` (${mods.map(x => `${x.libelle} ${signe(x.valeur)}`).join(', ')})` : ''} → ${succesDe(jet)} succès.`, v.camp === 'adverse');
  c.enAttente = { vaisseauId: vid, poste, ordre: o, jet, modificateur, force: false, peutForcer: estPJ(p) && !panique };
  if (panique) paniquer(etat, v, poste);
  if (!c.enAttente.peutForcer) appliquer(etat, c.enAttente);
}

/** Faire le mort (p. 191) : couper d'abord ce qui doit l'être, la Signature baisse aussitôt. */
function faireLeMort(etat, v, o) {
  if (o.coupe === 'senseurs' || o.coupe === 'les-deux') v.senseursCoupes = true;
  if (o.coupe === 'moteurs' || o.coupe === 'les-deux') v.moteursCoupes = true;
  if (o.coupe && o.coupe !== 'aucun') noter(etat, `${v.nom} coupe ${o.coupe === 'les-deux' ? 'senseurs et moteurs' : o.coupe} : Signature ${signe(signatureEffective(v))}.`, v.camp === 'adverse');
  etat.combat.faireLeMort[v.id] = testImmediat(etat, v, 'senseurs', o, 'fait le mort');
}

/** Forcer (p. 60) : Stress +1, on relance ce qui n'a donné ni 6 ni 1, avec un dé de stress de plus. */
function forcer(etat) {
  const c = etat.combat, att = c.enAttente;
  exiger(att && att.peutForcer && !att.force, 'Ce jet ne peut pas être forcé.');
  const v = vaisseau(etat, att.vaisseauId), p = v.postes[att.poste];
  p.stress = Math.min(20, p.stress + 1);
  const jet = { base: att.jet.base.map(d => (d === 6 ? d : d6())), stress: [...att.jet.stress.map(d => (d === 6 || d === 1 ? d : d6())), d6()] };
  att.jet = jet; att.force = true; att.peutForcer = false;
  noter(etat, `${p.nom || att.poste} force le jet : Stress ${p.stress} (à reporter sur la fiche) ; ${direLesDes(jet)} → ${succesDe(jet)} succès.`);
  if (paniqueDe(jet)) paniquer(etat, v, att.poste);
  appliquer(etat, att);
}

// ——— Fin de phase, de Tour ———

/** Le déplacement, après la phase de pilote (p. 193) : la distance suit les deux vélocités. */
function deplacer(etat) {
  const c = etat.combat;
  if (c.amarres.length) { noter(etat, 'Les vaisseaux amarrés se déplacent ensemble.'); return; }
  const total = c.velocites.joueurs + c.velocites.adverse, avant = c.distance;
  if (!total) { noter(etat, `Vélocités nulles : la distance reste ${avant}.`); return; }
  if (!c.croise) {
    const apres = avant - total;
    if (apres < 0) { c.croise = true; c.distance = -apres; }
    else c.distance = apres;
  } else c.distance = Math.min(99, avant + total);
  const portee = porteeDuCombat(c);
  noter(etat, `Déplacement : distance ${avant} → ${c.distance} zone${c.distance > 1 ? 's' : ''}${c.croise && avant - total < 0 ? ' (les vaisseaux se croisent)' : ''}`
    + ` — ${portee ? `portée ${LIBELLES_DES_PORTEES[portee]}` : 'hors de portée des senseurs : le combat peut s’arrêter'}.`);
}
function finDeTour(etat) {
  const c = etat.combat;
  for (const [vid, t] of Object.entries(c.surcharges)) if (t <= c.tour) {
    const v = vaisseau(etat, vid); v.detruit = true; v.horsService = true; delete c.surcharges[vid];
    noter(etat, `Le réacteur de ${v.nom} explose : vaisseau et occupants détruits.`);
  }
  for (const vid of Object.keys(c.rallumeSenseurs)) vaisseau(etat, vid).senseursCoupes = false;
  for (const vid of Object.keys(c.rallumeMoteurs)) vaisseau(etat, vid).moteursCoupes = false;
  Object.assign(c, { verrous: {}, faireLeMort: {}, evasion: {}, rallumeSenseurs: {}, rallumeMoteurs: {}, ordres: {}, resolus: [],
    tour: c.tour + 1, phase: 1, etape: 'ordres', distanceDebutTour: c.distance });
  noter(etat, `Tour ${c.tour}.`);
}

// ——— Les ordres ———

const POSTE_DE_L_ACTION = Object.fromEntries(Object.entries(ACTIONS).flatMap(([ph, l]) => l.map(a => [a.id, POSTE_DE_LA_PHASE[ph]])));
function validerOrdre(etat, v, ch) {
  const c = etat.combat;
  forme(ch, ['vaisseauId', 'action'], ['cibleId', 'armeId', 'avarieId', 'ampleur', 'competence', 'coupe']);
  if (ch.action === 'aucune') return { action: 'aucune' };
  const def = ACTIONS[c.phase].find(a => a.id === ch.action);
  exiger(def, 'Cette action n’appartient pas à la phase en cours.');
  const o = { action: ch.action };
  if (def.cible) { exiger(ident(ch.cibleId)); cible(etat, v, ch.cibleId); o.cibleId = ch.cibleId; }
  if (def.arme) {
    const a = v.armes.find(x => x.id === ch.armeId);
    exiger(a && armeDu(a).sorte === def.arme, 'Choisir une arme du vaisseau.'); o.armeId = ch.armeId;
  }
  if (def.avarie) {
    const a = v.avaries.find(x => x.id === ch.avarieId);
    exiger(a && a.etat === 'active' && a.restants.length && COMPETENCES.includes(ch.competence) && a.restants.includes(ch.competence), 'Choisir une avarie et la compétence d’un test restant.');
    o.avarieId = ch.avarieId; o.competence = ch.competence;
  }
  if (['accelerer', 'decelerer'].includes(ch.action)) { exiger(ch.ampleur === undefined || [1, 2].includes(ch.ampleur)); o.ampleur = ch.ampleur ?? 1; }
  if (ch.action === 'faire-le-mort') { exiger(ch.coupe === undefined || ['aucun', 'senseurs', 'moteurs', 'les-deux'].includes(ch.coupe)); o.coupe = ch.coupe ?? 'aucun'; }
  return o;
}

// ——— Vaisseaux, postes ———

const posteVide = () => ({ personnageId: '', nom: '', base: 0, stress: 0, talent: false, synthetique: false });
function preparerVaisseau(etat, ch) {
  forme(ch, ['nom', 'modele', 'camp', 'signature', 'propulseurs', 'coque', 'protection', 'armes', 'transpondeur', 'ombilic'], ['vaisseauId']);
  exiger(texte(ch.nom) && (ch.modele === 'libre' || MODELES.some(m => m.id === ch.modele)) && CAMPS.includes(ch.camp)
    && Array.isArray(ch.armes) && ch.armes.length <= 16 && ch.armes.every(id => ARMES.some(a => a.id === id))
    && typeof ch.transpondeur === 'boolean' && typeof ch.ombilic === 'boolean', 'Vaisseau invalide.');
  const ancien = ch.vaisseauId ? vaisseau(etat, ch.vaisseauId) : null;
  exiger(!ancien || !etat.combat?.engages.includes(ancien.id), 'Termine le combat avant de modifier un vaisseau engagé.');
  // Une arme gardée à la même place garde ses munitions ; une nouvelle arrive pleine.
  const armes = ch.armes.map((id, i) => {
    const cle = `arme-${i}-${id}`.slice(0, 80), garde = ancien?.armes.find(a => a.id === cle);
    return garde ? { ...garde } : { id: cle, arme: id, munitions: ARMES.find(a => a.id === id).munitions ?? null };
  });
  const v = {
    id: ancien?.id ?? nouvelId('vaisseau'), nom: ch.nom.trim(), modele: ch.modele, camp: ch.camp,
    signature: ch.signature, propulseurs: ch.propulseurs, coque: ch.coque, protection: ch.protection,
    degats: ancien?.degats ?? 0, armes, transpondeur: ch.transpondeur, ombilic: ch.ombilic,
    senseursCoupes: ancien?.senseursCoupes ?? false, moteursCoupes: ancien?.moteursCoupes ?? false,
    avaries: ancien?.avaries ?? [], horsService: ancien?.horsService ?? false, detruit: ancien?.detruit ?? false,
    postes: ancien?.postes ?? Object.fromEntries(POSTES.map(p => [p, posteVide()])),
  };
  validerVaisseau(v);
  if (ancien) etat.vaisseaux[etat.vaisseaux.indexOf(ancien)] = v;
  else { exiger(etat.vaisseaux.length < 24, 'Vingt-quatre vaisseaux au plus.'); etat.vaisseaux.push(v); }
}

function tirerLInitiative(etat) {
  const c = etat.combat, paquet = Array.from({ length: 10 }, (_, i) => i + 1);
  for (let i = paquet.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [paquet[i], paquet[j]] = [paquet[j], paquet[i]]; }
  for (const vid of c.engages) {
    const v = vaisseau(etat, vid), deux = v.postes.capitaine.talent;
    const cartes = [paquet.pop(), ...(deux ? [paquet.pop()] : [])];
    c.initiative[vid] = Math.min(...cartes);
    noter(etat, `${v.nom} : carte d'initiative ${c.initiative[vid]}${deux ? ` (Commandant de vaisseau : ${cartes.join(' ou ')})` : ''}.`, v.camp === 'adverse');
  }
}

// ——— Le point d'entrée ———

const peutCommanderLePoste = (v, poste, lecteur) => lecteur.role === 'mj'
  || (v.camp === 'joueurs' && !!lecteur.personnageId && [v.postes[poste].personnageId, v.postes.capitaine.personnageId].includes(lecteur.personnageId));

export function appliquerCommande(etat, commande, lecteur) {
  validerEtat(etat);
  exiger(lecteur?.role === 'mj' || (lecteur?.role === 'joueur' && typeof lecteur.personnageId === 'string' && lecteur.personnageId.length > 0), 'Lecteur invalide.');
  forme(commande, ['id', 'charge']);
  const suivant = copier(etat), ch = commande.charge, c = suivant.combat, mj = lecteur.role === 'mj';
  const reserveAuMJ = () => exiger(mj, 'Commande réservée au meneur.');
  const enCombat = () => exiger(c, 'Aucun combat en cours.');
  switch (commande.id) {
    case 'enregistrer-prereglage': case 'rappeler-prereglage': case 'supprimer-prereglage': case 'reinitialiser': {
      reserveAuMJ(); const p = lireCharge(commande);
      if (commande.id === 'enregistrer-prereglage') {
        // Une réparation d'urgence ne tient qu'un Quart : le préréglage garde l'avarie, comme la fin du combat.
        const vaisseaux = copier(etat.vaisseaux);
        for (const v of vaisseaux) for (const a of v.avaries) if (a.etat === 'temporaire') { a.etat = 'active'; a.restants = [...avarieDuCode(a).reparation]; }
        suivant.prereglages = enregistrerPrereglage(etat.prereglages, p, { vaisseaux }, validerPreparation);
      } else if (commande.id === 'supprimer-prereglage') suivant.prereglages = sansPrereglage(etat.prereglages, p.prereglageId);
      else if (commande.id === 'rappeler-prereglage') {
        exiger(!c, 'Termine le combat avant de rappeler un préréglage.');
        suivant.vaisseaux = prereglageDe(etat.prereglages, p.prereglageId).vaisseaux;
      } else Object.assign(suivant, { vaisseaux: [], combat: null });
      break;
    }
    case 'vaisseau': reserveAuMJ(); preparerVaisseau(suivant, ch); break;
    case 'supprimer-vaisseau': {
      reserveAuMJ(); forme(ch, ['vaisseauId']); const v = vaisseau(suivant, ch.vaisseauId);
      exiger(!c?.engages.includes(v.id), 'Ce vaisseau est engagé dans le combat.');
      suivant.vaisseaux = suivant.vaisseaux.filter(x => x !== v); break;
    }
    case 'poste': {
      reserveAuMJ(); forme(ch, ['vaisseauId', 'poste', 'personnageId', 'nom', 'base', 'stress', 'talent', 'synthetique']);
      const v = vaisseau(suivant, ch.vaisseauId); exiger(POSTES.includes(ch.poste));
      const p = { personnageId: ch.personnageId, nom: ch.nom, base: ch.base, stress: ch.stress, talent: ch.talent, synthetique: ch.synthetique };
      validerPoste(p); v.postes[ch.poste] = p; break;
    }
    case 'etat-vaisseau': {
      reserveAuMJ(); forme(ch, ['vaisseauId'], ['degats', 'transpondeur', 'senseursCoupes', 'moteursCoupes', 'retirerAvarie', 'armeId', 'munitions']);
      const v = vaisseau(suivant, ch.vaisseauId);
      if (ch.degats !== undefined) {
        exiger(entier(ch.degats, 0, 999)); v.degats = ch.degats;
        if (!v.detruit) v.horsService = v.degats >= v.coque;
      }
      for (const cle of ['transpondeur', 'senseursCoupes', 'moteursCoupes']) if (ch[cle] !== undefined) { exiger(typeof ch[cle] === 'boolean'); v[cle] = ch[cle]; }
      if (ch.retirerAvarie !== undefined) { exiger(v.avaries.some(a => a.id === ch.retirerAvarie), 'Avarie inconnue.'); v.avaries = v.avaries.filter(a => a.id !== ch.retirerAvarie); }
      if (ch.armeId !== undefined) {
        const a = v.armes.find(x => x.id === ch.armeId); exiger(a && entier(ch.munitions, 0, 999) && a.munitions !== null); a.munitions = ch.munitions;
      }
      validerVaisseau(v); break;
    }
    case 'demarrer-combat': {
      reserveAuMJ(); exiger(!c, 'Un combat est déjà en cours.');
      forme(ch, ['vaisseaux', 'distance', 'velociteJoueurs', 'velociteAdverse']);
      exiger(Array.isArray(ch.vaisseaux) && new Set(ch.vaisseaux).size === ch.vaisseaux.length && entier(ch.distance, 0, 8)
        && entier(ch.velociteJoueurs, 0, 20) && entier(ch.velociteAdverse, 0, 20), 'Combat invalide.');
      const engages = ch.vaisseaux.map(id => vaisseau(suivant, id)).filter(v => !v.detruit);
      exiger(CAMPS.every(k => engages.some(v => v.camp === k)), 'Il faut au moins un vaisseau dans chaque camp.');
      suivant.combat = {
        tour: 1, phase: 1, etape: 'ordres', engages: engages.map(v => v.id), distance: ch.distance, distanceDebutTour: ch.distance, croise: false,
        velocites: { joueurs: ch.velociteJoueurs, adverse: ch.velociteAdverse }, initiative: {}, ordres: {}, resolus: [],
        verrous: {}, dejaVerrouilles: {}, faireLeMort: {}, evasion: {}, rallumeSenseurs: {}, rallumeMoteurs: {}, rallumage: {},
        amarres: [], sas: [], surcharges: {}, actionsPerdues: {}, enAttente: null, journal: [],
      };
      noter(suivant, `Contact à ${ch.distance} zones (portée ${LIBELLES_DES_PORTEES[porteeDeLaDistance(ch.distance)]}). Vélocités : ${ch.velociteJoueurs} et ${ch.velociteAdverse}.`);
      tirerLInitiative(suivant);
      break;
    }
    case 'ordonner': {
      enCombat(); exiger(c.etape === 'ordres', 'Les ordres de cette phase sont déjà révélés.');
      const v = vaisseau(suivant, ch?.vaisseauId);
      exiger(c.engages.includes(v.id) && !v.detruit, 'Ce vaisseau n’est pas engagé.');
      exiger(peutCommanderLePoste(v, POSTE_DE_LA_PHASE[c.phase], lecteur), 'Ce poste ne t’appartient pas.');
      c.ordres[v.id] = validerOrdre(suivant, v, ch); break;
    }
    case 'mes-des': {
      forme(ch, ['vaisseauId', 'poste', 'base', 'stress']);
      const v = vaisseau(suivant, ch.vaisseauId); exiger(POSTES.includes(ch.poste) && entier(ch.base, 0, 20) && entier(ch.stress, 0, 20));
      exiger(mj || (v.camp === 'joueurs' && v.postes[ch.poste].personnageId === lecteur.personnageId), 'Ce poste ne t’appartient pas.');
      Object.assign(v.postes[ch.poste], { base: ch.base, stress: ch.stress }); break;
    }
    case 'reveler': {
      reserveAuMJ(); enCombat(); exiger(c.etape === 'ordres', 'Les ordres de cette phase sont déjà révélés.');
      c.etape = 'resolution';
      for (const vid of ordreDInitiative(suivant)) {
        const v = vaisseau(suivant, vid), o = c.ordres[vid] ?? { action: 'aucune' };
        const nom = o.action === 'aucune' ? 'aucune action' : ACTIONS[c.phase].find(a => a.id === o.action).nom;
        noter(suivant, `Ordre de ${v.nom} : ${nom}${o.cibleId ? ` → ${vaisseau(suivant, o.cibleId).nom}` : ''}.`);
      }
      break;
    }
    case 'resoudre': {
      enCombat(); forme(ch, ['vaisseauId']);
      const v = vaisseau(suivant, ch.vaisseauId);
      exiger(peutCommanderLePoste(v, POSTE_DE_LA_PHASE[c.phase], lecteur), 'Ce poste ne t’appartient pas.');
      resoudre(suivant, v.id); break;
    }
    case 'forcer': case 'valider': {
      enCombat(); forme(ch, []); exiger(c.enAttente, 'Aucun jet en attente.');
      const v = vaisseau(suivant, c.enAttente.vaisseauId), p = v.postes[c.enAttente.poste];
      exiger(mj || p.personnageId === lecteur.personnageId, 'Ce jet ne t’appartient pas.');
      if (commande.id === 'forcer') forcer(suivant); else appliquer(suivant, c.enAttente);
      break;
    }
    case 'phase-suivante': {
      reserveAuMJ(); enCombat(); exiger(c.etape === 'resolution' && c.enAttente === null, 'Révèle les ordres et termine les jets d’abord.');
      for (const vid of ordreDInitiative(suivant)) if (!c.resolus.includes(vid)) noter(suivant, `${vaisseau(suivant, vid).nom} : action passée.`);
      if (c.phase === 2) deplacer(suivant);
      if (c.phase === 4) finDeTour(suivant);
      else Object.assign(c, { phase: c.phase + 1, etape: 'ordres', ordres: {}, resolus: [] });
      break;
    }
    case 'relancer-avarie': {
      reserveAuMJ(); forme(ch, ['vaisseauId', 'avarieId']);
      const v = vaisseau(suivant, ch.vaisseauId), a = v.avaries.find(x => x.id === ch.avarieId);
      exiger(a && a.gravite === 'mineure', 'Seule une avarie mineure se relance (p. 197).');
      v.avaries = v.avaries.filter(x => x !== a);
      if (c) { noter(suivant, `${v.nom} : avarie ${a.code} sans objet, relancée.`); ajouterUneAvarie(suivant, v, 'mineure', d66()); }
      else v.avaries.push({ ...a, id: nouvelId('avarie'), code: d66(), restants: [...avarieDeLaTable(AVARIES_MINEURES, a.code).reparation] });
      break;
    }
    case 'terminer-combat': {
      reserveAuMJ(); enCombat();
      // Les réparations d'urgence ne tiennent qu'un Quart : après le combat, elles redeviennent des avaries.
      for (const v of suivant.vaisseaux) for (const a of v.avaries) if (a.etat === 'temporaire') { a.etat = 'active'; a.restants = [...avarieDuCode(a).reparation]; }
      suivant.combat = null; break;
    }
    default: throw new Error('Commande du combat spatial inconnue.');
  }
  suivant.revision++;
  validerEtat(suivant);
  return suivant;
}

// ——— Ce que chacun voit ———

/**
 * Au joueur : les vaisseaux de son camp en entier ; de l'adversaire, ce que les
 * senseurs en savent — le nom et le modèle seulement si le transpondeur parle ou
 * si un vaisseau des joueurs l'a verrouillé. Ni ordres avant la révélation, ni
 * jets privés, ni équipage adverse.
 */
export function vuePour(etat, lecteur, contexte = { personnages: [] }) {
  validerEtat(etat);
  exiger(lecteur?.role === 'mj' || (lecteur?.role === 'joueur' && typeof lecteur.personnageId === 'string' && lecteur.personnageId.length > 0));
  const vue = copier(etat), c = vue.combat;
  const enrichir = v => ({ ...v, signatureEffective: signatureEffective(v), propulseursEffectifs: propulseursEffectifs(v),
    avaries: v.avaries.map(a => ({ ...a, ...avarieDuCode(a), armeNom: a.armeId ? armeDu(v.armes.find(x => x.id === a.armeId)).nom : undefined })),
    armes: v.armes.map(a => ({ ...a, ...armeDu(a), id: a.id, arme: a.arme })) });
  if (c) {
    c.portee = porteeDuCombat(etat.combat);
    c.ordreDInitiative = ordreDInitiative(etat);
    c.prochain = prochainAResoudre(etat);
  }
  // Les personnages de la séance, pour attribuer les postes.
  if (lecteur.role === 'mj') return { ...vue, vaisseaux: vue.vaisseaux.map(enrichir), prereglages: sommaireDesPrereglages(etat.prereglages), personnages: copier(contexte?.personnages ?? []) };
  delete vue.prereglages;
  const identifies = new Set(etat.vaisseaux.filter(v => v.camp === 'joueurs')
    .flatMap(v => [...(etat.combat?.dejaVerrouilles[v.id] ?? []), ...(etat.combat?.verrous[v.id] ?? [])]));
  const vaisseaux = vue.vaisseaux.filter(v => v.camp === 'joueurs' || c?.engages.includes(v.id)).map(v => {
    if (v.camp === 'joueurs') return enrichir(v);
    const connu = v.transpondeur || identifies.has(v.id);
    return { id: v.id, camp: v.camp, nom: connu ? v.nom : 'Contact non identifié', modele: connu ? v.modele : '', identifie: connu,
      horsService: v.horsService, detruit: v.detruit };
  });
  if (c) {
    const adverses = new Set(etat.vaisseaux.filter(v => v.camp === 'adverse').map(v => v.id));
    if (c.etape === 'ordres') c.ordres = Object.fromEntries(Object.entries(c.ordres).filter(([id]) => !adverses.has(id)));
    for (const id of Object.keys(c.initiative)) if (adverses.has(id) && !identifies.has(id) && !etat.vaisseaux.find(v => v.id === id).transpondeur) delete c.initiative[id];
    if (c.enAttente && adverses.has(c.enAttente.vaisseauId)) c.enAttente = null;
    c.journal = c.journal.filter(l => !l.prive);
    delete c.dejaVerrouilles; delete c.faireLeMort; delete c.surcharges; delete c.rallumage;
  }
  return { ...vue, vaisseaux, moi: lecteur.personnageId };
}
