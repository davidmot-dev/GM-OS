import { defineConfig } from 'vitest/config';
// Audit de l'archive locale en Node, sans importer les API Electron dans le navigateur.
export default defineConfig({ test: { environment: 'node', include: ['outils/star-trek/pilote.test.ts'] } });
