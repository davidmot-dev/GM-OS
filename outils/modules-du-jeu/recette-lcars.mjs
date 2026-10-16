/** Fiction jetable du raccord natif LCARS, sans pilote exporté ni campagne personnelle. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { creerFiction } from '../star-trek/lcars/fiction.mjs';
import { exporterConfiguration } from '../star-trek/lcars/configuration.mjs';
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

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const sortie = fileURLToPath(new URL('../../scratch/lcars-recette/', import.meta.url));
  await mkdir(sortie, { recursive: true });
  await writeFile(path.join(sortie, 'semence.json'), JSON.stringify(await creerSemenceLcars(), null, 2));
  await writeFile(path.join(sortie, 'preparation-lcars.json'), JSON.stringify(exporterConfiguration(creerFiction()), null, 2));
  console.log('Fiction jetable et préparation créées dans scratch/lcars-recette/.');
  console.log('Lancement volontaire : npm.cmd run repetition -- scratch/lcars-recette/semence.json');
  console.log('Importer ensuite preparation-lcars.json au pupitre LCARS et préparer Nel Varga / Idris Koa.');
  console.log('Ports : 4200 (Hub), 4201 (fiches). Profil et sauvegardes jetables ; appareils externes désactivés.');
}
