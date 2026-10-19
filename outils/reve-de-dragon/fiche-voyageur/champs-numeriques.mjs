// Retouche Studio du 19/10/2026 : mêmes clés et coordonnées, largeur seule ajustable.
export const PREFIXE_RDD = '.sheet[data-template="reve-de-dragon-voyageur-fr"]';
export const CSS_NUMERIQUE_RDD = `${PREFIXE_RDD} .rdd-number{-moz-appearance:textfield;appearance:textfield;padding:0;font-variant-numeric:tabular-nums lining-nums;text-align:center}${PREFIXE_RDD} .rdd-number::-webkit-inner-spin-button,${PREFIXE_RDD} .rdd-number::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}`;
export const AIDE_NUMERIQUE_RDD = 'Les valeurs numériques se règlent en tapant, avec les touches ↑ / ↓, ou à la molette quand le champ a le focus.';

export function nombreDeChiffres(champ) {
    return /experience|Experience|^resources\.|^equipment\.money\.|[Ee]ncumbrance/.test(champ.key) ? 3 : 2;
}

export function corrigerChampsNumeriques(gabarit) {
    if (gabarit.id !== 'reve-de-dragon-voyageur-fr') throw Error('Cette retouche concerne uniquement le Livret du voyageur RdD.');
    if (!gabarit.customCss.includes(CSS_NUMERIQUE_RDD)) gabarit.customCss += CSS_NUMERIQUE_RDD;
    const elargis = [];
    for (const [index, page] of gabarit.pages.entries()) for (const champ of page.fields) {
        if (champ.type !== 'number') continue;
        // Mesuré sous Chromium avec Georgia 9 px, chiffres alignés : 88 = 10,14 ; 888 = 15,21.
        // La classe des nombres astraux conserve ses 6 px ; ses deux chiffres tiennent déjà.
        const minimum = champ.className?.split(/\s+/).includes('rdd-astral') ? champ.w : nombreDeChiffres(champ) === 3 ? 16 : 11;
        if (champ.w < minimum) {
            elargis.push({ key: champ.key, page: index + 1, avant: champ.w, apres: minimum });
            champ.w = minimum;
        }
    }
    return elargis;
}
