/** Atelier local : sauvegarde de la préparation seulement, sans connexion au Hub. */
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { VueJoueur, PupitreMJ } from './vues.mjs';
import * as moteur from './moteur.mjs';
import { cleSauvegardeConfiguration, extraireConfiguration, etatDepuisConfiguration, lireConfiguration } from './configuration.mjs';

const element = id => document.getElementById(id);
const mj = { role: 'mj', appareilId: 'demo-mj' }, reyes = { role: 'joueur', personnageId: 'pj-reyes', appareilId: 'demo-reyes' };
const commandesDePreparation = new Set(['configurer', 'creer-dossier', 'modifier-dossier', 'enregistrer-protocole', 'supprimer-protocole', 'reinitialiser']);
let stockage, lectureBloquee = false, configurationEnAttente = null, generation = 0, numeroImport = 0;
let etat = moteur.creerEtat(), lecteur = reyes;

function statutSauvegarde(texte, erreur = false) {
  element('sauvegardeStatut').textContent = texte;
  element('sauvegardeStatut').setAttribute('role', erreur ? 'alert' : 'status');
}
try {
  stockage = window.localStorage;
  const texte = stockage.getItem(cleSauvegardeConfiguration);
  if (texte !== null) {
    try {
      etat = etatDepuisConfiguration(lireConfiguration(texte));
      statutSauvegarde('Configuration restaurée sur cet appareil.');
    } catch {
      lectureBloquee = true;
      statutSauvegarde('Sauvegarde illisible : elle est conservée. Sauvegarde automatique suspendue ; importez un fichier valide pour la remplacer.', true);
    }
  } else statutSauvegarde('Les modifications seront sauvegardées automatiquement sur cet appareil.');
} catch {
  statutSauvegarde('Sauvegarde locale indisponible. Exportez la configuration avant de fermer.', true);
}

function preparerDemonstration(preparation) {
  let resultat = preparation;
  const agir = (id, charge, contexte = mj) => { resultat = moteur.appliquerCommande(resultat, { id, charge }, contexte); };
  agir('preparer-operateur', { personnageId: 'pj-reyes', nom: 'Reyes' });
  agir('preparer-operateur', { personnageId: 'pj-sato', nom: 'Sato' });
  agir('saisir', { texte: '/M Maman, où est la dernière balise ?' }, reyes);
  agir('repondre', { personnageId: 'pj-reyes', texte: 'Dernier signal : secteur 7.\nAucun accusé de réception depuis 03:17.' });
  return resultat;
}
etat = preparerDemonstration(etat);

function sauvegarder(preparation = etat, remplacer = false) {
  if (lectureBloquee && !remplacer) return;
  try {
    if (!stockage) throw new Error('Stockage indisponible.');
    stockage.setItem(cleSauvegardeConfiguration, JSON.stringify(extraireConfiguration(preparation)));
    lectureBloquee = false;
    statutSauvegarde('Configuration enregistrée sur cet appareil.');
  } catch {
    statutSauvegarde('Sauvegarde locale impossible. La préparation reste ouverte ; exportez-la avant de fermer.', true);
  }
}

const racine = createRoot(element('module'));
function afficher() {
  element('configurationAtelier').hidden = lecteur.role !== 'mj';
  racine.render(h(lecteur.role === 'mj' ? PupitreMJ : VueJoueur, {
    key: `${lecteur.role}-${generation}`,
    vue: moteur.vuePour(etat, lecteur),
    envoyerCommande: async commande => {
      try {
        etat = moteur.appliquerCommande(etat, commande, lecteur);
        if (commandesDePreparation.has(commande.id)) sauvegarder();
        afficher(); return { ok: true };
      } catch (erreur) { return { ok: false, erreur: erreur.message || 'Commande refusée dans cet atelier.' }; }
    },
  }));
}
window.apercuMuthur = role => { lecteur = role === 'mj' ? mj : reyes; afficher(); };
window.autodestructionMuthur = () => { etat = moteur.appliquerCommande(etat, { id: 'saisir', charge: { texte: 'CODE OMEGA-10' } }, reyes); afficher(); };
element('joueur').onclick = () => window.apercuMuthur('joueur');
element('meneur').onclick = () => window.apercuMuthur('mj');

element('exporterConfiguration').onclick = () => {
  const texte = JSON.stringify(extraireConfiguration(etat), null, 2);
  const url = URL.createObjectURL(new Blob([texte], { type: 'application/json;charset=utf-8' }));
  const lien = document.createElement('a'); lien.href = url; lien.download = 'muthur-configuration.json';
  document.body.append(lien); lien.click(); lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
element('importerConfiguration').onclick = () => element('fichierConfiguration').click();
element('fichierConfiguration').onchange = async evenement => {
  const numero = ++numeroImport;
  const fichier = evenement.target.files?.[0]; evenement.target.value = '';
  configurationEnAttente = null; element('confirmationImport').hidden = true;
  if (!fichier) return;
  try {
    if (fichier.size > 16 * 1024 * 1024) throw new Error('Le fichier dépasse 16 Mo.');
    const preparation = lireConfiguration(await fichier.text());
    if (numero !== numeroImport) return;
    configurationEnAttente = preparation;
    const configuration = configurationEnAttente;
    element('resumeImport').textContent = `${configuration.config.vessel || 'Vaisseau sans nom'} · ${configuration.documents.length} dossier(s) · ${configuration.protocoles.length} protocole(s).`;
    element('transfertStatut').textContent = '';
    element('confirmationImport').hidden = false;
    element('confirmerImport').focus();
  } catch (erreur) {
    if (numero !== numeroImport) return;
    element('transfertStatut').textContent = `Import refusé. ${erreur.message} La préparation actuelle est conservée.`;
  }
};
element('annulerImport').onclick = () => { numeroImport++; configurationEnAttente = null; element('confirmationImport').hidden = true; element('importerConfiguration').focus(); };
element('confirmerImport').onclick = () => {
  if (!configurationEnAttente) return;
  etat = preparerDemonstration(etatDepuisConfiguration(configurationEnAttente));
  sauvegarder(etat, true);
  configurationEnAttente = null; element('confirmationImport').hidden = true;
  element('transfertStatut').textContent = 'Configuration importée. La démonstration a été remise à zéro.';
  generation++; // Effacer aussi les brouillons et couper les lecteurs de l'ancienne préparation.
  afficher(); element('exporterConfiguration').focus();
};
afficher();
