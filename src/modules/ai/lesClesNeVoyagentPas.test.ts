import { describe, it, expect } from 'vitest';
import AI_SERVICE from './AIService.ts?raw';
import CLOUDFLARE from './cloudflareImage.ts?raw';

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
 * CE QU'IL NE COUVRE PAS ENCORE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Les clés restent en mémoire du renderer, parce que l'écran des réglages les
 * affiche et que les gardes de présence les lisent. Les en retirer demande que
 * cet écran demande au coffre « y a-t-il une clé ? » plutôt que sa valeur —
 * `SecurityManager.etatDuCoffre()` rend déjà les noms sans les valeurs. C'est
 * l'étape suivante, et elle ne change rien à ce que ce test garde.
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
