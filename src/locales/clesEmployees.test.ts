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
 * **Portée : toutes les clés écrites en toutes lettres**, qu'elles portent leur
 * namespace (`modules:x.y`) ou qu'elles le tiennent de leur composant
 * (`useTranslation('modules')` puis `t('x.y')`). Une clé assemblée à l'exécution
 * (`t('common:status.' + statut)`) ne peut pas être vérifiée ici — elle porte
 * d'ailleurs un `defaultValue`, ce qui est la bonne réponse à ce cas-là.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * L'ANGLE MORT DU 2026-09-09 : LES CLÉS SANS PRÉFIXE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ce contrôle n'a longtemps regardé que les clés préfixées. **Elles sont une
 * minorité** : l'audit du 09/09 a compté **890 appels sans préfixe** hors de sa
 * portée, et **neuf clés introuvables dans les deux langues** parmi eux — dont
 * `image.pad.stop`, affichée en toutes lettres sur la pastille dès qu'une image
 * était projetée.
 *
 * *Un contrôle qui ne couvre qu'une minorité de son sujet rassure plus qu'il ne
 * protège* — et celui-ci a été écrit, précisément, pour ne plus rassurer à tort.
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

/**
 * `t('x.y')` — sans préfixe, plus ce qui suit la clé, qui dit s'il y a un repli.
 *
 * On garde le tir court : une clé de ce projet **contient un point**, et
 * `t('sauvegarder')` serait plus probablement autre chose qu'un appel i18next.
 */
const APPEL_SANS_NS = /\bt\(\s*['"]([A-Za-z0-9_][A-Za-z0-9_.-]*\.[A-Za-z0-9_.-]+)['"]([^)]{0,80})/g;

/**
 * Le ou les namespaces d'un fichier, lus sur son `useTranslation`.
 *
 * ⚠️ **Un tableau vaut « l'un des deux ».** `useTranslation(['modules',
 * 'common'])` laisse i18next parcourir les namespaces dans l'ordre et rendre le
 * premier qui répond — la configuration n'a pas de `fallbackNS`, mais ce
 * parcours-là ne lui doit rien. *Exiger le premier ferait échouer ce test sur du
 * code qui marche.*
 */
const NAMESPACES = /useTranslation\(\s*(\[[^\]]*\]|['"][^'"]*['"])/;

/**
 * Un repli écrit à l'appel — `t('x', 'Texte')` ou `t('x', { defaultValue })`.
 *
 * ⚠️ Ce n'est **pas** une traduction : l'anglais y verra le français de l'auteur.
 * Mais ce n'est pas non plus le défaut que ce contrôle traque — *personne ne
 * voit une clé brute* — et le confondre avec lui rendrait le test bavard.
 */
const aUnRepli = (suite: string) => /^\s*,\s*(['"]|\{[^}]*defaultValue)/.test(suite);

interface Emploi { cle: string; fichier: string }

const emplois: Emploi[] = Object.entries(sources)
    .filter(([chemin]) => !chemin.includes('.test.'))
    .flatMap(([chemin, code]) => {
        const prefixees = [...code.matchAll(APPEL)]
            .map(m => ({ cle: m[1].replace(':', '.'), fichier: chemin }));

        const declaration = NAMESPACES.exec(code);
        if (!declaration) return prefixees;

        const espaces = [...declaration[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
        if (espaces.length === 0) return prefixees;

        const nues = [...code.matchAll(APPEL_SANS_NS)]
            .filter(m => !m[1].includes(':'))
            .filter(m => !aUnRepli(m[2]))
            /* Une clé qui vaut dans l'un des namespaces du composant est trouvée :
               on la présente donc sous chacun, et une seule réussite suffit. */
            .map(m => ({ cles: espaces.map(e => `${e}.${m[1]}`), fichier: chemin }));

        return [...prefixees, ...nues.map(x => ({ cle: x.cles.join('|'), fichier: x.fichier }))];
    })
    // Une clé assemblée à l'exécution : le littéral s'arrête sur un point.
    .filter(e => !e.cle.endsWith('.'));

/** Une clé peut être offerte sous plusieurs namespaces : l'un d'eux suffit. */
const connue = (langue: string, cle: string) => cle.split('|').some(c => sait(langue, c));

describe('les clés employées par le code', () => {
    /** Le test se saborderait en silence si le glob venait à ne plus rien voir. */
    it('sont trouvées en nombre, et les langues avec', () => {
        /* Le seuil est monté avec la portée : les clés sans préfixe sont la
           majorité, et un glob qui ne les verrait plus doit faire rougir. */
        expect(emplois.length).toBeGreaterThan(1200);
        expect(langues.length).toBeGreaterThanOrEqual(2);
    });

    it.each(langues)('existent toutes en %s', (langue) => {
        const absentes = [...new Set(emplois.filter(e => !connue(langue, e.cle)).map(e => e.cle))].sort();
        expect(absentes).toEqual([]);
    });
});
