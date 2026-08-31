import { describe, it, expect } from 'vitest';

/**
 * **Les deux langues portent les mêmes clés — et c'est un test, plus une case à
 * cocher.**
 *
 * Le jalon du 2026-04-18 portait une ligne « validation finale multi-langue »,
 * restée vide quatre mois. Mesurée le 2026-08-31 : **32 clés `fr` sans
 * équivalent `en`** — les vingt-et-un effets de Light-OS livrés en avril, les six
 * catégories qui les rangent, et les cinq libellés du module Deck ajoutés le
 * 30/08 — plus **3 clés `en` orphelines** employées par `NexusService`, donc
 * affichées en clé brute **dans la langue par défaut** pendant un export Nexus.
 *
 * *Une « validation finale » ne se coche jamais : elle est fausse dès la
 * prochaine fonctionnalité.* Un écart, lui, se compte à chaque exécution.
 *
 * **Le défaut se voit dans les deux sens, et c'est pour ça qu'on compare les
 * deux.** Une clé qui manque à l'anglais ne gêne personne ici ; une clé qui
 * manque au français casse l'écran de David. Ne vérifier qu'un sens laisserait
 * passer le cas le plus visible — c'est exactement ce qui est arrivé aux trois
 * clés de Nexus.
 *
 * **Pourquoi le glob de Vite et non `node:fs`.** Ces tests tournent dans le
 * projet `renderer`, en jsdom, où le greffon `vite-plugin-electron-renderer`
 * neutralise les modules natifs. Le glob a de toute façon la meilleure
 * propriété : *une quatrième langue, ou un quatrième fichier, entre dans le test
 * sans qu'on ait à y penser.*
 */

const fichiers = import.meta.glob<Record<string, unknown>>('./*/*.json', {
    eager: true,
    import: 'default',
});

/** Les chemins complets d'un objet de traduction, à plat. */
function cles(noeud: unknown, prefixe = ''): string[] {
    if (typeof noeud !== 'object' || noeud === null) return [prefixe];
    return Object.entries(noeud as Record<string, unknown>)
        .flatMap(([k, v]) => cles(v, prefixe ? `${prefixe}.${k}` : k));
}

/** `./fr/modules.json` → `['fr', 'modules.json']`. */
const decouper = (chemin: string) => chemin.replace('./', '').split('/');

const langues = [...new Set(Object.keys(fichiers).map(c => decouper(c)[0]))].sort();
const noms = [...new Set(Object.keys(fichiers).map(c => decouper(c)[1]))].sort();

describe('les fichiers de traduction', () => {
    /** Le test se saborderait en silence si le dossier venait à être déplacé. */
    it('sont bien là, dans au moins deux langues', () => {
        expect(langues.length).toBeGreaterThanOrEqual(2);
        expect(noms.length).toBeGreaterThan(0);
    });

    it.each(noms)('%s existe dans toutes les langues', (nom) => {
        const presentes = langues.filter(l => `./${l}/${nom}` in fichiers);
        expect(presentes).toEqual(langues);
    });

    it.each(noms)('%s porte exactement les mêmes clés partout', (nom) => {
        const [reference, ...autres] = langues;
        const attendues = cles(fichiers[`./${reference}/${nom}`]).sort();

        for (const langue of autres) {
            const trouvees = cles(fichiers[`./${langue}/${nom}`]).sort();

            // Nommées et non comptées : un message qui dit « 32 » envoie
            // chercher, un message qui dit lesquelles envoie corriger.
            expect(
                attendues.filter(k => !trouvees.includes(k)),
                `clés de « ${reference} » absentes de « ${langue} » dans ${nom}`,
            ).toEqual([]);
            expect(
                trouvees.filter(k => !attendues.includes(k)),
                `clés de « ${langue} » absentes de « ${reference} » dans ${nom}`,
            ).toEqual([]);
        }
    });
});
