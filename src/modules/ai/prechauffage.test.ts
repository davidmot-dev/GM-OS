import { describe, it, expect } from 'vitest';
import { modeleAPrechauffer, RENOUVELLEMENT_MS, PAS_AVANT_MS } from './prechauffage';
import type { AIModelConfig, AIProvider } from './types';

/**
 * Ce que ces tests protègent : **on ne préchauffe que ce qu'on héberge, et
 * assez souvent pour que ça serve.**
 *
 * Mesuré le 2026-08-31 sur l'iGPU Arc 140T : le chargement du modèle coûte 13 à
 * 20 s, payés par la première question de la soirée (~62 s, contre ~50 s ensuite).
 * *C'est tout ce que le préchauffage retire* — voir les § 11 à 13 de
 * `2026-08-07-acceleration-ia.md`.
 */

const configs: Partial<Record<AIProvider, AIModelConfig>> = {
    ollama: { provider: 'ollama', modelId: 'gemma4:12b', endpoint: 'http://127.0.0.1:11434' },
    ollama_cloud: { provider: 'ollama_cloud', modelId: 'llama3', endpoint: 'https://ailleurs' },
    gemini: { provider: 'gemini', modelId: 'gemini-1.5-flash' },
};

describe('qui mérite un préchauffage', () => {
    it('charge le modèle local, avec son adresse', () => {
        expect(modeleAPrechauffer('ollama', configs)).toEqual({
            model: 'gemma4:12b',
            endpoint: 'http://127.0.0.1:11434',
        });
    });

    /**
     * **Le cas qui justifie ce module à lui seul.** Le coût qu'on évite est la
     * montée d'un modèle sur *cet* iGPU ; une instance distante a son propre
     * cycle, et lui envoyer une requête à chaque ouverture de séance serait
     * agir sur une machine qui ne nous a rien demandé.
     */
    it('laisse tranquille l’instance distante', () => {
        expect(modeleAPrechauffer('ollama_cloud', configs)).toBeNull();
    });

    it('ne fait rien pour un fournisseur qui n’a pas de modèle à charger', () => {
        expect(modeleAPrechauffer('gemini', configs)).toBeNull();
    });

    /** Un fournisseur sélectionné mais jamais configuré ne dit pas quoi charger. */
    it('se tait quand le modèle n’est pas nommé', () => {
        expect(modeleAPrechauffer('ollama', {})).toBeNull();
        expect(modeleAPrechauffer('ollama', { ollama: { provider: 'ollama', modelId: '' } })).toBeNull();
    });
});

describe('les deux cadences', () => {
    /**
     * **Le renouvellement doit passer sous `DUREE_DE_CHARGE`**, trente minutes
     * dans `electron/OllamaService.ts`. Au-dessus, le modèle se déchargerait
     * entre deux préchauffages et la séance repaierait la montée en son milieu
     * — *un filet qui ne tient que pendant qu'on le regarde.*
     *
     * La marge n'est pas cosmétique : elle laisse un préchauffage raté être
     * repris avant l'expiration.
     */
    it('renouvelle avant que le modèle ne se décharge, avec de la marge', () => {
        const dureeDeCharge = 30 * 60 * 1000;
        expect(RENOUVELLEMENT_MS).toBeLessThan(dureeDeCharge);
        expect(dureeDeCharge - RENOUVELLEMENT_MS).toBeGreaterThanOrEqual(5 * 60 * 1000);
    });

    /**
     * Le garde de `StrictMode`, qui monte chaque effet deux fois : sans lui,
     * ouvrir une séance enverrait deux chargements dont un pour rien.
     */
    it('refuse deux préchauffages rapprochés, sans gêner le renouvellement', () => {
        expect(PAS_AVANT_MS).toBeGreaterThan(0);
        expect(PAS_AVANT_MS).toBeLessThan(RENOUVELLEMENT_MS);
    });
});
