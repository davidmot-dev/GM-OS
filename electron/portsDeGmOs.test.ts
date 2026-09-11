import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    lirePort, portsDeGmOs,
    PORT_SYNC_PAR_DEFAUT, PORT_FICHES_PAR_DEFAUT,
    VARIABLE_PORT_SYNC, VARIABLE_PORT_FICHES,
} from './portsDeGmOs';

/**
 * **Les ports réglables, et ce qu'ils ne doivent pas casser.**
 *
 * Rendus réglables pour l'exécution parallèle des tests de bout en bout. Ce que
 * ces tests gardent surtout, c'est que **rien ne bouge pour qui ne règle rien**.
 */

afterEach(() => vi.restoreAllMocks());

describe('sans variable, rien ne change', () => {
    /* Le test qui compte le plus : les tablettes déjà appairées joignent 3001. */
    it('rend les ports historiques', () => {
        expect(portsDeGmOs({})).toEqual({ sync: 3001, fiches: 3002 });
        expect(PORT_SYNC_PAR_DEFAUT).toBe(3001);
        expect(PORT_FICHES_PAR_DEFAUT).toBe(3002);
    });

    it('traite une variable vide comme absente', () => {
        expect(portsDeGmOs({ [VARIABLE_PORT_SYNC]: '', [VARIABLE_PORT_FICHES]: '   ' }))
            .toEqual({ sync: 3001, fiches: 3002 });
    });
});

describe('avec variable', () => {
    it('prend le port demandé', () => {
        expect(portsDeGmOs({ [VARIABLE_PORT_SYNC]: '4101', [VARIABLE_PORT_FICHES]: '4102' }))
            .toEqual({ sync: 4101, fiches: 4102 });
    });

    it('les deux se règlent indépendamment', () => {
        expect(portsDeGmOs({ [VARIABLE_PORT_SYNC]: '4101' }))
            .toEqual({ sync: 4101, fiches: 3002 });
    });
});

describe('une valeur illisible ne doit pas empêcher GM-OS de démarrer', () => {
    /*
      ⚠️ Le meneur perdrait son cockpit pour une faute de frappe dans un script.
      On signale, et on continue avec le défaut.
    */
    it.each(['abc', '-1', '99999', '3001.5', ' '])('« %s » retombe sur le défaut', (valeur) => {
        const alerte = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(lirePort(valeur, 3001, VARIABLE_PORT_SYNC)).toBe(3001);
        alerte.mockRestore();
    });

    /*
      `0` est un port valide pour `listen` — il demande au système d'en attribuer
      un — mais il voudrait dire ici « je n'ai pas choisi », et les écrans ne
      sauraient pas lequel joindre.
    */
    it('refuse le port 0, qui laisserait le système choisir', () => {
        const alerte = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(lirePort('0', 3001, VARIABLE_PORT_SYNC)).toBe(3001);
        alerte.mockRestore();
    });

    it('le dit, plutôt que de corriger en silence', () => {
        const alerte = vi.spyOn(console, 'warn').mockImplementation(() => {});
        lirePort('abc', 3001, VARIABLE_PORT_SYNC);
        expect(alerte).toHaveBeenCalledTimes(1);
        expect(String(alerte.mock.calls[0][0])).toContain(VARIABLE_PORT_SYNC);
    });
});

describe('les deux au même port', () => {
    /* Chacun a désormais sa garde : le second ne démarre pas, et en silence. */
    it('prévient, sans rien corriger', () => {
        const alerte = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const ports = portsDeGmOs({ [VARIABLE_PORT_SYNC]: '4200', [VARIABLE_PORT_FICHES]: '4200' });

        expect(ports, 'on ne devine pas à la place du meneur').toEqual({ sync: 4200, fiches: 4200 });
        expect(alerte).toHaveBeenCalledTimes(1);
        alerte.mockRestore();
    });
});

describe('le module reste utilisable par le navigateur', () => {
    /* Les écrans en lisent les valeurs par défaut — voir `formeDuManuel.ts`. */
    it('n’importe rien du tout', async () => {
        const fs = await import('node:fs');
        const source = fs.readFileSync(new URL('./portsDeGmOs.ts', import.meta.url), 'utf-8');
        expect([...source.matchAll(/^import\s.*$/gm)].map(m => m[0])).toEqual([]);
    });
});

describe('les ports ne sont plus écrits en dur', () => {
    /*
      ⛔ Ils l'étaient à **sept endroits** avant le 2026-09-11 : `3001` dans
      `main.ts`, `useMediaUrl` (deux fois), `useHubSync` (deux fois),
      `useRemoteSync` et l'affichage des réglages — qui annonçait « (3001) » en
      toutes lettres pendant que la ligne du dessus calculait le vrai port.
      `3002`, lui, était **déclaré deux fois**, avec un commentaire demandant aux
      deux nombres de « rester d'accord ».

      *Deux nombres qu'on prie de rester d'accord finissent par diverger.* Ce
      contrôle est ce qui remplace la prière.
    */
    it('aucun fichier d’exécution ne les répète', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const { fileURLToPath } = await import('node:url');

        /*
          ⚠️ `fileURLToPath` et non un découpage de `pathname` à la main : sur
          Windows celui-ci rend « /C:/… », et le `replace` que j'avais écrit
          donnait une racine d'un cran trop haut. Le contrôle ne lisait alors
          **aucun fichier** et passait au vert — le défaut exact que
          `nomsSansEcrivainNiLecteur` avait déjà payé. D'où le compte ci-dessous.
        */
        const racine = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

        const fautifs: string[] = [];
        let examines = 0;

        const parcourir = (dossier: string) => {
            for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
                const complet = path.join(dossier, e.name);
                if (e.isDirectory()) { parcourir(complet); continue; }
                if (!/\.(ts|tsx)$/.test(e.name)) continue;
                if (/\.test\.tsx?$/.test(e.name)) continue;
                if (e.name === 'portsDeGmOs.ts') continue;

                examines++;
                const source = fs.readFileSync(complet, 'utf-8')
                    /* Les commentaires ont le droit de citer les numéros — ils le
                       font pour expliquer d'où ils viennent. */
                    .replace(/\/\*[\s\S]*?\*\//g, '')
                    .replace(/^\s*\/\/.*$/gm, '');

                if (/\b(3001|3002)\b/.test(source)) fautifs.push(path.relative(racine, complet));
            }
        };

        for (const dossier of ['electron', 'src']) parcourir(path.join(racine, dossier));

        /*
          La garde du compte : un contrôle qui n'examine rien passe au vert.

          ⚠️ Elle n'a pas suffi. Ce contrôle a lu 655 fichiers **et n'a rien
          trouvé**, parce que son motif contenait deux caractères BACKSPACE au
          lieu de deux `` — invisibles à la relecture, et jamais satisfaits.
          *Seule la dégradation l'a dit : un contrôle qu'on n'a pas vu rougir
          n'est pas un contrôle, c'est une intention.*
        */
        expect(examines, 'le contrôle doit lire le dépôt, pas un dossier vide').toBeGreaterThan(500);
        expect(fautifs, 'ces fichiers réécrivent un port au lieu de le demander').toEqual([]);
    });
});
