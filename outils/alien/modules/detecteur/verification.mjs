import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validerLeManifeste } from '../../../modules-du-jeu/contrat.mjs';
import * as moteur from './moteur.mjs';
const mj = { role: 'mj' }, joueur = { role: 'joueur', personnageId: 'reyes' };
const agir = (etat, id, charge, lecteur = mj) => moteur.appliquerCommande(etat, { id, charge }, lecteur);

test('manifeste conforme et état indépendant sans secrets du terminal', async () => {
  assert.deepEqual(validerLeManifeste(JSON.parse(await readFile(new URL('./manifeste.json', import.meta.url), 'utf8'))), []);
  const etat = moteur.creerEtat(); moteur.validerEtat(etat);
  assert.equal(etat.tracker.power, false);
  for (const lecteur of [mj, joueur]) {
    const vue = moteur.vuePour(etat, lecteur);
    for (const secret of ['players', 'documents', 'adminPassword', 'protocoles', 'countdown']) assert.ok(!JSON.stringify(vue).includes(secret));
    vue.tracker.contacts = 9; assert.equal(etat.tracker.contacts, 3);
  }
});
test('scan et faux écho réutilisent le cœur sans muter la préparation reçue', t => {
  t.mock.method(Math, 'random', () => .5); t.mock.method(Date, 'now', () => 10000);
  const depart = moteur.creerEtat(), avant = structuredClone(depart);
  const actif = agir(depart, 'scanner', { actif: true });
  assert.deepEqual(depart, avant); assert.notEqual(actif.tracker.seed, depart.tracker.seed);
  const regle = agir(actif, 'configurer', { contacts: 9, proximite: 100, volume: 0, intensite: 90 });
  assert.equal(regle.tracker.seed, actif.tracker.seed); assert.equal(regle.tracker.power, true);
  const echo = agir(regle, 'faux-echo', {});
  assert.equal(echo.tracker.anomalyUntil, 19000); assert.equal(echo.tracker.seed, actif.tracker.seed);
  assert.equal(globalThis.AlienCore.positionsDuDetecteur(echo.tracker, true).length, 10);
  const arrete = agir(echo, 'scanner', { actif: false });
  assert.equal(arrete.tracker.anomalyUntil, 0); assert.equal(arrete.tracker.contacts, 9);
  assert.notEqual(agir(arrete, 'scanner', { actif: true }).tracker.seed, actif.tracker.seed);
});
test('aucune commande joueur ni identité/destinataire fournis dans la charge ne passe', () => {
  const etat = moteur.creerEtat(), avant = structuredClone(etat);
  for (const [id, charge] of [['configurer', { contacts: 9 }], ['scanner', { actif: true }], ['faux-echo', {}]]) assert.throws(() => agir(etat, id, charge, joueur));
  for (const [id, charge] of [['scanner', { actif: true, personnageId: 'bob' }], ['configurer', { target: 'all' }], ['configurer', { contacts: 3.5 }], ['configurer', { proximite: NaN }], ['configurer', { volume: 101 }], ['scanner', { actif: 1 }], ['faux-echo', {}]]) assert.throws(() => agir(etat, id, charge));
  assert.deepEqual(etat, avant);
});
test('reprise et coupure conservent les réglages et effacent scan et faux écho', () => {
  let etat = agir(moteur.creerEtat(), 'configurer', { contacts: 7, parasites: 50, crt: false, effetsParasites: false });
  etat = agir(agir(etat, 'scanner', { actif: true }), 'faux-echo', {});
  const restaure = moteur.migrerEtat(JSON.parse(JSON.stringify(etat)), 4);
  assert.equal(restaure.tracker.power, false); assert.equal(restaure.tracker.anomalyUntil, 0);
  assert.equal(restaure.tracker.contacts, 7); assert.equal(restaure.tracker.noise, 50); assert.equal(restaure.config.crt, false);
  assert.deepEqual(moteur.arreterEffets(restaure), restaure);
  assert.throws(() => moteur.migrerEtat(etat, 99));
  assert.throws(() => moteur.migrerEtat({ ...etat, documents: [] }, 1));
});
