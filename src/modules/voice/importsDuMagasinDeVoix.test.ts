import { describe, it, expect } from 'vitest';
import SOURCE from './useVoiceStore.ts?raw';

/**
 * **Le magasin de la voix ne doit tirer ni la séance, ni l'IA, en tête de fichier.**
 *
 * Corrigé le 2026-09-05, sur un défaut trouvé en construisant autre chose.
 *
 * ⛔ **Le mécanisme, et il est retors.** `useVoiceStore` importait
 * `contexteAllegeMaintenant` depuis `ai/modeDeContexte`, qui tire
 * `useSessionOSStore`, d'où l'on atteint les moteurs de Music-OS et
 * d'Ambient-OS. Or ces moteurs **se construisent au chargement de leur module**
 * et s'abonnent aussitôt à `useVoiceStore`. Quand celui-ci était le point
 * d'entrée du graphe, ils recevaient donc un module **encore en cours
 * d'évaluation** : leur abonnement échouait, et **la musique cessait de baisser
 * quand le meneur parle** — sans une ligne dans la console de l'application.
 *
 * *Un cycle d'imports ne casse rien tant que personne n'entre par le mauvais
 * bout.* C'est ce qui le rend si difficile à voir, et si facile à rouvrir : il
 * suffit qu'un jour un écran importe la voix avant le reste.
 *
 * ⚠️ **Ce test ne dit pas « pas de dépendance ».** La voix a le droit de se
 * servir de l'IA et de la séance — mais **en différé**, dans l'action qui en a
 * besoin, jamais en tête de fichier. Le `await import()` reste permis, et c'est
 * exactement ce que le correctif emploie.
 */

/** Les familles qui, chargées d'ici, referment le cercle. */
const INTERDITS = [
    { motif: /^import[^\n]*from\s+['"]\.\.\/ai\//m, quoi: "l'IA (`../ai/…`)" },
    { motif: /^import[^\n]*from\s+['"]\.\.\/session\//m, quoi: 'la séance (`../session/…`)' },
    { motif: /^import[^\n]*from\s+['"]\.\.\/music\//m, quoi: 'Music-OS (`../music/…`)' },
    { motif: /^import[^\n]*from\s+['"]\.\.\/ambient\//m, quoi: 'Ambient-OS (`../ambient/…`)' },
];

describe('les imports du magasin de la voix', () => {
    for (const { motif, quoi } of INTERDITS) {
        it(`n'attire pas ${quoi} en tête de fichier`, () => {
            expect(
                motif.test(SOURCE),
                `useVoiceStore.ts importe ${quoi} statiquement. Cela referme le cycle qui prive `
                + 'Music-OS et Ambient-OS de leur ducking, en silence. '
                + "Utilisez `await import(…)` dans l'action qui en a besoin.",
            ).toBe(false);
        });
    }

    it('emploie bien la voie différée là où il a besoin du contexte', () => {
        /*
          La contrepartie du test précédent : il interdit une écriture, celui-ci
          vérifie que l'autre est bien là. *Une interdiction sans son remplacement
          se contourne en supprimant la fonctionnalité.*
        */
        expect(SOURCE).toContain("await import('../ai/modeDeContexte')");
    });
});
