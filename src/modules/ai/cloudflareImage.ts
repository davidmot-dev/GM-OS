import type { ConfigDImage } from '../../stores/useAIStore';

/**
 * L'appel à Cloudflare Workers AI, en un seul endroit.
 *
 * **Extrait de `AIService.generateImage` pour que le bouton « Tester » emprunte
 * exactement le même chemin.** Un test qui refait l'appel à sa façon ne teste
 * pas ce qui tourne en séance : il dirait « configuré » sur un réglage qui
 * échouerait au premier portrait, ou l'inverse. *Deux chemins vers le même
 * service finissent toujours par ne plus dire la même chose.*
 *
 * **Le proxy du process principal, et pas `fetch`.** Le jeton ne traverse
 * jamais le renderer, et il n'y a pas de question de CORS — c'était l'autre
 * défaut du recours HuggingFace, seul appel réseau partant directement de la
 * fenêtre.
 *
 * Lève avec le message que Cloudflare a rendu, jamais un « échec » générique :
 * un quota épuisé, un jeton sans la permission `Workers AI - Edit` et un
 * identifiant de compte erroné sont trois problèmes différents, et les
 * confondre ferait chercher au mauvais endroit.
 */
export async function genererViaCloudflare(prompt: string, config: ConfigDImage): Promise<string> {
    if (!config.accountId || !config.apiKey) {
        throw new Error('identifiant de compte ou jeton manquant');
    }

    const modele = config.modelId || '@cf/black-forest-labs/flux-1-schnell';
    const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/${modele}`;

    const proxy = window.appBridge?.ai?.proxyRequest;
    if (!proxy) throw new Error('pont réseau indisponible');

    const reponse = await proxy(
        url, 'POST',
        { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        // Quatre pas : le régime pour lequel schnell est entraîné, et le plafond
        // du modèle est de huit.
        { prompt, steps: 4 },
    );

    if (!reponse?.ok) {
        const erreurs = (reponse?.data as { errors?: { message?: string }[] })?.errors;
        const dit = erreurs?.map(e => e.message).filter(Boolean).join(' ; ');
        throw new Error(dit || reponse?.statusText || `réponse illisible (HTTP ${reponse?.status ?? '?'})`);
    }

    const base64 = (reponse.data as { result?: { image?: string } })?.result?.image;
    if (!base64) throw new Error('réponse sans image');
    return base64;
}

/**
 * Le base64 rendu par Cloudflare, en octets.
 *
 * `Uint8Array<ArrayBuffer>` et non `Uint8Array` tout court : le type large
 * autorise un `SharedArrayBuffer`, que `saveAvatar` n'accepte pas. Le dire ici
 * évite un `as` chez chaque appelant.
 */
export function octetsDeLImage(base64: string): Uint8Array<ArrayBuffer> {
    const binaire = atob(base64);
    const octets = new Uint8Array(new ArrayBuffer(binaire.length));
    for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
    return octets;
}
