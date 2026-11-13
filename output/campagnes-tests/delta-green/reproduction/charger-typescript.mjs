import { registerHooks } from 'node:module';

// Node 24 sait retirer les types ; les imports du renderer restent ceux de Vite.
// Ce raccord est réservé aux générateurs locaux, sans changement de l'application.
registerHooks({ resolve(s, contexte, suivant) {
    try { return suivant(s, contexte); } catch (erreur) {
        if (s.startsWith('.') && !s.split('/').at(-1).includes('.')) {
            for (const suffixe of ['.ts', '/index.ts']) {
                try { return suivant(s + suffixe, contexte); } catch { /* autre forme */ }
            }
        }
        throw erreur;
    }
} });
