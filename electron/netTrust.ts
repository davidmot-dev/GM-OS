/**
 * Décide si un hôte a le droit de présenter un certificat TLS invalide.
 *
 * Le matériel du réseau local — pont Philips Hue, serveur d'inférence maison —
 * s'expose en HTTPS avec un certificat auto-signé : le refuser casserait des
 * fonctions légitimes. Un hôte joignable sur Internet, lui, n'a aucune excuse,
 * et c'est vers lui que partent les clés d'API.
 *
 * D'où la règle : tolérance sur les adresses privées, validation stricte partout
 * ailleurs.
 */

/** Découpe une IPv4 en octets, ou null si ce n'en est pas une. */
function parseIPv4(host: string): number[] | null {
    const parts = host.split('.');
    if (parts.length !== 4) return null;

    const octets: number[] = [];
    for (const part of parts) {
        // "01" ou "1e2" ne sont pas des octets valides : on exige des chiffres
        // seuls, sinon "192.168.0.21.evil.com" pourrait passer par une variante.
        if (!/^\d{1,3}$/.test(part)) return null;
        const value = Number(part);
        if (value > 255) return null;
        octets.push(value);
    }
    return octets;
}

export function isPrivateHost(hostname: string): boolean {
    if (!hostname) return false;

    const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

    if (host === 'localhost' || host.endsWith('.localhost')) return true;
    // Noms du réseau local (mDNS / résolution domestique).
    if (host.endsWith('.local') || host.endsWith('.home.arpa')) return true;

    const v4 = parseIPv4(host);
    if (v4) {
        const [a, b] = v4;
        if (a === 127) return true;                       // boucle locale
        if (a === 10) return true;                        // 10.0.0.0/8
        if (a === 192 && b === 168) return true;          // 192.168.0.0/16
        if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
        if (a === 169 && b === 254) return true;          // lien-local
        return false;
    }

    if (host.includes(':')) {
        if (host === '::1') return true;                  // boucle locale IPv6
        // IPv4 encapsulée : ::ffff:192.168.0.21
        const mapped = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
        if (mapped) return isPrivateHost(mapped[1]);
        if (/^f[cd][0-9a-f]{2}:/.test(host)) return true; // fc00::/7, adresses uniques locales
        if (/^fe[89ab][0-9a-f]:/.test(host)) return true; // fe80::/10, lien-local
        return false;
    }

    return false;
}

/**
 * Valeur à passer à `rejectUnauthorized` pour une URL donnée.
 * Un hôte public doit toujours présenter un certificat valide.
 */
export function shouldRejectUnauthorized(url: URL): boolean {
    return !isPrivateHost(url.hostname);
}
