import { describe, it, expect } from 'vitest';

/**
 * **Hors de Light-OS, personne ne clique.**
 *
 * `applyScene` distingue le geste du meneur de l'enchaînement de l'application,
 * et ce drapeau décide de deux choses qui ne se voient pas à l'écran :
 *
 * - **le journal de séance** — *on consigne ce que le meneur a voulu, pas ce que
 *   l'application a enchaîné* ; une scène liée à une piste de musique écrirait
 *   sinon une seconde ligne pour le même geste ;
 * - **`lastManualSceneId`** — la scène où l'on revient quand un son se termine.
 *   Un enchaînement qui l'écrase fait revenir la pièce sur une ambiance que le
 *   meneur n'a jamais choisie.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE CONTRÔLE EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Trouvé le 2026-09-09, à l'audit : `useStoryboardStore` appelait `applyScene`
 * **sans le drapeau**, et il était le seul des six. La documentation de la
 * méthode cite pourtant *« un moment de storyboard »* parmi les enchaînements —
 * *le code contredisait son propre commentaire, et rien ne pouvait le dire.*
 *
 * La règle tient en une phrase parce que la frontière est nette : **un appel qui
 * vient d'un autre module n'a pas de doigt derrière lui.** Les gestes, eux,
 * vivent dans Light-OS — une tuile qu'on clique, une touche qu'on presse — et
 * c'est là, et là seulement, que l'omission du drapeau veut dire quelque chose.
 *
 * ⚠️ Le Spotlight fait exception à l'œil, pas à la règle : son `applyScene` est
 * celui du magasin d'**ambiance**, pas des lumières.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE TEST NE PEUT PAS FAIRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il reconnaît le moteur à son nom (`hueEngine`, ou `hue` quand il est reçu en
 * variable). Un appelant qui le baptiserait autrement lui échapperait — d'où le
 * décompte minimal ci-dessous, qui rougit si le peigne cesse de trouver ce
 * qu'il trouvait.
 */

const sources = import.meta.glob<string>('../../**/*.{ts,tsx}', {
    eager: true,
    query: '?raw',
    import: 'default',
});

/** `hueEngine.applyScene(`, `gWindow.hueEngine.applyScene(`, `hue.applyScene(`. */
const APPEL = /\b(?:hueEngine|hue)\.applyScene\(/g;

interface Appel { fichier: string; arguments: string }

/** Les arguments d'un appel, jusqu'à sa parenthèse fermante. */
const argumentsDe = (code: string, depuis: number): string => {
    let profondeur = 0;
    for (let i = depuis; i < code.length; i++) {
        const c = code[i];
        if (c === '(') profondeur++;
        else if (c === ')') {
            profondeur--;
            if (profondeur === 0) return code.slice(depuis + 1, i);
        }
    }
    return code.slice(depuis);
};

const appelsExterieurs: Appel[] = Object.entries(sources)
    .filter(([chemin]) => !chemin.includes('.test.'))
    /* ⚠️ **Les chemins de la glob sont relatifs à CE fichier** : les sources de
       Light-OS y commencent par `./`, jamais par `/light/`. Le premier filtre écrit
       visait le second motif et laissait donc passer les gestes du module
       lui-même — le contrôle accusait la tuile qu'on clique. */
    .filter(([chemin]) => !chemin.startsWith('./') && !chemin.includes('/light/'))
    .flatMap(([chemin, code]) =>
        [...code.matchAll(APPEL)].map(m => ({
            fichier: chemin,
            arguments: argumentsDe(code, m.index + m[0].length - 1),
        })));

/** Un second argument, virgule au premier niveau. */
const passeLeDrapeau = (args: string): boolean => {
    let profondeur = 0;
    for (const c of args) {
        if (c === '(' || c === '[' || c === '{') profondeur++;
        else if (c === ')' || c === ']' || c === '}') profondeur--;
        else if (c === ',' && profondeur === 0) return true;
    }
    return false;
};

describe('qui a le droit de signer du nom du meneur', () => {
    it('trouve les appels venus des autres modules', () => {
        /* Cinq au 2026-09-09 : zones de la carte (2), Sound-OS (2), Music-OS,
           instantané, storyboard. Le seuil protège le peigne, pas le compte. */
        expect(appelsExterieurs.length).toBeGreaterThanOrEqual(5);
    });

    it('les fait tous passer pour des enchaînements', () => {
        const signataires = appelsExterieurs
            .filter(a => !passeLeDrapeau(a.arguments))
            .map(a => `${a.fichier} : applyScene(${a.arguments})`);

        expect(signataires, "Un appel venu d'un autre module n'a pas de doigt derrière lui : " +
            "il doit passer `true` en second argument, sinon il écrit au journal " +
            'et écrase la scène où le meneur revient.').toEqual([]);
    });
});
