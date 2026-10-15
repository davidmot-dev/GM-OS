import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as moteur from './moteur.mjs';
import { extraireConfiguration, etatDepuisConfiguration, lireConfiguration } from './configuration.mjs';

const mj = { role: 'mj' }, joueur = { role: 'joueur', personnageId: 'pj-reyes', appareilId: 'tablette-reyes' };
const agir = (etat, id, charge, contexte = mj) => moteur.appliquerCommande(etat, { id, charge }, contexte);
const copie = valeur => JSON.parse(JSON.stringify(valeur));

test('la préparation exportée conserve réglages, dossiers et codes exacts sans exporter la séance', () => {
  let etat = agir(moteur.creerEtat(), 'configurer', { vaisseau: 'USCSS MÉMOIRE', motDePasse: '0007', crt: false, parasites: true });
  etat = agir(etat, 'creer-dossier', { dossierId: 'rapport-medical', titre: 'Rapport médical', contenu: 'Quarantaine.\nÉvacuation refusée.', acces: 'code', code: '0087' });
  etat = agir(etat, 'saisir', { texte: '/M Dialogue privé à oublier.' }, joueur);
  etat = agir(etat, 'choisir-diffusion', { actif: true }, joueur);
  etat = agir(etat, 'saisir', { texte: 'CODE OMEGA-10' }, joueur);
  assert.ok(etat.autodestruction);
  const preparation = lireConfiguration(JSON.stringify(extraireConfiguration(etat)));
  assert.deepEqual(Object.keys(preparation).sort(), ['config', 'documents', 'format', 'protocoles', 'version']);
  assert.ok(!JSON.stringify(preparation).includes('Dialogue privé à oublier'));
  const repris = etatDepuisConfiguration(preparation);
  assert.deepEqual(repris.config, etat.config); assert.deepEqual(repris.documents, etat.documents);
  assert.deepEqual(repris.protocoles, etat.protocoles);
  assert.equal(repris.documents.at(-1).code, '0087'); assert.equal(repris.config.adminPassword, '0007');
  assert.deepEqual(repris.players, {}); assert.equal(repris.revision, 0);
  assert.equal(repris.autodestruction, null); assert.equal(repris.countdown, null);
  assert.equal(repris.diffusionAlarme, null); assert.equal(repris.portes, 'inconnues');
});

test('export et restauration ne partagent aucune référence avec la préparation courante', () => {
  const etat = moteur.creerEtat(), avant = copie(etat);
  const preparation = extraireConfiguration(etat), repris = etatDepuisConfiguration(preparation);
  repris.documents[0].body = 'Changé après import'; repris.protocoles[0].code = 'AUTRE';
  preparation.config.vessel = 'Autre vaisseau'; preparation.documents[0].title = 'Autre titre';
  assert.deepEqual(etat, avant);
  assert.equal(repris.config.vessel, avant.config.vessel);
  assert.equal(preparation.documents[0].body, avant.documents[0].body);
});

test('un import incomplet, futur ou incohérent est refusé sans modifier sa source', () => {
  const preparation = extraireConfiguration(moteur.creerEtat());
  for (const texte of ['{', 'null', '[]', '{}', JSON.stringify(moteur.creerEtat())]) assert.throws(() => lireConfiguration(texte));
  const variantes = [
    { ...preparation, version: 2 }, { ...preparation, format: 'autre' }, { ...preparation, players: {} },
    { ...preparation, documents: [{ ...preparation.documents[0], access: 'public' }] },
    { ...preparation, config: { ...preparation.config, crt: 'oui' } },
    { ...preparation, protocoles: [...preparation.protocoles, { ...preparation.protocoles[0], id: 'doublon' }] },
  ];
  for (const variante of variantes) {
    const avant = copie(variante);
    assert.throws(() => etatDepuisConfiguration(variante)); assert.deepEqual(variante, avant);
  }
});
