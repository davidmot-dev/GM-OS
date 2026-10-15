import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../../video-alerte.js';

function installer({ tempsInitial = 0, refuser = false } = {}) {
  let temps = tempsInitial, rappel = null, lectures = 0, pauses = 0, chargements = 0;
  const changements = [], messages = [];
  class MediaFictif extends EventTarget {
    duration = 775.701;
    readyState = 1;
    currentTime = 0;
    muted = true;
    src = '';
    loop = false;
    async play() { lectures++; if (refuser) throw new Error('NotAllowedError'); }
    pause() { pauses++; }
    load() { chargements++; }
    removeAttribute(nom) { if (nom === 'src') this.src = ''; }
  }
  const element = new MediaFictif();
  const lecteur = globalThis.AlienVideoAlerte.creer({ element, source: 'film.webm', maintenant: () => temps,
    planifier: fn => { rappel = fn; return 1; }, retirer: () => { rappel = null; },
    lectureChange: actif => changements.push(actif), signaler: message => messages.push(message) });
  return { element, lecteur, changements, messages, avancer: valeur => { temps = valeur; rappel?.(); },
    lectures: () => lectures, pauses: () => pauses, chargements: () => chargements, minuterie: () => !!rappel,
    autoriser: () => { refuser = false; } };
}

test('la vidéo démarre à l’alerte et garde sa bande-son sur le seul appareil autorisé', async () => {
  const s = installer();
  s.lecteur.suivre({ id: 'alerte', startedAt: 0 }, 900000, true);
  await Promise.resolve();
  assert.equal(s.element.src, 'film.webm'); assert.equal(s.element.muted, false);
  assert.equal(s.element.loop, false); assert.equal(s.lecteur.estEnLecture(), true);
  s.lecteur.suivre({ id: 'alerte', startedAt: 0 }, 900000, false);
  assert.equal(s.element.muted, true);
  // Même une modification du contrôle média reste soumise au droit de diffusion.
  s.element.muted = false; s.element.dispatchEvent(new Event('volumechange'));
  assert.equal(s.element.muted, true);
  s.lecteur.detruire();
});

test('la reprise rejoint l’instant courant et une rediffusion du même état ne recommence pas le film', async () => {
  const s = installer({ tempsInitial: 120000 });
  s.lecteur.suivre({ id: 'alerte', startedAt: 0 }, 900000, false);
  await Promise.resolve();
  assert.equal(s.element.currentTime, 120);
  const lectures = s.lectures();
  s.lecteur.suivre({ id: 'alerte', startedAt: 0 }, 900000, false);
  assert.equal(s.lectures(), lectures);
  s.avancer(180000); assert.equal(s.element.currentTime, 180);
  s.lecteur.detruire();
});

test('à la fin de la vidéo, la priorité est rendue à l’alarme sans boucle ni retour au début', async () => {
  const s = installer();
  s.lecteur.suivre({ id: 'alerte', startedAt: 0 }, 900000, true); await Promise.resolve();
  s.element.dispatchEvent(new Event('ended'));
  assert.equal(s.changements.at(-1), false); assert.equal(s.lecteur.estEnLecture(), false);
  assert.equal(s.minuterie(), false); assert.equal(s.element.muted, true);
  const lectures = s.lectures(); await s.lecteur.reprendre(); assert.equal(s.lectures(), lectures);
  s.lecteur.detruire();
});

test('annulation, échéance et démontage arrêtent la lecture et libèrent ses ressources', async () => {
  const s = installer(); s.lecteur.suivre({ id: 'alerte', startedAt: 0 }, 800000, true); await Promise.resolve();
  s.lecteur.suivre(null, null, true);
  assert.equal(s.minuterie(), false); assert.equal(s.element.muted, true); assert.equal(s.changements.at(-1), false);
  s.lecteur.suivre({ id: 'nouvelle', startedAt: 0 }, 800000, true); await Promise.resolve();
  s.avancer(800000); assert.equal(s.changements.at(-1), false); assert.equal(s.minuterie(), false);
  s.lecteur.detruire();
  assert.ok(s.pauses() >= 3); assert.equal(s.chargements(), 1); assert.equal(s.element.src, '');
});

test('un refus de lecture automatique propose la reprise et laisse fonctionner l’alarme', async () => {
  const s = installer({ refuser: true });
  s.lecteur.suivre({ id: 'alerte', startedAt: 0 }, 900000, true); await Promise.resolve();
  assert.equal(s.changements.at(-1), false); assert.ok(s.messages.at(-1).includes('Reprendre'));
  s.autoriser(); await s.lecteur.reprendre(); assert.equal(s.changements.at(-1), true);
  s.lecteur.detruire();
});

test('un média absent rend la priorité à la sirène ; une ancienne séquence ne se rejoue pas', () => {
  const s = installer();
  s.lecteur.suivre({ id: 'alerte', startedAt: 0 }, 900000, false);
  s.element.dispatchEvent(new Event('error'));
  assert.equal(s.changements.at(-1), false); assert.ok(s.messages.at(-1).includes('indisponible'));
  s.lecteur.detruire();
  const ancien = installer({ tempsInitial: 1000000 });
  ancien.lecteur.suivre({ id: 'ancienne', startedAt: 0 }, 900000, true);
  assert.equal(ancien.lectures(), 0); assert.equal(ancien.minuterie(), false);
  ancien.lecteur.detruire();
});
