import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validerLeManifeste } from '../../modules-du-jeu/contrat.mjs';
import * as m from './moteur.mjs';
import * as ancien from './heritage-v1.mjs';
import { POSTES, EN_ATTENTE } from './postes.mjs';
import { creerFiction, mj } from './fiction.mjs';
import { exporterConfiguration, lireConfiguration } from './configuration.mjs';
const lecteur = (id = 'pj-essai') => ({ role: 'joueur', personnageId: id, appareilId: `test-${id}` });
const agir = (e, id, charge, role = mj) => m.appliquerCommande(e, { id, charge }, role);
const demande = (e, poste = 'science', action = Object.keys(POSTES[poste].actions)[0], role = lecteur()) => agir(e, 'demander-intervention', {
  poste, action, cibleId: e.cibles.find(c => c.poste === poste && c.visible).id, question: 'QUESTION PRIVÉE', affectation: e.officiers.find(p => p.id === role.personnageId).affectation }, role);
const repondre = (e, extra = {}) => agir(e, 'resoudre-demande', { demandeId: e.demandes[0].id, texte: 'RAPPORT PRIVÉ', partageAutorise: true, acceptee: true, media: null, nouvelEtat: null, ...extra });
const image = { type: 'image', nom: 'pixel.png', source: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==' };

test('manifeste conforme et fiction des sept postes valide', async () => {
  const manifeste = JSON.parse(await readFile(new URL('./manifeste.json', import.meta.url), 'utf8'));
  assert.deepEqual(validerLeManifeste(manifeste), []); assert.equal(manifeste.versionDonnees, 2);
  const e = creerFiction(); m.validerEtat(e); assert.equal(Object.keys(POSTES).length, 7); assert.equal(e.prereglages.length, 3);
});
for (const [poste, p] of Object.entries(POSTES)) for (const action of Object.keys(p.actions)) test(`${p.nom} : ${action}, résultat privé et état arbitré`, () => {
  const e = creerFiction(), avant = JSON.stringify(e), d = demande(e, poste, action);
  assert.equal(JSON.stringify(e), avant);
  assert.equal(d.demandes[0].poste, poste); assert.equal(d.demandes[0].statut, 'attente');
  const traite = repondre(d, { nouvelEtat: p.etats.at(-1) });
  assert.equal(traite.cibles.find(c => c.id === traite.demandes[0].cibleId).etat, p.etats.at(-1));
  assert.equal(m.vuePour(traite, lecteur()).demandes[0].rapport, 'RAPPORT PRIVÉ');
  assert.ok(!JSON.stringify(m.vuePour(traite, lecteur('pj-mara'))).includes('RAPPORT PRIVÉ'));
});
test('cloisonnement des postes, contacts cachés et secrets médicaux', () => {
  const e = creerFiction(), science = m.vuePour(e, lecteur('pj-tlen')), cmd = m.vuePour(e, lecteur('pj-mara'));
  assert.ok(!JSON.stringify(science).includes('SECRET RELAIS')); assert.ok(!JSON.stringify(science).includes('rapportPrepare'));
  assert.ok(!science.cibles.some(c => c.id === 'c-07')); assert.ok(!cmd.cibles.some(c => c.poste === 'medecine'));
  assert.ok(!JSON.stringify(cmd).includes('DOSSIER MÉDICAL PRIVÉ')); assert.ok(JSON.stringify(m.vuePour(e, mj)).includes('DOSSIER MÉDICAL PRIVÉ'));
  science.cibles[0].libelle = 'MODIFICATION'; assert.ok(!e.cibles.some(c => c.libelle === 'MODIFICATION'));
});
test('rôles, champs d’identité injectés, action incompatible et poste non affecté refusés', () => {
  const e = creerFiction(), c = { poste: 'science', cibleId: 'c-03', action: 'scan', question: '', affectation: 1 };
  assert.throws(() => agir(e, 'demander-intervention', c, lecteur('pj-mara')), /Console/);
  for (const v of [{ ...c, personnageId: 'pj-mara' }, { ...c, poste: '__proto__' }, { ...c, action: 'reparation' }, { ...c, cibleId: 'c-07' }, { ...c, affectation: 999 }]) assert.throws(() => agir(e, 'demander-intervention', v, lecteur('pj-tlen')));
  assert.throws(() => agir(e, 'changer-alerte', { niveau: 'rouge', texte: '', secondes: null }, lecteur()));
  assert.throws(() => m.vuePour(e, lecteur('inconnu')));
});
test('doublon refusé, file qualifiée et résolution hors ordre', () => {
  let e = demande(creerFiction()); assert.throws(() => demande(e), /déjà/);
  e = demande(e, 'ingenierie'); const seconde = e.demandes[1].id;
  e = agir(e, 'qualifier-demande', { demandeId: seconde, statut: 'jet-requis' });
  e = repondre(e, { demandeId: seconde }); assert.equal(e.demandes[0].statut, 'attente'); assert.equal(e.demandes[1].statut, 'traitee');
  assert.throws(() => repondre(e, { demandeId: seconde }), /déjà traitée/);
});
test('réparation refusée sans modification de système ; réponse immuable après édition du modèle', () => {
  let e = demande(creerFiction(), 'ingenierie', 'reparation'); const etat = e.cibles.find(c => c.id === e.demandes[0].cibleId).etat;
  assert.throws(() => repondre(e, { acceptee: false, nouvelEtat: 'nominal' }));
  e = repondre(e, { acceptee: false }); assert.equal(e.demandes[0].statut, 'refusee'); assert.equal(e.demandes[0].partageAutorise, false);
  const cible = e.cibles.find(c => c.id === e.demandes[0].cibleId); assert.equal(cible.etat, etat);
  e = agir(e, 'preparer-cible', { cibleId: cible.id, poste: cible.poste, libelle: 'CHANGÉ', description: '', rapportPrepare: 'NOUVEAU SECRET', visible: true, etat });
  assert.equal(e.demandes[0].rapport, 'RAPPORT PRIVÉ'); assert.notEqual(e.demandes[0].cibleLibelle, 'CHANGÉ');
});
test('partage autorisé par son auteur, sans question privée ni doublon', () => {
  let e = repondre(demande(creerFiction())); const c = { demandeId: e.demandes[0].id, affectation: e.officiers.at(-1).affectation };
  assert.throws(() => agir(e, 'partager-rapport', c, lecteur('pj-tlen')));
  e = agir(e, 'partager-rapport', c, lecteur());
  const cmd = JSON.stringify(m.vuePour(e, lecteur('pj-mara'))); assert.ok(cmd.includes('RAPPORT PRIVÉ')); assert.ok(!cmd.includes('QUESTION PRIVÉE'));
  assert.throws(() => agir(e, 'partager-rapport', c, lecteur()), /déjà partagé/);
  const retire = agir(e, 'retirer-publication', { publicationId: e.publications[0].id });
  assert.equal(retire.demandes[0].partageAutorise, false); assert.throws(() => agir(retire, 'partager-rapport', c, lecteur()));
  const ferme = repondre(demande(creerFiction()), { partageAutorise: false }); assert.throws(() => agir(ferme, 'partager-rapport', { demandeId: ferme.demandes[0].id, affectation: ferme.officiers.at(-1).affectation }, lecteur()));
});
test('publication ciblée par poste, média privé et retrait', () => {
  let e = agir(creerFiction(), 'publier-rapport', { titre: 'DOSSIER MÉDICAL', texte: 'DONNÉES CIBLÉES', destinataires: ['medecine'], media: image });
  assert.ok(JSON.stringify(m.vuePour(e, lecteur('pj-tlen'))).includes(image.source));
  assert.ok(!JSON.stringify(m.vuePour(e, lecteur('pj-mara'))).includes(image.source));
  assert.throws(() => agir(e, 'publier-rapport', { titre: 'X', texte: 'Y', destinataires: ['equipage', 'science'], media: null }));
  e = agir(e, 'retirer-publication', { publicationId: e.publications[0].id }); assert.equal(e.publications.length, 0);
});
test('ordres réservés au commandement, accusés personnels et destinataires contrôlés', () => {
  let e = creerFiction(); const c = { texte: 'Inspectez le réacteur.', destinataires: ['ingenierie'], affectation: e.officiers[1].affectation };
  assert.throws(() => agir(e, 'donner-ordre', c, lecteur('pj-tlen')));
  e = agir(e, 'donner-ordre', c, lecteur('pj-mara'));
  assert.equal(m.vuePour(e, lecteur('pj-tlen')).ordres.length, 0); assert.equal(m.vuePour(e, lecteur('pj-mara')).ordres.length, 1);
  const ack = { ordreId: e.ordres[0].id, affectation: e.officiers[2].affectation };
  assert.throws(() => agir(e, 'accuser-ordre', ack, lecteur('pj-tlen')));
  e = agir(e, 'accuser-ordre', ack, lecteur('pj-ilya')); assert.equal(e.ordres[0].accuses[0].personnageId, 'pj-ilya');
  assert.throws(() => agir(e, 'accuser-ordre', ack, lecteur('pj-ilya')), /déjà lu/);
});
test('réaffectation invalide les commandes en vol sans annuler les autres postes', () => {
  let e = demande(demande(creerFiction()), 'ingenierie'); const ancien = e.officiers.at(-1).affectation;
  e = agir(e, 'preparer-officier', { personnageId: 'pj-essai', nom: 'Officier de test', postes: ['ingenierie'] });
  assert.equal(e.demandes[0].statut, 'annulee'); assert.equal(e.demandes[1].statut, 'attente'); assert.equal(e.officiers.at(-1).scan, null);
  assert.throws(() => agir(e, 'demander-intervention', { poste: 'ingenierie', cibleId: 'reacteur', action: 'reparation', question: '', affectation: ancien }, lecteur()));
  assert.equal(m.vuePour(e, lecteur()).demandes.length, 1);
});
test('annulation par propriétaire et suppression de cible conservent les instantanés', () => {
  let e = demande(creerFiction()); const c = { demandeId: e.demandes[0].id, affectation: e.officiers.at(-1).affectation };
  assert.throws(() => agir(e, 'annuler-demande', c, lecteur('pj-tlen')));
  e = agir(e, 'annuler-demande', c, lecteur()); assert.equal(e.demandes[0].statut, 'annulee');
  e = demande(e); e = agir(e, 'supprimer-cible', { cibleId: 'c-03' }); assert.ok(e.demandes.every(d => d.statut === 'annulee')); assert.equal(e.demandes[1].cibleLibelle, 'C-03 · Écho non identifié');
});
test('préréglage nommé et mise à jour préservent affectations, rapports et demandes', () => {
  let e = demande(creerFiction()); const postes = JSON.stringify(e.officiers.map(p => p.postes));
  e = agir(e, 'changer-alerte', { niveau: 'rouge', texte: 'TEST', secondes: 90 }); e = agir(e, 'enregistrer-prereglage', { prereglageId: 'test', nom: 'Situation test' });
  e = agir(e, 'changer-alerte', { niveau: 'normal', texte: '', secondes: null }); e = agir(e, 'charger-prereglage', { prereglageId: 'test' });
  assert.equal(e.alerte.niveau, 'rouge'); assert.equal(e.alerte.fin, null); assert.equal(e.effetsActifs, false); assert.equal(e.demandes[0].statut, 'attente'); assert.equal(JSON.stringify(e.officiers.map(p => p.postes)), postes);
  e = agir(e, 'enregistrer-prereglage', { prereglageId: 'test', nom: 'Renommé' }); assert.equal(e.prereglages.filter(p => p.id === 'test').length, 1);
  e = agir(e, 'supprimer-prereglage', { prereglageId: 'test' }); assert.ok(!e.prereglages.some(p => p.id === 'test'));
});
test('diffuseur unique par identité de contexte, coupure et restauration idempotentes', () => {
  let e = demande(creerFiction()); e = agir(e, 'choisir-diffusion', { actif: true }, lecteur());
  assert.equal(m.vuePour(e, lecteur()).diffusionAutorisee, true); assert.equal(m.vuePour(e, mj).diffusionAutorisee, false);
  e = agir(e, 'choisir-diffusion', { actif: true }, mj); assert.equal(m.vuePour(e, lecteur()).diffusionAutorisee, false);
  e = agir(e, 'changer-alerte', { niveau: 'rouge', texte: 'Urgence', secondes: 60 }); assert.ok(e.alerte.fin > Date.now());
  const stop = m.arreterEffets(e); assert.equal(stop.diffusionSonore, null); assert.equal(stop.officiers.at(-1).scan, null); assert.equal(stop.alerte.fin, null); assert.equal(stop.alerte.niveau, 'rouge');
  assert.deepEqual(m.arreterEffets(stop), stop); assert.equal(e.effetsActifs, true);
  const restaure = lireConfiguration(JSON.stringify(exporterConfiguration(e))); assert.deepEqual(restaure, stop); assert.equal(restaure.demandes.length, 1);
});
test('migration v1 conserve préparation, rapports privés et partages, effets arrêtés', () => {
  let e = ancien.creerEtat(); const a = (id, charge, role = mj) => { e = ancien.appliquerCommande(e, { id, charge }, role); };
  a('preparer-officier', { personnageId: 'ancien-pj', nom: 'Ancien', science: true });
  a('preparer-contact', { contactId: 'ancien-c', libelle: 'Ancien contact', description: '', rapportPrepare: 'SECRET', revele: true });
  const pj = { role: 'joueur', personnageId: 'ancien-pj', appareilId: 'ancienne-tablette' };
  a('demander-scan', { contactId: 'ancien-c', intention: 'scan', question: '', affectation: 1 }, pj);
  a('resoudre-demande', { demandeId: e.demandes[0].id, texte: 'ANCIEN RAPPORT', partageAutorise: true }); a('partager-rapport', { demandeId: e.demandes[0].id, affectation: 1 }, pj);
  const v = m.migrerEtat(e, 1); assert.equal(v.version, 2); assert.equal(v.publications[0].texte, 'ANCIEN RAPPORT'); assert.deepEqual(v.officiers[0].postes, ['science']);
  const importe = lireConfiguration(JSON.stringify({ moduleId: 'star-trek-lcars', versionDonnees: 1, donnees: e })); assert.equal(importe.effetsActifs, false);
  assert.throws(() => m.migrerEtat(e, 99));
});
test('médias bornés, sans URL distante ou HTML actif ; formats invalides refusés', () => {
  m.validerMedia(image);
  for (const media of [{ ...image, source: 'https://example.invalid/fichier.png' }, { ...image, source: 'data:image/svg+xml;base64,PHN2Zy8+' }, { ...image, type: 'html' }, { ...image, source: 'data:image/png;base64,' }, { ...image, source: 'data:image/png;base64,' + 'A'.repeat(7 * 1024 * 1024) }]) assert.throws(() => m.validerMedia(media));
  assert.throws(() => lireConfiguration(JSON.stringify({ moduleId: 'alien-muthur', versionDonnees: 2, donnees: creerFiction() })));
  const e = creerFiction(); for (const invalide of [{ ...e, version: 9 }, { ...e, revision: NaN }, { ...e, secret: true }, { ...e, officiers: [...e.officiers, e.officiers[0]] }]) assert.throws(() => m.validerEtat(invalide));
});
test('32 attentes maximum, archivage des résolues sans toucher aux publications', () => {
  let e = creerFiction();
  for (let n = 0; n < 17; n++) e = agir(e, 'preparer-cible', { cibleId: `echo-${n}`, poste: 'science', libelle: `Écho ${n}`, description: '', rapportPrepare: '', visible: true, etat: 'inconnu' });
  for (let n = 0; n < 16; n++) for (const action of ['scan', 'analyse']) e = agir(e, 'demander-intervention', { poste: 'science', cibleId: `echo-${n}`, action, question: '', affectation: e.officiers.at(-1).affectation }, lecteur());
  const original = JSON.stringify(e); assert.equal(e.demandes.length, 32);
  assert.throws(() => demande(e), /Capacité/); assert.equal(JSON.stringify(e), original);
  e = repondre(e); e = agir(e, 'partager-rapport', { demandeId: e.demandes[0].id, affectation: e.officiers.at(-1).affectation }, lecteur());
  e = agir(e, 'archiver-demandes', {}); assert.equal(e.demandes.length, 31); assert.equal(e.publications[0].texte, 'RAPPORT PRIVÉ'); assert.ok(e.demandes.every(d => EN_ATTENTE.includes(d.statut)));
});
