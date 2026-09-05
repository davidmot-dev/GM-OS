import { describe, it, expect } from 'vitest';
import SHELL from './Shell.tsx?raw';
import APP from '../App.tsx?raw';

/**
 * **Le châssis ne doit pas se démonter quand un module charge.**
 *
 * Trouvé par David le 2026-09-05 : *« quand je vais dans un autre module,
 * l'Ulanzi se reset, il faut qu'il reste connecté tant que je n'arrête pas
 * GM-OS »*.
 *
 * ⛔ **Le mécanisme, et il est retors.** Les modules sont chargés en `lazy`. À la
 * **première** ouverture de chacun, le chargement du morceau suspend le rendu —
 * et le seul `Suspense` au-dessus enveloppait **`Shell` lui-même**. React
 * masquait donc tout le châssis le temps du chargement, ce qui **nettoie les
 * effets** de ses crochets.
 *
 * Or `Shell` porte précisément les émetteurs qu'on y a montés *pour qu'ils ne
 * s'arrêtent jamais* :
 *
 * | Crochet | Ce que son nettoyage déclenche |
 * | --- | --- |
 * | `useBattementUlanzi` | **rend la main à l'afficheur** — le « reset » |
 * | `useBattementDuMinuteur` | le compte à rebours cesse de descendre |
 * | `usePrechauffageDuModele` | le modèle se décharge |
 * | `useLumiereQuiSuitLaVoix` | la lumière cesse de suivre |
 *
 * *Un émetteur attaché à une vue émet ce que la vue veut bien* — la leçon du
 * 30/08 avait fait monter ces crochets dans `Shell`, et une frontière absente
 * les redescendait au rang de la vue sans que rien ne le dise. **Le défaut ne se
 * produisait qu'au premier passage dans chaque module** : une fois le morceau en
 * cache, plus rien. De quoi chercher longtemps.
 *
 * ⚠️ **Ce que ce test ne prouve pas.** Il lit le source. Il vérifie qu'une
 * frontière existe autour des enfants du châssis — pas qu'elle soit la plus
 * proche à l'exécution, ni que les crochets survivent réellement. *Mieux vaut le
 * dire que laisser croire à une garde qui n'existe pas.* Monter `Shell` en
 * entier demanderait de simuler une douzaine de magasins ; la frontière, elle,
 * se lit.
 */

describe('la frontière de chargement', () => {
    it('le châssis enveloppe ses enfants dans un Suspense', () => {
        /* On cherche l'ordre : <Suspense …> puis {children} avant la fermeture. */
        const zone = SHELL.slice(SHELL.indexOf('<Suspense'), SHELL.indexOf('</Suspense>'));
        expect(zone).toContain('{children}');
    });

    it('les crochets permanents sont bien montés dans le châssis', () => {
        /*
          Si l'un déménageait, la frontière ci-dessus ne le protégerait plus — et
          ce test le dirait au lieu de laisser le défaut revenir ailleurs.
        */
        for (const crochet of [
            'useBattementUlanzi',
            'useBattementDuMinuteur',
            'usePrechauffageDuModele',
            'useLumiereQuiSuitLaVoix',
        ]) {
            expect(SHELL).toContain(`${crochet}(`);
        }
    });

    it('le châssis reste rendu par App sans condition de chargement', () => {
        /* `<Shell>{renderModule()}</Shell>` : les modules sont ses enfants, donc
           ce qui les suspend ne doit pas remonter au-dessus de lui. */
        expect(APP).toContain('<Shell>{renderModule()}</Shell>');
    });
});
