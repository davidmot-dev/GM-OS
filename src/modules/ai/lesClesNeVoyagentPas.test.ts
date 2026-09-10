import { describe, it, expect } from 'vitest';
import AI_SERVICE from './AIService.ts?raw';
import CLOUDFLARE from './cloudflareImage.ts?raw';
import MAGASIN from '../../stores/useAIStore.ts?raw';

/**
 * **Aucune clé d'API n'est assemblée dans le renderer.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE CONTRÔLE GARDE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * L'appariement clé ↔ hôte (`electron/hotesDesFournisseurs.ts`) empêche une clé
 * de partir vers le mauvais hôte. Il n'empêchait pas le **mélange entre
 * fournisseurs** : rien n'interdisait à un appel déclaré `custom` de porter la
 * clé d'Anthropic, puisque c'est l'écran qui assemblait les en-têtes.
 *
 * Depuis le 2026-09-10, le renderer déclare **pour qui** il parle et le
 * processus principal va chercher la clé dans le coffre. *Une clé qui ne
 * traverse pas le pont ne peut pas être posée sur la mauvaise requête.*
 *
 * ⚠️ Ce test lit le source, comme `pontSansCanalLibre` et
 * `demandeDeLEtatCourant`. Il ne prouve pas qu'un appel aboutit : il dit que
 * **l'écran ne fabrique plus d'identifiant**, et c'est le sens qui mord. Le jour
 * où quelqu'un rajoute un en-tête « juste pour essayer », il rougit.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ET LE RENDERER NE LES DÉTIENT PLUS DU TOUT (2026-09-11)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le magasin ne charge plus aucune valeur : il demande au coffre **qui** a une
 * clé (`etatDuCoffre`, qui rend les noms des entrées sans leurs valeurs) et n'en
 * garde qu'un booléen. Le type `AIModelConfig` n'a même plus de champ pour en
 * retenir une — c'est le typage qui refuse, pas une discipline qu'on oublie.
 */

const SOURCES: Record<string, string> = {
    'AIService.ts': AI_SERVICE,
    'cloudflareImage.ts': CLOUDFLARE,
};

describe('la clé ne part plus dans l’URL', () => {
    /*
      Le cas le plus exposé, et de loin : Gemini attend sa clé en paramètre
      d'URL. Une URL voyage dans les journaux du serveur d'en face, dans les
      traces réseau, et dans tout `console.log` qui la recopie.
    */
    it('aucune URL ne porte de paramètre `key` construit sur place', () => {
        for (const [nom, source] of Object.entries(SOURCES)) {
            expect(source, `${nom} construit une URL avec une clé`).not.toMatch(/[?&]key=\$\{/);
        }
    });
});

describe('la clé ne part plus dans un en-tête', () => {
    it('aucun `x-api-key` n’est écrit côté écran', () => {
        for (const [nom, source] of Object.entries(SOURCES)) {
            expect(source, `${nom} pose un x-api-key`).not.toMatch(/['"]x-api-key['"]\s*:/i);
        }
    });

    it('aucun `Bearer` n’est assemblé côté écran', () => {
        for (const [nom, source] of Object.entries(SOURCES)) {
            expect(source, `${nom} assemble un Bearer`).not.toMatch(/Bearer \$\{/);
        }
    });
});

describe('le fournisseur est déclaré à chaque appel', () => {
    /*
      C'est la contrepartie : le processus principal ne peut poser la bonne clé
      que s'il sait pour qui l'appel parle. `tsc` l'impose déjà — le paramètre
      est obligatoire — mais un `as any` le contournerait sans bruit.
    */
    it('chaque appel au proxy nomme son fournisseur', () => {
        const appels = [...AI_SERVICE.matchAll(/proxyRequest\??\.?\(/g)];
        expect(appels.length, 'des appels au proxy existent').toBeGreaterThan(5);

        /* Les fournisseurs admis, en toutes lettres : voir
           `electron/hotesDesFournisseurs.ts`. */
        const nommes = [...AI_SERVICE.matchAll(/,\s*'(gemini|anthropic|custom|image-cloudflare|ollama|ollama_cloud)'\s*\)/g)];
        expect(nommes.length, 'chaque appel déclare son fournisseur').toBeGreaterThanOrEqual(appels.length);
    });
});

describe('le magasin ne lit aucun secret', () => {
    /*
      ⛔ **L'invariant qui compte ici.** `syncWithKeychain` appelait `getSecret`
      six fois au démarrage et ramenait six secrets dans la mémoire du rendu,
      pour n'en faire que des booléens à l'écran. Il demande maintenant l'état du
      coffre, qui rend les NOMS des entrées et jamais leurs valeurs.

      Le jour où quelqu'un rajoute un `getSecret` « juste pour vérifier », les
      clés recommencent à traverser le pont sans que rien ne le dise.
    */
    it('n’appelle jamais `getSecret`', () => {
        expect(MAGASIN, 'le magasin relit une valeur du coffre').not.toMatch(/getSecret\s*\(/);
    });

    it('demande l’état du coffre, qui ne porte que des noms', () => {
        expect(MAGASIN).toMatch(/etatDuCoffre\s*\(\)/);
    });

    /* `saveSecret` reste : c'est le seul chemin par lequel une clé ENTRE. */
    it('n’écrit au coffre que par un geste nommé', () => {
        const ecritures = [...MAGASIN.matchAll(/saveSecret\s*\(/g)];
        expect(ecritures.length, 'une seule écriture, dans `enregistrerLaCle`').toBe(1);
    });
});
