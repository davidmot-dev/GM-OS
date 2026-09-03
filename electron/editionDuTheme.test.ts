import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { extraireJetons } from '../src/theme/jetonsDeTheme';
import { ecrireLesJetons, JETONS_EDITABLES } from '../src/theme/editionDuTheme';

/**
 * **L'atelier de thème, éprouvé sur les vrais fichiers du dépôt.**
 *
 * *Demandé par David le 2026-09-03.* Un thème de jeu, ce sont vingt-deux jetons
 * et **trois cents lignes de règles `.rpg-*`** qui habillent les fiches de
 * personnage. L'atelier les traverse pour reposer une couleur ; s'il les abîme,
 * **rien ne le dira dans l'application** — la casse se verrait en ouvrant une
 * fiche, un autre jour, sans qu'on fasse le lien.
 *
 * D'où le contrôle central : **l'idempotence**. Réécrire un thème avec ses
 * propres valeurs doit rendre le fichier identique, octet pour octet.
 *
 * Ce fichier est dans `electron/` et non dans `src/` pour la même raison que
 * `themesDesJeux.test.ts` : les tests du renderer tournent avec le shim `fs` de
 * `vite-plugin-electron-renderer`, qui ne sait pas lire un fichier. *Un test sur
 * une imitation ne prouve rien du disque.*
 */

const SYSTEMES = path.resolve(__dirname, '..', 'docs', 'systems');

const AVEC_THEME = fs
    .readdirSync(SYSTEMES, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(jeu => fs.existsSync(path.join(SYSTEMES, jeu, 'theme', 'theme.css')));

const lire = (jeu: string) =>
    fs.readFileSync(path.join(SYSTEMES, jeu, 'theme', 'theme.css'), 'utf-8');

describe('l’atelier de thème sur les thèmes réels', () => {
    it('il y en a au moins un — sinon ce fichier ne teste rien', () => {
        expect(AVEC_THEME.length).toBeGreaterThan(0);
    });

    describe.each(AVEC_THEME)('%s', jeu => {
        /**
         * **L'invariant qui garde les trois cents lignes.** Si un thème ressort
         * modifié alors qu'on lui a reposé ses propres valeurs, l'atelier abîme
         * quelque chose — et on l'apprend ici, pas à l'ouverture d'une fiche.
         */
        it('ressort identique quand on lui repose ses propres jetons', () => {
            const css = lire(jeu);

            expect(ecrireLesJetons(css, extraireJetons(css).jetons)).toBe(css);
        });

        /**
         * Et le fichier reste **lisible par la lecture** après écriture : les
         * deux modules doivent voir le même bloc racine, sans quoi l'atelier
         * écrirait là où personne ne lit.
         */
        it('reste relu à l’identique après un changement de couleur', () => {
            const css = lire(jeu);
            const avant = extraireJetons(css);

            const sortie = ecrireLesJetons(css, { accent: '#123456' });
            const apres = extraireJetons(sortie);

            expect(apres.jetons.accent).toBe('#123456');
            expect(apres.clarte).toBe(avant.clarte);
            // Tous les autres jetons sont là, avec leur valeur d'origine.
            for (const [cle, valeur] of Object.entries(avant.jetons)) {
                if (cle === 'accent') continue;
                expect(apres.jetons[cle]).toBe(valeur);
            }
        });

        /**
         * *Vérifié plutôt que supposé* : le catalogue de l'atelier prétend
         * couvrir les jetons du SDK. Si un thème en déclare un que l'atelier
         * ignore, le meneur ne pourrait pas le régler — et ne saurait pas
         * pourquoi.
         */
        it('n’a aucun jeton que l’atelier ne saurait éditer', () => {
            const connus = new Set(JETONS_EDITABLES.map(j => j.cle));
            const inconnus = Object.keys(extraireJetons(lire(jeu)).jetons)
                .filter(cle => !connus.has(cle));

            expect(inconnus).toEqual([]);
        });
    });
});
