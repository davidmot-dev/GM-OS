import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validerLeManifeste, validerLesReferences } from './valider.mjs';
import * as moteur from './exemple/moteur.mjs';

const manifeste = JSON.parse(await readFile(new URL('./exemple/manifeste.json', import.meta.url), 'utf8'));
const copie = valeur => JSON.parse(JSON.stringify(valeur));
const mj = { role: 'mj' }, reyes = { role: 'joueur', personnageId: 'pj-reyes' }, sato = { role: 'joueur', personnageId: 'pj-sato' };
const publier = texte => ({ id: 'publier', charge: { texte } });
const accuser = { id: 'accuser-lecture', charge: {} };

test('le manifeste de référence est conforme et son catalogue de commandes correspond au moteur', () => {
  assert.deepEqual(validerLeManifeste(manifeste), []);
  for (const commande of manifeste.commandes) {
    assert.deepEqual(commande.roles, commande.id === 'publier' ? ['mj'] : ['joueur']);
  }
});

test('le format refuse versions inconnues, valeurs invalides et champs sans contrat', () => {
  for (const valeur of [null, [], 'texte', 1]) assert.ok(validerLeManifeste(valeur).length);
  const variantes = [
    { versionContrat: 2 }, { id: '../alien' }, { libelle: ' ' }, { version: '1' },
    { versionDonnees: 0 }, { versionDonnees: 1.5 }, { corpusCompatibles: [] },
    { corpusCompatibles: ['alien', 'alien'] }, { corpusCompatibles: ['*'] },
    { commandes: [{ id: 'publier', roles: ['admin'] }] },
    { commandes: [{ id: 'publier', roles: ['mj', 'mj'] }] },
    { commandes: [manifeste.commandes[0], manifeste.commandes[0]] },
    { entry: 'https://example.invalid/module.js' },
  ];
  for (const variante of variantes) assert.ok(validerLeManifeste({ ...copie(manifeste), ...variante }).length, JSON.stringify(variante));
  const incomplet = copie(manifeste); delete incomplet.id;
  assert.ok(validerLeManifeste(incomplet).length);
});

test('les anciens pilotes et la liste vide restent valides ; doublons et paramètres privés sont refusés', () => {
  for (const references of [undefined, [], [{ id: 'alien-muthur', libelle: 'Maman' }]]) assert.deepEqual(validerLesReferences(references), []);
  for (const references of [null, {}, [{ id: 'alien-muthur', code: '0042' }], [{ id: 'alien-muthur' }, { id: 'alien-muthur' }]]) assert.ok(validerLesReferences(references).length);
});

test('publier puis accuser sa lecture ne révèle pas les lectures des autres PJ', () => {
  const initial = moteur.creerEtat();
  const publie = moteur.appliquerCommande(initial, publier('Bienvenue à bord.'), mj);
  const lu = moteur.appliquerCommande(publie, accuser, reyes);
  assert.deepEqual(initial, { texte: '', lectures: {} });
  assert.deepEqual(publie.lectures, {});
  assert.deepEqual(moteur.vuePour(lu, reyes), { texte: 'Bienvenue à bord.', lu: true });
  assert.deepEqual(moteur.vuePour(lu, sato), { texte: 'Bienvenue à bord.', lu: false });
  assert.deepEqual(moteur.vuePour(lu, mj).lectures, { 'pj-reyes': true });
});

test('un joueur ne publie pas, ne choisit pas un autre PJ et une commande inconnue est refusée', () => {
  const etat = moteur.appliquerCommande(moteur.creerEtat(), publier('Message'), mj);
  assert.throws(() => moteur.appliquerCommande(etat, publier('Faux message MJ'), reyes));
  assert.throws(() => moteur.appliquerCommande(etat, { id: 'accuser-lecture', charge: { personnageId: 'pj-sato' } }, reyes));
  assert.throws(() => moteur.appliquerCommande(etat, accuser, { role: 'joueur' }));
  assert.throws(() => moteur.appliquerCommande(etat, { id: 'effacer', charge: {} }, mj));
  assert.throws(() => moteur.vuePour(etat, { role: 'admin' }));
});

test('les paramètres invalides sont refusés et un nouveau texte retire les anciennes lectures', () => {
  const etat = moteur.appliquerCommande(moteur.creerEtat(), publier('Premier'), mj);
  for (const texte of ['', ' ', 42, 'x'.repeat(2001)]) assert.throws(() => moteur.appliquerCommande(etat, publier(texte), mj));
  const lu = moteur.appliquerCommande(etat, accuser, reyes);
  assert.deepEqual(moteur.appliquerCommande(lu, publier('Deuxième'), mj).lectures, {});
});

test('restauration et projection ne partagent pas de référence ; les données illisibles restent refusées', () => {
  const etat = moteur.appliquerCommande(moteur.creerEtat(), publier('À conserver'), mj);
  const restaure = moteur.migrerEtat(JSON.parse(JSON.stringify(etat)), 1);
  const vue = moteur.vuePour(restaure, mj); vue.texte = 'Retouché';
  assert.equal(restaure.texte, 'À conserver');
  assert.deepEqual(moteur.arreterEffets(restaure), etat);
  assert.throws(() => moteur.migrerEtat(etat, 2));
  assert.throws(() => moteur.migrerEtat({ texte: 'Incomplet' }, 1));
});

test('le CLI rend un statut utilisable et refuse les doublons de manifeste', () => {
  const cli = fileURLToPath(new URL('./valider.mjs', import.meta.url));
  const fichier = fileURLToPath(new URL('./exemple/manifeste.json', import.meta.url));
  const lancer = args => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', windowsHide: true });
  assert.equal(lancer([fichier]).status, 0);
  const doublon = lancer([fichier, fichier]);
  assert.equal(doublon.status, 1); assert.match(doublon.stdout, /REFUSÉ/);
  assert.equal(lancer([fileURLToPath(new URL('./absent.json', import.meta.url))]).status, 1);
  assert.equal(lancer([]).status, 2);
});
