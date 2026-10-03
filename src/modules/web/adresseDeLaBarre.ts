/**
 * **Ce qu'on tape dans la barre devient une adresse** — refonte, L6
 * (2026-10-03), la page intégrée du navigateur.
 *
 * « srd.exemple.org » s'entend « https://srd.exemple.org/ » : personne ne tape
 * le protocole. Ce qui n'est pas du web (`file:`, `javascript:`…) ne devient
 * **rien** — la vue le refuserait de toute façon (`electron/navigateurIntegre.ts`),
 * mais on ne le lui envoie pas.
 *
 * L'adresse rendue est **normalisée** (`URL.href`), comme celle que la page
 * rapporte : c'est ce qui permet de reconnaître la tuile du lien affiché.
 */
export function adresseDeLaBarre(texte: string): string | null {
    const brut = texte.trim();
    if (!brut || /\s/.test(brut)) return null;
    const avecProtocole = /^[a-z][a-z0-9+.-]*:/i.test(brut) ? brut : `https://${brut}`;
    try {
        const url = new URL(avecProtocole);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        if (!url.hostname) return null;
        return url.href;
    } catch {
        return null;
    }
}
