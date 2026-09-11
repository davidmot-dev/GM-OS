import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * **Aucun module importé par `main.ts` ne résout `userData` à son évaluation.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE CONTRÔLE GARDE, ET CE QU'IL A COÛTÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `app.getPath('userData')` ne se contente pas de lire un chemin : il le
 * **verrouille** pour toute la vie du processus, à partir du nom de
 * l'application **au moment de l'appel**. Or `main.ts` commence par poser
 * `app.name = 'gm-os-v5'` — le nom de `package.json` étant `gm-os-v6` — et ce
 * verrou-là doit venir en premier.
 *
 * ⛔ **Le 2026-09-11, il n'est pas venu en premier.** En sortant
 * `securityManager` de `registerSecurityHandlers` pour que le proxy IA lise le
 * même coffre, il est devenu une instance de **niveau module** — et son
 * constructeur appelait `app.getPath`. Les imports s'évaluant avant le corps du
 * module, l'appel tombait **1 643 lignes avant** `app.name` dans le paquet
 * construit.
 *
 * Résultat : toutes les données ont basculé sur le profil `gm-os-v6`, vide. Au
 * démarrage suivant, David a trouvé **une campagne de démonstration à la place
 * de ses sept**, et ses clés d'API avaient disparu avec. *Rien n'était perdu —
 * tout était ailleurs, et rien ne le disait.*
 *
 * ⚠️ **Le commentaire de `main.ts` énonçait déjà la règle** — « lock the storage
 * path before any getPath calls ». Il ne protégeait que ce qu'on lisait **dans**
 * `main.ts` ; le défaut est entré par un import. *Une règle écrite là où on la
 * lit ne couvre pas là où on l'enfreint.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE TEST FAIT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il lit le source des modules qu'importe `main.ts` et refuse deux formes :
 * `app.getPath` **au niveau module**, et `app.getPath` **dans un
 * `constructor`** — la seconde étant celle qui a mordu, parce qu'un constructeur
 * ne ressemble pas à du code qui s'exécute à l'import tant qu'on n'a pas vu le
 * `new` de niveau module qui va avec.
 *
 * Il ne remplace pas la lecture : un module pourrait appeler `getPath` depuis
 * une fonction appelée au niveau module. Mais il attrape les deux formes
 * observées, et sans faux positif.
 */

const DOSSIER = __dirname;

const MAIN = fs.readFileSync(path.join(DOSSIER, 'main.ts'), 'utf-8');

/** Les modules locaux qu'importe `main.ts` — c'est eux qui s'évaluent avant lui. */
const importesParMain = [...MAIN.matchAll(/^import\s[^;]*?from\s+'\.\/([\w-]+)'/gm)]
    .map(m => m[1])
    .filter(nom => fs.existsSync(path.join(DOSSIER, `${nom}.ts`)));

describe('le verrou du chemin de données', () => {
    it('main.ts pose `app.name` avant tout appel à getPath', () => {
        const nom = MAIN.indexOf("app.name = 'gm-os-v5'");
        const premierGetPath = MAIN.indexOf('app.getPath(');

        expect(nom, '`app.name` doit être posé').toBeGreaterThan(-1);
        expect(premierGetPath, 'un getPath existe bien dans main.ts').toBeGreaterThan(-1);
        expect(premierGetPath, 'getPath avant le verrou du nom').toBeGreaterThan(nom);
    });

    it('main.ts importe bien des modules locaux — sinon ce test ne mesure rien', () => {
        expect(importesParMain.length).toBeGreaterThan(10);
    });

    /*
      ⛔ La forme exacte du défaut du 11/09 : un constructeur qui résout le
      chemin. Couplé à une instance de niveau module, il s'exécute à l'import.
      Le chemin doit se résoudre au premier BESOIN — un accesseur paresseux.
    */
    it.each(importesParMain)('%s ne résout pas userData dans un constructeur', (nom: string) => {
        const source = fs.readFileSync(path.join(DOSSIER, `${nom}.ts`), 'utf-8');
        const constructeurs = [...source.matchAll(/constructor\s*\([^)]*\)\s*\{/g)];

        for (const c of constructeurs) {
            // Le corps du constructeur, jusqu'à sa fermeture au même niveau.
            let profondeur = 0;
            let i = c.index! + c[0].length - 1;
            const debut = i;
            do {
                if (source[i] === '{') profondeur++;
                else if (source[i] === '}') profondeur--;
                i++;
            } while (profondeur > 0 && i < source.length);

            expect(
                source.slice(debut, i),
                `${nom} : un constructeur appelle app.getPath — il s'exécutera à l'import`,
            ).not.toContain('app.getPath');
        }
    });

    it.each(importesParMain)('%s n’appelle pas getPath au niveau module', (nom: string) => {
        const source = fs.readFileSync(path.join(DOSSIER, `${nom}.ts`), 'utf-8');
        /* Sans indentation : ni dans une fonction, ni dans une classe. */
        expect(
            source,
            `${nom} : app.getPath au niveau module, avant le verrou du nom`,
        ).not.toMatch(/^(?:const|let|var)\s+\w+[^\n]*app\.getPath\(/m);
    });
});
