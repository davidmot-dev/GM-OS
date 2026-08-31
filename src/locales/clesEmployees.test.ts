import { describe, it, expect } from 'vitest';

/**
 * **Toute clé écrite dans le code existe dans les deux langues.**
 *
 * *Trouvé le 2026-08-31, en réparant la projection des fiches de PNJ :* le
 * message d'échec `modules:image.notifications.projectionFailed` était appelé
 * depuis deux endroits et **n'existait dans aucune des deux langues**. Le meneur
 * voyait une clé brute, ou rien — c'est ce silence qui a permis à la panne de
 * projection de tenir quatre mois sans être signalée.
 *
 * Le compte de ce jour-là : **46 clés employées et absentes partout**, dont les
 * quinze bulles du module Deck et tous les messages de transfert de personnage.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI `deuxLangues.test.ts` NE POUVAIT PAS LES VOIR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il compare les fichiers **entre eux** : il attrape la clé qui manque à une
 * langue, jamais celle qui manque aux deux. *Deux fichiers d'accord entre eux
 * peuvent être faux ensemble* — et l'écart ne se voit qu'en regardant qui les
 * appelle. C'est le pendant exact de la leçon des émetteurs du journal.
 *
 * **Portée : les clés à namespace explicite** (`modules:`, `common:`,
 * `settings:`), écrites en toutes lettres. Une clé sans préfixe dépend du
 * namespace du composant, et une clé assemblée à l'exécution
 * (`t('common:status.' + statut)`) ne peut pas être vérifiée ici — elle porte
 * d'ailleurs un `defaultValue`, ce qui est la bonne réponse à ce cas-là.
 */

/*
  Les sources en texte brut, par le glob de Vite : mêmes raisons que dans
  `deuxLangues.test.ts` — `node:fs` n'est pas disponible dans le projet
  `renderer`, et un fichier neuf entre dans le test sans qu'on y pense.
*/
const sources = import.meta.glob<string>('../**/*.{ts,tsx}', {
    eager: true,
    query: '?raw',
    import: 'default',
});

const traductions = import.meta.glob<Record<string, unknown>>('./*/*.json', {
    eager: true,
    import: 'default',
});

/**
 * Les chemins complets d'un objet de traduction, à plat.
 *
 * **Un tableau est une feuille**, et c'est la différence avec le parcours de
 * `deuxLangues.test.ts`. `loot.gm_tips.quotes` est une liste de cinq citations,
 * demandée d'un bloc avec `returnObjects` : descendre dedans ferait croire que
 * la clé employée n'existe pas, alors que seuls ses indices sont en dessous.
 */
function cles(noeud: unknown, prefixe = ''): string[] {
    if (typeof noeud !== 'object' || noeud === null || Array.isArray(noeud)) return [prefixe];
    return Object.entries(noeud as Record<string, unknown>)
        .flatMap(([k, v]) => cles(v, prefixe ? `${prefixe}.${k}` : k));
}

const langues = [...new Set(Object.keys(traductions).map(c => c.replace('./', '').split('/')[0]))].sort();

/** Ce que chaque langue sait dire, préfixé de son fichier : `modules.session.…`. */
const connues: Record<string, Set<string>> = Object.fromEntries(langues.map(langue => [
    langue,
    new Set(Object.entries(traductions)
        .filter(([chemin]) => chemin.startsWith(`./${langue}/`))
        .flatMap(([chemin, contenu]) => {
            const espace = chemin.split('/')[2].replace('.json', '');
            return cles(contenu).map(c => `${espace}.${c}`);
        })),
]));

/** i18next choisit la forme au pluriel : une seule suffit à ce que la clé existe. */
const PLURIELS = ['', '_zero', '_one', '_two', '_few', '_many', '_other'];
const sait = (langue: string, cle: string) => PLURIELS.some(s => connues[langue].has(cle + s));

/** `t('modules:x.y')`, `i18next.t("common:z")` — le namespace écrit en toutes lettres. */
const APPEL = /\bt\(\s*['"]((?:modules|common|settings):[A-Za-z0-9_.]+)['"]/g;

interface Emploi { cle: string; fichier: string }

const emplois: Emploi[] = Object.entries(sources)
    .filter(([chemin]) => !chemin.includes('.test.'))
    .flatMap(([chemin, code]) =>
        [...code.matchAll(APPEL)]
            .map(m => ({ cle: m[1].replace(':', '.'), fichier: chemin }))
            // Une clé assemblée à l'exécution : le littéral s'arrête sur un point.
            .filter(e => !e.cle.endsWith('.')));

describe('les clés employées par le code', () => {
    /** Le test se saborderait en silence si le glob venait à ne plus rien voir. */
    it('sont trouvées en nombre, et les langues avec', () => {
        expect(emplois.length).toBeGreaterThan(500);
        expect(langues.length).toBeGreaterThanOrEqual(2);
    });

    it.each(langues)('existent toutes en %s', (langue) => {
        const absentes = [...new Set(emplois.filter(e => !sait(langue, e.cle)).map(e => e.cle))].sort();
        expect(absentes).toEqual([]);
    });
});
