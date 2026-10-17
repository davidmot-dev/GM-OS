import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { estUnFlux2, requeteFlux2 } from './cloudflareImage';
import { lireLaProposition, parleDeLicence } from './analyseDeStyle';
import { dimensionsReduites, grilleDeLaMosaique } from './imagesDeReference';
import { identiteEnVigueur } from './identiteVisuelle';

/**
 * **L'identité visuelle par les images d'exemple** — 2026-10-17 : la requête des
 * FLUX.2, l'analyse par le modèle de vision, la réduction des images.
 */
const IMG_A = 'data:image/jpeg;base64,QUFB';
const IMG_B = 'data:image/png;base64,QkJC';

describe('la requête d’un FLUX.2', () => {
    it('reconnaît les FLUX.2, et pas schnell', () => {
        expect(estUnFlux2('@cf/black-forest-labs/flux-2-klein-4b')).toBe(true);
        expect(estUnFlux2('@cf/black-forest-labs/flux-2-dev')).toBe(true);
        expect(estUnFlux2('@cf/black-forest-labs/flux-1-schnell')).toBe(false);
    });

    it('les images partent en input_image_0…, et l’invite dit de n’en prendre que le style', () => {
        const r = requeteFlux2('A portrait.', '@cf/black-forest-labs/flux-2-klein-4b', [IMG_A, IMG_B]);
        expect(r.multipart.champs).toEqual({
            prompt: 'A portrait. Use reference images 0 to 1 only as a style guide: copy their palette, medium, texture and lighting, never their subjects or composition.',
            width: '768', height: '768',
        });
        expect(r.multipart.fichiers).toEqual([
            { nom: 'input_image_0', type: 'image/jpeg', base64: 'QUFB' },
            { nom: 'input_image_1', type: 'image/png', base64: 'QkJC' },
        ]);
    });

    it('sans image, l’invite reste seule ; le dev règle ses pas ; le 16:9 s’élargit', () => {
        const r = requeteFlux2('A map.', '@cf/black-forest-labs/flux-2-dev', [], '16:9');
        expect(r.multipart.champs).toEqual({ prompt: 'A map.', width: '1024', height: '576', steps: '20' });
        expect(r.multipart.fichiers).toEqual([]);
    });

    it('quatre images au plus, et jamais autre chose qu’une image', () => {
        const r = requeteFlux2('x', '@cf/black-forest-labs/flux-2-dev', [IMG_A, 'https://ailleurs/x.png', IMG_A, IMG_A, IMG_A, IMG_A]);
        expect(r.multipart.fichiers).toHaveLength(4);
    });
});

describe('la proposition du modèle de vision', () => {
    it('lit le JSON, même entouré de bavardage', () => {
        expect(lireLaProposition('Here you go: {"style": "ink wash,  muted ochre", "avoid": "neon"} Enjoy'))
            .toEqual({ style: 'ink wash, muted ochre', aEviter: 'neon' });
    });

    it('sans JSON, tout le texte devient le style', () => {
        expect(lireLaProposition('gritty charcoal sketch, sepia')).toEqual({ style: 'gritty charcoal sketch, sepia', aEviter: '' });
    });

    it('reconnaît la demande de licence de Meta', () => {
        expect(parleDeLicence('To use this model, you must submit the prompt "agree"')).toBe(true);
        expect(parleDeLicence('Authentication error')).toBe(false);
    });
});

describe('la réduction des images', () => {
    it('le plus grand côté à 512, jamais agrandi', () => {
        expect(dimensionsReduites(2048, 1024)).toEqual([512, 256]);
        expect(dimensionsReduites(300, 200)).toEqual([300, 200]);
    });

    it('la mosaïque : deux côte à côte, trois ou quatre en carré', () => {
        expect(grilleDeLaMosaique(2)).toEqual({ colonnes: 2, lignes: 1 });
        expect(grilleDeLaMosaique(4)).toEqual({ colonnes: 2, lignes: 2 });
    });
});

describe('les images d’exemple dans l’identité en vigueur', () => {
    const JEU = { identiteVisuelle: { style: 'neo-noir', references: [IMG_A] } };

    it('celles du jeu, quand la campagne n’en a pas', () => {
        expect(identiteEnVigueur(JEU, { identiteVisuelle: { style: 'LA 2019' } })?.references).toEqual([IMG_A]);
    });

    it('celles de la campagne, si elle en a', () => {
        expect(identiteEnVigueur(JEU, { identiteVisuelle: { style: 'LA 2019', references: [IMG_B] } })?.references).toEqual([IMG_B]);
    });

    it('une campagne qui remplace n’hérite pas des images du jeu', () => {
        expect(identiteEnVigueur(JEU, { identiteVisuelle: { style: 'watercolour', mode: 'remplace' } })?.references).toBeUndefined();
    });

    it('des images seules suffisent à faire une identité', () => {
        expect(identiteEnVigueur({ identiteVisuelle: { style: '', references: [IMG_A] } }, null)).toEqual({ style: '', aEviter: undefined, references: [IMG_A] });
    });
});

describe('l’analyse, de bout en bout par le relais', () => {
    vi.mock('../session/logic/idbStorage', () => ({
        idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
        onPersistedStateChanged: () => () => {},
    }));
    const appels: { url: string; corps: Record<string, unknown> }[] = [];
    let reponse: unknown;
    beforeEach(async () => {
        appels.length = 0;
        const { useAIStore } = await import('../../stores/useAIStore');
        useAIStore.setState({ aUneCle: () => true } as never);
        (window as unknown as { appBridge: unknown }).appBridge = {
            ai: { proxyRequest: async (url: string, _m: string, _h: unknown, corps: Record<string, unknown>) => { appels.push({ url, corps }); return reponse; } },
        };
    });
    afterEach(() => { delete (window as unknown as { appBridge?: unknown }).appBridge; });

    it('une image : envoyée telle quelle à Llama 3.2 Vision, la proposition revient', async () => {
        const { proposerUneIdentite } = await import('./analyseDeStyle');
        reponse = { ok: true, data: { result: { response: '{"style": "ink wash", "avoid": "neon"}' } } };
        await expect(proposerUneIdentite([IMG_A], { accountId: 'compte', modelId: '' })).resolves.toEqual({ style: 'ink wash', aEviter: 'neon' });
        expect(appels[0].url).toBe('https://api.cloudflare.com/client/v4/accounts/compte/ai/run/@cf/meta/llama-3.2-11b-vision-instruct');
        expect(appels[0].corps.image).toBe(IMG_A);
    });

    it('le remerciement de Cloudflare après l’acceptation n’est pas un échec (2026-10-17)', async () => {
        const { accepterLaLicenceMeta, parleDeLicence } = await import('./analyseDeStyle');
        const merci = "AiError: Model Agreement: Thank you for agreeing to this model's terms. You may now use the model.";
        expect(parleDeLicence(merci)).toBe(false);
        reponse = { ok: false, status: 403, data: { errors: [{ message: merci }] } };
        await expect(accepterLaLicenceMeta({ accountId: 'compte', modelId: '' })).resolves.toBeUndefined();
        expect(appels[0].corps).toEqual({ prompt: 'agree' });
    });

    it('la licence de Meta non acceptée : une erreur à part, que l’écran sait proposer', async () => {
        const { proposerUneIdentite, ErreurDeLicence } = await import('./analyseDeStyle');
        reponse = { ok: false, status: 403, data: { errors: [{ message: 'Please submit the prompt "agree" to accept the license' }] } };
        await expect(proposerUneIdentite([IMG_A], { accountId: 'compte', modelId: '' })).rejects.toBeInstanceOf(ErreurDeLicence);
    });
});
