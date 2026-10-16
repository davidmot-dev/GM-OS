/** Fiction jetable du raccord natif LCARS, sans pilote exporté ni campagne personnelle. */
import { readFile } from 'node:fs/promises';
export async function creerSemenceLcars() {
  const demo = JSON.parse(await readFile(new URL('../../e2e/donnees/campagne-de-demo.json', import.meta.url), 'utf8'));
  const pilote = { id: 'custom-lcars-recette', name: 'Star Trek — recette LCARS', corpusId: 'star-trek', author: 'GM-OS — fiction de test',
    version: '1.0.0', description: 'Recette immersive sans automatisation des règles.', emoji: '🖖', templateId: 'generic',
    dice: { engine: 'standard', defaultDice: '1d6', logic: 'sum' }, combat: { statsToTrack: [], initiativeFormula: '1d6' }, modulesDuJeu: [{ id: 'star-trek-lcars' }] };
  const s = demo.modules.sessionOS;
  s.campaigns = s.campaigns.map(c => ({ ...c, system: pilote.id })); s.customGameDrivers = [pilote];
  s.sessions = s.sessions.map(seance => ({ ...seance, status: seance.id === 'demo-seance-2' ? 'active' : 'done' })); s.currentView = 'cockpit';
  return demo;
}
