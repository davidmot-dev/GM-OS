/**
 * Les imports de police du jeu sont résolus sur le PC en @font-face incorporés.
 * Les tablettes ne demandent ainsi aucune ressource hors du réseau local.
 */
const memoire = new Map<string, string>();

export async function policesPourTablettes(imports: string[]): Promise<string> {
    const feuilles = await Promise.all(imports.map(async adresse => {
        try {
            const url = new URL(adresse);
            if (url.protocol !== 'https:' || url.hostname !== 'fonts.googleapis.com') return '';
            const dejaChargee = memoire.get(url.href);
            if (dejaChargee) return dejaChargee;
            const reponse = await fetch(url.href, { signal: AbortSignal.timeout(4000) });
            if (!reponse.ok) return '';
            const css = await reponse.text();
            // L'import n'est jamais envoyé tel quel : seules ses déclarations de police servent.
            const blocs = [...css.matchAll(/@font-face\s*\{[^}]*\}/g)].map(m => m[0]);
            const fontes = await Promise.all(blocs.map(async bloc => {
                const sources = [...bloc.matchAll(/url\((['"]?)(https:\/\/[^)'"\s]+)\1\)/g)];
                let resultat = bloc;
                for (const source of sources) {
                    const sourceUrl = new URL(source[2]);
                    if (sourceUrl.hostname !== 'fonts.gstatic.com') return '';
                    const fichier = await fetch(sourceUrl.href, { signal: AbortSignal.timeout(4000) });
                    if (!fichier.ok) return '';
                    const octets = new Uint8Array(await fichier.arrayBuffer());
                    if (octets.byteLength > 300_000) return '';
                    let binaire = '';
                    for (let i = 0; i < octets.length; i += 0x8000) {
                        binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
                    }
                    const mime = sourceUrl.pathname.endsWith('.woff2') ? 'font/woff2' : 'font/woff';
                    resultat = resultat.replace(source[2], `data:${mime};base64,${btoa(binaire)}`);
                }
                return resultat;
            }));
            const feuille = fontes.join('\n');
            if (feuille) memoire.set(url.href, feuille);
            return feuille;
        } catch (erreur) {
            console.warn('[T1] Police impossible à incorporer pour les tablettes :', erreur);
            return '';
        }
    }));
    return feuilles.join('\n');
}
