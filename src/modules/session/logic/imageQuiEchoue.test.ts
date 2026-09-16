import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * ⛔ **Les générateurs d'image échouaient EN SILENCE.**
 *
 * Relevé le 2026-09-15, en branchant le quatrième sur les indices. Les trois
 * existants — portrait de PNJ, carte d'atlas, portrait de PJ — portaient chacun
 * leur `try / catch / finally`, et **chaque `catch` faisait `console.error` et
 * rien d'autre** — alors que `gmToast` est importé en tête du même fichier et
 * sert vingt lignes plus haut.
 *
 * Clé absente, service indisponible, image rejetée : le meneur cliquait, le
 * voile tournait, s'arrêtait, et **rien ne se passait**.
 *
 * *C'est la panne muette que ce dépôt a déjà payée sur la projection de fiche —
 * quatre mois cassée parce qu'un `catch` avalait l'exception.*
 */

const toasts: { message: string; type?: string }[] = [];

vi.mock('../../../stores/useToastStore', () => ({
    gmToast: (message: string, type?: string) => { toasts.push({ message, type }); },
}));

const generateImage = vi.fn();
vi.mock('../../ai/AIService', () => ({ aiService: { generateImage: (p: string) => generateImage(p) } }));

const {
    handleGenerateClueImage,
    handleGenerateEntityPortrait,
    handleGenerateAtlasMapImage,
} = await import('./crossDomainHelpers');

/** Un magasin de poche : juste ce que les quatre chemins lisent et écrivent. */
const faireLeMagasin = () => {
    const etat = {
        isGeneratingAIImage: false,
        clues: [{ id: 'c1', title: 'Une lettre froissée', content: 'Sceau brisé.', mediaUrl: '' }],
        entities: [{ id: 'e1', name: 'Kaelen', description: 'Un vieux soldat.' }],
        atlasMaps: [{ id: 'm1', name: 'Le port', narrativeDescription: 'Brumeux.' }],
        updateClue: vi.fn((_id: string, maj: Record<string, unknown>) => { Object.assign(etat.clues[0], maj); }),
        updateEntity: vi.fn(),
        updateAtlasMap: vi.fn(),
    };
    const set = (partiel: Record<string, unknown> | ((e: unknown) => Record<string, unknown>)) => {
        Object.assign(etat, typeof partiel === 'function' ? partiel(etat) : partiel);
    };
    return { etat, set: set as never, get: (() => etat) as never };
};

beforeEach(() => {
    toasts.length = 0;
    generateImage.mockReset();
});

describe('⛔ une génération qui échoue le DIT', () => {
    it.each([
        ['un indice', (m: ReturnType<typeof faireLeMagasin>) => handleGenerateClueImage(m.set, m.get, 'c1')],
        ['un PNJ', (m: ReturnType<typeof faireLeMagasin>) => handleGenerateEntityPortrait(m.set, m.get, 'e1')],
        ['une carte', (m: ReturnType<typeof faireLeMagasin>) => handleGenerateAtlasMapImage(m.set, m.get, 'm1')],
    ])('pour %s', async (_, lancer) => {
        generateImage.mockRejectedValue(new Error('Clé API Gemini manquante pour fallback.'));
        const magasin = faireLeMagasin();

        await lancer(magasin);

        expect(toasts, 'l’échec doit être annoncé').toHaveLength(1);
        expect(toasts[0].type).toBe('warning');
    });

    /**
     * ⚠️ *Un toast générique ne vaudrait guère mieux qu'un silence : il dirait
     * qu'on a échoué sans dire quoi réparer.* `generateImage` lève des messages
     * qui nomment la cause — ils remontent tels quels.
     */
    it('et il dit POURQUOI', async () => {
        generateImage.mockRejectedValue(new Error('Clé API Gemini manquante pour fallback.'));
        const magasin = faireLeMagasin();

        await handleGenerateClueImage(magasin.set, magasin.get, 'c1');

        expect(toasts[0].message).toContain('Clé API Gemini manquante');
    });

    it('et il dit DE QUOI il s’agissait', async () => {
        generateImage.mockRejectedValue(new Error('peu importe'));
        const magasin = faireLeMagasin();

        await handleGenerateClueImage(magasin.set, magasin.get, 'c1');

        expect(toasts[0].message).toContain('Une lettre froissée');
    });

    /** Le voile ne doit jamais rester posé — c'est ce que le `finally` garantit. */
    it('et le voile se lève quand même', async () => {
        generateImage.mockRejectedValue(new Error('bouh'));
        const magasin = faireLeMagasin();

        await handleGenerateClueImage(magasin.set, magasin.get, 'c1');

        expect(magasin.etat.isGeneratingAIImage).toBe(false);
    });

    it('ne pose aucun média quand ça a échoué', async () => {
        generateImage.mockRejectedValue(new Error('bouh'));
        const magasin = faireLeMagasin();

        await handleGenerateClueImage(magasin.set, magasin.get, 'c1');

        expect(magasin.etat.updateClue).not.toHaveBeenCalled();
    });
});

describe('⭐ l’image d’un indice, quand ça marche', () => {
    it('se pose sur l’indice', async () => {
        generateImage.mockResolvedValue('m-abcdef');
        const magasin = faireLeMagasin();

        await handleGenerateClueImage(magasin.set, magasin.get, 'c1');

        expect(magasin.etat.updateClue).toHaveBeenCalledWith('c1', { mediaUrl: 'm-abcdef' });
        expect(toasts, 'un succès ne se commente pas').toEqual([]);
    });

    /** ⭐ Le registre : une pièce à conviction, pas une illustration. */
    it('demande une PIÈCE À CONVICTION, pas un portrait', async () => {
        generateImage.mockResolvedValue('m-1');
        const magasin = faireLeMagasin();

        await handleGenerateClueImage(magasin.set, magasin.get, 'c1');

        const invite = generateImage.mock.calls[0][0] as string;
        expect(invite).toContain('Evidence photograph');
        expect(invite).toContain('Une lettre froissée');
        expect(invite).not.toContain('character portrait');
    });

    it('honore les instructions du meneur', async () => {
        generateImage.mockResolvedValue('m-1');
        const magasin = faireLeMagasin();

        await handleGenerateClueImage(magasin.set, magasin.get, 'c1', 'A rusted key');

        expect(generateImage.mock.calls[0][0]).toBe('A rusted key');
    });

    it('ne fait rien sur un indice qui n’existe pas', async () => {
        const magasin = faireLeMagasin();

        await handleGenerateClueImage(magasin.set, magasin.get, 'fantome');

        expect(generateImage).not.toHaveBeenCalled();
        expect(magasin.etat.isGeneratingAIImage, 'le voile ne doit pas être posé').toBe(false);
    });
});
