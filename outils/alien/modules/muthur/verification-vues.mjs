import { test, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createElement as h, act } from 'react';
import { VueJoueur, PupitreMJ } from './vues.mjs';
import * as moteur from './moteur.mjs';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
// JSDOM ne décode pas de média ; le lecteur commun est éprouvé séparément.
Object.defineProperties(dom.window.HTMLMediaElement.prototype, {
  play: { configurable: true, value: async function () {} },
  pause: { configurable: true, value: function () {} },
  load: { configurable: true, value: function () {} },
});
const anciens = new Map();
for (const cle of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Event', 'FormData']) {
  anciens.set(cle, Object.getOwnPropertyDescriptor(globalThis, cle));
  Object.defineProperty(globalThis, cle, { configurable: true, writable: true, value: dom.window[cle] });
}
anciens.set('IS_REACT_ACT_ENVIRONMENT', Object.getOwnPropertyDescriptor(globalThis, 'IS_REACT_ACT_ENVIRONMENT'));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { render, fireEvent, cleanup } = await import('@testing-library/react');
let erreursReact = [];
const erreurOriginale = console.error;
beforeEach(() => { erreursReact = []; console.error = (...argumentsRecus) => erreursReact.push(argumentsRecus.join(' ')); });
afterEach(() => {
  try { cleanup(); assert.deepEqual(erreursReact, [], 'Aucun diagnostic React attendu.'); }
  finally { console.error = erreurOriginale; }
});
after(() => {
  dom.window.close();
  for (const [cle, descripteur] of anciens) {
    if (descripteur) Object.defineProperty(globalThis, cle, descripteur); else delete globalThis[cle];
  }
});
const mj = { role: 'mj', appareilId: 'poste-mj' }, reyes = { role: 'joueur', personnageId: 'pj-reyes', appareilId: 'tablette-reyes' }, sato = { role: 'joueur', personnageId: 'pj-sato', appareilId: 'tablette-sato' };
const agir = (etat, id, charge, contexte = mj) => moteur.appliquerCommande(etat, { id, charge }, contexte);
const cliquer = async element => { await act(async () => fireEvent.click(element)); };
const soumettre = async element => { await act(async () => fireEvent.submit(element)); };

function installer(contexte, etat = moteur.creerEtat()) {
  const commandes = [], composant = contexte.role === 'mj' ? PupitreMJ : VueJoueur;
  let affichage;
  const props = () => ({ vue: moteur.vuePour(etat, contexte), envoyerCommande: async commande => {
    commandes.push(commande);
    try {
      etat = moteur.appliquerCommande(etat, commande, contexte);
      affichage.rerender(h(composant, props())); return { ok: true };
    } catch { return { ok: false, erreur: 'Commande refusée par le moteur.' }; }
  } });
  affichage = render(h(composant, props()));
  return { ...affichage, commandes, etat: () => etat };
}

test('la vue joueur transmet la saisie sans identité choisie et affiche le résultat filtré', async () => {
  const vue = installer(reyes);
  const saisie = vue.getByLabelText('Commande ou /M votre question');
  fireEvent.change(saisie, { target: { value: 'CODE 0042' } });
  assert.equal(saisie.type, 'password');
  await soumettre(saisie.closest('form'));
  assert.deepEqual(vue.commandes, [{ id: 'saisir', charge: { texte: 'CODE 0042' } }]);
  assert.ok(vue.getByText(/CODE VALIDÉ/)); assert.equal(saisie.value, '');
  assert.ok(!vue.container.textContent.includes('0042'));
  assert.equal(vue.queryByText('Réglages'), null);
});

test('une erreur de transmission garde le brouillon et réactive le formulaire', async () => {
  const vue = render(h(VueJoueur, { vue: moteur.vuePour(moteur.creerEtat(), reyes), envoyerCommande: async () => ({ ok: false, erreur: 'Liaison perdue.' }) }));
  const saisie = vue.getByLabelText('Commande ou /M votre question');
  fireEvent.change(saisie, { target: { value: '/M Une question privée' } });
  await soumettre(saisie.closest('form'));
  assert.equal(vue.getByRole('alert').textContent, 'Liaison perdue.');
  assert.equal(saisie.value, '/M Une question privée'); assert.equal(saisie.disabled, false);
});

test('une exception du transport est affichée sans exposer ses détails', async () => {
  const vue = render(h(VueJoueur, { vue: moteur.vuePour(moteur.creerEtat(), reyes), envoyerCommande: async () => { throw new Error('JETON PRIVÉ'); } }));
  await cliquer(vue.getByText('STATUS', { selector: 'button' }));
  assert.ok(vue.getByRole('alert').textContent.includes('transmise'));
  assert.ok(!vue.container.textContent.includes('JETON PRIVÉ'));
});

test('deux soumissions rapprochées ne créent pas deux commandes', async () => {
  let terminer, appels = 0;
  const attente = new Promise(resolve => { terminer = resolve; });
  const vue = render(h(VueJoueur, { vue: moteur.vuePour(moteur.creerEtat(), reyes), envoyerCommande: () => { appels++; return attente; } }));
  const saisie = vue.getByLabelText('Commande ou /M votre question');
  fireEvent.change(saisie, { target: { value: 'STATUS' } });
  await act(async () => { fireEvent.submit(saisie.closest('form')); fireEvent.submit(saisie.closest('form')); });
  assert.equal(appels, 1); assert.equal(saisie.disabled, true);
  await act(async () => terminer({ ok: true }));
  assert.equal(saisie.disabled, false);
});

test('changer de personnage efface le brouillon et l’ancien dialogue', async () => {
  const etat = agir(moteur.creerEtat(), 'saisir', { texte: '/M Secret de Reyes' }, reyes);
  const envoyerCommande = async () => ({ ok: true });
  const vue = render(h(VueJoueur, { vue: moteur.vuePour(etat, reyes), envoyerCommande }));
  fireEvent.change(vue.getByLabelText('Commande ou /M votre question'), { target: { value: 'LOGIN secret' } });
  vue.rerender(h(VueJoueur, { vue: moteur.vuePour(etat, sato), envoyerCommande }));
  assert.equal(vue.getByLabelText('Commande ou /M votre question').value, '');
  assert.ok(!vue.container.textContent.includes('Secret de Reyes'));
});

test('le pupitre répond à l’opérateur choisi et permet l’arbitrage du piratage', async () => {
  let etat = agir(moteur.creerEtat(), 'preparer-operateur', { personnageId: reyes.personnageId, nom: 'Reyes' });
  etat = agir(etat, 'preparer-operateur', { personnageId: sato.personnageId, nom: 'Sato' });
  etat = agir(etat, 'saisir', { texte: 'HACK' }, sato);
  const vue = installer(mj, etat);
  fireEvent.change(vue.getByLabelText('Opérateur'), { target: { value: sato.personnageId } });
  await cliquer(vue.getByText('Autoriser l’intrusion'));
  assert.equal(vue.etat().players[sato.personnageId].access, 'admin');
  assert.equal(vue.etat().players[reyes.personnageId].access, 'crew');
  const saisie = vue.getByLabelText('Réponse de Maman');
  fireEvent.change(saisie, { target: { value: 'Bonjour Sato.' } });
  await soumettre(saisie.closest('form'));
  assert.deepEqual(vue.commandes.at(-1), { id: 'repondre', charge: { personnageId: sato.personnageId, texte: 'Bonjour Sato.', demandeId: null } });
  assert.ok(vue.getByText('Bonjour Sato.'));
});

test('la file permet de répondre à la seconde question sans traiter la première ni le hack', async () => {
  let etat = agir(moteur.creerEtat(), 'saisir', { texte: '/M Première question' }, reyes);
  etat = agir(etat, 'saisir', { texte: 'HACK' }, reyes);
  etat = agir(etat, 'saisir', { texte: '/M Seconde question' }, reyes);
  const seconde = etat.players[reyes.personnageId].requests[2];
  const vue = installer(mj, etat);
  fireEvent.change(vue.getByLabelText('Demande à traiter'), { target: { value: seconde.id } });
  const saisie = vue.getByLabelText('Réponse de Maman');
  fireEvent.change(saisie, { target: { value: 'Réponse ciblée' } });
  await soumettre(saisie.closest('form'));
  assert.equal(vue.commandes.at(-1).charge.demandeId, seconde.id);
  assert.deepEqual(vue.etat().players[reyes.personnageId].requests.map(d => d.status), ['pending', 'pending', 'answered']);
  assert.ok(vue.getByText('Demandes en attente : 2'));
});

test('classement et suppression de dossier passent par le moteur et une confirmation locale', async () => {
  const vue = installer(mj);
  await cliquer(vue.getByText('Dossiers', { selector: 'button' }));
  assert.equal(vue.getByText('Monter le dossier').disabled, true);
  await cliquer(vue.getByText('Descendre le dossier'));
  assert.deepEqual(vue.etat().documents.map(d => d.id), ['ordre', 'navigation', 'archive']);
  assert.equal(vue.getByLabelText('Dossier').value, 'navigation');
  const supprimer = vue.getByText('Supprimer le dossier'); assert.equal(supprimer.disabled, true);
  await cliquer(vue.getByLabelText('Confirmer la suppression du dossier'));
  await cliquer(supprimer);
  assert.deepEqual(vue.etat().documents.map(d => d.id), ['ordre', 'archive']);
  assert.equal(vue.getByLabelText('Dossier').value, 'archive');
  assert.equal(vue.getByText('Supprimer le dossier').disabled, true);
});

test('les dossiers et réglages utilisent les commandes v1 et préservent les codes exacts', async () => {
  const vue = installer(mj);
  await cliquer(vue.getByText('Dossiers', { selector: 'button' }));
  fireEvent.change(vue.getByLabelText('Dossier'), { target: { value: 'ordre' } });
  const code = vue.getByLabelText('Code du dossier');
  fireEvent.change(code, { target: { value: '0088' } });
  await soumettre(code.closest('form'));
  assert.equal(vue.etat().documents.find(d => d.id === 'ordre').code, '0088');
  await cliquer(vue.getByText('Réglages', { selector: 'button' }));
  const motDePasse = vue.getByLabelText('Mot de passe administrateur');
  assert.equal(motDePasse.type, 'password');
  fireEvent.change(vue.getByLabelText('Vaisseau'), { target: { value: 'USCSS NOSTROMO' } });
  await soumettre(motDePasse.closest('form'));
  assert.equal(vue.etat().config.vessel, 'USCSS NOSTROMO');
  assert.ok(!Object.hasOwn(vue.commandes.at(-1).charge, 'tracker'));
});

test('HACK brouille cinq secondes dès la saisie, sans résultat ni prolongation par une seconde demande', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000000 });
  const vue = installer(reyes), saisie = vue.getByLabelText('Commande ou /M votre question');
  fireEvent.change(saisie, { target: { value: 'HACK' } }); await soumettre(saisie.closest('form'));
  const signal = vue.etat().players[reyes.personnageId].cue;
  assert.equal(signal.duration, 5000);
  assert.ok(vue.getByRole('log').classList.contains('muthur-piratage-depart'));
  assert.ok(vue.getByText('INTRUSION EN COURS · ATTENTE DU MJ'));
  assert.equal(vue.queryByText('CONTRE-MESURES · ACCÈS REFUSÉ'), null);
  await act(async () => t.mock.timers.tick(3000));
  fireEvent.change(saisie, { target: { value: 'HACK' } }); await soumettre(saisie.closest('form'));
  assert.deepEqual(vue.etat().players[reyes.personnageId].cue, signal);
  await act(async () => t.mock.timers.tick(1999));
  assert.ok(vue.getByRole('log').classList.contains('muthur-piratage-depart'));
  await act(async () => t.mock.timers.tick(1));
  assert.equal(vue.getByRole('log').classList.contains('muthur-piratage'), false);
  assert.equal(vue.etat().players[reyes.personnageId].request.type, 'hack');
  assert.equal(vue.etat().players[reyes.personnageId].access, 'crew');
});

test('le départ rejoint son temps restant, s’arrête à la restauration et cède la place à l’arbitrage', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000000 });
  const etat = agir(moteur.creerEtat(), 'saisir', { texte: 'HACK' }, reyes);
  await act(async () => t.mock.timers.tick(2000));
  let vue = installer(reyes, etat);
  assert.equal(vue.getByRole('log').style.getPropertyValue('--muthur-piratage-decalage'), '-2000ms');
  assert.ok(vue.getByRole('log').classList.contains('muthur-piratage-depart'));
  vue.unmount(); vue = installer(reyes, moteur.migrerEtat(etat, 3));
  assert.equal(vue.getByRole('log').classList.contains('muthur-piratage'), false);
  vue.unmount(); vue = installer(mj, etat);
  await cliquer(vue.getByText('Repousser l’intrusion'));
  assert.ok(vue.getByRole('log').classList.contains('muthur-piratage-refuse'));
  assert.equal(vue.getByRole('log').classList.contains('muthur-piratage-depart'), false);
});

test('le refus perturbe le terminal et rejoint le temps restant après changement de vue', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000000 });
  const etat = agir(moteur.creerEtat(), 'saisir', { texte: 'HACK' }, reyes);
  let vue = installer(mj, etat);
  await cliquer(vue.getByText('Repousser l’intrusion'));
  assert.ok(vue.getByRole('log').classList.contains('muthur-piratage-refuse'));
  assert.equal(vue.etat().players[reyes.personnageId].access, 'crew');
  await act(async () => t.mock.timers.tick(3000));
  const apres = vue.etat(); vue.unmount();
  vue = installer(reyes, apres);
  assert.ok(vue.getByRole('log').classList.contains('muthur-piratage-refuse'));
  assert.equal(vue.getByRole('log').style.getPropertyValue('--muthur-piratage-decalage'), '-3000ms');
  assert.ok(vue.getByText('CONTRE-MESURES · ACCÈS REFUSÉ'));
  await act(async () => t.mock.timers.tick(3999));
  assert.ok(vue.getByRole('log').classList.contains('muthur-piratage'));
  await act(async () => t.mock.timers.tick(1));
  assert.equal(vue.getByRole('log').classList.contains('muthur-piratage'), false);
  assert.equal(vue.queryByText('CONTRE-MESURES · ACCÈS REFUSÉ'), null);
});

test('un ancien piratage ne se rejoue pas et un même instantané ne prolonge pas un nouveau refus', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000000 });
  let etat = agir(moteur.creerEtat(), 'saisir', { texte: 'HACK' }, reyes);
  etat = agir(etat, 'arbitrer-piratage', { personnageId: reyes.personnageId, reussite: false });
  await act(async () => t.mock.timers.tick(7001));
  const envoyerCommande = async () => ({ ok: true });
  const props = () => ({ vue: moteur.vuePour(etat, reyes), envoyerCommande });
  const vue = render(h(VueJoueur, props()));
  assert.equal(vue.getByRole('log').classList.contains('muthur-piratage'), false);
  etat = agir(etat, 'saisir', { texte: 'HACK' }, reyes);
  etat = agir(etat, 'arbitrer-piratage', { personnageId: reyes.personnageId, reussite: false });
  vue.rerender(h(VueJoueur, props()));
  assert.ok(vue.getByRole('log').classList.contains('muthur-piratage-refuse'));
  await act(async () => t.mock.timers.tick(2000));
  vue.rerender(h(VueJoueur, props()));
  assert.equal(vue.getByRole('log').style.getPropertyValue('--muthur-piratage-decalage'), '0ms');
  await act(async () => t.mock.timers.tick(5000));
  assert.equal(vue.getByRole('log').classList.contains('muthur-piratage'), false);
});

test('le MJ peut essayer une commande pour l’opérateur sélectionné', async () => {
  const etat = agir(moteur.creerEtat(), 'preparer-operateur', { personnageId: reyes.personnageId, nom: 'Reyes' });
  const vue = installer(mj, etat);
  const saisie = vue.getByLabelText('Commande de test pour cet opérateur');
  fireEvent.change(saisie, { target: { value: 'CODE 0042' } });
  assert.equal(saisie.type, 'password');
  await soumettre(saisie.closest('form'));
  assert.deepEqual(vue.commandes.at(-1), { id: 'saisir', charge: { personnageId: reyes.personnageId, texte: 'CODE 0042' } });
  assert.ok(vue.etat().players[reyes.personnageId].unlocked.includes('ordre'));
});

test('le MJ peut lire et remasquer les codes sans soumettre le formulaire ni perdre les zéros', async () => {
  const vue = installer(mj);
  await cliquer(vue.getByText('Protocoles', { selector: 'button' }));
  const protocole = vue.getByLabelText('Code du protocole');
  assert.equal(protocole.type, 'password');
  await cliquer(vue.getByRole('button', { name: 'Afficher le code du protocole' }));
  assert.equal(protocole.type, 'text'); assert.equal(protocole.value, 'PORTES-OUVRIR');
  fireEvent.change(protocole, { target: { value: '0007' } });
  await cliquer(vue.getByRole('button', { name: 'Masquer le code du protocole' }));
  assert.equal(protocole.type, 'password'); assert.equal(protocole.value, '0007');
  assert.equal(vue.commandes.length, 0);
  await cliquer(vue.getByRole('button', { name: 'Afficher le code du protocole' }));
  fireEvent.change(vue.getByLabelText('Protocole'), { target: { value: 'autodestruction' } });
  assert.equal(vue.getByLabelText('Code du protocole').type, 'password');
  await cliquer(vue.getByText('Dossiers', { selector: 'button' }));
  fireEvent.change(vue.getByLabelText('Dossier'), { target: { value: 'ordre' } });
  await cliquer(vue.getByRole('button', { name: 'Afficher le code du dossier' }));
  assert.equal(vue.getByLabelText('Code du dossier').type, 'text');
  assert.equal(vue.getByLabelText('Code du dossier').value, '0042');
  await cliquer(vue.getByRole('button', { name: 'Masquer le code du dossier' }));
  assert.equal(vue.getByLabelText('Code du dossier').type, 'password');
  fireEvent.change(vue.getByLabelText('Dossier'), { target: { value: 'navigation' } });
  assert.equal(vue.getByRole('button', { name: 'Afficher le code du dossier' }).disabled, true);
  assert.equal(vue.commandes.length, 0);
  await cliquer(vue.getByText('Réglages', { selector: 'button' }));
  const motDePasse = vue.getByLabelText('Mot de passe administrateur');
  assert.equal(motDePasse.type, 'password');
  await cliquer(vue.getByRole('button', { name: 'Afficher le mot de passe administrateur' }));
  assert.equal(motDePasse.type, 'text'); assert.equal(motDePasse.value, 'PROMETHEUS');
  fireEvent.change(motDePasse, { target: { value: '0007' } });
  await cliquer(vue.getByRole('button', { name: 'Masquer le mot de passe administrateur' }));
  assert.equal(motDePasse.type, 'password'); assert.equal(motDePasse.value, '0007');
  assert.equal(vue.commandes.length, 0);
  await cliquer(vue.getByRole('button', { name: 'Afficher le mot de passe administrateur' }));
  await cliquer(vue.getByText('Terminal', { selector: 'button' }));
  await cliquer(vue.getByText('Réglages', { selector: 'button' }));
  assert.equal(vue.getByLabelText('Mot de passe administrateur').type, 'password');
  vue.unmount(); const joueur = installer(reyes);
  assert.equal(joueur.queryByRole('button', { name: /Afficher le code/ }), null);
  assert.equal(joueur.queryByRole('button', { name: /Afficher le mot de passe/ }), null);
});

test('Nouveau dossier ouvre un formulaire vide et sélectionne le dossier créé sans remplacer les exemples', async () => {
  const vue = installer(mj);
  await cliquer(vue.getByText('Dossiers', { selector: 'button' }));
  assert.equal(vue.getByLabelText('Identifiant du dossier').readOnly, true);
  fireEvent.change(vue.getByLabelText('Dossier'), { target: { value: '' } });
  assert.equal(vue.getByLabelText('Titre').value, '');
  assert.equal(vue.getByLabelText('Code du dossier').disabled, true);
  fireEvent.change(vue.getByLabelText('Identifiant du dossier'), { target: { value: 'rapport-medical' } });
  fireEvent.change(vue.getByLabelText('Titre'), { target: { value: 'Rapport médical' } });
  fireEvent.change(vue.getByLabelText('Protection'), { target: { value: 'code' } });
  assert.equal(vue.getByLabelText('Code du dossier').required, true);
  fireEvent.change(vue.getByLabelText('Code du dossier'), { target: { value: '0087' } });
  fireEvent.change(vue.getByLabelText('Contenu'), { target: { value: 'Quarantaine maintenue.' } });
  await soumettre(vue.getByRole('form', { name: 'Créer un dossier' }));
  assert.equal(vue.etat().documents.length, 4);
  assert.equal(vue.getByLabelText('Dossier').value, 'rapport-medical');
  assert.equal(vue.getByLabelText('Identifiant du dossier').readOnly, true);
  assert.ok(vue.getByText('Commande de lecture : READ rapport-medical'));
  fireEvent.change(vue.getByLabelText('Contenu'), { target: { value: 'Rapport mis à jour.' } });
  await soumettre(vue.getByRole('form', { name: 'Modifier le dossier' }));
  assert.equal(vue.etat().documents.length, 4);
  assert.equal(vue.etat().documents.at(-1).body, 'Rapport mis à jour.');
  fireEvent.change(vue.getByLabelText('Dossier'), { target: { value: '' } });
  assert.equal(vue.getByLabelText('Contenu').value, '');
});

test('un refus de création garde le nouveau dossier en brouillon et ne remplace pas un dossier existant', async () => {
  const vue = installer(mj);
  await cliquer(vue.getByText('Dossiers', { selector: 'button' }));
  fireEvent.change(vue.getByLabelText('Dossier'), { target: { value: '' } });
  fireEvent.change(vue.getByLabelText('Identifiant du dossier'), { target: { value: 'navigation' } });
  fireEvent.change(vue.getByLabelText('Titre'), { target: { value: 'Nouveau rapport' } });
  fireEvent.change(vue.getByLabelText('Contenu'), { target: { value: 'Brouillon conservé.' } });
  await soumettre(vue.getByRole('form', { name: 'Créer un dossier' }));
  assert.ok(vue.getByRole('alert'));
  assert.equal(vue.etat().documents.length, 3);
  assert.equal(vue.etat().documents[0].title, 'Rapport de navigation');
  assert.equal(vue.getByLabelText('Contenu').value, 'Brouillon conservé.');
  assert.equal(vue.getByLabelText('Identifiant du dossier').readOnly, false);
});

test('la réinitialisation du pupitre exige sa confirmation locale', async () => {
  const etat = agir(moteur.creerEtat(), 'saisir', { texte: 'STATUS' }, reyes);
  const vue = installer(mj, etat);
  await cliquer(vue.getByText('Réglages', { selector: 'button' }));
  const reinitialiser = vue.getByText('Réinitialiser MU/TH/UR');
  assert.equal(reinitialiser.disabled, true);
  await cliquer(vue.getByLabelText('Confirmer la réinitialisation'));
  assert.equal(reinitialiser.disabled, false);
  await cliquer(reinitialiser);
  assert.equal(vue.etat().players[reyes.personnageId].messages.length, 0);
  assert.equal(vue.getByLabelText('Confirmer la réinitialisation').checked, false);
});

test('le son exige un clic et son contexte est fermé au démontage', async () => {
  let creations = 0, fermetures = 0, resumes = 0;
  const descripteur = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  class AudioFictif {
    constructor() { creations++; this.state = 'suspended'; }
    async resume() { resumes++; this.state = 'running'; }
    async close() { fermetures++; this.state = 'closed'; }
  }
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: AudioFictif });
  try {
    const vue = installer(reyes);
    assert.equal(creations, 0);
    await cliquer(vue.getByText('Activer le son'));
    assert.equal(creations, 1); assert.equal(resumes, 1);
    vue.unmount(); assert.equal(fermetures, 1);
  } finally {
    if (descripteur) Object.defineProperty(globalThis, 'AudioContext', descripteur); else delete globalThis.AudioContext;
  }
});

test('le compte à rebours libère sa minuterie à la fermeture de la vue', () => {
  const originalCreer = globalThis.setInterval, originalRetirer = globalThis.clearInterval;
  const minuteries = new Set();
  globalThis.setInterval = (...args) => { const id = originalCreer(...args); minuteries.add(id); return id; };
  globalThis.clearInterval = id => { minuteries.delete(id); originalRetirer(id); };
  try {
    const etat = agir(moteur.creerEtat(), 'compte-a-rebours', { minutes: 5 });
    const vue = installer(reyes, etat);
    assert.equal(minuteries.size, 1); assert.ok(vue.getByRole('timer'));
    vue.unmount(); assert.equal(minuteries.size, 0);
  } finally {
    for (const id of minuteries) originalRetirer(id);
    globalThis.setInterval = originalCreer; globalThis.clearInterval = originalRetirer;
  }
});

test('le pupitre crée un code avec message et effet, puis peut le supprimer', async () => {
  const vue = installer(mj);
  await cliquer(vue.getByText('Protocoles', { selector: 'button' }));
  fireEvent.change(vue.getByLabelText('Protocole'), { target: { value: 'nouveau' } });
  fireEvent.change(vue.getByLabelText('Nom du protocole'), { target: { value: 'Ouvrir la soute' } });
  fireEvent.change(vue.getByLabelText('Code du protocole'), { target: { value: '0009' } });
  fireEvent.change(vue.getByLabelText('Message type'), { target: { value: 'La soute est ouverte.' } });
  fireEvent.change(vue.getByLabelText('Effet du protocole'), { target: { value: 'ouvrir-portes' } });
  await cliquer(vue.getByLabelText('Code actif'));
  await soumettre(vue.getByRole('form', { name: 'Modifier le protocole' }));
  const cree = vue.etat().protocoles.find(pr => pr.code === '0009');
  assert.equal(cree.effet, 'ouvrir-portes'); assert.equal(cree.actif, true);
  fireEvent.change(vue.getByLabelText('Protocole'), { target: { value: cree.id } });
  await cliquer(vue.getByLabelText('Confirmer la suppression du protocole'));
  await cliquer(vue.getByText('Supprimer le protocole'));
  assert.ok(!vue.etat().protocoles.some(pr => pr.id === cree.id));
});

test('le code d’autodestruction transforme le terminal et le code d’annulation le restaure', async () => {
  const vue = installer(reyes);
  const saisir = async texte => {
    const champ = vue.getByLabelText('Commande ou /M votre question');
    fireEvent.change(champ, { target: { value: texte } }); await soumettre(champ.closest('form'));
  };
  await saisir('CODE OMEGA-10');
  assert.ok(vue.getByRole('region', { name: 'Alerte autodestruction' }));
  assert.ok(vue.container.querySelector('.muthur-autodestruction'));
  assert.match(vue.getByRole('timer').textContent, /^(12:56|12:55)$/);
  assert.ok(vue.getByLabelText('Séquence d’alerte du Nostromo'));
  assert.ok(!vue.container.textContent.includes('OMEGA-STOP'));
  await saisir('CODE OMEGA-STOP');
  assert.equal(vue.queryByRole('region', { name: 'Alerte autodestruction' }), null);
  assert.equal(vue.container.querySelector('.muthur-autodestruction'), null);
  assert.equal(vue.queryByLabelText('Séquence d’alerte du Nostromo'), null);
});

test('le bouton de diffusion réserve cet appareil sans envoyer son identité dans la charge', async () => {
  const vue = installer(reyes);
  await cliquer(vue.getByText('Diffuser l’alarme ici'));
  assert.deepEqual(vue.commandes[0], { id: 'choisir-diffusion', charge: { actif: true } });
  assert.equal(vue.etat().diffusionAlarme, reyes.appareilId);
  assert.ok(vue.getByText('Ne plus diffuser ici'));
  await cliquer(vue.getByText('Ne plus diffuser ici'));
  assert.equal(vue.etat().diffusionAlarme, null);
});

test('la bande-son du film a la priorité, puis la sirène reprend si du temps reste', async () => {
  const alarmeOriginale = globalThis.AlienAlarme, audioOriginal = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  const autorisations = [];
  globalThis.AlienAlarme = { creer: () => ({ suivre: (_sequence, _fin, autorise) => autorisations.push(autorise), arreter() {}, detruire() {} }) };
  class AudioFictif { state = 'suspended'; async resume() { this.state = 'running'; } async close() { this.state = 'closed'; } }
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: AudioFictif });
  try {
    let etat = moteur.creerEtat();
    const protocole = { ...etat.protocoles.find(pr => pr.effet === 'autodestruction'), minutes: 15 };
    etat = agir(etat, 'enregistrer-protocole', { protocole });
    etat = agir(etat, 'saisir', { texte: 'CODE OMEGA-10' }, reyes);
    etat = agir(etat, 'choisir-diffusion', { actif: true }, reyes);
    const vue = installer(reyes, etat);
    await cliquer(vue.getByText('Activer le son'));
    const video = vue.getByLabelText('Séquence d’alerte du Nostromo');
    assert.equal(video.muted, false);
    assert.ok(autorisations.length && autorisations.every(autorise => !autorise));
    await act(async () => fireEvent.ended(video));
    assert.equal(autorisations.at(-1), true); assert.equal(video.muted, true);
    vue.unmount();
  } finally {
    globalThis.AlienAlarme = alarmeOriginale;
    if (audioOriginal) Object.defineProperty(globalThis, 'AudioContext', audioOriginal); else delete globalThis.AudioContext;
  }
});
