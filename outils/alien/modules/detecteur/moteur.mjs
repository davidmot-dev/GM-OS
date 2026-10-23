/** Le radar réutilise les commandes et le tirage du cœur ; aucun dialogue MU/TH/UR. */
import '../../core.js';
import { creerDiscret, validerDiscret, commanderDiscret, lectureDiscrete } from './discret.mjs';
import { COMMANDES_DE_PREREGLAGE, enregistrerPrereglage, lireCharge, prereglageDe, sansPrereglage, validerPrereglages } from '../prereglages.mjs';
import { EXEMPLE_DU_RELAIS } from './exemple.mjs';
const coeur = globalThis.AlienCore;
const copier = valeur => JSON.parse(JSON.stringify(valeur));
const exiger = condition => { if (!condition) throw new Error('Données du détecteur invalides.'); };
const objet = valeur => valeur !== null && typeof valeur === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(valeur));
function forme(valeur, requis, facultatifs = []) {
  exiger(objet(valeur) && requis.every(cle => Object.hasOwn(valeur, cle))
    && Object.keys(valeur).every(cle => requis.includes(cle) || facultatifs.includes(cle)));
}
const REGLAGES = ['intensity', 'volume', 'contacts', 'proximity', 'noise'];
function validerConfig(config) { forme(config, ['crt', 'glitches']); exiger(typeof config.crt === 'boolean' && typeof config.glitches === 'boolean'); }
/** v4 : un préréglage garde toute la préparation ; ceux d'avant n'ont que les réglages de mise en scène. */
function validerContenu(contenu) {
  forme(contenu, ['reglages'], ['config', 'discret']);
  forme(contenu.reglages, REGLAGES);
  exiger(REGLAGES.every(cle => Number.isFinite(contenu.reglages[cle]) && contenu.reglages[cle] >= 0 && contenu.reglages[cle] <= (cle === 'contacts' ? 9 : 100))
    && Number.isInteger(contenu.reglages.contacts) && Object.hasOwn(contenu, 'config') === Object.hasOwn(contenu, 'discret'));
  if (contenu.config) { validerConfig(contenu.config); validerDiscret(contenu.discret); }
}
export function validerEtat(etat, version = 4) {
  forme(etat, ['version', 'system', 'revision', 'config', 'tracker', ...(version >= 2 ? ['prereglages'] : []), ...(version >= 3 ? ['discret'] : [])]);
  exiger(etat.version === version && etat.system === 'alien' && Number.isSafeInteger(etat.revision) && etat.revision >= 0);
  if (version >= 4) validerPrereglages(etat.prereglages, validerContenu);
  else if (version >= 2) coeur.validerPrereglages(etat.prereglages);
  if (version >= 3) validerDiscret(etat.discret);
  validerConfig(etat.config);
  const t = etat.tracker;
  forme(t, ['power', 'intensity', 'volume', 'contacts', 'proximity', 'noise', 'target', 'seed', 'anomalyUntil']);
  exiger(typeof t.power === 'boolean' && t.target === 'all'
    && ['intensity', 'volume', 'proximity', 'noise'].every(cle => Number.isFinite(t[cle]) && t[cle] >= 0 && t[cle] <= 100)
    && Number.isInteger(t.contacts) && t.contacts >= 0 && t.contacts <= 9
    && Number.isInteger(t.seed) && t.seed >= 0 && t.seed <= 4294967295
    && Number.isFinite(t.anomalyUntil) && t.anomalyUntil >= 0);
}
export function creerEtat() {
  return { version: 4, system: 'alien', revision: 0, config: { crt: true, glitches: true }, tracker: coeur.initial().tracker, prereglages: [copier(EXEMPLE_DU_RELAIS)], discret: creerDiscret() };
}
export function arreterEffets(etat) {
  validerEtat(etat);
  const suivant = copier(etat); suivant.tracker.power = false; suivant.tracker.anomalyUntil = 0;
  return suivant;
}
export function migrerEtat(donnees, versionDonnees) {
  if (![1, 2, 3, 4].includes(versionDonnees)) throw new Error('Version du détecteur non prise en charge.');
  validerEtat(donnees, versionDonnees);
  const prereglages = copier(donnees.prereglages ?? []);
  // L'exemple du relais arrive une fois, au passage en v4 ; supprimé ensuite, il ne revient pas.
  const libre = !prereglages.some(p => p.id === EXEMPLE_DU_RELAIS.id || p.nom.toLocaleLowerCase('fr') === EXEMPLE_DU_RELAIS.nom.toLocaleLowerCase('fr'));
  if (versionDonnees < 4 && libre && prereglages.length < 32) prereglages.push(copier(EXEMPLE_DU_RELAIS));
  return arreterEffets({ ...copier(donnees), version: 4, prereglages, discret: donnees.discret ?? creerDiscret() });
}
/** La préparation du mode discret, sans ce qui s'est joué : Tour 1, aucun pas dépensé, aucun scan. */
function preparationDiscrete(discret) {
  return { ...copier(discret), tour: 1, dernierScan: null, pions: discret.pions.map(p => ({ ...p, depense: 0 })) };
}
export function vuePour(etat, lecteur) {
  validerEtat(etat);
  exiger(lecteur?.role === 'mj' || (lecteur?.role === 'joueur' && typeof lecteur.personnageId === 'string' && lecteur.personnageId.length > 0));
  // Le choix des destinataires appartient à l'hôte, indépendamment du terminal.
  const vue = copier(etat);
  if (vue.discret.actif) {
    vue.lectureDiscrete = lectureDiscrete(vue.discret);
    vue.tracker.contacts = vue.lectureDiscrete.echos.length;
    vue.tracker.positions = vue.lectureDiscrete.echos.map(({x,y}) => ({x,y}));
    vue.tracker.anomalyUntil = 0;
  }
  if (lecteur.role === 'joueur') { delete vue.prereglages; delete vue.discret; }
  return vue;
}
export function appliquerCommande(etat, commande, contexte) {
  validerEtat(etat);
  if (contexte?.role !== 'mj') throw new Error('Commande réservée au meneur.');
  forme(commande, ['id', 'charge']);
  const charge = commande.charge, suivant = copier(etat);
  if (['mode-discret','regler-discret','zone-discrete','pion-discret','deplacer-discret','examiner-discret','tour-discret','scanner-discret'].includes(commande.id)) {
    suivant.discret = commanderDiscret(etat.discret,commande);
    if (commande.id === 'scanner-discret') suivant.tracker.power = true;
    if (['mode-discret','tour-discret'].includes(commande.id)) suivant.tracker.power = false;
    suivant.tracker.anomalyUntil = 0; suivant.revision++;
    validerEtat(suivant); return suivant;
  }
  if (COMMANDES_DE_PREREGLAGE.includes(commande.id) || commande.id === 'reinitialiser') {
    const c = lireCharge(commande);
    if (commande.id === 'enregistrer-prereglage') {
      const contenu = { reglages: Object.fromEntries(REGLAGES.map(cle => [cle, etat.tracker[cle]])), config: copier(etat.config), discret: preparationDiscrete(etat.discret) };
      suivant.prereglages = enregistrerPrereglage(etat.prereglages, c, contenu, validerContenu);
    } else if (commande.id === 'supprimer-prereglage') suivant.prereglages = sansPrereglage(etat.prereglages, c.prereglageId);
    else if (commande.id === 'rappeler-prereglage') {
      const p = prereglageDe(etat.prereglages, c.prereglageId);
      Object.assign(suivant.tracker, p.reglages, { power: false, anomalyUntil: 0 });
      // Un préréglage d'avant la v4 ne connaît pas le plan : il le laisse en place.
      if (p.discret) { suivant.config = p.config; suivant.discret = p.discret; }
    } else Object.assign(suivant, { ...creerEtat(), prereglages: copier(etat.prereglages) });
    suivant.revision = etat.revision + 1;
    validerEtat(suivant); return suivant;
  }
  if (etat.discret.actif && (commande.id === 'faux-echo' || (commande.id === 'scanner' && charge?.actif))) throw new Error('Utilise le scan discret : une fois par Tour avec test d’Énergie.');
  const moteur = coeur.créer({ ...coeur.initial(), tracker: suivant.tracker });
  if (commande.id === 'configurer') {
    forme(charge, [], ['intensite', 'volume', 'contacts', 'proximite', 'parasites', 'crt', 'effetsParasites']);
    const tracker = {};
    for (const [entree, sortie, max] of [['intensite', 'intensity', 100], ['volume', 'volume', 100], ['contacts', 'contacts', 9], ['proximite', 'proximity', 100], ['parasites', 'noise', 100]]) {
      if (Object.hasOwn(charge, entree)) {
        exiger(Number.isFinite(charge[entree]) && charge[entree] >= 0 && charge[entree] <= max && (entree !== 'contacts' || Number.isInteger(charge[entree])));
        tracker[sortie] = charge[entree];
      }
    }
    for (const [entree, sortie] of [['crt', 'crt'], ['effetsParasites', 'glitches']]) if (Object.hasOwn(charge, entree)) {
      exiger(typeof charge[entree] === 'boolean'); suivant.config[sortie] = charge[entree];
    }
    moteur.agir('gm', '', { type: 'tracker', tracker });
  } else if (commande.id === 'scanner') {
    forme(charge, ['actif']); exiger(typeof charge.actif === 'boolean');
    moteur.agir('gm', '', { type: 'tracker', tracker: { power: charge.actif } });
  } else if (commande.id === 'faux-echo') {
    forme(charge, []);
    if (!etat.tracker.power) throw new Error('Démarre le scan avant d’ajouter un faux écho.');
    moteur.agir('gm', '', { type: 'anomaly' });
  } else throw new Error('Commande du détecteur inconnue.');
  suivant.tracker = moteur.sauvegarde().tracker;
  if (!suivant.tracker.power) suivant.tracker.anomalyUntil = 0;
  suivant.revision++;
  validerEtat(suivant); return suivant;
}
