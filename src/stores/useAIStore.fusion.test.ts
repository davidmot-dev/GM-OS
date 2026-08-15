import { describe, it, expect } from 'vitest';
import { fusionnerEtatIA } from './useAIStore';

/**
 * Ce que ces tests protègent : **une clé chargée depuis le coffre survit à la
 * réhydratation**.
 *
 * **Le symptôme, rapporté par David le 2026-08-15** : *« mon trousseau perd
 * tout le temps les clés, je dois constamment les remettre. »*
 *
 * Le coffre ne perdait rien. `partialize` retire les clés de l'état enregistré —
 * c'est voulu, elles vivent dans le trousseau natif — et la fusion remplaçait
 * ensuite **chaque fournisseur en bloc** par cette version sans clé. Le
 * démarrage relisait le coffre, puis la réhydratation, asynchrone parce que le
 * stockage est IndexedDB, atterrissait par-dessus et effaçait tout.
 *
 * *Une clé qui disparaît sans erreur ressemble à un coffre qui oublie ; c'était
 * une fusion qui écrase.* Même mécanisme que la perte de campagnes du
 * 2026-08-07 : une fusion superficielle qui remplace des objets entiers.
 */

const etatCourant = () => ({
    activeProvider: 'gemini',
    configs: {
        gemini: { provider: 'gemini', modelId: 'gemini-1.5-flash', apiKey: 'CLE-GEMINI' },
        openai: { provider: 'openai', modelId: 'gpt-4o', apiKey: 'CLE-OPENAI' },
        anthropic: { provider: 'anthropic', modelId: 'claude', apiKey: undefined },
        ollama: { provider: 'ollama', modelId: 'phi3', endpoint: 'http://127.0.0.1:11434' },
        ollama_cloud: { provider: 'ollama_cloud', modelId: 'llama3', endpoint: 'https://x' },
        custom: { provider: 'custom', modelId: 'c', endpoint: 'https://y' },
    },
    image: { modelId: '@cf/black-forest-labs/flux-1-schnell', accountId: 'abc', apiKey: 'JETON-CF' },
    streamEnabled: true,
    liteContext: false,
} as unknown as Parameters<typeof fusionnerEtatIA>[1]);

/** Ce que `partialize` écrit réellement : tout, sauf les clés. */
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

describe('la réhydratation n\'efface pas les clés déjà chargées', () => {
    it('garde la clé en mémoire quand l\'état enregistré n\'en porte pas', () => {
        const fusionne = fusionnerEtatIA(etatEnregistre, etatCourant());

        expect(fusionne.configs.gemini.apiKey, 'le défaut exact que David subissait').toBe('CLE-GEMINI');
        expect(fusionne.configs.openai.apiKey).toBe('CLE-OPENAI');
        expect(fusionne.image.apiKey).toBe('JETON-CF');
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
            configs: { ...etatCourant().configs, gemini: { provider: 'gemini', modelId: 'gemini-1.5-flash' } },
        } as Parameters<typeof fusionnerEtatIA>[1]);

        // Sans clé en mémoire, rien n'est inventé…
        expect(avantCoffre.configs.gemini.apiKey).toBeUndefined();
        // …et avec, elle survit.
        expect(fusionnerEtatIA(etatEnregistre, etatCourant()).configs.gemini.apiKey).toBe('CLE-GEMINI');
    });

    it('un premier démarrage, sans rien d\'enregistré, ne casse pas', () => {
        expect(fusionnerEtatIA(undefined, etatCourant()).configs.gemini.apiKey).toBe('CLE-GEMINI');
        expect(fusionnerEtatIA({}, etatCourant()).image.modelId).toBe('@cf/black-forest-labs/flux-1-schnell');
    });
});
