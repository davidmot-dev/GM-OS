import { test } from 'node:test';
import assert from 'node:assert/strict';
import './core.js';

const coeur = globalThis.AlienCore;

test('les contacts sont aléatoires mais reproductibles et restent dans la proximité choisie', () => {
  for (const seed of [0, 1, 42, 953, 4294967295]) for (const proximity of [0, 45, 100]) {
    const tracker = { seed, proximity, contacts: 9 }, avant = { ...tracker };
    const positions = coeur.positionsDuDetecteur(tracker), limite = .2 + (1 - proximity / 100) * .57;
    assert.equal(positions.length, 9); assert.deepEqual(positions, coeur.positionsDuDetecteur(tracker));
    assert.deepEqual(tracker, avant);
    for (const point of positions) assert.ok(Math.hypot(point.x, point.y) >= .08 && Math.hypot(point.x, point.y) <= limite + 1e-12);
    assert.ok(new Set(positions.map(p => Math.hypot(p.x, p.y).toFixed(5))).size > 5, 'Les échos ne sont plus rangés sur trois cercles fixes.');
    assert.notDeepEqual(positions, coeur.positionsDuDetecteur({ ...tracker, seed: seed + 1 }));
  }
});

test('le nombre choisi est respecté et un faux écho ne redistribue pas les contacts existants', () => {
  for (const contacts of [0, 1, 3, 9]) {
    const tracker = { seed: 42, proximity: 75, contacts };
    const positions = coeur.positionsDuDetecteur(tracker), avecFauxEcho = coeur.positionsDuDetecteur(tracker, true);
    assert.equal(positions.length, contacts); assert.equal(avecFauxEcho.length, contacts + 1);
    assert.deepEqual(avecFauxEcho.slice(0, contacts), positions);
    if (contacts > 0) assert.deepEqual(positions.slice(0, 1), coeur.positionsDuDetecteur({ ...tracker, contacts: 1 }));
  }
});

test('une nouvelle activation renouvelle le tirage partagé, sans déplacer les échos lors des autres réglages', t => {
  t.mock.method(Math, 'random', () => .5);
  const moteur = coeur.créer(); moteur.inscrire('reyes', 'Reyes'); moteur.inscrire('sato', 'Sato');
  const agir = tracker => moteur.agir('gm', '', { type: 'tracker', tracker });
  const eteint = moteur.sauvegarde();
  assert.throws(() => agir({ power: true, target: 'inconnu' }));
  assert.deepEqual(moteur.sauvegarde(), eteint);
  agir({ power: true, contacts: 3, proximity: 45 });
  const premier = moteur.snapshot('gm').tracker;
  assert.deepEqual(moteur.snapshot('player', 'reyes').tracker, moteur.snapshot('player', 'sato').tracker);
  agir({ power: true, volume: 70, intensity: 90 });
  assert.equal(moteur.snapshot('gm').tracker.seed, premier.seed);
  moteur.agir('gm', '', { type: 'anomaly' });
  assert.equal(moteur.snapshot('gm').tracker.seed, premier.seed);
  const avant = moteur.sauvegarde();
  assert.throws(() => moteur.agir('player', 'reyes', { type: 'tracker', tracker: { power: false } }));
  assert.deepEqual(moteur.sauvegarde(), avant);
  agir({ power: false }); agir({ power: true });
  const suivant = moteur.snapshot('gm').tracker;
  assert.notEqual(suivant.seed, premier.seed);
  assert.notDeepEqual(coeur.positionsDuDetecteur(suivant), coeur.positionsDuDetecteur(premier));
});
