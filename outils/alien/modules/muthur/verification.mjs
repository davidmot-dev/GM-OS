import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validerLeManifeste } from '../../../modules-du-jeu/valider.mjs';
import * as module from './moteur.mjs';
import { createTable } from '../../server.mjs';
import * as definition from './index.mjs';

const manifeste = JSON.parse(await readFile(new URL('./manifeste.json', import.meta.url), 'utf8'));
const mj = { role: 'mj' }, reyes = { role: 'joueur', personnageId: 'pj-reyes' }, sato = { role: 'joueur', personnageId: 'pj-sato' };
const agir = (etat, id, charge = {}, contexte = mj) => module.appliquerCommande(etat, { id, charge }, contexte);
const saisir = (etat, texte, contexte = reyes) => agir(etat, 'saisir', { texte }, contexte);
const copie = valeur => JSON.parse(JSON.stringify(valeur));

test('manifeste et fonctions obligatoires v1 sont présents', () => {
  assert.deepEqual(validerLeManifeste(manifeste), []);
  for (const nom of ['creerEtat', 'validerEtat', 'migrerEtat', 'appliquerCommande', 'vuePour', 'arreterEffets']) assert.equal(typeof module[nom], 'function');
  module.validerEtat(module.creerEtat());
  assert.deepEqual(definition.manifeste, manifeste);
  assert.equal(typeof definition.VueJoueur, 'function'); assert.equal(typeof definition.PupitreMJ, 'function');
  assert.equal(definition.moteur.creerEtat, module.creerEtat);
});

test('ouvrir un terminal ne modifie pas la sauvegarde et crée une vue sans secrets ni radar', () => {
  const etat = module.creerEtat(), avant = copie(etat);
  const vue = module.vuePour(etat, reyes);
  assert.deepEqual(etat, avant);
  assert.equal(vue.player.id, reyes.personnageId);
  assert.equal(vue.revision, etat.revision);
  assert.equal(vue.config.adminPassword, undefined);
  assert.equal(vue.config.status, undefined);
  assert.equal(vue.tracker, undefined);
  assert.deepEqual(vue.documents.map(d => d.id), ['navigation']);
  assert.ok(vue.documents.every(d => !Object.hasOwn(d, 'code')));
});

test('les codes conservent leurs zéros ; le déverrouillage reste privé', () => {
  const etat = saisir(module.creerEtat(), 'CODE 42');
  assert.equal(module.vuePour(etat, reyes).documents.length, 1);
  const ouvert = saisir(etat, 'CODE 0042');
  assert.deepEqual(module.vuePour(ouvert, reyes).documents.map(d => d.id), ['navigation', 'ordre']);
  assert.deepEqual(module.vuePour(ouvert, sato).documents.map(d => d.id), ['navigation']);
  assert.ok(!JSON.stringify(module.vuePour(ouvert, reyes)).includes('0042'));
});

test('le MJ ajoute des dossiers équipage, codés et administrateur sans divulguer leurs contenus privés', () => {
  let etat = module.creerEtat(); const avant = copie(etat);
  const creer = (dossierId, acces, code = '') => { etat = agir(etat, 'creer-dossier', { dossierId, titre: 'Rapport ' + dossierId, contenu: 'Contenu ' + dossierId, acces, code }); };
  creer('medical', 'equipage'); creer('recherche', 'code', '0087'); creer('commandement', 'administrateur');
  assert.deepEqual(module.creerEtat(), avant);
  assert.equal(etat.documents.length, 6); assert.equal(etat.revision, avant.revision + 3);
  const joueur = module.vuePour(etat, reyes);
  assert.ok(joueur.documents.some(d => d.id === 'medical'));
  assert.ok(!JSON.stringify(joueur).includes('Contenu recherche'));
  assert.ok(!JSON.stringify(joueur).includes('Contenu commandement'));
  etat = saisir(etat, 'CODE 0087');
  assert.ok(module.vuePour(etat, reyes).documents.some(d => d.id === 'recherche'));
  assert.ok(!module.vuePour(etat, sato).documents.some(d => d.id === 'recherche'));
  etat = saisir(etat, 'READ RECHERCHE');
  assert.equal(module.vuePour(etat, reyes).player.messages.at(-1).content.includes('Contenu recherche'), true);
  assert.ok(!JSON.stringify(module.vuePour(etat, reyes)).includes('0087'));
  etat = saisir(etat, 'LOGIN PROMETHEUS');
  assert.ok(module.vuePour(etat, reyes).documents.some(d => d.id === 'commandement'));
});

test('création de dossier : doublons READ, limites, codes réservés et données invalides sont refusés sans mutation', () => {
  const initial = module.creerEtat();
  const charge = { dossierId: 'medical', titre: 'Rapport médical', contenu: 'Rapport privé.', acces: 'code', code: '0087' };
  const variantes = [
    { dossierId: 'navigation' }, { dossierId: 'constructor' }, { dossierId: '../medical' }, { dossierId: 'rapport medical' },
    { dossierId: 'Medical' }, { titre: ' ' }, { titre: 'x'.repeat(81) }, { contenu: 'x'.repeat(10001) },
    { acces: 'inconnu' }, { code: ' ' }, { code: 'OMEGA-10' }, { intrus: true },
  ];
  for (const variante of variantes) {
    const avant = copie(initial);
    assert.throws(() => agir(initial, 'creer-dossier', { ...charge, ...variante }));
    assert.deepEqual(initial, avant);
  }
  const ancien = copie(initial); ancien.documents[0].id = 'Navigation';
  assert.throws(() => agir(ancien, 'creer-dossier', { ...charge, dossierId: 'navigation' }), /existe déjà/);
  const plein = copie(initial);
  while (plein.documents.length < 256) plein.documents.push({ id: 'dossier-' + plein.documents.length, title: '', access: 'crew', code: '', body: '' });
  assert.throws(() => agir(plein, 'creer-dossier', charge), /256 dossiers/);
  assert.equal(plein.documents.length, 256);
  const coeur = globalThis.AlienCore.créer(); const sauvegarde = coeur.sauvegarde();
  assert.throws(() => coeur.agir('gm', '', { type: 'creer-document', document: { id: 'medical', title: 'Secret', body: 'Confidentiel', access: 'code', code: 'OMEGA-10' } }));
  assert.deepEqual(coeur.sauvegarde(), sauvegarde);
});

test('les secrets LOGIN, CODE et ORDERS sont masqués dans le dialogue', () => {
  let etat = module.creerEtat();
  for (const texte of ['CODE 0042', 'ORDERS 0042', 'LOGIN PROMETHEUS']) etat = saisir(etat, texte);
  const vue = module.vuePour(etat, reyes);
  assert.equal(vue.player.access, 'admin');
  assert.ok(!JSON.stringify(vue).includes('PROMETHEUS'));
  assert.ok(!JSON.stringify(vue).includes('0042'));
});

test('questions et réponses ne sont visibles que par le bon opérateur et le MJ', () => {
  let etat = saisir(module.creerEtat(), '/M Où est la balise ?');
  etat = agir(etat, 'repondre', { personnageId: reyes.personnageId, texte: 'Secteur sept.' });
  assert.ok(JSON.stringify(module.vuePour(etat, reyes)).includes('Secteur sept.'));
  assert.ok(JSON.stringify(module.vuePour(etat, mj)).includes('Secteur sept.'));
  assert.ok(!JSON.stringify(module.vuePour(etat, sato)).includes('Secteur sept.'));
  assert.ok(!JSON.stringify(module.vuePour(etat, sato)).includes('Où est la balise'));
});

test('toutes les commandes MJ déclarées sont interdites au joueur, même administrateur du terminal', () => {
  const etat = saisir(module.creerEtat(), 'LOGIN PROMETHEUS');
  for (const commande of manifeste.commandes.filter(c => !c.roles.includes('joueur'))) {
    assert.throws(() => agir(etat, commande.id, {}, reyes), /meneur/);
  }
  assert.throws(() => agir(etat, 'tracker', {}, reyes));
  assert.throws(() => agir(etat, 'tracker', {}));
});

test('le joueur ne substitue ni personnage ni rôle et les identités réservées sont refusées', () => {
  const etat = module.creerEtat();
  for (const charge of [{ texte: 'STATUS', personnageId: sato.personnageId }, { texte: 'STATUS', role: 'mj' }, { texte: 'STATUS', campagneId: 'autre' }]) {
    assert.throws(() => agir(etat, 'saisir', charge, reyes));
  }
  for (const personnageId of [undefined, '', '__proto__', 'constructor', 'toString']) {
    assert.throws(() => saisir(etat, 'STATUS', { role: 'joueur', personnageId }));
    assert.throws(() => module.vuePour(etat, { role: 'joueur', personnageId }));
  }
  assert.throws(() => module.vuePour(etat, { role: 'admin' }));
});

test('préparer et renommer un opérateur conserve ses messages et ses accès', () => {
  let etat = agir(module.creerEtat(), 'preparer-operateur', { personnageId: reyes.personnageId, nom: 'Reyes' });
  etat = saisir(etat, 'CODE 0042');
  etat = agir(etat, 'preparer-operateur', { personnageId: reyes.personnageId, nom: 'Capitaine Reyes' });
  const vue = module.vuePour(etat, reyes);
  assert.equal(vue.player.name, 'Capitaine Reyes');
  assert.ok(vue.player.messages.length);
  assert.ok(vue.documents.some(d => d.id === 'ordre'));
});

test('arbitrer le piratage accorde seulement le privilège narratif choisi', () => {
  let etat = saisir(module.creerEtat(), 'HACK');
  etat = agir(etat, 'arbitrer-piratage', { personnageId: reyes.personnageId, reussite: false });
  assert.equal(module.vuePour(etat, reyes).player.access, 'crew');
  etat = saisir(etat, 'HACK');
  etat = agir(etat, 'arbitrer-piratage', { personnageId: reyes.personnageId, reussite: true });
  assert.equal(module.vuePour(etat, reyes).player.access, 'admin');
  assert.equal(module.vuePour(etat, reyes).player.cue.success, true);
  assert.equal(module.vuePour(etat, sato).player.access, 'crew');
});

test('modifier le code retire ses déverrouillages ; révoquer retire aussi un accès administrateur', () => {
  let etat = saisir(module.creerEtat(), 'CODE 0042');
  etat = agir(etat, 'modifier-dossier', { dossierId: 'ordre', code: '0088', titre: 'Ordre privé', contenu: 'Conserver la balise.', acces: 'code' });
  assert.equal(module.vuePour(etat, reyes).documents.length, 1);
  etat = saisir(etat, 'CODE 0088');
  assert.equal(module.vuePour(etat, reyes).documents.find(d => d.id === 'ordre').body, 'Conserver la balise.');
  etat = saisir(etat, 'LOGIN PROMETHEUS');
  etat = agir(etat, 'revoquer', { personnageId: reyes.personnageId });
  assert.equal(module.vuePour(etat, reyes).player.access, 'crew');
  assert.equal(module.vuePour(etat, reyes).documents.length, 1);
});

test('une erreur ne mute pas l’état reçu, même après une mise à jour partiellement valide', () => {
  const etat = module.creerEtat(), avant = copie(etat);
  for (const [id, charge] of [
    ['configurer', { vaisseau: 'Autre', crt: 'oui' }],
    ['modifier-dossier', { dossierId: 'ordre', titre: 'Autre', acces: 'inconnu' }],
    ['compte-a-rebours', { minutes: Infinity }], ['compte-a-rebours', { minutes: '5' }],
    ['compte-a-rebours', { minutes: 0 }], ['repondre', { personnageId: 'absent', texte: 'Secret' }],
    ['configurer', { motDePasse: ' ' }], ['configurer', { tracker: {} }],
  ]) { assert.throws(() => agir(etat, id, charge)); assert.deepEqual(etat, avant); }
  const modifie = agir(etat, 'configurer', { vaisseau: 'USCSS NOSTROMO', statut: 'Attente.', motDePasse: ' NOSTROMO ', crt: false, parasites: false });
  assert.equal(modifie.config.adminPassword, 'NOSTROMO');
  assert.deepEqual(etat, avant);
});

test('arrêt et migration gardent les secrets et dialogues, arrêtent les effets et sont idempotents', () => {
  let etat = saisir(module.creerEtat(), 'HACK');
  etat = agir(etat, 'arbitrer-piratage', { personnageId: reyes.personnageId, reussite: true });
  etat = agir(etat, 'compte-a-rebours', { minutes: 2 });
  const arrete = module.arreterEffets(etat);
  assert.equal(arrete.countdown, null); assert.equal(arrete.players[reyes.personnageId].cue, null);
  assert.equal(arrete.players[reyes.personnageId].access, 'admin');
  assert.deepEqual(arrete.players[reyes.personnageId].messages, etat.players[reyes.personnageId].messages);
  assert.deepEqual(module.arreterEffets(arrete), arrete);
  assert.deepEqual(module.migrerEtat(JSON.parse(JSON.stringify(etat)), 5), arrete);
  assert.ok(etat.countdown); assert.ok(etat.players[reyes.personnageId].cue);
});

test('l’état du prototype v1 est migré sans embarquer ou modifier son radar', () => {
  const moteur = globalThis.AlienCore.créer();
  moteur.inscrire('reyes', 'Reyes'); moteur.agir('player', 'reyes', { type: 'command', text: 'CODE 0042' });
  moteur.agir('gm', '', { type: 'tracker', tracker: { power: true, intensity: 75 } });
  const ancien = moteur.sauvegarde();
  ancien.version = 1;
  for (const p of Object.values(ancien.players)) delete p.requests;
  delete ancien.prereglagesDetecteur;
  for (const cle of ['protocoles', 'portes', 'autodestruction', 'diffusionAlarme']) delete ancien[cle];
  const avant = copie(ancien);
  const resultat = module.migrerEtat(ancien, 1);
  assert.equal(resultat.tracker, undefined); assert.deepEqual(ancien, avant);
  assert.ok(resultat.players.reyes.unlocked.includes('ordre'));
  assert.equal(resultat.config.adminPassword, 'PROMETHEUS');
});

test('la migration masque aussi les anciens codes ORDERS conservés en clair', () => {
  const ancien = saisir(module.creerEtat(), 'STATUS');
  ancien.version = 2; delete ancien.actes; delete ancien.prereglages; for (const p of Object.values(ancien.players)) delete p.requests;
  ancien.players[reyes.personnageId].messages[0].content = 'ORDERS 0042';
  const resultat = module.migrerEtat(ancien, 2);
  assert.equal(resultat.players[reyes.personnageId].messages[0].content, 'ORDERS ••••••••');
  assert.equal(ancien.players[reyes.personnageId].messages[0].content, 'ORDERS 0042');
});

test('données corrompues ou futures sont refusées sans retour silencieux aux exemples', () => {
  const initial = module.creerEtat();
  assert.throws(() => module.migrerEtat(initial, 99));
  for (const donnees of [null, {}, { ...initial, config: { vessel: 'Seul' } }, { ...initial, revision: NaN }, { ...initial, intrus: true }]) {
    assert.throws(() => module.migrerEtat(donnees, 3));
  }
  const corrompu = saisir(initial, 'STATUS'); corrompu.players[reyes.personnageId].unlocked = ['inconnu'];
  assert.throws(() => module.validerEtat(corrompu));
});

test('réinitialiser conserve les opérateurs, arrête les effets et fait avancer la révision', () => {
  let etat = saisir(module.creerEtat(), 'LOGIN PROMETHEUS');
  etat = agir(etat, 'compte-a-rebours', { minutes: 1 });
  const nouveau = agir(etat, 'reinitialiser');
  assert.equal(nouveau.revision, etat.revision + 1);
  assert.equal(nouveau.countdown, null); assert.equal(nouveau.players[reyes.personnageId].access, 'crew');
  assert.equal(nouveau.players[reyes.personnageId].messages.length, 0);
});

test('les vues sont des copies ; le dialogue est borné à 200 messages', () => {
  let etat = module.creerEtat();
  for (let index = 0; index < 105; index++) etat = saisir(etat, 'STATUS');
  assert.equal(etat.players[reyes.personnageId].messages.length, 200);
  const vue = module.vuePour(etat, mj); vue.config.adminPassword = 'Retouché';
  assert.equal(etat.config.adminPassword, 'PROMETHEUS');
});

test('le serveur autonome garde ses parcours après adaptation, sans ouvrir de port', async t => {
  const prefixe = path.join(tmpdir(), 'gmos-muthur-');
  const dossier = await mkdtemp(prefixe);
  const table = await createTable({ storageDirectory: dossier });
  t.after(async () => {
    table.close();
    assert.ok(path.resolve(dossier).startsWith(path.resolve(prefixe)));
    await rm(dossier, { recursive: true, force: true });
  });
  assert.equal(table.server.listening, false);
  const inscription = await table.request({ method: 'POST', url: '/api/join', body: { code: table.joinCode, name: 'Reyes' } });
  const token = inscription.json.token;
  const resultat = await table.request({ method: 'POST', url: '/api/action', token, body: { type: 'command', text: 'CODE 0042' } });
  assert.equal(resultat.status, 200);
  assert.ok(table.snapshot(token).documents.some(d => d.id === 'ordre'));
  assert.equal((await table.request({ method: 'POST', url: '/api/action', token, body: { type: 'tracker', tracker: { power: true } } })).status, 403);
  const nouveauDossier = { type: 'creer-document', document: { id: 'medical', title: 'Rapport médical', body: 'Quarantaine maintenue.', access: 'code', code: '0087' } };
  assert.equal((await table.request({ method: 'POST', url: '/api/action', token, body: nouveauDossier })).status, 403);
  assert.equal((await table.request({ method: 'POST', url: '/api/action', token: table.gmToken, body: nouveauDossier })).status, 200);
  assert.ok(!table.snapshot(token).documents.some(d => d.id === 'medical'));
  await table.request({ method: 'POST', url: '/api/action', token, body: { type: 'command', text: 'CODE 0087' } });
  assert.ok(table.snapshot(token).documents.some(d => d.id === 'medical'));
  assert.equal((await table.request({ url: '/core.js' })).status, 200);
  assert.equal((await table.request({ url: '/alarme.js' })).status, 200);
  assert.equal((await table.request({ url: '/alarme.css' })).status, 200);
  const cheminFilm = '/medias/nostromo-autodestruction.webm';
  const enteteFilm = await table.request({ method: 'HEAD', url: cheminFilm });
  assert.equal(enteteFilm.type, 'video/webm'); assert.equal(enteteFilm.headers['Accept-Ranges'], 'bytes');
  assert.equal(enteteFilm.headers['Content-Length'], 26378944); assert.equal(enteteFilm.content.length, 0);
  const debutFilm = await table.request({ url: cheminFilm, range: 'bytes=0-3' });
  assert.equal(debutFilm.status, 206); assert.equal(debutFilm.headers['Content-Range'], 'bytes 0-3/26378944');
  assert.equal(debutFilm.content.toString('hex'), '1a45dfa3');
  const finFilm = await table.request({ url: cheminFilm, range: 'bytes=-8' });
  assert.equal(finFilm.status, 206); assert.equal(finFilm.content.length, 8);
  assert.equal((await table.request({ url: cheminFilm, range: 'bytes=999999999-' })).status, 416);
  assert.equal((await table.request({ url: cheminFilm, range: 'bytes=-0' })).status, 416);
  assert.equal((await table.request({ url: '/medias/../../session.json' })).status, 404);
  await table.request({ method: 'POST', url: '/api/action', token, body: { type: 'command', text: 'CODE OMEGA-10' } });
  assert.ok(table.snapshot(token).autodestruction);
  assert.equal(table.snapshot(token).protocoles, undefined);
  await table.request({ method: 'POST', url: '/api/action', token, body: { type: 'diffusion', actif: true, appareilId: 'forge' } });
  assert.equal(table.snapshot(token).diffusionAutorisee, true);
  assert.equal(table.snapshot(table.gmToken).diffusionAutorisee, false);
  await table.request({ method: 'POST', url: '/api/action', token: table.gmToken, body: { type: 'diffusion', actif: true } });
  assert.equal(table.snapshot(token).diffusionAutorisee, false);
  assert.equal(table.snapshot(table.gmToken).diffusionAutorisee, true);
  assert.equal((await table.request({ method: 'POST', url: '/api/action', token, body: { type: 'protocole', protocole: {} } })).status, 403);
  await table.request({ method: 'POST', url: '/api/action', token, body: { type: 'command', text: 'CODE OMEGA-STOP' } });
  assert.equal(table.snapshot(token).autodestruction, null);
});
