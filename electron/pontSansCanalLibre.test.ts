import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * **Le pont n'a plus de canal libre, et chaque abonnement sait se retirer.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE CONTRÔLE GARDE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le préload exposait `on` / `off` / `send` / `invoke` génériques, sur n'importe
 * quel canal, à côté d'une centaine de méthodes nommées. Retiré le 2026-09-10,
 * pour deux raisons dont la seconde est la vraie :
 *
 * 1. **La surface réelle n'était pas celle que le contrat annonce.** Six canaux
 *    passaient par le générique sans figurer nulle part, dont `remote:eject-all`
 *    — déconnecter toute la table.
 *
 * 2. ⛔ **`off` ne retirait jamais rien.** `on` enregistrait une fonction
 *    enveloppe anonyme et `off` demandait le retrait du `listener` d'origine,
 *    qui n'avait jamais été enregistré. Electron compare par référence : aucune
 *    correspondance, aucun retrait. **Tout abonnement était définitif** — et
 *    l'effet du hub se réabonnait à chaque changement de `applySyncPayload`.
 *
 * Deux fuites que ce silence cachait, trouvées en fermant le pont :
 * `useImageStore.fetchDisplays` posait un écouteur **à chaque appel**, et les
 * deux abonnements d'`App.tsx` n'étaient même pas mentionnés dans le nettoyage
 * de leur effet.
 *
 * ⚠️ Comme ses voisins `pontDeclareEtExpose` et `demandeDeLEtatCourant`, ce test
 * lit le source. Il ne prouve pas qu'un canal fonctionne : il dit que **le
 * préload ne peut plus offrir de canal anonyme**, et que **tout ce qu'il abonne,
 * il sait le retirer**. C'est le sens qui mord.
 */

const PRELOAD = fs.readFileSync(
    path.join(__dirname, 'preload.ts'),
    'utf-8',
);

describe('aucun canal anonyme', () => {
    /*
      Le générique se reconnaissait à ceci : le nom du canal était une VARIABLE.
      Toute méthode nommée écrit son canal en toutes lettres, et c'est ce qui la
      rend lisible depuis le contrat.
    */
    it('aucun appel IPC ne prend son canal dans une variable', () => {
        const anonymes = PRELOAD.match(/ipcRenderer\.(?:on|off|once|send|invoke|removeAllListeners)\(\s*channel/g);
        expect(anonymes, 'un canal passé en variable rouvre le pont générique').toBeNull();
    });

    it('le pont n’expose plus on / off / send / invoke à la racine', () => {
        for (const nom of ['on', 'off', 'send', 'invoke']) {
            const generique = new RegExp(`^    ${nom}\\(\\.\\.\\.args`, 'm');
            expect(PRELOAD, `\`${nom}\` générique est de retour`).not.toMatch(generique);
        }
    });
});

describe('tout abonnement sait se retirer', () => {
    /**
     * Les deux seuls canaux qui s'abonnent sans rendre de fonction de retrait,
     * chacun avec sa raison. **Cette liste ne doit pas grandir** — même forme
     * que la liste d'exceptions de `pontDeclareEtExpose`.
     *
     * Les deux sont des poignées de main de fermeture : le rappel vit aussi
     * longtemps que la fenêtre, et le danger n'est pas la fuite mais le
     * **doublon**, `StrictMode` montant chaque effet deux fois. Ils se protègent
     * donc par `removeAllListeners` avant de s'abonner, ce que le test vérifie.
     */
    const SANS_RETRAIT: Record<string, string> = {
        'ulanzi:before-quit': 'poignée de main de fermeture — protégée depuis le 2026-08-30',
        'backup:before-quit': 'poignée de main de fermeture — protégée le 2026-09-10',
    };

    const canaux = (motif: RegExp) =>
        [...PRELOAD.matchAll(motif)].map(m => m[1]);

    it('chaque `on` a son `off`, sauf les deux poignées de main', () => {
        const abonnes = new Set(canaux(/ipcRenderer\.on\('([^']+)'/g));
        const retires = new Set(canaux(/ipcRenderer\.off\('([^']+)'/g));

        const orphelins = [...abonnes].filter(c => !retires.has(c) && !(c in SANS_RETRAIT));
        expect(orphelins, 'ces canaux s’abonnent sans jamais se retirer').toEqual([]);
    });

    /*
      Une poignée de main sans ce nettoyage laisse DEUX abonnés répondre, alors
      que le principal attend avec `ipcMain.once` : la première réponse libère la
      fermeture, et la plus rapide est celle qui n'a rien écrit. C'est ce qui a
      coûté la restitution de l'Ulanzi le 30/08.
    */
    it('les deux poignées de main se protègent du doublon', () => {
        const protegees = new Set(canaux(/ipcRenderer\.removeAllListeners\('([^']+)'/g));
        for (const canal of Object.keys(SANS_RETRAIT)) {
            expect(protegees.has(canal), `\`${canal}\` peut avoir deux abonnés`).toBe(true);
        }
    });
});
