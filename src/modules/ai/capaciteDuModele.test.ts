import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leModeleActifVoit } from './capaciteDuModele';
import { useAIStore } from '../../stores/useAIStore';

/**
 * **Trois réponses, pas deux.**
 *
 * ⛔ Un modèle sans vision reçoit l'image, l'**ignore**, et répond quand même :
 * on obtient une table inventée de bout en bout, plausible et fausse — et la
 * bande de couverture serait verte. *Le mode d'échec le plus cher de ce dépôt
 * est celui qui ne dit rien.*
 *
 * ⚠️ Mais « on ne sait pas » n'est pas « non » : un Ollama plus ancien ne
 * déclare aucune capacité, et refuser alors le geste le refuserait à quelqu'un
 * dont le modèle voit très bien. *Une garde qui refuse ce qui marche finit par
 * être contournée.*
 */

const poser = (activeProvider: string, modelId?: string) => {
    useAIStore.setState({
        activeProvider,
        configs: { [activeProvider]: { modelId, endpoint: 'http://localhost:11434' } },
    } as never);
};

beforeEach(() => vi.clearAllMocks());

describe('leModeleActifVoit — Ollama', () => {
    it('dit oui quand le modèle déclare « vision »', async () => {
        poser('ollama', 'gemma4:12b');
        const verdict = await leModeleActifVoit(
            async () => ['completion', 'vision', 'tools', 'thinking']);

        expect(verdict).toMatchObject({ voit: true, certain: true, modele: 'gemma4:12b' });
    });

    /** ⛔ Le cas qui justifie tout le module. */
    it('dit NON, et explique, quand le modèle ne voit pas', async () => {
        poser('ollama', 'phi3:latest');
        const verdict = await leModeleActifVoit(async () => ['completion']);

        expect(verdict.voit).toBe(false);
        expect(verdict.certain).toBe(true);
        expect(verdict.motif).toContain('phi3:latest');
        expect(verdict.motif).toContain('vision');
    });

    /** ⚠️ Un Ollama qui ne déclare rien : on prévient, on n'interdit pas. */
    it('ne bloque pas quand Ollama ne dit rien, mais le signale', async () => {
        poser('ollama', 'un-modele-ancien');
        const verdict = await leModeleActifVoit(async () => null);

        expect(verdict.voit).toBe(true);
        expect(verdict.certain).toBe(false);
        expect(verdict.motif).toContain('inventée');
    });

    it('ne bloque pas non plus quand aucun modèle n’est choisi', async () => {
        poser('ollama', undefined);
        const verdict = await leModeleActifVoit(async () => ['vision']);

        expect(verdict).toMatchObject({ voit: true, certain: false });
    });

    it('passe l’adresse du serveur au lecteur', async () => {
        poser('ollama', 'gemma4:12b');
        const lecteur = vi.fn().mockResolvedValue(['vision']);
        await leModeleActifVoit(lecteur);

        expect(lecteur).toHaveBeenCalledWith('gemma4:12b', 'http://localhost:11434');
    });

    it('vaut aussi pour Ollama Cloud', async () => {
        poser('ollama_cloud', 'gemma4:26b');
        expect(await leModeleActifVoit(async () => ['vision'])).toMatchObject({ voit: true });
    });
});

describe('leModeleActifVoit — les autres fournisseurs', () => {
    /** Gemini est la branche historique : elle compose les images elle-même. */
    it('dit oui pour Gemini sans rien demander', async () => {
        poser('gemini', 'gemini-1.5-flash');
        const lecteur = vi.fn();
        const verdict = await leModeleActifVoit(lecteur);

        expect(verdict).toMatchObject({ voit: true, certain: true });
        expect(lecteur, 'on n’interroge pas une API distante pour ça').not.toHaveBeenCalled();
    });

    /**
     * ⛔ **Ce n'est pas une question de modèle, mais de code.** Un Claude
     * parfaitement capable de voir ne verra rien tant que sa branche
     * d'`AIService` ne met pas d'image dans sa requête — c'est exactement le
     * défaut qu'on vient de corriger pour Ollama.
     */
    it.each(['anthropic', 'custom'])('dit non pour %s, et nomme le remède', async (fournisseur) => {
        poser(fournisseur, 'peu-importe');
        const verdict = await leModeleActifVoit(async () => ['vision']);

        expect(verdict.voit).toBe(false);
        expect(verdict.certain).toBe(true);
        expect(verdict.motif).toContain(fournisseur);
        expect(verdict.motif).toContain('Ollama');
    });
});
