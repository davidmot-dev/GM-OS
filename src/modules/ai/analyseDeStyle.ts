import { useAIStore, type ConfigDImage } from '../../stores/useAIStore';
import { mosaique } from './imagesDeReference';

/**
 * **Proposer une identité visuelle depuis des images d'exemple** — 2026-10-17.
 *
 * Un modèle de vision de Cloudflare Workers AI lit les exemples (assemblés en
 * une mosaïque : il ne prend qu'une image par appel) et rédige le style, en
 * anglais, et ce qu'il faut éviter. **Le meneur relit avant d'enregistrer** :
 * c'est une proposition, pas une décision.
 *
 * Llama 3.2 Vision : le moins cher des modèles de vision du catalogue (de
 * l'ordre de quelques dizaines de Neurons par analyse). Cloudflare demande
 * d'accepter **une fois** la licence de Meta ; on ne l'accepte jamais à la
 * place du meneur — l'écran lui propose le bouton, et lui seul clique.
 */
export const MODELE_DE_VISION = '@cf/meta/llama-3.2-11b-vision-instruct';

export const CONSIGNE_D_ANALYSE = [
    'You write style guides for an image generator (FLUX).',
    'The image shows one or several reference pictures side by side; they share a visual identity.',
    'Describe ONLY that shared style: medium, palette, lighting, texture, line work, era, mood. Never describe the subjects.',
    'Answer with JSON only: {"style": "...", "avoid": "..."}.',
    '"style": one paragraph, at most 60 words, comma-separated phrases a generator understands.',
    '"avoid": at most 15 words, what would break this style.',
].join(' ');

export interface PropositionDIdentite {
    style: string;
    aEviter: string;
}

/** La licence de Meta n'est pas encore acceptée sur ce compte. */
export class ErreurDeLicence extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ErreurDeLicence';
    }
}

/**
 * Lit la réponse du modèle. Il rend en principe du JSON ; s'il bavarde autour,
 * on prend le premier objet ; s'il n'en rend aucun, tout le texte devient le
 * style — *une proposition imparfaite se corrige, une proposition perdue non.*
 */
export function lireLaProposition(texte: string): PropositionDIdentite {
    const net = (t: unknown) => String(t ?? '').replace(/\s+/g, ' ').trim();
    const objet = texte.match(/\{[\s\S]*\}/);
    if (objet) {
        try {
            const lu = JSON.parse(objet[0]) as { style?: unknown; avoid?: unknown };
            if (net(lu.style)) return { style: net(lu.style), aEviter: net(lu.avoid) };
        } catch { /* on retombe sur le texte entier */ }
    }
    return { style: net(texte), aEviter: '' };
}

/**
 * **L'acceptation répond par un code d'échec** — vu par David le 2026-10-17 :
 * « AiError: Model Agreement: Thank you for agreeing to this model's terms. You
 * may now use the model. » C'est un remerciement, pas un refus : il se lit
 * avant tout le reste.
 */
export const confirmeLAccord = (message: string) => /thank you for agreeing|may now use the model/i.test(message);

/** Une réponse d'échec qui parle de licence ou d'accord : c'est la licence de Meta. */
export const parleDeLicence = (message: string) => !confirmeLAccord(message) && /agree|licen[cs]e/i.test(message);

async function appeler(config: ConfigDImage, corps: unknown): Promise<unknown> {
    if (!config.accountId) throw new Error('identifiant de compte manquant');
    if (!useAIStore.getState().aUneCle('image')) throw new Error('jeton manquant');
    const proxy = window.appBridge?.ai?.proxyRequest;
    if (!proxy) throw new Error('pont réseau indisponible');
    const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/${MODELE_DE_VISION}`;
    const reponse = await proxy(url, 'POST', { 'Content-Type': 'application/json' }, corps, 'image-cloudflare');
    if (!reponse?.ok) {
        const erreurs = (reponse?.data as { errors?: { message?: string }[] })?.errors;
        const dit = erreurs?.map(e => e.message).filter(Boolean).join(' ; ') || reponse?.statusText || `réponse illisible (HTTP ${reponse?.status ?? '?'})`;
        if (confirmeLAccord(dit)) return reponse?.data ?? null;
        if (parleDeLicence(dit)) throw new ErreurDeLicence(dit);
        throw new Error(dit);
    }
    return reponse.data;
}

export async function proposerUneIdentite(references: readonly string[], config: ConfigDImage): Promise<PropositionDIdentite> {
    if (references.length === 0) throw new Error('aucune image d’exemple');
    const image = await mosaique(references);
    const donnees = await appeler(config, {
        messages: [
            { role: 'system', content: CONSIGNE_D_ANALYSE },
            { role: 'user', content: 'Write the style guide for these reference images.' },
        ],
        image,
        max_tokens: 400,
    });
    const texte = (donnees as { result?: { response?: string } })?.result?.response ?? '';
    if (!texte.trim()) throw new Error('réponse vide du modèle de vision');
    return lireLaProposition(texte);
}

/** Le geste du meneur, et de lui seul : accepter la licence de Meta pour ce modèle. */
export async function accepterLaLicenceMeta(config: ConfigDImage): Promise<void> {
    await appeler(config, { prompt: 'agree' });
}
