import { describe, it, expect } from 'vitest';
import { fusionnerEtatIA } from './useAIStore';

/**
 * Ce que ces tests protègent : **ce qui vient du coffre survit à la
 * réhydratation**.
 *
 * **Le symptôme, rapporté par David le 2026-08-15** : *« mon trousseau perd
 * tout le temps les clés, je dois constamment les remettre. »*
 *
 * Le coffre ne perdait rien. `partialize` retire du stockage ce qui vient du
 * trousseau — c'est voulu — et la fusion remplaçait ensuite **chaque
 * fournisseur en bloc** par cette version-là. Le démarrage relisait le coffre,
 * puis la réhydratation, asynchrone parce que le stockage est IndexedDB,
 * atterrissait par-dessus et effaçait tout.
 *
 * *Une clé qui disparaît sans erreur ressemble à un coffre qui oublie ; c'était
 * une fusion qui écrase.* Même mécanisme que la perte de campagnes du
 * 2026-08-07 : une fusion superficielle qui remplace des objets entiers.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A CHANGÉ LE 2026-09-11, ET CE QUI N'A PAS CHANGÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Les clés ne vivent plus en mémoire : le coffre du processus principal les
 * détient et les pose lui-même sur les requêtes sortantes. Le magasin ne garde
 * que `clesPresentes` — **qui** a une clé, jamais laquelle.
 *
 * ⚠️ **La course, elle, est identique.** `clesPresentes` se remplit depuis le
 * coffre au démarrage, donc de façon asynchrone, exactement comme les clés
 * avant lui. Une réhydratation qui l'écraserait viderait toutes les mentions
 * « configurée » quelques instants après l'ouverture — et inviterait à retaper
 * des clés qui sont déjà là, c'est-à-dire au geste qui a failli les perdre.
 *
 * *Le défaut n'a pas été supprimé, il a été déplacé d'un cran. Ces tests l'ont
 * suivi.*
 */

const etatCourant = () => ({
    activeProvider: 'gemini',
    configs: {
        gemini: { provider: 'gemini', modelId: 'gemini-1.5-flash' },
        openai: { provider: 'openai', modelId: 'gpt-4o' },
        anthropic: { provider: 'anthropic', modelId: 'claude' },
        ollama: { provider: 'ollama', modelId: 'phi3', endpoint: 'http://127.0.0.1:11434' },
        ollama_cloud: { provider: 'ollama_cloud', modelId: 'llama3', endpoint: 'https://x' },
        custom: { provider: 'custom', modelId: 'c', endpoint: 'https://y' },
    },
    image: { modelId: '@cf/black-forest-labs/flux-1-schnell', accountId: 'abc' },
    /* Ce que `syncWithKeychain` vient d'écrire, au démarrage. */
    clesPresentes: { gemini: true, openai: true, image: true },
    streamEnabled: true,
    liteContext: false,
} as unknown as Parameters<typeof fusionnerEtatIA>[1]);

/** Ce que `partialize` écrit réellement : tout, sauf ce qui vient du coffre. */
const etatEnregistre = {
    activeProvider: 'ollama',
    streamEnabled: false,
    liteContext: true,
    configs: {
        gemini: { provider: 'gemini', modelId: 'gemini-2.0-flash' },
        openai: { provider: 'openai', modelId: 'gpt-4o' },
    },
    image: { modelId: '@cf/black-forest-labs/flux-1-schnell', accountId: 'abc' },
};

describe('la réhydratation n\'efface pas ce que le coffre a dit', () => {
    it('garde les présences quand l\'état enregistré n\'en porte pas', () => {
        const fusionne = fusionnerEtatIA(etatEnregistre, etatCourant());

        expect(fusionne.clesPresentes.gemini, 'le défaut exact que David subissait').toBe(true);
        expect(fusionne.clesPresentes.openai).toBe(true);
        expect(fusionne.clesPresentes.image).toBe(true);
    });

    it('applique quand même ce que l\'état enregistré dit vraiment', () => {
        // La réhydratation doit continuer de faire son travail : seuls les
        // champs absents de l'enregistrement sont préservés.
        const fusionne = fusionnerEtatIA(etatEnregistre, etatCourant());

        expect(fusionne.configs.gemini.modelId, 'le modèle choisi est bien restauré').toBe('gemini-2.0-flash');
        expect(fusionne.activeProvider).toBe('ollama');
        expect(fusionne.streamEnabled).toBe(false);
        expect(fusionne.liteContext).toBe(true);
    });

    it('garde les fournisseurs absents de l\'enregistrement', () => {
        const fusionne = fusionnerEtatIA(etatEnregistre, etatCourant());

        expect(fusionne.configs.ollama.endpoint).toBe('http://127.0.0.1:11434');
        expect(fusionne.configs.custom.modelId).toBe('c');
    });

    it('l\'ordre devient indifférent — c\'est le vrai correctif', () => {
        /**
         * Une correction qui se contenterait de retarder la réhydratation
         * marcherait jusqu'au jour où la machine est lente. Ici, que le coffre
         * soit relu avant ou après, le résultat est le même.
         */
        const avantCoffre = fusionnerEtatIA(etatEnregistre, {
            ...etatCourant(),
            clesPresentes: {},
        } as Parameters<typeof fusionnerEtatIA>[1]);

        // Coffre pas encore lu : rien n'est inventé…
        expect(avantCoffre.clesPresentes.gemini).toBeUndefined();
        // …et une fois lu, la réponse survit.
        expect(fusionnerEtatIA(etatEnregistre, etatCourant()).clesPresentes.gemini).toBe(true);
    });

    /*
      ⚠️ Le cas qui rendrait le correctif inopérant sans qu'aucun test ne bouge :
      un état enregistré qui porterait un `clesPresentes` — d'une version qui
      l'aurait persisté par mégarde. Il ne doit PAS gagner contre le coffre, qui
      seul dit la vérité du moment.
    */
    it('ignore un `clesPresentes` venu du stockage', () => {
        const fusionne = fusionnerEtatIA(
            { ...etatEnregistre, clesPresentes: { gemini: false, openai: false } },
            etatCourant(),
        );

        expect(fusionne.clesPresentes.gemini, 'le coffre fait foi, pas le stockage').toBe(true);
        expect(fusionne.clesPresentes.openai).toBe(true);
    });

    it('un premier démarrage, sans rien d\'enregistré, ne casse pas', () => {
        expect(fusionnerEtatIA(undefined, etatCourant()).clesPresentes.gemini).toBe(true);
        expect(fusionnerEtatIA({}, etatCourant()).image.modelId).toBe('@cf/black-forest-labs/flux-1-schnell');
    });
});
