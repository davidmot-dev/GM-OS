const STORAGE_KEY = 'gmos-pairing-token';

/**
 * Secret d'appairage côté client.
 *
 * Le poste MJ l'encode dans le QR code de la télécommande, sous forme de fragment
 * (`#token=…`) et non de query string : un fragment n'est jamais transmis au
 * serveur dans la requête HTTP, donc il ne finit ni dans les logs d'accès ni dans
 * un en-tête `Referer`.
 *
 * Une fois lu, il est rangé en localStorage et retiré de la barre d'adresse, pour
 * que l'appareil reste appairé d'une partie à l'autre sans réafficher le secret.
 */
export function capturePairingTokenFromUrl(): void {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    if (!hash || !hash.includes('token=')) return;

    try {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const token = params.get('token');
        if (token) {
            window.localStorage.setItem(STORAGE_KEY, token);

            // On retire le secret de l'URL : historique, partage d'écran, capture.
            params.delete('token');
            const rest = params.toString();
            window.history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search + (rest ? `#${rest}` : '')
            );
        }
    } catch (err) {
        console.warn('[Pairing] Lecture du token depuis l\'URL impossible:', err);
    }
}

export function getPairingToken(): string {
    if (typeof window === 'undefined') return '';
    try {
        return window.localStorage.getItem(STORAGE_KEY) || '';
    } catch {
        // Navigation privée ou stockage bloqué.
        return '';
    }
}

export function clearPairingToken(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* rien à faire */
    }
}
