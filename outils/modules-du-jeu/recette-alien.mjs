/** Même fiction pour l'E2E réseau et la répétition manuelle ; aucune donnée personnelle. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export async function creerSemenceAlien() {
  const demo = JSON.parse(await readFile(new URL('../../e2e/donnees/campagne-de-demo.json', import.meta.url), 'utf8'));
  const pilote = JSON.parse(await readFile(new URL('../../e2e/donnees/pilote-alien-accessoires.json', import.meta.url), 'utf8'));
  const s = demo.modules.sessionOS;
  s.campaigns = s.campaigns.map(campagne => ({ ...campagne, system: pilote.id }));
  s.customGameDrivers = [pilote];
  s.sessions = s.sessions.map(seance => ({ ...seance, status: seance.id === 'demo-seance-2' ? 'active' : 'done' }));
  s.currentView = 'cockpit';
  return demo;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const sortie = fileURLToPath(new URL('../../scratch/modules-du-jeu-recette/', import.meta.url));
  await mkdir(sortie, { recursive: true });
  await writeFile(path.join(sortie, 'semence.json'), JSON.stringify(await creerSemenceAlien(), null, 2));
  console.log('Semence fictive créée : scratch/modules-du-jeu-recette/semence.json');
  console.log('Pour lancer volontairement la répétition : npm.cmd run repetition -- scratch/modules-du-jeu-recette/semence.json');
  console.log('Ports de cette répétition : 4200 (Hub), 4201 (fiches). Profil et sauvegardes jetables, appareils externes désactivés.');
}
