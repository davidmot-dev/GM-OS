import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as maman from './moteur.mjs';
import * as radar from '../detecteur/moteur.mjs';
import { extraireConfiguration, etatDepuisConfiguration } from './configuration.mjs';
const mj = { role: 'mj' }, alice = { role: 'joueur', personnageId: 'alice' }, bob = { role: 'joueur', personnageId: 'bob' };
const agir = (e, id, charge, role = mj) => maman.appliquerCommande(e, { id, charge }, role);
const saisir = (e, texte, role = alice) => agir(e, 'saisir', { texte }, role);
const detecter = (e, id, charge, role = mj) => radar.appliquerCommande(e, { id, charge }, role);

test('classer et supprimer garde l’ordre portable et retire les anciennes autorisations', () => {
  let e = saisir(maman.creerEtat(), 'CODE 0042');
  e = agir(e, 'classer-dossiers', { dossierIds: ['archive', 'ordre', 'navigation'] });
  assert.deepEqual(etatDepuisConfiguration(extraireConfiguration(e)).documents.map(d => d.id), ['archive', 'ordre', 'navigation']);
  const avant = structuredClone(e);
  for (const ids of [['ordre'], ['ordre', 'ordre', 'navigation'], ['inconnu', 'ordre', 'navigation']]) assert.throws(() => agir(e, 'classer-dossiers', { dossierIds: ids }));
  assert.deepEqual(e, avant);
  assert.throws(() => agir(e, 'supprimer-dossier', { dossierId: 'ordre' }, alice));
  e = agir(e, 'supprimer-dossier', { dossierId: 'ordre' });
  assert.deepEqual(e.players.alice.unlocked, []);
  assert.ok(!maman.vuePour(e, alice).documents.some(d => d.id === 'ordre'));
  e = agir(e, 'supprimer-dossier', { dossierId: 'archive' });
  e = agir(e, 'supprimer-dossier', { dossierId: 'navigation' });
  assert.deepEqual(etatDepuisConfiguration(extraireConfiguration(e)).documents, []);
});

test('questions et hack se traitent séparément, hors ordre et sans divulgation à un autre PJ', () => {
  let e = saisir(maman.creerEtat(), '/M Où est le signal ?');
  e = saisir(e, 'HACK'); e = saisir(e, '/M Quel secteur ?');
  const [premiere, hack, seconde] = e.players.alice.requests;
  e = saisir(e, 'CLEAR');
  assert.equal(e.players.alice.messages.length, 0); assert.equal(e.players.alice.requests.length, 3);
  e = agir(e, 'repondre', { personnageId: 'alice', demandeId: seconde.id, texte: 'Secteur sept.' });
  assert.equal(e.players.alice.requests[2].status, 'answered');
  assert.equal(e.players.alice.requests[0].status, 'pending');
  const avant = structuredClone(e);
  for (const demandeId of [seconde.id, hack.id, 'inconnue']) assert.throws(() => agir(e, 'repondre', { personnageId: 'alice', demandeId, texte: 'Répétition interdite.' }));
  assert.deepEqual(e, avant);
  e = saisir(e, '/M Question de Bob', bob);
  assert.throws(() => agir(e, 'repondre', { personnageId: 'bob', demandeId: premiere.id, texte: 'Mauvais destinataire.' }));
  e = agir(e, 'arbitrer-piratage', { personnageId: 'alice', demandeId: hack.id, reussite: false });
  assert.equal(e.players.alice.request.id, premiere.id);
  e = agir(e, 'repondre', { personnageId: 'alice', demandeId: null, texte: 'Message libre.' });
  assert.equal(e.players.alice.requests[0].status, 'pending');
  assert.ok(!JSON.stringify(maman.vuePour(e, bob)).includes('Quel secteur'));
  assert.deepEqual(maman.migrerEtat(e, 4).players.alice.requests, e.players.alice.requests);
  e = agir(e, 'revoquer', { personnageId: 'alice' });
  assert.equal(e.players.alice.requests[0].status, 'cancelled'); assert.equal(e.players.alice.request, null);
});

test('la file refuse le débordement sans mutation et borne seulement son historique traité', () => {
  let e = maman.creerEtat();
  for (let i = 0; i < 32; i++) e = saisir(e, '/M Question ' + i);
  const avant = structuredClone(e);
  assert.throws(() => saisir(e, '/M Question en trop')); assert.deepEqual(e, avant);
  for (let i = 0; i < 140; i++) {
    const d = e.players.alice.requests.find(d => d.status === 'pending');
    e = agir(e, 'repondre', { personnageId: 'alice', demandeId: d.id, texte: 'Réponse ' + i });
    e = saisir(e, '/M Suite ' + i);
  }
  assert.equal(e.players.alice.requests.length, 128);
  assert.equal(e.players.alice.requests.filter(d => d.status === 'pending').length, 32);
});

test('migration v2 : récupère la demande survivante et son texte sans modifier l’original', () => {
  const e = saisir(maman.creerEtat(), '/M Demande ancienne');
  delete e.players.alice.requests; delete e.actes; e.version = 2;
  const avant = structuredClone(e), migre = maman.migrerEtat(e, 2);
  assert.deepEqual(e, avant); assert.equal(migre.version, 4);
  assert.equal(migre.players.alice.requests[0].content, 'Demande ancienne');
  e.players.alice.messages = [];
  assert.match(maman.migrerEtat(e, 2).players.alice.requests[0].content, /indisponible/);
  e.players.alice.requests = [];
  assert.throws(() => maman.migrerEtat(e, 2));
});

test('préréglages nommés : capture, rappel en veille, conservation et confidentialité', () => {
  let e = detecter(radar.creerEtat(), 'configurer', { contacts: 7, proximite: 81, intensite: 95, volume: 60, parasites: 43 });
  e = detecter(e, 'enregistrer-prereglage', { prereglageId: 'couloir', nom: 'Couloir sombre' });
  e = detecter(e, 'configurer', { contacts: 1, volume: 0 });
  e = detecter(detecter(e, 'scanner', { actif: true }), 'faux-echo', {});
  const graine = e.tracker.seed;
  e = detecter(e, 'rappeler-prereglage', { prereglageId: 'couloir' });
  assert.equal(e.tracker.contacts, 7); assert.equal(e.tracker.volume, 60);
  assert.equal(e.tracker.seed, graine); assert.equal(e.tracker.power, false); assert.equal(e.tracker.anomalyUntil, 0);
  assert.deepEqual(radar.migrerEtat(JSON.parse(JSON.stringify(e)), 3).prereglages, e.prereglages);
  assert.equal(radar.vuePour(e, alice).prereglages, undefined);
  assert.equal(radar.vuePour(e, mj).prereglages[0].nom, 'Couloir sombre');
  const avant = structuredClone(e);
  for (const charge of [{ prereglageId: 'autre', nom: 'COULOIR SOMBRE' }, { prereglageId: 'couloir', nom: ' ' }]) assert.throws(() => detecter(e, 'enregistrer-prereglage', charge));
  assert.throws(() => detecter(e, 'rappeler-prereglage', { prereglageId: 'couloir' }, alice));
  assert.throws(() => detecter(e, 'supprimer-prereglage', { prereglageId: 'inconnu' })); assert.deepEqual(e, avant);
  e = detecter(e, 'enregistrer-prereglage', { prereglageId: 'couloir', nom: 'Pont' });
  assert.equal(e.prereglages.length, 1); assert.equal(e.prereglages[0].nom, 'Pont');
  e = detecter(e, 'supprimer-prereglage', { prereglageId: 'couloir' }); assert.deepEqual(e.prereglages, []);
});

test('migration détecteur v1 stricte, sans démarrage ni perte des réglages', () => {
  const e = detecter(radar.creerEtat(), 'scanner', { actif: true });
  e.version = 1; delete e.prereglages; delete e.discret;
  const avant = structuredClone(e), migre = radar.migrerEtat(e, 1);
  assert.deepEqual(e, avant); assert.equal(migre.version, 3); assert.deepEqual(migre.prereglages, []); assert.equal(migre.tracker.power, false);
  assert.throws(() => radar.migrerEtat({ ...e, intrus: true }, 1));
});
