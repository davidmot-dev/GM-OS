import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as moteur from './moteur.mjs';
import '../../alarme.js';

const mj = { role: 'mj', appareilId: 'poste-mj' }, reyes = { role: 'joueur', personnageId: 'pj-reyes', appareilId: 'tablette-reyes' }, sato = { role: 'joueur', personnageId: 'pj-sato', appareilId: 'tablette-sato' };
const agir = (etat, id, charge, contexte = mj) => moteur.appliquerCommande(etat, { id, charge }, contexte);
const saisir = (etat, texte, contexte = reyes) => agir(etat, 'saisir', { texte }, contexte);

test('un protocole personnalisé produit le message préparé, sans publier ses codes', () => {
  let etat = moteur.creerEtat();
  const protocole = { id: 'balise', nom: 'Balise retrouvée', code: '0007', message: 'Signal de la balise rétabli.', effet: 'message', minutes: 10, actif: true, portee: 'operateur' };
  etat = agir(etat, 'enregistrer-protocole', { protocole });
  assert.ok(!JSON.stringify(moteur.vuePour(etat, reyes)).includes('0007'));
  etat = saisir(etat, 'CODE 7');
  assert.ok(!moteur.vuePour(etat, reyes).player.messages.some(m => m.content === protocole.message));
  etat = saisir(etat, 'CODE 0007');
  assert.ok(moteur.vuePour(etat, reyes).player.messages.some(m => m.content === protocole.message));
  assert.ok(!JSON.stringify(moteur.vuePour(etat, sato)).includes(protocole.message));
  etat = agir(etat, 'supprimer-protocole', { protocoleId: 'balise' });
  assert.ok(!etat.protocoles.some(pr => pr.id === 'balise'));
});

test('ouvrir et fermer les portes modifie leur état public et diffuse le message choisi', () => {
  let etat = agir(moteur.creerEtat(), 'preparer-operateur', { personnageId: sato.personnageId, nom: 'Sato' });
  etat = saisir(etat, 'CODE PORTES-OUVRIR');
  assert.equal(moteur.vuePour(etat, reyes).portes, 'ouvertes');
  assert.equal(moteur.vuePour(etat, sato).portes, 'ouvertes');
  assert.ok(moteur.vuePour(etat, sato).player.messages.some(m => m.content.includes('Portes ouvertes')));
  etat = saisir(etat, 'CODE PORTES-FERMER');
  assert.equal(etat.portes, 'fermees');
});

test('autodestruction prolongée au film complet : échéance commune, pas de redémarrage implicite, annulation par code', t => {
  t.mock.timers.enable({ apis: ['Date'], now: 1000000 });
  let etat = saisir(moteur.creerEtat(), 'CODE OMEGA-10');
  const fin = etat.countdown.endAt, id = etat.autodestruction.id;
  assert.equal(fin, 1775701);
  assert.equal(moteur.vuePour(etat, sato).countdown.endAt, fin);
  t.mock.timers.tick(60000);
  etat = saisir(etat, 'CODE OMEGA-10');
  assert.equal(etat.countdown.endAt, fin); assert.equal(etat.autodestruction.id, id);
  assert.throws(() => agir(etat, 'compte-a-rebours', { minutes: 3 }));
  etat = saisir(etat, 'CODE OMEGA-STOP');
  assert.equal(etat.autodestruction, null); assert.equal(etat.countdown, null);
});

test('protocoles inactifs, collisions et commandes forgées sont refusés sans mutation', () => {
  const initial = moteur.creerEtat(), original = JSON.stringify(initial), base = initial.protocoles[0];
  for (const protocole of [{ ...base, id: 'autre', code: '0042' }, { ...base, id: 'autre' }, { ...base, minutes: Infinity }, { ...base, effet: 'executer-script' }]) {
    assert.throws(() => agir(initial, 'enregistrer-protocole', { protocole }));
    assert.equal(JSON.stringify(initial), original);
  }
  assert.throws(() => agir(initial, 'modifier-dossier', { dossierId: 'ordre', code: base.code }));
  assert.throws(() => agir(initial, 'enregistrer-protocole', { protocole: base }, reyes));
  let etat = agir(initial, 'enregistrer-protocole', { protocole: { ...base, actif: false } });
  etat = saisir(etat, 'CODE ' + base.code); assert.equal(etat.portes, 'inconnues');
});

test('un seul appareil diffuse ; une charge ne choisit jamais l’identité d’un autre appareil', () => {
  let etat = agir(moteur.creerEtat(), 'choisir-diffusion', { actif: true }, reyes);
  assert.equal(moteur.vuePour(etat, reyes).diffusionAutorisee, true);
  assert.equal(moteur.vuePour(etat, mj).diffusionAutorisee, false);
  etat = agir(etat, 'choisir-diffusion', { actif: true }, mj);
  assert.equal(moteur.vuePour(etat, reyes).diffusionAutorisee, false);
  assert.equal(moteur.vuePour(etat, mj).diffusionAutorisee, true);
  assert.equal(moteur.vuePour(etat, sato).diffusionAlarme, undefined);
  assert.throws(() => agir(etat, 'choisir-diffusion', { actif: true, appareilId: mj.appareilId }, reyes));
  assert.throws(() => agir(etat, 'choisir-diffusion', { actif: true }, { role: 'joueur', personnageId: 'pj-incomplet' }));
  etat = agir(etat, 'choisir-diffusion', { actif: false }, reyes);
  assert.equal(moteur.vuePour(etat, mj).diffusionAutorisee, true);
});

test('la reprise v2 conserve les protocoles préparés, ferme la diffusion et arrête l’autodestruction', () => {
  let etat = saisir(moteur.creerEtat(), 'CODE OMEGA-10');
  etat = agir(etat, 'choisir-diffusion', { actif: true }, reyes);
  const restaure = moteur.migrerEtat(etat, 3);
  assert.deepEqual(restaure.protocoles, etat.protocoles);
  assert.equal(restaure.autodestruction, null); assert.equal(restaure.diffusionAlarme, null);
  const ancien = structuredClone({ ...etat, version: 1 });
  for (const p of Object.values(ancien.players)) delete p.requests;
  for (const cle of ['protocoles', 'portes', 'autodestruction', 'diffusionAlarme']) delete ancien[cle];
  const migre = moteur.migrerEtat(ancien, 1);
  assert.deepEqual(migre.protocoles, []); assert.equal(migre.version, 3);
});

function installationAlarme({ locale = true, francaise = true } = {}) {
  let temps = 0, callback, creations = 0, arrets = 0, annulations = 0;
  const paroles = [], evenements = new Map();
  const parametre = () => ({ value: 0, setValueAtTime() {} });
  const noeud = oscillateur => ({ frequency: parametre(), gain: parametre(), connect() {}, disconnect() {}, start() { creations++; }, stop() { if (oscillateur) arrets++; } });
  const audio = { state: 'running', currentTime: 0, destination: {}, createOscillator: () => noeud(true), createGain: () => noeud(false) };
  const synthese = { getVoices: () => [{ localService: locale, lang: francaise ? 'fr-FR' : 'en-US' }], speak: p => paroles.push(p), cancel: () => annulations++, addEventListener: (nom, fn) => evenements.set(nom, fn), removeEventListener: nom => evenements.delete(nom) };
  class Parole { constructor(texte) { this.text = texte; } }
  const statuts = [];
  const alarme = globalThis.AlienAlarme.creer({ audio, synthese, Parole, maintenant: () => temps,
    planifier: fn => { callback = fn; return 1; }, retirer: () => { callback = null; }, signaler: texte => statuts.push(texte) });
  return { alarme, paroles, statuts, evenements, audio, avancer: valeur => { temps = valeur; callback?.(); },
    creations: () => creations, arrets: () => arrets, annulations: () => annulations, enCours: () => !!callback };
}

test('sirène et voix : départ à dix, une annonce à neuf, pas de doublon ni rattrapage des minutes manquées', () => {
  const s = installationAlarme();
  s.alarme.suivre({ id: 'auto-1' }, 600000, true);
  assert.equal(s.creations(), 2); assert.match(s.paroles[0].text, /10 minutes/);
  s.avancer(1000); s.avancer(59000); assert.equal(s.paroles.length, 1);
  s.avancer(60000); assert.match(s.paroles[1].text, /9 minutes/);
  s.alarme.suivre({ id: 'auto-1' }, 600000, true); assert.equal(s.paroles.length, 2);
  s.avancer(240000); assert.equal(s.paroles.length, 3); assert.match(s.paroles[2].text, /6 minutes/);
  s.avancer(600000); assert.match(s.paroles.at(-1).text, /terminé/); assert.equal(s.arrets(), 2); assert.equal(s.enCours(), false);
  s.alarme.detruire();
});

test('une vue sans autorisation ne produit aucun son ; transfert et démontage arrêtent tout', () => {
  const s = installationAlarme();
  s.alarme.suivre({ id: 'auto-1' }, 600000, false); assert.equal(s.creations(), 0);
  s.alarme.suivre({ id: 'auto-1' }, 600000, true);
  s.alarme.suivre({ id: 'auto-1' }, 600000, false);
  assert.equal(s.arrets(), 2); assert.equal(s.annulations(), 1); assert.equal(s.enCours(), false);
  s.alarme.detruire(); assert.equal(s.evenements.size, 0);
  s.alarme.suivre({ id: 'auto-1' }, 600000, true); assert.equal(s.creations(), 2);
});

test('aucune voix distante ou étrangère n’est utilisée ; la sirène continue', () => {
  for (const options of [{ locale: false }, { francaise: false }]) {
    const s = installationAlarme(options); s.alarme.suivre({ id: 'auto-1' }, 600000, true);
    assert.equal(s.paroles.length, 0); assert.equal(s.creations(), 2);
    assert.ok(s.statuts.some(texte => texte.includes('indisponible')));
    s.alarme.detruire();
  }
});

test('un décompte déjà écoulé au montage ne relance ni voix ni sirène', () => {
  const s = installationAlarme(); s.avancer(700000);
  s.alarme.suivre({ id: 'ancienne' }, 600000, true);
  assert.equal(s.creations(), 0); assert.equal(s.paroles.length, 0); assert.equal(s.enCours(), false);
  s.alarme.detruire();
});
