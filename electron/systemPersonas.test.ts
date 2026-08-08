import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Les personas par système vivent dans `docs/systems/<id>/gems.json`.
 *
 * Ce chemin n'est pas décoratif : `AIService.prepareSystemPrompt` appelle
 * `readDoc('systems/<id>/gems.json')`, que le handler `ai:read-doc` résout
 * depuis `docsPath`, lui-même calculé en `path.join(APP_ROOT, 'docs')`.
 * Un fichier rangé ailleurs — dans un sous-dossier `personas/`, par exemple —
 * n'est jamais lu, sans le moindre message d'erreur.
 *
 * Ces tests verrouillent le contrat de bout en bout : l'emplacement, la
 * lisibilité, la forme JSON, et les clés attendues par le consommateur.
 */

const APP_ROOT = path.join(__dirname, '..');
const DOCS = path.join(APP_ROOT, 'docs');
const SYSTEMS = path.join(DOCS, 'systems');

/** Identifiants des gemmes, définis dans `src/stores/useGemStore.ts`. */
const GEM_IDS = [
  'sage', 'scribe', 'oracle', 'bard',
  'alchemist', 'actor', 'cartographer', 'strategist',
] as const;

/** Reproduit la résolution du handler `ai:read-doc` (electron/RAGEngine.ts). */
function readDoc(relativePath: string): string | null {
  const fullPath = path.join(DOCS, relativePath);
  if (!fs.existsSync(fullPath) || !fullPath.startsWith(DOCS)) return null;
  return fs.readFileSync(fullPath, 'utf-8');
}

function systemsWithPersonas(): string[] {
  if (!fs.existsSync(SYSTEMS)) return [];
  return fs
    .readdirSync(SYSTEMS, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(id => fs.existsSync(path.join(SYSTEMS, id, 'gems.json')));
}

describe('personas par système', () => {
  it('résout docsPath comme le fait RAGEngine', () => {
    expect(DOCS).toBe(path.join(APP_ROOT, 'docs'));
    expect(fs.existsSync(DOCS)).toBe(true);
  });

  it('trouve au moins un système pourvu de personas', () => {
    expect(systemsWithPersonas().length).toBeGreaterThan(0);
  });

  it.each(systemsWithPersonas())('« %s » : gems.json est lisible par readDoc', (systemId) => {
    expect(readDoc(`systems/${systemId}/gems.json`)).not.toBeNull();
  });

  it.each(systemsWithPersonas())('« %s » : le JSON est valide et non vide', (systemId) => {
    const raw = readDoc(`systems/${systemId}/gems.json`)!;
    const parsed = JSON.parse(raw);
    expect(typeof parsed).toBe('object');
    expect(Object.keys(parsed).length).toBeGreaterThan(0);
  });

  it.each(systemsWithPersonas())('« %s » : chaque clé correspond à une gemme connue', (systemId) => {
    const parsed = JSON.parse(readDoc(`systems/${systemId}/gems.json`)!);
    // Une clé inconnue est du travail perdu : AIService indexe par gemId.
    for (const key of Object.keys(parsed)) {
      expect(GEM_IDS).toContain(key);
    }
  });

  it.each(systemsWithPersonas())('« %s » : chaque persona est du texte exploitable', (systemId) => {
    const parsed = JSON.parse(readDoc(`systems/${systemId}/gems.json`)!);
    for (const [gemId, value] of Object.entries(parsed)) {
      expect(typeof value, `${gemId} doit être une chaîne`).toBe('string');
      expect((value as string).trim().length, `${gemId} ne doit pas être vide`).toBeGreaterThan(0);
    }
  });

  it.each(systemsWithPersonas())('« %s » : aucune persona n\'explose le budget de prompt', (systemId) => {
    const parsed = JSON.parse(readDoc(`systems/${systemId}/gems.json`)!);
    // La persona est en tête de CHAQUE prompt système : sa longueur se paie à
    // chaque question. 1200 caractères est une limite haute, pas une cible.
    for (const [gemId, value] of Object.entries(parsed)) {
      expect((value as string).length, `${gemId} est trop longue`).toBeLessThanOrEqual(1200);
    }
  });

  it('aucun gems.json n\'est rangé dans un sous-dossier où personne ne le lira', () => {
    const egares: string[] = [];
    for (const systemId of fs.readdirSync(SYSTEMS, { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name)) {
      const racine = path.join(SYSTEMS, systemId);
      for (const entry of fs.readdirSync(racine, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const sousDossier = path.join(racine, entry.name);
        for (const f of fs.readdirSync(sousDossier)) {
          if (f.endsWith('.json') && /gem|persona/i.test(f)) {
            egares.push(path.relative(DOCS, path.join(sousDossier, f)));
          }
        }
      }
    }
    expect(egares, 'un fichier de personas hors de systems/<id>/gems.json ne sera jamais lu').toEqual([]);
  });
});
