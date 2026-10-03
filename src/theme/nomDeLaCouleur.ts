/**
 * **Nommer une couleur d'accent** — refonte, L6, maquette retenue des
 * Paramètres : *« la couleur d'accent en pastilles nommées »*. Les palettes des
 * thèmes de base sont des listes d'hexadécimaux ; on les nomme d'après leur
 * teinte, plutôt que d'écrire un nom à la main à côté de chacune — un nom
 * recopié ment le jour où la couleur change.
 */
export function nomDeLaCouleur(hex: string): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    const [r, v, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => c / 255);
    const max = Math.max(r, v, b), min = Math.min(r, v, b);
    const clarte = (max + min) / 2;
    const ecart = max - min;
    const saturation = ecart === 0 ? 0 : ecart / (1 - Math.abs(2 * clarte - 1));

    if (saturation < 0.25) return clarte > 0.6 ? 'Gris clair' : 'Ardoise';

    let teinte = 0;
    if (max === r) teinte = ((v - b) / ecart) % 6;
    else if (max === v) teinte = (b - r) / ecart + 2;
    else teinte = (r - v) / ecart + 4;
    teinte = (teinte * 60 + 360) % 360;

    const sombre = clarte < 0.3;
    if (teinte < 12 || teinte >= 345) return sombre ? 'Bordeaux' : 'Rouge';
    if (teinte < 35) return sombre ? 'Brun' : 'Orange';
    if (teinte < 52) return sombre ? 'Bronze' : clarte < 0.45 ? 'Or ancien' : 'Ambre';
    if (teinte < 70) return 'Or';
    if (teinte < 150) return sombre ? 'Vert forêt' : 'Vert';
    if (teinte < 180) return 'Sarcelle';
    if (teinte < 200) return 'Cyan';
    if (teinte < 225) return sombre ? 'Bleu nuit' : 'Bleu';
    if (teinte < 250) return 'Indigo';
    if (teinte < 290) return 'Violet';
    if (teinte < 335) return 'Rose';
    return 'Framboise';
}
