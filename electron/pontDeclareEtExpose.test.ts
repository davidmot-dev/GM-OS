import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * **Tout ce que le contrat du pont déclare, le préload l'expose.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE CONTRÔLE EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Trouvé le 2026-09-09, à l'audit : `extractPdf` était **déclaré deux fois**
 * dans `window.d.ts`, une fois en `Pdf` et une fois en `PDF`. Le préload
 * n'exposait que le second, l'unique appelant écrivait le premier.
 *
 * Le résultat n'était pas une erreur, c'était un **silence** : l'appel optionnel
 * (`?.()`) valait `undefined`, et `RAGService` en concluait que le PDF ne
 * contenait rien. *Aucun PDF du corpus n'a jamais nourri la Forge*, et rien
 * dans le dépôt ne pouvait le dire — le typage était content, puisque c'est le
 * fichier de types lui-même qui légitimait la faute.
 *
 * ⚠️ **C'est le même motif que le § 37c**, à un étage de plus : là-bas la
 * chaîne était complète et il manquait le bouton au bout ; ici le bouton
 * existe, et il appuie à côté. Le contrôle des magasins
 * (`nomsSansEcrivainNiLecteur`) ne pouvait voir ni l'un ni l'autre : *il ne
 * regarde que les magasins.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE TEST FAIT, ET CE QU'IL NE FAIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il compare des **noms**, pas des références — même parti pris que le contrôle
 * des magasins, et mêmes limites : il ne prouve pas qu'un canal fonctionne, il
 * dit qu'un nom déclaré n'a **aucun homonyme dans le préload**. Dans ce sens-là
 * il est sans faux négatif, et c'est le sens qui mord.
 *
 * ⚠️ **Des noms, et pas des chemins** — c'est sa vraie limite, mesurée le jour
 * même : `openExternal` était déclaré **à la racine** du contrat et exposé
 * **sous `web`**, et ce contrôle n'y voyait rien puisque le nom existait
 * quelque part. Le panneau de l'Oracle appelait donc le vide. *La parade n'est
 * pas ici : c'est que le contrat déclare chaque nom là où il est réellement
 * exposé — le typage attrape alors l'appelant tout seul.*
 *
 * D'où la forme retenue, elle aussi reprise : **une liste d'exceptions qui ne
 * doit pas grandir**, chacune avec sa raison et sa date. Un nom neuf qui tombe
 * ici pose la seule question qui vaille — *qui est censé l'exposer ?* — et deux
 * réponses honnêtes existent : l'exposer, ou retirer la promesse du contrat.
 */

const RACINE = path.resolve(__dirname, '..');

const contrat = fs.readFileSync(path.join(RACINE, 'src', 'types', 'window.d.ts'), 'utf-8');
const preload = fs.readFileSync(path.join(RACINE, 'electron', 'preload.ts'), 'utf-8');

/**
 * ⛔ **TROIS TROUS CONNUS, datés du 2026-09-09.**
 *
 * Ces trois-là sont **appelés** par l'application et n'existent pas dans le
 * préload : la garde `if (pont?.x)` qui les entoure est donc toujours fausse.
 * On ne peut pas les retirer du contrat — leurs appelants ne compileraient
 * plus — et les exposer demande une décision qui n'est pas la mienne.
 *
 * *Ils sont ici pour être vus, pas pour être tolérés.*
 */
const TROUS_CONNUS: Record<string, string> = {
    highlightMapToken:
        "Appelé trois fois par useCombatStore pour souligner le pion du combattant actif sur la carte. " +
        "RIEN ne l'implémente, nulle part : la fonctionnalité n'a jamais marché.",
};

/** Les noms de fonctions déclarés dans `interface AppBridge`. */
const declarationsDuContrat = (): string[] => {
    const debut = contrat.indexOf('interface AppBridge');
    expect(debut, "l'interface AppBridge a changé de nom").toBeGreaterThan(-1);

    /* On s'arrête à l'interface suivante : `Window` déclare des globales du
       renderer (`hueEngine`, `soundEngine`…) qui n'ont rien à faire dans un
       préload. Les mélanger rendrait ce contrôle bavard et faux. */
    const suite = contrat.indexOf('interface Window', debut);
    const bloc = contrat.slice(debut, suite > -1 ? suite : undefined);

    const noms = new Set<string>();
    for (const ligne of bloc.split('\n')) {
        const m = /^\s+(\w+)\s*\??\s*:\s*\(/.exec(ligne);
        if (m) noms.add(m[1]);
    }
    return [...noms].sort();
};

/** Les noms exposés par le préload — `x: (…) =>` comme `x(…) {`. */
const expositionsDuPreload = (): Set<string> => {
    const noms = new Set<string>();
    for (const m of preload.matchAll(/(\w+)\s*:\s*(?:\(|async)/g)) noms.add(m[1]);
    for (const m of preload.matchAll(/^\s+(\w+)\s*\([^)]*\)\s*\{/gm)) noms.add(m[1]);
    return noms;
};

describe('le contrat du pont et ce que le préload expose', () => {
    it('déclare assez de choses pour que le contrôle ait un sens', () => {
        /* Une garde contre le pire des échecs : un contrôle qui ne trouve plus
           rien à mesurer et se déclare vert. */
        expect(declarationsDuContrat().length).toBeGreaterThan(50);
    });

    it('n’annonce rien que le préload n’expose', () => {
        const exposes = expositionsDuPreload();
        const orphelins = declarationsDuContrat()
            .filter(n => !exposes.has(n))
            .filter(n => !(n in TROUS_CONNUS));

        expect(orphelins, `Déclaré dans le contrat du pont, exposé par personne : ${orphelins.join(', ')}. ` +
            `Qui est censé l'exposer ? Deux réponses honnêtes : l'exposer, ou retirer la promesse du contrat.`)
            .toEqual([]);
    });

    /**
     * *Une liste d'exceptions qui grandit est une liste qui a perdu son sens.*
     * Ce test-ci ne juge pas les trous connus : il refuse qu'on en ajoute un
     * quatrième sans le dire.
     */
    it('ne laisse pas la liste des trous connus grandir en silence', () => {
        expect(Object.keys(TROUS_CONNUS).sort()).toEqual([
            'highlightMapToken',
        ]);
    });

    /**
     * ⛔ **Le défaut d'origine était un nom déclaré DEUX FOIS**, `extractPdf` et
     * `extractPDF`. Il n'y a pas de test séparé pour ça, et c'est délibéré : des
     * deux orthographes, **c'est celle que le préload n'exposait pas** qui
     * faisait le dégât, et le contrôle ci-dessus la voit. *Un doublon dont les
     * deux moitiés sont exposées est laid, pas dangereux* — et le distinguer
     * demanderait d'écrire un analyseur de `.d.ts` dans un test, c'est-à-dire
     * un second endroit où se tromper.
     */
});
