import test from 'node:test';
import assert from 'node:assert/strict';
import { creerVoix } from './voix.mjs';
function preparer() {
  const phrases = []; let annulations = 0;
  const synthese = { speaking: false, pending: false, getVoices: () => [{ lang: 'fr-FR', localService: true }],
    speak(p) { phrases.push(p); this.speaking = true; }, cancel() { annulations++; this.speaking = false; } };
  class Parole { constructor(text) { this.text = text; } }
  return { synthese, Parole, phrases, annulations: () => annulations };
}
test('une voix extérieure est prioritaire et une coupure LCARS ne l’annule pas', () => {
  const t = preparer(), voix = creerVoix(t);
  assert.equal(voix.parler('Alerte rouge'), true);
  t.synthese.speak(new t.Parole('Annonce d’un autre outil'));
  assert.equal(t.annulations(), 1); assert.equal(t.phrases.at(-1).text, 'Annonce d’un autre outil');
  voix.arreter(); voix.detruire(); assert.equal(t.annulations(), 1);
});
test('LCARS n’interrompt pas une voix déjà en cours ou en attente', () => {
  const t = preparer(); t.synthese.speak(new t.Parole('Autre voix'));
  const voix = creerVoix(t); assert.equal(voix.parler('Alerte'), false); voix.detruire(); assert.equal(t.annulations(), 0);
});
test('arrêter sa propre phrase est idempotent, puis restaure les API originales', () => {
  const t = preparer(), original = t.synthese.speak, voix = creerVoix(t);
  voix.parler('Deux minutes'); voix.arreter(); voix.arreter(); assert.equal(t.annulations(), 1);
  voix.detruire(); assert.equal(t.synthese.speak, original); assert.equal(voix.parler('Ancienne vue'), false);
});
test('plusieurs propriétaires ne suppriment pas les phrases des autres', () => {
  const t = preparer(), a = creerVoix(t), b = creerVoix(t);
  a.parler('A'); assert.equal(b.parler('B'), false); b.detruire(); assert.equal(t.annulations(), 0);
  t.phrases[0].onend(); t.synthese.speaking = false;
  a.parler('A2'); a.detruire(); assert.equal(t.annulations(), 1);
});
