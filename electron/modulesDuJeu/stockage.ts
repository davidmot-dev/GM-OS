import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';

export interface StockageDesModules { lire(): Promise<unknown | null>; ecrire(donnees: unknown): Promise<void> }
/** Un fichier privé distinct des campagnes synchronisées ; le précédent survit à un échec d'écriture. */
export function stockageDesModules(fichier: string): StockageDesModules {
    return {
        async lire() {
            try { return JSON.parse(await readFile(fichier, 'utf8')); }
            catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw e; }
        },
        async ecrire(donnees) {
            await mkdir(path.dirname(fichier), { recursive: true });
            const temporaire = `${fichier}.tmp`;
            await writeFile(temporaire, JSON.stringify(donnees), { encoding: 'utf8', mode: 0o600, flush: true });
            await rename(temporaire, fichier);
        },
    };
}
