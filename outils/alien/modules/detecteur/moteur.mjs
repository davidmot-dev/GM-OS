/** Le radar réutilise les commandes et le tirage du cœur ; aucun dialogue MU/TH/UR. */
import '../../core.js';
import { creerDiscret, validerDiscret, commanderDiscret, lectureDiscrete } from './discret.mjs';
const coeur = globalThis.AlienCore;
const copier = valeur => JSON.parse(JSON.stringify(valeur));
const exiger = condition => { if (!condition) throw new Error('Données du détecteur invalides.'); };
const objet = valeur => valeur !== null && typeof valeur === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(valeur));
function forme(valeur, requis, facultatifs = []) {
  exiger(objet(valeur) && requis.every(cle => Object.hasOwn(valeur, cle))
    && Object.keys(valeur).every(cle => requis.includes(cle) || facultatifs.includes(cle)));
}
export function validerEtat(etat, version = 3) {
  forme(etat, ['version', 'system', 'revision', 'config', 'tracker', ...(version >= 2 ? ['prereglages'] : []), ...(version >= 3 ? ['discret'] : [])]);
  exiger(etat.version === version && etat.system === 'alien' && Number.isSafeInteger(etat.revision) && etat.revision >= 0);
  if (version >= 2) coeur.validerPrereglages(etat.prereglages);
  if (version >= 3) validerDiscret(etat.discret);
  forme(etat.config, ['crt', 'glitches']); exiger(typeof etat.config.crt === 'boolean' && typeof etat.config.glitches === 'boolean');
  const t = etat.tracker;
  forme(t, ['power', 'intensity', 'volume', 'contacts', 'proximity', 'noise', 'target', 'seed', 'anomalyUntil']);
  exiger(typeof t.power === 'boolean' && t.target === 'all'
    && ['intensity', 'volume', 'proximity', 'noise'].every(cle => Number.isFinite(t[cle]) && t[cle] >= 0 && t[cle] <= 100)
    && Number.isInteger(t.contacts) && t.contacts >= 0 && t.contacts <= 9
    && Number.isInteger(t.seed) && t.seed >= 0 && t.seed <= 4294967295
    && Number.isFinite(t.anomalyUntil) && t.anomalyUntil >= 0);
}
export function creerEtat() {
  return { version: 3, system: 'alien', revision: 0, config: { crt: true, glitches: true }, tracker: coeur.initial().tracker, prereglages: [], discret: creerDiscret() };
}
export function arreterEffets(etat) {
  validerEtat(etat);
  const suivant = copier(etat); suivant.tracker.power = false; suivant.tracker.anomalyUntil = 0;
  return suivant;
}
export function migrerEtat(donnees, versionDonnees) {
  if (![1, 2, 3].includes(versionDonnees)) throw new Error('Version du détecteur non prise en charge.');
  validerEtat(donnees, versionDonnees);
  return arreterEffets({ ...copier(donnees), version: 3, prereglages: donnees.prereglages ?? [], discret: donnees.discret ?? creerDiscret() });
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
  if (etat.discret.actif && (commande.id === 'faux-echo' || (commande.id === 'scanner' && charge?.actif))) throw new Error('Utilise le scan discret : une fois par Tour avec test d’Énergie.');
  const moteur = coeur.créer({ ...coeur.initial(), tracker: suivant.tracker, prereglagesDetecteur: suivant.prereglages });
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
  } else if (['enregistrer-prereglage', 'rappeler-prereglage', 'supprimer-prereglage'].includes(commande.id)) {
    forme(charge, commande.id === 'enregistrer-prereglage' ? ['prereglageId', 'nom'] : ['prereglageId']);
    exiger(typeof charge.prereglageId === 'string' && /^[a-z][a-z0-9-]{0,79}$/.test(charge.prereglageId));
    moteur.agir('gm', '', { type: commande.id, id: charge.prereglageId, nom: charge.nom });
  } else throw new Error('Commande du détecteur inconnue.');
  suivant.tracker = moteur.sauvegarde().tracker;
  suivant.prereglages = moteur.sauvegarde().prereglagesDetecteur;
  if (!suivant.tracker.power) suivant.tracker.anomalyUntil = 0;
  suivant.revision++;
  validerEtat(suivant); return suivant;
}
